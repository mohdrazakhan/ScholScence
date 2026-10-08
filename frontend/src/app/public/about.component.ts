import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService } from '../core/services/seo.service';
import { VectorArtComponent } from './vector-art.component';

interface Value {
  art: string;
  title: string;
  detail: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, VectorArtComponent],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50/70 to-white py-14 sm:py-20">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">About Us</p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          We're building the school software India actually needed
        </h1>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          SchoolSense started from a simple observation: most school software in India is either
          too expensive, too complicated, or both. We're here to change that.
        </p>
      </div>
    </section>

    <!-- Mission -->
    <section class="bg-white pb-16" aria-labelledby="mission-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 id="mission-heading" class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Our mission: every school, however small, deserves great software
            </h2>
            <div class="mt-5 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <p>
                A school with 100 students in a tier-3 town runs on the same dedication as a
                2,000-student city school — often with less help. Yet most school software is
                priced and designed for the biggest institutions, with modules nobody uses and
                charges nobody explains.
              </p>
              <p>
                We built SchoolSense the other way around: one complete system, one honest price,
                and screens so simple that any teacher, clerk or principal can start on day one.
                And we made Parent Connect the heart of it — because a school and its families
                should feel like one team, not two worlds.
              </p>
              <p>
                That's why SchoolSense speaks your school's language: April–March academic years,
                ₹ pricing, class teachers, TCs and character certificates in proper Indian formats.
              </p>
            </div>
          </div>
          <div class="rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-200">
            <img src="/assets/images/academics_timetable.jpg"
                 alt="School leadership planning the academic timetable"
                 class="w-full rounded-2xl object-cover shadow-md"
                 width="800" height="600" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="bg-slate-50 py-16 sm:py-20" aria-labelledby="values-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="values-heading" class="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          What we believe
        </h2>
        <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div *ngFor="let v of values" class="rounded-2xl border border-slate-200 bg-white p-6">
            <app-vector-art [name]="v.art" class="h-16 w-16" />
            <h3 class="mt-3 text-base font-bold text-slate-900">{{ v.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ v.detail }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How we work with schools -->
    <section class="bg-white py-16 sm:py-20" aria-labelledby="work-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-10 lg:grid-cols-2">
          <div class="order-2 rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-200 lg:order-1">
            <img src="/assets/images/exams_gradebook.jpg"
                 alt="Teacher recording marks and preparing report cards"
                 class="w-full rounded-2xl object-cover shadow-md"
                 width="800" height="600" loading="lazy" />
          </div>
          <div class="order-1 lg:order-2">
            <h2 id="work-heading" class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              We work like your school's IT team — so you don't need one
            </h2>
            <ul class="mt-6 space-y-4">
              <li class="flex items-start gap-3">
                <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </span>
                <p class="text-sm leading-relaxed text-slate-700"><strong class="font-semibold text-slate-900">We set everything up.</strong> Classes, sections, subjects, fees — done by our team, free.</p>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </span>
                <p class="text-sm leading-relaxed text-slate-700"><strong class="font-semibold text-slate-900">We train every staff member.</strong> Step by step, in simple language, till everyone is comfortable.</p>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </span>
                <p class="text-sm leading-relaxed text-slate-700"><strong class="font-semibold text-slate-900">We keep improving.</strong> Schools request features; we build them. On-demand extras are quoted fairly, upfront.</p>
              </li>
            </ul>
            <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
               class="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
              Talk to our team
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-slate-50 py-16 sm:pb-24">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Come see what simple feels like</h2>
        <p class="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
          Thirty minutes with our team will show you more than a week of comparing websites.
        </p>
        <div class="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 sm:w-auto">
            Book a Free Demo
          </a>
          <a routerLink="/pricing"
             class="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-100 sm:w-auto">
            See Pricing
          </a>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent {
  private seo = inject(SeoService);

  values: Value[] = [
    {
      art: 'cloud',
      title: 'Simplicity first',
      detail: 'If a feature needs a manual, we redesign it. Software for schools should feel as easy as messaging.',
    },
    {
      art: 'parent-phone',
      title: 'Parents as partners',
      detail: 'When parents see school life live, trust grows — and students get the support they need at home.',
    },
    {
      art: 'school-bus',
      title: 'Made for India',
      detail: 'April–March sessions, ₹ pricing, Indian certificate formats, Hindi-English friendly language.',
    },
    {
      art: 'complaint',
      title: 'Honest pricing',
      detail: 'One published price for everything. No hidden modules, no surprise invoices, no annual traps.',
    },
  ];

  constructor() {
    this.seo.setPage({
      title: 'About SchoolSense — Simple School Software, Built for Indian Schools',
      description:
        'SchoolSense is an India-first school management system with a mission: every school deserves simple, complete and honestly-priced software — with parents connected live to their child\'s school life.',
      path: '/about',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.schoolsense.in/' },
            { '@type': 'ListItem', position: 2, name: 'About Us', item: 'https://www.schoolsense.in/about' },
          ],
        },
      ],
    });
  }
}
