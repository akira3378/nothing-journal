import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl font-bold tracking-tighter text-white">NOTHING</span>
            <span className="ml-2 text-xs text-gray-500 tracking-widest border border-gray-700 px-1 rounded">CORP</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {!user ? (
                <>
                  <button onClick={() => navigate('/login')} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</button>
                  <button onClick={() => navigate('/register')} className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-sm text-sm font-bold transition-colors">Join Us</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/feed')} className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Feed</button>
                  <button onClick={() => navigate('/profile')} className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">Profile</button>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => navigate('/admin')} className="text-red-400 hover:text-red-300 px-3 py-2 text-sm font-medium">Admin</button>
                  )}
                  <button onClick={onLogout} className="ml-4 border border-white/20 hover:border-white/50 text-white px-3 py-1.5 rounded-sm text-xs transition-all">Logout</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};