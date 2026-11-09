import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

const links = [
  { to: '/impressum', label: 'Impressum' },
  { to: '/privacy', label: 'Datenschutz' },
  { to: '/terms', label: 'Nutzungsbedingungen' },
  { to: '/agb', label: 'AGB' },
  { to: '/widerruf', label: 'Widerrufsrecht' },
  { to: '/kuendigen', label: 'Verträge hier kündigen' },
];

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background">
      <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href="https://github.com/jeskokaiser/altfragen-io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
        >
          <Github aria-hidden="true" className="size-4" />
          Code auf GitHub (GPL-3.0)
        </a>
      </div>
    </footer>
  );
};

export default Footer;
