import { cn } from '@/lib/utils'
import { useId } from 'react'

interface LogoMarkProps {
  className?: string
}

/** Nextocode OCPP Simulator mark: the brand's chamfered tile with a charging bolt. */
export function LogoMark({ className }: LogoMarkProps) {
  // Unique gradient id so several marks on one page don't share (and break) a <defs> entry.
  const gradientId = `ocpp-logo-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox='0 0 64 64' className={cn('h-8 w-8 shrink-0', className)} aria-hidden='true'>
      <defs>
        <linearGradient id={gradientId} x1='0' y1='0' x2='64' y2='64' gradientUnits='userSpaceOnUse'>
          <stop offset='0' stopColor='#00f0ba' />
          <stop offset='1' stopColor='#16009b' />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradientId})`} d='M18 0h40a6 6 0 0 1 6 6v40L46 64H6a6 6 0 0 1-6-6V18Z' />
      <path fill='#fff' d='M37 9 17 36h12l-4 19 22-28H34.5L37 9Z' />
    </svg>
  )
}
