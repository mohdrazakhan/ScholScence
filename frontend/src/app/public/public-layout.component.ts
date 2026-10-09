import { Component, inject, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen flex-col bg-white font-sans text-slate-800 selection:bg-blue-600 selection:text-white">

      <!-- ============================ HEADER ============================ -->
      <header class="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-200 transform-gpu will-change-auto"
              [ngClass]="scrolled() ? 'border-slate-200/70 bg-white/90 shadow-xs' : 'border-white/40 bg-white/75'">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6 lg:px-8">

          <!-- Brand -->
          <a routerLink="/" class="flex shrink-0 items-center gap-2.5" aria-label="SchoolSense — Home">
            <img src="/brand/left_icon_logo.png" alt="SchoolSense — school management system logo"
                 class="h-9 w-auto object-contain sm:h-10" width="160" height="40" />
          </a>

          <!-- Desktop nav -->
          <nav class="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <a *ngFor="let link of navLinks" [routerLink]="link.path"
               [routerLinkActive]="'bg-blue-50 text-blue-700'"
               [routerLinkActiveOptions]="link.path === '/' ? { exact: true } : { exact: false }"
               class="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
              {{ link.label }}
            </a>
          </nav>

          <!-- Actions -->
          <div class="hidden items-center gap-2.5 md:flex">
            <ng-container *ngIf="auth.isAuthenticated(); else guestCta">
              <a routerLink="/dashboard"
                 class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                Go to Dashboard
              </a>
            </ng-container>
            <ng-template #guestCta>
              <a routerLink="/login"
                 class="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900">
                Login
              </a>
              <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
                 class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30">
                Book a Free Demo
              </a>
            </ng-template>
          </div>

          <!-- Mobile top action (clean header with Login / Dashboard) -->
          <div class="flex items-center gap-2 md:hidden">
            <ng-container *ngIf="auth.isAuthenticated(); else mobileGuestTop">
              <a routerLink="/dashboard"
                 class="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700">
                Dashboard
              </a>
            </ng-container>
            <ng-template #mobileGuestTop>
              <a routerLink="/login"
                 class="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700">
                Login
              </a>
            </ng-template>
          </div>
        </div>
      </header>

      <!-- ============================ PAGE CONTENT ============================ -->
      <main class="flex-1 pb-24 md:pb-0 pt-16 sm:pt-[72px]">
        <router-outlet></router-outlet>
      </main>

      <!-- ============================ MOBILE APP-LIKE FLOATING DOCK ============================ -->
      <nav class="fixed bottom-3 inset-x-3 sm:max-w-md sm:mx-auto z-50 block rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.14)] backdrop-blur-2xl transform-gpu md:hidden"
           aria-label="Mobile application navigation">
        <div class="grid grid-cols-5 gap-1 items-center text-center">
          
          <!-- Home -->
          <a routerLink="/"
             [routerLinkActive]="'!bg-blue-50 !text-blue-600 font-bold'"
             [routerLinkActiveOptions]="{ exact: true }"
             class="flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-slate-500 transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span class="mt-0.5 text-[11px] font-medium leading-none">Home</span>
          </a>

          <!-- Features -->
          <a routerLink="/features"
             [routerLinkActive]="'!bg-blue-50 !text-blue-600 font-bold'"
             class="flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-slate-500 transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span class="mt-0.5 text-[11px] font-medium leading-none">Features</span>
          </a>

          <!-- Demo -->
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             [routerLinkActive]="'!bg-blue-50 !text-blue-600 font-bold'"
             class="flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-slate-500 transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
            </svg>
            <span class="mt-0.5 text-[11px] font-medium leading-none">Demo</span>
          </a>

          <!-- Pricing -->
          <a routerLink="/pricing"
             [routerLinkActive]="'!bg-blue-50 !text-blue-600 font-bold'"
             class="flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-slate-500 transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="mt-0.5 text-[11px] font-medium leading-none">Pricing</span>
          </a>

          <!-- About Us -->
          <a routerLink="/about"
             [routerLinkActive]="'!bg-blue-50 !text-blue-600 font-bold'"
             class="flex flex-col items-center justify-center rounded-xl py-1.5 px-1 text-slate-500 transition-all active:scale-95 hover:bg-slate-50 hover:text-slate-900">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span class="mt-0.5 text-[11px] font-medium leading-none">About Us</span>
          </a>
        </div>
      </nav>

      <!-- ============================ FOOTER ============================ -->
      <footer class="bg-slate-900 text-slate-300">
        <div class="mx-auto max-w-7xl px-4 pt-10 pb-28 sm:pt-14 sm:pb-14 sm:px-6 lg:px-8">

          <div class="grid gap-8 sm:gap-10 grid-cols-2 md:grid-cols-2 lg:grid-cols-12">
            <!-- Brand + description (col-span-2 on mobile, lg:col-span-5 on desktop) -->
            <div class="col-span-2 lg:col-span-5">
              <div class="flex items-center justify-between sm:justify-start sm:gap-3">
                <img src="/brand/name_with_tagline.png" alt="SchoolSense — school management system"
                     class="h-9 sm:h-10 w-auto rounded-lg bg-white p-1.5" width="200" height="40" />
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 sm:hidden">Made in India 🇮🇳</span>
              </div>
              <p class="mt-3.5 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400">
                SchoolSense is a simple, cloud-based school management system built for Indian schools.
                Connects attendance, exams, fees, timetable, notices and certificates with live parent updates.
              </p>
              <div class="mt-4 hidden sm:flex flex-wrap gap-2">
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">Made in India 🇮🇳</span>
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">April–March academic sessions</span>
              </div>
            </div>

            <!-- Column 1: Product -->
            <div class="col-span-1 lg:col-span-2 text-center sm:text-left">
              <h3 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Product</h3>
              <ul class="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm">
                <li><a routerLink="/features" class="transition-colors hover:text-white">All Features</a></li>
                <li><a routerLink="/features" fragment="mobile-apps" class="transition-colors hover:text-white">Mobile Apps</a></li>
                <li><a routerLink="/pricing" class="transition-colors hover:text-white">Pricing</a></li>
                <li><a routerLink="/contact" [queryParams]="{ type: 'demo' }" class="transition-colors hover:text-white">Book Demo</a></li>
                <li><a routerLink="/login" class="text-blue-400 font-semibold hover:text-blue-300">School Login</a></li>
              </ul>
            </div>

            <!-- Column 2: Company -->
            <div class="col-span-1 lg:col-span-2 text-center sm:text-left">
              <h3 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Company</h3>
              <ul class="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm">
                <li><a routerLink="/about" class="transition-colors hover:text-white">About Us</a></li>
                <li><a routerLink="/blog" class="transition-colors hover:text-white">Blog &amp; Guides</a></li>
                <li><a routerLink="/contact" class="transition-colors hover:text-white">Contact Us</a></li>
                <li><a routerLink="/legal/privacy" class="transition-colors hover:text-white">Privacy Policy</a></li>
                <li><a routerLink="/legal/terms" class="transition-colors hover:text-white">Terms &amp; Conditions</a></li>
              </ul>
            </div>

            <!-- Desktop Additional Column -->
            <div class="hidden lg:block lg:col-span-3">
              <h3 class="text-sm font-bold uppercase tracking-wider text-white">Transform Your School</h3>
              <p class="mt-4 text-sm text-slate-400">
                Get free onboarding, complete data migration, and live staff training at no extra charge.
              </p>
              <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
                 class="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                Book a Free Demo
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>

          <!-- Bottom Copyright & Tagline -->
          <div class="mt-8 pt-6 border-t border-slate-800/90 flex flex-col items-center justify-between gap-2.5 text-xs text-slate-500 sm:flex-row">
            <p>© {{ currentYear }} SchoolSense. All rights reserved.</p>
            <p class="text-slate-400">Building smarter schools for tomorrow.</p>
          </div>

        </div>
      </footer>

      <!-- ============================ BACK TO TOP BUTTON ============================ -->
      <button type="button"
              (click)="scrollToTop()"
              aria-label="Scroll to top of page"
              class="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/30 transition-all duration-300 hover:bg-blue-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              [ngClass]="showBackToTop() ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>

    </div>
  `,
})
export class PublicLayoutComponent {
  auth = inject(AuthService);
  currentYear = new Date().getFullYear();

  navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/about', label: 'About Us' },
    { path: '/blog', label: 'Blog' },
    { path: '/contact', label: 'Contact' },
  ];

  menuOpen = signal(false);
  scrolled = signal(false);
  showBackToTop = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    this.scrolled.set(y > 8);
    this.showBackToTop.set(y > 400);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
