'use client';
import { Button } from 'primereact/button';
import { useResendActivation } from '@/features/auth/hooks/useResendActivation';

interface Props {
  email: string;
}

export function ResendButton({ email }: Props) {
  const mutation = useResendActivation();

  const label = mutation.isSuccess
    ? 'Code sent!'
    : mutation.isPending
      ? 'Sending…'
      : 'Resend email';

  return (
    <div className='w-full flex flex-col items-center gap-1'>
      <Button
        type='button'
        disabled={mutation.isPending || mutation.isSuccess}
        onClick={() => mutation.mutate({ email })}
        label={label}
        pt={{
          root: {
            className:
              'w-full h-[50px] border border-border text-text-muted hover:text-text hover:border-border-strong text-[15px] font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2',
          },
          loadingIcon: { className: 'animate-spin text-base' },
        }}
      />
      {mutation.isError && (
        <p className='text-xs text-danger'>
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Failed to resend. Try again.'}
        </p>
      )}
    </div>
  );
}
