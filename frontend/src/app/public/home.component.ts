import { Component, inject, afterNextRender, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { VectorArtComponent } from './vector-art.component';
import { NgZone } from '@angular/core';
import { SeoService } from '../core/services/seo.service';

interface HeroSlide {
  src: string;
  alt: string;
}

interface CampusSlide {
  src: string;
  alt: string;
  badge: string;
  title: string;
  caption: string;
}

interface HowStep {
  /** Name of the vector illustration shown in the step. */
  art: string;
  title: string;
  detail: string;
}

interface FeatureCard {
  icon: string;   // inline SVG path data (heroicons outline, 24x24)
  /** Name of the vector illustration shown in the card. */
  art: string;
  name: string;
  tagline: string;
}

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, VectorArtComponent],
  template: `
    <!-- ============================== HERO — FULL-BLEED SLIDESHOW ============================== -->
    <section class="relative overflow-hidden bg-slate-950" aria-label="SchoolSense introduction"
             (mouseenter)="stopSlideshow()" (mouseleave)="startSlideshow()">
      <!-- Background slideshow -->
      <div class="absolute inset-0">
        <img *ngFor="let s of slides; let i = index" [src]="s.src" [alt]="s.alt"
             class="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out"
             [ngClass]="currentSlide() === i ? 'opacity-100 ss-kenburns' : 'opacity-0'"
             [attr.fetchpriority]="i === 0 ? 'high' : null"
             [attr.loading]="i === 0 ? null : 'lazy'" />
        <!-- contrast overlays -->
        <div class="absolute inset-0 bg-slate-950/55" aria-hidden="true"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/85" aria-hidden="true"></div>
      </div>

      <!-- Overlay content -->
      <div class="relative mx-auto flex min-h-[560px] max-w-7xl flex-col items-center justify-center px-4 py-28 text-center sm:min-h-[660px] sm:px-6 lg:min-h-[720px] lg:px-8">
        <span class="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-sm">
          Built for Indian schools — CBSE, ICSE &amp; State Boards
        </span>

        <h1 class="mt-7 max-w-4xl text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl sm:leading-[1.08] lg:text-6xl">
          India's simplest
          <span class="text-blue-300">school management system</span>
          — with live Parent&nbsp;Connect
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-200 drop-shadow sm:text-lg">
          Attendance, homework, exams, fees, timetable and certificates — everything your school
          runs on, in one easy software. And parents see their child's whole day
          <strong class="font-semibold text-white">live on their phone</strong>.
        </p>

        <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="ss-demo-cta group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-950/40 transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 sm:w-auto">
            <span class="ss-shine" aria-hidden="true"></span>
            Book a Free Demo
            <svg class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span class="ss-ribbon" aria-hidden="true">80% OFF</span>
          </a>
        </div>

      </div>

      <!-- Prev / Next arrows -->
      <button type="button" (click)="prevSlide()" aria-label="Previous slide"
              class="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:block">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
      </button>
      <button type="button" (click)="nextSlide()" aria-label="Next slide"
              class="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:block">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
      </button>

      <!-- Dots + slide counter -->
      <div class="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        <button *ngFor="let s of slides; let i = index" type="button" (click)="goToSlide(i)"
                [attr.aria-label]="'Go to slide ' + (i + 1)"
                class="h-2.5 rounded-full transition-all duration-300"
                [ngClass]="currentSlide() === i ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'"></button>
      </div>
      <div class="absolute bottom-5 right-6 hidden text-sm font-semibold tracking-widest text-white/80 sm:block">
        0{{ currentSlide() + 1 }} / 0{{ slides.length }}
      </div>
    </section>

    <!-- ============================== TRUST STRIP ============================== -->
    <section class="border-y border-slate-100 bg-white" aria-label="Why schools choose SchoolSense">
      <div class="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
        <div class="flex flex-col items-center text-center">
          <app-vector-art name="classroom" class="h-20 w-20 sm:h-24 sm:w-24" />
          <p class="mt-3 text-2xl font-extrabold text-slate-900">All-in-one</p>
          <p class="mt-1 text-sm text-slate-500">One system for every school task</p>
        </div>
        <div class="flex flex-col items-center text-center">
          <app-vector-art name="parent-phone" class="h-20 w-20 sm:h-24 sm:w-24" />
          <p class="mt-3 text-2xl font-extrabold text-slate-900">Live</p>
          <p class="mt-1 text-sm text-slate-500">Updates for every parent</p>
        </div>
        <div class="flex flex-col items-center text-center">
          <app-vector-art name="certificate" class="h-20 w-20 sm:h-24 sm:w-24" />
          <p class="mt-3 text-2xl font-extrabold text-slate-900">1 click</p>
          <p class="mt-1 text-sm text-slate-500">TC &amp; certificates generated</p>
        </div>
        <div class="flex flex-col items-center text-center">
          <app-vector-art name="fees" class="h-20 w-20 sm:h-24 sm:w-24" />
          <p class="mt-3 text-2xl font-extrabold text-slate-900">₹10/month</p>
          <p class="mt-1 text-sm text-slate-500">Per student — launch offer</p>
        </div>
      </div>
    </section>

    <!-- ============================== WHY SCHOOLSENSE — 7 SELLING POINTS ============================== -->
    <section class="bg-slate-50 py-16 sm:py-24" aria-labelledby="why-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Why SchoolSense</p>
          <h2 id="why-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            The system every school needs — made simple enough for everyone
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Seven reasons schools choose us and stay with us. The first one is our promise.
          </p>
        </div>

        <!-- Pillar 1 — Simplest (full width) -->
        <div class="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="grid gap-8 p-8 sm:p-10 lg:grid-cols-5 lg:items-center lg:p-12">
            <div class="border-l-4 border-blue-600 pl-6 lg:col-span-3">
              <span class="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">What matters most to us</span>
              <h3 class="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                So simple, anyone in your school can run it
              </h3>
              <p class="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                If your staff can use WhatsApp, they can use SchoolSense from day one. Big buttons,
                plain words, and one obvious way to do every task — no manuals, no jargon, and no
                computer expert needed at your school.
              </p>
            </div>
            <ul class="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
              <li class="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <svg class="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                No manuals or week-long training
              </li>
              <li class="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <svg class="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                No IT staff required at school
              </li>
              <li class="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <svg class="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Free setup &amp; staff training by us
              </li>
              <li class="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                <svg class="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Simple language anyone understands
              </li>
            </ul>
          </div>
        </div>

        <!-- Pillars 2–7 -->
        <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div *ngFor="let p of whyPillars"
               class="rounded-3xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.9" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="p.icon" />
              </svg>
            </span>
            <h3 class="mt-4 text-lg font-bold text-slate-900">{{ p.name }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ p.detail }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== FEATURES GRID ============================== -->
    <section class="bg-white py-16 sm:py-24" aria-labelledby="features-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Everything included</p>
          <h2 id="features-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything your school runs on — in one simple system
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Connected tools that replace your registers, spreadsheets, notice board and school diary.
            No technical skills needed — if your staff can use WhatsApp, they can use SchoolSense.
          </p>
        </div>

        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div *ngFor="let f of features"
               class="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-600/5">
            <app-vector-art [name]="f.art" class="h-16 w-16" />
            <h3 class="mt-4 text-base font-bold text-slate-900">{{ f.name }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ f.tagline }}</p>
          </div>
        </div>

        <div class="mt-10 text-center">
          <a routerLink="/features" class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Explore all features in detail
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- ============================== PARENT CONNECT ============================== -->
    <section class="bg-slate-50 py-16 sm:py-24" aria-labelledby="parent-heading">
      <div class="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <!-- Phone mockup + photo -->
        <div class="relative mx-auto w-full max-w-md">
          <img src="/assets/images/slider_parents.jpg"
               alt="Indian parent checking their child's live school updates on a phone"
               class="absolute -top-6 right-0 hidden w-56 rotate-3 rounded-2xl border-4 border-white object-cover shadow-xl md:block"
               width="448" height="560" loading="lazy" />

          <div class="relative mx-auto w-64 rounded-[2.2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl sm:w-72">
            <div class="mx-auto mt-2 h-1.5 w-20 rounded-full bg-slate-700"></div>
            <div class="rounded-[1.7rem] bg-slate-50 px-4 pb-6 pt-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-slate-900">Aarav Sharma</p>
                  <p class="text-[11px] text-slate-500">Class 5-A · Roll No 12</p>
                </div>
                <span class="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span> LIVE
                </span>
              </div>

              <div class="mt-4 space-y-2.5">
                <div class="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                  </span>
                  <div>
                    <p class="text-xs font-semibold text-slate-900">Marked Present</p>
                    <p class="text-[10px] text-slate-500">Today · 8:02 AM · Class 5-A</p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18.75c1.955 0 3.684.672 5 1.808V7.542a6.984 6.984 0 00-1-1.5z" /></svg>
                  </span>
                  <div>
                    <p class="text-xs font-semibold text-slate-900">Maths homework due Friday</p>
                    <p class="text-[10px] text-slate-500">Chapter 7 · Exercise 7.2</p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </span>
                  <div>
                    <p class="text-xs font-semibold text-slate-900">Unit Test 2 marks published</p>
                    <p class="text-[10px] text-slate-500">Maths 18/20 · English 16/20</p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  <div>
                    <p class="text-xs font-semibold text-slate-900">Fee receipt ₹2,500 — paid</p>
                    <p class="text-[10px] text-slate-500">Term 2 · Receipt #2041</p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
                  </span>
                  <div>
                    <p class="text-xs font-semibold text-slate-900">Notice: Annual Day on 18th</p>
                    <p class="text-[10px] text-slate-500">All parents · 10:15 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Copy -->
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Parent Connect — our #1 selling point</p>
          <h2 id="parent-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Parents see their child's school life — live
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Most software just stores records. SchoolSense keeps parents connected the moment
            things happen. That trust is why parents insist their school stays on SchoolSense.
          </p>

          <ul class="mt-8 space-y-4">
            <li *ngFor="let b of parentBullets" class="flex items-start gap-3">
              <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </span>
              <p class="text-sm leading-relaxed text-slate-700 sm:text-base">
                <strong class="font-semibold text-slate-900">{{ b.title }}</strong> — {{ b.detail }}
              </p>
            </li>
          </ul>

          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
            See Parent Connect in the demo
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- ============================== MOBILE APPS ============================== -->
    <section class="bg-white py-16 sm:py-24" aria-labelledby="apps-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Mobile apps</p>
          <h2 id="apps-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            One platform. Two dedicated mobile apps.
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            The web panel runs your school. The apps keep parents and teachers connected to it —
            every day, in everyone's pocket.
          </p>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-2">
          <!-- ============ PARENT APP ============ -->
          <div class="rounded-3xl border border-slate-200 bg-gradient-to-b from-blue-50/60 to-white p-7 sm:p-9">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Parent app</p>
            <h3 class="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">Your child's school day, live on your phone</h3>

            <div class="mx-auto mt-7 w-60 rounded-[2rem] border-[5px] border-slate-900 bg-slate-900 shadow-xl sm:w-64">
              <div class="rounded-[1.55rem] bg-slate-50 px-3.5 pb-5 pt-3.5">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] font-bold text-slate-900">Notifications</p>
                  <span class="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                    <span class="h-1 w-1 animate-pulse rounded-full bg-emerald-500"></span> LIVE
                  </span>
                </div>
                <div class="mt-2.5 space-y-2">
                  <div class="flex items-start gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                    </span>
                    <div>
                      <p class="text-[10px] font-semibold text-slate-900">Aarav marked Present</p>
                      <p class="text-[9px] text-slate-500">Attendance · 8:02 AM</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </span>
                    <div>
                      <p class="text-[10px] font-semibold text-slate-900">Unit Test 2 marks published</p>
                      <p class="text-[9px] text-slate-500">Results · 11:40 AM</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </span>
                    <div>
                      <p class="text-[10px] font-semibold text-slate-900">Fee receipt ₹2,500 — paid</p>
                      <p class="text-[9px] text-slate-500">Fees · Yesterday</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-600">
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
                    </span>
                    <div>
                      <p class="text-[10px] font-semibold text-slate-900">Annual Day on 18th October</p>
                      <p class="text-[9px] text-slate-500">Event · Yesterday</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ul class="mt-7 space-y-3">
              <li *ngFor="let b of parentAppFeatures" class="flex items-start gap-2.5">
                <svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span class="text-sm leading-relaxed text-slate-700">{{ b }}</span>
              </li>
            </ul>
          </div>

          <!-- ============ TEACHER APP ============ -->
          <div class="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-7 sm:p-9">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Teacher app</p>
            <h3 class="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">Your class, handled in minutes</h3>

            <div class="mx-auto mt-7 w-60 rounded-[2rem] border-[5px] border-slate-900 bg-slate-900 shadow-xl sm:w-64">
              <div class="rounded-[1.55rem] bg-slate-50 px-3.5 pb-5 pt-3.5">
                <div class="flex items-center justify-between">
                  <p class="text-[11px] font-bold text-slate-900">Class 5-A · Today</p>
                  <span class="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                    <span class="h-1 w-1 animate-pulse rounded-full bg-emerald-500"></span> 42/45
                  </span>
                </div>
                <div class="mt-2.5 grid grid-cols-2 gap-2">
                  <div class="flex items-center gap-1.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
                    </span>
                    <p class="text-[9px] font-semibold text-slate-900">Mark Attendance</p>
                  </div>
                  <div class="flex items-center gap-1.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18.75c1.955 0 3.684.672 5 1.808V7.542a6.984 6.984 0 00-1-1.5z" /></svg>
                    </span>
                    <p class="text-[9px] font-semibold text-slate-900">Post Homework</p>
                  </div>
                  <div class="flex items-center gap-1.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    </span>
                    <p class="text-[9px] font-semibold text-slate-900">Enter Marks</p>
                  </div>
                  <div class="flex items-center gap-1.5 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-600">
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
                    </span>
                    <p class="text-[9px] font-semibold text-slate-900">Send Notice</p>
                  </div>
                </div>
                <div class="mt-2.5 flex items-start gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-100 text-rose-600">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-semibold text-slate-900">Fee concern — Riya · 5-A</p>
                    <p class="text-[9px] text-slate-500">Parent complaint · assigned to you</p>
                  </div>
                  <span class="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">IN PROGRESS</span>
                </div>
              </div>
            </div>

            <ul class="mt-7 space-y-3">
              <li *ngFor="let b of teacherAppFeatures" class="flex items-start gap-2.5">
                <svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span class="text-sm leading-relaxed text-slate-700">{{ b }}</span>
              </li>
            </ul>
          </div>
        </div>

        <p class="mt-10 text-center text-sm font-semibold text-slate-900">
          Both apps are included free with every plan — Android &amp; iPhone.
        </p>
        <div class="mt-4 text-center">
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
            See both apps live in a free demo
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- ============================== BUILT FOR INDIAN SCHOOLS ============================== -->
    <section class="bg-white py-16 sm:py-24" aria-labelledby="schools-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Made for real Indian schools</p>
          <h2 id="schools-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Built for how Indian schools actually run
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Not a foreign system adapted for India — SchoolSense is designed around Indian school
            life from the first screen.
          </p>
        </div>

        <!-- School types & boards -->
        <div class="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
          <!-- Campus & School Gallery Slider (Slow, smooth auto-transition) -->
          <div class="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-950 shadow-xl border border-slate-200/80"
               (mouseenter)="stopCampusSlideshow()" (mouseleave)="startCampusSlideshow()">
            
            <!-- Slides Container -->
            <div class="relative h-full w-full">
              <div *ngFor="let s of campusSlides; let i = index"
                   class="absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out"
                   [ngClass]="currentCampusSlide() === i ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'">
                <img [src]="s.src" [alt]="s.alt"
                     class="h-full w-full object-cover transition-transform duration-[6500ms] ease-out"
                     [ngClass]="currentCampusSlide() === i ? 'scale-105' : 'scale-100'"
                     [attr.fetchpriority]="i === 0 ? 'high' : null"
                     [attr.loading]="i === 0 ? null : 'lazy'" />
                
                <!-- Ambient contrast gradient for captions -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"></div>

                <!-- Slide Title & Detail (Bottom-Left) -->
                <div class="absolute bottom-4 left-4 right-16 z-20 text-white">
                  <p class="text-sm sm:text-base font-bold drop-shadow-sm leading-tight">{{ s.title }}</p>
                  <p class="text-xs text-slate-200/90 drop-shadow-sm line-clamp-1 mt-0.5">{{ s.caption }}</p>
                </div>
              </div>
            </div>

            <!-- Prev / Next arrows (Visible on hover & focus) -->
            <button type="button" (click)="prevCampusSlide()" aria-label="Previous campus photo"
                    class="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-all hover:bg-black/75 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm cursor-pointer">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button type="button" (click)="nextCampusSlide()" aria-label="Next campus photo"
                    class="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-all hover:bg-black/75 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm cursor-pointer">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <!-- Bottom Navigation Dots -->
            <div class="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
              <button *ngFor="let s of campusSlides; let i = index" type="button" (click)="goToCampusSlide(i)"
                      [attr.aria-label]="'View ' + s.badge"
                      class="h-1.5 rounded-full transition-all duration-500 cursor-pointer"
                      [ngClass]="currentCampusSlide() === i ? 'w-6 bg-white shadow-sm' : 'w-1.5 bg-white/45 hover:bg-white/80'"></button>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Every kind of school, every board
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              From a 120-student primary school to a 3,000-student senior secondary campus — with
              whatever board and medium your school follows.
            </p>
            <div class="mt-6 grid gap-3 sm:grid-cols-2">
              <div *ngFor="let t of schoolTypes" class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                </span>
                <span class="text-sm font-medium text-slate-700">{{ t }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Who sees what -->
        <div class="mt-16">
          <h3 class="text-center text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            One system, a clear view for everyone
          </h3>
          <p class="mx-auto mt-3 max-w-xl text-center text-sm text-slate-600 sm:text-base">
            Each person opens SchoolSense and sees exactly what their role needs — nothing more, nothing confusing.
          </p>
          <div class="mt-9 grid gap-6 lg:grid-cols-3">
            <div *ngFor="let r of roleViews" class="rounded-3xl border border-slate-200 bg-white p-7">
              <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="r.icon" />
                </svg>
              </span>
              <h4 class="mt-4 text-lg font-bold text-slate-900">{{ r.name }}</h4>
              <p class="mt-1 text-sm font-medium text-blue-700">{{ r.tagline }}</p>
              <ul class="mt-4 space-y-2">
                <li *ngFor="let item of r.items" class="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Indian school workflow -->
        <div class="mt-16 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-8 sm:p-10">
          <div class="mx-auto max-w-2xl text-center">
            <h3 class="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Made for Indian school life
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              The small details that other software misses — and that your staff notice on day one.
            </p>
          </div>
          <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div *ngFor="let w of schoolWorkflow" class="flex items-start gap-3 rounded-2xl bg-white/80 px-5 py-4 ring-1 ring-blue-100">
              <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="w.icon" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-bold text-slate-900">{{ w.title }}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ w.detail }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== CERTIFICATES BAND ============================== -->
    <section class="bg-white py-16 sm:py-20" aria-labelledby="certificates-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-12 sm:px-12 lg:px-16">
          <div class="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 id="certificates-heading" class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Official documents, without the paperwork
              </h2>
              <p class="mt-3 max-w-lg text-sm leading-relaxed text-blue-100 sm:text-base">
                Transfer Certificates, Character Certificates and other important documents are
                auto-generated with proper formats and your school's details — no more filling
                templates by hand.
              </p>
              <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
                 class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50">
                Watch it generate in the demo
              </a>
            </div>
            <div class="flex items-center justify-center">
              <app-vector-art name="certificate" class="h-40 w-40 sm:h-48 sm:w-48" />
            </div>
            <div class="flex flex-wrap justify-center gap-3 lg:justify-end">
              <div *ngFor="let c of certificates"
                   class="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur-sm">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="c.icon" />
                  </svg>
                </span>
                <div>
                  <p class="text-sm font-bold text-white">{{ c.name }}</p>
                  <p class="text-xs text-blue-100">{{ c.hint }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== HOW IT WORKS ============================== -->
    <section class="bg-white pb-16 pt-4 sm:pb-24" aria-labelledby="how-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Get started</p>
          <h2 id="how-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Up and running in days, not months
          </h2>
          <p class="mt-4 text-base text-slate-600 sm:text-lg">
            You don't need a computer expert at your school. Our team does the heavy lifting for you — free.
          </p>
        </div>

        <div class="mt-12 grid gap-6 md:grid-cols-3">
          <div *ngFor="let s of steps; let i = index" class="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-7">
            <span class="absolute -top-4 left-7 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/25">{{ i + 1 }}</span>
            <app-vector-art [name]="s.art" class="mt-5 h-20 w-20" />
            <h3 class="mt-4 text-lg font-bold text-slate-900">{{ s.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ s.detail }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== PRICING TEASER ============================== -->
    <section class="bg-white py-16 sm:py-24" aria-labelledby="pricing-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Transparent pricing</p>
          <h2 id="pricing-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            One simple plan. Every feature included.
          </h2>
          <p class="mt-4 text-base text-slate-600 sm:text-lg">
            No hidden modules, no per-feature charges, no annual lock-in. We publish our price —
            most others make you call for a quote.
          </p>
        </div>

        <div class="mx-auto mt-10 max-w-xl">
          <div class="relative rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-xl shadow-blue-600/10">
            <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
              Launch offer — 80% off
            </span>
            <div class="text-center">
              <div class="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
                <span class="text-2xl font-semibold text-slate-400 line-through sm:text-3xl">₹59</span>
                <span class="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">₹10</span>
                <span class="text-sm text-slate-500">/ student / month</span>
              </div>
              <p class="mt-3 text-sm font-medium text-slate-600">
                Billed monthly &middot; Only for active enrolled students &middot; No hidden charges
              </p>
            </div>
            <ul class="mt-7 grid gap-2.5 sm:grid-cols-2">
              <li *ngFor="let inc of pricingIncludes" class="flex items-center gap-2 text-sm text-slate-700">
                <svg class="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ inc }}
              </li>
            </ul>
            <a routerLink="/pricing"
               class="mt-8 block rounded-xl bg-blue-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700">
              See full pricing details
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== FAQ ============================== -->
    <section class="bg-slate-50 py-16 sm:py-24" aria-labelledby="faq-heading">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Questions</p>
          <h2 id="faq-heading" class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div class="mt-10 space-y-3">
          <details *ngFor="let f of faqs" class="group rounded-2xl border border-slate-200 bg-white open:ring-1 open:ring-blue-200">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4.5 py-5 text-left">
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

    <!-- ============================== FINAL CTA ============================== -->
    <section class="bg-white pb-16 sm:pb-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white px-6 py-14 text-center sm:px-12">
          <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Ready to see SchoolSense on your school's data?
          </h2>
          <p class="mx-auto mt-3 max-w-xl text-sm text-slate-600 sm:text-base">
            Book a free demo — we'll walk you through attendance to certificates in 30 minutes,
            using a sample school just like yours.
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="ss-demo-cta group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-950/40 transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 sm:w-auto">
            <span class="ss-shine" aria-hidden="true"></span>
            Book a Free Demo
            <svg class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span class="ss-ribbon" aria-hidden="true">80% OFF</span>
          </a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent {
  private seo = inject(SeoService);
  private zone = inject(NgZone);

  // ---------- Hero slideshow (browser-only; prerender renders slide 1 statically) ----------
  slides: HeroSlide[] = [
    { src: '/assets/images/slider_classroom.jpg', alt: 'Indian school classroom — students in uniform learning with a teacher' },
    { src: '/assets/images/slider_leadership.jpg', alt: 'Indian school principal managing the school with SchoolSense' },
    { src: '/assets/images/slider_learning.jpg', alt: 'Indian students studying together in the school library' },
    { src: '/assets/images/slider_parents_1.jpg', alt: 'Indian student studying at home while parents follow updates on their phone' },
  ];
  currentSlide = signal(0);
  private slideTimer: ReturnType<typeof setInterval> | null = null;

  // ---------- Built for Indian Schools — Campus Gallery Slideshow (Slow, smooth) ----------
  campusSlides: CampusSlide[] = [
    {
      src: '/assets/images/school_building.jpg',
      alt: 'Modern Indian School Campus Building',
      badge: 'Main Campus',
      title: 'Senior Secondary & High School Campuses',
      caption: 'Multi-storey academic wings with modern architecture & grounds',
    },
    {
      src: '/assets/images/school_campus_courtyard.jpg',
      alt: 'Indian School Campus Courtyard & Assembly Grounds',
      badge: 'Campus Courtyard',
      title: 'Lush Assembly & Transport Grounds',
      caption: 'Dedicated bus fleets, open green assembly zones & security',
    },
    {
      src: '/assets/images/slider_classroom.jpg',
      alt: 'Interactive Indian School Smart Classroom',
      badge: 'Smart Classrooms',
      title: 'Digital & Smart Classroom Infrastructure',
      caption: 'Engaging, interactive lessons with happy, uniform-clad students',
    },
    {
      src: '/assets/images/school_science_lab.jpg',
      alt: 'Advanced STEM Science & Robotics Lab',
      badge: 'Science & Robotics Lab',
      title: 'Hands-on Practical Labs & Experiments',
      caption: 'Physics, chemistry, biology and STEM robotics practical facilities',
    },
    {
      src: '/assets/images/slider_learning.jpg',
      alt: 'School Library & Knowledge Center',
      badge: 'Library & Reading Room',
      title: 'Rich Knowledge Centers & Study Halls',
      caption: 'Quiet reading corners, reference books & digital research',
    },
    {
      src: '/assets/images/slider_leadership.jpg',
      alt: 'Principal & Faculty Conference Room',
      badge: 'Leadership & Staff Desk',
      title: 'Principal & Staff Conference Facilities',
      caption: 'Collaborative curriculum planning & academic administration',
    },
  ];
  currentCampusSlide = signal(0);
  private campusSlideTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // afterNextRender only runs in the browser — keeps static prerendering stable.
    afterNextRender(() => {
      this.startSlideshow();
      this.startCampusSlideshow();
    });
    inject(DestroyRef).onDestroy(() => {
      this.stopSlideshow();
      this.stopCampusSlideshow();
    });

    this.seo.setPage({
      title: 'Simple School Management System with Live Parent Connect',
      description:
        'SchoolSense is India\'s easiest school management system: attendance, homework, exams, fees, timetable, notices, complaints, alumni and auto-generated TC/CC certificates — with live Parent Connect. Launch offer ₹10 per student/month, all features included.',
      path: '/',
      jsonLd: [
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
          ],
        },
      ],
    });
  }

  startSlideshow(): void {
    this.stopSlideshow();
    this.slideTimer = this.zone.runOutsideAngular(() =>
      setInterval(() => this.zone.run(() => this.nextSlide()), 3500),
    );
  }

  stopSlideshow(): void {
    if (this.slideTimer !== null) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  nextSlide(): void {
    this.goToSlide((this.currentSlide() + 1) % this.slides.length);
  }

  prevSlide(): void {
    this.goToSlide((this.currentSlide() - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.startSlideshow();
  }

  // ---------- Campus Slideshow Handlers (Slow 5.5s interval) ----------
  startCampusSlideshow(): void {
    this.stopCampusSlideshow();
    this.campusSlideTimer = this.zone.runOutsideAngular(() =>
      setInterval(() => this.zone.run(() => this.nextCampusSlide()), 5500),
    );
  }

  stopCampusSlideshow(): void {
    if (this.campusSlideTimer !== null) {
      clearInterval(this.campusSlideTimer);
      this.campusSlideTimer = null;
    }
  }

  nextCampusSlide(): void {
    this.goToCampusSlide((this.currentCampusSlide() + 1) % this.campusSlides.length);
  }

  prevCampusSlide(): void {
    this.goToCampusSlide((this.currentCampusSlide() - 1 + this.campusSlides.length) % this.campusSlides.length);
  }

  goToCampusSlide(index: number): void {
    this.currentCampusSlide.set(index);
    this.startCampusSlideshow();
  }

  features: FeatureCard[] = [
    {
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
      art: 'timetable',
      name: 'Timetable & Scheduling',
      tagline: 'Create class-wise timetables in minutes. Teachers and parents always see the latest schedule — no confusion.',
    },
    {
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      art: 'attendance',
      name: 'Attendance Register',
      tagline: 'Mark the whole class in seconds. Parents know the moment their child is marked absent.',
    },
    {
      icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18.75c1.955 0 3.684.672 5 1.808V7.542a6.984 6.984 0 00-1-1.5zM12 6.042A8.967 8.967 0 0118 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18.75c-1.955 0-3.684.672-5 1.808V7.542a6.984 6.984 0 011-1.5z',
      art: 'homework',
      name: 'Homework & Assignments',
      tagline: 'Teachers post homework with due dates. Parents see it the same evening — no more lost diaries.',
    },
    {
      icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
      art: 'exams',
      name: 'Exams & Marksheets',
      tagline: 'Enter marks once — report cards calculate themselves. Parents get results on their phone.',
    },
    {
      icon: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
      art: 'notices',
      name: 'Circulars & Notices',
      tagline: 'Send notices to everyone or selected classes in one tap. No more printing and folding circulars.',
    },
    {
      icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
      art: 'complaint',
      name: 'Grievance Desk / Complaints',
      tagline: 'Parents raise concerns as tickets and follow replies until they are properly resolved.',
    },
    {
      icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z',
      art: 'fees',
      name: 'Fee Management & Invoicing',
      tagline: 'Fee structures, invoices and receipts — organised in one place with a clear record per student.',
    },
    {
      icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
      art: 'alumni',
      name: 'Alumni Management',
      tagline: 'Keep former students connected with a proper alumni record — your school community, for life.',
    },
    {
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      art: 'certificate',
      name: 'Auto-Generated Certificates',
      tagline: 'TC, Character Certificate and more — generated with proper formats in one click.',
    },
  ];

  parentBullets = [
    { title: 'Instant push notifications', detail: 'every activity — attendance, homework, marks, fees, fines and events — the moment it happens.' },
    { title: 'Live attendance', detail: 'the moment roll call happens, not at day-end.' },
    { title: 'Homework & marks instantly', detail: 'as soon as the teacher posts them.' },
    { title: 'Fee invoices, receipts & fines', detail: 'always available — no "I paid, where is the receipt?".' },
    { title: 'Emergency alerts', detail: 'urgent school messages reach parents in seconds — not by evening.' },
    { title: 'Notices, events & holidays', detail: 'delivered instantly, nothing lost in the school bag.' },
    { title: 'Complaints with tracking', detail: 'raise an issue, follow every reply until it is closed.' },
    { title: "Today's timetable", detail: 'no morning confusion about which books to pack.' },
  ];

  parentAppFeatures = [
    'Push notification for every activity — attendance, homework, marks, fees, fines, events',
    'Emergency alerts — urgent school messages reach you in seconds',
    'Exam marks, results and report cards the moment they are published',
    'Fee invoices, receipts and fines — all in one place',
    'Raise complaints and follow every reply until they are resolved',
    'Live daily attendance and today\u2019s timetable',
  ];

  teacherAppFeatures = [
    'Mark the whole class\u2019s attendance in seconds',
    'Post homework with due dates — parents notified instantly',
    'Enter marks once — results reach parents automatically',
    'Monitor parent complaints, reply and update status until closed',
    'Publish notices to one class or the whole school',
  ];

  schoolTypes = [
    'Nursery to Class 12',
    'CBSE, ICSE & State Boards',
    'English & Hindi medium',
    'Single & multi-branch schools',
    '100 to 5,000+ students',
    'Schools with hostel & transport offices',
  ];

  roleViews = [
    {
      name: 'Principal / School Owner',
      tagline: 'The whole school, at a glance',
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
      items: ['Today\u2019s attendance across every class', 'Fee collection and pending fees', 'Faculty and student strength', 'Parent complaints that need attention'],
    },
    {
      name: 'Class Teacher',
      tagline: 'Their class, ready in seconds',
      icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
      items: ['Mark the whole class in under a minute', 'Post homework with a due date', 'Enter marks — report cards calculate themselves', 'See today\u2019s timetable and class strength'],
    },
    {
      name: 'Parent / Guardian',
      tagline: 'Their child, live',
      icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
      items: ['Attendance the moment roll call happens', 'Homework, marks and results instantly', 'Fee invoices, receipts and fines', 'Raise a complaint and track it to resolution'],
    },
  ];

  schoolWorkflow = [
    { icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', title: 'April\u2013March sessions', detail: 'Academic years the way Indian schools run them, with promotion at year end.' },
    { icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', title: 'Class-teacher system', detail: 'Class teachers see their own section\u2019s students, attendance and reports.' },
    { icon: 'M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5', title: 'Roll numbers & sections', detail: 'Class, section and roll number for every student, exactly like your registers.' },
    { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', title: 'Proper certificate formats', detail: 'TC, Character Certificate and Bonafide letters with Indian school formats.' },
    { icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z', title: 'Festivals & holidays', detail: 'The school calendar with Indian festivals, holidays and events built in.' },
    { icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Fees in rupees', detail: 'Fee heads, invoices, receipts and fines in \u20b9 \u2014 no conversion, no confusion.' },
  ];

  whyPillars = [
    {
      icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
      name: 'Live Parent Connect',
      detail: 'Every activity of the child, live — attendance, marks, complaints, fines and even emergency alerts reach parents the moment they happen.',
    },
    {
      icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3.75 0h.008v.008h-.008V1.5zm3.75 18h.008v.008H13.5v-.008z',
      name: 'Free mobile apps',
      detail: 'Dedicated apps for Parents and Teachers on Android & iPhone — included free in every plan. No per-user charges, ever.',
    },
    {
      icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
      name: '100% secure & encrypted',
      detail: 'Encrypted in transit and at rest, role-based access control, and passwords stored only as one-way hashes. Every sensitive action is recorded in an audit log, and your data is yours \u2014 exported on request.',
    },
    {
      icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
      name: 'No lock-in, ever',
      detail: 'Monthly billing only — no yearly blockage, no forced contracts. Leave anytime and take your data with you. We earn your renewal every single month.',
    },
    {
      icon: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437',
      name: 'Custom features on demand',
      detail: 'Every school works differently. Tell us what your school needs and we build it for you — your base plan price never changes because of it.',
    },
    {
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
      name: 'One-click documents',
      detail: 'TC, Character Certificate, Bonafide and every document a school needs — auto-generated with correct formats in a single click.',
    },
  ];

  certificates = [
    { name: 'Transfer Certificate (TC)', hint: 'One click, proper format', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
    { name: 'Character Certificate', hint: 'Ready to print & sign', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
    { name: 'Bonafide & more', hint: 'Other school documents', icon: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125c0 .621-.504 1.125-1.125 1.125H6.375c-.621 0-1.125-.504-1.125-1.125V6.375c0-.621.504-1.125 1.125-1.125h3c.621 0 1.125.504 1.125 1.125v3z' },
  ];

  steps: HowStep[] = [
    {
      art: 'parent-phone',
      title: 'Book a free demo',
      detail: 'A 30-minute call where we show you the full system using a sample school — no pressure, no jargon.',
    },
    {
      art: 'cloud',
      title: 'We set your school up — free',
      detail: 'We enter your classes, sections, subjects and fee structure, and train your staff step by step.',
    },
    {
      art: 'promotion',
      title: 'Go live the same week',
      detail: 'Mark attendance, post homework and send your first notice. Parents start getting updates from day one.',
    },
  ];


  pricingIncludes = [
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
    'Free setup & staff training',
    'Works on any phone',
  ];

  faqs: FaqItem[] = [
    {
      q: 'Do we need a computer expert at our school to use SchoolSense?',
      a: 'No. SchoolSense is designed for everyday users — big buttons, simple screens and plain language. Our team does the initial setup and trains your staff for free. If your staff can use WhatsApp, they can use SchoolSense.',
    },
    {
      q: 'How much does it cost?',
      a: 'The regular price is ₹59 per student per month, which covers every feature. As a launch offer, new schools pay just ₹10 per student per month. Billing is monthly and only for enrolled students — no yearly lock-in, no setup fee.',
    },
    {
      q: 'Are all features really included in this price?',
      a: 'Yes. Timetable, attendance, homework, exams & marksheets, notices, complaints, fee management, alumni management and auto-generated certificates (TC, Character Certificate and more) are all included in the base price. Only special on-demand features you may request later are quoted separately.',
    },
    {
      q: 'Can parents use it on a basic smartphone?',
      a: 'Yes. Parents get updates in a simple mobile-friendly view that works in any phone browser — no expensive phone needed. Everything is shown in an easy timeline: attendance, homework, marks, fees and notices.',
    },
    {
      q: 'Is our school data safe?',
      a: 'Your data is protected at several layers. Everything is encrypted while travelling and while stored. Access is role-based, so staff see only what their role allows and parents see only their own child. Passwords are stored as one-way hashes, meaning nobody \u2014 including our team \u2014 can read them. Sensitive actions are recorded in an audit log, and your records are exported back to you whenever you ask.',
    },
    {
      q: 'How long does it take to start?',
      a: 'Most schools go live within a week. We set up your classes, sections, subjects and fee structure, train your teachers and admin staff, and stay available while you settle in. Setup and training are free.',
    },
    {
      q: 'Can you build a feature our school specifically needs?',
      a: 'Yes. Every school works a little differently, so we build custom features on request — special reports, formats or workflows. Tell us what you need and we will scope it honestly before building anything. Your base plan price never changes because of it.',
    },
  ];
}
