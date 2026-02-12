'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/email-confirmed`,
      data: {
        username,
      },
    },
  })

  if (error) {
    console.error('Supabase SignUp Error:', error)
    return { error: error.message }
  }

  if (authData.user) {
    try {
      // Check if user already exists to avoid unique constraint errors
      const { default: db } = await import('@/lib/db')
      const existingUser = await db.user.findUnique({
        where: { id: authData.user.id }
      })

      if (!existingUser) {
        await db.user.create({
          data: {
            id: authData.user.id,
            email: email,
            username: username,
          },
        })
      }
    } catch (dbError) {
      console.error('Prisma User Creation Error:', dbError)
      // We don't want to fail the request if the DB write fails, 
      // but we should probably alert or retry. 
      // For now, logging it is enough as the auth user is created.
    }
  }

  // If email confirmation is enabled, we should ideally show a message instead of redirecting.
  // But to preserve existing behavior for now (unless asked to change), we'll keep the redirect
  // or maybe redirect to a "check your email" page if session is null?
  
  if (authData.session) {
    // User is logged in immediately (email confirmation disabled)
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } else {
    // Email confirmation required
    // We can redirect to a specific page or return a flag.
    // Since the client expects a redirect or error, let's redirect to a "check email" page if we had one.
    // For now, we'll redirect to sign-in with a query param?
    // Or just let it redirect to / which might redirect to sign-in.
    
    // Actually, let's just return a success message if possible? 
    // But the function signature returns void or { error }.
    
    // Let's redirect to a new 'check-email' page to be clear.
    redirect('/sign-in?message=check-email')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/')
}
