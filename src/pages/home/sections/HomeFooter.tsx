import React from 'react';
import { Link } from 'react-router-dom';
import { CopyRight, SocialLink } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';

interface HomeFooterProps {
  socialLinks: SocialLink[];
  copyRight?: CopyRight | null;
}

/* Each footer column */
interface FooterColumnProps {
  heading: string;
  headingColor: string;
  links: { label: string; to?: string; href?: string; external?: boolean }[];
}

const FooterColumn: React.FC<FooterColumnProps> = ({ heading, headingColor, links }) => (
  <div>
    <h3 className={`font-bold text-sm mb-3 ${headingColor}`}>{heading}</h3>
    <ul className="space-y-1.5 text-xs">
      {links.map(({ label, to, href, external }) => (
        <li key={label}>
          {to ? (
            <Link to={to} className="text-gray-400 hover:text-white transition-colors">
              {label}
            </Link>
          ) : href ? (
            <a
              href={href}
              target={external ? '_blank' : '_self'}
              rel={external ? 'noopener noreferrer' : undefined}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {label}
            </a>
          ) : (
            <span className="text-gray-500">{label}</span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export const HomeFooter: React.FC<HomeFooterProps> = ({
  socialLinks,
  copyRight,
}) => {
  return (
    <footer className="home-footer bg-gray-900 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* 6-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8">

          <FooterColumn
            heading="Know Us"
            headingColor="text-teal-400"
            links={[
              { label: 'Home',         to: '/' },
              { label: 'About Us',     to: '/about' },
              { label: 'Clients',      to: '/clients' },
              { label: 'Milestones',   to: '/milestones' },
              { label: 'Testimonials', to: '/testimonials' },
            ]}
          />

          <FooterColumn
            heading="Media"
            headingColor="text-teal-400"
            links={[
              { label: 'Newsroom', to: '/newsroom' },
              { label: 'Gallery',  to: '/gallery' },
              { label: 'Awards',   to: '/awards' },
              { label: 'Events',   to: '/events' },
            ]}
          />

          <FooterColumn
            heading="Opportunity"
            headingColor="text-teal-400"
            links={[
              { label: 'Careers',   to: '/careers' },
              { label: 'My Jobs',   to: '/careers' },
              { label: 'Franchise', to: '/partner' },
              { label: 'Advertise', to: '/contact' },
            ]}
          />

          <FooterColumn
            heading="Our Policy"
            headingColor="text-teal-400"
            links={[
              { label: 'Privacy Policy', to: '/privacy' },
              { label: 'Terms',          to: '/terms' },
              { label: "FAQ's",          to: '/faq' },
            ]}
          />

          <FooterColumn
            heading="Support"
            headingColor="text-teal-400"
            links={[
              { label: 'Contact Us', to: '/contact' },
              { label: 'Enquiry',    to: '/contact' },
              { label: 'Feedback',   to: '/contact' },
            ]}
          />

          <FooterColumn
            heading="Logins"
            headingColor="text-teal-400"
            links={[
              { label: 'Partner Login', to: '/partner' },
              { label: 'Franchise',     to: '/partner' },
              { label: 'Reporters',     to: '/reporter/login' },
            ]}
          />
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
                    <span className="text-xs font-bold text-white">
                      {social.platform?.charAt(0).toUpperCase()}
                    </span>
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
