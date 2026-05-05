import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import type { SiteSettings } from '@/types/settings';

interface FooterProps {
  settings: SiteSettings;
}

// Simple inline SVGs for social icons (no external lib dependency)
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);


export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: '#1a1a2e' }} className="text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {settings.site_logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.site_logo}
                  alt={settings.site_name}
                  className="h-9 w-auto object-contain rounded-lg"
                />
              ) : (
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #C9A227, #D4AF37)' }}
                >
                  {settings.site_name.charAt(0)}
                </div>
              )}
              <span className="font-bold text-lg" style={{ color: '#C9A227' }}>
                {settings.site_name}
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {settings.meta_description ?? "Bangladesh's most trusted premium matrimony platform."}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-4">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-[#C9A227] transition-colors">
                  <FacebookIcon />
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-[#C9A227] transition-colors">
                  <TwitterIcon />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-[#C9A227] transition-colors">
                  <InstagramIcon />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4" style={{ color: '#C9A227' }}>
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Us' },
                { href: '/faq', label: 'FAQ' },
                { href: '/terms', label: 'Terms & Conditions' },
                { href: '/privacy-policy', label: 'Privacy Policy' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 text-sm hover:text-[#C9A227] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4" style={{ color: '#C9A227' }}>
              Contact Us
            </h4>
            <ul className="space-y-3">
              {settings.contact_email && (
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail size={15} className="shrink-0" style={{ color: '#C9A227' }} />
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone size={15} className="shrink-0" style={{ color: '#C9A227' }} />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: '#C9A227' }} />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p>© {currentYear} {settings.site_name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[#C9A227] transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-[#C9A227] transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-[#C9A227] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

