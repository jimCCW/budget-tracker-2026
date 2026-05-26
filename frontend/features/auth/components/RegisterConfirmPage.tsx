import Link from 'next/link';
import { ResendButton } from '@/features/auth/components/ResendButton';

interface Props {
  email: string;
}

export function RegisterConfirmPage({ email }: Props) {
  return (
    <main className='min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-bg'>
      <div className='w-full max-w-[400px] flex flex-col items-center text-center'>
        <div className='relative mb-8'>
          <div className='w-24 h-24 rounded-full bg-primary-tint flex items-center justify-center'>
            <i className='pi pi-envelope text-primary text-[42px]' />
          </div>
          <div className='absolute -top-1 -right-1 w-7 h-7 rounded-full bg-success flex items-center justify-center'>
            <i className='pi pi-check text-white text-xs' />
          </div>
        </div>

        <h1 className='text-[22px] font-bold text-text tracking-[-0.02em] mb-3'>
          Check your email
        </h1>
        <p className='text-sm text-text-muted leading-relaxed mb-8'>
          We sent a 5-digit activation code to{' '}
          <span className='font-semibold text-text'>{email}</span>. Enter it on
          the next screen to activate your account.
        </p>

        <Link
          href={`/register/activate?email=${encodeURIComponent(email)}`}
          className='w-full h-[50px] bg-primary hover:bg-primary-strong text-white text-[15px] font-semibold rounded-md transition-colors flex items-center justify-center mb-3'
        >
          Enter activation code
        </Link>

        <ResendButton email={email} />

        <Link
          href='/login'
          className='mt-6 text-sm text-text-dim hover:text-text-muted transition-colors'
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
