import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService } from '../core/services/seo.service';
import { VectorArtComponent } from './vector-art.component';

interface FaqItem {
  q: string;
  a: string;
}

interface PlanTier {
  id: string;
  name: string;
  price: string;
  cadence: string;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
  tagline: string;
  description: string;
  ctaText: string;
  features: string[];
  unavailable?: string[];
}

interface MatrixRow {
  name: string;
  category: string;
  lite: boolean | string;
  pro: boolean | string;
  proPlus: boolean | string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, VectorArtComponent],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50/70 to-white py-14 sm:py-20">
      <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Transparent Pricing</p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Three clear plans. Built for Indian schools.
          <span class="block text-blue-600">Start from just ₹3.5/student/month.</span>
        </h1>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          No hidden fees, no setup charges, and zero lock-in. Onboard easily on our
          <strong>Lite</strong> plan at ₹3.5, choose our all-in-one <strong>Pro</strong> plan at ₹10
          with mobile apps for complete automation, or upgrade to <strong>Pro+</strong> at ₹15 for VIP on-campus service.
        </p>
      </div>
    </section>

    <!-- Pricing 3-Card Grid -->
    <section class="bg-white pb-16" aria-labelledby="plans-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="plans-heading" class="sr-only">SchoolSense Pricing Plans</h2>

        <!-- Billing Cycle Toggle -->
        <div class="mb-10 flex flex-col items-center justify-center gap-2">
          <div class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold sm:text-sm">
            <button type="button"
                    (click)="billingCycle.set('monthly')"
                    [ngClass]="billingCycle() === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                    class="rounded-full px-4 py-2 transition-all">
              Monthly Billing
            </button>
            <button type="button"
                    (click)="billingCycle.set('annual')"
                    [ngClass]="billingCycle() === 'annual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
                    class="flex items-center gap-1.5 rounded-full px-4 py-2 transition-all">
              Annual Billing
              <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                    [ngClass]="billingCycle() === 'annual' ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-700'">
                2 Months Free 🎁
              </span>
            </button>
          </div>
          <p class="text-xs text-slate-500">
            Pay for 10 months and get 12 months of service on <strong>Pro</strong> and <strong>Pro+</strong> plans.
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          <!-- 1. LITE PLAN -->
          <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-900/5 transition-all hover:border-slate-300 sm:p-8">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Easy Onboarding
                </span>
                <span class="text-xs font-medium text-slate-400">Zero budget barrier</span>
              </div>

              <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Lite</h3>
              <p class="mt-1 text-xs text-slate-500">Core school digitization &amp; attendance roster.</p>

              <!-- Monthly Price -->
              <ng-container *ngIf="billingCycle() === 'monthly'">
                <div class="mt-6 flex items-baseline gap-1">
                  <span class="text-5xl font-extrabold tracking-tight text-slate-900">₹3.5</span>
                  <span class="text-sm font-medium text-slate-500">/ student / month</span>
                </div>
                <p class="mt-2 text-xs font-medium text-emerald-600">
                  ✓ ₹0 setup fee · Pay only after completing month 1
                </p>
              </ng-container>

              <!-- Annual Price -->
              <ng-container *ngIf="billingCycle() === 'annual'">
                <div class="mt-6 flex items-baseline gap-1">
                  <span class="text-5xl font-extrabold tracking-tight text-slate-900">₹42</span>
                  <span class="text-sm font-medium text-slate-500">/ student / year</span>
                </div>
                <p class="mt-2 text-xs font-medium text-slate-600">
                  Effectively ₹3.50/mo · Billed annually
                </p>
              </ng-container>

              <a routerLink="/contact" [queryParams]="{ type: 'demo', plan: 'lite', billing: billingCycle() }"
                 class="mt-6 block w-full rounded-xl border-2 border-slate-800 bg-white py-3 text-center text-sm font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white">
                Start on Lite
              </a>

              <hr class="my-6 border-slate-100" />

              <p class="text-xs font-bold uppercase tracking-wider text-slate-900">What's included in Lite:</p>
              <ul class="mt-4 space-y-2.5 text-sm text-slate-700">
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Student &amp; Staff Directory &amp; Records
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Daily Roll-Call Attendance Register
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Timetable &amp; Period Schedule Viewer
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  School Circulars, Notices &amp; Calendar
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Admin &amp; Teacher Web Portal Access
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  100% Free Data Migration from Excel/ERP
                </li>
                <li class="flex items-start gap-2 text-slate-400">
                  <span class="mt-0.5 text-xs font-bold text-slate-300">✕</span>
                  <span class="line-through">Parent &amp; Teacher Mobile Apps</span>
                </li>
                <li class="flex items-start gap-2 text-slate-400">
                  <span class="mt-0.5 text-xs font-bold text-slate-300">✕</span>
                  <span class="line-through">Online Fee Collection &amp; Invoicing</span>
                </li>
                <li class="flex items-start gap-2 text-slate-400">
                  <span class="mt-0.5 text-xs font-bold text-slate-300">✕</span>
                  <span class="line-through">Exams &amp; Automated Report Cards</span>
                </li>
              </ul>
            </div>

            <p class="mt-6 text-center text-xs text-slate-400">Upgrade to Pro anytime with 1 click.</p>
          </div>

          <!-- 2. PRO PLAN (HERO / TARGET PLAN) -->
          <div class="relative flex flex-col justify-between rounded-3xl border-2 border-blue-600 bg-white p-7 shadow-2xl shadow-blue-600/20 ring-4 ring-blue-600/10 transition-all sm:p-8 lg:-translate-y-2">
            <span class="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md">
              ★ Most Popular · Recommended
            </span>

            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                  Complete System
                </span>
                <span class="text-xs font-bold text-blue-600">95% of schools choose Pro</span>
              </div>

              <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Pro</h3>
              <p class="mt-1 text-xs text-slate-600">The full school ERP with Mobile Apps, Fees &amp; Exams.</p>

              <!-- Monthly Price -->
              <ng-container *ngIf="billingCycle() === 'monthly'">
                <div class="mt-6 flex flex-wrap items-baseline gap-2">
                  <span class="text-2xl font-semibold text-slate-400 line-through">₹15</span>
                  <span class="text-5xl font-extrabold tracking-tight text-slate-900">₹10</span>
                  <span class="text-sm font-medium text-slate-500">/ student / month</span>
                </div>
                <p class="mt-2 text-xs font-semibold text-blue-700">
                  Launch Offer: Save 33% · Billed monthly · No lock-in
                </p>
                <div class="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span>🎁</span>
                  <span>Annual billing: <strong>2 Months Free</strong> (Pay ₹100/yr)</span>
                </div>
              </ng-container>

              <!-- Annual Price -->
              <ng-container *ngIf="billingCycle() === 'annual'">
                <div class="mt-6 flex flex-wrap items-baseline gap-2">
                  <span class="text-2xl font-semibold text-slate-400 line-through">₹150</span>
                  <span class="text-5xl font-extrabold tracking-tight text-slate-900">₹100</span>
                  <span class="text-sm font-medium text-slate-500">/ student / year</span>
                </div>
                <p class="mt-2 text-xs font-extrabold text-emerald-700">
                  🎉 2 Months Free Included! (Effectively ₹8.33 / student / mo)
                </p>
                <div class="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <span>✓</span>
                  <span>Pay for 10 months, use for 12 full months</span>
                </div>
              </ng-container>

              <a routerLink="/contact" [queryParams]="{ type: 'demo', plan: 'pro', billing: billingCycle() }"
                 class="mt-6 block w-full rounded-xl bg-blue-600 py-3.5 text-center text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-xl">
                Choose Pro Plan
              </a>

              <hr class="my-6 border-slate-100" />

              <p class="text-xs font-bold uppercase tracking-wider text-slate-900">Everything in Lite, plus:</p>
              <ul class="mt-4 space-y-2.5 text-sm text-slate-700">
                <li class="flex items-start gap-2 font-medium text-slate-900">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Dedicated Parent Mobile App (Android &amp; iOS)
                </li>
                <li class="flex items-start gap-2 font-medium text-slate-900">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Dedicated Teacher Mobile App (Attendance &amp; Marks)
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Homework &amp; Assignments Center
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Exams, Gradebook &amp; Automated Marksheets
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Fee Management, UPI/Cash Invoicing &amp; GST Receipts
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Parent Grievance Desk (Threaded Complaint Tickets)
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Live Parent Connect Portal &amp; Push Alerts
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Staff Training Refresher Every 6 Months (Online)
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Priority Phone &amp; WhatsApp Support
                </li>
              </ul>
            </div>

            <p class="mt-6 text-center text-xs font-semibold text-blue-600">The most cost-effective all-in-one plan.</p>
          </div>

          <!-- 3. PRO+ PLAN -->
          <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-lg shadow-slate-900/5 transition-all hover:border-slate-300 sm:p-8">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Enterprise &amp; Campus
                </span>
                <span class="text-xs font-medium text-slate-400">VIP On-Site Service</span>
              </div>

              <h3 class="mt-4 text-2xl font-extrabold text-slate-900">Pro+</h3>
              <p class="mt-1 text-xs text-slate-500">For institutions wanting fleet tracking, certificates &amp; visits.</p>

              <!-- Monthly Price -->
              <ng-container *ngIf="billingCycle() === 'monthly'">
                <div class="mt-6 flex flex-wrap items-baseline gap-2">
                  <span class="text-2xl font-semibold text-slate-400 line-through">₹20</span>
                  <span class="text-5xl font-extrabold tracking-tight text-slate-900">₹15</span>
                  <span class="text-sm font-medium text-slate-500">/ student / month</span>
                </div>
                <p class="mt-2 text-xs font-semibold text-indigo-700">
                  Launch Offer: Save 25% · Full module suite + On-Campus Visits
                </p>
                <div class="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <span>🎁</span>
                  <span>Annual billing: <strong>2 Months Free</strong> (Pay ₹150/yr)</span>
                </div>
              </ng-container>

              <!-- Annual Price -->
              <ng-container *ngIf="billingCycle() === 'annual'">
                <div class="mt-6 flex flex-wrap items-baseline gap-2">
                  <span class="text-2xl font-semibold text-slate-400 line-through">₹200</span>
                  <span class="text-5xl font-extrabold tracking-tight text-slate-900">₹150</span>
                  <span class="text-sm font-medium text-slate-500">/ student / year</span>
                </div>
                <p class="mt-2 text-xs font-extrabold text-emerald-700">
                  🎉 2 Months Free Included! (Effectively ₹12.50 / student / mo)
                </p>
                <div class="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  <span>✓</span>
                  <span>Pay for 10 months, use for 12 full months</span>
                </div>
              </ng-container>

              <a routerLink="/contact" [queryParams]="{ type: 'demo', plan: 'proplus', billing: billingCycle() }"
                 class="mt-6 block w-full rounded-xl border border-indigo-600 bg-indigo-50 py-3 text-center text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-600 hover:text-white">
                Choose Pro+
              </a>

              <hr class="my-6 border-slate-100" />

              <p class="text-xs font-bold uppercase tracking-wider text-slate-900">Everything in Pro, plus:</p>
              <ul class="mt-4 space-y-2.5 text-sm text-slate-700">
                <li class="flex items-start gap-2 font-medium text-slate-900">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Transport &amp; Fleet Management Department
                </li>
                <li class="flex items-start gap-2 font-medium text-slate-900">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Automated Board TC &amp; Character Certificate Engine
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Alumni Registry &amp; Graduated Batches Archive
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  In-Person On-Campus Staff Training School Visits
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Dedicated Personal Account Manager
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Custom Report Formats &amp; Custom Schedulers
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  VIP Priority SLA with Direct Technical Escalation
                </li>
              </ul>
            </div>

            <p class="mt-6 text-center text-xs text-slate-400">For multi-branch or campus-scale institutions.</p>
          </div>
        </div>

        <!-- No hidden costs banner: ₹0 Setup, ₹0 Data migration, ₹0 On-site training -->
        <div class="mx-auto mt-16 sm:mt-24 max-w-4xl text-center">
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            No hidden costs. <span class="text-blue-600">Really.</span>
          </h2>

          <div class="mt-10 sm:mt-14 grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div class="py-6 sm:py-0">
              <p class="text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900">₹0</p>
              <p class="mt-3 text-sm sm:text-base font-semibold text-slate-600">Setup fee</p>
            </div>
            <div class="py-6 sm:py-0">
              <p class="text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900">₹0</p>
              <p class="mt-3 text-sm sm:text-base font-semibold text-slate-600">Data migration</p>
            </div>
            <div class="py-6 sm:py-0">
              <p class="text-6xl sm:text-7xl font-extrabold tracking-tight text-slate-900">₹0</p>
              <p class="mt-3 text-sm sm:text-base font-semibold text-slate-600">On-site training</p>
            </div>
          </div>

        </div>

        <!-- Billing explainers -->
        <div class="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 p-6 text-center">
            <app-vector-art name="timetable" class="mx-auto h-16 w-16" />
            <h3 class="mt-3 text-sm font-bold text-slate-900">Pay monthly</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">Pay as you go each month. No large upfront annual checks required.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-6 text-center">
            <app-vector-art name="classroom" class="mx-auto h-16 w-16" />
            <h3 class="mt-3 text-sm font-bold text-slate-900">Only for enrolled students</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">Only pay for active students. Teachers, staff, and parents log in free on all plans.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-6 text-center">
            <app-vector-art name="security" class="mx-auto h-16 w-16" />
            <h3 class="mt-3 text-sm font-bold text-slate-900">Zero lock-in</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">Your data belongs to your school. Export anytime in Excel/CSV/PDF.</p>
          </div>
        </div>

        <!-- Real school cost comparison table -->
        <div class="mx-auto mt-12 max-w-4xl rounded-3xl bg-slate-50 p-6 sm:p-8 ring-1 ring-slate-200">
          <h3 class="text-center text-lg font-bold text-slate-900">What each plan costs for a real school</h3>
          <p class="mt-1 text-center text-xs text-slate-500">
            <span *ngIf="billingCycle() === 'monthly'">Monthly billing based on active student enrollments. Switch toggle above to see annual savings.</span>
            <span *ngIf="billingCycle() === 'annual'" class="font-semibold text-emerald-700">Annual billing with 2 Months FREE on Pro and Pro+ plans (pay for 10 months, use for 12 months).</span>
          </p>

          <div class="mt-6 overflow-x-auto">
            <table class="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th class="pb-3">School Size</th>
                  <th class="pb-3 text-center">Lite ({{ billingCycle() === 'monthly' ? '₹3.5/mo' : '₹42/yr' }})</th>
                  <th class="pb-3 text-center text-blue-600 bg-blue-50/60 rounded-t-lg">Pro ({{ billingCycle() === 'monthly' ? '₹10/mo' : '₹100/yr · 2 Mo Free' }}) ★</th>
                  <th class="pb-3 text-center">Pro+ ({{ billingCycle() === 'monthly' ? '₹15/mo' : '₹150/yr · 2 Mo Free' }})</th>
                </tr>
              </thead>
              <tbody *ngIf="billingCycle() === 'monthly'" class="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td class="py-3.5 font-semibold text-slate-900">200 students</td>
                  <td class="py-3.5 text-center text-slate-600">₹700 / mo</td>
                  <td class="py-3.5 text-center font-bold text-blue-700 bg-blue-50/40">₹2,000 / mo</td>
                  <td class="py-3.5 text-center text-slate-600">₹3,000 / mo</td>
                </tr>
                <tr>
                  <td class="py-3.5 font-semibold text-slate-900">500 students</td>
                  <td class="py-3.5 text-center text-slate-600">₹1,750 / mo</td>
                  <td class="py-3.5 text-center font-bold text-blue-700 bg-blue-50/40">₹5,000 / mo</td>
                  <td class="py-3.5 text-center text-slate-600">₹7,500 / mo</td>
                </tr>
                <tr>
                  <td class="py-3.5 font-semibold text-slate-900">1,000 students</td>
                  <td class="py-3.5 text-center text-slate-600">₹3,500 / mo</td>
                  <td class="py-3.5 text-center font-bold text-blue-700 bg-blue-50/40">₹10,000 / mo</td>
                  <td class="py-3.5 text-center text-slate-600">₹15,000 / mo</td>
                </tr>
              </tbody>
              <tbody *ngIf="billingCycle() === 'annual'" class="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td class="py-3.5 font-semibold text-slate-900">200 students</td>
                  <td class="py-3.5 text-center text-slate-600">₹8,400 / yr</td>
                  <td class="py-3.5 text-center font-bold text-blue-700 bg-blue-50/40">
                    <div>₹20,000 / yr</div>
                    <span class="text-[11px] font-semibold text-emerald-600">Save ₹4,000 (2 Mo Free)</span>
                  </td>
                  <td class="py-3.5 text-center text-slate-600">
                    <div>₹30,000 / yr</div>
                    <span class="text-[11px] font-semibold text-emerald-600">Save ₹6,000 (2 Mo Free)</span>
                  </td>
                </tr>
                <tr>
                  <td class="py-3.5 font-semibold text-slate-900">500 students</td>
                  <td class="py-3.5 text-center text-slate-600">₹21,000 / yr</td>
                  <td class="py-3.5 text-center font-bold text-blue-700 bg-blue-50/40">
                    <div>₹50,000 / yr</div>
                    <span class="text-[11px] font-semibold text-emerald-600">Save ₹10,000 (2 Mo Free)</span>
                  </td>
                  <td class="py-3.5 text-center text-slate-600">
                    <div>₹75,000 / yr</div>
                    <span class="text-[11px] font-semibold text-emerald-600">Save ₹15,000 (2 Mo Free)</span>
                  </td>
                </tr>
                <tr>
                  <td class="py-3.5 font-semibold text-slate-900">1,000 students</td>
                  <td class="py-3.5 text-center text-slate-600">₹42,000 / yr</td>
                  <td class="py-3.5 text-center font-bold text-blue-700 bg-blue-50/40">
                    <div>₹1,00,000 / yr</div>
                    <span class="text-[11px] font-semibold text-emerald-600">Save ₹20,000 (2 Mo Free)</span>
                  </td>
                  <td class="py-3.5 text-center text-slate-600">
                    <div>₹1,50,000 / yr</div>
                    <span class="text-[11px] font-semibold text-emerald-600">Save ₹30,000 (2 Mo Free)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Full Feature Comparison Matrix -->
        <div class="mx-auto mt-16 max-w-5xl">
          <div class="text-center">
            <h3 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Compare all features side-by-side
            </h3>
            <p class="mt-2 text-sm text-slate-600">
              Pick the right balance for your school. Most schools choose <strong>Pro</strong> for the mobile apps and fee automation.
            </p>
          </div>

          <div class="mt-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table class="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/80">
                  <th class="px-5 py-4 font-bold text-slate-900">Capability</th>
                  <th class="px-4 py-4 text-center font-bold text-slate-700">Lite (₹3.5)</th>
                  <th class="px-4 py-4 text-center font-bold text-blue-700 bg-blue-50/70">Pro (₹10) ★</th>
                  <th class="px-4 py-4 text-center font-bold text-slate-700">Pro+ (₹15)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr *ngFor="let row of featureMatrix" class="hover:bg-slate-50/50">
                  <td class="px-5 py-3.5 font-medium text-slate-900">
                    {{ row.name }}
                    <span class="block text-xs font-normal text-slate-400">{{ row.category }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <ng-container *ngIf="row.lite === true">
                      <svg class="mx-auto h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </ng-container>
                    <ng-container *ngIf="row.lite === false">
                      <span class="text-slate-300 font-bold">—</span>
                    </ng-container>
                    <ng-container *ngIf="row.lite !== true && row.lite !== false">
                      <span class="text-xs font-semibold text-slate-600">{{ row.lite }}</span>
                    </ng-container>
                  </td>
                  <td class="px-4 py-3.5 text-center bg-blue-50/30">
                    <ng-container *ngIf="row.pro === true">
                      <svg class="mx-auto h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </ng-container>
                    <ng-container *ngIf="row.pro === false">
                      <span class="text-slate-300 font-bold">—</span>
                    </ng-container>
                    <ng-container *ngIf="row.pro !== true && row.pro !== false">
                      <span class="text-xs font-bold text-blue-700">{{ row.pro }}</span>
                    </ng-container>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <ng-container *ngIf="row.proPlus === true">
                      <svg class="mx-auto h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </ng-container>
                    <ng-container *ngIf="row.proPlus === false">
                      <span class="text-slate-300 font-bold">—</span>
                    </ng-container>
                    <ng-container *ngIf="row.proPlus !== true && row.proPlus !== false">
                      <span class="text-xs font-bold text-indigo-700">{{ row.proPlus }}</span>
                    </ng-container>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="bg-slate-50 py-16 sm:py-20" aria-labelledby="pricing-faq-heading">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id="pricing-faq-heading" class="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Pricing &amp; plan questions, answered honestly
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
        <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Try any plan on your school's data first</h2>
        <p class="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
          Start on Lite at ₹3.5 or choose Pro at ₹10. Your first month is completely risk-free — pay nothing upfront.
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
  billingCycle = signal<'monthly' | 'annual'>('monthly');

  featureMatrix: MatrixRow[] = [
    { name: 'Student Roster & Profiles', category: 'Core Academic', lite: true, pro: true, proPlus: true },
    { name: 'Daily Roll-Call Attendance', category: 'Core Academic', lite: true, pro: true, proPlus: true },
    { name: 'Timetable Scheduling', category: 'Core Academic', lite: 'View only', pro: true, proPlus: true },
    { name: 'School Circulars & Notices', category: 'Communications', lite: true, pro: true, proPlus: true },
    { name: 'Admin & Teacher Web Dashboard', category: 'Platform', lite: true, pro: true, proPlus: true },
    { name: '100% Free Data Migration', category: 'Onboarding', lite: true, pro: true, proPlus: true },
    { name: 'Dedicated Parent Mobile App', category: 'Mobile & Push', lite: false, pro: true, proPlus: true },
    { name: 'Dedicated Teacher Mobile App', category: 'Mobile & Push', lite: false, pro: true, proPlus: true },
    { name: 'Homework & Assignments Center', category: 'Academics', lite: false, pro: true, proPlus: true },
    { name: 'Exams & Automated Marksheets', category: 'Academics', lite: false, pro: true, proPlus: true },
    { name: 'Fee Management & GST Receipts', category: 'Finance', lite: false, pro: true, proPlus: true },
    { name: 'Parent Grievance Desk / Complaints', category: 'Support', lite: false, pro: true, proPlus: true },
    { name: 'Live Push Notifications', category: 'Mobile & Push', lite: false, pro: true, proPlus: true },
    { name: 'Bi-Annual Staff Training (6 mo)', category: 'Support', lite: false, pro: 'Online meets', proPlus: 'Online + In-Person' },
    { name: 'Transport & Fleet Department', category: 'Operations', lite: false, pro: false, proPlus: true },
    { name: 'Board TC & Character Certificates', category: 'Certificates', lite: false, pro: false, proPlus: true },
    { name: 'Alumni Registry & Archives', category: 'Records', lite: false, pro: false, proPlus: true },
    { name: 'On-Campus School Visit Training', category: 'Support', lite: false, pro: false, proPlus: true },
    { name: 'Dedicated Account Manager', category: 'Support', lite: false, pro: false, proPlus: true },
  ];

  faqs: FaqItem[] = [
    {
      q: 'Which plan should our school choose? Why is Pro recommended?',
      a: 'We built our Lite plan (₹3.5/student/month) so any school can easily onboard with zero budget barrier to manage attendance and student rosters. However, our Pro plan (₹10/student/month) is our flagship recommendation for 95% of schools because it unlocks dedicated Parent & Teacher mobile apps, homework, automated marksheet generation, and online fee collection. Pro+ (₹15/student/month) is for institutions requiring transport fleet management, board certificates, alumni registry, and in-person campus visits.',
    },
    {
      q: 'Can we start on the Lite plan and upgrade to Pro later?',
      a: 'Yes, absolutely. Many schools start on Lite to digitize their student enrollment and attendance in week 1. Once teachers and parents are comfortable, you can switch to the Pro plan with a single click inside your admin dashboard. No re-onboarding or migration is required.',
    },
    {
      q: 'Do we still pay ₹0 upfront for all three plans?',
      a: 'Yes! All three plans (Lite, Pro, and Pro+) come with zero setup fees, zero migration costs, and our 30-day pay-after-use policy. You do not pay a single rupee upfront; you only pay after completing your full first month of active use.',
    },
    {
      q: 'Can you migrate data from our old ERP, files, or Excel sheets?',
      a: 'Yes, 100% free across all plans. Whether your records are in an old ERP, Excel spreadsheets, CSVs, or physical paper registers, our team handles complete migration to SchoolSense with zero disruption.',
    },
    {
      q: 'Do you provide ongoing staff training and school visits?',
      a: 'Yes. On the Pro plan, we provide initial onboarding plus refresher training every 6 months via interactive online video sessions. On the Pro+ plan, our team also conducts in-person on-campus school visits to train teachers and administrative staff on-site without extra fees.',
    },
    {
      q: 'Who controls our school data, and what happens if we ever cancel?',
      a: 'Your school retains 100% ownership and control of your data at all times. There is no lock-in, no annual commitment, and no restriction. Whenever you need it, simply raise a request to receive your complete data in clean, reusable formats (Excel, CSV, PDF). We guarantee full data handover even after cancellation of subscription.',
    },
    {
      q: 'Is our school data safe and private? Do you ever share it?',
      a: 'Your data is 100% safe, securely encrypted in transit and at rest, and strictly confidential. We never sell, share, or misuse your school, staff, parent, or student information with any third party. Your account is maintained lifetime so records are never lost. If you ever request permanent data deletion, all your records will be permanently and irreversibly purged from our servers.',
    },
    {
      q: 'Do you offer a discount if we pay annually?',
      a: 'Yes! If your school chooses annual billing on either the Pro or Pro+ plans, you receive 2 full months FREE (pay for 10 months, get 12 months). On the Pro plan, that is just ₹100 per student per year (effectively ₹8.33/mo), and on Pro+, it is ₹150 per student per year (effectively ₹12.50/mo).',
    },
    {
      q: 'What counts as a "student" for billing?',
      a: 'Only your enrolled, active students. Teachers, principals, admin staff and parents can log in free, with no per-user charge on any plan. If a student leaves mid-month, billing adjusts from the next cycle.',
    },
    {
      q: 'How do we pay?',
      a: 'Each school gets a simple wallet: you top it up and the monthly fee is deducted automatically with a proper GST receipt for every transaction. You always have a clear, transparent ledger of what was billed and when.',
    },
    {
      q: 'What are "on-demand features"?',
      a: 'Anything bespoke your school specifically asks for beyond the standard system (like a special report format or custom integration). We quote these openly before building anything, and your base per-student subscription rate never changes because of them.',
    },
  ];

  constructor() {
    this.seo.setPage({
      title: 'SchoolSense Pricing: Lite (₹3.5), Pro (₹10) & Pro+ (₹15) Plans | All Features Included',
      description:
        'Affordable, transparent school management software in India. Lite plan at ₹3.5/student/month for easy onboarding, Pro plan at ₹10/mo with mobile apps & fees, and Pro+ at ₹15/mo for transport & campus visits. ₹0 setup fee, 30-day pay-after-use trial.',
      path: '/pricing',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'SchoolSense: School Management System',
          description:
            'Cloud school management system for Indian schools with attendance, timetable, homework, exams, fees, transport department, staff logins, notices, complaints, alumni management, auto-generated certificates and live Parent Connect.',
          brand: { '@type': 'Brand', name: 'SchoolSense' },
          offers: [
            {
              '@type': 'Offer',
              name: 'Lite Plan',
              price: '3.50',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: 'https://www.schoolsense.in/pricing',
              description: 'Lite plan: ₹3.5 per student per month for core school digitization, attendance and student rosters.',
            },
            {
              '@type': 'Offer',
              name: 'Pro Plan (Recommended)',
              price: '10.00',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: 'https://www.schoolsense.in/pricing',
              description: 'Pro plan: ₹10 per student per month with dedicated Parent & Teacher mobile apps, homework, exams, and fee management.',
            },
            {
              '@type': 'Offer',
              name: 'Pro+ Plan',
              price: '15.00',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: 'https://www.schoolsense.in/pricing',
              description: 'Pro+ plan: ₹15 per student per month with transport fleet tracking, automated board TC/CC certificates, and on-campus school visits.',
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
