
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { sttTheme } from './theme';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { AdminConfig } from './components/AdminConfig';
import { ChangePassword } from './components/ChangePassword';

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null);

  const handleLogin = () => {
    // Find user by email, case-insensitive
     const raw = localStorage.getItem("user");
     if (raw) {
      try {
        const parsedUser = JSON.parse(raw);
        setUser(parsedUser);
        return;
      } catch {
        // fall through to find by email
      }
    }
    // If no user found in localStorage, you might want to handle this case
    // For now, we'll just keep the user as null and let the login screen handle it

  };





  const handleLogout = () => {
    
    localStorage.removeItem("user");
    setUser(null);
  };

  const canViewDashboard = user?.role === 'admin' || user?.role === 'agent';
  const canCreateTicket = user?.role === 'admin' || user?.role === 'agent';

  return (
    <ThemeProvider theme={sttTheme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <LoginScreen onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
            {/* 
              Root Route Logic:
              - Admin/Agent -> Dashboard
              - Specialist -> Ticket List (Mis Tickets)
            */}
            <Route path="/" element={
              canViewDashboard 
                ? <Dashboard currentUser={user!} /> 
                : <Navigate to="/tickets" replace />
            } />
            
            <Route path="/tickets" element={<TicketList currentUser={user} />} />
            <Route path="/tickets/:id" element={<TicketDetail currentUser={user} />} />
            
            {/* Only allow creation for Admin/Agent */}
            <Route path="/create-ticket" element={
              canCreateTicket 
                ? <TicketForm currentUser={user} /> 
                : <Navigate to="/" />
            } />

            <Route path="/config" element={user?.role === 'admin' ? <AdminConfig /> : <Navigate to="/" />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
