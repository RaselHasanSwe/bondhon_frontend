/**
 * Laravel Echo setup for Reverb (WebSocket).
 * Uses async dynamic import() — compatible with Next.js Turbopack/ESM.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEcho(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  // Lazy-load both libs via ESM dynamic import (never require())
  const [PusherMod, EchoMod] = await Promise.all([
    import('pusher-js'),
    import('laravel-echo'),
  ]);

  const Pusher = PusherMod.default;
  const LaravelEcho = EchoMod.default;

  // Laravel Echo looks for Pusher on window
  (window as unknown as Record<string, unknown>).Pusher = Pusher;

  echoInstance = new LaravelEcho({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost',
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Use the base URL (not /api/v1) — broadcasting/auth is a top-level route
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    // Always read the token fresh so it works after login
    auth: {
      headers: {
        get Authorization() {
          const t =
            typeof localStorage !== 'undefined'
              ? localStorage.getItem('auth_token')
              : null;
          return t ? `Bearer ${t}` : '';
        },
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
}

/** Disconnect and clear the singleton (call on logout) */
export function disconnectEcho(): void {
  if (echoInstance) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (echoInstance as any).disconnect?.();
    echoInstance = null;
  }
}
