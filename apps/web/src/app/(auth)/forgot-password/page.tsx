'use client';
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="w-12 h-12 bg-haven-success/10 text-haven-success rounded-full flex items-center justify-center mx-auto mb-2">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-haven-text">Check your email</h2>
        <p className="text-sm text-haven-text-secondary">
          If an account exists with {email}, we've sent instructions to reset your password.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="w-full mt-4">Return to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-haven-text">Reset Password</h2>
        <p className="text-sm text-haven-text-secondary mt-1">Enter your email to receive a reset link.</p>
      </div>

      {error && (
        <div className="bg-haven-destructive/10 text-haven-destructive text-sm p-3 rounded-lg border border-haven-destructive/20 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          required
        />

        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
          Send Reset Link
        </Button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-haven-text-secondary hover:text-haven-text transition-colors">
          Back to login
        </Link>
      </div>
    </div>
  );
}

