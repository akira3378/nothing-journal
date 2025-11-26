import React, { useEffect, useState } from 'react';
import { User, Announcement } from '../types';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/i18n';
import { getSiteConfig, getAnnouncements } from '../services/mockBackend';
import { Icons, Button } from '../components/UI';

interface LandingProps {
  user: User | null;
}

const LandingPage: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    getSiteConfig().then(config => {
      if (config.landingVideoUrl) {
        setVideoUrl(config.landingVideoUrl);
      }
    });
    getAnnouncements().then(setAnnouncements);
  }, []);

  // Helper to extract ID
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}?autoplay=0&controls=1&rel=0&modestbranding=1` : null;
  };

  const embedSrc = videoUrl ? getYoutubeEmbedUrl(videoUrl) : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-white dark:bg-black transition-colors duration-500">

      {/* Hero Section */}
      {/* Hero Section */}
      <header className="relative flex flex-col items-center justify-center text-center px-4 py-32 md:py-48">
        {/* Abstract Background Elements - Wrapped to prevent overflow but allow content overflow */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-zinc-100 to-transparent dark:from-zinc-900/50 dark:to-transparent rounded-full blur-3xl opacity-50"></div>
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        <div className="z-10 relative">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 animate-slideUp text-black dark:text-white mix-blend-difference">
            {t('landing_hero_1')}
          </h1>
          <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-12 tracking-widest font-light animate-slideUp" style={{ animationDelay: '0.1s' }}>
            {t('landing_hero_2')}
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => navigate('/register')}
                className="group relative px-10 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-full hover:scale-105 active:scale-95 transition-all duration-300 tracking-widest uppercase shadow-xl hover:shadow-2xl hover:shadow-black/20 dark:hover:shadow-white/20"
              >
                <span className="relative z-10">{t('join_us')}</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-zinc-800 to-black dark:from-zinc-200 dark:to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-4 bg-transparent border border-zinc-300 dark:border-zinc-700 text-black dark:text-white font-bold text-sm rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-black dark:hover:border-white active:scale-95 transition-all duration-300 tracking-widest uppercase backdrop-blur-sm"
              >
                {t('login')}
              </button>
            </div>
          )}
        </div>
      </header>



      {/* Video Section (Clean) */}
      {embedSrc && (
        <section className="w-full py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-black">
              <div className="aspect-video w-full">
                <iframe
                  src={embedSrc}
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Brand Video"
                ></iframe>
              </div>
              {/* Glass overlay effect */}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-2xl"></div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Updates (News List) */}
      {announcements.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-24 w-full">
          <div className="flex items-baseline justify-between mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">{t('latest_updates')}</h2>
            <span className="text-xs font-mono text-zinc-400">{announcements.length}</span>
          </div>

          <div className="space-y-12">
            {announcements.map((item) => (
              <article key={item.id} className="group flex flex-col md:flex-row gap-8 items-start">
                {item.mediaUrl && (
                  <div className="w-full md:w-64 aspect-video rounded-sm overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                    <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-sm uppercase tracking-wider">
                      {item.type || 'NEWS'}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-3 group-hover:underline decoration-1 underline-offset-4">{item.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed line-clamp-3">{item.content}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-12 text-center text-zinc-400 dark:text-zinc-600 text-[10px] font-mono tracking-widest uppercase">
        <p>&copy; {new Date().getFullYear()} {t('footer_rights')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;