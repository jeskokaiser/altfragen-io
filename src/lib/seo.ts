import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_ORIGIN = 'https://altfragen.io';

export interface PageMeta {
  title: string;
  description: string;
  canonicalPath: string | null;
  robots: 'index, follow' | 'noindex, follow' | 'noindex, nofollow';
}

const DEFAULT_DESCRIPTION =
  'Kreuz die Altfragen deiner Uni online: mit Antwortverteilung deiner Kommiliton:innen, Erklärungen von 5 KI-Modellen und Klausur-Statistik. Kostenlos starten.';

const PUBLIC_ROUTE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Altfragen.io – Altfragen kreuzen im Medizinstudium',
    description: DEFAULT_DESCRIPTION,
    canonicalPath: '/',
    robots: 'index, follow',
  },
  '/agb': {
    title: 'Allgemeine Geschäftsbedingungen (AGB) – Altfragen.io',
    description:
      'Allgemeine Geschäftsbedingungen (AGB) für kostenpflichtige Premium-Dienste (Monatsabo, Semesterabo, Lifetime Premium und KI-Credits) auf Altfragen.io.',
    canonicalPath: '/agb',
    robots: 'index, follow',
  },
  '/privacy': {
    title: 'Datenschutzerklärung – Altfragen.io',
    description:
      'Datenschutzerklärung von Altfragen.io: Informationen zur Datenverarbeitung, Speicherung in Frankfurt am Main, KI-Anbietern und deinen Rechten nach DSGVO.',
    canonicalPath: '/privacy',
    robots: 'index, follow',
  },
  '/terms': {
    title: 'Nutzungsbedingungen – Altfragen.io',
    description:
      'Nutzungsbedingungen für die Online-Lernplattform Altfragen.io zur Klausurvorbereitung mit Altfragen und KI-Kommentaren im Medizinstudium.',
    canonicalPath: '/terms',
    robots: 'index, follow',
  },
  '/widerruf': {
    title: 'Widerrufsrecht & Widerrufsbelehrung – Altfragen.io',
    description:
      'Gesetzliche Widerrufsbelehrung, Informationen zum Wertersatz und Muster-Widerrufsformular für Verbraucherverträge bei Altfragen.io.',
    canonicalPath: '/widerruf',
    robots: 'index, follow',
  },
  '/impressum': {
    title: 'Impressum – Altfragen.io',
    description:
      'Impressum und Anbieterkennzeichnung von Altfragen.io – ein Angebot von KSR Labs, Jesko Kaiser, Hamburg.',
    canonicalPath: '/impressum',
    robots: 'index, follow',
  },
  '/kuendigen': {
    title: 'Verträge kündigen – Altfragen.io',
    description:
      'Hier kannst du dein Premium-Abonnement oder Lifetime Premium bei Altfragen.io online kündigen (§ 312k BGB) – jederzeit und auch ohne Login.',
    canonicalPath: '/kuendigen',
    robots: 'index, follow',
  },
  '/auth': {
    title: 'Anmelden & Registrieren – Altfragen.io',
    description:
      'Melde dich mit deiner Uni-Mail bei Altfragen.io an oder erstelle ein kostenloses Konto, um die Altfragen deiner Universität zu kreuzen.',
    canonicalPath: '/auth',
    robots: 'noindex, follow',
  },
};

const APP_ROUTE_TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard$/, 'Dashboard – Altfragen.io'],
  [/^\/training(?:\/sessions)?$/, 'Trainings-Sessions – Altfragen.io'],
  [/^\/training\/session\/[^/]+\/analytics$/, 'Session-Auswertung – Altfragen.io'],
  [/^\/training\/(?:session\/[^/]+|one-off)$/, 'Training – Altfragen.io'],
  [/^\/exam\/[^/]+\/analytics$/, 'Prüfungs-Statistik – Altfragen.io'],
  [/^\/search$/, 'Fragen durchsuchen – Altfragen.io'],
  [/^\/subscription$/, 'Premium – Altfragen.io'],
  [/^\/settings$/, 'Einstellungen – Altfragen.io'],
  [/^\/tutorial$/, 'Einführung – Altfragen.io'],
  [/^\/ai-commentary$/, 'KI-Kommentare Admin – Altfragen.io'],
  [/^\/unclear-questions\/[^/]+$/, 'Unklare Fragen – Altfragen.io'],
];

export const NOT_FOUND_META: PageMeta = {
  title: 'Seite nicht gefunden (404) – Altfragen.io',
  description: 'Die aufgerufene Seite wurde auf Altfragen.io nicht gefunden.',
  canonicalPath: null,
  robots: 'noindex, nofollow',
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function isProtectedRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return APP_ROUTE_TITLES.some(([pattern]) => pattern.test(normalized));
}

export function resolveRouteMeta(pathname: string): PageMeta {
  const normalized = normalizePath(pathname);

  const publicMeta = PUBLIC_ROUTE_META[normalized];
  if (publicMeta) return publicMeta;

  for (const [pattern, title] of APP_ROUTE_TITLES) {
    if (pattern.test(normalized)) {
      return {
        title,
        description: DEFAULT_DESCRIPTION,
        canonicalPath: null,
        robots: 'noindex, nofollow',
      };
    }
  }

  return NOT_FOUND_META;
}

export function buildCanonicalUrl(canonicalPath: string | null): string {
  if (!canonicalPath || canonicalPath === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
}

function setMetaContent(doc: Document, selector: string, content: string): void {
  const el = doc.querySelector<HTMLMetaElement>(selector);
  if (el) {
    el.setAttribute('content', content);
  }
}

export function applyPageMeta(meta: PageMeta, doc: Document = document): void {
  doc.title = meta.title;

  setMetaContent(doc, 'meta[name="description"]', meta.description);
  setMetaContent(doc, 'meta[name="robots"]', meta.robots);

  const canonicalUrl = buildCanonicalUrl(meta.canonicalPath);
  const canonicalLink = doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', canonicalUrl);
  }

  setMetaContent(doc, 'meta[property="og:title"]', meta.title);
  setMetaContent(doc, 'meta[property="og:description"]', meta.description);
  setMetaContent(doc, 'meta[property="og:url"]', canonicalUrl);
  setMetaContent(doc, 'meta[name="twitter:title"]', meta.title);
  setMetaContent(doc, 'meta[name="twitter:description"]', meta.description);
}

/** Keeps document title, meta description, robots and canonical URL in sync with the current route. */
export const RouteMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    applyPageMeta(resolveRouteMeta(pathname));
  }, [pathname]);

  return null;
};
