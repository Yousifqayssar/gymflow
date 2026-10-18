import { Link } from 'react-router';
import { Mail, MapPin, Phone } from 'lucide-react';
import { GYM, OPENING_HOURS, SOCIAL_LINKS } from '../config/gym.js';
import Logo from './ui/Logo.jsx';
import SocialIcon from './ui/SocialIcon.jsx';

// Calculated once when the app loads; components should not read the clock while rendering.
const CURRENT_YEAR = new Date().getFullYear();

// Footer at the bottom of every page after login: about the gym, links, hours, contact, social media.
// `links` are the menu entries of the logged-in user's role.
function SiteFooter({ links }) {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{GYM.tagline}</p>
          <ul className="mt-5 flex gap-2" aria-label="Social media">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="flex size-10 items-center justify-center rounded-xl border border-line text-ink-3 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                >
                  <SocialIcon platform={social.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold text-ink">Quick links</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted transition hover:text-brand-700 dark:hover:text-brand-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-ink">Opening hours</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {OPENING_HOURS.map((row) => (
              <li key={row.label} className="flex justify-between gap-4">
                <span>{row.label}</span>
                <span className="font-mono text-ink-3">
                  {row.open}–{row.close}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{GYM.address.join(', ')}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a href={`tel:${GYM.phone.replaceAll(' ', '')}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                {GYM.phone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${GYM.email}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                {GYM.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-faint sm:px-6 lg:px-8">
          <p>
            © {CURRENT_YEAR} {GYM.name}. All rights reserved.
          </p>
          <p>Made with care in Istanbul</p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
