"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, KeyRound, Mail, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithPasskey, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError('Please enter your email to use a passkey');
      return;
    }
    setError('');
    try {
      await loginWithPasskey(email);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Passkey login failed');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-haven-text">Welcome back</h2>
        <p className="text-sm text-haven-text-secondary mt-1">Enter your details to sign in.</p>
      </div>

      {error && (
        <div className="bg-haven-destructive/10 text-haven-destructive text-sm p-3 rounded-lg border border-haven-destructive/20 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          required
        />
        
        <div className="relative">
          <Input
            label="Password"
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

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-haven-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-haven-border"></div>
        <span className="flex-shrink-0 mx-4 text-xs text-haven-text-secondary">OR</span>
        <div className="flex-grow border-t border-haven-border"></div>
      </div>

      <Button variant="secondary" className="w-full" onClick={handlePasskeyLogin} disabled={isLoading}>
        <Fingerprint className="w-4 h-4 mr-2" />
        Sign in with Passkey
      </Button>

      <p className="text-center text-sm text-haven-text-secondary mt-4">
        Don't have an account?{' '}
        <Link href="/register" className="text-haven-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
