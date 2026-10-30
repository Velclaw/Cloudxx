import { redirect } from 'next/navigation';
import { auth } from '../auth';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(queryString ? `/login?${queryString}` : '/login');
}
