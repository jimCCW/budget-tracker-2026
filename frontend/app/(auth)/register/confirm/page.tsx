import { RegisterConfirmPage } from '@/features/auth/components/RegisterConfirmPage';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { email = '' } = await searchParams;
  return <RegisterConfirmPage email={email} />;
}
