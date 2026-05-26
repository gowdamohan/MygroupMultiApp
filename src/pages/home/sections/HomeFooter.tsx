import React from 'react';
import { Link } from 'react-router-dom';
import { CopyRight, SocialLink } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';

interface HomeFooterProps {
  socialLinks: SocialLink[];
  copyRight?: CopyRight | null;
}

export const HomeFooter: React.FC<HomeFooterProps> = ({ socialLinks, copyRight }) => {
  return (
    <footer className="home-footer bg-gray-900 text-white py-10 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Know Us</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/" className="hover:text-teal-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-teal-400 transition-colors">About Us</Link></li>
              <li><Link to="/clients" className="hover:text-teal-400 transition-colors">Clients</Link></li>
              <li><Link to="/milestones" className="hover:text-teal-400 transition-colors">Milestones</Link></li>
              <li><Link to="/testimonials" className="hover:text-teal-400 transition-colors">Testimonials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Media</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/newsroom" className="hover:text-teal-400 transition-colors">Newsroom</Link></li>
              <li><Link to="/gallery" className="hover:text-teal-400 transition-colors">Gallery</Link></li>
              <li><Link to="/awards" className="hover:text-teal-400 transition-colors">Awards</Link></li>
              <li><Link to="/events" className="hover:text-teal-400 transition-colors">Events</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Opportunity</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/careers" className="hover:text-teal-400 transition-colors">Careers</Link></li>
              <li><Link to="/jobs" className="hover:text-teal-400 transition-colors">My Jobs</Link></li>
              <li><Link to="/franchise" className="hover:text-teal-400 transition-colors">Franchise</Link></li>
              <li><Link to="/advertise" className="hover:text-teal-400 transition-colors">Advertise</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Our Policy</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-teal-400 transition-colors">Terms</Link></li>
              <li><Link to="/faq" className="hover:text-teal-400 transition-colors">FAQ&apos;s</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Support</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/contact" className="hover:text-teal-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/enquiry" className="hover:text-teal-400 transition-colors">Enquiry</Link></li>
              <li><Link to="/feedback" className="hover:text-teal-400 transition-colors">Feedback</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm mb-3 text-teal-400">Logins</h3>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/client-login/Mygroup" className="hover:text-teal-400 transition-colors">Client Login</Link></li>
              <li><Link to="/franchise-login" className="hover:text-teal-400 transition-colors">Franchise</Link></li>
              <li><Link to="/reporter/login" className="hover:text-teal-400 transition-colors">Reporters</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex justify-center gap-4 mb-4 flex-wrap">
            {socialLinks?.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
                title={social.platform}
              >
                {social.icon ? (
                  <img
                    src={resolveImageUrl(social.icon)}
                    alt={social.platform}
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold">{social.platform?.charAt(0).toUpperCase()}</span>
                )}
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">
            &copy; {copyRight?.year || new Date().getFullYear()}{' '}
            {copyRight?.company_name || copyRight?.text || 'Mygroup'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
