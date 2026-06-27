import { Link, useLocation } from 'react-router-dom';
import { Briefcase, LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/jobs', icon: Briefcase, label: 'Find Jobs' },
    { path: '/kanban', icon: FileText, label: 'Applications' },
    { path: '/cover-letter', icon: FileText, label: 'Cover Letter' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-surface border-r border-surface-border h-screen fixed left-0 top-0 flex flex-col z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-sky-400"></span>
          <span className="text-content-strong">Darkone</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 mt-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-surface-alt text-primary font-semibold'
                      : 'text-content-muted hover:text-content-strong hover:bg-surface-alt/50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-primary' : 'text-content-muted'} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-surface-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-content-muted hover:bg-red-500/10 hover:text-red-500 transition-all">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
