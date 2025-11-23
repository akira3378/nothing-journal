import React from 'react';
import { User } from '../types';
import { Announcements } from '../components/Announcements';
import { useNavigate } from 'react-router-dom';

interface LandingProps {
  user: User | null;
}

const LandingPage: React.FC<LandingProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <header className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-700 via-black to-black"></div>
        
        <h1 className="z-10 text-6xl md:text-9xl font-bold tracking-tighter mb-6 animate-pulse">
          NOTHING
        </h1>
        <p className="z-10 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 tracking-wide leading-relaxed">
          Everything is unimportant. Live the way you like.
          <br/>
          <span className="text-zinc-600 text-sm mt-2 block">Enterprise Technology & Lifestyle</span>
        </p>

        {!user && (
           <button 
             onClick={() => navigate('/register')}
             className="z-10 px-8 py-4 bg-white text-black font-bold text-lg rounded-sm hover:bg-zinc-200 transition-all tracking-widest uppercase"
           >
             Become a Member
           </button>
        )}
      </header>

      {/* Announcements Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="flex items-center mb-12">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="px-4 text-zinc-500 text-sm uppercase tracking-widest">Transmissions</span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>
        <Announcements />
      </section>
      
      <footer className="border-t border-zinc-900 py-12 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} NOTHING CORP. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;