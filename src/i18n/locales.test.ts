import { describe, expect, it } from 'vitest'
import i18n, { SUPPORTED_LANGUAGES } from '.'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import itLocale from './locales/it.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

type Tree = { [key: string]: string | Tree }

const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return typeof v === 'string' ? { ...acc, [key]: v } : { ...acc, ...flatten(v, key) }
  }, {})

const placeholders = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort()

const locales: Record<string, Tree> = { en, es, it: itLocale, de, ru, zh }
const reference = flatten(en)

describe('locales', () => {
  it('registers every supported language', () => {
    expect(Object.keys(locales).sort()).toEqual(SUPPORTED_LANGUAGES.map((l) => l.code).sort())
  })

  it.each(Object.keys(locales).filter((l) => l !== 'en'))('%s has exactly the English keys', (lng) => {
    expect(Object.keys(flatten(locales[lng])).sort()).toEqual(Object.keys(reference).sort())
  })

  it.each(Object.keys(locales))('%s keeps the interpolation placeholders and has no empty strings', (lng) => {
    const flat = flatten(locales[lng])
    for (const [key, value] of Object.entries(reference)) {
      expect(flat[key]?.trim(), `${lng}:${key}`).toBeTruthy()
      expect(placeholders(flat[key] ?? ''), `${lng}:${key}`).toEqual(placeholders(value))
    }
  })

  it('switches language at runtime and falls back to English for unknown ones', async () => {
    await i18n.changeLanguage('de')
    expect(i18n.t('nav.newChargePoint')).toBe('Neuer Ladepunkt')
    await i18n.changeLanguage('fr')
    expect(i18n.t('nav.newChargePoint')).toBe('New charge point')
    await i18n.changeLanguage('en')
  })
})
