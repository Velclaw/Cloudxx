import { auth } from '../auth';
import { AuthScreen } from '../components/auth/AuthScreen';
import { CloudxxClientApp } from './cloudxx-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await auth();
  return session?.user ? <CloudxxClientApp /> : <AuthScreen />;
}
