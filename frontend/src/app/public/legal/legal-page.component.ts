import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService, SITE_URL } from '../../core/services/seo.service';
import { ALL_LEGAL_DOCS, LegalDoc, findLegalDoc } from './legal.data';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  template: `
    <ng-container *ngIf="legalDoc; else notFound">
      <section class="bg-gradient-to-b from-blue-50/70 to-white pt-12 pb-8 sm:pt-16">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav class="flex items-center gap-2 text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
            <a routerLink="/" class="hover:text-blue-600">Home</a>
            <span class="text-slate-300">/</span>
            <span class="text-slate-400">Legal</span>
          </nav>
          <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{{ legalDoc.title }}</h1>
          <p class="mt-3 text-sm font-medium text-slate-500">Last updated: {{ legalDoc.lastUpdated }}</p>
          <p class="mt-5 text-base leading-relaxed text-slate-600">{{ legalDoc.intro }}</p>
        </div>
      </section>

      <div class="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <!-- In-page contents -->
        <nav class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5" aria-label="On this page">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">On this page</p>
          <ul class="mt-3 grid gap-1.5 sm:grid-cols-2">
            <li *ngFor="let s of legalDoc.sections">
              <a [href]="'#' + anchor(s.heading)"
                 class="text-sm text-slate-600 transition-colors hover:text-blue-700">{{ s.heading }}</a>
            </li>
          </ul>
        </nav>

        <article class="mt-10">
          <section *ngFor="let s of legalDoc.sections" [id]="anchor(s.heading)" class="scroll-mt-24 pt-8">
            <h2 class="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">{{ s.heading }}</h2>

            <p *ngFor="let p of s.paragraphs" class="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
              {{ p }}
            </p>

            <ul *ngIf="s.bullets" class="mt-3 space-y-2">
              <li *ngFor="let b of s.bullets" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 sm:text-base">
                <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                <span>{{ b }}</span>
              </li>
            </ul>

            <p *ngIf="s.highlight"
               class="mt-4 rounded-xl border-l-4 border-blue-500 bg-blue-50/70 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700">
              {{ s.highlight }}
            </p>
          </section>
        </article>

        <!-- Other documents -->
        <div class="mt-14 border-t border-slate-200 pt-8">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Other legal documents</p>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <a *ngFor="let other of otherDocs" [routerLink]="['/legal', other.slug]"
               class="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm">
              <p class="text-sm font-bold text-slate-900">{{ other.title }}</p>
              <p class="mt-1 text-xs text-slate-500">Read document →</p>
            </a>
          </div>
        </div>

        <!-- Questions -->
        <div class="mt-10 rounded-2xl bg-slate-900 px-6 py-8 text-center sm:px-10">
          <h2 class="text-lg font-extrabold tracking-tight text-white sm:text-xl">
            Questions about this document?
          </h2>
          <p class="mx-auto mt-2 max-w-lg text-sm text-slate-300">
            Our team is happy to explain anything here in plain language, or to discuss specific
            terms with your school's management.
          </p>
          <a routerLink="/contact"
             class="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
            Contact us
          </a>
        </div>
      </div>
    </ng-container>

    <ng-template #notFound>
      <section class="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 class="text-3xl font-extrabold text-slate-900">Document not found</h1>
        <a routerLink="/legal/terms" class="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Read our Terms
        </a>
      </section>
    </ng-template>
  `,
})
export class LegalPageComponent implements OnInit {
  private seo = inject(SeoService);

  /** Route param, bound via withComponentInputBinding(). */
  @Input() doc!: string;

  legalDoc?: LegalDoc;
  otherDocs: LegalDoc[] = [];

  ngOnInit(): void {
    this.legalDoc = findLegalDoc(this.doc);

    if (!this.legalDoc) {
      this.seo.setPage({
        title: 'Document not found',
        description: 'The legal document you are looking for does not exist.',
        path: `/legal/${this.doc}`,
      });
      return;
    }

    const ldoc = this.legalDoc;
    this.otherDocs = ALL_LEGAL_DOCS.filter((d) => d.slug !== ldoc.slug);

    this.seo.setPage({
      title: ldoc.seoTitle,
      description: ldoc.description,
      path: `/legal/${ldoc.slug}`,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: ldoc.title,
          description: ldoc.description,
          url: `${SITE_URL}/legal/${ldoc.slug}`,
          dateModified: '2026-10-08',
          isPartOf: { '@type': 'WebSite', name: 'SchoolSense', url: `${SITE_URL}/` },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: ldoc.title, item: `${SITE_URL}/legal/${ldoc.slug}` },
          ],
        },
      ],
    });
  }

  /** Turns "5. Acceptable use" into a URL-safe anchor. */
  anchor(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/^\d+\.\s*/, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
