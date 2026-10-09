'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function NavbarAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    checkUser();
  }, [supabase]);

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="rounded-full bg-[#D97757] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#C26243] transition-colors whitespace-nowrap"
      >
        <span className="hidden sm:inline">Creator </span>Dashboard
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Link
        href="/login"
        className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 whitespace-nowrap"
      >
        Log in
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-[#2D2D2D] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-black transition-colors whitespace-nowrap"
      >
        Sign up
      </Link>
    </div>
  );
}