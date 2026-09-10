import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="flex h-screen bg-[#edf2f7] overflow-hidden font-sans text-slate-800">
      
      <!-- Mobile Backdrop Overlay -->
      <div *ngIf="isMobileSidebarOpen" (click)="isMobileSidebarOpen = false"
           class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden animate-fadeIn"></div>

      <!-- ================================================================================== -->
      <!-- CLAYMORPHIC SIDEBAR (Desktop Fixed & Mobile Slide-Over) -->
      <!-- ================================================================================== -->
      <aside [class.translate-x-0]="isMobileSidebarOpen"
             [class.-translate-x-full]="!isMobileSidebarOpen"
             class="fixed inset-y-0 left-0 z-50 w-72 bg-[#f8fafc] border-r border-slate-200/80 shadow-[4px_0_15px_rgba(0,0,0,0.03)] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex-shrink-0">
        
        <!-- Brand Header -->
        <div class="h-16 flex items-center justify-between px-6 border-b border-slate-200/70">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center shadow-[3px_3px_8px_#cbd5e1,-3px_-3px_8px_#ffffff]">
              S
            </div>
            <div>
              <h1 class="text-sm font-extrabold text-slate-900 tracking-tight leading-none">SchoolSense</h1>
              <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Campus OS</span>
            </div>
          </div>

          <!-- Mobile Close Button -->
          <button (click)="isMobileSidebarOpen = false" class="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- School & Role Clay Banner -->
        <div class="p-4 border-b border-slate-200/60 bg-[#ffffff]/60">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campus</div>
          <div class="text-xs font-bold text-slate-900 truncate mt-0.5">{{ auth.currentUser()?.school?.name || 'Demo International School' }}</div>
          <div class="flex items-center gap-1.5 mt-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
              AY 2026-27
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm"
                  [class.bg-amber-100]="auth.currentUser()?.role === 'SUPER_ADMIN'"
                  [class.text-amber-800]="auth.currentUser()?.role === 'SUPER_ADMIN'"
                  [class.border-amber-200]="auth.currentUser()?.role === 'SUPER_ADMIN'">
              {{ displayRole }}
            </span>
          </div>
        </div>

        <!-- Role-Tailored Navigation Links with Vector Icons -->
        <nav class="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          
          <!-- Common / Dashboard -->
          <a routerLink="/dashboard" (click)="isMobileSidebarOpen = false"
             routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
            <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span>Dashboard</span>
          </a>

          <!-- ADMIN / SUPER ADMIN ONLY MENUS -->
          <ng-container *ngIf="auth.isAdmin() || auth.currentUser()?.role === 'SUPER_ADMIN'">
            <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administration</div>

            <a routerLink="/academics" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span>Classes & Roster</span>
            </a>

            <a routerLink="/attendance" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Attendance Register</span>
            </a>

            <a routerLink="/homework" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span>Homework Center</span>
            </a>

            <a routerLink="/exams" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span>Exams & Marksheets</span>
            </a>
          </ng-container>

          <!-- TEACHER SPECIFIC MENUS -->
          <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">
            <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Workspace</div>

            <!-- MY CLASS (Visible if designated as a Class Teacher) -->
            <a *ngIf="auth.isClassTeacher()" routerLink="/my-class" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div class="flex items-center justify-between flex-1">
                <span>My Class</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase tracking-tight">Class Teacher</span>
              </div>
            </a>

            <a routerLink="/attendance" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Mark Attendance</span>
            </a>

            <a routerLink="/homework" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span>Publish Homework</span>
            </a>

            <a routerLink="/exams" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span>Enter Subject Marks</span>
            </a>
          </ng-container>

          <!-- PARENT / GUARDIAN SPECIFIC MENUS -->
          <ng-container *ngIf="auth.isParent()">
            <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Portal</div>

            <a routerLink="/attendance" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Child Attendance</span>
            </a>

            <a routerLink="/homework" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span>Homework Diary</span>
            </a>

            <a routerLink="/exams" (click)="isMobileSidebarOpen = false"
               routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
               class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
              <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span>Report Cards</span>
            </a>
          </ng-container>

          <!-- COMMUNICATION & SUPPORT -->
          <div class="pt-3 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communications</div>

          <a routerLink="/communication" (click)="isMobileSidebarOpen = false"
             routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
             class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
            <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span>Notices & Events</span>
          </a>

          <a routerLink="/complaints" (click)="isMobileSidebarOpen = false"
             routerLinkActive="bg-white text-slate-900 font-bold border-slate-200/90 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff]"
             class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all border border-transparent">
            <div class="w-6 h-6 rounded-lg bg-slate-100/90 flex items-center justify-center text-slate-700 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <span>Grievance Desk</span>
          </a>
        </nav>

        <!-- User Footer & Logout Card -->
        <div class="p-3.5 border-t border-slate-200/70 bg-[#f8fafc]">
          <div class="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff]">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {{ auth.currentUser()?.firstName?.charAt(0) || 'U' }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-900 truncate">{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ auth.currentUser()?.email }}</p>
              </div>
            </div>
            <button (click)="auth.logout()" title="Log out" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- ================================================================================== -->
      <!-- MAIN CONTENT AREA -->
      <!-- ================================================================================== -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#edf2f7]">
        <!-- Top Navigation Header -->
        <header class="h-16 bg-[#ffffff] border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div class="flex items-center gap-3">
            <!-- Mobile Hamburger Toggle -->
            <button type="button" (click)="isMobileSidebarOpen = true"
                    class="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h2 class="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {{ auth.currentUser()?.school?.name }}
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-[#f8fafc] text-slate-700 border border-slate-200 shadow-sm"
                  [class.bg-amber-100]="auth.currentUser()?.role === 'SUPER_ADMIN'"
                  [class.text-amber-800]="auth.currentUser()?.role === 'SUPER_ADMIN'"
                  [class.border-amber-200]="auth.currentUser()?.role === 'SUPER_ADMIN'">
              {{ displayRole }}
            </span>
          </div>
        </header>

        <!-- Main View Outlet -->
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#edf2f7]">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Global Production Toast Notifications Overlay (Claymorphic) -->
      <div class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <div *ngFor="let t of toastService.toasts()"
             class="pointer-events-auto p-4 rounded-3xl shadow-[6px_6px_20px_rgba(0,0,0,0.08)] border flex items-start gap-3 transition-all transform duration-200 bg-white"
             [class.border-emerald-200]="t.type === 'SUCCESS'"
             [class.border-rose-200]="t.type === 'ERROR'"
             [class.border-slate-300]="t.type === 'INFO'"
             [class.border-amber-200]="t.type === 'WARNING'">
          
          <div class="flex-shrink-0 mt-0.5">
            <span *ngIf="t.type === 'SUCCESS'" class="w-6 h-6 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-200 shadow-xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </span>
            <span *ngIf="t.type === 'ERROR'" class="w-6 h-6 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-200 shadow-xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </span>
            <span *ngIf="t.type === 'INFO'" class="w-6 h-6 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200 shadow-xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <span *ngIf="t.type === 'WARNING'" class="w-6 h-6 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold border border-amber-200 shadow-xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-slate-900">{{ t.title || t.type }}</div>
            <div class="text-xs text-slate-600 mt-0.5 leading-relaxed">{{ t.message }}</div>
          </div>

          <button (click)="toastService.dismiss(t.id)" class="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors">&times;</button>
        </div>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);
  isMobileSidebarOpen = false;

  get displayRole(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    if (user.role === 'SUPER_ADMIN') return 'Dev Root';
    if (this.auth.isTeacher()) {
      return this.auth.isClassTeacher() ? 'Class Teacher' : 'Teacher';
    }
    return user.roleName || user.role;
  }
}

