import * as React from 'react';
import { useState, useEffect } from 'react';

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  isLoading,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    ghost: 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 shadow-none',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// --- Input Component ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className={`w-full ${className || ''}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        className={`appearance-none block w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// --- Card Component ---
export const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string; }) => {
  return (
    <div className={`bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 ${className || ''}`}>
      {title && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-5 py-5 sm:p-6">{children}</div>
    </div>
  );
};

// --- Layout Components ---
// Sidebar width matches the header's left section (hamburger + brand + separator).
// Header has px-4 (16px) + nav section (192px) = 208px total to the separator line.
const SIDEBAR_WIDTH_PX = 208;
const SIDEBAR_NAV_WIDTH_PX = SIDEBAR_WIDTH_PX - 16; // minus header padding-left (px-4)

export const Header = ({
  title,
  user,
  onLogout,
  onToggleSidebar,
}: {
  title: string;
  user?: { name: string };
  onLogout?: () => void;
  onToggleSidebar: () => void;
}) => {
  return (
    // Fixed to the top, spanning full width with a high z-index
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between pl-4 pr-4 sm:pr-6 fixed top-0 left-0 right-0 z-30">
      
      {/* Left side: Hamburger, Logo (with separator), and Context Pill */}
      <div className="flex items-center gap-4">
        {/* Nav section: fixed width so separator aligns with sidebar right edge */}
        <div
          className="flex items-center gap-4 shrink-0"
          style={{ width: SIDEBAR_NAV_WIDTH_PX }}
        >
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand Logo - border-r creates the separator line */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4 flex-1 min-w-0">
            <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-sm shrink-0">
              V
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block truncate">vCrew</span>
          </div>
        </div>

        {/* Context Pill (e.g., "Your Profile") */}
        {title && (
          <div className="hidden sm:flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            {title}
          </div>
        )}
      </div>

      {/* Right side: User info and Actions */}
      <div className="flex items-center gap-4">
        <span className="hidden md:block text-sm font-medium text-gray-600">
          Welcome, {user?.name || 'Admin User'}
        </span>
        <Button variant="ghost" onClick={onLogout} className="text-sm font-medium hidden sm:inline-flex">
          Sign out
        </Button>
      </div>
    </header>
  );
};

export const Sidebar = ({
  items,
  pathname,
  isOpen,
}: {
  items: { label: string; href: string; icon?: React.ElementType }[];
  pathname: string;
  isOpen: boolean;
}) => {
  return (
    // Fixed below the header (top-16), width aligns with header separator line
    <aside
      className={`
        fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 z-20 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ width: SIDEBAR_WIDTH_PX }}
    >
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto h-full">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700' // Active state maps to the light blue from mockup
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {/* Optional indicator line based on mockup nuances */}
              {isActive && <div className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-md" />}
              
              {item.icon && (
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors 
                    ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`}
                />
              )}
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
};

// We wrap the logic here so consumers don't have to wire up the hamburger state manually
export const Layout = ({
  children,
  sidebarItems,
  pathname,
  title,
  user,
  onLogout,
}: {
  children: React.ReactNode;
  sidebarItems: { label: string; href: string; icon?: React.ElementType }[];
  pathname: string;
  title: string;
  user?: { name: string };
  onLogout?: () => void;
}) => {
  // Centralized layout state for the hamburger menu
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Open sidebar by default on desktop, closed on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header 
        title={title} 
        user={user} 
        onLogout={onLogout} 
        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className="flex flex-1 pt-16"> {/* pt-16 accounts for the fixed 4rem (64px) header */}
        <Sidebar 
          items={sidebarItems} 
          pathname={pathname} 
          isOpen={isSidebarOpen} 
        />
        
        {/* Mobile backdrop overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-900/50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content area shifts right on desktop to account for sidebar */}
        <main
          className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'md:pl-[208px]' : 'md:pl-0'
          }`}
        >
          {/* We remove padding here because the ProfilePage component already defines its own max-w and padding logic */}
          {children}
        </main>
      </div>
    </div>
  );
};