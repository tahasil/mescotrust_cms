import { getAuthSession } from '@/lib/apiAuth';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }) {
  const session = await getAuthSession();
  return (
    <AdminLayoutClient session={session}>
      {children}
    </AdminLayoutClient>
  );
}
