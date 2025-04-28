import { signIn, signUp } from '@/lib/auth-client'
import { redirect } from 'next/navigation'

export async function signInAction(
  _prevState: {
    message: string
  },
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const result = await signIn.email({
    email,
    password,
  })
  console.log('Sign in result:', result)
  if (result.error?.message) {
    return { message: result.error.message }
  }
  redirect('/')
}

export async function signUpAction(
  _prevState: {
    message: string
  },
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const confirmPassword = formData.get('confirmPassword') as string
  if (password !== confirmPassword) {
    return { message: 'Passwords do not match' }
  }
  if (!email || !password || !name) {
    return { message: 'Please fill in all fields' }
  }

  const result = await signUp.email({
    email,
    password,
    name,
  })
  console.log('Sign up result:', result)
  if (result.error?.message) {
    return { message: result.error.message }
  }
  redirect('/')
}
