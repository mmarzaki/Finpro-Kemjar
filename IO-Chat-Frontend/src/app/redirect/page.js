"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function RedirectHandler() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url");

  useEffect(() => {
    if (targetUrl) {
      window.location.replace(targetUrl);
    }
  }, [targetUrl]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-[#121212] text-gray-700 dark:text-gray-300">
      <div className="text-center">
        <p className="text-sm font-medium">Redirecting...</p>
        {targetUrl ? (
          <p className="mt-2 text-xs text-gray-400 break-all max-w-md">{targetUrl}</p>
        ) : (
          <p className="mt-2 text-xs text-gray-400">Parameter url tidak ditemukan.</p>
        )}
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-[#121212]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      }
    >
      <RedirectHandler />
    </Suspense>
  );
}
