import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService, SITE_URL } from '../../core/services/seo.service';
import { BLOG_POSTS, BlogPost, findPost } from './blog.data';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  template: `
    <ng-container *ngIf="post; else notFound">
      <!-- Article header -->
      <section class="bg-gradient-to-b from-blue-50/70 to-white pt-12 pb-8 sm:pt-16">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav class="flex items-center gap-2 text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
            <a routerLink="/" class="hover:text-blue-600">Home</a>
            <span class="text-slate-300">/</span>
            <a routerLink="/blog" class="hover:text-blue-600">Blog</a>
            <span class="text-slate-300">/</span>
            <span class="truncate text-slate-400">{{ post.category }}</span>
          </nav>

          <div class="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span class="rounded-md bg-blue-50 px-2 py-1 text-blue-700">{{ post.category }}</span>
            <span class="text-slate-400">{{ post.dateDisplay }}</span>
            <span class="text-slate-300">·</span>
            <span class="text-slate-400">{{ post.readMinutes }} min read</span>
          </div>

          <h1 class="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {{ post.title }}
          </h1>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{{ post.intro }}</p>
        </div>
      </section>

      <!-- Cover image -->
      <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <img [src]="post.image" [alt]="post.title"
             class="w-full rounded-2xl object-cover shadow-md" width="1024" height="512" />
      </div>

      <!-- Key takeaways -->
      <section class="mx-auto mt-10 max-w-3xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Key takeaways</p>
          <ul class="mt-3 space-y-2">
            <li *ngFor="let t of post.keyTakeaways" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
              <svg class="mt-0.5 h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {{ t }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Body -->
      <article class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <ng-container *ngFor="let section of post.sections">
          <h2 *ngIf="section.heading" class="mt-10 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {{ section.heading }}
          </h2>

          <p *ngFor="let para of section.paragraphs"
             class="mt-4 text-base leading-relaxed text-slate-700">
            {{ para }}
          </p>

          <ul *ngIf="section.bullets" class="mt-4 space-y-2.5">
            <li *ngFor="let b of section.bullets" class="flex items-start gap-2.5 text-base leading-relaxed text-slate-700">
              <svg class="mt-1 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              {{ b }}
            </li>
          </ul>

          <div *ngIf="section.table" class="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table class="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr class="bg-slate-50">
                  <th *ngFor="let h of section.table.headers"
                      class="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                    {{ h }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of section.table.rows" class="odd:bg-white even:bg-slate-50/60">
                  <td *ngFor="let cell of row; let first = first"
                      class="border-b border-slate-100 px-4 py-3 align-top leading-relaxed"
                      [ngClass]="first ? 'font-semibold text-slate-900' : 'text-slate-600'">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p *ngIf="section.note"
             class="mt-5 rounded-xl border-l-4 border-blue-500 bg-blue-50/70 px-5 py-4 text-sm font-medium leading-relaxed text-slate-700">
            {{ section.note }}
          </p>
        </ng-container>

        <!-- Share of voice: CTA -->
        <div class="mt-12 rounded-3xl bg-slate-900 px-6 py-10 text-center sm:px-10">
          <h2 class="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            See it working on a real school
          </h2>
          <p class="mx-auto mt-3 max-w-md text-sm text-slate-300">
            A free 30-minute demo shows you everything this article talks about — live,
            with a sample school just like yours.
          </p>
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-colors hover:bg-blue-500">
            Book a Free Demo
          </a>
        </div>
      </article>

      <!-- Related posts -->
      <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <h2 class="text-xl font-extrabold tracking-tight text-slate-900">Keep reading</h2>
        <div class="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <a *ngFor="let related of relatedPosts" [routerLink]="['/blog', related.slug]"
             class="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
            <p class="text-xs font-bold uppercase tracking-wider text-blue-600">{{ related.category }}</p>
            <h3 class="mt-2 text-base font-bold leading-snug text-slate-900 group-hover:text-blue-700">{{ related.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ related.description }}</p>
          </a>
        </div>
      </section>
    </ng-container>

    <ng-template #notFound>
      <section class="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 class="text-3xl font-extrabold text-slate-900">Article not found</h1>
        <p class="mt-3 text-slate-600">The article you are looking for does not exist or has moved.</p>
        <a routerLink="/blog" class="mt-7 inline-block rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700">
          Browse all articles
        </a>
      </section>
    </ng-template>
  `,
})
export class BlogPostComponent implements OnInit {
  private seo = inject(SeoService);

  /** Route param, bound via withComponentInputBinding(). */
  @Input() slug!: string;

  post?: BlogPost;
  relatedPosts: BlogPost[] = [];

  ngOnInit(): void {
    this.post = findPost(this.slug);

    if (!this.post) {
      this.seo.setPage({
        title: 'Article not found',
        description: 'The article you are looking for does not exist.',
        path: `/blog/${this.slug}`,
      });
      return;
    }

    const post = this.post;
    this.relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

    this.seo.setPage({
      title: post.seoTitle,
      description: post.description,
      path: `/blog/${post.slug}`,
      ogImage: post.image,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          image: `${SITE_URL}${post.image}`,
          datePublished: post.date,
          dateModified: post.date,
          author: { '@type': 'Organization', name: 'SchoolSense', url: `${SITE_URL}/` },
          publisher: {
            '@type': 'Organization',
            name: 'SchoolSense',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/brand/icon.png` },
          },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
          ],
        },
      ],
    });
  }
}
