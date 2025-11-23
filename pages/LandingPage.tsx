import React from 'react';
import { User } from '../types';
import { Announcements } from '../components/Announcements';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/i18n';

interface LandingProps {
  user: User | null;
}

const LandingPage: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useApp();

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <header className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden bg-white dark:bg-nothing-black transition-colors duration-300">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-400 via-white to-white dark:from-zinc-700 dark:via-black dark:to-black"></div>
        
        <h1 className="z-10 text-6xl md:text-9xl font-bold tracking-tighter mb-6 animate-pulse text-black dark:text-white">
          {t('landing_hero_1')}
        </h1>
        <p className="z-10 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 tracking-wide leading-relaxed">
          {t('landing_hero_2')}
          <br/>
          <span className="text-zinc-400 dark:text-zinc-600 text-sm mt-2 block">{t('landing_hero_sub')}</span>
        </p>

        {!user && (
           <button 
             onClick={() => navigate('/register')}
             className="z-10 px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all tracking-widest uppercase"
           >
             {t('landing_btn')}
           </button>
        )}
      </header>

      {/* Announcements Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="flex items-center mb-12">
          <div className="h-px bg-zinc-300 dark:bg-zinc-800 flex-1"></div>
          <span className="px-4 text-zinc-400 dark:text-zinc-500 text-sm uppercase tracking-widest">{t('transmissions')}</span>
          <div className="h-px bg-zinc-300 dark:bg-zinc-800 flex-1"></div>
        </div>
        <Announcements />
      </section>
      
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-12 text-center text-zinc-500 dark:text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} {t('footer_rights')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;