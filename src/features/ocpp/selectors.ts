import type { ChargePoint } from './ocppSlice'

export const LOCAL_GROUP = 'Local'

export interface ChargePointGroup {
  /** Organization id, or LOCAL_GROUP for chargers not imported from the backend. */
  key: string
  name: string
  ids: string[]
}

/**
 * Groups chargers by backend organization (fallback "Local"), keeping the
 * given order inside each group. Named groups are sorted alphabetically and
 * "Local" goes last. `filterKey` limits the result to one group.
 */
export function groupChargePointsByOrganization(
  items: Record<string, ChargePoint>,
  order: string[],
  filterKey?: string
): ChargePointGroup[] {
  const groups = new Map<string, ChargePointGroup>()
  for (const id of order) {
    const cp = items[id]
    if (!cp) continue
    const key = cp.backend?.organizationId ?? LOCAL_GROUP
    if (filterKey && key !== filterKey) continue
    const group = groups.get(key) ?? { key, name: cp.backend?.organizationName ?? LOCAL_GROUP, ids: [] }
    group.ids.push(id)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => {
    if (a.key === LOCAL_GROUP) return 1
    if (b.key === LOCAL_GROUP) return -1
    return a.name.localeCompare(b.name)
  })
}
