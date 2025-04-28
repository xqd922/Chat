'use client'

import { signInAction } from '@/app/server/users'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Spinner } from './ui/spinner'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending && <Spinner className="text-white dark:text-black" />}
      Login
    </Button>
  )
}

const initialState = {
  message: '',
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [state, formAction] = useActionState(signInAction, initialState)

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="font-medium text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Email</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} method="POST">
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    name="password"
                    id="password"
                    type="password"
                    required
                  />
                </div>
                <SubmitButton />
                <p
                  className="mx-auto font-light text-red-500 text-sm"
                  aria-live="polite"
                  /* biome-ignore lint/a11y/useSemanticElements: <explanation> */
                  role="status"
                >
                  {state?.message}
                </p>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <a href="/signup" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
