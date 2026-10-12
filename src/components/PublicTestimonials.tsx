import React from 'react';
import { MessageSquareQuote, UserRound } from 'lucide-react';
import { Settings } from '../types.js';

export default function PublicTestimonials({ testimonials }: { testimonials?: Settings['testimonials'] }) {
  const visible = (testimonials || []).filter(item => item && item.name?.trim() && item.quote?.trim());
  if (!visible.length) return null;

  return (
    <section className="bg-[#071b35] text-white py-16 sm:py-20" aria-labelledby="customer-stories-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-9">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-300"><MessageSquareQuote size={15} /> Customer stories</span>
          <h2 id="customer-stories-title" className="mt-3 text-3xl sm:text-4xl font-display font-bold tracking-tight">Experiences that move us forward.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Feedback shared by customers about their delivery experience.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((item, index) => (
            <figure key={item.name + '-' + index} className="rounded-2xl border border-white/10 bg-white/[.06] p-6 shadow-sm">
              <div className="text-blue-300 text-3xl leading-none" aria-hidden="true">“</div>
              <blockquote className="mt-2 text-sm leading-7 text-slate-100">{item.quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                {item.photoUrl ? <img src={item.photoUrl} alt={item.name} loading="lazy" referrerPolicy="no-referrer" className="h-11 w-11 rounded-full object-cover bg-slate-800" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="h-11 w-11 rounded-full bg-blue-500/15 text-blue-200 flex items-center justify-center"><UserRound size={19} /></span>}
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{item.name}</span>{item.role && <span className="mt-0.5 block truncate text-xs text-slate-400">{item.role}</span>}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
