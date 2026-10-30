import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import { CloudxxClientApp } from '../cloudxx-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/');
  return <CloudxxClientApp />;
}
