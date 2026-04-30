import type { NextConfig } from "next";

// Derive the API hostname from NEXT_PUBLIC_API_URL so Next.js <Image> can
// load photos served by the Laravel backend (e.g. http://localhost:8000/storage/…)
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
let apiHostname = 'localhost';
try {
  apiHostname = new URL(apiUrl).hostname;
} catch { /* keep default */ }

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    remotePatterns: [
      // Local development — backend on any localhost port
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
      // Dynamic hostname derived from NEXT_PUBLIC_API_URL (covers staging / prod)
      { protocol: 'http',  hostname: apiHostname },
      { protocol: 'https', hostname: apiHostname },
      // Allow any HTTPS host (covers CDN / S3 / public storage in production)
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
