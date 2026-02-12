'use client';

import Image from 'next/image';
import Link from 'next/link';
import MobileNav from './MobileNav';
import UserMenu from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { sora } from '@/app/fonts';
 

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-white dark:bg-dark-1 px-6 py-4 lg:px-10 border-b dark:border-none">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="tovo logo"
          className="max-sm:size-10"
        />
        <div className={`text-[26px] font-extrabold max-sm:hidden ${sora.className}`}>
          <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent dark:hidden">
            TOVO
          </span>
          <span className="hidden dark:inline text-white">
            TOVO
          </span>
        </div>
      </Link>
      <div className="flex-between gap-5">
        <Link href="/pricing" className="text-black dark:text-white font-medium hover:text-blue-1 transition-colors max-sm:hidden">
          Pricing
        </Link>
        <ThemeToggle />
        <UserMenu />
        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
