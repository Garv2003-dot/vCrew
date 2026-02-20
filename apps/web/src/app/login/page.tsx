'use client';
import React, { useState } from 'react';
import { Card, Button, Input } from '@repo/ui';
import { useAuth } from '../../context/auth-context';
import Image from '../../../../../node_modules/next/image';

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // inline errors
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Reset errors
    setErrors({});

    // Basic client-side checks (optional)
    const temp: FieldErrors = {};
    if (!email.trim()) temp.email = 'Email/Username is required.';
    if (!password.trim()) temp.password = 'Password is required.';
    if (Object.keys(temp).length > 0) {
      setErrors(temp);
      return;
    }

    try {
      const res: any = await login(email, password);

      if (!res.ok) {
        setErrors({ form: res.message });
        return;
      }

      // Success: clear form
      setEmail('');
      setPassword('');
    } catch (err: any) {
      // If login() throws, set a generic error or parse message
      const msg =
        err?.message ||
        'Invalid credentials. Please check your email and password.';
      // If you can’t tell which field, show under both for clarity:
      setErrors({ email: msg, password: msg });
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
      {/* LEFT PANEL */}
      <aside className="relative col-span-2 flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-100 to-white">
        {/* Small 'V' triangle logo (top-left) */}
        {/* Brand logo image (top-left) */}

        <div className="flex flex-col items-center lg:items-start px-8 box-shadow:none">
          <Image
            src="/logos/vCrew-title.png"
            alt="vCrew wordmark"
            width={256}
            height={72}
            priority
            className="select-none"
          />
        </div>
      </aside>

      <main className="relative col-span-3 flex items-center justify-center bg-[#0C3671]">
        <div
          aria-hidden
          className="absolute left-0 top-0 h-full w-12 bg-[#2E63C7]"
        />
        <div
          aria-hidden
          className="absolute left-8 top-0 h-full w-8  bg-[#1D4FA3]"
        />

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
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Email/Username */}
              <div>
                <Input
                  label="Email/Username *"
                  type="text"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    // Clear field error on change
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Enter email/username"
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Input
                  label="Password *"
                  type="password"
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? 'password-error' : undefined
                  }
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter password"
                />
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* General form error (fallback) */}
              {errors.form && (
                <p
                  className="text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.form}
                </p>
              )}

              <Button
                type="submit"
                className="w-full rounded-md bg-[#2d72ff] hover:bg-[#1a5ee8] text-white"
                isLoading={isLoading}
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
