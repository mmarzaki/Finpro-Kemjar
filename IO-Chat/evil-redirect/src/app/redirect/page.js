"use client";

import { useEffect, useState } from 'react';

const DEFAULT_TARGET =
  process.env.NEXT_PUBLIC_IOCHAT_LOGIN_URL || 'http://localhost:3000';

/**
 * Endpoint Open Redirect.
 *
 * VULNERABLE: menerima url/redirect/next dari query string dan langsung
 * memanggil window.location.replace() tanpa memvalidasi origin/domain.
 *
 * Contoh:
 *   /redirect?url=https://example.com
 *   /redirect?redirect=http://localhost:3000
 *   /redirect?next=https://example.com/phishing
 */
export default function OpenRedirectPage() {
  const [target, setTarget] = useState(DEFAULT_TARGET);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const destination =
      params.get('url') ||
      params.get('redirect') ||
      params.get('next') ||
      DEFAULT_TARGET;

    setTarget(destination);
    window.location.replace(destination);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-[#121212] text-gray-700 dark:text-gray-300">
      <div className="text-center">
        <p className="text-sm font-medium">Redirecting...</p>
        <p className="mt-2 text-xs text-gray-400 break-all max-w-md">{target}</p>
      </div>
    </div>
  );
}
