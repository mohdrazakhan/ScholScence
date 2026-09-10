import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <!-- Clean Sidebar -->
      <aside class="w-64 bg-white border-r border-slate-200/90 flex flex-col flex-shrink-0">
        <!-- Brand Header -->
        <div class="h-16 flex items-center px-6 border-b border-slate-200/80 gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-sm">
            S
          </div>
          <div>
            <h1 class="text-sm font-extrabold text-slate-900 tracking-tight leading-none">SchoolSense</h1>
            <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Campus SaaS</span>
          </div>
        </div>

        <!-- School & Role Banner -->
        <div class="p-3.5 border-b border-slate-100 bg-slate-50/70">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campus</div>
          <div class="text-xs font-bold text-slate-900 truncate mt-0.5">{{ auth.currentUser()?.school?.name || 'Demo International School' }}</div>
          <div class="flex items-center gap-1.5 mt-1.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              AY 2026-27
            </span>
            <span *ngIf="auth.currentUser()?.role === 'SUPER_ADMIN'" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300">
              ⚡ Super Dev
            </span>
            <span *ngIf="auth.currentUser()?.role !== 'SUPER_ADMIN'" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {{ auth.currentUser()?.roleName || auth.currentUser()?.role }}
            </span>
          </div>
        </div>

        <!-- Role-Tailored Navigation Links -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          
          <!-- Common / Dashboard -->
          <a routerLink="/dashboard" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200" [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
            <span>📊</span>
            <span>Dashboard</span>
          </a>

          <!-- ADMIN / SUPER ADMIN ONLY MENUS -->
          <ng-container *ngIf="auth.isAdmin() || auth.currentUser()?.role === 'SUPER_ADMIN'">
            <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administration</div>

            <a routerLink="/academics" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>🏫</span>
              <span>Classes & Student Roster</span>
            </a>

            <a routerLink="/attendance" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📋</span>
              <span>Attendance Register</span>
            </a>

            <a routerLink="/homework" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📝</span>
              <span>Homework Center</span>
            </a>

            <a routerLink="/exams" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📈</span>
              <span>Exams & Marksheets</span>
            </a>
          </ng-container>

          <!-- TEACHER SPECIFIC MENUS -->
          <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">
            <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Workspace</div>

            <a routerLink="/attendance" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📋</span>
              <span>Mark Class Attendance</span>
            </a>

            <a routerLink="/homework" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📝</span>
              <span>Publish Homework</span>
            </a>

            <a routerLink="/exams" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📈</span>
              <span>Enter Subject Marks</span>
            </a>
          </ng-container>

          <!-- PARENT / GUARDIAN SPECIFIC MENUS -->
          <ng-container *ngIf="auth.isParent()">
            <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Portal</div>

            <a routerLink="/attendance" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📅</span>
              <span>Child Attendance Log</span>
            </a>

            <a routerLink="/homework" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📚</span>
              <span>Child Homework Diary</span>
            </a>

            <a routerLink="/exams" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
              <span>📄</span>
              <span>Report Cards & Marks</span>
            </a>
          </ng-container>

          <!-- COMMUNICATION & SUPPORT -->
          <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communications</div>

          <a routerLink="/communication" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
             class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
            <span>📢</span>
            <span>Notices & Events</span>
          </a>

          <a routerLink="/complaints" routerLinkActive="bg-indigo-50 text-indigo-700 font-bold border-indigo-200"
             class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-transparent">
            <span>🎫</span>
            <span>Grievance Desk</span>
          </a>
        </nav>

        <!-- User Footer & Logout -->
        <div class="p-3 border-t border-slate-200 bg-slate-50">
          <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                {{ auth.currentUser()?.firstName?.charAt(0) || 'U' }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-900 truncate">{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ auth.currentUser()?.email }}</p>
              </div>
            </div>
            <button (click)="auth.logout()" title="Log out" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Navigation Bar -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm">
          <div class="flex items-center gap-4">
            <h2 class="text-sm font-bold text-slate-800">
              {{ auth.currentUser()?.school?.name }}
            </h2>

            <!-- School Switcher (for Admins / Devs) -->
            <div *ngIf="auth.isAdmin() || auth.currentUser()?.role === 'SUPER_ADMIN'" class="flex items-center gap-2 pl-4 border-l border-slate-200">
              <span class="text-[11px] font-semibold text-slate-500">Switch Campus:</span>
              <select [ngModel]="currentSchoolCode" (ngModelChange)="switchSchool($event)"
                      class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500">
                <option value="DIS001">Demo International (Delhi)</option>
                <option value="SXW002">St. Xavier's World (Mumbai)</option>
                <option value="GHA003">Greenwood High (Bengaluru)</option>
                <option value="NPS004">National Public (Hyderabad)</option>
                <option value="OIS005">Oakridge International (Kolkata)</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {{ auth.currentUser()?.roleName }}
              </span>
            </div>
          </div>
        </header>

        <!-- Main View Outlet -->
        <main class="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Global Production Toast Notifications Overlay (FretBox style) -->
      <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <div *ngFor="let t of toastService.toasts()"
             class="pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all transform duration-200 bg-white"
             [class.border-emerald-200]="t.type === 'SUCCESS'"
             [class.border-rose-200]="t.type === 'ERROR'"
             [class.border-indigo-200]="t.type === 'INFO'"
             [class.border-amber-200]="t.type === 'WARNING'">
          
          <div class="flex-shrink-0 mt-0.5">
            <span *ngIf="t.type === 'SUCCESS'" class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
            <span *ngIf="t.type === 'ERROR'" class="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">✕</span>
            <span *ngIf="t.type === 'INFO'" class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">ℹ</span>
            <span *ngIf="t.type === 'WARNING'" class="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">⚠</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-slate-900">{{ t.title || t.type }}</div>
            <div class="text-xs text-slate-600 mt-0.5 leading-relaxed">{{ t.message }}</div>
          </div>

          <button (click)="toastService.dismiss(t.id)" class="text-slate-400 hover:text-slate-600 font-bold text-sm leading-none">&times;</button>
        </div>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);

  get currentSchoolCode(): string {
    return this.auth.currentUser()?.school?.code || 'DIS001';
  }

  switchSchool(code: string) {
    const schoolEmails: Record<string, string> = {
      DIS001: 'admin@demo-school.com',
      SXW002: 'admin@stxaviers.schoolsense.in',
      GHA003: 'admin@greenwood.schoolsense.in',
      NPS004: 'admin@npms.schoolsense.in',
      OIS005: 'admin@oakridge.schoolsense.in',
    };

    const targetEmail = this.auth.currentUser()?.role === 'SUPER_ADMIN'
      ? 'dev@schoolsense.in'
      : (schoolEmails[code] || 'admin@demo-school.com');

    this.auth.login(targetEmail, 'password123').subscribe({
      next: () => {
        this.toastService.success(`Switched active campus context!`);
        window.location.reload();
      },
    });
  }
}
