import { Inter, Sora } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const sora = Sora({
  subsets: ['latin'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-sora',
});
