import React from 'react';
import { Link } from 'react-router-dom';
import { CopyRight, SocialLink, FooterPageItem } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';

interface HomeFooterProps {
  socialLinks: SocialLink[];
  copyRight?: CopyRight | null;
  /** footer_page items passed from homeData for dynamic link display */
  eventsList?: FooterPageItem[];
  newsroomList?: FooterPageItem[];
  awardsList?: FooterPageItem[];
  clients?: FooterPageItem[];
}

export const HomeFooter: React.FC<HomeFooterProps> = ({
  socialLinks,
  copyRight,
  eventsList = [],
  newsroomList = [],
  awardsList = [],
  clients = [],
}) => {
  return (
    <footer className="home-footer bg-gray-900 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* Brand + tagline */}
        <div className="mb-8 pb-6 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-teal-400">Mygroup</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enterprise Platform — Connecting People, Apps &amp; Opportunities</p>
          </div>
        </div>

        {/* 6-column links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8">

          {/* Know Us */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Know Us</h3>
            <ul className="space-y-1.5 text-xs">
              <li><a href="/#" className="hover:text-teal-400 transition-colors text-gray-400">Home</a></li>
              <li><a href="/#clients" className="hover:text-teal-400 transition-colors text-gray-400">Our Clients</a></li>
              <li><a href="/#testimonials" className="hover:text-teal-400 transition-colors text-gray-400">Testimonials</a></li>
              <li><a href="/#gallery" className="hover:text-teal-400 transition-colors text-gray-400">Gallery</a></li>
              {clients.length > 0 && clients.slice(0, 2).map((c) => c.title && (
                <li key={c.id}>
                  <a href={c.url || '/#'} target={c.url ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="hover:text-teal-400 transition-colors text-gray-400 line-clamp-1">
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Events */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-indigo-400">Events</h3>
            <ul className="space-y-1.5 text-xs">
              <li><a href="/#events" className="hover:text-indigo-400 transition-colors text-gray-400">All Events</a></li>
              {eventsList.slice(0, 4).map((ev) => ev.title && (
                <li key={ev.id}>
                  <a href={ev.url || '/#events'} target={ev.url ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="hover:text-indigo-400 transition-colors text-gray-400 line-clamp-1">
                    {ev.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsroom */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-blue-400">Newsroom</h3>
            <ul className="space-y-1.5 text-xs">
              <li><a href="/#newsroom" className="hover:text-blue-400 transition-colors text-gray-400">Latest News</a></li>
              {newsroomList.slice(0, 4).map((item) => item.title && (
                <li key={item.id}>
                  <a href={item.url || '/#newsroom'} target={item.url ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors text-gray-400 line-clamp-1">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Awards */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-amber-400">Awards</h3>
            <ul className="space-y-1.5 text-xs">
              <li><a href="/#awards" className="hover:text-amber-400 transition-colors text-gray-400">Our Awards</a></li>
              {awardsList.slice(0, 4).map((item) => item.title && (
                <li key={item.id}>
                  <a href={item.url || '/#awards'} target={item.url ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="hover:text-amber-400 transition-colors text-gray-400 line-clamp-1">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunity */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Opportunity</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/register" className="hover:text-teal-400 transition-colors text-gray-400">Register</Link></li>
              <li><a href="/#advertise" className="hover:text-teal-400 transition-colors text-gray-400">Advertise</a></li>
              <li><a href="/#franchise" className="hover:text-teal-400 transition-colors text-gray-400">Franchise</a></li>
              <li><a href="/#careers" className="hover:text-teal-400 transition-colors text-gray-400">Careers</a></li>
              <li><a href="/#jobs" className="hover:text-teal-400 transition-colors text-gray-400">My Jobs</a></li>
            </ul>
          </div>

          {/* Logins & Support */}
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Logins</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/partner" className="hover:text-teal-400 transition-colors text-gray-400">Partner Login</Link></li>
              <li><Link to="/reporter/login" className="hover:text-teal-400 transition-colors text-gray-400">Reporter Login</Link></li>
              <li><Link to="/admin/login" className="hover:text-teal-400 transition-colors text-gray-400">Admin Login</Link></li>
              <li><Link to="/partner/register" className="hover:text-teal-400 transition-colors text-gray-400">Partner Register</Link></li>
              <li><a href="/#privacy" className="hover:text-teal-400 transition-colors text-gray-400">Privacy Policy</a></li>
              <li><a href="/#terms" className="hover:text-teal-400 transition-colors text-gray-400">Terms</a></li>
            </ul>
          </div>
        </div>

        {/* Social links + copyright */}
        <div className="border-t border-gray-700 pt-6">
          {socialLinks?.length > 0 && (
            <div className="flex justify-center gap-3 mb-4 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                  title={social.platform}
                >
                  {social.icon ? (
                    <img
                      src={resolveImageUrl(social.icon)}
                      alt={social.platform}
                      className="w-4 h-4 object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white">{social.platform?.charAt(0).toUpperCase()}</span>
                  )}
                </a>
              ))}
            </div>
          )}
          <p className="text-center text-xs text-gray-500">
            &copy; {copyRight?.year || new Date().getFullYear()}{' '}
            {copyRight?.company_name || copyRight?.text || 'Mygroup'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
