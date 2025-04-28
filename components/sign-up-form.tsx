'use client'

import { signUp } from '@/app/server/users'
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

const initialState = {
  message: '',
}

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
      Sign Up
    </Button>
  )
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [state, formAction] = useActionState(signUp, initialState)

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="font-medium text-xl">
            Create an account
          </CardTitle>
          <CardDescription>Sign up with your Email</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} method="POST">
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                  />
                </div>
                <SubmitButton />
                {/* biome-ignore lint/a11y/useSemanticElements: <explanation> */}
                <p aria-live="polite" role="status">
                  {state?.message}
                </p>
              </div>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <a href="/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
