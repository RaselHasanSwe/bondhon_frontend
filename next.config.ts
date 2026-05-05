import type { NextConfig } from "next";

// Derive the API hostname + port from NEXT_PUBLIC_API_URL so Next.js <Image>
// can load photos served by the Laravel backend (e.g. http://localhost:8000/storage/…)
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
let apiHostname = 'localhost';
let apiPort = '';
try {
  const parsed = new URL(apiUrl);
  apiHostname = parsed.hostname;
  apiPort = parsed.port; // e.g. "8000" — empty string for default ports 80/443
} catch { /* keep defaults */ }

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  images: {
    // Backend-uploaded images (logos, profile photos, etc.) that are served
    // directly from the Laravel storage URL are loaded with `unoptimized` in
    // the components, so they bypass this list. However, we keep the patterns
    // here for any optimized external image usage.
    remotePatterns: [
      // Local development — backend on any port of localhost / 127.0.0.1
      { protocol: 'http',  hostname: 'localhost',  port: '' },   // any port
      { protocol: 'http',  hostname: '127.0.0.1',  port: '' },   // any port
      // Backend hostname:port derived from NEXT_PUBLIC_API_URL (dev + staging + prod)
      { protocol: 'http',  hostname: apiHostname, port: apiPort },
      { protocol: 'https', hostname: apiHostname, port: apiPort },
      // Fallback: allow ANY HTTPS host (CDN / S3 / public storage in production)
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
