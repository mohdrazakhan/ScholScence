import { Component, inject, OnInit, OnDestroy, effect, computed } from '@angular/core';
import { ModalService } from '../core/services/modal.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { AcademicSession, Notice } from '../core/models';

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
      <!-- UNIFIED CLAYMORPHIC COLLAPSIBLE SIDEBAR (Hidden for Root Super Admin outside Support) -->
      <!-- ================================================================================== -->
      <aside *ngIf="!isSuperAdminOnly()"
             [ngClass]="{
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
      <div class="flex-1 flex flex-col min-w-0 bg-[#edf2f7]">
        
        <!-- Binary Support Mode Global Banner -->
        <div *ngIf="auth.isSupportSession()"
             class="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 sm:px-8 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0 border-b border-amber-600/30 animate-fadeIn z-30">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse"></span>
            <span>
              🎧 <strong>BINARY SUPPORT MODE ACTIVE:</strong> You are managing <u>{{ auth.currentUser()?.school?.name }}</u> as Delegated Administrator.
            </span>
          </div>
          <button (click)="exitSupportMode()"
                  class="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit Support & Return to Platform Console</span>
          </button>
        </div>

        <!-- Top Navigation Header -->
        <header class="h-16 bg-[#ffffff] border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <!-- Top Left for Root Super Admin (Full Width Console Branding) -->
          <div *ngIf="isSuperAdminOnly()" class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
              ⚡
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  SchoolSense Platform Console
                </h2>
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  Root Multi-Tenant Engine
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-semibold hidden sm:block">Campus Onboarding & Service Governance</p>
            </div>
          </div>

          <!-- Top Left for School Users & Support Mode (Header Details) -->
          <div *ngIf="!isSuperAdminOnly()" class="flex items-center gap-3 min-w-0">
            <!-- Sidebar Unhide Button (shown when collapsed or on mobile) -->
            <button *ngIf="isDesktopSidebarCollapsed" type="button" (click)="toggleSidebar()" title="Open Sidebar"
                    class="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer hidden lg:flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button type="button" (click)="toggleSidebar()" title="Open Sidebar"
                    class="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex lg:hidden items-center justify-center border border-slate-200 shadow-xs shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <!-- Campus & Welcome Details in Header Bar -->
            <div class="min-w-0">
              <!-- Line 1: User Greeting with Sun/Moon Animated Icon, Date & 12-Hour Live Clock -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Dynamic Sun / Moon Animated Icon based on Time of Day -->
                <span *ngIf="timePeriod === 'morning'"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-500 border border-amber-200/80 shadow-2xs shrink-0"
                      title="Good morning">
                  <svg class="w-3.5 h-3.5 animate-spin-gentle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>

                <span *ngIf="timePeriod === 'afternoon'"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-500 border border-amber-200/80 shadow-2xs shrink-0"
                      title="Good afternoon">
                  <svg class="w-3.5 h-3.5 animate-spin-gentle" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
                  </svg>
                </span>

                <span *ngIf="timePeriod === 'evening'"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 text-orange-500 border border-orange-200/80 shadow-2xs shrink-0"
                      title="Good evening">
                  <svg class="w-3.5 h-3.5 animate-float-gentle" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>

                <span *ngIf="timePeriod === 'night'"
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-indigo-500 border border-slate-200/80 shadow-2xs shrink-0"
                      title="Good evening">
                  <svg class="w-3.5 h-3.5 animate-float-gentle" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </span>

                <h2 class="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                  {{ timeGreeting }}, {{ auth.currentUser()?.firstName || 'User' }}
                </h2>

                <span class="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline-block shrink-0"></span>
                <span class="text-[11px] font-semibold text-slate-500 hidden sm:inline">{{ formattedToday }}</span>

                <span class="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline-block shrink-0"></span>
                <!-- Real-time 12-Hour Clock (Hour & Min only) -->
                <div class="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{{ formattedClockTime }}</span>
                </div>
              </div>

              <!-- Line 2: Academic Session Dropdown + Subtitle (Aligned dot, clean UI) -->
              <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                <!-- Interactive Session Switcher Dropdown -->
                <div *ngIf="canManageSessions" class="relative inline-block">
                  <button type="button" (click)="toggleSessionDropdown($event)"
                          class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Click to switch academic session">
                    <span>Session: {{ auth.activeSessionName() }}</span>
                    <svg class="w-3 h-3 text-slate-500 transition-transform duration-200" [class.rotate-180]="isSessionDropdownOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <!-- Backdrop to close dropdown -->
                  <div *ngIf="isSessionDropdownOpen" (click)="closeSessionDropdown()" class="fixed inset-0 z-40"></div>

                  <!-- Dropdown Menu -->
                  <div *ngIf="isSessionDropdownOpen"
                       class="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
                    
                    <div class="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                      <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Available Sessions</span>
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                        {{ availableSessions.length }}
                      </span>
                    </div>

                    <div class="max-h-56 overflow-y-auto py-1 space-y-0.5 custom-clay-scroll">
                      <button *ngFor="let ses of availableSessions"
                              type="button"
                              (click)="selectSession(ses, $event)"
                              class="w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer"
                              [ngClass]="isSessionActive(ses) ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 font-medium'">
                        <div>
                          <div class="flex items-center gap-1.5">
                            <span>{{ ses.name }}</span>
                            <span *ngIf="ses.is_current" class="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              CURRENT
                            </span>
                          </div>
                          <div class="text-[10px] text-slate-400 font-normal mt-0.5">
                            {{ ses.start_date }} ➔ {{ ses.end_date }}
                          </div>
                        </div>

                        <div *ngIf="isSessionActive(ses)" class="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                          ✓
                        </div>
                      </button>

                      <div *ngIf="availableSessions.length === 0" class="px-3 py-3 text-center text-xs text-slate-400">
                        Loading sessions...
                      </div>
                    </div>

                    <!-- Manage Sessions & Rollover link inside dropdown -->
                    <div class="pt-1 border-t border-slate-100 px-1.5">
                      <button type="button"
                              (click)="openManageSessionsFromHeader($event)"
                              class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
                        <span>⚡ Manage Sessions & Rollover</span>
                      </button>
                    </div>

                  </div>
                </div>

                <span *ngIf="canManageSessions" class="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline-block shrink-0"></span>
                <p class="text-[11px] text-slate-500 truncate hidden sm:inline">
                  Manage campus operations, attendance, and student directory.
                </p>
              </div>
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

            <!-- Notification Bell Icon Button with Dropdown -->
            <div class="relative">
              <button type="button"
                      (click)="toggleNotificationDropdown($event)"
                      title="Notifications & Circulars"
                      class="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <!-- Red unread notification indicator if any active notification -->
                <span *ngIf="activeNotifications.length > 0" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>

              <!-- Backdrop to close notifications -->
              <div *ngIf="isNotificationDropdownOpen" (click)="isNotificationDropdownOpen = false" class="fixed inset-0 z-40"></div>

              <!-- Notifications Menu Dropdown -->
              <div *ngIf="isNotificationDropdownOpen"
                   class="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-200/90 p-3.5 z-50 animate-fadeIn">
                <div class="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-black text-slate-900">Notifications</span>
                    <span *ngIf="activeNotifications.length > 0" class="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700">
                      {{ activeNotifications.length }} New
                    </span>
                  </div>
                  <button *ngIf="activeNotifications.length > 0"
                          type="button"
                          (click)="clearAllNotifications($event)"
                          class="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer hover:underline">
                    Clear All
                  </button>
                </div>

                <!-- Active Notifications List -->
                <div *ngIf="activeNotifications.length > 0" class="space-y-2 max-h-64 overflow-y-auto custom-clay-scroll pr-0.5">
                  <div *ngFor="let n of activeNotifications"
                       class="group relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors">
                    <div class="flex items-start justify-between gap-2 text-[10px]">
                      <span class="font-bold text-slate-900 line-clamp-1 flex-1">{{ n.title }}</span>
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span class="text-slate-400">{{ formatNoticeTime(n.published_at) }}</span>
                        <button type="button" (click)="dismissNotification(n.id, $event)" title="Dismiss"
                                class="text-slate-400 hover:text-rose-600 rounded-md p-0.5 transition-colors cursor-pointer text-xs font-bold leading-none">
                          &times;
                        </button>
                      </div>
                    </div>
                    <p class="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{{ n.content }}</p>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="activeNotifications.length === 0" class="py-6 px-4 text-center">
                  <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2 shadow-2xs border border-slate-200/60">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p class="text-xs font-bold text-slate-700">No new notifications</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">You're all caught up!</p>
                </div>
              </div>
            </div>

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

      <!-- Global Full Viewport Modal Backdrop Dimmer (Dims entire viewport including header & sidebar) -->
      <div *ngIf="modalService.isOpen()"
           class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[60] animate-fadeIn"></div>
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

    @keyframes spinGentle {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-gentle {
      animation: spinGentle 20s linear infinite;
    }

    @keyframes floatGentle {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-2px) rotate(3deg); }
    }
    .animate-float-gentle {
      animation: floatGentle 3.5s ease-in-out infinite;
    }
  `],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  api = inject(ApiService);
  router = inject(Router);
  toastService = inject(ToastService);
  modalService = inject(ModalService);
  
  isMobileSidebarOpen = false;
  isDesktopSidebarCollapsed = false;
  menuSearchQuery = '';

  isSessionDropdownOpen = false;
  isNotificationDropdownOpen = false;
  availableSessions: AcademicSession[] = [];
  notifications: Notice[] = [];
  dismissedNoticeIds = new Set<string>();

  get activeNotifications(): Notice[] {
    return this.notifications.filter((n) => !this.dismissedNoticeIds.has(n.id));
  }

  isSuperAdminOnly = computed(() => this.auth.isSuperAdmin() && !this.auth.isSupportSession());

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
        { label: 'Alumni Directory', route: '/academics', queryParams: { tab: 'alumni' } },
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

  get canManageSessions(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal();
  }

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

  currentTime: Date = new Date();
  clockTimer: any = null;

  get formattedToday(): string {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return this.currentTime.toLocaleDateString('en-US', options);
  }

  get formattedClockTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  get timePeriod(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = this.currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  get timeGreeting(): string {
    const p = this.timePeriod;
    if (p === 'morning') return 'Good morning';
    if (p === 'afternoon') return 'Good afternoon';
    return 'Good evening';
  }

  constructor() {
    effect(() => {
      // Re-filter sidebar menus automatically whenever currentUser or support mode changes
      this.auth.currentUser();
      this.filterMenu();
      this.expandActiveGroup();
      this.loadNotifications();
    });
  }

  ngOnInit() {
    this.filterMenu();
    this.loadSessions();
    this.loadNotifications();

    // Start 12-hour real-time clock ticker
    this.clockTimer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Auto expand active parent group on route change
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.expandActiveGroup();
      });
    this.expandActiveGroup();
  }

  ngOnDestroy() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  loadSessions() {
    if (!this.isSuperAdminOnly()) {
      this.api.get<AcademicSession[]>('academics/sessions').subscribe({
        next: (res) => {
          this.availableSessions = res || [];
          if (!this.auth.activeAcademicSession() && this.availableSessions.length > 0) {
            const current = this.availableSessions.find((s) => s.is_current) || this.availableSessions[0];
            this.auth.setActiveSession(current);
          }
        },
        error: (err) => console.error('Failed to load sessions', err),
      });
    }
  }

  toggleSessionDropdown(event: Event) {
    event.stopPropagation();
    this.isSessionDropdownOpen = !this.isSessionDropdownOpen;
    if (this.isSessionDropdownOpen) {
      this.loadSessions();
    }
  }

  closeSessionDropdown() {
    this.isSessionDropdownOpen = false;
  }

  openManageSessionsFromHeader(event: Event) {
    event.stopPropagation();
    this.closeSessionDropdown();
    this.router.navigate(['/academics'], {
      queryParams: { tab: 'students', manageSessions: Date.now().toString() },
    });
  }

  selectSession(ses: AcademicSession, event: Event) {
    event.stopPropagation();
    this.auth.setActiveSession(ses);
    this.isSessionDropdownOpen = false;
    this.toastService.success(`Switched active session to "${ses.name}"`);

    const currentUrl = this.router.url;
    if (currentUrl.includes('/academics') || currentUrl.includes('/dashboard')) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigateByUrl(currentUrl);
      });
    }
  }

  deleteSession(ses: AcademicSession, event: Event) {
    event.stopPropagation();
    if (this.availableSessions.length <= 1) {
      this.toastService.warning('Cannot delete the only configured session.');
      return;
    }

    if (!confirm(`Are you sure you want to delete session "${ses.name}"?`)) {
      return;
    }

    this.api.delete(`academics/sessions/${ses.id}`).subscribe({
      next: () => {
        this.toastService.success(`Session "${ses.name}" deleted.`);
        const active = this.auth.activeAcademicSession();
        if (active && active.id === ses.id) {
          const remaining = this.availableSessions.filter((s) => s.id !== ses.id);
          const current = remaining.find((s) => s.is_current) || remaining[0];
          if (current) {
            this.auth.setActiveSession(current);
          }
        }
        this.loadSessions();
      },
      error: (err: any) => {
        this.toastService.error(err.message || 'Failed to delete session');
      },
    });
  }

  isSessionActive(ses: AcademicSession): boolean {
    const active = this.auth.activeAcademicSession();
    if (active) return active.id === ses.id;
    return !!ses.is_current;
  }

  loadNotifications() {
    if (this.isSuperAdminOnly()) {
      this.notifications = [];
      return;
    }

    const userId = this.auth.currentUser()?.id || 'guest';
    try {
      const saved = localStorage.getItem(`dismissed_notices_${userId}`);
      if (saved) {
        this.dismissedNoticeIds = new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse saved dismissed notices', e);
    }

    this.api.get<Notice[]>('communication/notices').subscribe({
      next: (res) => {
        this.notifications = res || [];
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.notifications = [];
      },
    });
  }

  toggleNotificationDropdown(event: Event) {
    event.stopPropagation();
    this.isNotificationDropdownOpen = !this.isNotificationDropdownOpen;
    if (this.isNotificationDropdownOpen) {
      this.loadNotifications();
    }
  }

  dismissNotification(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.dismissedNoticeIds.add(id);
    this.saveDismissedNotices();
  }

  clearAllNotifications(event?: Event) {
    if (event) event.stopPropagation();
    this.notifications.forEach((n) => this.dismissedNoticeIds.add(n.id));
    this.saveDismissedNotices();
    this.toastService.info('All notifications cleared');
  }

  private saveDismissedNotices() {
    const userId = this.auth.currentUser()?.id || 'guest';
    try {
      localStorage.setItem(`dismissed_notices_${userId}`, JSON.stringify(Array.from(this.dismissedNoticeIds)));
    } catch (e) {
      console.warn('Failed to persist dismissed notices', e);
    }
  }

  formatNoticeTime(dateStr?: string): string {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    const isSupport = this.auth.isSupportSession();
    const isSuper = this.auth.isSuperAdmin() && !isSupport;
    const userRole = this.auth.currentUser()?.role || (isSupport ? 'SCHOOL_ADMIN' : '');
    const q = this.menuSearchQuery.trim().toLowerCase();

    const allowedGroups = this.allNavGroups
      .filter((g) => {
        // In binary support mode, Super Admin is managing the campus as School Admin:
        if (isSupport) {
          if (g.id === 'super-admin') return false; // Hide platform console
          return true; // Show all school services (Dashboard, Academics, Timetable, Attendance, Homework, Exams, etc.)
        }

        // Super Admin (outside support mode) only manages platform onboarding, network & services
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
      // Filter child submenus based on service restrictions (bypassed for Super Admin and Support Admin)
      let children = g.children;
      if (children && !isSuper && !isSupport) {
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

  exitSupportMode() {
    this.auth.exitSupportSession();
    this.toastService.info('Exited Support Mode. Returned to Platform Console.');
  }
}
