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
          All 9 Modules Included Free
        </span>
        <h1 class="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Visual, simple &amp; connected tools for modern schools
        </h1>
        <p class="mt-2 text-xs leading-relaxed text-slate-600 sm:mt-4 sm:text-base max-w-2xl mx-auto">
          No confusing modules or hidden add-ons. Get 9 connected core tools, downloadable board certificates, plus dedicated Parent and Teacher mobile apps — all in one flat plan.
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
            Two dedicated mobile apps — included free
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

    <!-- ============================== 2. ACADEMICS & TEACHING ============================== -->
    <section id="academics" class="py-8 sm:py-16 scroll-mt-20 bg-white border-b border-slate-100">
      <div class="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        
        <div class="max-w-2xl">
          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            For Teaching &amp; Classrooms
          </span>
          <h2 class="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Academics — run every class smoothly
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
            Administration — eliminate office chaos
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
            <p class="mt-1 text-xs sm:text-sm text-slate-500">Each task has one clear flow — mark, save, done. Zero confusing sub-menus.</p>
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

  categories = [
    {
      id: 'mobile-apps',
      label: 'Mobile Apps',
      iconPath: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
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
    { name: 'Transfer Certificate (TC / SLC)', badge: 'Board Format', hint: 'Auto-fills admission #, board affiliation, leaving reason & serial #', art: 'certificate' },
    { name: 'Character Certificate (CC)', badge: 'Print & Sign', hint: 'Formal conduct reference ready for principal signature & school seal', art: 'security' },
    { name: 'Bonafide & Study Certificate', badge: 'Instant Issue', hint: 'Official proof of student enrollment with class, session & affiliation', art: 'classroom' },
    { name: 'Alumni Certificate & Lifetime ID', badge: 'Alumni Register', hint: 'Permanent alumni credential with unique Alumni Serial # & pass-out year', art: 'alumni' },
    { name: 'Term Report Cards & Marksheets', badge: 'CBSE / ICSE / State', hint: 'Subject-wise scores, percentage, standard A1–F grading & remarks', art: 'exams' },
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
      title: 'Features — Attendance, Homework, Exams, Fees, Certificates & Mobile Apps',
      description:
        'All SchoolSense features: 1-tap attendance, conflict-free timetable, automated marksheets, fee invoices, auto-generated board certificates, and dedicated Parent & Teacher mobile apps.',
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
