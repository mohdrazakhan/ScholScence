import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

/**
 * Production site URL — used for canonical URLs, Open Graph and sitemap references.
 * NOTE: confirm this matches the final production domain before launch.
 */
export const SITE_URL = 'https://www.schoolsense.in';
export const SITE_NAME = 'SchoolSense';
export const DEFAULT_OG_IMAGE = '/assets/images/hero_dashboard.jpg';

export interface PageSeo {
  /** Page title without the site suffix — e.g. "Pricing" */
  title: string;
  description: string;
  /** Route path, e.g. '/pricing' */
  path: string;
  ogImage?: string;
  /** Extra JSON-LD structured data objects for this page */
  jsonLd?: object[];
}

/**
 * Central per-page SEO: title, description, canonical, Open Graph,
 * Twitter cards and page-specific JSON-LD structured data.
 *
 * Uses the injected DOCUMENT token (not the global `document`) so it works
 * identically in the browser and during static prerendering — the values get
 * baked into each page's HTML, which is what search engines crawl.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  setPage(seo: PageSeo): void {
    const fullTitle = seo.title.includes(SITE_NAME) ? seo.title : `${seo.title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${seo.path}`;
    const image = seo.ogImage?.startsWith('http')
      ? seo.ogImage
      : `${SITE_URL}${seo.ogImage || DEFAULT_OG_IMAGE}`;

    this.titleService.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: seo.description });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'en_IN' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);
    this.setJsonLd(seo.jsonLd || []);
  }

  /** Replaces any existing canonical links so exactly one correct URL is emitted. */
  private setCanonical(url: string): void {
    this.doc.querySelectorAll("link[rel='canonical']").forEach((el) => el.remove());
    const link = this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.doc.head.appendChild(link);
  }

  /** Removes page-specific JSON-LD from the previous page, then adds the new blocks. */
  private setJsonLd(blocks: object[]): void {
    this.doc.querySelectorAll('script[data-page-jsonld="true"]').forEach((el) => el.remove());
    blocks.forEach((obj) => {
      const script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-page-jsonld', 'true');
      script.textContent = JSON.stringify(obj);
      this.doc.head.appendChild(script);
    });
  }
}
