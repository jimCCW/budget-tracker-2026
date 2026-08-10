import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface ResetPasswordPageProps {
  email: string;
  token: string;
}

export function ResetPasswordPage({ email, token }: ResetPasswordPageProps) {
  return (
    <div className='flex min-h-screen'>
      {/* Brand panel — desktop only */}
      <aside className='hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden bg-linear-to-br from-primary to-primary-strong'>
        <div
          aria-hidden='true'
          className='absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10'
        />
        <div
          aria-hidden='true'
          className='absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-white/7'
        />
        <div
          aria-hidden='true'
          className='absolute -bottom-20 right-10 w-56 h-56 rounded-full bg-white/10'
        />

        <div className='relative flex items-center gap-3'>
          <div
            aria-hidden='true'
            className='w-10 h-10 rounded-md bg-white/20 flex items-center justify-center'
          >
            <span className='text-white font-extrabold text-lg leading-none'>
              B
            </span>
          </div>
          <span className='text-white font-bold text-lg'>Budget Tracker</span>
        </div>

        <div className='relative'>
          <p className='text-white font-extrabold text-[38px] leading-tight tracking-[-0.02em]'>
            Money you
            <br />
            understand.
          </p>
          <p className='mt-4 text-white/70 text-base leading-relaxed max-w-80'>
            Track income, expenses, and savings goals — all in one place, always
            in your currency.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className='relative flex flex-1 flex-col items-center justify-center px-5 py-10 lg:py-0 bg-bg'>
        <div className='absolute top-4 right-4'>
          <ThemeToggle />
        </div>
        <div
          aria-hidden='true'
          className='lg:hidden mb-6 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center'
        >
          <span className='text-white font-extrabold text-2xl leading-none'>
            B
          </span>
        </div>

        <div className='w-full max-w-100'>
          <h1 className='text-[22px] font-bold lg:text-[28px] lg:font-extrabold text-text tracking-[-0.02em] mb-1 text-center lg:text-left'>
            Set new password
          </h1>
          <p className='text-sm text-text-muted mb-8 text-center lg:text-left'>
            Choose a strong password for your account.
          </p>
          <ResetPasswordForm email={email} token={token} />
        </div>
      </main>
    </div>
  );
}
