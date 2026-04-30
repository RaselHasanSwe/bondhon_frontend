/**
 * Laravel Echo setup for Reverb (WebSocket) real-time events.
 * Import `getEcho()` wherever you need a live channel subscription.
 * Only runs in the browser — never on the server.
 */

import type { Channel } from 'laravel-echo';

// Keep a singleton so we don't open multiple connections
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: any = null;

export function getEcho(): // eslint-disable-next-line @typescript-eslint/no-explicit-any
any | null {
  if (typeof window === 'undefined') return null;

  if (!echoInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PusherLib = require('pusher-js');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: LaravelEcho } = require('laravel-echo');

    // Attach Pusher to window so Laravel Echo can find it
    (window as unknown as Record<string, unknown>).Pusher = PusherLib;

    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('auth_token') ?? undefined
        : undefined;

    echoInstance = new LaravelEcho({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost',
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'application/json',
        },
      },
    }) as unknown;
  }

  return echoInstance;
}

/** Disconnect and clear the singleton (call on logout) */
export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}

// Re-export Channel type for consumers
export type { Channel };

