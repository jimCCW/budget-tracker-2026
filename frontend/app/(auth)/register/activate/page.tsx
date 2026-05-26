import { ActivateForm } from '@/features/auth/components/ActivateForm';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ActivatePage({ searchParams }: Props) {
  const { email = '' } = await searchParams;
  return <ActivateForm email={email} />;
}
