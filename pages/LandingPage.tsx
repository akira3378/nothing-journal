import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useApp } from '../utils/i18n';

interface LandingProps {
  user: User | null;
}

const LandingPage: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useApp();

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-white dark:bg-black transition-colors duration-500">
      <header className="relative flex flex-col items-center justify-center text-center px-4 py-32 md:py-48 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-zinc-100 to-transparent dark:from-zinc-900/50 dark:to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        <div className="z-10 relative max-w-4xl">
          <p className="text-xs md:text-sm font-mono tracking-[0.35em] text-zinc-400 mb-6 animate-slideUp uppercase">{t('journal_entry')}</p>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-6 animate-slideUp text-black dark:text-white mix-blend-difference">
            {t('landing_hero_1')}
          </h1>
          <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-12 tracking-wide font-light animate-slideUp" style={{ animationDelay: '0.1s' }}>
            {t('landing_hero_2')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => navigate('/journal')}
              className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition-all duration-300 tracking-widest uppercase shadow-xl"
            >
              {t('explore_journal')}
            </button>
            <button
              onClick={() => navigate(user ? '/journal' : '/login')}
              className="px-10 py-4 bg-transparent border border-zinc-300 dark:border-zinc-700 text-black dark:text-white font-bold text-sm rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-black dark:hover:border-white active:scale-95 transition-all duration-300 tracking-widest uppercase"
            >
              {user ? t('manage_journal') : t('write_note')}
            </button>
          </div>
        </div>
      </header>

      <section className="border-y border-zinc-100 dark:border-zinc-900 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-2">01</p>
            <h2 className="font-bold text-black dark:text-white mb-2">{t('latest_journeys')}</h2>
            <p className="text-sm text-zinc-500">{t('journal_subtitle')}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-2">02</p>
            <h2 className="font-bold text-black dark:text-white mb-2">{t('travel_notes')}</h2>
            <p className="text-sm text-zinc-500">{t('read_note')}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-2">03</p>
            <h2 className="font-bold text-black dark:text-white mb-2">{t('write_note')}</h2>
            <p className="text-sm text-zinc-500">{t('login_to_write')}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-12 text-center text-zinc-400 dark:text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
        <p>&copy; {new Date().getFullYear()} {t('footer_rights')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
