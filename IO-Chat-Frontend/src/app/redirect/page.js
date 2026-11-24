"use client";

import { useEffect } from 'react';

export default function OpenRedirectPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('url') || params.get('redirect') || params.get('next') || '/';
    // VULNERABLE: Blindly redirects to any user-supplied URL without domain/origin validation
    window.location.replace(target);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-[#121212] text-gray-700 dark:text-gray-300">
      <p className="text-sm font-medium">Redirecting...</p>
    </div>
  );
}
