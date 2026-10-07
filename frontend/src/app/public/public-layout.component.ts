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
      <header class="fixed inset-x-0 top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-all duration-300"
              [ngClass]="scrolled() ? 'border-slate-200 shadow-sm' : 'border-transparent'">
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

          <!-- Mobile actions -->
          <div class="flex items-center gap-1 md:hidden">
            <a routerLink="/login" class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">Login</a>
            <button (click)="toggleMenu()" type="button"
                    class="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                    [attr.aria-expanded]="menuOpen()" aria-label="Toggle navigation menu">
              <svg *ngIf="!menuOpen()" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <svg *ngIf="menuOpen()" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile drawer -->
        <div *ngIf="menuOpen()" class="border-t border-slate-100 bg-white px-4 pb-6 pt-3 shadow-lg md:hidden">
          <nav class="flex flex-col gap-1" aria-label="Mobile navigation">
            <a *ngFor="let link of navLinks" [routerLink]="link.path" (click)="closeMenu()"
               [routerLinkActive]="'bg-blue-50 text-blue-700'"
               [routerLinkActiveOptions]="link.path === '/' ? { exact: true } : { exact: false }"
               class="rounded-xl px-4 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50">
              {{ link.label }}
            </a>
          </nav>
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }" (click)="closeMenu()"
             class="mt-3 block rounded-xl bg-blue-600 px-4 py-3.5 text-center text-base font-semibold text-white shadow-sm">
            Book a Free Demo
          </a>
        </div>
      </header>

      <!-- ============================ PAGE CONTENT ============================ -->
      <main class="flex-1 pt-16 sm:pt-[72px]">
        <router-outlet></router-outlet>
      </main>

      <!-- ============================ FOOTER ============================ -->
      <footer class="bg-slate-900 text-slate-300">
        <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-12">

            <!-- Brand + description (SEO-rich) -->
            <div class="lg:col-span-5">
              <img src="/brand/name_with_tagline.png" alt="SchoolSense — school management system"
                   class="h-10 w-auto rounded-lg bg-white p-1.5" width="200" height="40" />
              <p class="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                SchoolSense is a simple, cloud-based school management system built for Indian schools.
                It brings attendance, homework, exams, fees, timetable, notices and certificates together —
                and keeps parents connected with live updates of their child's school life.
              </p>
              <div class="mt-5 flex flex-wrap gap-2">
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">Made in India 🇮🇳</span>
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">April–March academic sessions</span>
              </div>
            </div>

            <!-- Product -->
            <div class="lg:col-span-2">
              <h3 class="text-sm font-bold uppercase tracking-wider text-white">Product</h3>
              <ul class="mt-4 space-y-2.5 text-sm">
                <li><a routerLink="/features" class="transition-colors hover:text-white">Features</a></li>
                <li><a routerLink="/pricing" class="transition-colors hover:text-white">Pricing</a></li>
                <li><a routerLink="/contact?type=demo" class="transition-colors hover:text-white">Book a Demo</a></li>
                <li><a routerLink="/login" class="transition-colors hover:text-white">School Login</a></li>
              </ul>
            </div>

            <!-- Features -->
            <div class="lg:col-span-2">
              <h3 class="text-sm font-bold uppercase tracking-wider text-white">Features</h3>
              <ul class="mt-4 space-y-2.5 text-sm">
                <li><a routerLink="/features" fragment="mobile-apps" class="hover:text-white">Mobile Apps</a></li>
                <li><a routerLink="/features" class="hover:text-white">Attendance Register</a></li>
                <li><a routerLink="/features" class="hover:text-white">Homework &amp; Assignments</a></li>
                <li><a routerLink="/features" class="hover:text-white">Exams &amp; Marksheets</a></li>
                <li><a routerLink="/features" class="hover:text-white">Fee Management</a></li>
                <li><a routerLink="/features" class="hover:text-white">Parent Connect</a></li>
              </ul>
            </div>

            <!-- Company -->
            <div class="lg:col-span-3">
              <h3 class="text-sm font-bold uppercase tracking-wider text-white">Company</h3>
              <ul class="mt-4 space-y-2.5 text-sm">
                <li><a routerLink="/about" class="transition-colors hover:text-white">About Us</a></li>
                <li><a routerLink="/contact" class="transition-colors hover:text-white">Contact</a></li>
                <li><a routerLink="/contact?type=feature" class="transition-colors hover:text-white">Request a Feature</a></li>
              </ul>
              <a routerLink="/contact?type=demo"
                 class="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                Book a Free Demo
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-800">
          <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
            <p>© {{ currentYear }} SchoolSense. All rights reserved.</p>
            <p>Building smarter schools for tomorrow.</p>
          </div>
        </div>
      </footer>
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
    { path: '/contact', label: 'Contact' },
  ];

  menuOpen = signal(false);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
