import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService } from '../core/services/seo.service';
import { VectorArtComponent, VectorName } from './vector-art.component';

interface OfficialDocument {
  name: string;
  badge: string;
  hint: string;
  art: VectorName;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, VectorArtComponent],
  template: `
    <!-- ============================== HERO & NAV ============================== -->
    <section class="bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-white py-8 sm:py-14 border-b border-slate-100">
      <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
          <span class="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          All 10 Core Modules Included Free
        </span>
        <h1 class="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Visual, simple &amp; connected tools for modern schools
        </h1>
        <p class="mt-2 text-xs leading-relaxed text-slate-600 sm:mt-4 sm:text-base max-w-2xl mx-auto">
          No confusing modules or hidden add-ons. Get 10 connected core tools — including School ID Card Studio, official board certificates, plus dedicated Parent and Teacher mobile apps, all in one flat plan.
        </p>

        <!-- Quick Category Filter Navigator -->
        <div class="mt-6 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button *ngFor="let cat of categories"
                  type="button"
                  (click)="scrollToSection(cat.id)"
                  class="shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs"
                  [ngClass]="activeTab() === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102' : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="cat.iconPath" />
            </svg>
            <span>{{ cat.label }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ============================== 1. TWO DEDICATED MOBILE APPS ============================== -->
    <section id="mobile-apps" class="bg-white py-8 sm:py-16 scroll-mt-20 border-b border-slate-100" aria-labelledby="apps-heading">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Mobile Apps</span>
          <h2 id="apps-heading" class="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Two dedicated mobile apps included free
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-slate-600">
            One purpose-built app for Parents, one for Teachers. Fast, lightweight, and works on any budget smartphone.
          </p>
        </div>

        <!-- 2 Clean Side-by-Side App Cards -->
        <div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
          
          <!-- Parent App Card -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-3.5">
                <div class="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                  <app-vector-art name="parent-phone" class="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <div>
                  <span class="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                    Android &amp; iOS
                  </span>
                  <h3 class="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5">Parent Mobile App</h3>
                </div>
              </div>

              <p class="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Parents stay connected with their child's daily school activities with real-time push notifications.
              </p>

              <ul class="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li *ngFor="let item of parentAppFeatures" class="flex items-start gap-2.5">
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 mt-0.5">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Included in flat ₹10 plan</span>
              <span class="font-bold text-blue-600">Zero extra user fees</span>
            </div>
          </div>

          <!-- Teacher App Card -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-3.5">
                <div class="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                  <app-vector-art name="teacher-app" class="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <div>
                  <span class="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                    Android &amp; iOS
                  </span>
                  <h3 class="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5">Teacher Mobile App</h3>
                </div>
              </div>

              <p class="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Empowers classroom teachers to complete daily administrative tasks in seconds without paperwork.
              </p>

              <ul class="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-700">
                <li *ngFor="let item of teacherAppFeatures" class="flex items-start gap-2.5">
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 mt-0.5">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Included in flat ₹10 plan</span>
              <span class="font-bold text-blue-600">Zero extra user fees</span>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- ============================== 2. SCHOOL ID CARD SOFTWARE ============================== -->
    <section id="id-cards" class="bg-gradient-to-b from-slate-50/80 via-white to-slate-50/60 py-10 sm:py-20 scroll-mt-20 border-b border-slate-200/80" aria-labelledby="id-cards-heading">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        <!-- Header Banner -->
        <div class="mx-auto max-w-3xl text-center">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-100/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-2xs">
            <span>🪪</span>
            <span>School ID Card Software</span>
          </span>
          <h2 id="id-cards-heading" class="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Design once. <span class="text-blue-600">Print a class.</span>
          </h2>
          <p class="mt-3 text-xs leading-relaxed text-slate-600 sm:mt-4 sm:text-base max-w-2xl mx-auto">
            Make your own card in the studio. Photos and details come straight from each student's and staff member's record, every card carries a secure QR anyone can verify, and a whole class prints in one go — in English or Hindi.
          </p>
          
          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a routerLink="/contact" [queryParams]="{ type: 'demo', module: 'id-cards' }"
               class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 hover:scale-102 active:scale-98">
              Book a Free Demo
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </a>
            <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
               class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50">
              <svg class="h-4 w-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.025 3.284l-.549 2.007 2.071-.543c.96.524 1.956.818 3.22.819 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.766-5.767-5.766zm3.393 8.243c-.145.409-.838.749-1.157.795-.318.046-.727.062-2.316-.599-1.898-.79-3.125-2.731-3.22-2.858-.094-.128-.771-1.026-.771-1.957s.484-1.39.656-1.577c.172-.187.375-.234.5-.234.125 0 .25.001.359.006.115.006.27-.044.423.323.156.375.531 1.297.578 1.391.047.094.078.204.016.329-.063.125-.094.203-.188.312-.094.11-.198.245-.282.33-.094.094-.192.196-.083.383.11.188.487.804 1.045 1.301.719.64 1.325.838 1.512.932.188.094.298.079.407-.047.11-.125.469-.547.594-.734.125-.188.25-.157.422-.094.172.063 1.094.516 1.282.609.188.094.313.141.359.219.047.078.047.453-.098.862z"/></svg>
              <span>Talk to School Expert</span>
            </a>
          </div>

          <!-- Role Toggle Buttons: Students / Staff / Office -->
          <div class="mt-8 inline-flex items-center rounded-2xl bg-slate-200/80 p-1.5 shadow-inner">
            <button type="button"
                    (click)="idCardTab.set('students')"
                    class="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200"
                    [ngClass]="idCardTab() === 'students' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'">
              🎓 Students (Class 6-B)
            </button>
            <button type="button"
                    (click)="idCardTab.set('staff')"
                    class="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200"
                    [ngClass]="idCardTab() === 'staff' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'">
              👨‍🏫 Staff &amp; Faculty (64 Cards)
            </button>
            <button type="button"
                    (click)="idCardTab.set('office')"
                    class="rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200"
                    [ngClass]="idCardTab() === 'office' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'">
              🛡️ Gatekeeper QR Verify
            </button>
          </div>
        </div>

        <!-- Interactive Visual Showcase: Card Preview with Floating Context Badges -->
        <div class="mt-10 sm:mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg shadow-slate-900/5">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <!-- Left Info Column -->
            <div class="lg:col-span-5 space-y-4">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <span>{{ currentView.badge }}</span>
              </span>
              <h3 class="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {{ currentView.title }}
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {{ currentView.desc }}
              </p>

              <!-- Dynamic Bullet Points -->
              <div class="pt-2 space-y-2.5">
                <div *ngFor="let bullet of currentView.bullets" class="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                  <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-black mt-0.5">✓</span>
                  <span>{{ bullet }}</span>
                </div>
              </div>

              <!-- Quick Highlights -->
              <div class="pt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span class="rounded-lg bg-slate-100 px-2.5 py-1">🖨️ 9 Cards / A4 Sheet</span>
                <span class="rounded-lg bg-slate-100 px-2.5 py-1">💳 CR80 PVC Standard</span>
                <span class="rounded-lg bg-slate-100 px-2.5 py-1">🌐 English + हिंदी</span>
              </div>
            </div>

            <!-- Right Visual Interactive Mockup Column -->
            <div class="lg:col-span-7 flex flex-col items-center justify-center relative">
              
              <!-- STUDENT & STAFF CR80 ID CARD SHOWCASE -->
              <div *ngIf="idCardTab() !== 'office'" class="relative w-full max-w-[320px] sm:max-w-[340px]">
                
                <!-- Floating Context Badge 1: Top Left -->
                <div class="absolute -top-5 -left-4 sm:-left-8 z-20 flex items-center gap-2.5 rounded-2xl border border-emerald-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-emerald-900/5 backdrop-blur-md transition-transform hover:-translate-y-0.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </span>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 leading-none">{{ currentView.badge1Title }}</p>
                    <p class="text-[9px] font-medium text-emerald-600 mt-0.5">{{ currentView.badge1Sub }}</p>
                  </div>
                </div>

                <!-- Floating Context Badge 2: Right Middle -->
                <div class="absolute top-24 -right-4 sm:-right-8 z-20 flex items-center gap-2.5 rounded-2xl border border-blue-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-blue-900/5 backdrop-blur-md transition-transform hover:-translate-y-0.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  </span>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 leading-none">{{ currentView.badge2Title }}</p>
                    <p class="text-[9px] font-medium text-blue-600 mt-0.5">{{ currentView.badge2Sub }}</p>
                  </div>
                </div>

                <!-- Floating Context Badge 3: Bottom Left -->
                <div class="absolute -bottom-5 -left-4 sm:-left-8 z-20 flex items-center gap-2.5 rounded-2xl border border-indigo-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-indigo-900/5 backdrop-blur-md transition-transform hover:-translate-y-0.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  </span>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 leading-none">{{ currentView.badge3Title }}</p>
                    <p class="text-[9px] font-medium text-slate-500 mt-0.5">{{ currentView.badge3Sub }}</p>
                  </div>
                </div>

                <!-- Lanyard Strap & Swivel Clip -->
                <div class="flex flex-col items-center -mb-2 z-10 relative">
                  <div class="h-8 w-14 bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 rounded-t-md shadow-inner flex items-center justify-center">
                    <span class="text-[8px] font-black tracking-widest text-blue-200 uppercase">SCHOOL</span>
                  </div>
                  <div class="h-4 w-7 rounded-xs bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 border border-slate-400 shadow-xs flex items-center justify-center">
                    <div class="h-2 w-3 rounded-full border border-slate-500"></div>
                  </div>
                </div>

                <!-- CR80 Realistic ID Card Body -->
                <div class="relative w-full rounded-3xl border-2 border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 overflow-hidden">
                  
                  <!-- Slot Punch Hole -->
                  <div class="mx-auto h-1.5 w-10 rounded-full bg-slate-300/80"></div>

                  <!-- School Header -->
                  <div class="text-center pb-2 border-b border-slate-100">
                    <div class="inline-flex items-center gap-1.5 justify-center">
                      <span class="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-[10px] font-black shadow-xs">SS</span>
                      <span class="text-xs font-black tracking-tight text-slate-900 uppercase">Delhi Heritage Academy</span>
                    </div>
                    <p class="text-[9px] text-slate-400 font-medium mt-0.5">CBSE Affiliated · Sector 14, New Delhi</p>
                    <div class="mt-2 text-white text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-md shadow-2xs text-center"
                         [ngClass]="currentView.typeColor">
                      {{ currentView.type }}
                    </div>
                  </div>

                  <!-- Photo & Info Row -->
                  <div class="flex items-start gap-3.5">
                    <!-- Photo Box with Verification Check -->
                    <div class="relative shrink-0">
                      <div class="h-24 w-20 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                        <svg *ngIf="idCardTab() === 'students'" class="h-14 w-14 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        <svg *ngIf="idCardTab() === 'staff'" class="h-14 w-14 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>
                      <span class="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-black shadow-xs">✓</span>
                    </div>

                    <!-- Details Column -->
                    <div class="flex-1 min-w-0 space-y-1 text-[11px]">
                      <p class="text-sm font-black text-slate-900 leading-tight truncate">{{ currentView.name }}</p>
                      <p class="font-bold text-blue-700 leading-tight">{{ currentView.classLine }}</p>
                      <div class="space-y-0.5 text-slate-600 text-[10px] pt-0.5">
                        <p><span class="font-semibold text-slate-500">ID:</span> <span class="font-mono font-bold text-slate-800">{{ currentView.admNo }}</span></p>
                        <p><span class="font-semibold text-slate-500">Blood:</span> <span class="rounded bg-rose-50 px-1 py-0.2 font-black text-rose-700 border border-rose-200">{{ currentView.blood }}</span></p>
                        <p class="truncate"><span class="font-semibold text-slate-500">{{ idCardTab() === 'students' ? 'Bus:' : 'Contact:' }}</span> {{ currentView.bus }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Footer: QR Code & Principal Sign -->
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-11 w-11 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-center justify-center">
                        <svg class="h-9 w-9 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h4v4h-4v-4zm-4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-2h2v2h-2v-2zm0 4h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z"/>
                        </svg>
                      </div>
                      <div class="text-[9px] leading-tight">
                        <span class="font-black text-slate-900 block">Scan to Verify</span>
                        <span class="font-mono font-bold text-blue-600 block">{{ currentView.code }}</span>
                        <span class="text-emerald-600 font-semibold block text-[8px]">Session 2026–27</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-serif italic text-slate-700 text-xs leading-none mb-0.5">{{ currentView.signer }}</div>
                      <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">{{ currentView.signTitle }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- GATEKEEPER QR VERIFY PHONE PORTAL SHOWCASE -->
              <div *ngIf="idCardTab() === 'office'" class="relative w-full max-w-[300px] sm:max-w-[320px]">
                
                <!-- Floating Context Badges for Gatekeeper -->
                <div class="absolute -top-5 -left-4 sm:-left-8 z-20 flex items-center gap-2.5 rounded-2xl border border-emerald-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-emerald-900/5 backdrop-blur-md">
                  <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </span>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 leading-none">{{ currentView.badge1Title }}</p>
                    <p class="text-[9px] font-medium text-emerald-600 mt-0.5">{{ currentView.badge1Sub }}</p>
                  </div>
                </div>

                <div class="absolute top-24 -right-4 sm:-right-8 z-20 flex items-center gap-2.5 rounded-2xl border border-blue-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-blue-900/5 backdrop-blur-md">
                  <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  </span>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 leading-none">{{ currentView.badge2Title }}</p>
                    <p class="text-[9px] font-medium text-blue-600 mt-0.5">{{ currentView.badge2Sub }}</p>
                  </div>
                </div>

                <div class="absolute -bottom-5 -left-4 sm:-left-8 z-20 flex items-center gap-2.5 rounded-2xl border border-emerald-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-emerald-900/5 backdrop-blur-md">
                  <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </span>
                  <div>
                    <p class="text-[11px] font-black text-slate-900 leading-none">{{ currentView.badge3Title }}</p>
                    <p class="text-[9px] font-medium text-slate-500 mt-0.5">{{ currentView.badge3Sub }}</p>
                  </div>
                </div>

                <!-- Phone Frame Mockup -->
                <div class="rounded-[36px] border-4 border-slate-800 bg-slate-900 p-2.5 shadow-2xl">
                  <div class="rounded-[26px] bg-white p-4 space-y-3">
                    
                    <!-- Top Phone Header Bar -->
                    <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div class="flex items-center gap-1.5">
                        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-[10px] font-black uppercase tracking-wider text-slate-700">Gatekeeper Verify</span>
                      </div>
                      <span class="text-[9px] font-bold text-slate-400">9:12 AM</span>
                    </div>

                    <!-- Green Verification Status Shield -->
                    <div class="rounded-2xl bg-emerald-50 border border-emerald-200/90 p-3.5 text-center shadow-xs">
                      <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-base mb-1 shadow-sm">✓</span>
                      <h4 class="text-sm font-black text-emerald-900">Authentic · Valid ID Card</h4>
                      <p class="text-[10px] text-emerald-700 font-medium mt-0.5">Genuinely issued by Delhi Heritage Academy</p>
                    </div>

                    <!-- Scanned Data Rows -->
                    <div class="space-y-1.5 text-xs">
                      <div class="flex justify-between py-1 border-b border-slate-100">
                        <span class="text-slate-400 text-[11px]">Card Holder</span>
                        <span class="font-bold text-slate-900">Aarav Sharma</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-100">
                        <span class="text-slate-400 text-[11px]">Class &amp; Section</span>
                        <span class="font-bold text-slate-800">Class 6-B · Roll 12</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-100">
                        <span class="text-slate-400 text-[11px]">Card Serial</span>
                        <span class="font-mono font-bold text-blue-600">STU-202627-00412</span>
                      </div>
                      <div class="flex justify-between py-1 border-b border-slate-100">
                        <span class="text-slate-400 text-[11px]">Academic Session</span>
                        <span class="font-bold text-slate-800">2026–2027</span>
                      </div>
                      <div class="flex justify-between py-1">
                        <span class="text-slate-400 text-[11px]">Valid Until</span>
                        <span class="font-bold text-emerald-700">31 March 2027</span>
                      </div>
                    </div>

                    <!-- Privacy Notice Banner -->
                    <div class="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-500 text-center leading-relaxed border border-slate-200/80">
                      🔒 <strong>UIDAI &amp; DPDP Shielded:</strong> Private home address &amp; Aadhaar are never exposed in public QR verification.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- 6 Core ID Card Software Pillars Grid -->
        <div class="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          <!-- Pillar 1: From the Record -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">From the Record · Zero Typos</h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              No manual Excel data entry, no lost WhatsApp photos, and no spelling mistakes. Student photos, blood groups, bus routes, and admission numbers fill automatically from live database profiles.
            </p>
          </div>

          <!-- Pillar 2: Readiness Checker -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">Pre-Print Readiness Check</h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              SchoolSense automatically catches missing photos or unassigned roll numbers <em>before</em> you start printing. Fix missing details directly in the profile with zero wasted PVC cards or paper.
            </p>
          </div>

          <!-- Pillar 3: 1-Click Class & Batch Printing -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.056-.367-2.155-.367-3.279 0-4.043 2.14-7.616 5.397-9.55a.75.75 0 01.75 0C15.75 2.934 17.89 6.507 17.89 10.55c0 1.124-.127 2.223-.367 3.279M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9s-2.015-9-4.5-9-4.5 4.03-4.5 9 2.015 9 4.5 9z" /></svg>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">Print a Class in One Go</h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pick a section and generate 40+ cards in seconds. Download as a single print-ready PDF, a ZIP of individual cards, or 9 cards per A4 sheet with precision crop marks ready for your office laminator.
            </p>
          </div>

          <!-- Pillar 4: Gatekeeper Public QR Verification -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">QR Code Authenticity Check</h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Anyone with a normal smartphone camera can scan the card to verify if it is genuine and active. Perfect for school gate entry, inter-school sports, bus boarding, and exam centers.
            </p>
          </div>

          <!-- Pillar 5: Block & Reissue Lost Cards -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">Lost? Block &amp; Reissue in 1-Click</h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              When a student loses their card, 1-click marks it revoked — the old QR instantly stops working and flags as blocked. Reissue a replacement card with a fresh serial number in seconds.
            </p>
          </div>

          <!-- Pillar 6: Bilingual & Aadhaar-Safe -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">Bilingual &amp; 100% Aadhaar-Safe</h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Print in English or हिंदी with built-in Hindi labels (रक्त समूह, बस मार्ग, मिलने पर कृपया कार्यालय में जमा करें). Fully UIDAI compliant — 12-digit Aadhaar numbers are never printed.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- ============================== 3. ACADEMICS & TEACHING ============================== -->
    <section id="academics" class="py-8 sm:py-16 scroll-mt-20 bg-white border-b border-slate-100">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            For Teaching &amp; Classrooms
          </span>
          <h2 class="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Academics: Run every class smoothly
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Timetable, attendance, homework and auto-calculating CBSE/ICSE marksheets in one visual dashboard.
          </p>
        </div>

        <!-- 4 Clean Informational Cards Grid (Non-Clickable, Simple Text & Sub-heading) -->
        <div class="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          
          <!-- Card 1: Timetable -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="timetable" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Weekly Grids
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Timetable &amp; Period Scheduling</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Create conflict-free class and teacher schedules in minutes. Changes sync instantly to parent and teacher mobile apps.
            </p>
          </div>

          <!-- Card 2: Attendance -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="attendance" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Instant Alerts
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Class Attendance Register</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mark the entire class in 10 seconds. Parents receive instant push notifications if their child is absent or late.
            </p>
          </div>

          <!-- Card 3: Homework -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="homework" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Daily Diary
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Homework &amp; Assignments</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Post daily homework with subject details and attachments. Parents view assignments the same evening on their phone.
            </p>
          </div>

          <!-- Card 4: Exams & Marksheets -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="exams" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                CBSE &amp; State Boards
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Exams &amp; Report Cards</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Auto-calculates marks, totals, percentages and CBSE/ICSE grades. Generate and print official report cards with 1-click.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- ============================== 3. ADMINISTRATION & OFFICE OPERATIONS ============================== -->
    <section id="office" class="py-8 sm:py-16 scroll-mt-20 bg-slate-50/70 border-b border-slate-200/80">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            For School Office &amp; Management
          </span>
          <h2 class="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Administration: Eliminate office chaos
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Fees, circulars, parent grievances, and academic promotions organized with strict audit trails.
          </p>
        </div>

        <!-- 4 Clean Informational Cards Grid (Non-Clickable, Simple Text & Sub-heading) -->
        <div class="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          
          <!-- Admin Card 1: Fee Management -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="fees" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Itemized Invoices
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Fee Management &amp; Receipts</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Define fee structures, issue itemized digital invoices, track defaulters, and print instant transaction receipts.
            </p>
          </div>

          <!-- Admin Card 2: Circulars -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="notices" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Targeted Broadcast
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Broadcast Circulars &amp; Notices</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Send notices to the whole school or specific classes only. Save paper costs and ensure zero missed announcements.
            </p>
          </div>

          <!-- Admin Card 3: Grievance Desk -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="security" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Ticket Pipeline
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Grievance Desk / Complaints</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Track and resolve parent concerns with transparent status updates, assignments, and threaded communication.
            </p>
          </div>

          <!-- Admin Card 4: Promotions & Alumni -->
          <div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div class="flex items-center justify-between">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <app-vector-art name="promotion" class="h-8 w-8" />
              </div>
              <span class="rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">
                Bulk Rollover
              </span>
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-900">Promotions &amp; Alumni Registry</h3>
            <p class="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              1-click session rollover promotes students in bulk while preserving permanent student lifecycle records.
            </p>
          </div>

        </div>

      </div>
    </section>

    <!-- ============================== 4. OFFICIAL CERTIFICATES & REPORTS ============================== -->
    <section id="documents" class="bg-white py-8 sm:py-20 border-b border-slate-200/80 scroll-mt-20" aria-labelledby="documents-heading">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 sm:pb-8">
          <div class="max-w-2xl">
            <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Official Certification Engine</span>
            <h2 id="documents-heading" class="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              1-Click official board certificates &amp; reports
            </h2>
            <p class="mt-1.5 text-xs sm:text-base text-slate-600 leading-relaxed">
              Auto-fill student admission numbers, affiliation details, and seal watermarks for instant printing.
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
               class="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors">
              Book a Free Demo
              <span>→</span>
            </a>
          </div>
        </div>

        <!-- 12 Supported Official Documents Grid (2-Col on Mobile, 4-Col on Desktop) -->
        <div class="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          <div *ngFor="let doc of officialDocuments"
               class="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-1.5">
                <app-vector-art [name]="doc.art" class="h-9 w-9 sm:h-11 sm:w-11 shrink-0 drop-shadow-xs" />
                <span class="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-700 uppercase tracking-wider border border-blue-100">
                  {{ doc.badge }}
                </span>
              </div>
              <h3 class="mt-2.5 sm:mt-4 text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">
                {{ doc.name }}
              </h3>
              <p class="mt-1 text-[10px] sm:text-xs leading-snug text-slate-500 line-clamp-2">
                {{ doc.hint }}
              </p>
            </div>
            <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500">
              <span>Auto-Generated</span>
              <span class="text-blue-600 font-bold">1-Click</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ============================== 5. SIMPLICITY BY DESIGN ============================== -->
    <section class="bg-gradient-to-b from-white via-slate-50/70 to-white py-8 sm:py-20" aria-labelledby="simple-heading">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <span class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Zero Technical Barrier</span>
          <h2 id="simple-heading" class="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Built for non-technical teachers &amp; staff
          </h2>
          <p class="mt-1 text-xs sm:text-base text-slate-600 leading-relaxed">
            If your staff can use WhatsApp, they can master SchoolSense in 5 minutes.
          </p>
        </div>

        <div class="mt-6 sm:mt-12 grid gap-3.5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Card 1 -->
          <div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 text-center shadow-xs flex flex-col items-center">
            <div class="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-blue-50/80 p-2">
              <app-vector-art name="attendance" class="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-xs" />
            </div>
            <h3 class="mt-3 sm:mt-5 text-sm sm:text-lg font-bold text-slate-900">One obvious way</h3>
            <p class="mt-1 text-xs sm:text-sm text-slate-500">Each task has one clear flow: mark, save, done. Zero confusing sub-menus.</p>
          </div>

          <!-- Card 2 -->
          <div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 text-center shadow-xs flex flex-col items-center">
            <div class="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-blue-50/80 p-2">
              <app-vector-art name="teacher-app" class="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-xs" />
            </div>
            <h3 class="mt-3 sm:mt-5 text-sm sm:text-lg font-bold text-slate-900">Works on any phone</h3>
            <p class="mt-1 text-xs sm:text-sm text-slate-500">Runs smoothly on basic budget smartphones, tablets and school office PCs.</p>
          </div>

          <!-- Card 3 -->
          <div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 text-center shadow-xs flex flex-col items-center sm:col-span-2 lg:col-span-1">
            <div class="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-blue-50/80 p-2">
              <app-vector-art name="classroom" class="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-xs" />
            </div>
            <h3 class="mt-3 sm:mt-5 text-sm sm:text-lg font-bold text-slate-900">Free live onboarding</h3>
            <p class="mt-1 text-xs sm:text-sm text-slate-500">We guide your teachers step-by-step with WhatsApp and video support until 100% fluent.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== 6. FINAL CTA ============================== -->
    <section class="bg-white pb-12 sm:pb-24">
      <div class="mx-auto max-w-7xl px-3 text-center sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-8 sm:px-12 sm:py-14 text-white shadow-xl shadow-blue-600/20">
          <h2 class="text-xl sm:text-4xl font-black tracking-tight">Ready to modernize your school?</h2>
          <p class="mx-auto mt-2 max-w-xl text-xs sm:text-base text-blue-100 leading-relaxed">
            See all 9 modules and mobile apps working live with your own school's curriculum in a 30-minute free demo.
          </p>
          <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
               class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-extrabold text-blue-700 shadow-md transition-transform hover:scale-105 active:scale-95 sm:w-auto">
              Book a Free Live Demo
            </a>
            <a routerLink="/pricing"
               class="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20 sm:w-auto">
              Explore Simple ₹10 Plan
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FeaturesComponent {
  private seo = inject(SeoService);
  activeTab = signal<string>('mobile-apps');
  idCardTab = signal<'students' | 'staff' | 'office'>('students');

  get currentView() {
    return this.idCardViews[this.idCardTab()];
  }

  readonly idCardViews = {
    students: {
      badge: '⚡ 100% Data-Driven Auto Population',
      title: 'Student ID Cards with QR Authenticity',
      desc: 'No typing names, blood groups or bus routes again. SchoolSense pulls photos and verified bio from each student\'s profile. Prints 9 cards to an A4 sheet with crop marks or single PVC CR80 cards.',
      bullets: [
        'Pre-print readiness check flags missing photos',
        'Prints in English or हिंदी (रक्त समूह, बस मार्ग)',
        'Auto WhatsApp alert sent to parents when ready',
      ],
      type: 'STUDENT IDENTITY CARD · 2026-27',
      typeColor: 'bg-blue-600',
      name: 'Aarav Sharma',
      classLine: 'Class 6-B · Roll 12',
      admNo: '2024/0412',
      blood: 'B+',
      bus: 'Route 4 · Sector 19',
      code: 'STU-202627-00412',
      signTitle: 'Principal Sign',
      signer: 'R. K. Verma',
      badge1Title: 'QR Verified',
      badge1Sub: 'Authentic · valid',
      badge2Title: 'Valid till 31 Mar 2027',
      badge2Sub: 'Session 2026–27',
      badge3Title: 'From student record',
      badge3Sub: 'Photo, class, blood group',
    },
    staff: {
      badge: '👥 Complete Faculty Batch Run',
      title: 'Faculty & Staff ID Cards in 1 Batch Run',
      desc: 'Produce your entire teaching and non-teaching staff ID cards in one single batch print run. Cards carry official designation, employee code, blood group and emergency contact.',
      bullets: [
        'Staff app tracks handover & collected status',
        'Standard CR80 portrait, landscape or badge size',
        'Clonable designer templates with school crest',
      ],
      type: 'OFFICIAL FACULTY CARD · 2026-27',
      typeColor: 'bg-indigo-700',
      name: 'Vikramaditya Sen',
      classLine: 'PGT Physics · Science Lead',
      admNo: 'EMP-202627-00031',
      blood: 'O+',
      bus: 'Emergency: +91 98110 24532',
      code: 'EMP-202627-00031',
      signTitle: 'Director / Principal',
      signer: 'R. K. Verma',
      badge1Title: 'All staff · 64 cards',
      badge1Sub: 'One print run',
      badge2Title: 'Staff card printed',
      badge2Sub: 'Science · EMP-202627-00031',
      badge3Title: 'Marked collected',
      badge3Sub: 'From the staff app',
    },
    office: {
      badge: '🛡️ UIDAI Compliant Gatekeeper Portal',
      title: 'Instant Gatekeeper QR Authenticity Portal',
      desc: 'Anyone with a phone camera can verify student authenticity at the school gate, sports meet, or exam hall. The QR code never leaks private student phone numbers or Aadhaar.',
      bullets: [
        'Lost card? 1-click blocks old QR instantly',
        'Session-scoped validity (expires on 31 March)',
        'UIDAI compliant: Aadhaar is never printed',
      ],
      type: 'SECURE VERIFICATION CHECK',
      typeColor: 'bg-emerald-600',
      name: 'Aarav Sharma',
      classLine: 'Class 6-B · Roll 12',
      admNo: 'STU-202627-00412',
      blood: 'B+',
      bus: 'Status: Active · Authentic',
      code: 'STU-202627-00412',
      signTitle: 'System Verified',
      signer: 'Delhi Heritage Academy',
      badge1Title: 'Camera Verified',
      badge1Sub: 'Scanned in 0.2s',
      badge2Title: 'Session Active',
      badge2Sub: 'Delhi Heritage Academy',
      badge3Title: 'Zero Data Leak',
      badge3Sub: 'Aadhaar & phone shielded',
    },
  };

  categories = [
    {
      id: 'mobile-apps',
      label: 'Mobile Apps',
      iconPath: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
    },
    {
      id: 'id-cards',
      label: 'ID Card Studio',
      iconPath: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.33a4.126 4.126 0 00-6.338 0 .75.75 0 01-1.077-.074A4.5 4.5 0 0110.5 12.75a4.5 4.5 0 013.621 2.881.75.75 0 01-1.077.074z',
    },
    {
      id: 'academics',
      label: 'Academics',
      iconPath: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    },
    {
      id: 'office',
      label: 'Office & Admin',
      iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
    },
    {
      id: 'documents',
      label: 'Certificates & Reports',
      iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
  ];

  parentAppFeatures = [
    'Live morning attendance notifications (Present, Absent, Late) with exact time',
    'Daily homework diary with subject attachments, descriptions, and due dates',
    'Exam results, marks breakdowns, and downloadable CBSE / State report cards',
    'Itemized fee invoices, payment receipts, and complete transaction history',
    'Direct two-way grievance desk to raise concerns and track resolution status',
    'Instant school circular broadcasts, holiday notifications, and event calendar',
  ];

  teacherAppFeatures = [
    '10-second whole-class roll-call with 1-tap Present / Absent / Late toggles',
    'Instant homework diary composer with photo and document attachments',
    'Subject-wise exam marks entry with automatic total & CBSE grade calculation',
    'Direct access to parent inquiries and grievance ticket resolution replies',
    'View today\'s class timetable, room assignments, and upcoming period schedule',
    'Post announcements and homework updates directly to assigned sections',
  ];

  officialDocuments: OfficialDocument[] = [
    { name: 'Student & Staff Smart ID Cards', badge: 'CR80 & A4 Sheets', hint: 'Auto-fills photo, blood group, bus route & online QR verification link', art: 'certificate' },
    { name: 'Transfer Certificate (TC / SLC)', badge: 'Board Format', hint: 'Auto-fills admission #, board affiliation, leaving reason & serial #', art: 'certificate' },
    { name: 'Character Certificate (CC)', badge: 'Print & Sign', hint: 'Formal conduct reference ready for principal signature & school seal', art: 'security' },
    { name: 'Bonafide & Study Certificate', badge: 'Instant Issue', hint: 'Official proof of student enrollment with class, session & affiliation', art: 'classroom' },
    { name: 'Alumni Certificate & Lifetime ID', badge: 'Alumni Register', hint: 'Permanent alumni credential with unique Alumni Serial # & pass-out year', art: 'alumni' },
    { name: 'Term Report Cards & Marksheets', badge: 'CBSE / ICSE / State', hint: 'Subject-wise scores, percentage, standard A1-F grading & remarks', art: 'exams' },
    { name: 'Class Attendance Registers', badge: 'Daily & Monthly', hint: 'Roll-call attendance sheets, monthly summary & student shortage alerts', art: 'attendance' },
    { name: 'Fee Invoices & Payment Receipts', badge: 'Itemized Receipt', hint: 'Tuition & transport breakdown with transaction ID & printable copy', art: 'fees' },
    { name: 'Exam Broad Sheets / Tabulation', badge: 'Master Ledger', hint: 'Complete section-wise examination score matrix for faculty evaluation', art: 'promotion' },
    { name: 'Student Roster & Directory', badge: 'Excel & Print', hint: 'Class list with roll numbers, blood group, emergency & guardian phone', art: 'parent-phone' },
    { name: 'Weekly Class & Faculty Timetable', badge: 'Weekly Grid', hint: 'Conflict-free period grids for classrooms, sections & subject teachers', art: 'timetable' },
    { name: 'Fee Defaulters & Balance Ledger', badge: 'Financial Audit', hint: 'Pending fee lists by class & section for quick administrative follow-up', art: 'fees' },
    { name: 'Student Lifecycle Journey Log', badge: 'Audit Trail', hint: 'Immutable timeline tracking admissions, promotions, section moves & TC', art: 'cloud' },
  ];

  scrollToSection(id: string): void {
    this.activeTab.set(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  constructor() {
    this.seo.setPage({
      title: 'School Management Features: ID Card Studio, Attendance, Exams, Fees & Mobile Apps',
      description:
        'Explore modern school management software features: School ID Card Software with batch class printing & QR authenticity, 1-tap roll-call attendance, conflict-free timetable, automated marksheets, GST fee invoicing, auto TC generation, and dedicated Parent & Teacher mobile apps.',
      path: '/features',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.schoolsense.in/' },
            { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://www.schoolsense.in/features' },
          ],
        },
      ],
    });
  }
}
