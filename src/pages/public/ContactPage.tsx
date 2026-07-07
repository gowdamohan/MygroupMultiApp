import React from 'react';
import { PublicPageLayout } from './PublicPageLayout';
import { usePublicFooterPage } from '../../hooks/usePublicFooterPage';

export const ContactPage: React.FC = () => {
  const { data, loading, error } = usePublicFooterPage('contact_us');

  const contactItem = data[0] ?? null;

  return (
    <PublicPageLayout
      title="Contact Us"
      subtitle="Get in touch with us — we'd love to hear from you"
      accentColor="#059669"
      loading={loading}
      error={error}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact info panel */}
        <div className="space-y-6">
          {/* HTML content from DB */}
          {contactItem?.content && (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-7">
              <h3 className="text-base font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Contact Information
              </h3>
              <div
                className="prose prose-sm max-w-none text-gray-700
                  [&_p]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed
                  [&_a]:text-emerald-600 [&_a]:hover:underline
                  [&_b]:font-semibold [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: contactItem.content }}
              />
            </div>
          )}

          {/* Quick contact links */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 space-y-3">
            <h3 className="text-sm font-bold text-emerald-800 mb-3">Reach Us</h3>
            {[
              { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: 'contact@gomygroup.online' },
              { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Phone', value: '+91 XXXXX XXXXX' },
              { icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9', label: 'Website', value: 'www.gomygroup.online' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
                  <p className="text-sm text-gray-700 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simple enquiry form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Send Us a Message
          </h3>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
              <input
                type="text"
                placeholder="How can we help?"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message *</label>
              <textarea
                rows={4}
                placeholder="Tell us more…"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </PublicPageLayout>
  );
};
