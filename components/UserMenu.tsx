'use client'

import Link from 'next/link'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { logout } from '@/actions/auth.actions'
import { useEffect } from 'react'
import Image from 'next/image'

export default function UserMenu() {
  const { user } = useSupabaseUser()

  useEffect(() => {
  }, [])

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Image
            src={user.user_metadata.avatar_url || '/icons/user.svg'}
            alt="User avatar"
            fill
            unoptimized
            className="rounded-full object-cover"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-dark-1 text-white border-dark-1" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata.username || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-dark-3" />
        <DropdownMenuItem 
          className="focus:bg-dark-3 focus:text-white cursor-pointer"
        >
          <Link href="/profile" className="w-full">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="focus:bg-dark-3 focus:text-white cursor-pointer"
          onClick={() => logout()}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
