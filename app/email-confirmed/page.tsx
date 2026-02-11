'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-dark-1 px-4 text-center">
      <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-xl bg-dark-2 p-8 shadow-lg">
        <div className="rounded-full bg-green-500/20 p-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white">Email Confirmed!</h1>
        
        <p className="text-gray-300">
          Your email address has been successfully verified. You are now logged in.
        </p>

        <div className="text-sm text-gray-400">
          Redirecting to dashboard in <span className="font-bold text-white">{countdown}</span> seconds...
        </div>

        <Link 
          href="/"
          className="rounded-lg bg-blue-1 px-6 py-3 font-semibold text-white transition hover:bg-blue-1/90"
        >
          Go to Dashboard Now
        </Link>
      </div>
    </div>
  )
}
