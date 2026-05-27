import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'POS / Checkout', icon: ShoppingCart, path: '/pos' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const currentPathName = navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          <span>ProPoint POS</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="absolute top-4 right-4 lg:hidden">
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 lg:hidden hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 truncate">
              {currentPathName}
            </h2>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4 lg:pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'Staff'}</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm lg:text-base">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
