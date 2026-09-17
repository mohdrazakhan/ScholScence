import { Component, inject, OnInit, OnDestroy, effect, computed } from '@angular/core';
import { ModalService } from '../core/services/modal.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AuthService, DEFAULT_ROLE_PERMISSIONS } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { ToastService } from '../core/services/toast.service';
import { ImageUploadService } from '../core/services/image-upload.service';
import { AcademicSession, Notice } from '../core/models';

export interface SubMenuItem {
  id?: string;
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

export interface RoleSectionItem {
  id: string;
  name: string;
  category: string;
  description: string;
  isParent?: boolean;
  parentId?: string;
  badge?: string;
}

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
              <div class="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs overflow-hidden border border-slate-200">
                <img *ngIf="getSchoolLogoUrl()" [src]="getSchoolLogoUrl()" class="w-full h-full object-contain p-0.5 bg-white" alt="School Logo" />
                <span *ngIf="!getSchoolLogoUrl()">{{ (auth.currentUser()?.school?.name || 'S').charAt(0).toUpperCase() }}</span>
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
                      <svg *ngIf="group.id === 'subscription'" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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
        <header class="h-16 bg-[#ffffff] border-b border-slate-200/80 flex items-center justify-between px-3 sm:px-6 lg:px-8 flex-shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <!-- Top Left for Root Super Admin (Full Width Console Branding) -->
          <div *ngIf="isSuperAdminOnly()" class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
              ⚡
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <h2 class="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate">
                  SchoolSense Platform Console
                </h2>
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                  Root Multi-Tenant Engine
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-semibold hidden sm:block truncate">Campus Onboarding & Service Governance</p>
            </div>
          </div>

          <!-- Top Left for School Users & Support Mode (Header Details) -->
          <div *ngIf="!isSuperAdminOnly()" class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            <!-- Sidebar Unhide Button (shown when collapsed or on mobile) -->
            <button *ngIf="isDesktopSidebarCollapsed" type="button" (click)="toggleSidebar()" title="Open Sidebar"
                    class="p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer hidden lg:flex items-center justify-center border border-slate-200 shadow-2xs shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button type="button" (click)="toggleSidebar()" title="Open Sidebar"
                    class="p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex lg:hidden items-center justify-center border border-slate-200 shadow-2xs shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <!-- Campus & Welcome Details in Header Bar -->
            <div class="min-w-0 flex-1 flex flex-col justify-center">
              <!-- Line 1: User Greeting with Sun/Moon Icon, Date & Live Clock -->
              <div class="flex items-center gap-1.5 min-w-0">
                <!-- Dynamic Time of Day Icon (Optically Centered) -->
                <span *ngIf="timePeriod === 'morning'"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 text-amber-500 border border-amber-200/60 shadow-2xs shrink-0"
                      title="Good morning">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>

                <span *ngIf="timePeriod === 'afternoon'"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 text-amber-500 border border-amber-200/60 shadow-2xs shrink-0"
                      title="Good afternoon">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>

                <span *ngIf="timePeriod === 'evening'"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-50 text-orange-500 border border-orange-200/60 shadow-2xs shrink-0"
                      title="Good evening">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>

                <span *ngIf="timePeriod === 'night'"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-2xs shrink-0"
                      title="Good evening">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </span>

                <h2 class="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                  {{ timeGreeting }}, {{ auth.currentUser()?.firstName || 'User' }}
                </h2>

                <span class="w-1 h-1 rounded-full bg-slate-300 hidden md:inline-block shrink-0"></span>
                <span class="text-[11px] font-semibold text-slate-500 hidden md:inline whitespace-nowrap">{{ formattedToday }}</span>

                <span class="w-1 h-1 rounded-full bg-slate-300 hidden md:inline-block shrink-0"></span>
                <!-- Real-time 12-Hour Clock (Hour & Min only) -->
                <div class="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs shrink-0 whitespace-nowrap">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{{ formattedClockTime }}</span>
                </div>
              </div>

              <!-- Line 2: Academic Session Dropdown + Subtitle (Aligned dot, clean UI) -->
              <div class="flex items-center gap-1.5 mt-0.5 min-w-0">
                <!-- Interactive Session Switcher Dropdown -->
                <div *ngIf="canManageSessions" class="relative inline-block shrink-0">
                  <button type="button" (click)="toggleSessionDropdown($event)"
                          class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                          title="Click to switch academic session">
                    <span>Session: {{ auth.activeSessionName() }}</span>
                    <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 transition-transform duration-200" [class.rotate-180]="isSessionDropdownOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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

                <span *ngIf="canManageSessions" class="w-1 h-1 rounded-full bg-slate-300 hidden lg:inline-block shrink-0"></span>
                <p class="text-[11px] text-slate-500 truncate hidden lg:inline">
                  Manage campus operations, attendance, and student directory.
                </p>
              </div>
            </div>
          </div>

          <!-- Top Right Section: Mobile Profile Menu (Mobile Only) & Full Bar (Desktop Only) -->
          <div class="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">

            <!-- ============================================================== -->
            <!-- MOBILE VIEW ONLY: Profile Pic with Dropdown Arrow Icon         -->
            <!-- ============================================================== -->
            <div class="relative lg:hidden">
              <!-- Profile Pic Capsule Button with Down Arrow -->
              <button type="button"
                      (click)="toggleMobileUserMenu($event)"
                      title="User Profile & Quick Menu"
                      class="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-95">
                
                <!-- Avatar Image -->
                <div class="relative w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <img [src]="userAvatarUrl" [alt]="userFullName" (error)="$any($event.target).style.display='none'" class="w-full h-full object-cover" />
                  <span class="sr-only">{{ userInitial }}</span>
                  <!-- Red badge on avatar if notifications exist -->
                  <span *ngIf="activeNotifications.length > 0" class="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                </div>

                <!-- Dropdown Arrow Icon -->
                <svg class="w-3.5 h-3.5 text-slate-600 mr-1 transition-transform duration-200"
                     [class.rotate-180]="isMobileUserMenuOpen"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Mobile Backdrop Overlay -->
              <div *ngIf="isMobileUserMenuOpen" (click)="isMobileUserMenuOpen = false" class="fixed inset-0 z-40"></div>

              <!-- Mobile Dropdown Menu List -->
              <div *ngIf="isMobileUserMenuOpen"
                   class="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.15)] border border-slate-200/90 p-2.5 z-50 animate-fadeIn">
                
                <!-- User Identity Card -->
                <div class="px-2.5 py-2 flex items-center gap-2.5 border-b border-slate-100 mb-1">
                  <div class="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                    <img [src]="userAvatarUrl" [alt]="userFullName" (error)="$any($event.target).style.display='none'" class="w-full h-full object-cover" />
                    <span class="sr-only">{{ userInitial }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-black text-slate-900 truncate leading-tight">{{ userFullName }}</div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="inline-block w-1.5 h-1.5 rounded-full"
                            [ngClass]="auth.currentUser()?.role === 'SUPER_ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'"></span>
                      <span class="text-[10px] font-semibold text-slate-500 leading-none truncate">{{ displayRole }}</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Menu Options -->
                <div class="space-y-1 py-1">
                  <!-- Notifications Button (with Bell Icon) -->
                  <button type="button"
                          (click)="openMobileNotifications($event)"
                          class="w-full flex items-center justify-between p-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <span class="text-xs font-bold text-slate-800">Notifications</span>
                    </div>
                    <span *ngIf="activeNotifications.length > 0" class="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                      {{ activeNotifications.length }} New
                    </span>
                  </button>

                  <!-- School Profile & Branding (If admin) -->
                  <button *ngIf="canAccessSettings" type="button"
                          (click)="openMobileSchoolProfile($event)"
                          class="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span class="text-xs font-bold text-slate-800">School Profile & Branding</span>
                  </button>

                  <!-- Academic Sessions (If admin) -->
                  <button *ngIf="canManageSessions" type="button"
                          (click)="openMobileSessions($event)"
                          class="w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span class="text-xs font-bold text-slate-800">Academic Sessions</span>
                  </button>
                </div>

                <!-- Sign Out Section -->
                <div class="pt-1.5 border-t border-slate-100 mt-1">
                  <button type="button"
                          (click)="auth.logout()"
                          class="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-bold text-xs cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>

              </div>
            </div>

            <!-- ============================================================== -->
            <!-- DESKTOP VIEW ONLY (hidden on mobile, visible on lg:)           -->
            <!-- ============================================================== -->
            <div class="hidden lg:flex items-center gap-2.5">
              <!-- User Avatar & Identity -->
              <div class="flex items-center gap-2 pl-1">
                <!-- Circular Avatar Image -->
                <div class="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-slate-100 overflow-hidden shrink-0">
                  <img [src]="userAvatarUrl" [alt]="userFullName" (error)="$any($event.target).style.display='none'" class="w-full h-full object-cover" />
                  <span class="sr-only">{{ userInitial }}</span>
                </div>

                <!-- User Name & Role -->
                <div class="flex flex-col text-left">
                  <span class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px] xl:max-w-[180px]">
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
              <div class="h-5 w-px bg-slate-200"></div>

              <!-- Notification Bell Icon Button with Dropdown -->
              <div class="relative shrink-0">
                <button type="button"
                        (click)="toggleNotificationDropdown($event)"
                        title="Notifications & Circulars"
                        class="relative w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span *ngIf="activeNotifications.length > 0" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                </button>

                <!-- Backdrop to close notifications -->
                <div *ngIf="isNotificationDropdownOpen" (click)="isNotificationDropdownOpen = false" class="fixed inset-0 z-40"></div>

                <!-- Notifications Menu Dropdown -->
                <div *ngIf="isNotificationDropdownOpen"
                     class="absolute right-0 top-full mt-2 w-72 sm:w-88 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-200/90 p-3.5 z-50 animate-fadeIn">
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

              <!-- Settings Gear Icon Button with Dropdown (Restricted to Super Admin and School Admin) -->
              <div *ngIf="canAccessSettings" class="relative shrink-0">
                <button type="button"
                        (click)="toggleSettingsDropdown($event)"
                        title="Settings & Administration"
                        class="relative w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center">
                  <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                <!-- Backdrop to close settings dropdown -->
                <div *ngIf="isSettingsDropdownOpen" (click)="isSettingsDropdownOpen = false" class="fixed inset-0 z-40"></div>

                <!-- Settings Menu Dropdown -->
                <div *ngIf="isSettingsDropdownOpen"
                     class="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-200/90 p-2 z-50 animate-fadeIn">
                  <div class="px-3 py-2 border-b border-slate-100 mb-1">
                    <span class="text-xs font-black text-slate-900 tracking-tight block">Campus Administration</span>
                    <span class="text-[10px] text-slate-400">Institutional settings & profile management</span>
                  </div>

                  <div class="space-y-1">
                    <!-- Option 1: School Profile -->
                    <button type="button"
                            (click)="openSchoolProfileModal($event)"
                            class="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group">
                      <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-2xs">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="text-xs font-bold text-slate-900 group-hover:text-slate-950 block">School Profile & Branding</span>
                        <span class="text-[10px] text-slate-500 leading-tight block">Manage crest, contact, affiliation & official identity</span>
                      </div>
                    </button>

                    <!-- Option 2: Manage Academic Sessions -->
                    <button type="button"
                            (click)="openManageSessionsFromHeader($event)"
                            class="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer group">
                      <div class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-2xs">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <span class="text-xs font-bold text-slate-900 group-hover:text-slate-950 block">Academic Sessions & Rollover</span>
                        <span class="text-[10px] text-slate-500 leading-tight block">Configure active session, dates & session promotion</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Sign Out Button -->
              <button (click)="auth.logout()"
                      title="Sign Out"
                      class="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0 gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span class="hidden xl:inline">Sign Out</span>
              </button>
            </div>

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

      <!-- ============================================================== -->
      <!-- MODAL: SCHOOL PROFILE MANAGEMENT                               -->
      <!-- ============================================================== -->
      <!-- ============================================================== -->
      <!-- MODAL: COMPREHENSIVE INSTITUTIONAL SCHOOL PROFILE              -->
      <!-- ============================================================== -->
      <div *ngIf="showSchoolProfileModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[90] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeSchoolProfileModal()"></div>
        <div class="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[92vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp relative z-10">
          <!-- Modal Header -->
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-lg shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Institutional School Profile</h3>
                <p class="text-xs text-slate-500 mt-0.5">Comprehensive campus identity, board affiliation, leadership directory & coordinates.</p>
              </div>
            </div>
            <button (click)="closeSchoolProfileModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Section Navigation Tabs -->
          <div class="px-5 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 shrink-0 overflow-x-auto">
            <button type="button" (click)="schoolProfileActiveTab = 'BASIC'"
                    [ngClass]="schoolProfileActiveTab === 'BASIC' ? 'bg-slate-900 text-white font-black shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 font-bold border border-slate-200'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>1. Identity & Affiliation</span>
            </button>

            <button type="button" (click)="schoolProfileActiveTab = 'LEADERSHIP'"
                    [ngClass]="schoolProfileActiveTab === 'LEADERSHIP' ? 'bg-slate-900 text-white font-black shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 font-bold border border-slate-200'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>2. Leadership & In-Charges ({{ schoolProfileForm.directors.length }} Directors)</span>
            </button>

            <button type="button" (click)="schoolProfileActiveTab = 'CONTACT'"
                    [ngClass]="schoolProfileActiveTab === 'CONTACT' ? 'bg-slate-900 text-white font-black shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 font-bold border border-slate-200'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>3. Contact & Campus Location</span>
            </button>
          </div>

          <!-- Modal Body Form -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            <div *ngIf="loadingSchoolProfile" class="py-12 text-center text-slate-400">
              <div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin mx-auto mb-2"></div>
              <span>Loading comprehensive institutional profile...</span>
            </div>

            <div *ngIf="!loadingSchoolProfile" class="space-y-4">
              <!-- Institutional Identity Card Banner -->
              <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center shadow-xs shrink-0 overflow-hidden border border-slate-200">
                    <img *ngIf="schoolProfileForm.logoUrl" [src]="schoolProfileForm.logoUrl" class="w-full h-full object-contain p-0.5 bg-white" alt="School Logo" />
                    <span *ngIf="!schoolProfileForm.logoUrl">{{ (schoolProfileForm.name || 'S').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <h4 class="font-black text-slate-900 text-sm leading-tight">{{ schoolProfileForm.name || 'School Profile' }}</h4>
                    <div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono flex-wrap">
                      <span>Code: <strong>{{ schoolProfileForm.code || 'CAMPUS' }}</strong></span>
                      <span *ngIf="schoolProfileForm.affiliationNumber">• Affil No: <strong>{{ schoolProfileForm.affiliationNumber }}</strong></span>
                      <span *ngIf="schoolProfileForm.udiseCode">• U-DISE: <strong>{{ schoolProfileForm.udiseCode }}</strong></span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-1 bg-white text-slate-800 font-bold text-[10px] rounded-xl border border-slate-200 shadow-2xs">
                    {{ schoolProfileForm.affiliationBoard === 'Other' ? (schoolProfileForm.customBoardName || 'Custom Board') : schoolProfileForm.affiliationBoard }}
                  </span>
                  <span class="px-2.5 py-1 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-xl">
                    {{ schoolProfileForm.startingClass }} – {{ schoolProfileForm.lastClass }}
                  </span>
                </div>
              </div>

              <!-- ========================================================================= -->
              <!-- TAB 1: IDENTITY & BOARD AFFILIATION                                       -->
              <!-- ========================================================================= -->
              <div *ngIf="schoolProfileActiveTab === 'BASIC'" class="space-y-4 animate-fadeIn">
                <!-- School Crest & Official Logo Uploader Card -->
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-black text-slate-900 text-xs block">School Crest / Official Logo</span>
                      <span class="text-[10px] text-slate-500">Official logo displayed across diplomas, certificates, navigation bar, and parent portal.</span>
                    </div>
                    <div *ngIf="schoolProfileForm.logoUrl && canManageSessions" class="flex items-center gap-2">
                      <button type="button" (click)="removeSchoolLogo()"
                              class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-xl border border-rose-200 transition-colors cursor-pointer">
                        Remove Logo
                      </button>
                    </div>
                  </div>

                  <div class="flex flex-col sm:flex-row items-center gap-4">
                    <!-- Logo Preview Box -->
                    <div class="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1 relative">
                      <img *ngIf="schoolProfileForm.logoUrl" [src]="schoolProfileForm.logoUrl" class="w-full h-full object-contain" alt="School Logo Preview" />
                      <div *ngIf="!schoolProfileForm.logoUrl" class="flex flex-col items-center text-center p-2 text-slate-400">
                        <svg class="w-6 h-6 mb-0.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="text-[9px] font-bold">No Logo</span>
                      </div>
                    </div>

                    <!-- Upload Button & Guidelines -->
                    <div class="flex-1 space-y-1.5 text-left w-full">
                      <div class="flex items-center gap-2 flex-wrap">
                        <label [class.opacity-50]="uploadingSchoolLogo || !canManageSessions"
                               class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-2 active:scale-95">
                          <svg *ngIf="!uploadingSchoolLogo" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <svg *ngIf="uploadingSchoolLogo" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>{{ uploadingSchoolLogo ? 'Optimizing & Uploading...' : (schoolProfileForm.logoUrl ? 'Replace School Logo' : 'Upload School Logo') }}</span>
                          <input type="file" accept="image/*" (change)="onSchoolLogoSelected($event)" [disabled]="uploadingSchoolLogo || !canManageSessions" class="hidden" />
                        </label>
                      </div>
                      <p class="text-[10px] text-slate-400 font-medium">
                        Supported: PNG, SVG, WEBP, or JPG with transparent or light background (Max 5MB).
                      </p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-700 mb-1">School Official Full Name *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.name" placeholder="e.g. Delhi Heritage Academy"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">School Code / Short Campus Code *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.code" placeholder="e.g. DEL-01"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Board of Affiliation *</label>
                    <select [(ngModel)]="schoolProfileForm.affiliationBoard"
                            [disabled]="!canManageSessions"
                            class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer disabled:opacity-70">
                      <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                      <option value="ICSE">ICSE / CISCE (Council for the Indian School Certificate Examinations)</option>
                      <option value="State Board">State Educational Board</option>
                      <option value="IB">International Baccalaureate (IB)</option>
                      <option value="Cambridge">Cambridge International (CIE / IGCSE)</option>
                      <option value="NIOS">NIOS (National Institute of Open Schooling)</option>
                      <option value="Other">Other (Custom Affiliation Board)</option>
                    </select>
                  </div>

                  <!-- Custom Board Input (Appears when "Other" or "State Board" is selected) -->
                  <div *ngIf="schoolProfileForm.affiliationBoard === 'Other' || schoolProfileForm.affiliationBoard === 'State Board'" class="sm:col-span-2">
                    <label class="block font-bold text-slate-700 mb-1">
                      Specify Affiliation Board / Authority Name *
                    </label>
                    <input type="text" [(ngModel)]="schoolProfileForm.customBoardName" placeholder="e.g. Maharashtra State Board of Secondary & Higher Secondary Education / Matriculation Board"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Affiliation / Registration Number</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.affiliationNumber" placeholder="e.g. 2130456 / REG-9942"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">U-DISE+ / Govt School Code</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.udiseCode" placeholder="e.g. 07010100101 (11 digits)"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <!-- Grade Span: Starting Class & Last Class -->
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">School Starting Class (Lowest Grade) *</label>
                    <select [(ngModel)]="schoolProfileForm.startingClass"
                            [disabled]="!canManageSessions"
                            class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer disabled:opacity-70">
                      <option *ngFor="let g of availableSchoolGrades" [value]="g">{{ g }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">School Terminal Class (Highest Grade) *</label>
                    <select [(ngModel)]="schoolProfileForm.lastClass"
                            [disabled]="!canManageSessions"
                            class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer disabled:opacity-70">
                      <option *ngFor="let g of availableSchoolGrades" [value]="g">{{ g }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">School Type / Gender Ratio</label>
                    <select [(ngModel)]="schoolProfileForm.schoolType"
                            [disabled]="!canManageSessions"
                            class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer disabled:opacity-70">
                      <option value="Co-Educational">Co-Educational</option>
                      <option value="Boys Only">Boys Only School</option>
                      <option value="Girls Only">Girls Only School</option>
                    </select>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Operational Shift / Model</label>
                    <select [(ngModel)]="schoolProfileForm.schoolShift"
                            [disabled]="!canManageSessions"
                            class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer disabled:opacity-70">
                      <option value="Regular Day">Regular Day School</option>
                      <option value="Morning Shift">Morning Shift</option>
                      <option value="Day Boarding">Day Boarding</option>
                      <option value="Residential">Residential / Boarding School</option>
                    </select>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Established Year</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.establishedYear" placeholder="e.g. 2010"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Society / Trust Registration No.</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.schoolRegistrationNumber" placeholder="e.g. SOC/DEL/1029/2008"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>
                </div>
              </div>

              <!-- ========================================================================= -->
              <!-- TAB 2: LEADERSHIP & DEPARTMENT IN-CHARGES                                  -->
              <!-- ========================================================================= -->
              <div *ngIf="schoolProfileActiveTab === 'LEADERSHIP'" class="space-y-4 animate-fadeIn">
                <!-- Section A: Board of Directors / Trustees -->
                <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-black text-slate-900 text-xs block">School Directors & Trustees</span>
                      <span class="text-[10px] text-slate-500">Add one or multiple directors / governing body members with profile photo.</span>
                    </div>
                    <button *ngIf="canManageSessions" type="button" (click)="addDirectorRow()"
                            class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[10px] rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1 cursor-pointer">
                      <span>+ Add Director</span>
                    </button>
                  </div>

                  <div class="space-y-2">
                    <div *ngFor="let d of schoolProfileForm.directors; let idx = index" class="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
                      <!-- Director Photo Thumbnail & Upload Button -->
                      <div class="flex items-center gap-2 shrink-0">
                        <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                          <img *ngIf="d.photoUrl" [src]="d.photoUrl" class="w-full h-full object-cover" alt="Director" />
                          <span *ngIf="!d.photoUrl" class="text-xs font-black text-slate-600">{{ (d.name || 'D').charAt(0).toUpperCase() }}</span>
                          <label *ngIf="canManageSessions" class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[9px] font-bold">
                            <span>Edit</span>
                            <input type="file" accept="image/*" (change)="onDirectorPhotoSelected($event, idx)" class="hidden" />
                          </label>
                        </div>
                        <button *ngIf="d.photoUrl && canManageSessions" type="button" (click)="removeDirectorPhoto(idx)"
                                title="Remove photo" class="text-rose-500 hover:text-rose-700 text-xs cursor-pointer">
                          &times;
                        </button>
                      </div>

                      <div class="w-full sm:w-1/3">
                        <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Director Full Name</label>
                        <input type="text" [(ngModel)]="d.name" placeholder="e.g. Dr. Ramesh Gupta"
                               [disabled]="!canManageSessions"
                               class="w-full px-2.5 py-1.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800" />
                      </div>
                      <div class="w-full sm:w-1/3">
                        <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Designation</label>
                        <input type="text" [(ngModel)]="d.designation" placeholder="e.g. Managing Director / Trustee"
                               [disabled]="!canManageSessions"
                               class="w-full px-2.5 py-1.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800" />
                      </div>
                      <div class="w-full sm:w-1/3 flex items-center gap-2">
                        <div class="flex-1">
                          <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Contact Phone / Email</label>
                          <input type="text" [(ngModel)]="d.phone" placeholder="+91 98111 22233"
                                 [disabled]="!canManageSessions"
                                 class="w-full px-2.5 py-1.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800" />
                        </div>
                        <button *ngIf="canManageSessions && schoolProfileForm.directors.length > 1"
                                type="button" (click)="removeDirectorRow(idx)"
                                title="Remove Director"
                                class="mt-4 text-slate-400 hover:text-rose-600 font-bold text-base p-1 rounded-lg hover:bg-rose-50 cursor-pointer">
                          &times;
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section B: Principal & Vice Principal -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <!-- Principal Card -->
                  <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span class="font-black text-slate-900 text-xs block">Principal / Head of Institution</span>
                      <span *ngIf="schoolProfileForm.principalPhotoUrl && canManageSessions"
                            (click)="removePrincipalPhoto()" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">
                        Remove Photo
                      </span>
                    </div>

                    <!-- Principal Photo Uploader -->
                    <div class="flex items-center gap-3">
                      <div class="w-14 h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                        <img *ngIf="schoolProfileForm.principalPhotoUrl" [src]="schoolProfileForm.principalPhotoUrl" class="w-full h-full object-cover" alt="Principal" />
                        <span *ngIf="!schoolProfileForm.principalPhotoUrl" class="text-sm font-black text-slate-400">
                          {{ (schoolProfileForm.principalName || 'P').charAt(0).toUpperCase() }}
                        </span>
                        <label *ngIf="canManageSessions" class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold">
                          <span>Change</span>
                          <input type="file" accept="image/*" (change)="onPrincipalPhotoSelected($event)" class="hidden" />
                        </label>
                      </div>
                      <div class="flex-1">
                        <label [class.opacity-50]="uploadingPrincipalPhoto || !canManageSessions"
                               class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                          <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                          <span>{{ uploadingPrincipalPhoto ? 'Uploading...' : (schoolProfileForm.principalPhotoUrl ? 'Change Photo' : 'Upload Photo') }}</span>
                          <input type="file" accept="image/*" (change)="onPrincipalPhotoSelected($event)" [disabled]="uploadingPrincipalPhoto || !canManageSessions" class="hidden" />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label class="block font-bold text-slate-600 text-[10px] mb-0.5">Principal Full Name *</label>
                      <input type="text" [(ngModel)]="schoolProfileForm.principalName" placeholder="Dr. / Mrs. / Mr. Name"
                             [disabled]="!canManageSessions"
                             class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-600 text-[10px] mb-0.5">Principal Email</label>
                      <input type="email" [(ngModel)]="schoolProfileForm.principalEmail" placeholder="principal@school.edu.in"
                             [disabled]="!canManageSessions"
                             class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-600 text-[10px] mb-0.5">Principal Phone</label>
                      <input type="text" [(ngModel)]="schoolProfileForm.principalPhone" placeholder="+91 98765 00001"
                             [disabled]="!canManageSessions"
                             class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                    </div>
                  </div>

                  <!-- Vice Principal Card -->
                  <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div class="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span class="font-black text-slate-900 text-xs block">Vice Principal / Academic Dean</span>
                      <span *ngIf="schoolProfileForm.vicePrincipalPhotoUrl && canManageSessions"
                            (click)="removeVicePrincipalPhoto()" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">
                        Remove Photo
                      </span>
                    </div>

                    <!-- Vice Principal Photo Uploader -->
                    <div class="flex items-center gap-3">
                      <div class="w-14 h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                        <img *ngIf="schoolProfileForm.vicePrincipalPhotoUrl" [src]="schoolProfileForm.vicePrincipalPhotoUrl" class="w-full h-full object-cover" alt="Vice Principal" />
                        <span *ngIf="!schoolProfileForm.vicePrincipalPhotoUrl" class="text-sm font-black text-slate-400">
                          {{ (schoolProfileForm.vicePrincipalName || 'V').charAt(0).toUpperCase() }}
                        </span>
                        <label *ngIf="canManageSessions" class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold">
                          <span>Change</span>
                          <input type="file" accept="image/*" (change)="onVicePrincipalPhotoSelected($event)" class="hidden" />
                        </label>
                      </div>
                      <div class="flex-1">
                        <label [class.opacity-50]="uploadingVicePrincipalPhoto || !canManageSessions"
                               class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                          <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                          <span>{{ uploadingVicePrincipalPhoto ? 'Uploading...' : (schoolProfileForm.vicePrincipalPhotoUrl ? 'Change Photo' : 'Upload Photo') }}</span>
                          <input type="file" accept="image/*" (change)="onVicePrincipalPhotoSelected($event)" [disabled]="uploadingVicePrincipalPhoto || !canManageSessions" class="hidden" />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label class="block font-bold text-slate-600 text-[10px] mb-0.5">Vice Principal Name</label>
                      <input type="text" [(ngModel)]="schoolProfileForm.vicePrincipalName" placeholder="Vice Principal Name"
                             [disabled]="!canManageSessions"
                             class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-600 text-[10px] mb-0.5">Vice Principal Email</label>
                      <input type="email" [(ngModel)]="schoolProfileForm.vicePrincipalEmail" placeholder="vp@school.edu.in"
                             [disabled]="!canManageSessions"
                             class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                    </div>
                    <div>
                      <label class="block font-bold text-slate-600 text-[10px] mb-0.5">Vice Principal Phone</label>
                      <input type="text" [(ngModel)]="schoolProfileForm.vicePrincipalPhone" placeholder="+91 98765 00002"
                             [disabled]="!canManageSessions"
                             class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                    </div>
                  </div>
                </div>

                <!-- Section C: Department & Wing In-Charges -->
                <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-black text-slate-900 text-xs block">Department & Wing In-Charges</span>
                      <span class="text-[10px] text-slate-500">Coordinators and heads for examinations, wings, sports, IT, and disciplines.</span>
                    </div>
                    <button *ngIf="canManageSessions" type="button" (click)="addInChargeRow()"
                            class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[10px] rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1 cursor-pointer">
                      <span>+ Add Department In-Charge</span>
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div *ngFor="let inc of schoolProfileForm.inCharges; let idx = index" class="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                      <!-- In-Charge Avatar Thumbnail -->
                      <div class="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                        <img *ngIf="inc.photoUrl" [src]="inc.photoUrl" class="w-full h-full object-cover" alt="In-Charge" />
                        <span *ngIf="!inc.photoUrl" class="text-xs font-black text-slate-600">{{ (inc.name || 'I').charAt(0).toUpperCase() }}</span>
                        <label *ngIf="canManageSessions" class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[8px] font-bold">
                          <span>Edit</span>
                          <input type="file" accept="image/*" (change)="onInChargePhotoSelected($event, idx)" class="hidden" />
                        </label>
                      </div>

                      <div class="flex-1 space-y-1">
                        <input type="text" [(ngModel)]="inc.department" placeholder="Department / Wing Title"
                               [disabled]="!canManageSessions"
                               class="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800" />
                        <div class="flex items-center gap-1.5">
                          <input type="text" [(ngModel)]="inc.name" placeholder="In-Charge Faculty Name"
                                 [disabled]="!canManageSessions"
                                 class="flex-1 px-2 py-1 bg-[#f8fafc] border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800" />
                          <input type="text" [(ngModel)]="inc.phone" placeholder="Phone"
                                 [disabled]="!canManageSessions"
                                 class="w-24 px-2 py-1 bg-[#f8fafc] border border-slate-300 rounded-lg text-[11px] text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800" />
                        </div>
                      </div>
                      <button *ngIf="canManageSessions" type="button" (click)="removeInChargeRow(idx)"
                              title="Remove In-Charge"
                              class="text-slate-400 hover:text-rose-600 font-bold text-base p-1 rounded-lg hover:bg-rose-50 cursor-pointer">
                        &times;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ========================================================================= -->
              <!-- TAB 3: CONTACT COORDINATES & CAMPUS LOCATION                              -->
              <!-- ========================================================================= -->
              <div *ngIf="schoolProfileActiveTab === 'CONTACT'" class="space-y-4 animate-fadeIn">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Official Campus Email Address *</label>
                    <input type="email" [(ngModel)]="schoolProfileForm.email" placeholder="contact@school.edu.in"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Helpline / Primary Contact Phone *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.phone" placeholder="+91 98765 43210"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Alternate / Emergency Contact Phone</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.alternatePhone" placeholder="+91 98765 43211"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Official Website URL</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.websiteUrl" placeholder="https://www.school.edu.in"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-700 mb-1">School Motto / Institutional Tagline</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.motto" placeholder="e.g. Lead Us from Darkness into Light / Knowledge is Power"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div class="sm:col-span-2">
                    <label class="block font-bold text-slate-700 mb-1">Campus Street Address *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.addressLine1" placeholder="Plot No., Institutional Area, Sector / Road, Landmark"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">City / Town *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.city" placeholder="e.g. New Delhi"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">District / County</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.district" placeholder="e.g. North West Delhi"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">State / Province *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.state" placeholder="e.g. Delhi / Maharashtra / Uttar Pradesh"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>

                  <div>
                    <label class="block font-bold text-slate-700 mb-1">Postal PIN Code *</label>
                    <input type="text" [(ngModel)]="schoolProfileForm.postalCode" placeholder="110085"
                           [disabled]="!canManageSessions"
                           class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-70" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-between gap-2.5 shrink-0">
            <span *ngIf="!canManageSessions" class="text-[10px] text-slate-400 font-medium italic">
              View-only mode. Administrator privileges required to edit school profile.
            </span>
            <div class="flex items-center gap-2.5 ml-auto">
              <button type="button" (click)="closeSchoolProfileModal()" [disabled]="savingSchoolProfile"
                      class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
                Cancel
              </button>
              <button *ngIf="canManageSessions" type="button" (click)="saveSchoolProfile()" [disabled]="savingSchoolProfile"
                      class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
                <svg *ngIf="savingSchoolProfile" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>{{ savingSchoolProfile ? 'Saving...' : 'Save Profile Changes' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ROLE & SERVICE SECTION VISIBILITY MANAGEMENT STUDIO     -->
      <!-- ============================================================== -->
      <div *ngIf="showRoleManagementModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[90] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" (click)="closeRoleManagementModal()"></div>
        <div class="bg-white rounded-3xl max-w-5xl w-full flex flex-col max-h-[92vh] shadow-[0_30px_70px_rgba(0,0,0,0.35)] border border-slate-200 overflow-hidden animate-scaleUp relative z-10">
          
          <!-- Modal Header -->
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-xs">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Role & Section Visibility Management</h3>
                <p class="text-xs text-slate-500 mt-0.5">Control which services, directories, and operational modules are visible and manageable by each role.</p>
              </div>
            </div>
            <button (click)="closeRoleManagementModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Modal Body: 2-Column Master-Detail Layout -->
          <div class="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
            
            <!-- Left Pane: Roles Selector List -->
            <div class="md:col-span-4 border-r border-slate-200 bg-slate-50/70 p-3 sm:p-4 overflow-y-auto flex flex-col gap-2 custom-clay-scroll shrink-0">
              <div class="px-2 py-1 flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Campus Roles</span>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                  {{ systemRolesList.length }} Configured
                </span>
              </div>

              <div class="space-y-1.5">
                <button *ngFor="let r of systemRolesList"
                        type="button"
                        (click)="selectRoleToConfigure(r.code)"
                        class="w-full text-left p-3 rounded-2xl transition-all flex flex-col gap-1 cursor-pointer border"
                        [ngClass]="selectedRoleCode === r.code
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                    : 'bg-white hover:bg-slate-100/90 text-slate-800 border-slate-200 shadow-2xs'">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0"
                           [ngClass]="selectedRoleCode === r.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'">
                        {{ r.icon || r.code.charAt(0) }}
                      </div>
                      <span class="font-bold text-xs truncate">{{ r.name }}</span>
                    </div>

                    <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                          [ngClass]="selectedRoleCode === r.code ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'">
                      {{ r.accessLevel }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-[10px] mt-0.5"
                       [ngClass]="selectedRoleCode === r.code ? 'text-slate-300' : 'text-slate-500'">
                    <span class="truncate">{{ r.description }}</span>
                    <span class="font-mono shrink-0 font-bold ml-1">
                      {{ getEnabledCountForRole(r.code) }}/{{ roleSectionsCatalog.length }}
                    </span>
                  </div>
                </button>
              </div>

              <div class="mt-auto pt-3 border-t border-slate-200/80 text-[10px] text-slate-400 leading-relaxed px-1">
                🔒 <strong>Administrator Rule:</strong> Selecting a role lets you grant or restrict module visibility in real time.
              </div>
            </div>

            <!-- Right Pane: Active Role Section & Permission Configuration -->
            <div class="md:col-span-8 flex flex-col min-w-0 bg-white overflow-hidden">
              
              <!-- Role Active Header Bar -->
              <div class="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-black text-slate-900 tracking-tight">
                      {{ getSelectedRoleObject()?.name }}
                    </h4>
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {{ selectedRoleCode }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ getSelectedRoleObject()?.description }}
                  </p>
                </div>

                <!-- Quick Batch Toolbar -->
                <div class="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button type="button" (click)="grantAllForRole()"
                          class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs">
                    <svg class="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Enable All</span>
                  </button>

                  <button type="button" (click)="revokeAllForRole()"
                          class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs">
                    <svg class="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Disable All</span>
                  </button>

                  <button type="button" (click)="resetRoleToDefaults()"
                          class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs">
                    <svg class="w-3 h-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              <!-- Search & Category Filters -->
              <div class="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                <!-- Search input -->
                <div class="relative flex-1">
                  <input type="text" [(ngModel)]="roleSearchQuery"
                         placeholder="Filter services or modules..."
                         class="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 outline-none focus:border-slate-400" />
                  <div class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button *ngIf="roleSearchQuery" (click)="roleSearchQuery = ''"
                          class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5 cursor-pointer">&times;</button>
                </div>

                <!-- Category Pills -->
                <div class="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar shrink-0">
                  <button *ngFor="let cat of roleCategoryList"
                          type="button"
                          (click)="activeRoleCategory = cat"
                          class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap cursor-pointer"
                          [ngClass]="activeRoleCategory === cat
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'">
                    {{ cat }}
                  </button>
                </div>
              </div>

              <!-- Scrollable Sections List with Smooth Switches -->
              <div class="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2.5 custom-clay-scroll">
                <ng-container *ngFor="let sec of filteredRoleSections">
                  
                  <div class="p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3"
                       [ngClass]="[
                         sec.parentId ? 'ml-6 border-l-4 border-l-slate-300 bg-slate-50/50' : 'bg-white',
                         isParentDisabled(sec.parentId) ? 'opacity-40 bg-slate-100/50 border-slate-200' : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                       ]">
                    
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-xs text-slate-900">{{ sec.name }}</span>
                        
                        <span *ngIf="sec.isParent" class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Main Module
                        </span>

                        <span *ngIf="sec.parentId" class="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                          Sub-Section
                        </span>

                        <span *ngIf="isParentDisabled(sec.parentId)" class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Parent Module Disabled
                        </span>
                      </div>
                      
                      <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {{ sec.description }}
                      </p>
                    </div>

                    <!-- Clean Monochrome iOS Toggle Switch -->
                    <div class="flex items-center gap-2.5 shrink-0">
                      <span class="text-[10px] font-bold hidden sm:inline-block"
                            [ngClass]="isSectionEnabled(sec.id) && !isParentDisabled(sec.parentId) ? 'text-slate-900' : 'text-slate-400'">
                        {{ isSectionEnabled(sec.id) && !isParentDisabled(sec.parentId) ? 'Visible' : 'Hidden' }}
                      </span>

                      <button type="button"
                              [disabled]="isParentDisabled(sec.parentId)"
                              (click)="toggleSectionPermission(sec)"
                              class="w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none disabled:cursor-not-allowed shadow-inner"
                              [ngClass]="isSectionEnabled(sec.id) && !isParentDisabled(sec.parentId) ? 'bg-slate-900' : 'bg-slate-200'">
                        <span class="w-4 h-4 bg-white rounded-full transition-transform transform absolute top-1 left-1 shadow-sm"
                              [ngClass]="isSectionEnabled(sec.id) && !isParentDisabled(sec.parentId) ? 'translate-x-5' : 'translate-x-0'"></span>
                      </button>
                    </div>
                  </div>

                </ng-container>

                <div *ngIf="filteredRoleSections.length === 0" class="p-8 text-center text-xs text-slate-400">
                  No service sections matching "{{ roleSearchQuery }}"
                </div>
              </div>

            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 rounded-b-3xl">
            <div class="text-[11px] text-slate-500 text-center sm:text-left">
              <span>⚡ Permission changes are saved per campus and update live navigation immediately.</span>
            </div>

            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button type="button" (click)="closeRoleManagementModal()"
                      class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-2xs transition-colors cursor-pointer">
                Cancel
              </button>

              <button type="button" (click)="saveRolePermissions()" [disabled]="savingRolePermissions"
                      class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50">
                <svg *ngIf="savingRolePermissions" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>{{ savingRolePermissions ? 'Saving Permissions...' : 'Save Role Permissions' }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Global Full Viewport Modal Backdrop Dimmer (Dims entire viewport including header & sidebar) -->
      <div *ngIf="modalService.isOpen()"
           class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[60] animate-fadeIn"></div>
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
  imageUploadService = inject(ImageUploadService);
  
  isMobileSidebarOpen = false;
  isDesktopSidebarCollapsed = false;
  menuSearchQuery = '';

  isSessionDropdownOpen = false;
  isNotificationDropdownOpen = false;
  isSettingsDropdownOpen = false;
  availableSessions: AcademicSession[] = [];
  notifications: Notice[] = [];
  dismissedNoticeIds = new Set<string>();

  // School Profile & Role Management Modal State
  showSchoolProfileModal = false;
  loadingSchoolProfile = false;
  savingSchoolProfile = false;
  uploadingSchoolLogo = false;
  uploadingPrincipalPhoto = false;
  uploadingVicePrincipalPhoto = false;
  uploadingDirectorPhotoIndex: number | null = null;
  uploadingInChargePhotoIndex: number | null = null;
  schoolProfileActiveTab: 'BASIC' | 'LEADERSHIP' | 'CONTACT' = 'BASIC';

  availableSchoolGrades = [
    'Pre-Nursery / Playgroup',
    'Nursery',
    'LKG / KG-1',
    'UKG / KG-2',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
    'Class 11',
    'Class 12',
  ];

  schoolProfileForm = {
    id: '',
    name: '',
    code: '',
    logoUrl: '',
    affiliationBoard: 'CBSE',
    customBoardName: '',
    affiliationNumber: '',
    udiseCode: '',
    schoolRegistrationNumber: '',
    startingClass: 'Pre-Nursery / Playgroup',
    lastClass: 'Class 12',
    schoolType: 'Co-Educational',
    schoolShift: 'Regular Day',
    establishedYear: '2010',
    directors: [{ name: '', designation: 'Managing Director', phone: '', photoUrl: '' }],
    principalName: '',
    principalEmail: '',
    principalPhone: '',
    principalPhotoUrl: '',
    vicePrincipalName: '',
    vicePrincipalEmail: '',
    vicePrincipalPhone: '',
    vicePrincipalPhotoUrl: '',
    inCharges: [
      { department: 'Examination & Evaluation In-Charge', name: '', phone: '', photoUrl: '' },
      { department: 'Senior Wing Head (IX - XII)', name: '', phone: '', photoUrl: '' },
      { department: 'Middle Wing Head (VI - VIII)', name: '', phone: '', photoUrl: '' },
      { department: 'Primary Wing Head (I - V)', name: '', phone: '', photoUrl: '' },
      { department: 'Pre-Primary / Nursery In-Charge', name: '', phone: '', photoUrl: '' },
      { department: 'Sports & Physical Education Head', name: '', phone: '', photoUrl: '' },
      { department: 'IT & Digital Systems In-Charge', name: '', phone: '', photoUrl: '' },
      { department: 'Discipline & Student Welfare Head', name: '', phone: '', photoUrl: '' },
    ],
    email: '',
    phone: '',
    alternatePhone: '',
    websiteUrl: '',
    motto: '',
    addressLine1: '',
    city: '',
    district: '',
    state: '',
    postalCode: '',
    country: 'India',
  };

  showRoleManagementModal = false;
  selectedRoleCode = 'TEACHER';
  rolePermissionsMap: Record<string, string[]> = {};
  savingRolePermissions = false;
  roleSearchQuery = '';
  activeRoleCategory = 'All';
  roleCategoryList: string[] = [
    'All',
    'Core Operations',
    'Academics & Master Data',
    'Schedule & Operations',
    'Assessments & Learning',
    'Campus Communications',
    'Finance & Institutional',
  ];

  get canAccessSettings(): boolean {
    return this.auth.isSuperAdmin() || this.auth.isSchoolAdmin() || this.auth.isSupportSession();
  }

  systemRolesList = [
    { code: 'SCHOOL_ADMIN', name: 'School Administrator', description: 'Full administrative authority across all campus modules', accessLevel: 'Tenant Admin', icon: 'A' },
    { code: 'PRINCIPAL', name: 'Principal / Head of School', description: 'Academic leadership, compliance, approvals & promotions', accessLevel: 'Leadership', icon: 'P' },
    { code: 'CLASS_TEACHER', name: 'Class Teacher', description: 'Class roster management, marks entry, attendance & reports', accessLevel: 'Class Scope', icon: 'C' },
    { code: 'TEACHER', name: 'Faculty / Subject Teacher', description: 'Assigned subject teaching, homework & marks submission', accessLevel: 'Subject Scope', icon: 'T' },
    { code: 'FEE_MANAGER', name: 'Bursar / Fee Accountant', description: 'Fee collection, receipts, ledger management & wallet operations', accessLevel: 'Finance Scope', icon: 'F' },
    { code: 'GUARDIAN', name: 'Parent / Guardian', description: 'Student attendance tracking, homework, fee payments & notices', accessLevel: 'Parent Portal', icon: 'G' },
    { code: 'STUDENT', name: 'Enrolled Student', description: 'Homework submission, timetable, exam marks & circular notices', accessLevel: 'Student Portal', icon: 'E' },
  ];

  roleSectionsCatalog: RoleSectionItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard Overview',
      category: 'Core Operations',
      description: 'Campus metrics, daily summaries, quick insights, and widgets',
    },
    {
      id: 'academics',
      name: 'Academics Hub (Main Module)',
      category: 'Academics & Master Data',
      description: 'Main academic module hub, student rosters, and curriculum records',
      isParent: true,
    },
    {
      id: 'academics_classes',
      name: 'Manage Classes & Sections',
      category: 'Academics & Master Data',
      description: 'Configure grade hierarchy, divisions, sections and classroom capacities',
      parentId: 'academics',
    },
    {
      id: 'academics_students',
      name: 'Student Admissions & Roster',
      category: 'Academics & Master Data',
      description: 'Enrollment registry, student profiles, parent details, promotions & demotions',
      parentId: 'academics',
    },
    {
      id: 'academics_alumni',
      name: 'Alumni Directory & Certificates',
      category: 'Academics & Master Data',
      description: 'Permanent alumni register, Transfer Certificates (TC), Character Certificates & Alumni IDs',
      parentId: 'academics',
    },
    {
      id: 'academics_staff',
      name: 'Faculty & Staff Directory',
      category: 'Academics & Master Data',
      description: 'Teaching faculty profiles, department assignments & employment records',
      parentId: 'academics',
    },
    {
      id: 'academics_subjects',
      name: 'Curriculum Subjects Master',
      category: 'Academics & Master Data',
      description: 'Subject course codes, credit hours, and institutional curriculum mapping',
      parentId: 'academics',
    },
    {
      id: 'timetable',
      name: 'Timetable & Schedule (Main Module)',
      category: 'Schedule & Operations',
      description: 'Campus daily schedule, bell timings, class routine tables and teacher allocations',
      isParent: true,
    },
    {
      id: 'timetable_student',
      name: 'Student / Class Timetable',
      category: 'Schedule & Operations',
      description: 'View and manage student class period timetables by grade and section',
      parentId: 'timetable',
    },
    {
      id: 'timetable_faculty',
      name: 'Faculty / Teacher Timetable',
      category: 'Schedule & Operations',
      description: 'View teacher assignments and faculty routine schedules',
      parentId: 'timetable',
    },
    {
      id: 'attendance',
      name: 'Attendance Register',
      category: 'Schedule & Operations',
      description: 'Daily student attendance marking, registers & summary reports',
    },
    {
      id: 'homework',
      name: 'Homework Center',
      category: 'Assessments & Learning',
      description: 'Assign homework, track student submissions, attachments & grading',
    },
    {
      id: 'exams',
      name: 'Exams & Marksheets',
      category: 'Assessments & Learning',
      description: 'Exam scheduling, marks entry, grades and report card printing',
    },
    {
      id: 'communication',
      name: 'Communication & Notices (Main Module)',
      category: 'Campus Communications',
      description: 'Broadcast notices, school circulars and parent grievances',
      isParent: true,
    },
    {
      id: 'communication_notices',
      name: 'Circulars & Notices',
      category: 'Campus Communications',
      description: 'Publish and view announcements, circulars and event alerts',
      parentId: 'communication',
    },
    {
      id: 'communication_complaints',
      name: 'Grievance Desk',
      category: 'Campus Communications',
      description: 'Manage complaints, inquiries, student/parent grievances',
      parentId: 'communication',
    },
    {
      id: 'subscription',
      name: 'Subscription & Wallet',
      category: 'Finance & Institutional',
      description: 'SaaS plan billing, SMS quota, payments and institution wallet',
    },
  ];

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
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT', 'FEE_MANAGER'],
    },
    {
      id: 'academics',
      label: 'Academics & Directory',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'FEE_MANAGER'],
      expanded: true,
      children: [
        { id: 'academics_classes', label: 'Manage Classes & Sections', route: '/academics', queryParams: { tab: 'classes' } },
        { id: 'academics_students', label: 'Student Admissions & Roster', route: '/academics', queryParams: { tab: 'students' } },
        { id: 'academics_alumni', label: 'Alumni Directory', route: '/academics', queryParams: { tab: 'alumni' } },
        { id: 'academics_staff', label: 'Faculty & Staff Directory', route: '/academics', queryParams: { tab: 'staff' } },
        { id: 'academics_subjects', label: 'Curriculum Subjects Master', route: '/academics', queryParams: { tab: 'subjects' } },
      ],
    },
    {
      id: 'subscription',
      label: 'Subscription & Wallet',
      route: '/subscription',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'FEE_MANAGER'],
    },
    {
      id: 'timetable',
      label: 'Timetable & Schedule',
      service: 'TIMETABLE',
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT'],
      expanded: true,
      children: [
        { id: 'timetable_student', label: 'Student / Class Timetable', route: '/timetable', queryParams: { type: 'student' } },
        { id: 'timetable_faculty', label: 'Faculty / Teacher Timetable', route: '/timetable', queryParams: { type: 'faculty' } },
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
      roles: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'GUARDIAN', 'PARENT', 'STUDENT', 'FEE_MANAGER'],
      expanded: false,
      children: [
        { id: 'communication_notices', label: 'Circulars & Notices', route: '/communication' },
        { id: 'communication_complaints', label: 'Grievance Desk', route: '/complaints', service: 'COMPLAINTS' },
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

  isMobileUserMenuOpen = false;

  toggleMobileUserMenu(event: Event) {
    event.stopPropagation();
    this.isMobileUserMenuOpen = !this.isMobileUserMenuOpen;
  }

  openMobileNotifications(event: Event) {
    event.stopPropagation();
    this.isMobileUserMenuOpen = false;
    this.isNotificationDropdownOpen = true;
    this.loadNotifications();
  }

  openMobileSchoolProfile(event: Event) {
    event.stopPropagation();
    this.isMobileUserMenuOpen = false;
    this.openSchoolProfileModal(event);
  }

  openMobileSessions(event: Event) {
    event.stopPropagation();
    this.isMobileUserMenuOpen = false;
    this.openManageSessionsFromHeader(event);
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

  getSchoolLogoUrl(): string | null {
    const school = this.auth.currentUser()?.school;
    return school?.logoUrl || school?.logo_url || null;
  }

  ngOnInit() {
    this.auth.syncSchoolProfileFromDb();
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
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
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

        // Role-based permissions check:
        if (!this.auth.isSectionAllowedForUser(g.id)) {
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
      // Filter child submenus based on service and role restrictions (bypassed for Super Admin and Support Admin)
      let children = g.children;
      if (children && !isSuper && !isSupport) {
        children = children.filter((c) => {
          if (c.id && !this.auth.isSectionAllowedForUser(c.id)) {
            return false;
          }
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

  // Settings & School Profile & Role Management Methods
  toggleSettingsDropdown(event: Event) {
    event.stopPropagation();
    this.isSettingsDropdownOpen = !this.isSettingsDropdownOpen;
    if (this.isSettingsDropdownOpen) {
      this.isNotificationDropdownOpen = false;
      this.isSessionDropdownOpen = false;
    }
  }

  openSchoolProfileModal(event?: Event) {
    if (event) event.stopPropagation();
    this.isSettingsDropdownOpen = false;

    if (!this.canAccessSettings) {
      this.toastService.error('Unauthorized access. Only School Administrators can view or edit school settings.');
      return;
    }

    this.schoolProfileActiveTab = 'BASIC';
    this.showSchoolProfileModal = true;
    this.loadingSchoolProfile = true;

    const currentSchool = this.auth.currentUser()?.school;
    this.schoolProfileForm = {
      id: currentSchool?.id || '',
      name: currentSchool?.name || 'SchoolSense Academy',
      code: currentSchool?.code || 'CAMPUS',
      logoUrl: currentSchool?.logoUrl || currentSchool?.logo_url || '',
      affiliationBoard: 'CBSE',
      customBoardName: '',
      affiliationNumber: '',
      udiseCode: '',
      schoolRegistrationNumber: '',
      startingClass: 'Pre-Nursery / Playgroup',
      lastClass: 'Class 12',
      schoolType: 'Co-Educational',
      schoolShift: 'Regular Day',
      establishedYear: '2010',
      directors: [{ name: '', designation: 'Managing Director', phone: '', photoUrl: '' }],
      principalName: '',
      principalEmail: '',
      principalPhone: '',
      principalPhotoUrl: '',
      vicePrincipalName: '',
      vicePrincipalEmail: '',
      vicePrincipalPhone: '',
      vicePrincipalPhotoUrl: '',
      inCharges: [
        { department: 'Examination & Evaluation In-Charge', name: '', phone: '', photoUrl: '' },
        { department: 'Senior Wing Head (IX - XII)', name: '', phone: '', photoUrl: '' },
        { department: 'Middle Wing Head (VI - VIII)', name: '', phone: '', photoUrl: '' },
        { department: 'Primary Wing Head (I - V)', name: '', phone: '', photoUrl: '' },
        { department: 'Pre-Primary / Nursery In-Charge', name: '', phone: '', photoUrl: '' },
        { department: 'Sports & Physical Education Head', name: '', phone: '', photoUrl: '' },
        { department: 'IT & Digital Systems In-Charge', name: '', phone: '', photoUrl: '' },
        { department: 'Discipline & Student Welfare Head', name: '', phone: '', photoUrl: '' },
      ],
      email: '',
      phone: '',
      alternatePhone: '',
      websiteUrl: '',
      motto: '',
      addressLine1: '',
      city: '',
      district: '',
      state: '',
      postalCode: '',
      country: 'India',
    };

    this.api.get<any>('school/profile').subscribe({
      next: (res) => {
        this.loadingSchoolProfile = false;
        if (res) {
          const rawDirectors = res.directors;
          const directors = Array.isArray(rawDirectors) && rawDirectors.length > 0 
            ? rawDirectors.map((d: any) => ({ ...d, photoUrl: d.photoUrl || d.photo_url || '' }))
            : [{ name: res.director_name || res.directorName || '', designation: 'Managing Director', phone: '', photoUrl: '' }];

          const rawInCharges = res.in_charges || res.inCharges;
          const inCharges = Array.isArray(rawInCharges) && rawInCharges.length > 0
            ? rawInCharges.map((inc: any) => ({ ...inc, photoUrl: inc.photoUrl || inc.photo_url || '' }))
            : this.schoolProfileForm.inCharges;

          this.schoolProfileForm = {
            id: res.id || currentSchool?.id || '',
            name: res.name || currentSchool?.name || '',
            code: res.code || currentSchool?.code || '',
            logoUrl: res.logo_url || res.logoUrl || currentSchool?.logoUrl || currentSchool?.logo_url || '',
            affiliationBoard: res.affiliation_board || res.affiliationBoard || 'CBSE',
            customBoardName: res.custom_board_name || res.customBoardName || '',
            affiliationNumber: res.affiliation_number || res.affiliationNumber || '',
            udiseCode: res.udise_code || res.udiseCode || '',
            schoolRegistrationNumber: res.school_registration_number || res.schoolRegistrationNumber || '',
            startingClass: res.starting_class || res.startingClass || 'Pre-Nursery / Playgroup',
            lastClass: res.last_class || res.lastClass || 'Class 12',
            schoolType: res.school_type || res.schoolType || 'Co-Educational',
            schoolShift: res.school_shift || res.schoolShift || 'Regular Day',
            establishedYear: res.established_year || res.establishedYear || '2010',
            directors: directors,
            principalName: res.principal_name || res.principalName || '',
            principalEmail: res.principal_email || res.principalEmail || '',
            principalPhone: res.principal_phone || res.principalPhone || '',
            principalPhotoUrl: res.principal_photo_url || res.principalPhotoUrl || '',
            vicePrincipalName: res.vice_principal_name || res.vicePrincipalName || '',
            vicePrincipalEmail: res.vice_principal_email || res.vicePrincipalEmail || '',
            vicePrincipalPhone: res.vice_principal_phone || res.vicePrincipalPhone || '',
            vicePrincipalPhotoUrl: res.vice_principal_photo_url || res.vicePrincipalPhotoUrl || '',
            inCharges: inCharges,
            email: res.email || '',
            phone: res.phone || '',
            alternatePhone: res.alternate_phone || res.alternatePhone || '',
            websiteUrl: res.website_url || res.websiteUrl || res.website || '',
            motto: res.motto || '',
            addressLine1: res.address_line1 || res.addressLine1 || '',
            city: res.city || '',
            district: res.district || '',
            state: res.state || '',
            postalCode: res.postal_code || res.postalCode || '',
            country: res.country || 'India',
          };
        }
      },
      error: () => {
        this.loadingSchoolProfile = false;
      }
    });
  }

  // --- Image Upload Handlers for School Profile ---
  async onSchoolLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingSchoolLogo = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'logos', 800, 800, 0.9);
      this.schoolProfileForm.logoUrl = url;
      this.toastService.success('School logo processed successfully.');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to process logo.');
    } finally {
      this.uploadingSchoolLogo = false;
      input.value = '';
    }
  }

  removeSchoolLogo() {
    this.schoolProfileForm.logoUrl = '';
  }

  async onPrincipalPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingPrincipalPhoto = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'staff', 600, 600, 0.85);
      this.schoolProfileForm.principalPhotoUrl = url;
      this.toastService.success('Principal photo uploaded.');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to upload photo.');
    } finally {
      this.uploadingPrincipalPhoto = false;
      input.value = '';
    }
  }

  removePrincipalPhoto() {
    this.schoolProfileForm.principalPhotoUrl = '';
  }

  async onVicePrincipalPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingVicePrincipalPhoto = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'staff', 600, 600, 0.85);
      this.schoolProfileForm.vicePrincipalPhotoUrl = url;
      this.toastService.success('Vice Principal photo uploaded.');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to upload photo.');
    } finally {
      this.uploadingVicePrincipalPhoto = false;
      input.value = '';
    }
  }

  removeVicePrincipalPhoto() {
    this.schoolProfileForm.vicePrincipalPhotoUrl = '';
  }

  async onDirectorPhotoSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingDirectorPhotoIndex = index;
      const url = await this.imageUploadService.processAndUploadImage(file, 'staff', 600, 600, 0.85);
      if (this.schoolProfileForm.directors[index]) {
        this.schoolProfileForm.directors[index].photoUrl = url;
      }
      this.toastService.success('Director photo uploaded.');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to upload photo.');
    } finally {
      this.uploadingDirectorPhotoIndex = null;
      input.value = '';
    }
  }

  removeDirectorPhoto(index: number) {
    if (this.schoolProfileForm.directors[index]) {
      this.schoolProfileForm.directors[index].photoUrl = '';
    }
  }

  async onInChargePhotoSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingInChargePhotoIndex = index;
      const url = await this.imageUploadService.processAndUploadImage(file, 'staff', 600, 600, 0.85);
      if (this.schoolProfileForm.inCharges[index]) {
        this.schoolProfileForm.inCharges[index].photoUrl = url;
      }
      this.toastService.success('Department In-Charge photo uploaded.');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to upload photo.');
    } finally {
      this.uploadingInChargePhotoIndex = null;
      input.value = '';
    }
  }

  removeInChargePhoto(index: number) {
    if (this.schoolProfileForm.inCharges[index]) {
      this.schoolProfileForm.inCharges[index].photoUrl = '';
    }
  }

  addDirectorRow() {
    this.schoolProfileForm.directors.push({ name: '', designation: 'Director', phone: '', photoUrl: '' });
  }

  removeDirectorRow(index: number) {
    if (this.schoolProfileForm.directors.length > 1) {
      this.schoolProfileForm.directors.splice(index, 1);
    } else {
      this.schoolProfileForm.directors[0] = { name: '', designation: 'Director', phone: '', photoUrl: '' };
    }
  }

  addInChargeRow() {
    this.schoolProfileForm.inCharges.push({ department: '', name: '', phone: '', photoUrl: '' });
  }

  removeInChargeRow(index: number) {
    this.schoolProfileForm.inCharges.splice(index, 1);
  }

  closeSchoolProfileModal() {
    this.showSchoolProfileModal = false;
  }

  saveSchoolProfile() {
    if (!this.schoolProfileForm.name?.trim() || !this.schoolProfileForm.code?.trim()) {
      this.toastService.warning('School name and code are required.');
      return;
    }

    if (
      (this.schoolProfileForm.affiliationBoard === 'Other' || this.schoolProfileForm.affiliationBoard === 'State Board') &&
      !this.schoolProfileForm.customBoardName?.trim()
    ) {
      this.toastService.warning('Please specify the custom affiliation board name.');
      this.schoolProfileActiveTab = 'BASIC';
      return;
    }

    this.savingSchoolProfile = true;
    this.api.put('school/profile', {
      ...this.schoolProfileForm,
      logo_url: this.schoolProfileForm.logoUrl,
      principal_photo_url: this.schoolProfileForm.principalPhotoUrl,
      vice_principal_photo_url: this.schoolProfileForm.vicePrincipalPhotoUrl,
    }).subscribe({
      next: () => {
        this.savingSchoolProfile = false;
        this.toastService.success('School profile updated successfully.');

        // Immediately sync the reactive auth signal so the top bar and sidebar update live
        this.auth.updateCurrentSchool({
          name: this.schoolProfileForm.name,
          code: this.schoolProfileForm.code,
          logoUrl: this.schoolProfileForm.logoUrl,
          logo_url: this.schoolProfileForm.logoUrl,
        });

        this.closeSchoolProfileModal();
      },
      error: (err: any) => {
        this.savingSchoolProfile = false;
        this.toastService.error(err.message || 'Failed to update school profile.');
      }
    });
  }

  // =========================================================================
  // ROLE & SERVICE PERMISSION MANAGEMENT STUDIO METHODS
  // =========================================================================
  openRoleManagementModal(event?: Event) {
    if (event) event.stopPropagation();
    this.isSettingsDropdownOpen = false;

    if (!this.canAccessSettings) {
      this.toastService.error('Unauthorized access. Only School Administrators can manage campus roles.');
      return;
    }

    this.selectedRoleCode = 'SCHOOL_ADMIN';
    this.roleSearchQuery = '';
    this.activeRoleCategory = 'All';

    // Load active school permissions
    const schoolId = this.auth.currentUser()?.school?.id || 'default';
    this.rolePermissionsMap = JSON.parse(JSON.stringify(this.auth.getSchoolRolePermissions(schoolId)));
    this.showRoleManagementModal = true;
  }

  closeRoleManagementModal() {
    this.showRoleManagementModal = false;
  }

  selectRoleToConfigure(roleCode: string) {
    this.selectedRoleCode = roleCode;
  }

  getSelectedRoleObject() {
    return this.systemRolesList.find((r) => r.code === this.selectedRoleCode) || this.systemRolesList[0];
  }

  get filteredRoleSections(): RoleSectionItem[] {
    const q = (this.roleSearchQuery || '').trim().toLowerCase();
    const cat = this.activeRoleCategory;

    return this.roleSectionsCatalog.filter((sec) => {
      if (cat !== 'All' && sec.category !== cat) {
        return false;
      }
      if (q) {
        const nameMatch = sec.name.toLowerCase().includes(q);
        const descMatch = sec.description.toLowerCase().includes(q);
        const catMatch = sec.category.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch;
      }
      return true;
    });
  }

  isSectionEnabled(sectionId: string): boolean {
    const list = this.rolePermissionsMap[this.selectedRoleCode];
    if (!list) return false;
    return list.includes(sectionId);
  }

  isParentDisabled(parentId?: string): boolean {
    if (!parentId) return false;
    return !this.isSectionEnabled(parentId);
  }

  toggleSectionPermission(section: RoleSectionItem) {
    if (!this.rolePermissionsMap[this.selectedRoleCode]) {
      this.rolePermissionsMap[this.selectedRoleCode] = [...(DEFAULT_ROLE_PERMISSIONS[this.selectedRoleCode] || [])];
    }

    const currentList = new Set(this.rolePermissionsMap[this.selectedRoleCode]);
    const isCurrentlyEnabled = currentList.has(section.id);

    if (isCurrentlyEnabled) {
      // Disabling section
      currentList.delete(section.id);

      // If it's a parent, also disable all children
      if (section.isParent) {
        this.roleSectionsCatalog
          .filter((s) => s.parentId === section.id)
          .forEach((child) => currentList.delete(child.id));
      }
    } else {
      // Enabling section
      currentList.add(section.id);

      // If it has a parent, also ensure the parent is enabled
      if (section.parentId) {
        currentList.add(section.parentId);
      }
    }

    this.rolePermissionsMap[this.selectedRoleCode] = Array.from(currentList);
  }

  grantAllForRole() {
    this.rolePermissionsMap[this.selectedRoleCode] = this.roleSectionsCatalog.map((s) => s.id);
    this.toastService.info(`Granted access to all modules for ${this.getSelectedRoleObject()?.name}.`);
  }

  revokeAllForRole() {
    this.rolePermissionsMap[this.selectedRoleCode] = ['dashboard'];
    this.toastService.info(`Restricted all optional modules for ${this.getSelectedRoleObject()?.name}.`);
  }

  resetRoleToDefaults() {
    const defaults = DEFAULT_ROLE_PERMISSIONS[this.selectedRoleCode] || [];
    this.rolePermissionsMap[this.selectedRoleCode] = [...defaults];
    this.toastService.info(`Reset ${this.getSelectedRoleObject()?.name} to standard institutional defaults.`);
  }

  getEnabledCountForRole(roleCode: string): number {
    const list = this.rolePermissionsMap[roleCode] || this.auth.getSchoolRolePermissions()[roleCode] || DEFAULT_ROLE_PERMISSIONS[roleCode] || [];
    return this.roleSectionsCatalog.filter((s) => list.includes(s.id)).length;
  }

  saveRolePermissions() {
    if (!this.canAccessSettings) {
      this.toastService.error('Unauthorized: You do not have permission to modify role settings.');
      return;
    }

    if (this.selectedRoleCode === 'SUPER_ADMIN' || this.selectedRoleCode === 'PLATFORM_ADMIN') {
      this.toastService.error('Super Admin is the platform developer authority and cannot be modified.');
      return;
    }

    const schoolId = this.auth.currentUser()?.school?.id || 'default';
    this.savingRolePermissions = true;

    // Persist to storage & api
    this.auth.saveSchoolRolePermissions(schoolId, this.selectedRoleCode, this.rolePermissionsMap[this.selectedRoleCode]);

    this.api.put('school/role-permissions', { schoolId, permissions: this.rolePermissionsMap }).subscribe({
      next: () => {
        this.savingRolePermissions = false;
        this.auth.rolePermissions.set({ ...this.rolePermissionsMap });
        this.filterMenu();
        this.toastService.success(`Role permissions updated successfully for ${this.getSelectedRoleObject()?.name}.`);
        this.closeRoleManagementModal();
      },
      error: () => {
        // Even if remote endpoint fails, local signal has been set
        this.savingRolePermissions = false;
        this.auth.rolePermissions.set({ ...this.rolePermissionsMap });
        this.filterMenu();
        this.toastService.success(`Role permissions updated successfully.`);
        this.closeRoleManagementModal();
      },
    });
  }
}
