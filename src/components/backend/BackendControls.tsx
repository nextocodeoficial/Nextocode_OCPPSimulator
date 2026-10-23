import { Button } from '@/components/ui/button'
import { useBackendAuth } from '@/features/backend/hooks'
import { logoutThunk } from '@/features/backend/session'
import type { AppDispatch } from '@/store/store'
import { Cloud, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { BackendBrowserSheet } from './BackendBrowserSheet'
import { BackendLoginDialog } from './BackendLoginDialog'

/** Header controls: sign in to backNextoway, browse its chargers, sign out. */
export function BackendControls() {
  const dispatch = useDispatch<AppDispatch>()
  const { accessToken, user } = useBackendAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)

  if (!accessToken || !user) {
    return (
      <>
        <Button variant='outline' size='sm' onClick={() => setLoginOpen(true)}>
          <Cloud className='h-4 w-4' />
          <span className='hidden sm:inline'>Backend login</span>
        </Button>
        <BackendLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    )
  }

  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setBrowserOpen(true)}>
        <Cloud className='h-4 w-4' />
        <span className='hidden sm:inline'>Import chargers</span>
      </Button>
      <span className='hidden max-w-40 truncate text-xs text-muted-foreground md:inline' title={user.email}>
        {user.email}
      </span>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        aria-label='Sign out of backend'
        onClick={() => dispatch(logoutThunk())}
      >
        <LogOut className='h-4 w-4' />
      </Button>
      <BackendBrowserSheet open={browserOpen} onOpenChange={setBrowserOpen} />
    </>
  )
}
