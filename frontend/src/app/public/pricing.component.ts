import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService } from '../core/services/seo.service';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50/70 to-white py-14 sm:py-20">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Pricing</p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Simple, transparent pricing.
          <span class="block text-blue-600">Every feature included.</span>
        </h1>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          One plan, one price, no hidden charges. We publish our price openly — because we know
          it's fair. Most school software companies make you call for a quote; we think you
          deserve better.
        </p>
      </div>
    </section>

    <!-- Pricing card -->
    <section class="bg-white pb-16" aria-labelledby="plan-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <div class="relative rounded-3xl border-2 border-blue-600 bg-white shadow-2xl shadow-blue-600/10">
            <span class="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-5 py-1.5 text-xs font-extrabold text-amber-950 shadow-sm">
              🎉 LAUNCH OFFER — 80% OFF FOR NEW SCHOOLS
            </span>

            <div class="grid gap-8 p-8 sm:p-10 lg:grid-cols-5">
              <!-- Price -->
              <div class="text-center lg:col-span-2 lg:text-left">
                <h2 id="plan-heading" class="text-xl font-extrabold text-slate-900">SchoolSense — All Features</h2>
                <p class="mt-1 text-sm text-slate-500">For schools of every size, boards and mediums.</p>

                <div class="mt-6 flex items-end justify-center gap-3 lg:justify-start">
                  <span class="text-6xl font-extrabold tracking-tight text-slate-900">₹10</span>
                  <span class="pb-2 text-sm text-slate-500">/ student / month</span>
                </div>
                <p class="mt-2 text-sm text-slate-500">
                  <span class="font-medium line-through">₹49</span> regular price ·
                  <span class="font-semibold text-emerald-600">you save 80%</span>
                </p>
                <p class="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">
                  Billed monthly, only for your enrolled students. No setup fee, no yearly
                  lock-in, no per-feature charges.
                </p>

                <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
                   class="mt-6 block rounded-xl bg-blue-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
                  Book a Free Demo
                </a>
                <p class="mt-3 text-center text-xs text-slate-400 lg:text-left">No commitment — the demo is free.</p>
              </div>

              <!-- Included -->
              <div class="lg:col-span-3">
                <p class="text-sm font-bold uppercase tracking-wider text-slate-900">Everything included in this price</p>
                <ul class="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <li *ngFor="let inc of included" class="flex items-start gap-2 text-sm text-slate-700">
                    <svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {{ inc }}
                  </li>
                </ul>
                <div class="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
                  <strong class="font-semibold text-slate-700">Need something special?</strong>
                  On-demand features (like custom reports or integrations) can be built for your
                  school and are quoted separately — the base price always covers the full system above.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Billing explainers -->
        <div class="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 p-6 text-center">
            <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <h3 class="mt-3 text-sm font-bold text-slate-900">Pay monthly</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">Small monthly payments instead of big yearly bills. Pause anytime.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-6 text-center">
            <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            </span>
            <h3 class="mt-3 text-sm font-bold text-slate-900">Only for enrolled students</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">A 300-student school pays for 300 students. Teachers, admins and parents log in free.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-6 text-center">
            <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </span>
            <h3 class="mt-3 text-sm font-bold text-slate-900">No lock-in</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">Your data belongs to your school. No forced annual contracts.</p>
          </div>
        </div>

        <!-- Cost example -->
        <div class="mx-auto mt-10 max-w-4xl rounded-2xl bg-slate-50 p-7 ring-1 ring-slate-200">
          <h3 class="text-center text-base font-bold text-slate-900">What this looks like for a real school</h3>
          <div class="mt-5 grid gap-4 text-center sm:grid-cols-3">
            <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">School with 200 students</p>
              <p class="mt-2 text-2xl font-extrabold text-slate-900">₹2,000<span class="text-sm font-medium text-slate-500">/month</span></p>
              <p class="mt-1 text-xs text-slate-500">at launch price (₹10,000/month at regular ₹49)</p>
            </div>
            <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">School with 500 students</p>
              <p class="mt-2 text-2xl font-extrabold text-slate-900">₹5,000<span class="text-sm font-medium text-slate-500">/month</span></p>
              <p class="mt-1 text-xs text-slate-500">at launch price (₹24,500/month at regular ₹49)</p>
            </div>
            <div class="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">School with 1,000 students</p>
              <p class="mt-2 text-2xl font-extrabold text-slate-900">₹10,000<span class="text-sm font-medium text-slate-500">/month</span></p>
              <p class="mt-1 text-xs text-slate-500">at launch price (₹49,000/month at regular ₹49)</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="bg-slate-50 py-16 sm:py-20" aria-labelledby="pricing-faq-heading">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id="pricing-faq-heading" class="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Pricing questions, answered honestly
        </h2>
        <div class="mt-10 space-y-3">
          <details *ngFor="let f of faqs" class="group rounded-2xl border border-slate-200 bg-white open:ring-1 open:ring-blue-200">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left">
              <span class="text-sm font-bold text-slate-900 sm:text-base">{{ f.q }}</span>
              <svg class="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </summary>
            <p class="px-6 pb-5 text-sm leading-relaxed text-slate-600">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-white py-16 sm:pb-24">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Try it on your school's data first</h2>
        <p class="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
          Book a free demo. If SchoolSense is not the simplest system you've seen, you owe us nothing.
        </p>
        <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
           class="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
          Book a Free Demo
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </a>
      </div>
    </section>
  `,
})
export class PricingComponent {
  private seo = inject(SeoService);

  included = [
    'Timetable & Scheduling',
    'Attendance Register',
    'Homework & Assignments',
    'Exams & Marksheets',
    'Circulars & Notices',
    'Grievance Desk / Complaints',
    'Fee Management & Invoicing',
    'Alumni Management',
    'Auto TC, CC & certificates',
    'Live Parent Connect',
    'Parent & Teacher mobile apps — free',
    'Push notifications on every activity',
    'Unlimited teacher & staff logins',
    'Free setup, migration & training',
    'Data backup & security',
  ];

  faqs: FaqItem[] = [
    {
      q: 'Is ₹10 per student per month really the full price?',
      a: 'Yes — for schools joining during our launch period. The regular price is ₹49 per student per month, and the launch offer reduces it to ₹10 for new schools. Both prices include every feature: there are no paid modules hiding behind the base plan.',
    },
    {
      q: 'What counts as a "student" for billing?',
      a: 'Only your enrolled, active students. Teachers, principals, admin staff and parents can log in free, with no per-user charge. If a student leaves mid-month, billing adjusts from the next cycle.',
    },
    {
      q: 'How do we pay?',
      a: 'Each school gets a simple wallet: you top it up and the monthly fee is deducted automatically with a proper receipt for every transaction. You always have a clear ledger of what was billed and when.',
    },
    {
      q: 'Is there a mobile app for parents and teachers?',
      a: 'Yes. Every plan includes two dedicated mobile apps: a Parent App (live attendance, homework, marks and results, fee receipts and fines, events, push notifications and complaint tracking) and a Teacher App (attendance, homework, marks, notices and complaint management). Both work on Android and iPhone and are included at no extra charge.',
    },
    {
      q: 'Are there any setup or training charges?',
      a: 'No. We set up your classes, sections, subjects and fee structure, migrate your existing student data, and train your staff — all free as part of onboarding.',
    },
    {
      q: 'What are "on-demand features"?',
      a: 'Anything custom your school specifically wants beyond the standard system — for example, a special report format or an integration. We quote these separately before building anything, and the base plan price never changes because of them.',
    },
    {
      q: 'Can we cancel?',
      a: 'Yes. There is no yearly lock-in. If you ever stop using SchoolSense, your school\'s data is handed back to you in a usable format.',
    },
  ];

  constructor() {
    this.seo.setPage({
      title: 'Pricing — ₹10 per Student/Month Launch Offer, All Features Included',
      description:
        'SchoolSense school management system pricing: regular ₹49 per student per month, launch offer ₹10 per student per month. All features included — attendance, homework, exams, fees, timetable, notices, complaints, alumni, certificates and Parent Connect. No setup fee, no lock-in.',
      path: '/pricing',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'SchoolSense — School Management System',
          description:
            'Cloud school management system for Indian schools with attendance, homework, exams, fees, timetable, notices, complaints, alumni management, auto-generated certificates and live Parent Connect.',
          brand: { '@type': 'Brand', name: 'SchoolSense' },
          offers: [
            {
              '@type': 'Offer',
              name: 'Launch Offer',
              price: '10.00',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: 'https://www.schoolsense.in/pricing',
              description: 'Launch offer for new schools: ₹10 per student per month, all features included.',
            },
            {
              '@type': 'Offer',
              name: 'Regular Price',
              price: '49.00',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: 'https://www.schoolsense.in/pricing',
              description: 'Regular price: ₹49 per student per month, all features included.',
            },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: this.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.schoolsense.in/' },
            { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://www.schoolsense.in/pricing' },
          ],
        },
      ],
    });
  }
}
