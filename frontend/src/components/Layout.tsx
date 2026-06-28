import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex w-full max-w-[1800px] h-[94vh] bg-surface-alt/95 backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden border border-white/60">
      <Sidebar />
      <main className="flex-1 p-10 bg-transparent overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
