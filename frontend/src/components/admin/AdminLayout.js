import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Calendar, Mail, Settings, LogOut, Home, Image, MessageSquare, Clock, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/homepage-content', icon: Home, label: 'Page d\'accueil' },
    { path: '/admin/prestations', icon: Package, label: 'Prestations' },
    { path: '/admin/reservations', icon: Calendar, label: 'Réservations' },
    { path: '/admin/horaires', icon: Clock, label: 'Horaires' },
    { path: '/admin/avant-apres', icon: Image, label: 'Avant/Après' },
    { path: '/admin/temoignages', icon: MessageSquare, label: 'Témoignages' },
    { path: '/admin/contacts', icon: Mail, label: 'Messages' },
    { path: '/admin/parametres', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-border rounded-sm shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 sm:p-6 border-b border-border">
          <img src="/logo.png" alt="Logo" className="h-12 sm:h-16 mx-auto" />
          <h2 className="text-center mt-3 sm:mt-4 font-serif text-base sm:text-lg">Administration</h2>
        </div>

        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-sm mb-2 transition-colors text-sm ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-sm w-full text-foreground hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}