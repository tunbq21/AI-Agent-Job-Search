import { Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/jobs', icon: Briefcase, label: 'Find Jobs' },
    { path: '/history', icon: FileText, label: 'History' },
    { path: '/kanban', icon: FileText, label: 'Applications' },
    { path: '/cover-letter', icon: FileText, label: 'Cover Letter' },
    { path: '/settings', icon: Settings, label: 'Profile' },
  ];

  return (
    <div className="w-72 bg-white/50 backdrop-blur-md border-r border-white/60 h-full flex flex-col z-20 shrink-0">
      <div className="p-8">
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-lg">
            <LayoutDashboard size={20} />
          </span>
          <span className="text-content-strong">JobAura</span>
        </h1>
      </div>

      <nav className="flex-1 px-6 mt-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-content-strong font-bold border border-white/80'
                      : 'text-content-muted hover:text-content-strong hover:bg-white/40 font-medium'
                  }`}
                >
                  <Icon size={22} className={isActive ? 'text-secondary' : 'text-content-muted'} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-white/60">
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-5 rounded-2xl mb-4 border border-white/50 text-center shadow-inner">
          <p className="text-sm font-bold text-content-strong mb-1">Need help?</p>
          <p className="text-xs text-content-muted mb-3">Check our docs</p>
          <button className="bg-white text-content-strong text-xs font-bold py-2 px-4 rounded-xl shadow-sm w-full hover:shadow-md transition-all hover:-translate-y-0.5">Documentation</button>
        </div>
        <button className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-2xl text-content-muted hover:bg-white hover:text-content-strong hover:shadow-sm transition-all font-semibold">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
