'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/actions/auth.actions'
import { useState } from 'react'
import { Sora } from 'next/font/google'

const sora = Sora({ subsets: ['latin'], weight: ['700', '800'] })

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)

  async function clientAction(formData: FormData) {
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-dark-2 pt-28 px-4">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white dark:bg-dark-1 p-8 border border-gray-200 dark:border-none shadow-lg">
        <div className="flex flex-col gap-2 text-center items-center">
          <Link href="/" className="flex items-center gap-1 mb-4">
            <Image
              src="/icons/logo.svg"
              width={32}
              height={32}
              alt="tovo logo"
            />
            <div className={`text-[26px] font-extrabold ${sora.className}`}>
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent dark:hidden">
                TOVO
              </span>
              <span className="hidden dark:inline text-white">
                TOVO
              </span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-black dark:text-white">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <form action={clientAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-black dark:text-white" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              placeholder="Enter your email"
              required
              type="email"
              className="bg-white dark:bg-dark-3 border border-gray-200 dark:border-none text-black dark:text-white focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-black dark:text-white" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
              className="bg-white dark:bg-dark-3 border border-gray-200 dark:border-none text-black dark:text-white focus-visible:ring-offset-0"
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <SubmitButton />
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-blue-1 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button className="bg-blue-1 w-full hover:bg-blue-1/90" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign In'}
    </Button>
  )
}
