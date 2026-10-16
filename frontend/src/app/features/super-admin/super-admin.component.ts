import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';

interface SchoolItemWithStats {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  status: string;
  disabledServices?: string[];
  createdAt: string;
  stats: {
    studentsCount: number;
    classesCount: number;
    subjectsCount: number;
    totalStaffCount: number;
  };
  subscription?: {
    perStudentFee: number;
    billingCycle: string;
    status: string;
    nextBillingDate?: string;
  };
  wallet?: {
    balance: number;
    currency: string;
    status: string;
  };
  admin?: {
    id: string;
    firstName: string;
    lastName?: string;
    fullName: string;
    email: string;
    phone?: string;
    status: string;
  };
}

interface ServiceDefinition {
  code: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

const AVAILABLE_SERVICES: ServiceDefinition[] = [
  {
    code: 'TIMETABLE',
    name: 'Timetable & Scheduling',
    category: 'Academics',
    description: 'Class period grids, teacher routine allocations, break & lunch recess intervals.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    code: 'ATTENDANCE',
    name: 'Attendance Register',
    category: 'Operations',
    description: 'Daily student roll call, subject-wise period attendance, real-time parent sync.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    code: 'HOMEWORK',
    name: 'Homework & Assignments',
    category: 'Learning',
    description: 'Class homework publishing, digital file submissions, student completion logs.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    code: 'EXAMS',
    name: 'Exams & Marksheets',
    category: 'Assessment',
    description: 'Exam scheduling, subject marks entry, grading schemes, and term report cards.',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  },
  {
    code: 'COMMUNICATION',
    name: 'Circulars & Notices',
    category: 'Announcements',
    description: 'Institutional broadcasts, urgent alerts, event circulars, and notifications.',
    icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  },
  {
    code: 'COMPLAINTS',
    name: 'Grievance Desk / Complaints',
    category: 'Support',
    description: 'Parent grievances, staff ticket assignments, dispute tracking, resolution notes.',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    code: 'FEES',
    name: 'Fee Management & Invoicing',
    category: 'Finance',
    description: 'Tuition fee categories, installment structures, invoices, and payment receipts.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    code: 'TRANSPORT',
    name: 'Transport & Fleet Management',
    category: 'Operations',
    description: 'School bus fleet, transit routes, stops, driver rosters, and student transport passes.',
    icon: 'M8 17a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM5 17H3V6a2 2 0 012-2h14a2 2 0 012 2v11h-2m-4 0H9m-6-6h18M8 4v7m8-7v7',
  },
];

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-12 pt-2">
      
      <!-- ============================================================== -->
      <!-- 1. NETWORK KPI & METRICS STRIP (UNIFIED ICON COLORS)           -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Campuses -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M3 21h18M3 7v14M21 7v14M6 21V11M10 21V11M14 21V11M18 21V11M12 3L2 7h20L12 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Campuses</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5">{{ schools.length }}</div>
            <div class="text-[11px] text-slate-500 truncate">Onboarded tenant networks</div>
          </div>
        </div>

        <!-- Active Campuses -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" stroke-width="2.5" d="M8.5 12l2.5 2.5 5-5" />
            </svg>
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Campuses</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
              <span>{{ activeSchoolsCount }}</span>
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {{ schools.length ? ((activeSchoolsCount / schools.length) * 100 | number:'1.0-0') : 100 }}% Live
              </span>
            </div>
            <div class="text-[11px] text-slate-500 truncate">{{ suspendedSchoolsCount }} suspended / offline</div>
          </div>
        </div>

        <!-- Network Students -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Students</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5">{{ totalStudents }}</div>
            <div class="text-[11px] text-slate-500 truncate">Across {{ schools.length }} institutional databases</div>
          </div>
        </div>

        <!-- Service Governance -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Core Microservices</div>
            <div class="text-2xl font-black text-slate-900 mt-0.5">{{ availableServices.length }} Services</div>
            <div class="text-[11px] text-slate-500 truncate">Configurable per community</div>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- 2. SEARCH, FILTER, ACTIONS & VIEW CONTROLS TOOLBAR             -->
      <!-- ============================================================== -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3 sm:px-4 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        <!-- Left: Search Bar & Status Filter Tabs -->
        <div class="flex items-center gap-3 flex-1 flex-wrap min-w-0">
          <!-- Search input with balanced width & clean icon -->
          <div class="relative flex-1 min-w-[240px] max-w-md">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
              </svg>
            </span>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="currentPage = 1"
                   placeholder="Search school name, code, city, admin..."
                   class="w-full h-10 pl-10 pr-9 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs text-slate-900 transition-all outline-none placeholder:text-slate-400 font-medium" />
            <button *ngIf="searchQuery" (click)="searchQuery = ''; currentPage = 1"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors">
              ✕
            </button>
          </div>

          <!-- Status Segmented Filter Pills -->
          <div class="inline-flex items-center h-10 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 text-xs font-bold shrink-0">
            <button (click)="statusFilter = 'ALL'; currentPage = 1"
                    [class.bg-white]="statusFilter === 'ALL'"
                    [class.text-blue-600]="statusFilter === 'ALL'"
                    [class.shadow-xs]="statusFilter === 'ALL'"
                    [class.text-slate-500]="statusFilter !== 'ALL'"
                    class="h-8 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 hover:text-slate-900">
              <span>All</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                    [class.bg-blue-50]="statusFilter === 'ALL'"
                    [class.text-blue-700]="statusFilter === 'ALL'"
                    [class.bg-slate-200]="statusFilter !== 'ALL'">{{ schools.length }}</span>
            </button>
            <button (click)="statusFilter = 'ACTIVE'; currentPage = 1"
                    [class.bg-white]="statusFilter === 'ACTIVE'"
                    [class.text-emerald-700]="statusFilter === 'ACTIVE'"
                    [class.shadow-xs]="statusFilter === 'ACTIVE'"
                    [class.text-slate-500]="statusFilter !== 'ACTIVE'"
                    class="h-8 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 hover:text-slate-900">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                    [class.bg-emerald-50]="statusFilter === 'ACTIVE'"
                    [class.text-emerald-700]="statusFilter === 'ACTIVE'"
                    [class.bg-slate-200]="statusFilter !== 'ACTIVE'">{{ activeSchoolsCount }}</span>
            </button>
            <button (click)="statusFilter = 'SUSPENDED'; currentPage = 1"
                    [class.bg-white]="statusFilter === 'SUSPENDED'"
                    [class.text-rose-700]="statusFilter === 'SUSPENDED'"
                    [class.shadow-xs]="statusFilter === 'SUSPENDED'"
                    [class.text-slate-500]="statusFilter !== 'SUSPENDED'"
                    class="h-8 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 hover:text-slate-900">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>Suspended</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                    [class.bg-rose-50]="statusFilter === 'SUSPENDED'"
                    [class.text-rose-700]="statusFilter === 'SUSPENDED'"
                    [class.bg-slate-200]="statusFilter !== 'SUSPENDED'">{{ suspendedSchoolsCount }}</span>
            </button>
          </div>
        </div>

        <!-- Right: Actions, Sort, View Toggle -->
        <div class="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end flex-wrap">
          <!-- Sort Dropdown with Custom Chevron -->
          <div class="relative flex items-center">
            <select [(ngModel)]="sortBy" (ngModelChange)="currentPage = 1"
                    class="h-10 pl-3 pr-8 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none">
              <option value="NAME">Name (A–Z)</option>
              <option value="STUDENTS">Most Students</option>
              <option value="NEWEST">Newest Onboarded</option>
            </select>
            <svg class="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </div>

          <!-- View Mode Toggle (Grid vs Table) -->
          <div class="inline-flex items-center h-10 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70">
            <button (click)="viewMode = 'GRID'" title="Grid Cards View"
                    [class.bg-white]="viewMode === 'GRID'"
                    [class.text-blue-600]="viewMode === 'GRID'"
                    [class.shadow-xs]="viewMode === 'GRID'"
                    [class.text-slate-500]="viewMode !== 'GRID'"
                    class="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:text-slate-900">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </button>
            <button (click)="viewMode = 'TABLE'" title="Dense Table View"
                    [class.bg-white]="viewMode === 'TABLE'"
                    [class.text-blue-600]="viewMode === 'TABLE'"
                    [class.shadow-xs]="viewMode === 'TABLE'"
                    [class.text-slate-500]="viewMode !== 'TABLE'"
                    class="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:text-slate-900">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <!-- Subtle divider -->
          <div class="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <!-- Refresh Button -->
          <button (click)="loadSchools()" [disabled]="loading"
                  title="Sync Directory"
                  class="h-10 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50">
            <svg [class.animate-spin]="loading" class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span class="hidden sm:inline">{{ loading ? 'Syncing...' : 'Refresh' }}</span>
          </button>

          <!-- Onboard School Button (Primary Brand Blue CTA) -->
          <button (click)="openOnboardModal()"
                  class="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/30 hover:shadow-md hover:shadow-blue-600/35 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Onboard School</span>
          </button>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- 5A. GRID VIEW: REDESIGNED CAMPUS CARDS WITH HERO BINARY LOGIN   -->
      <!-- ============================================================== -->
      <div *ngIf="viewMode === 'GRID'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div *ngFor="let s of paginatedSchools"
             class="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-all duration-300 flex flex-col justify-between overflow-hidden group">
          
          <div class="p-6 sm:p-7 space-y-5">
            
            <!-- Campus Header: Avatar, Name, Badges -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3.5 min-w-0">
                <!-- School Logo / Avatar Box (Single Border, Clean Neutral Background) -->
                <div class="w-13 h-13 min-w-[52px] max-w-[52px] h-[52px] rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                  <img *ngIf="s.logoUrl || s.logo_url" [src]="s.logoUrl || s.logo_url" alt="{{ s.name }}" class="w-full h-full object-contain p-1.5 pointer-events-none" />
                  <svg *ngIf="!(s.logoUrl || s.logo_url)" class="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 9.5L12 4l10 5.5"/>
                    <path d="M4 10v9"/>
                    <path d="M8 10v9"/>
                    <path d="M12 10v9"/>
                    <path d="M16 10v9"/>
                    <path d="M20 10v9"/>
                    <path d="M2 20h20"/>
                    <path d="M12 4V1.5"/>
                    <path d="M12 1.5l2.5 1.5L12 4.5"/>
                  </svg>
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Unique School Code Pill with Copy Action -->
                    <button (click)="copySchoolCode(s, $event)"
                            title="Click to copy tenant code"
                            class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 hover:text-slate-900 transition-colors cursor-pointer">
                      <span>{{ s.code }}</span>
                      <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      <span *ngIf="copiedCodeId === s.id" class="text-[9px] text-emerald-600 font-sans font-bold">Copied!</span>
                    </button>

                    <!-- Status Pill -->
                    <span *ngIf="s.status === 'ACTIVE'"
                          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ACTIVE
                    </span>
                    <span *ngIf="s.status !== 'ACTIVE'"
                          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      SUSPENDED
                    </span>

                    <!-- SaaS Rate Badge -->
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      ₹{{ s.subscription?.perStudentFee || 20 }}/student
                    </span>
                  </div>

                  <h3 class="text-lg font-black text-slate-900 mt-1 truncate group-hover:text-indigo-600 transition-colors">
                    {{ s.name }}
                  </h3>
                  <div class="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{{ s.addressLine1 ? s.addressLine1 + ', ' : '' }}{{ s.city || 'Campus' }}{{ s.state ? ', ' + s.state : '' }}</span>
                  </div>
                </div>
              </div>

              <!-- Live Balance Pill -->
              <div class="shrink-0 text-right">
                <div class="px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5"
                     [ngClass]="(s.wallet?.balance || 0) < 0 
                       ? 'bg-rose-50 text-rose-800 border-rose-200' 
                       : 'bg-emerald-50 text-emerald-800 border-emerald-200'">
                  <span class="w-2 h-2 rounded-full" [ngClass]="(s.wallet?.balance || 0) < 0 ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                  <span>₹{{ (s.wallet?.balance || 0) | number:'1.2-2' }}</span>
                </div>
                <span *ngIf="(s.wallet?.balance || 0) < 0" class="text-[9px] font-black uppercase text-rose-600 block mt-0.5">
                  Arrears Due
                </span>
                <span *ngIf="(s.wallet?.balance || 0) >= 0" class="text-[9px] font-semibold text-slate-400 block mt-0.5">
                  Prepaid Balance
                </span>
              </div>
            </div>

            <!-- ========================================================== -->
            <!-- HERO ACTION: BINARY SUPPORT ACCESS BANNER                   -->
            <!-- ========================================================== -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-white text-blue-600 border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Binary Support Access</span>
                    <span class="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-md bg-slate-200/70 text-slate-600 border border-slate-200">Zero Password</span>
                  </div>
                  <div class="text-[11px] text-slate-500">
                    Switch context directly into this school's admin portal
                  </div>
                </div>
              </div>

              <button (click)="enterSupportLogin(s)"
                      [disabled]="s.status !== 'ACTIVE' || enteringSupportId === s.id"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0">
                <svg *ngIf="enteringSupportId === s.id" class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <svg *ngIf="enteringSupportId !== s.id" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                </svg>
                <span>{{ enteringSupportId === s.id ? 'Minting Token...' : 'Enter Campus' }}</span>
              </button>
            </div>

            <!-- Campus Metrics Strip -->
            <div class="grid grid-cols-4 gap-2 text-center">
              <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Students</div>
                <div class="text-base font-black text-slate-900 mt-0.5">{{ s.stats.studentsCount }}</div>
              </div>
              <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classes</div>
                <div class="text-base font-black text-slate-900 mt-0.5">{{ s.stats.classesCount }}</div>
              </div>
              <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subjects</div>
                <div class="text-base font-black text-slate-900 mt-0.5">{{ s.stats.subjectsCount }}</div>
              </div>
              <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Faculty</div>
                <div class="text-base font-black text-slate-900 mt-0.5">{{ s.stats.totalStaffCount }}</div>
              </div>
            </div>

            <!-- Primary School Administrator Card -->
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary School Administrator</span>
                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  SCHOOL_ADMIN
                </span>
              </div>

              <div *ngIf="s.admin; else noAdmin">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-black text-slate-900">{{ s.admin.fullName }}</div>
                  <button (click)="copyAdminEmail(s.admin.email, s.id, $event)"
                          class="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span>{{ copiedAdminEmailId === s.id ? 'Copied!' : 'Copy Login' }}</span>
                  </button>
                </div>
                <div class="text-xs text-slate-600 font-mono mt-0.5">{{ s.admin.email }}</div>
              </div>
              <ng-template #noAdmin>
                <div class="text-xs text-slate-400 italic">No primary administrator account provisioned yet.</div>
              </ng-template>

              <div class="text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span>Services Allowed: <strong>{{ getActiveServicesCount(s) }}/{{ availableServices.length }}</strong></span>
                <span>Isolated DB Schema</span>
              </div>
            </div>

          </div>

          <!-- Card Governance Toolbar (Footer) -->
          <div class="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div class="text-[11px] text-slate-400 font-medium">
              Onboarded: {{ s.createdAt | date:'mediumDate' }}
            </div>

            <div class="flex items-center gap-2">
              <!-- Services Button -->
              <button (click)="openServicesModal(s)"
                      title="Manage community services"
                      class="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Services</span>
              </button>

              <!-- Pricing & Wallet Button -->
              <button (click)="openPricingModal(s)"
                      title="Adjust rate and ledger credits"
                      class="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Pricing & Wallet</span>
              </button>

              <!-- Deboard / Suspend Toggle -->
              <button *ngIf="s.status === 'ACTIVE'"
                      (click)="toggleSchoolStatus(s)"
                      title="Suspend / Deboard this campus"
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
              <button *ngIf="s.status !== 'ACTIVE'"
                      (click)="toggleSchoolStatus(s)"
                      title="Reactivate this campus"
                      class="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 text-xs font-bold transition-colors cursor-pointer">
                Reactivate
              </button>
            </div>
          </div>

        </div>

      </div>

      <!-- ============================================================== -->
      <!-- 5B. TABLE VIEW: DENSE EXECUTIVE DIRECTORY SPREADSHEET          -->
      <!-- ============================================================== -->
      <div *ngIf="viewMode === 'TABLE'" class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th class="py-3.5 px-4">Campus Identity</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Students & Faculty</th>
                <th class="py-3.5 px-4">SaaS Tier & Balance</th>
                <th class="py-3.5 px-4">Services</th>
                <th class="py-3.5 px-4">Primary Admin</th>
                <th class="py-3.5 px-4 text-right">Binary Support & Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr *ngFor="let s of paginatedSchools" class="hover:bg-slate-50/70 transition-colors">
                <!-- Campus Identity -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                      <img *ngIf="s.logoUrl || s.logo_url" [src]="s.logoUrl || s.logo_url" class="w-full h-full object-contain p-0.5" />
                      <svg *ngIf="!(s.logoUrl || s.logo_url)" class="w-4.5 h-4.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 9.5L12 4l10 5.5M4 10v9M8 10v9M12 10v9M16 10v9M20 10v9M2 20h20"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-black text-slate-900">{{ s.name }}</div>
                      <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                        <span>{{ s.code }}</span>
                        <span>•</span>
                        <span>{{ s.city || 'Campus' }}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4">
                  <span *ngIf="s.status === 'ACTIVE'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ACTIVE
                  </span>
                  <span *ngIf="s.status !== 'ACTIVE'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    SUSPENDED
                  </span>
                </td>

                <!-- Students & Faculty -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-900">{{ s.stats.studentsCount }} Students</div>
                  <div class="text-[11px] text-slate-400">{{ s.stats.totalStaffCount }} Staff • {{ s.stats.classesCount }} Classes</div>
                </td>

                <!-- SaaS & Balance -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-900">₹{{ s.subscription?.perStudentFee || 20 }}/mo</div>
                  <div class="text-[11px] font-mono font-bold" [ngClass]="(s.wallet?.balance || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'">
                    ₹{{ (s.wallet?.balance || 0) | number:'1.2-2' }}
                  </div>
                </td>

                <!-- Services Allowed -->
                <td class="py-3.5 px-4">
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {{ getActiveServicesCount(s) }}/{{ availableServices.length }} Allowed
                  </span>
                </td>

                <!-- Admin Email -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-800">{{ s.admin?.fullName || 'No Admin' }}</div>
                  <div class="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">{{ s.admin?.email }}</div>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <div class="inline-flex items-center gap-1.5">
                    <button (click)="enterSupportLogin(s)"
                            [disabled]="s.status !== 'ACTIVE' || enteringSupportId === s.id"
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center gap-1 cursor-pointer disabled:opacity-40">
                      <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                      </svg>
                      <span>Binary Login</span>
                    </button>
                    <button (click)="openServicesModal(s)" title="Services" class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                    </button>
                    <button (click)="openPricingModal(s)" title="Pricing & Wallet" class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- 6. BOTTOM PAGINATION & METRICS BAR (10 campuses / page)        -->
      <!-- ============================================================== -->
      <div *ngIf="filteredSchools.length > 0"
           class="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <!-- Range / Count Indicator -->
        <div class="text-xs text-slate-500 font-medium">
          Showing <strong class="text-slate-900 font-bold">{{ paginationStartIndex }}</strong>–<strong class="text-slate-900 font-bold">{{ paginationEndIndex }}</strong> of <strong class="text-slate-900 font-bold">{{ filteredSchools.length }}</strong> campuses
          <span *ngIf="filteredSchools.length < schools.length" class="text-slate-400 font-normal"> (filtered from {{ schools.length }} total)</span>
        </div>

        <!-- Page Navigation Buttons -->
        <div class="flex items-center gap-1.5 self-center sm:self-auto">
          <!-- Previous Button -->
          <button (click)="setPage(currentPage - 1)"
                  [disabled]="currentPage === 1"
                  class="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-2xs">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="hidden sm:inline">Prev</span>
          </button>

          <!-- Page Numbers -->
          <ng-container *ngFor="let p of pageNumbers">
            <span *ngIf="p === -1" class="px-1 text-slate-400 text-xs font-bold">...</span>
            <button *ngIf="p !== -1"
                    (click)="setPage(p)"
                    [class.bg-blue-600]="currentPage === p"
                    [class.text-white]="currentPage === p"
                    [class.border-blue-600]="currentPage === p"
                    [class.shadow-sm]="currentPage === p"
                    [class.bg-white]="currentPage !== p"
                    [class.text-slate-700]="currentPage !== p"
                    [class.border-slate-200]="currentPage !== p"
                    class="min-w-[32px] h-8 px-2 rounded-xl border text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center">
              {{ p }}
            </button>
          </ng-container>

          <!-- Next Button -->
          <button (click)="setPage(currentPage + 1)"
                  [disabled]="currentPage === totalPages"
                  class="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer shadow-2xs">
            <span class="hidden sm:inline">Next</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredSchools.length === 0"
           class="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <h4 class="text-base font-black text-slate-900">No Institutional Campuses Found</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          No schools match the search query "{{ searchQuery }}" or selected filters. Try clearing your search parameters.
        </p>
        <button (click)="searchQuery = ''; statusFilter = 'ALL'; currentPage = 1"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/25 transition-all cursor-pointer">
          Reset Filters
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: ONBOARD NEW SCHOOL & INITIAL ADMIN                    -->
      <!-- ============================================================== -->
      <div *ngIf="showOnboardModal" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closeOnboardModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <!-- Fixed Non-Scrolling Header -->
          <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                Tenant Provisioning Matrix
              </span>
              <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
                Onboard New Campus & Provision Admin
              </h3>
              <p class="text-xs text-slate-500">
                Provisions a clean, isolated multi-tenant database workspace and creates the primary School Administrator credentials.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" (click)="autoFillSampleSchool()"
                      class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
                <span>Auto-Fill Sample</span>
              </button>
              <button (click)="closeOnboardModal()"
                      title="Close dialog"
                      class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Scrollable Body with Internal Scrollbar (Cleanly contained below header) -->
          <div class="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 text-xs">
            <!-- SECTION 1: INSTITUTION PROFILE -->
            <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-indigo-900 font-bold flex items-center justify-between">
              <span>1. Institutional Identity & Campus Details</span>
              <span class="text-[10px] text-indigo-600 font-medium">Session 2026-2027 Auto-Linked</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">School Name *</label>
                <input type="text" [(ngModel)]="newSchool.name" (input)="onSchoolNameChange()" placeholder="e.g. St. Xavier International School"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Unique School Code *</label>
                <input type="text" [(ngModel)]="newSchool.code" placeholder="e.g. SXIS01"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Education Board</label>
                <select [(ngModel)]="newSchool.affiliation"
                        class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs">
                  <option value="CBSE">CBSE (Central Board)</option>
                  <option value="ICSE">ICSE / ISC Board</option>
                  <option value="IB">IB World School</option>
                  <option value="CAMBRIDGE">Cambridge (IGCSE)</option>
                  <option value="STATE_BOARD">State Secondary Board</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">City *</label>
                <input type="text" [(ngModel)]="newSchool.city" placeholder="e.g. New Delhi"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">State</label>
                <input type="text" [(ngModel)]="newSchool.state" placeholder="e.g. Delhi"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Campus Address</label>
                <input type="text" [(ngModel)]="newSchool.addressLine1" placeholder="e.g. Sector 14, Dwarka"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">School Official Email</label>
                <input type="email" [(ngModel)]="newSchool.email" placeholder="contact@stxavier.edu.in"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>
            </div>

            <!-- SECTION 2: INITIAL SCHOOL ADMIN ACCOUNT -->
            <div class="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-emerald-900 font-bold mt-3">
              2. Initial School Administrator User Account (Binary Login)
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin First Name *</label>
                <input type="text" [(ngModel)]="newSchool.adminFirstName" placeholder="e.g. Ramesh"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin Last Name</label>
                <input type="text" [(ngModel)]="newSchool.adminLastName" placeholder="e.g. Verma"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin Login Email *</label>
                <input type="email" [(ngModel)]="newSchool.adminEmail" placeholder="admin@stxavier.edu.in"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin Mobile Phone</label>
                <input type="text" [(ngModel)]="newSchool.adminPhone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Initial Password</label>
              <input type="text" [(ngModel)]="newSchool.adminPassword" placeholder="password123"
                     class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
              <p class="text-[10px] text-slate-400 mt-1">Default is 'password123'. School admin can change it upon initial login.</p>
            </div>

            <!-- SECTION 3: SAAS SUBSCRIPTION & PER-STUDENT PRICING -->
            <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-950 font-bold mt-3 flex items-center justify-between">
              <span>3. SaaS Subscription & Per-Student Rate</span>
              <span class="text-[10px] text-amber-800 font-medium">B2B Monthly License</span>
            </div>

            <div class="space-y-2">
              <label class="block font-bold text-slate-700 mb-1">Per-Student Monthly Fee (₹) *</label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input type="number" [(ngModel)]="newSchool.perStudentFee" min="1" step="1"
                         class="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" *ngFor="let rate of [15, 20, 25, 30, 50]"
                          (click)="newSchool.perStudentFee = rate"
                          [class.bg-blue-600]="newSchool.perStudentFee === rate"
                          [class.text-white]="newSchool.perStudentFee === rate"
                          [class.shadow-xs]="newSchool.perStudentFee === rate"
                          [class.bg-slate-100]="newSchool.perStudentFee !== rate"
                          [class.text-slate-700]="newSchool.perStudentFee !== rate"
                          class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer">
                    ₹{{ rate }}
                  </button>
                </div>
              </div>
              <p class="text-[10px] text-slate-500">
                The school's monthly subscription will automatically calculate as <code>Total Active Students × ₹{{ newSchool.perStudentFee }}/mo</code>.
              </p>
            </div>

            <div *ngIf="onboardError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ onboardError }}
            </div>
          </div>

          <!-- Fixed Non-Scrolling Footer -->
          <div class="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeOnboardModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="submitOnboardSchool()" [disabled]="onboarding"
                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
              <span *ngIf="!onboarding">Provision & Onboard School</span>
              <span *ngIf="onboarding" class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Provisioning Database...</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 2: MANAGE & RESTRICT INSTITUTIONAL SERVICES               -->
      <!-- ============================================================== -->
      <div *ngIf="showServicesModal && selectedSchoolForServices"
           class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closeServicesModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <!-- Fixed Non-Scrolling Header -->
          <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1 mt-0.5">
                <img *ngIf="selectedSchoolForServices.logoUrl || selectedSchoolForServices.logo_url" [src]="selectedSchoolForServices.logoUrl || selectedSchoolForServices.logo_url" class="w-full h-full object-contain pointer-events-none" />
                <div *ngIf="!(selectedSchoolForServices.logoUrl || selectedSchoolForServices.logo_url)" class="w-full h-full rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {{ (selectedSchoolForServices.name || 'S').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                    Service Governance Matrix
                  </span>
                  <span class="text-xs font-mono font-bold text-slate-500">{{ selectedSchoolForServices.code }}</span>
                </div>
                <h3 class="text-base font-black text-slate-900 tracking-tight mt-1">
                  Community Service Permissions: {{ selectedSchoolForServices.name }}
                </h3>
                <p class="text-xs text-slate-500">
                  Enable or restrict platform modules. Restricted services are hidden from the school portal and rejected by backend guards.
                </p>
              </div>
            </div>
            <button (click)="closeServicesModal()"
                    title="Close dialog"
                    class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Scrollable Body with Internal Scrollbar (Cleanly contained below header) -->
          <div class="p-6 sm:p-8 overflow-y-auto space-y-3 flex-1 text-xs">
            <div *ngFor="let svc of availableServices"
                 class="p-4 rounded-2xl border transition-all flex items-center justify-between gap-4"
                 [class.bg-white]="isServiceAllowed(svc.code)"
                 [class.border-slate-200]="isServiceAllowed(svc.code)"
                 [class.shadow-2xs]="isServiceAllowed(svc.code)"
                 [class.bg-slate-50]="!isServiceAllowed(svc.code)"
                 [class.border-rose-200]="!isServiceAllowed(svc.code)">
              
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                     [class.bg-indigo-50]="isServiceAllowed(svc.code)"
                     [class.text-indigo-600]="isServiceAllowed(svc.code)"
                     [class.border-indigo-100]="isServiceAllowed(svc.code)"
                     [class.bg-rose-50]="!isServiceAllowed(svc.code)"
                     [class.text-rose-600]="!isServiceAllowed(svc.code)"
                     [class.border-rose-100]="!isServiceAllowed(svc.code)">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="svc.icon" />
                  </svg>
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-black text-slate-900 text-xs">{{ svc.name }}</h4>
                    <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {{ svc.category }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{{ svc.description }}</p>
                </div>
              </div>

              <!-- Toggle Control -->
              <div class="flex items-center gap-3 shrink-0">
                <span *ngIf="isServiceAllowed(svc.code)"
                      class="px-2 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Allowed
                </span>
                <span *ngIf="!isServiceAllowed(svc.code)"
                      class="px-2 py-1 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Restricted
                </span>

                <button (click)="toggleService(svc.code)"
                        type="button"
                        [class.bg-emerald-600]="isServiceAllowed(svc.code)"
                        [class.bg-slate-300]="!isServiceAllowed(svc.code)"
                        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                  <span [class.translate-x-5]="isServiceAllowed(svc.code)"
                        [class.translate-x-0]="!isServiceAllowed(svc.code)"
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Fixed Non-Scrolling Footer -->
          <div class="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div class="text-[11px] text-slate-500 font-medium">
              Allowed: <strong class="text-slate-900 font-bold">{{ availableServices.length - activeDisabledServices.length }}</strong> of {{ availableServices.length }}
            </div>

            <div class="flex items-center gap-2.5">
              <button (click)="closeServicesModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
                Cancel
              </button>
              <button (click)="saveServices()" [disabled]="savingServices"
                      class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                <span *ngIf="!savingServices">Save Service Governance</span>
                <span *ngIf="savingServices">Saving Restrictions...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 3: CONFIGURE SAAS PRICING & WALLET ADJUSTMENT             -->
      <!-- ============================================================== -->
      <div *ngIf="showPricingModal && selectedSchoolForPricing" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closePricingModal()"></div>
        <div class="bg-white rounded-3xl max-w-lg w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <!-- Fixed Non-Scrolling Header -->
          <div class="px-6 sm:px-7 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-1 mt-0.5">
                <img *ngIf="selectedSchoolForPricing.logoUrl || selectedSchoolForPricing.logo_url" [src]="selectedSchoolForPricing.logoUrl || selectedSchoolForPricing.logo_url" class="w-full h-full object-contain pointer-events-none" />
                <div *ngIf="!(selectedSchoolForPricing.logoUrl || selectedSchoolForPricing.logo_url)" class="w-full h-full rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  {{ (selectedSchoolForPricing.name || 'S').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    SaaS Monetization Engine
                  </span>
                  <span *ngIf="loadingLivePricing" class="text-[10px] text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                    <svg class="w-3 h-3 text-indigo-600 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span>Fetching live balance...</span>
                  </span>
                </div>
                <h3 class="text-base font-black text-slate-900 tracking-tight mt-1">
                  Configure Pricing & Wallet — {{ selectedSchoolForPricing.name }}
                </h3>
                <p class="text-xs text-slate-500">
                  Update the contracted per-student rate and manually credit or debit this campus's billing wallet with full ledger tracking.
                </p>
              </div>
            </div>
            <button (click)="closePricingModal()"
                    title="Close dialog"
                    class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Scrollable Body with Internal Scrollbar (Cleanly contained below header) -->
          <div class="p-6 sm:p-7 overflow-y-auto space-y-4 flex-1 text-xs">
            <!-- Current School Summary -->
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Active Students</div>
                <div class="text-base font-black text-slate-900 mt-0.5">{{ selectedSchoolForPricing.stats.studentsCount }} Students</div>
              </div>
              <div class="p-3 border rounded-2xl"
                   [ngClass]="(selectedSchoolForPricing.wallet?.balance || 0) < 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'">
                <div class="text-[10px] font-bold uppercase opacity-75">Current Live Balance</div>
                <div class="text-base font-black mt-0.5">₹{{ (selectedSchoolForPricing.wallet?.balance || 0) | number:'1.2-2' }}</div>
              </div>
            </div>

            <!-- Rate Setting Field -->
            <div class="space-y-1.5 text-xs">
              <label class="block font-bold text-slate-700">Contracted Per-Student Monthly Fee (₹) *</label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input type="number" [(ngModel)]="editingRate" min="1" step="1"
                         class="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs" />
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" *ngFor="let rate of [15, 20, 25, 30, 50]"
                          (click)="editingRate = rate"
                          [class.bg-blue-600]="editingRate === rate"
                          [class.text-white]="editingRate === rate"
                          [class.shadow-xs]="editingRate === rate"
                          [class.bg-slate-100]="editingRate !== rate"
                          [class.text-slate-700]="editingRate !== rate"
                          class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer">
                    ₹{{ rate }}
                  </button>
                </div>
              </div>
              <p class="text-[10px] text-slate-500">
                Projected Monthly Invoicing: <strong>{{ selectedSchoolForPricing.stats.studentsCount }} students × ₹{{ editingRate }} = ₹{{ selectedSchoolForPricing.stats.studentsCount * editingRate | number:'1.2-2' }} / month</strong>.
              </p>
            </div>

            <!-- Root Wallet Adjustment Control -->
            <div class="space-y-3 text-xs pt-3 border-t border-slate-100">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Root Wallet Balance Adjustment</label>
                <p class="text-[11px] text-slate-500 mb-2">Adjust balance directly. Any deduction or addition is recorded on the school's ledger with your audit reason.</p>
                
                <!-- Mode Selector -->
                <div class="grid grid-cols-3 gap-2">
                  <button type="button" (click)="adjustmentType = 'NONE'; walletAdjustmentAmount = null"
                          [class.bg-blue-600]="adjustmentType === 'NONE'"
                          [class.text-white]="adjustmentType === 'NONE'"
                          [class.shadow-xs]="adjustmentType === 'NONE'"
                          [class.bg-slate-100]="adjustmentType !== 'NONE'"
                          [class.text-slate-700]="adjustmentType !== 'NONE'"
                          class="py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border border-transparent">
                    No Change
                  </button>

                  <button type="button" (click)="adjustmentType = 'CREDIT'"
                          [class.bg-emerald-600]="adjustmentType === 'CREDIT'"
                          [class.text-white]="adjustmentType === 'CREDIT'"
                          [class.bg-emerald-50]="adjustmentType !== 'CREDIT'"
                          [class.text-emerald-800]="adjustmentType !== 'CREDIT'"
                          [class.border-emerald-200]="adjustmentType !== 'CREDIT'"
                          class="py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border inline-flex items-center justify-center gap-1.5">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/>
                      <path d="M12 8v8m-4-4h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                    <span>Credit (+)</span>
                  </button>

                  <button type="button" (click)="adjustmentType = 'DEBIT'"
                          [class.bg-rose-600]="adjustmentType === 'DEBIT'"
                          [class.text-white]="adjustmentType === 'DEBIT'"
                          [class.bg-rose-50]="adjustmentType !== 'DEBIT'"
                          [class.text-rose-800]="adjustmentType !== 'DEBIT'"
                          [class.border-rose-200]="adjustmentType !== 'DEBIT'"
                          class="py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border inline-flex items-center justify-center gap-1.5">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/>
                      <path d="M8 12h8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                    <span>Debit (-)</span>
                  </button>
                </div>
              </div>

              <!-- Adjustment Amount & Mandatory Reason Fields -->
              <div *ngIf="adjustmentType !== 'NONE'" class="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-fadeIn">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    {{ adjustmentType === 'CREDIT' ? 'Amount to Add / Credit (₹) *' : 'Amount to Deduct / Debit (₹) *' }}
                  </label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold"
                          [ngClass]="adjustmentType === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'">
                      {{ adjustmentType === 'CREDIT' ? '+₹' : '-₹' }}
                    </span>
                    <input type="number" [(ngModel)]="walletAdjustmentAmount" min="1" step="1" placeholder="Enter amount"
                           class="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-800 shadow-2xs" />
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Mandatory Audit Reason * <span class="text-[10px] text-slate-400 font-normal">(Recorded in Ledger)</span>
                  </label>
                  <input type="text" [(ngModel)]="adjustmentReason"
                         placeholder="e.g. Offline Cheque Clearance #94821 / Security Deposit Adjustment / Promotional Waiver"
                         class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-2xs" />
                </div>

                <!-- Live Balance Projection Banner -->
                <div *ngIf="(walletAdjustmentAmount || 0) > 0" class="p-3 rounded-xl border flex items-center justify-between"
                     [ngClass]="projectedWalletBalance < 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'">
                  <div>
                    <div class="text-[10px] font-bold uppercase opacity-75">Projected New Balance</div>
                    <div class="text-xs text-slate-600">
                      ₹{{ (selectedSchoolForPricing.wallet?.balance || 0) | number:'1.2-2' }}
                      {{ adjustmentType === 'CREDIT' ? '+' : '-' }}
                      ₹{{ walletAdjustmentAmount | number:'1.2-2' }}
                    </div>
                  </div>
                  <div class="text-base font-black font-mono">
                    = ₹{{ projectedWalletBalance | number:'1.2-2' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fixed Non-Scrolling Footer -->
          <div class="px-6 sm:px-7 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closePricingModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="savePricing()" [disabled]="savingPricing || (adjustmentType !== 'NONE' && (!(walletAdjustmentAmount || 0) || !adjustmentReason.trim()))"
                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
              <span *ngIf="!savingPricing">Save Pricing & Update Ledger</span>
              <span *ngIf="savingPricing">Recording to Ledger...</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class SuperAdminComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  toast = inject(ToastService);
  router = inject(Router);
  modalService = inject(ModalService);

  constructor() {
    effect(() => {
      const active = this.modalService.activeModal();
      if (!active) {
        this.showOnboardModal = false;
        this.showServicesModal = false;
        this.showPricingModal = false;
      }
    });
  }

  schools: SchoolItemWithStats[] = [];
  searchQuery = '';
  loading = false;
  statusFilter: 'ALL' | 'ACTIVE' | 'SUSPENDED' = 'ALL';
  sortBy: 'NAME' | 'STUDENTS' | 'NEWEST' = 'NAME';
  viewMode: 'GRID' | 'TABLE' = 'GRID';

  copiedCodeId: string | null = null;
  copiedAdminEmailId: string | null = null;
  enteringSupportId: string | null = null;

  showOnboardModal = false;
  onboarding = false;
  onboardError = '';

  showServicesModal = false;
  selectedSchoolForServices: SchoolItemWithStats | null = null;
  activeDisabledServices: string[] = [];
  savingServices = false;
  availableServices = AVAILABLE_SERVICES;

  showPricingModal = false;
  selectedSchoolForPricing: SchoolItemWithStats | null = null;
  editingRate = 20;
  adjustmentType: 'NONE' | 'CREDIT' | 'DEBIT' = 'NONE';
  walletAdjustmentAmount: number | null = null;
  adjustmentReason = '';
  savingPricing = false;
  loadingLivePricing = false;

  newSchool = {
    name: '',
    code: '',
    affiliation: 'CBSE',
    city: '',
    state: '',
    addressLine1: '',
    email: '',
    phone: '',
    postalCode: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPassword: 'password123',
    perStudentFee: 20,
  };

  get projectedWalletBalance(): number {
    const current = Number(this.selectedSchoolForPricing?.wallet?.balance || 0);
    const amount = Number(this.walletAdjustmentAmount || 0);
    if (this.adjustmentType === 'CREDIT') return current + amount;
    if (this.adjustmentType === 'DEBIT') return current - amount;
    return current;
  }

  get totalStudents(): number {
    return this.schools.reduce((acc, s) => acc + (s.stats?.studentsCount || 0), 0);
  }

  get totalStaff(): number {
    return this.schools.reduce((acc, s) => acc + (s.stats?.totalStaffCount || 0), 0);
  }

  get activeSchoolsCount(): number {
    return this.schools.filter((s) => s.status === 'ACTIVE').length;
  }

  get suspendedSchoolsCount(): number {
    return this.schools.filter((s) => s.status !== 'ACTIVE').length;
  }

  get filteredSchools(): SchoolItemWithStats[] {
    let list = this.schools;

    // 1. Status Filter
    if (this.statusFilter === 'ACTIVE') {
      list = list.filter((s) => s.status === 'ACTIVE');
    } else if (this.statusFilter === 'SUSPENDED') {
      list = list.filter((s) => s.status !== 'ACTIVE');
    }

    // 2. Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.state && s.state.toLowerCase().includes(q)) ||
          (s.admin?.email && s.admin.email.toLowerCase().includes(q)) ||
          (s.admin?.fullName && s.admin.fullName.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    list = [...list].sort((a, b) => {
      if (this.sortBy === 'STUDENTS') {
        return (b.stats?.studentsCount || 0) - (a.stats?.studentsCount || 0);
      }
      if (this.sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }

  currentPage = 1;
  readonly pageSize = 10;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSchools.length / this.pageSize));
  }

  get paginatedSchools(): SchoolItemWithStats[] {
    const list = this.filteredSchools;
    const maxPage = this.totalPages;
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get paginationStartIndex(): number {
    if (this.filteredSchools.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredSchools.length);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, -1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1, total - 4, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }
    return pages;
  }

  setPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
  }

  ngOnInit() {
    // STRICT RULE: Only the single root Binary Developer / Platform Administrator can access this page
    if (!this.auth.isSuperAdmin() || this.auth.isSupportSession()) {
      this.toast.error('Security Restriction: Highly secured developer console. Accessible only by the authorized Binary Administrator.');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadSchools();
  }

  loadSchools() {
    this.loading = true;
    this.auth.getAllSchools().subscribe({
      next: (data) => {
        this.schools = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Failed to load school network');
      },
    });
  }

  copySchoolCode(school: SchoolItemWithStats, event?: Event) {
    event?.stopPropagation();
    navigator.clipboard?.writeText(school.code);
    this.copiedCodeId = school.id;
    this.toast.info(`Copied school code: ${school.code}`);
    setTimeout(() => {
      if (this.copiedCodeId === school.id) this.copiedCodeId = null;
    }, 2000);
  }

  copyAdminEmail(email: string, schoolId: string, event?: Event) {
    event?.stopPropagation();
    navigator.clipboard?.writeText(email);
    this.copiedAdminEmailId = schoolId;
    this.toast.info(`Copied admin login: ${email}`);
    setTimeout(() => {
      if (this.copiedAdminEmailId === schoolId) this.copiedAdminEmailId = null;
    }, 2000);
  }

  enterSupportLogin(school: SchoolItemWithStats) {
    if (school.status !== 'ACTIVE') {
      this.toast.error('Cannot enter support session for a suspended institution.');
      return;
    }

    this.enteringSupportId = school.id;
    this.auth.enterSupportSession(school.id).subscribe({
      next: () => {
        this.enteringSupportId = null;
        this.toast.success(`Binary Support Active: Switched to "${school.name}"`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.enteringSupportId = null;
        this.toast.error(err.message || 'Failed to initiate support session');
      },
    });
  }

  openOnboardModal() {
    this.newSchool = {
      name: '',
      code: '',
      affiliation: 'CBSE',
      city: '',
      state: '',
      addressLine1: '',
      email: '',
      phone: '',
      postalCode: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPhone: '',
      adminPassword: 'password123',
      perStudentFee: 20,
    };
    this.onboardError = '';
    this.showOnboardModal = true;
    this.modalService.open('SUPER_ADMIN_ONBOARD');
  }

  closeOnboardModal() {
    this.showOnboardModal = false;
    this.modalService.close();
  }

  onSchoolNameChange() {
    const name = this.newSchool.name.trim();
    if (!name) return;

    // Generate acronym from capital letters or words
    const words = name.split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
    } else {
      code = name.slice(0, 4).toUpperCase();
    }

    // Append 01 or current count
    this.newSchool.code = `${code}01`;

    if (!this.newSchool.adminEmail || this.newSchool.adminEmail.includes('@')) {
      const cleanDomain = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).join('');
      this.newSchool.adminEmail = `admin@${cleanDomain || 'school'}.edu.in`;
    }
  }

  autoFillSampleSchool() {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    this.newSchool = {
      name: `Delhi Heritage Academy`,
      code: `DHA${randomSuffix}`,
      affiliation: 'CBSE',
      city: 'New Delhi',
      state: 'Delhi',
      addressLine1: 'Sector 21, Rohini',
      email: `contact@dha${randomSuffix}.edu.in`,
      phone: '+91 98765 43210',
      postalCode: '110085',
      adminFirstName: 'Rajesh',
      adminLastName: 'Gupta',
      adminEmail: `admin@dha${randomSuffix}.edu.in`,
      adminPhone: '+91 98765 12345',
      adminPassword: 'password123',
      perStudentFee: 20,
    };
    this.onboardError = '';
    this.toast.info('Auto-filled sample school data!');
  }

  submitOnboardSchool() {
    if (
      !this.newSchool.name.trim() ||
      !this.newSchool.code.trim() ||
      !this.newSchool.adminEmail.trim() ||
      !this.newSchool.adminFirstName.trim()
    ) {
      this.onboardError = 'Please fill all required fields: School Name, Unique Code, Admin First Name, and Admin Email.';
      return;
    }

    if (this.newSchool.perStudentFee <= 0) {
      this.onboardError = 'Contracted per-student fee must be greater than zero.';
      return;
    }

    this.onboarding = true;
    this.onboardError = '';

    this.auth.onboardSchool(this.newSchool).subscribe({
      next: () => {
        this.onboarding = false;
        this.toast.success(
          `School "${this.newSchool.name}" successfully onboarded with SaaS rate ₹${this.newSchool.perStudentFee}/student!`
        );
        this.closeOnboardModal();
        this.loadSchools();
      },
      error: (err) => {
        this.onboarding = false;
        this.onboardError = err.error?.message || err.message || 'Failed to onboard school';
      },
    });
  }

  openServicesModal(school: SchoolItemWithStats) {
    this.selectedSchoolForServices = school;
    this.activeDisabledServices = [...(school.disabledServices || [])];
    this.showServicesModal = true;
    this.modalService.open('SUPER_ADMIN_SERVICES');
  }

  closeServicesModal() {
    this.showServicesModal = false;
    this.modalService.close();
  }

  isServiceAllowed(code: string): boolean {
    return !this.activeDisabledServices.includes(code);
  }

  toggleService(code: string) {
    if (this.activeDisabledServices.includes(code)) {
      this.activeDisabledServices = this.activeDisabledServices.filter((c) => c !== code);
    } else {
      this.activeDisabledServices = [...this.activeDisabledServices, code];
    }
  }

  saveServices() {
    if (!this.selectedSchoolForServices) return;
    this.savingServices = true;

    this.auth.updateSchoolServices(this.selectedSchoolForServices.id, this.activeDisabledServices).subscribe({
      next: (res) => {
        this.savingServices = false;
        if (this.selectedSchoolForServices) {
          this.selectedSchoolForServices.disabledServices = [...this.activeDisabledServices];
        }
        this.toast.success(res.message || 'Service restrictions updated successfully!');
        this.closeServicesModal();
      },
      error: (err) => {
        this.savingServices = false;
        this.toast.error(err.error?.message || 'Failed to save service restrictions');
      },
    });
  }

  toggleSchoolStatus(school: SchoolItemWithStats) {
    const isCurrentlyActive = school.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = isCurrentlyActive ? 'deboard/suspend' : 'reactivate';

    if (!confirm(`Are you sure you want to ${actionLabel} "${school.name}"?`)) {
      return;
    }

    this.auth.updateSchoolStatus(school.id, newStatus).subscribe({
      next: (res) => {
        school.status = newStatus;
        this.toast.success(res.message || `School status updated to ${newStatus}`);
      },
      error: (err) => {
        this.toast.error(err.error?.message || `Failed to ${actionLabel} school`);
      },
    });
  }

  getActiveServicesCount(school: SchoolItemWithStats): number {
    const disabledCount = school.disabledServices?.length || 0;
    return Math.max(0, this.availableServices.length - disabledCount);
  }

  openPricingModal(school: SchoolItemWithStats) {
    this.selectedSchoolForPricing = school;
    this.editingRate = school.subscription?.perStudentFee || 20;
    this.adjustmentType = 'NONE';
    this.walletAdjustmentAmount = null;
    this.adjustmentReason = '';
    this.showPricingModal = true;
    this.loadingLivePricing = true;
    this.modalService.open('SUPER_ADMIN_PRICING');

    // Direct live fetch from subscription API so root console always has freshest database balance
    this.api.get('subscription/overview', { schoolId: school.id }).subscribe({
      next: (res: any) => {
        this.loadingLivePricing = false;
        if (res?.wallet && this.selectedSchoolForPricing) {
          this.selectedSchoolForPricing.wallet.balance = Number(res.wallet.balance);
          this.selectedSchoolForPricing.wallet.currency = res.wallet.currency || 'INR';
        }
        if (res?.subscription && this.selectedSchoolForPricing) {
          this.editingRate = Number(res.subscription.per_student_fee) || 20;
          this.selectedSchoolForPricing.subscription.perStudentFee = this.editingRate;
        }
      },
      error: () => {
        this.loadingLivePricing = false;
      },
    });
  }

  closePricingModal() {
    this.showPricingModal = false;
    this.modalService.close();
  }

  savePricing() {
    if (!this.selectedSchoolForPricing) return;
    if (this.editingRate <= 0) {
      this.toast.error('Per-student fee must be greater than zero.');
      return;
    }

    let finalAdjustment = 0;
    if (this.adjustmentType === 'CREDIT') {
      finalAdjustment = Math.abs(Number(this.walletAdjustmentAmount || 0));
    } else if (this.adjustmentType === 'DEBIT') {
      finalAdjustment = -Math.abs(Number(this.walletAdjustmentAmount || 0));
    }

    if (finalAdjustment !== 0 && !this.adjustmentReason.trim()) {
      this.toast.error('Please specify a mandatory audit reason for this wallet adjustment.');
      return;
    }

    this.savingPricing = true;
    this.api
      .post('subscription/rate/update', {
        schoolId: this.selectedSchoolForPricing.id,
        perStudentFee: this.editingRate,
        walletAdjustment: finalAdjustment,
        reason: this.adjustmentReason.trim() || 'Super Admin Pricing & Balance Update',
      })
      .subscribe({
        next: () => {
          this.savingPricing = false;
          const adjMsg =
            finalAdjustment !== 0
              ? ` and wallet ${
                  finalAdjustment > 0
                    ? 'credited by ₹' + finalAdjustment
                    : 'debited by ₹' + Math.abs(finalAdjustment)
                }`
              : '';
          this.toast.success(`Pricing updated to ₹${this.editingRate}/student${adjMsg}!`);
          this.closePricingModal();
          this.loadSchools();
        },
        error: (err) => {
          this.savingPricing = false;
          this.toast.error(err.error?.message || 'Failed to update subscription pricing');
        },
      });
  }

  copyCredentials(email: string) {
    navigator.clipboard?.writeText(email);
    this.toast.info(`Copied email: ${email}`);
  }
}

