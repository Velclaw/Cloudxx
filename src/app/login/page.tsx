import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import { AuthScreen } from '../../components/auth/AuthScreen';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');
  return <AuthScreen />;
}
