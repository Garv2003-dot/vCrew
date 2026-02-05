'use client';
// import Icon, {
//   HomeIcon,
//   UserIcon,
//   UsersIcon,
//   RectangleStackIcon,
// } from '@heroicons/react/24/outline';
import { Layout, Sidebar, Header } from '@repo/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { useEffect } from 'react';

// Note: In a real app we'd import icons from heroicons or similar properly.
// Since we don't have heroicons installed, we will pass simple placeholders or text if needed,
// OR install heroicons. For now, I'll assume we can use text or simple SVGs in the Sidebar component itself if icons are missing.
// Actually, let's just pass the data and let the Sidebar render.

const sidebarItems = [
  { label: 'Dashboard', href: '/profile' }, // Profile acting as dashboard for now
  { label: 'Employees', href: '/employees' },
  { label: 'Allocations', href: '/project-allocation' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <Layout
      sidebar={<Sidebar items={sidebarItems} pathname={pathname} />}
      header={
        <Header title="Enterprise Portal" user={user} onLogout={logout} />
      }
    >
      {children}
    </Layout>
  );
}
