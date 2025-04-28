import { GalleryVerticalEnd } from 'lucide-react'
import { headers } from 'next/headers'

import { LoginForm } from '@/components/login-form'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  })

  if (session) {
    redirect('/')
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-neutral-100 p-6 md:p-10 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Chatde
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
