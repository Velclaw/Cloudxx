import App from '../App';
import { AuthScreen } from '../components/auth/AuthScreen';
import { auth } from '../auth';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const session = await auth();
  return session?.user ? <App /> : <AuthScreen />;
}
