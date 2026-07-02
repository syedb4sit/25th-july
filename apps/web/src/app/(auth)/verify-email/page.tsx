'use client';
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided');
      return;
    }

    api.get(`/auth/verify-email/${token}`)
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed');
      });
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-haven-accent animate-spin mb-2" />
          <h2 className="text-xl font-semibold text-haven-text">Verifying Email...</h2>
          <p className="text-haven-text-secondary text-sm">Please wait while we verify your email address.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-haven-success mb-2" />
          <h2 className="text-xl font-semibold text-haven-text">Email Verified!</h2>
          <p className="text-haven-text-secondary text-sm">Your email has been verified. Redirecting to login...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-12 h-12 text-haven-destructive mb-2" />
          <h2 className="text-xl font-semibold text-haven-text">Verification Failed</h2>
          <p className="text-haven-destructive text-sm">{errorMsg}</p>
          <Link href="/login" className="mt-4">
            <Button variant="secondary">Return to login</Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center py-8 text-center gap-4"><div className="w-12 h-12 border-4 border-haven-accent border-t-transparent rounded-full animate-spin mb-2"></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

