
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, PlusCircle, BarChart3, LogOut, Settings } from 'lucide-react';
import { Logo } from './Logo';

interface SidebarProps {
  onLogout: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, userRole }) => {
  const location = useLocation();

  // Define all possible items
  const allItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'agent'] },
    { name: 'Mis Tickets', path: '/tickets', icon: Ticket, roles: ['admin', 'agent', 'specialist'] },
    { name: 'Crear Ticket', path: '/create-ticket', icon: PlusCircle, roles: ['admin', 'agent'] },
    // Reports Removed
    { name: 'Configuración', path: '/config', icon: Settings, roles: ['admin'] },
    { name: 'Cambiar Contraseña', path: '/change-password', icon: Settings, roles: ['admin', 'agent', 'specialist'] },
  ];

  // Filter based on user role
  const visibleItems = allItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-[#1e242b] text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 border-b border-gray-700/50 flex items-center justify-center">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-[#e51b24] text-white shadow-md'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
              <span className="font-medium text-sm tracking-wide">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
