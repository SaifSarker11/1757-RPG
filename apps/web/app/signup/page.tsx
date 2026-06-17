"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="flex flex-col items-center gap-3 p-8 border-4 border-base-content bg-base-100 shadow-neo font-mono text-xs font-bold uppercase select-none">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent"></div>
        <span>REDIRECTING TO LOGIN...</span>
      </div>
    </main>
  );
}
