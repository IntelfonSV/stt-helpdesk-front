
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { User } from '../types';
import { Avatar, IconButton, Badge } from '@mui/material';
import { Bell, Search, Menu } from 'lucide-react';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  console.log(user);
  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden xl:block">
        <Sidebar onLogout={onLogout} userRole={user?.role} />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 xl:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <Sidebar onLogout={onLogout} userRole={user?.role} />
        </div>
      )}

      {/* Toggle Button */}
      <button
        className="fixed top-4 left-4 z-40 xl:hidden bg-[#e51b24] p-2 rounded-full text-white shadow-md"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 xl:ml-64 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 sticky top-0 z-10 ">
          <div className="flex items-center gap-4">
             {/* <div className="relative ml-10">
            buscador
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar ticket..." 
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#e51b24]/20 w-64 transition-all"
                />
             </div> */}
          </div>
          
          <div className="flex items-center gap-6">
            {/* <IconButton>
              <Badge badgeContent={2} color="primary">
                <Bell size={20} className="text-gray-600" />
              </Badge>
            </IconButton> */}
            
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-[#1e242b]">{user?.name}</p>
                <p className="text-xs text-gray-500 font-medium">{user?.country?.country_name || 'País no disponible'} - {user?.area || 'Área no disponible'}</p>
              </div>
              <Avatar 
                src={user?.avatar} 
                alt={user?.name}
                sx={{ width: 40, height: 40, border: '2px solid #e51b24' }} 
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
