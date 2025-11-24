
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { Announcements } from '../components/Announcements';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../utils/i18n';
import { getSiteConfig } from '../services/mockBackend';
import { motion, useScroll, useTransform } from 'framer-motion';

interface LandingProps {
  user: User | null;
}

const LandingPage: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Hero Section */}
      <header className="relative h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-white dark:bg-nothing-black transition-colors duration-500">
        <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-400 via-white to-white dark:from-zinc-800 dark:via-black dark:to-black"></div>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <motion.div
          style={{ y: y1, opacity }}
          variants={container}
          initial="hidden"
          animate="show"
          className="z-10 relative max-w-5xl mx-auto"
        >
          <motion.h1
            variants={item}
            className="text-7xl md:text-9xl lg:text-[10rem] font-bold tracking-tighter mb-8 text-black dark:text-white leading-[0.9]"
          >
            {t('landing_hero_1')}
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 tracking-wide leading-relaxed font-dots"
          >
            {t('landing_hero_2')}
          </motion.p>

          {!user && (
            <motion.button
              variants={item}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all tracking-[0.2em] uppercase shadow-xl"
            >
              {t('landing_btn')}
            </motion.button>
          )}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-zinc-400 to-transparent"></div>
        </motion.div>
      </header>

      {/* Video Section (If Configured) */}
      {embedSrc && (
        <section className="w-full py-24 px-4 sm:px-6 bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-100 dark:border-zinc-900 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
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
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-zinc-300 dark:border-zinc-700 transition-all group-hover:-top-3 group-hover:-left-3"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-zinc-300 dark:border-zinc-700 transition-all group-hover:-top-3 group-hover:-right-3"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-zinc-300 dark:border-zinc-700 transition-all group-hover:-bottom-3 group-hover:-left-3"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-zinc-300 dark:border-zinc-700 transition-all group-hover:-bottom-3 group-hover:-right-3"></div>

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

            <div className="mt-4 flex justify-between items-center px-1 opacity-50">
              <div className="h-px bg-zinc-300 dark:bg-zinc-700 w-24"></div>
              <div className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono tracking-[0.2em] uppercase">Signal Strength: 100%</div>
              <div className="h-px bg-zinc-300 dark:bg-zinc-700 w-24"></div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Announcements Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
        <div className="flex items-center mb-16">
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
          <span className="px-6 text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-[0.4em] font-bold">{t('transmissions')}</span>
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
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