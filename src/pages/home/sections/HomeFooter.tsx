import React from 'react';
import { Link } from 'react-router-dom';
import { CopyRight, SocialLink } from '../../../types/home.types';
import { FooterSocialBar } from './FooterSocialBar';

interface HomeFooterProps {
  socialLinks: SocialLink[];
  copyRight?: CopyRight | null;
}

/* Each footer column */
interface FooterColumnProps {
  heading: string;
  links: { label: string; to?: string; href?: string; external?: boolean }[];
}

const FooterColumn: React.FC<FooterColumnProps> = ({ heading, links }) => (
  <div>
    <h3 className="home-footer-heading font-bold text-sm mb-3">{heading}</h3>
    <ul className="space-y-1.5 text-xs">
      {links.map(({ label, to, href, external }) => (
        <li key={label}>
          {to ? (
            <Link to={to} className="home-footer-link">
              {label}
            </Link>
          ) : href ? (
            <a
              href={href}
              target={external ? '_blank' : '_self'}
              rel={external ? 'noopener noreferrer' : undefined}
              className="home-footer-link"
            >
              {label}
            </a>
          ) : (
            <span className="home-footer-label cursor-default">{label}</span>
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
    <footer className="home-footer pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8">

        {/* 6-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8">

          <FooterColumn
            heading="Know Us"
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
            links={[
              { label: 'Newsroom', to: '/newsroom' },
              { label: 'Gallery',  to: '/gallery' },
              { label: 'Awards',   to: '/awards' },
              { label: 'Events',   to: '/events' },
            ]}
          />

          <FooterColumn
            heading="Opportunity"
            links={[
              { label: 'Careers',   to: '/careers' },
              { label: 'My Jobs',   to: '/careers' },
              { label: 'Advertise' },
            ]}
          />

          <FooterColumn
            heading="Our Policy"
            links={[
              { label: 'Privacy Policy', to: '/privacy' },
              { label: 'Terms',          to: '/terms' },
              { label: "FAQ's",          to: '/faq' },
            ]}
          />

          <FooterColumn
            heading="Support"
            links={[
              { label: 'Contact Us', to: '/contact' },
              { label: 'Enquiry',    to: '/enquiry' },
              { label: 'Feedback',   to: '/contact' },
            ]}
          />

          <FooterColumn
            heading="Logins"
            links={[
              { label: 'Partner Login', to: '/partner' },
              { label: 'Franchise' },
              { label: 'Reporters' },
            ]}
          />
        </div>

        {/* Follow us — social icons + copyright */}
        <FooterSocialBar socialLinks={socialLinks} />
        <div className="home-footer-divider border-t pt-5 pb-1">
          <p className="text-center text-xs home-footer-copy">
            &copy; {copyRight?.year || new Date().getFullYear()}{' '}
            {copyRight?.company_name || copyRight?.text || 'Mygroup'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
