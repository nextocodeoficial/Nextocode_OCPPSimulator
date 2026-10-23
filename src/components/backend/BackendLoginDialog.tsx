import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { loginThunk } from '@/features/backend/session'
import type { AppDispatch } from '@/store/store'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

const schema = z.object({
  email: z.string().min(1, 'Email is required').pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackendLoginDialog({ open, onOpenChange }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const [error, setError] = useState<string>()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setError(undefined)
    const result = await dispatch(loginThunk(values))
    if (loginThunk.fulfilled.match(result)) {
      form.reset()
      onOpenChange(false)
    } else {
      setError(result.payload ?? 'Sign in failed')
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in to backNextoway</DialogTitle>
          <DialogDescription>
            Browse organizations and import their chargers into the simulator.
          </DialogDescription>
        </DialogHeader>
        <form className='grid gap-3' onSubmit={onSubmit} noValidate>
          <div className='grid gap-1'>
            <label htmlFor='backend-email' className='text-sm font-medium'>
              Email
            </label>
            <Input id='backend-email' type='email' autoComplete='username' {...form.register('email')} />
            {form.formState.errors.email && (
              <p className='text-xs text-destructive'>{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className='grid gap-1'>
            <label htmlFor='backend-password' className='text-sm font-medium'>
              Password
            </label>
            <Input
              id='backend-password'
              type='password'
              autoComplete='current-password'
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className='text-xs text-destructive'>{form.formState.errors.password.message}</p>
            )}
          </div>
          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              Sign in
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
