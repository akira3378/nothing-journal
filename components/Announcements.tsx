import React, { useEffect, useState } from 'react';
import { Announcement } from '../types';
import { getAnnouncements } from '../services/mockBackend';

export const Announcements: React.FC = () => {
  const [data, setData] = useState<Announcement[]>([]);

  useEffect(() => {
    getAnnouncements().then(setData);
  }, []);

  if (data.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
      {data.map((item) => (
        <div key={item.id} className="group bg-zinc-900 border border-zinc-800 p-6 rounded-sm hover:border-zinc-600 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</span>
            <div className="h-1 w-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{item.title}</h3>
          {item.mediaUrl && (
            <img src={item.mediaUrl} alt="Announcement Media" className="w-full h-48 object-cover rounded-sm mb-4 grayscale hover:grayscale-0 transition-all duration-500" />
          )}
          <p className="text-zinc-400 text-sm leading-relaxed">{item.content}</p>
        </div>
      ))}
    </div>
  );
};