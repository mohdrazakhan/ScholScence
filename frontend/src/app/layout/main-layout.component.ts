import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../core/services/toast.service';

export interface SubMenuItem {
  label: string;
  route: string;
  queryParams?: Record<string, any>;
  badge?: string;
  service?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  roles?: string[]; // If undefined, visible to all
  service?: string; // Feature service code
  expanded?: boolean;
  route?: string; // If direct link without submenus
  queryParams?: Record<string, any>;
  children?: SubMenuItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="flex h-screen bg-[#edf2f7] overflow-hidden font-sans text-slate-800">
      
      <!-- Mobile Backdrop Overlay -->
      <div *ngIf="isMobileSidebarOpen" (click)="isMobileSidebarOpen = false"
           class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden animate-fadeIn"></div>

      <!-- ================================================================================== -->
      <!-- UNIFIED CLAYMORPHIC COLLAPSIBLE SIDEBAR                                            -->
      <!-- ================================================================================== -->
      <aside [ngClass]="{
               'translate-x-0': isMobileSidebarOpen,
               '-translate-x-full': !isMobileSidebarOpen,
               'lg:translate-x-0': true,
               'lg:w-72': !isDesktopSidebarCollapsed,
               'lg:w-0': isDesktopSidebarCollapsed,
               'lg:opacity-100': !isDesktopSidebarCollapsed,
               'lg:opacity-0': isDesktopSidebarCollapsed,
               'border-r': !isDesktopSidebarCollapsed
             }"
             class="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 shadow-[4px_0_20px_rgba(0,0,0,0.03)] flex flex-col transition-all duration-300 ease-in-out lg:static lg:flex-shrink-0 overflow-hidden select-none">
        
        <div class="w-72 flex flex-col h-full flex-shrink-0 bg-white">
          
          <!-- Brand / Campus Header (Seamless on surface with hamburger after school name) -->
          <div class="h-16 flex items-center justify-between px-4 border-b border-slate-100 bg-white flex-shrink-0">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {{ (auth.currentUser()?.school?.name || 'S').charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <h1 class="text-xs font-black text-slate-900 tracking-tight leading-tight truncate"
                    [title]="auth.currentUser()?.school?.name || 'SchoolSense'">
                  {{ auth.currentUser()?.school?.name || 'SchoolSense' }}
                </h1>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Campus OS</span>
                  <span class="text-[9px] font-medium text-slate-500">• {{ displayRole }}</span>
                </div>
              </div>
            </div>

            <!-- Hamburger Button inside slider after school name -->
            <button type="button" (click)="toggleSidebar()" title="Collapse Sidebar"
                    class="p-2 ml-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <!-- Clean Search Bar -->
          <div class="px-3.5 py-2.5 border-b border-slate-100 flex-shrink-0 bg-white">
            <div class="relative">
              <input type="text" [(ngModel)]="menuSearchQuery" (input)="filterMenu()"
                     placeholder="Search menu..."
                     class="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 transition-colors outline-none focus:border-slate-400" />
              <div class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button *ngIf="menuSearchQuery" (click)="menuSearchQuery = ''; filterMenu()"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5 cursor-pointer">
                &times;
              </button>
            </div>
          </div>

          <!-- Navigation Links with Accordion Groups & Sub-headings -->
          <nav class="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto custom-clay-scroll">
            
            <ng-container *ngFor="let group of visibleNavGroups">
              
              <!-- CASE 1: DIRECT LINK (e.g. Dashboard, Attendance, Homework, Exams) -->
              <div *ngIf="!group.children || group.children.length === 0">
                <a [routerLink]="group.route"
                   [queryParams]="group.queryParams"
                   (click)="isMobileSidebarOpen = false"
                   class="group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-50 hover:text-slate-900 text-slate-600"
                   [class.active-nav-item]="isDirectActive(group)">
                  
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                         [ngClass]="isDirectActive(group) 
                                     ? 'bg-slate-200 text-slate-900' 
                                     : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'">
                      <svg *ngIf="group.id === 'dashboard'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <svg *ngIf="group.id === 'attendance'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <svg *ngIf="group.id === 'homework'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <svg *ngIf="group.id === 'exams'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span class="truncate">{{ group.label }}</span>
                  </div>
                </a>
              </div>

              <!-- CASE 2: ACCORDION HEADING WITH SUB-HEADINGS (Timetable, Academics, Onboarding, Communication) -->
              <div *ngIf="group.children && group.children.length > 0" class="space-y-0.5">
                
                <!-- Main Heading (Clean div role="button") -->
                <div role="button" tabindex="0" (click)="toggleGroup(group)"
                     class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-slate-50 hover:text-slate-900 text-slate-600"
                     [class.bg-slate-100]="group.expanded"
                     [class.text-slate-900]="group.expanded">
                  
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                         [ngClass]="isGroupActive(group)
                                     ? 'bg-slate-200 text-slate-900'
                                     : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'">
                      <!-- Icon for Super Admin Onboarding -->
                      <svg *ngIf="group.id === 'super-admin'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <!-- Icon for Academics -->
                      <svg *ngIf="group.id === 'academics'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <!-- Icon for Timetable -->
                      <svg *ngIf="group.id === 'timetable'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <!-- Icon for Communication -->
                      <svg *ngIf="group.id === 'communication'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <span class="truncate">{{ group.label }}</span>
                  </div>

                  <!-- Dropdown Chevron Arrow -->
                  <div class="w-5 h-5 rounded flex items-center justify-center transition-transform duration-200"
                       [class.rotate-180]="group.expanded">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <!-- Sub-menu Items (Clean Indented Links, No Card Box) -->
                <div *ngIf="group.expanded" class="ml-4 pl-3 border-l border-slate-200/80 py-1 space-y-0.5 animate-fadeIn">
                  <a *ngFor="let sub of group.children"
                     [routerLink]="sub.route"
                     [queryParams]="sub.queryParams"
                     (click)="isMobileSidebarOpen = false"
                     class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer hover:text-slate-900 hover:bg-slate-50 text-slate-500"
                     [class.text-slate-900]="isSubActive(sub)"
                     [class.font-bold]="isSubActive(sub)"
                     [class.bg-slate-100]="isSubActive(sub)">
                    
                    <span class="truncate">{{ sub.label }}</span>

                    <span *ngIf="sub.badge" class="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                      {{ sub.badge }}
                    </span>
                  </a>
                </div>

              </div>

            </ng-container>

            <div *ngIf="visibleNavGroups.length === 0" class="p-4 text-center text-xs text-slate-400">
              No menus matching "{{ menuSearchQuery }}"
            </div>
          </nav>

          <!-- Sidebar Bottom Subtle Tag (No signout here; moved to top right) -->
          <div class="px-4 py-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400 flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Campus OS • Protected</span>
          </div>

        </div>
      </aside>

      <!-- ================================================================================== -->
      <!-- MAIN CONTENT AREA                                                                  -->
      <!-- ================================================================================== -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#edf2f7]">
        <!-- Top Navigation Header (Always Accessible Unhide / Collapse Hamburger) -->
        <header class="h-16 bg-[#ffffff] border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <!-- Top Left: Hamburger & School Name (Visible ONLY when slider is closed) -->
          <div [ngClass]="isDesktopSidebarCollapsed ? 'flex' : (isMobileSidebarOpen ? 'hidden' : 'flex lg:hidden')"
               class="items-center gap-3 min-w-0">
            <!-- Sidebar Unhide Button -->
            <button type="button" (click)="toggleSidebar()" title="Open Sidebar"
                    class="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div class="min-w-0">
              <h2 class="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {{ auth.currentUser()?.school?.name || 'SchoolSense Campus' }}
              </h2>
              <p class="text-[10px] text-slate-400 font-semibold hidden sm:block">Academic Session 2026-2027</p>
            </div>
          </div>

          <!-- Top Right User Profile & Sign Out (Always pinned to top right) -->
          <div class="ml-auto flex items-center gap-3">
            <div class="flex items-center gap-2.5 pl-2">
              <!-- Circular Avatar Image -->
              <div class="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-slate-100 overflow-hidden shrink-0">
                <img [src]="userAvatarUrl" [alt]="userFullName" (error)="$any($event.target).style.display='none'" class="w-full h-full object-cover" />
                <span class="sr-only">{{ userInitial }}</span>
              </div>

              <!-- User Name & Role -->
              <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px] md:max-w-[180px]">
                  {{ userFullName }}
                </span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="inline-block w-1.5 h-1.5 rounded-full"
                        [ngClass]="auth.currentUser()?.role === 'SUPER_ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'"></span>
                  <span class="text-[10px] font-semibold text-slate-500 leading-none">
                    {{ displayRole }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Vertical Separator -->
            <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <!-- Sign Out Button -->
            <button (click)="auth.logout()"
                    title="Sign Out"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span class="hidden md:inline">Sign Out</span>
            </button>
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
  styles: [`
    /* Clean, Modern Active Nav Styles */
    .active-nav-item {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 700 !important;
      border-radius: 12px !important;
    }

    .custom-clay-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .custom-clay-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-clay-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    .custom-clay-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `],
})
export class MainLayoutComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  toastService = inject(ToastService);
  
  isMobileSidebarOpen = false;
  isDesktopSidebarCollapsed = false;
  menuSearchQuery = '';

  allNavGroups: NavGroup[] = [
    {
      id: 'super-admin',
      label: 'Onboarding & Network',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN'],
      expanded: true,
      children: [
        { label: 'School Network & Campuses', route: '/super-admin', badge: 'Root' },
        { label: 'Onboard New School', route: '/super-admin' },
      ],
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
    },
    {
      id: 'academics',
      label: 'Academics & Directory',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER'],
      expanded: true,
      children: [
        { label: 'Classes & Student Roster', route: '/academics', queryParams: { tab: 'students' } },
        { label: 'Faculty & Staff Directory', route: '/academics', queryParams: { tab: 'staff' } },
        { label: 'Curriculum Subjects Master', route: '/academics', queryParams: { tab: 'subjects' } },
      ],
    },
    {
      id: 'timetable',
      label: 'Timetable & Schedule',
      service: 'TIMETABLE',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
      expanded: true,
      children: [
        { label: 'Student / Class Timetable', route: '/timetable', queryParams: { type: 'student' } },
        { label: 'Faculty / Teacher Timetable', route: '/timetable', queryParams: { type: 'faculty' } },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance Register',
      service: 'ATTENDANCE',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
      route: '/attendance',
    },
    {
      id: 'homework',
      label: 'Homework Center',
      service: 'HOMEWORK',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
      route: '/homework',
    },
    {
      id: 'exams',
      label: 'Exams & Marksheets',
      service: 'EXAMS',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
      route: '/exams',
    },
    {
      id: 'communication',
      label: 'Communication & Notices',
      service: 'COMMUNICATION',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
      expanded: false,
      children: [
        { label: 'Circulars & Notices', route: '/communication' },
        { label: 'Grievance Desk', route: '/complaints', service: 'COMPLAINTS' },
      ],
    },
  ];

  visibleNavGroups: NavGroup[] = [];

  get displayRole(): string {
    const user = this.auth.currentUser();
    if (!user) return '';
    if (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_ADMIN') return 'Super Admin';
    if (this.auth.isTeacher()) {
      return this.auth.isClassTeacher() ? 'Class Teacher' : 'Teacher';
    }
    return user.roleName || user.role;
  }

  get userFullName(): string {
    const u = this.auth.currentUser();
    if (!u) return 'User';
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return name || u.email || 'User';
  }

  get userInitial(): string {
    const u = this.auth.currentUser();
    if (u?.firstName) return u.firstName.charAt(0).toUpperCase();
    if (u?.email) return u.email.charAt(0).toUpperCase();
    return 'U';
  }

  get userAvatarUrl(): string {
    const name = encodeURIComponent(this.userFullName);
    return `https://ui-avatars.com/api/?name=${name}&background=0f172a&color=ffffff&bold=true&size=128`;
  }

  ngOnInit() {
    this.filterMenu();

    // Auto expand active parent group on route change
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.expandActiveGroup();
      });
    this.expandActiveGroup();
  }

  isDirectActive(group: NavGroup): boolean {
    if (!group.route) return false;
    const urlTree = this.router.parseUrl(this.router.url);
    const primaryPath = '/' + (urlTree.root.children['primary']?.segments.map((s) => s.path).join('/') || '');
    return primaryPath === group.route;
  }

  isGroupActive(group: NavGroup): boolean {
    if (group.route) return this.isDirectActive(group);
    return !!group.children?.some((c) => this.isSubActive(c));
  }

  isSubActive(sub: SubMenuItem): boolean {
    const urlTree = this.router.parseUrl(this.router.url);
    const primaryPath = '/' + (urlTree.root.children['primary']?.segments.map((s) => s.path).join('/') || '');
    
    if (primaryPath !== sub.route) {
      return false;
    }

    if (sub.queryParams && Object.keys(sub.queryParams).length > 0) {
      for (const key of Object.keys(sub.queryParams)) {
        const val = urlTree.queryParams[key];
        if (val !== undefined && val !== sub.queryParams[key]) {
          return false;
        }
        // If current URL has no query param, the first child is active by default
        if (val === undefined) {
          const parent = this.allNavGroups.find((g) => g.children?.some((c) => c.label === sub.label));
          if (parent && parent.children && parent.children[0] === sub) {
            return true;
          }
          return false;
        }
      }
      return true;
    }

    // Sub has no query params: active if URL has no query params
    return Object.keys(urlTree.queryParams).length === 0;
  }

  toggleSidebar() {
    if (window.innerWidth < 1024) {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    } else {
      this.isDesktopSidebarCollapsed = !this.isDesktopSidebarCollapsed;
    }
  }

  toggleGroup(group: NavGroup) {
    group.expanded = !group.expanded;
  }

  expandActiveGroup() {
    const currentUrl = this.router.url;
    for (const g of this.allNavGroups) {
      if (g.children?.some((c) => currentUrl.startsWith(c.route))) {
        g.expanded = true;
      }
    }
  }

  filterMenu() {
    const isSuper = this.auth.isSuperAdmin();
    const userRole = this.auth.currentUser()?.role || '';
    const q = this.menuSearchQuery.trim().toLowerCase();

    const allowedGroups = this.allNavGroups
      .filter((g) => {
        // Super Admin only manages platform onboarding, network & services
        if (isSuper) {
          return g.id === 'super-admin';
        }

        // Regular school users cannot see super-admin root group
        if (g.id === 'super-admin') {
          return false;
        }

        if (g.roles && !g.roles.includes(userRole)) {
          return false;
        }

        // Check if group's service is disabled for current school
        if (g.service && !this.auth.isServiceEnabled(g.service)) {
          return false;
        }

        return true;
      });

    const result: NavGroup[] = [];
    for (const g of allowedGroups) {
      // Filter child submenus based on service restrictions (bypassed for Super Admin)
      let children = g.children;
      if (children && !isSuper) {
        children = children.filter((c) => {
          if (c.service && !this.auth.isServiceEnabled(c.service)) {
            return false;
          }
          return true;
        });
      }

      if (!q) {
        result.push({ ...g, children });
        continue;
      }

      const labelMatches = g.label.toLowerCase().includes(q);
      const matchingChildren = children?.filter((c) => c.label.toLowerCase().includes(q));

      if (labelMatches) {
        result.push({ ...g, children, expanded: true });
      } else if (matchingChildren && matchingChildren.length > 0) {
        result.push({ ...g, children: matchingChildren, expanded: true });
      }
    }

    this.visibleNavGroups = result.filter((g) => !g.children || g.children.length > 0);
  }
}
