'use client';
"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold text-haven-destructive">Invalid Link</h2>
        <p className="text-haven-text-secondary mt-2">This password reset link is missing or invalid.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation we would pre-hash this on the client
      // For this step we will just pass it to the backend assuming the API takes the raw or pre-hashed.
      // We will assume the API takes pre-hashed so we would use crypto API here or just send raw if TLS handles it.
      // Since our authService expects a hash, let's simulate the client hash.
      const buffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await api.post('/auth/reset-password', { token, newPasswordHash: passwordHash });
      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-haven-text">Create New Password</h2>
        <p className="text-sm text-haven-text-secondary mt-1">Please enter your new password below.</p>
      </div>

      {error && (
        <div className="bg-haven-destructive/10 text-haven-destructive text-sm p-3 rounded-lg border border-haven-destructive/20 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<KeyRound className="w-4 h-4" />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-haven-text-secondary hover:text-haven-text transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          label="Confirm New Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          icon={<KeyRound className="w-4 h-4" />}
          required
        />

        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center p-6"><div className="w-8 h-8 border-4 border-haven-accent border-t-transparent rounded-full animate-spin mx-auto"></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

