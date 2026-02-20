'use client';
import React, { useState } from 'react';
import { Card, Button, Input } from '@repo/ui';
import { useAuth } from '../../context/auth-context';
import Image from '../../../../../node_modules/next/image';
export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ pass both email and password (you were only passing email earlier)
    await login(email, password);
    setEmail("")
    setPassword("")
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
      {/* LEFT PANEL */}
      <aside className="relative col-span-2 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-white">
        {/* Small 'V' triangle logo (top-left) */}
       {/* Brand logo image (top-left) */}
<div className="absolute left-4 top-4">
  <Image
    src="/logos/vCrew-Logo.png"
    alt="vCrew logo"
    width={60}              k
    height={60}
    priority                 
    className="select-none"
  />
</div>

        {/* wordmark vCrew */}
        
{/* wordmark image (replaces text vCrew) */}
<div className="flex flex-col items-center lg:items-start px-8 box-shadow:none">
  <Image
    src="/vCrew-title.png"
    alt="vCrew wordmark"
    width={256}        // adjust to your asset proportions
    height={72}        // keep aspect ratio consistent with your file
    priority           // optional: improves LCP for above-the-fold
    className="select-none"
  />
</div>


        {/* Subtle vignette on the far left to mimic the mock’s depth */}
        {/* <div className="pointer-events-none absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-slate-200/60 to-transparent" /> */}
      </aside>

      {/* RIGHT PANEL */}
      <main className="relative col-span-3 flex items-center justify-center bg-[#0C3671]">
        {/* Two vertical stripes near the center seam */}
        
<div aria-hidden className="absolute left-0 top-0 h-full w-12 bg-[#2E63C7]" />
  <div aria-hidden className="absolute left-8 top-0 h-full w-8  bg-[#1D4FA3]" />


        {/* Content container */}
        <div className="relative w-full max-w-md px-6">
          {/* Headings */}
          <div className="mb-6">
            <h2 className="text-white text-2xl font-semibold">Welcome !</h2>
            <p className="text-slate-200 text-sm mt-1">
              Sign in to access your vCrew dashboard
            </p>
          </div>

          {/* Form card */}
          <Card className="bg-white/95 backdrop-blur-sm rounded-lg shadow p-6">
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <Input
                  label="Email/Username *"
                  placeholder="Enter email/username"
                  type="text"
                  required
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Password *"
                  placeholder="Enter password"
                  type="password"
                  required
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-[#2E63C7] hover:bg-[#2A5BB6] text-white font-medium rounded-md"
              >
                Sign in
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}