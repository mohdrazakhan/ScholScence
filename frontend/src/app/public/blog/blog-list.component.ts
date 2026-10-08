import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService, SITE_URL } from '../../core/services/seo.service';
import { BLOG_POSTS } from './blog.data';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50/70 to-white py-14 sm:py-20">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Blog</p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Guides &amp; honest comparisons for school owners
        </h1>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          Practical writing about school management software in India — how to evaluate it,
          what it really costs, and why parent connection matters more than feature lists.
        </p>
      </div>
    </section>

    <!-- Post grid -->
    <section class="bg-white pb-16 sm:pb-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          <article *ngFor="let post of posts"
                   class="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
            <a [routerLink]="['/blog', post.slug]" class="block overflow-hidden">
              <img [src]="post.image" [alt]="post.title"
                   class="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                   width="640" height="360" loading="lazy" />
            </a>
            <div class="flex flex-1 flex-col p-6">
              <div class="flex items-center gap-2 text-xs font-semibold">
                <span class="rounded-md bg-blue-50 px-2 py-1 text-blue-700">{{ post.category }}</span>
                <span class="text-slate-400">{{ post.dateDisplay }}</span>
                <span class="text-slate-300">·</span>
                <span class="text-slate-400">{{ post.readMinutes }} min read</span>
              </div>
              <h2 class="mt-3 text-lg font-bold leading-snug text-slate-900">
                <a [routerLink]="['/blog', post.slug]" class="transition-colors hover:text-blue-700">{{ post.title }}</a>
              </h2>
              <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {{ post.description }}
              </p>
              <a [routerLink]="['/blog', post.slug]"
                 class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                Read article
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
            </div>
          </article>
        </div>

        <!-- CTA -->
        <div class="mt-14 rounded-3xl bg-slate-900 px-6 py-12 text-center sm:px-12">
          <h2 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Reading is good. Seeing is better.
          </h2>
          <p class="mx-auto mt-3 max-w-lg text-sm text-slate-300 sm:text-base">
            Book a free demo and judge SchoolSense the way this blog suggests — by what it does
            in your school, not by what a brochure says.
          </p>
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500">
            Book a Free Demo
          </a>
        </div>
      </div>
    </section>
  `,
})
export class BlogListComponent {
  private seo = inject(SeoService);
  posts = BLOG_POSTS;

  constructor() {
    this.seo.setPage({
      title: 'Blog — School Management Software Guides & Comparisons (India)',
      description:
        'Honest guides about school management software in India: ERP comparisons, pricing transparency, how to choose school software, why parent connect matters, and building the simplest school system for non-IT staff.',
      path: '/blog',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'SchoolSense Blog',
          url: `${SITE_URL}/blog`,
          blogPost: this.posts.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${SITE_URL}/blog/${p.slug}`,
            datePublished: p.date,
            description: p.description,
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          ],
        },
      ],
    });
  }
}
