/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      (() => {
        try {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (!url) return null;
          const u = new URL(url);
          return { protocol: 'https', hostname: u.hostname };
        } catch {
          return null;
        }
      })(),
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'cdn-images-1.medium.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ].filter(Boolean),
  },
};

module.exports = nextConfig;
