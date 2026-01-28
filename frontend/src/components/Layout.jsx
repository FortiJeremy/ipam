import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutGrid, Server, Settings, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Subnets', href: '/subnets', icon: LayoutGrid },
  { name: 'Devices', href: '/devices', icon: Server },
  { name: 'Live Discovery', href: '/live', icon: ShieldCheck },
];

export function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar stays dark as it already is slate-900 */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <ShieldCheck className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold tracking-tight text-white">EZ IPAM</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className={clsx('mr-3 h-5 w-5', isActive ? 'text-white' : 'text-slate-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <Link 
            to="/settings"
            className={clsx(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full",
              location.pathname === '/settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Settings className={clsx("mr-3 h-5 w-5", location.pathname === '/settings' ? 'text-white' : 'text-slate-400')} /> Settings
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col transition-all duration-200">
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 h-16 flex items-center px-8 justify-between transition-colors duration-200">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100 capitalize">
            {location.pathname === '/' ? 'Overview' : location.pathname.substring(1).replace('/', ' / ')}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded">v0.3.0</span>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
