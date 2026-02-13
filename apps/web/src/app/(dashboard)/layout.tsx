'use client';
// Deep Code: Notice we only import Layout now.
// Header and Sidebar are abstracted away internally by the UI library.
import { Layout } from '@repo/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { useEffect } from 'react';

// --- MOCK ICONS ---
// Since Heroicons aren't installed, we use simple SVG functional components.
// This perfectly satisfies the `icon?: React.ElementType` typing expected by our new Sidebar.
const DashboardIcon = (props: any) => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
    />
  </svg>
);
const UsersIcon = (props: any) => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
    />
  </svg>
);
const BriefcaseIcon = (props: any) => (
  <svg
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 14.15v4.25c0 1.084-.88 1.964-1.964 1.964H5.714c-1.084 0-1.964-.88-1.964-1.964v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v3.438m7.5 0h-7.5"
    />
  </svg>
);

const sidebarItems = [
  { label: 'Dashboard', href: '/profile', icon: DashboardIcon },
  { label: 'Employees', href: '/employees', icon: UsersIcon },
  { label: 'Allocations', href: '/project-allocation', icon: BriefcaseIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const getBreadcrumb = (path: string) => {
    // Map paths to readable names
    if (path === '/project-allocation') return 'Allocations';
    if (path === '/employees') return 'Employees';
    if (path === '/profile') return 'Dashboard';

    // Fallback: capitalize logical segments
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      return last.charAt(0).toUpperCase() + last.slice(1);
    }

    return 'Dashboard';
  };

  const breadcrumb = getBreadcrumb(pathname);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        {/* Swapped basic text for a cleaner loading spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    // Deep Code: Data is passed down linearly. The Layout component now
    // acts as the orchestrator for the Shell UI.
    <Layout
      sidebarItems={sidebarItems}
      pathname={pathname}
      title={
        <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <span className="text-blue-600 font-semibold">{breadcrumb}</span>
        </span>
      }
      user={user}
      onLogout={logout}
      logoUrl="/vcrew-logo.png"
    >
      {children}
    </Layout>
  );
}
