import React from 'react';
import { Link } from 'react-router-dom';
import { CopyRight, SocialLink, FooterPageItem } from '../../../types/home.types';
import { resolveImageUrl } from '../utils';

/** Build footer links from footer_page items, capping label length */
const makeItemLinks = (
  items: FooterPageItem[],
  path: string,
  max = 4,
): { label: string; to: string }[] =>
  items
    .slice(0, max)
    .filter((item): item is FooterPageItem & { title: string } =>
      typeof item.title === 'string' && item.title.trim().length > 0
    )
    .map((item) => ({
      label: item.title.length > 28 ? `${item.title.slice(0, 27)}…` : item.title,
      to: path,
    }));

interface HomeFooterProps {
  socialLinks: SocialLink[];
  copyRight?: CopyRight | null;
  eventsList?: FooterPageItem[];
  newsroomList?: FooterPageItem[];
  awardsList?: FooterPageItem[];
  clients?: FooterPageItem[];
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
  eventsList = [],
  newsroomList = [],
  awardsList = [],
  clients = [],
}) => {
  return (
    <footer className="home-footer bg-gray-900 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* Brand tagline */}
        <div className="mb-8 pb-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-teal-400">Mygroup</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Enterprise Platform — Connecting People, Apps &amp; Opportunities
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Serving from{' '}
              <a href="https://gomygroup.online" target="_blank" rel="noopener noreferrer"
                className="text-teal-500 hover:text-teal-400">
                gomygroup.online
              </a>
            </p>
          </div>
        </div>

        {/* 6-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8">

          {/* Know Us */}
          <FooterColumn
            heading="Know Us"
            headingColor="text-teal-400"
            links={[
              { label: 'Home',         to: '/' },
              { label: 'About Us',     to: '/about' },
              { label: 'Our Clients',  to: '/clients' },
              { label: 'Milestones',   to: '/milestones' },
              { label: 'Testimonials', to: '/testimonials' },
            ]}
          />

          {/* Events */}
          <FooterColumn
            heading="Events"
            headingColor="text-indigo-400"
            links={[{ label: 'All Events', to: '/events' }, ...makeItemLinks(eventsList, '/events')]}
          />

          {/* Newsroom */}
          <FooterColumn
            heading="Newsroom"
            headingColor="text-sky-400"
            links={[{ label: 'Latest News', to: '/newsroom' }, ...makeItemLinks(newsroomList, '/newsroom')]}
          />

          {/* Awards */}
          <FooterColumn
            heading="Awards"
            headingColor="text-amber-400"
            links={[{ label: 'Our Awards', to: '/awards' }, ...makeItemLinks(awardsList, '/awards')]}
          />

          {/* Opportunity */}
          <FooterColumn
            heading="Opportunity"
            headingColor="text-teal-400"
            links={[
              { label: 'Register',    to: '/register' },
              { label: 'Contact Us',  to: '/contact' },
              { label: 'Advertise',   href: '/#advertise' },
              { label: 'Franchise',   href: '/#franchise' },
              { label: 'Careers',     href: '/#careers' },
              { label: 'Gallery',     href: '/#gallery' },
            ]}
          />

          {/* Logins & Legal */}
          <FooterColumn
            heading="More"
            headingColor="text-teal-400"
            links={[
              { label: 'Partner Login',    to: '/partner' },
              { label: 'Reporter Login',   to: '/reporter/login' },
              { label: 'Admin Login',      to: '/admin/login' },
              { label: 'Partner Register', to: '/partner/register' },
              { label: 'Privacy Policy',   to: '/privacy' },
              { label: 'Terms & Conditions', to: '/terms' },
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
