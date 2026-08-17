import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // THIS BYPASSES VERCEL'S PAID LIMITS
    remotePatterns: [
      { 
        protocol: 'https', 
        hostname: 'images.unsplash.com' 
      },
      { 
        protocol: 'https', 
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**' 
      },
    ],
  },
};

export default nextConfig;