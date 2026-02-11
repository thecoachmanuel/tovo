import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    {
      path: '/fonts/InterVariable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  display: 'swap',
});

export const sora = localFont({
  src: [
    {
      path: '/fonts/Sora-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '/fonts/Sora-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
});
