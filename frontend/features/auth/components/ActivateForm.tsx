'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { ActivationCodeInput } from '@/features/auth/components/ActivationCodeInput';
import { useActivate } from '@/features/auth/hooks/useActivate';
import { useResendActivation } from '@/features/auth/hooks/useResendActivation';

interface Props {
  email: string;
}

export function ActivateForm({ email }: Props) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const activate = useActivate();
  const resend = useResendActivation();

  const hasError = activate.isError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.replace(/\s/g, '').length < 5) return;
    await activate.mutateAsync({ email, code });
    router.push('/login');
  }

  function handleTryAgain() {
    setCode('');
    activate.reset();
  }

  return (
    <main className='min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-bg'>
      <div className='w-full max-w-100 flex flex-col items-center'>
        {activate.isError ? (
          <>
            <div className='relative mb-8' aria-hidden='true'>
              <div className='w-27.5 h-27.5 rounded-full bg-danger-tint flex items-center justify-center'>
                <i className='pi pi-times text-danger text-[56px]' />
              </div>
              <div className='absolute -inset-2 rounded-full border-2 border-danger/20 pointer-events-none' />
            </div>

            <h1 className='text-[22px] font-bold text-text tracking-[-0.02em] mb-3 text-center'>
              Code didn&apos;t work
            </h1>
            <p className='text-sm text-text-muted text-center leading-relaxed mb-8'>
              {activate.error instanceof Error
                ? activate.error.message
                : 'That code is invalid or has expired. Codes expire after 15 minutes.'}
            </p>

            <Button
              type='button'
              onClick={handleTryAgain}
              label='Try again'
              pt={{
                root: {
                  className:
                    'w-full h-12.5 bg-primary hover:bg-primary-strong text-white text-[15px] font-semibold rounded-md transition-colors flex items-center justify-center mb-3',
                },
              }}
            />

            <Button
              type='button'
              loading={resend.isPending}
              disabled={resend.isPending || resend.isSuccess}
              onClick={() => resend.mutate({ email })}
              label={
                resend.isSuccess
                  ? 'Code sent!'
                  : resend.isPending
                    ? 'Sending…'
                    : 'Resend a new code'
              }
              pt={{
                root: {
                  className:
                    'w-full h-12.5 border border-border text-text-muted hover:text-text text-[15px] font-semibold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2',
                },
                loadingIcon: { className: 'animate-spin text-base' },
              }}
            />
          </>
        ) : (
          <>
            <h1 className='text-[22px] font-bold text-text tracking-[-0.02em] mb-2 text-center'>
              Activation code
            </h1>
            <p className='text-sm text-text-muted text-center leading-relaxed mb-8'>
              Enter the 5-digit code we sent to{' '}
              <span className='font-semibold text-text'>{email}</span>.
            </p>

            <form
              onSubmit={handleSubmit}
              className='w-full flex flex-col items-center'
            >
              <ActivationCodeInput
                value={code}
                onChange={setCode}
                hasError={hasError}
              />

              {hasError && (
                <p
                  role='alert'
                  className='text-xs text-danger text-center mt-3'
                >
                  Enter all 5 digits and try again.
                </p>
              )}

              <Button
                type='submit'
                loading={activate.isPending}
                disabled={
                  activate.isPending || code.replace(/\s/g, '').length < 5
                }
                label={activate.isPending ? 'Activating…' : 'Activate account'}
                pt={{
                  root: {
                    className:
                      'w-full h-12.5 bg-primary hover:bg-primary-strong text-white text-[15px] font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8',
                  },
                  loadingIcon: { className: 'animate-spin text-base' },
                }}
              />
            </form>

            <div className='flex items-center gap-4 mt-6 text-xs text-text-dim'>
              <button
                type='button'
                onClick={() => resend.mutate({ email })}
                disabled={resend.isPending || resend.isSuccess}
                className='hover:text-text-muted transition-colors disabled:opacity-50'
              >
                {resend.isSuccess ? 'Code sent!' : "Didn't get a code? Resend"}
              </button>
              <span aria-hidden='true'>·</span>
              <Link
                href='/register'
                className='hover:text-text-muted transition-colors'
              >
                Change email
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
