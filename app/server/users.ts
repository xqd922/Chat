'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function signIn(
  _prevState: {
    message: string
  },
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    })
  } catch (error) {
    console.error('Error signing in:', error)
    return { message: 'Error signing in' }
  }
  redirect('/')
}

export async function signUp(
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
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    })
  } catch (error) {
    console.error('Error signing up:', error)
    return { message: 'Error signing up' }
  }
  redirect('/')
}
