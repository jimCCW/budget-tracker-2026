import { redirect } from 'next/navigation';
import { ResetPasswordPage } from '@/features/auth/components/ResetPasswordPage';

interface Props {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    redirect('/login');
  }

  return <ResetPasswordPage token={token} email={email} />;
}
