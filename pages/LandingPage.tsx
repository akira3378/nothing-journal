import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { Announcements } from '../components/Announcements';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/i18n';
import { getSiteConfig } from '../services/mockBackend';

interface LandingProps {
  user: User | null;
}

const LandingPage: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
      getSiteConfig().then(config => {
          if (config.landingVideoUrl) {
              setVideoUrl(config.landingVideoUrl);
          }
      });
  }, []);

  // Helper to extract ID
  const getYoutubeEmbedUrl = (url: string) => {
      if (!url) return null;
      // Handle standard and short URLs
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      // Enabled controls: controls=1
      return id ? `https://www.youtube.com/embed/${id}?autoplay=0&controls=1&rel=0&modestbranding=1` : null;
  };

  const embedSrc = videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <header className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden bg-white dark:bg-nothing-black transition-colors duration-300">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-400 via-white to-white dark:from-zinc-700 dark:via-black dark:to-black"></div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        
        <h1 className="z-10 text-6xl md:text-9xl font-bold tracking-tighter mb-6 animate-slideUp text-black dark:text-white">
          {t('landing_hero_1')}
        </h1>
        {/* Updated Font to use DotGothic16 via 'font-dots' */}
        <p className="z-10 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 tracking-wide leading-relaxed animate-slideUp font-dots" style={{animationDelay: '0.1s'}}>
          {t('landing_hero_2')}
        </p>

        {!user && (
           <button 
             onClick={() => navigate('/register')}
             className="z-10 px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all tracking-widest uppercase animate-slideUp"
             style={{animationDelay: '0.2s'}}
           >
             {t('landing_btn')}
           </button>
        )}
      </header>

      {/* Video Section (If Configured) */}
      {embedSrc && (
          <section className="w-full py-16 px-4 sm:px-6 animate-fadeIn bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-100 dark:border-zinc-900">
              <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                           {t('transmissions').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">CH.01</span>
                          <span className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700">REC • HD</span>
                      </div>
                  </div>

                  <div className="relative group">
                      {/* Decorative outer frame elements */}
                      <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-zinc-300 dark:border-zinc-700"></div>
                      <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-zinc-300 dark:border-zinc-700"></div>
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-zinc-300 dark:border-zinc-700"></div>
                      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-zinc-300 dark:border-zinc-700"></div>

                      <div className="relative p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-sm">
                          <div className="relative aspect-video w-full bg-black rounded-[1px] overflow-hidden">
                              <iframe 
                                src={embedSrc} 
                                className="w-full h-full" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                title="Brand Video"
                              ></iframe>
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center px-1">
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-12"></div>
                      <div className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono tracking-[0.2em] uppercase">Signal Strength: 100%</div>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-12"></div>
                  </div>
              </div>
          </section>
      )}

      {/* Announcements Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="flex items-center mb-12">
          <div className="h-px bg-zinc-300 dark:bg-zinc-800 flex-1"></div>
          <span className="px-4 text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-[0.3em]">{t('transmissions')}</span>
          <div className="h-px bg-zinc-300 dark:bg-zinc-800 flex-1"></div>
        </div>
        <Announcements />
      </section>
      
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-12 text-center text-zinc-500 dark:text-zinc-600 text-xs font-mono tracking-wider">
        <p>&copy; {new Date().getFullYear()} {t('footer_rights')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;