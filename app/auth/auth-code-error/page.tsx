'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-dark-1 px-4 text-center">
      <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-xl bg-dark-2 p-8 shadow-lg">
        <div className="rounded-full bg-red-500/20 p-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white">Authentication Error</h1>
        
        <p className="text-gray-300">
          There was an error verifying your email or logging you in. The link may have expired or is invalid.
        </p>

        <Link 
          href="/sign-in"
          className="rounded-lg bg-blue-1 px-6 py-3 font-semibold text-white transition hover:bg-blue-1/90"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
