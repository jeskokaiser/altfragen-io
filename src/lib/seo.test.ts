import { describe, expect, it } from 'vitest';
import {
  applyPageMeta,
  buildCanonicalUrl,
  isProtectedRoute,
  NOT_FOUND_META,
  resolveRouteMeta,
} from './seo';

describe('resolveRouteMeta', () => {
  it('returns indexable metadata with <60 char title and 150-160 char description for the landing page', () => {
    const meta = resolveRouteMeta('/');
    expect(meta.title).toBe('Altfragen.io – Altfragen kreuzen im Medizinstudium');
    expect(meta.title.length).toBeLessThan(60);
    expect(meta.description.length).toBeGreaterThanOrEqual(145);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.canonicalPath).toBe('/');
    expect(meta.robots).toBe('index, follow');
  });

  it('normalizes trailing slashes on public legal routes', () => {
    expect(resolveRouteMeta('/agb/')).toEqual(resolveRouteMeta('/agb'));
    expect(resolveRouteMeta('/privacy').robots).toBe('index, follow');
    expect(resolveRouteMeta('/impressum').canonicalPath).toBe('/impressum');
    expect(resolveRouteMeta('/terms').canonicalPath).toBe('/terms');
    expect(resolveRouteMeta('/widerruf').canonicalPath).toBe('/widerruf');
    expect(resolveRouteMeta('/kuendigen').canonicalPath).toBe('/kuendigen');
  });

  it('marks /auth as noindex, follow and authenticated app routes as noindex, nofollow', () => {
    expect(resolveRouteMeta('/auth').robots).toBe('noindex, follow');
    expect(resolveRouteMeta('/dashboard')).toMatchObject({
      title: 'Dashboard – Altfragen.io',
      robots: 'noindex, nofollow',
      canonicalPath: null,
    });
    expect(resolveRouteMeta('/training/session/abc-123')).toMatchObject({
      title: 'Training – Altfragen.io',
      robots: 'noindex, nofollow',
    });
    expect(resolveRouteMeta('/exam/42/analytics')).toMatchObject({
      title: 'Prüfungs-Statistik – Altfragen.io',
      robots: 'noindex, nofollow',
    });
  });

  it('returns 404 metadata with noindex, nofollow for unknown paths', () => {
    expect(resolveRouteMeta('/gibts-nicht')).toEqual(NOT_FOUND_META);
    expect(resolveRouteMeta('/training/unknown/subpath')).toEqual(NOT_FOUND_META);
    expect(isProtectedRoute('/gibts-nicht')).toBe(false);
    expect(isProtectedRoute('/dashboard')).toBe(true);
    expect(isProtectedRoute('/training/sessions')).toBe(true);
  });
});

describe('buildCanonicalUrl', () => {
  it('builds absolute canonical URLs on https://altfragen.io', () => {
    expect(buildCanonicalUrl('/')).toBe('https://altfragen.io/');
    expect(buildCanonicalUrl(null)).toBe('https://altfragen.io/');
    expect(buildCanonicalUrl('/agb')).toBe('https://altfragen.io/agb');
  });
});

describe('applyPageMeta', () => {
  it('updates title, meta tags, and canonical href on a document double', () => {
    const attrs = new Map<string, Map<string, string>>();
    const makeEl = (key: string) => {
      const map = new Map<string, string>();
      attrs.set(key, map);
      return {
        setAttribute: (name: string, val: string) => {
          map.set(name, val);
        },
      };
    };

    const elements: Record<string, ReturnType<typeof makeEl>> = {
      'meta[name="description"]': makeEl('description'),
      'meta[name="robots"]': makeEl('robots'),
      'link[rel="canonical"]': makeEl('canonical'),
      'meta[property="og:title"]': makeEl('og:title'),
      'meta[property="og:description"]': makeEl('og:description'),
      'meta[property="og:url"]': makeEl('og:url'),
      'meta[name="twitter:title"]': makeEl('twitter:title'),
      'meta[name="twitter:description"]': makeEl('twitter:description'),
    };

    const fakeDoc = {
      title: '',
      querySelector: (selector: string) => elements[selector] ?? null,
    } as unknown as Document;

    const privacyMeta = resolveRouteMeta('/privacy');
    applyPageMeta(privacyMeta, fakeDoc);

    expect(fakeDoc.title).toBe('Datenschutzerklärung – Altfragen.io');
    expect(attrs.get('description')?.get('content')).toBe(privacyMeta.description);
    expect(attrs.get('robots')?.get('content')).toBe('index, follow');
    expect(attrs.get('canonical')?.get('href')).toBe('https://altfragen.io/privacy');
    expect(attrs.get('og:title')?.get('content')).toBe('Datenschutzerklärung – Altfragen.io');
    expect(attrs.get('og:url')?.get('content')).toBe('https://altfragen.io/privacy');
    expect(attrs.get('twitter:title')?.get('content')).toBe('Datenschutzerklärung – Altfragen.io');
  });
});
