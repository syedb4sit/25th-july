'use client';
"use Masonry"; // Hack to bypass SSR for now? No, just "use client"
"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, KeyRound, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
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

    try {
      await register(email, password, displayName);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  // Simple password strength
  const strength = Math.min(password.length / 12, 1) * 100;
  const strengthColor = strength < 40 ? 'bg-haven-destructive' : strength < 80 ? 'bg-yellow-500' : 'bg-haven-success';

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-haven-text">Create Account</h2>
        <p className="text-sm text-haven-text-secondary mt-1">Join the private space.</p>
      </div>

      {error && (
        <div className="bg-haven-destructive/10 text-haven-destructive text-sm p-3 rounded-lg border border-haven-destructive/20 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Display Name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we call you?"
          icon={<User className="w-4 h-4" />}
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

        {password.length > 0 && (
          <div className="w-full h-1 bg-haven-border rounded-full overflow-hidden mt-[-8px]">
            <div 
              className={`h-full ${strengthColor} transition-all duration-300`} 
              style={{ width: `${strength}%` }}
            />
          </div>
        )}

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          icon={<KeyRound className="w-4 h-4" />}
          required
        />

        <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-haven-text-secondary mt-2">
        Already have an account?{' '}
        <Link href="/login" className="text-haven-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

