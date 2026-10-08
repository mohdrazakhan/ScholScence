import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

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
];

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Banner -->
      <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
              Platform Root / Super Admin
            </span>
            <span class="text-xs text-slate-300">•</span>
            <span class="text-xs font-semibold text-slate-600">Multi-Tenant Governance</span>
          </div>

          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            School Onboarding, Deboarding & Service Restrictions
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Provision new institutions, suspend/reactivate campuses, and configure granular service permissions per school.
          </p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <button (click)="loadSchools()" [disabled]="loading"
                  class="px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-[2px_2px_8px_#cbd5e1,-2px_-2px_8px_#ffffff] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
            <span [class.animate-spin]="loading">↻</span>
            <span>Refresh Campus Data</span>
          </button>
          <button (click)="openOnboardModal()"
                  class="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] transition-all flex items-center gap-2 active:scale-[0.99] cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Onboard New School & Admin</span>
          </button>
        </div>
      </div>

      <!-- Super Admin Governance Policy Notice -->
      <div class="p-4 sm:p-5 rounded-3xl bg-indigo-50/80 border border-indigo-200/90 text-indigo-950 flex items-start gap-3.5 shadow-xs">
        <div class="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="text-xs space-y-1">
          <p class="font-black text-indigo-950 text-sm tracking-tight">Root Super Admin Governance Boundaries</p>
          <p class="text-indigo-800 leading-relaxed">
            Super Admin root access is strictly restricted to <strong>onboarding new schools</strong>, <strong>deboarding (suspending/reactivating) campuses</strong>, and <strong>allowing or disallowing community services</strong> (e.g. Timetable, Complaints, Attendance, etc.).
            Direct modification of internal school data (classes, subjects, timetable, students, complaints) is prohibited under root login. To manage internal school operations, please sign in via the standard login portal using authorized School Admin credentials.
          </p>
        </div>
      </div>

      <!-- Network Summary Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-lg border border-indigo-100 shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Campuses</div>
            <div class="text-xl font-black text-slate-900 mt-0.5">{{ schools.length }}</div>
            <div class="text-[10px] text-slate-500">Onboarded institutional tenants</div>
          </div>
        </div>

        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-lg border border-emerald-100 shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Campuses</div>
            <div class="text-xl font-black text-emerald-600 mt-0.5">{{ activeSchoolsCount }}</div>
            <div class="text-[10px] text-slate-500">{{ suspendedSchoolsCount }} suspended / deboarded</div>
          </div>
        </div>

        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-lg border border-purple-100 shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Network Students</div>
            <div class="text-xl font-black text-slate-900 mt-0.5">{{ totalStudents }}</div>
            <div class="text-[10px] text-slate-500">Across all institutions</div>
          </div>
        </div>

        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-lg border border-amber-100 shrink-0">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Controls</div>
            <div class="text-xl font-black text-amber-600 mt-0.5">7 Services</div>
            <div class="text-[10px] text-slate-500">Configurable per community</div>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div class="w-full sm:w-80">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search school name, code, city, admin email..."
                 class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
        </div>

        <div class="text-xs text-slate-500 font-medium">
          Showing <strong class="text-slate-800">{{ filteredSchools.length }}</strong> of {{ schools.length }} Schools
        </div>
      </div>

      <!-- Campuses Grid List -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div *ngFor="let s of filteredSchools"
             class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
          
          <div>
            <!-- Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3.5">
                <!-- School Logo / Avatar Box (Fixed Small Size) -->
                <div class="w-11 h-11 min-w-[44px] max-w-[44px] h-[44px] min-h-[44px] max-h-[44px] rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center overflow-hidden shrink-0 mt-0.5 p-1">
                  <img *ngIf="s.logoUrl || s.logo_url" [src]="s.logoUrl || s.logo_url" alt="{{ s.name }} Logo" class="w-full h-full max-w-full max-h-full object-contain pointer-events-none" />
                  <div *ngIf="!(s.logoUrl || s.logo_url)" class="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-inner">
                    {{ (s.name || 'S').charAt(0).toUpperCase() }}
                  </div>
                </div>

                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-xl bg-slate-900 text-white">
                      {{ s.code }}
                    </span>
                    
                    <!-- Status Pill -->
                    <span *ngIf="s.status === 'ACTIVE'"
                          class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      ACTIVE
                    </span>
                    <span *ngIf="s.status !== 'ACTIVE'"
                          class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      DEBOARDED / SUSPENDED
                    </span>

                    <!-- Allowed Services Badge -->
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {{ getActiveServicesCount(s) }}/7 Services Allowed
                    </span>

                    <!-- SaaS Subscription Rate Badge -->
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span>🏷️</span>
                      <span>₹{{ s.subscription?.perStudentFee || 20 }}/student/mo</span>
                    </span>

                    <!-- Wallet Balance Badge -->
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1"
                          [ngClass]="(s.wallet?.balance || 0) < 0 
                            ? 'bg-rose-50 text-rose-800 border-rose-200' 
                            : 'bg-slate-50 text-slate-800 border-slate-200'">
                      <span>💳 Wallet: ₹{{ (s.wallet?.balance || 0) | number:'1.2-2' }}</span>
                      <span *ngIf="(s.wallet?.balance || 0) < 0" class="text-[9px] uppercase px-1 rounded bg-rose-200 text-rose-900 font-bold">Arrears</span>
                    </span>
                  </div>
                  <h3 class="text-base font-black text-slate-900 mt-1.5">{{ s.name }}</h3>
                  <p class="text-xs text-slate-500">{{ s.addressLine1 ? s.addressLine1 + ', ' : '' }}{{ s.city }}{{ s.state ? ', ' + s.state : '' }}</p>
                </div>
              </div>

              <!-- Root Governance Actions: Services, Pricing & Wallet, Deboard, Binary Support -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Binary Support Login Button -->
                <button (click)="enterSupportLogin(s)"
                        [disabled]="s.status !== 'ACTIVE'"
                        title="Instant binary support login to configure faculty, timetable, classes without school credentials"
                        class="px-3 py-2 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>🎧 Support Login</span>
                </button>

                <!-- Manage Services Button -->
                <button (click)="openServicesModal(s)"
                        title="Manage and restrict community services for this school"
                        class="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Services</span>
                </button>

                <!-- Edit SaaS Pricing & Wallet Button -->
                <button (click)="openPricingModal(s)"
                        title="Configure per-student subscription rate and adjust school prepaid/postpaid wallet"
                        class="px-3 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Pricing & Wallet</span>
                </button>

                <!-- Deboard / Reactivate Button -->
                <button *ngIf="s.status === 'ACTIVE'"
                        (click)="toggleSchoolStatus(s)"
                        title="Deboard and suspend this institution"
                        class="px-3 py-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Deboard</span>
                </button>

                <button *ngIf="s.status !== 'ACTIVE'"
                        (click)="toggleSchoolStatus(s)"
                        title="Reactivate this institution"
                        class="px-3 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Reactivate</span>
                </button>
              </div>
            </div>

            <!-- School Admin Profile Banner -->
            <div class="mt-4 p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200/90 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary School Administrator</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">SCHOOL_ADMIN</span>
              </div>
              <div *ngIf="s.admin; else noAdmin">
                <div class="text-xs font-black text-slate-900">{{ s.admin.fullName }}</div>
                <div class="flex items-center justify-between text-xs text-slate-600 mt-0.5">
                  <span class="font-mono text-[11px]">{{ s.admin.email }}</span>
                  <button (click)="copyCredentials(s.admin.email)" class="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                    Copy Login
                  </button>
                </div>
              </div>
              <ng-template #noAdmin>
                <div class="text-xs text-slate-400 italic">No primary administrator provisioned yet.</div>
              </ng-template>
              <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                Notice: Managing this school's curriculum, classes, or students requires logging in as this School Admin via the standard login portal.
              </div>
            </div>

            <!-- Stats Bar -->
            <div class="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold">Students</div>
                <div class="text-sm font-black text-slate-900">{{ s.stats.studentsCount }}</div>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold">Classes</div>
                <div class="text-sm font-black text-slate-900">{{ s.stats.classesCount }}</div>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold">Subjects</div>
                <div class="text-sm font-black text-slate-900">{{ s.stats.subjectsCount }}</div>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-[10px] text-slate-400 font-bold">Faculty</div>
                <div class="text-sm font-black text-slate-900">{{ s.stats.totalStaffCount }}</div>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Onboarded: {{ s.createdAt | date:'mediumDate' }}</span>
            <span class="text-[11px] font-semibold text-slate-400">Isolated Root Governance</span>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: ONBOARD NEW SCHOOL & INITIAL ADMIN                    -->
      <!-- ============================================================== -->
      <div *ngIf="showOnboardModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                Tenant Onboarding Engine
              </span>
              <h3 class="text-base font-black text-slate-900 tracking-tight mt-1">Onboard New Institution & Provision Admin</h3>
              <p class="text-xs text-slate-500">Creates a clean, isolated school workspace and provisions the primary School Administrator account.</p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" (click)="autoFillSampleSchool()"
                      class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5">
                <span>⚡ Auto-Fill Sample</span>
              </button>
              <button (click)="showOnboardModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <!-- SECTION 1: INSTITUTION PROFILE -->
            <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 font-bold flex items-center justify-between">
              <span>1. Institutional Identity & Campus Details</span>
              <span class="text-[10px] text-indigo-600 font-medium">Session 2026-2027 Auto-Linked</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">School Name *</label>
                <input type="text" [(ngModel)]="newSchool.name" (input)="onSchoolNameChange()" placeholder="e.g. St. Xavier International School"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Unique School Code *</label>
                <input type="text" [(ngModel)]="newSchool.code" placeholder="e.g. SXIS01"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Education Board / Affiliation</label>
                <select [(ngModel)]="newSchool.affiliation"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
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
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">State</label>
                <input type="text" [(ngModel)]="newSchool.state" placeholder="e.g. Delhi"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Campus Address</label>
                <input type="text" [(ngModel)]="newSchool.addressLine1" placeholder="e.g. Sector 14, Dwarka"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">School Official Email</label>
                <input type="email" [(ngModel)]="newSchool.email" placeholder="contact@stxavier.edu.in"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- SECTION 2: INITIAL SCHOOL ADMIN ACCOUNT -->
            <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-900 font-bold mt-3">
              2. Initial School Administrator User Account (Binary Login)
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin First Name *</label>
                <input type="text" [(ngModel)]="newSchool.adminFirstName" placeholder="e.g. Ramesh"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin Last Name</label>
                <input type="text" [(ngModel)]="newSchool.adminLastName" placeholder="e.g. Verma"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin Login Email *</label>
                <input type="email" [(ngModel)]="newSchool.adminEmail" placeholder="admin@stxavier.edu.in"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Admin Mobile Phone</label>
                <input type="text" [(ngModel)]="newSchool.adminPhone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Initial Password</label>
              <input type="text" [(ngModel)]="newSchool.adminPassword" placeholder="password123"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              <p class="text-[10px] text-slate-400 mt-1">Default is 'password123'. School admin can change it upon initial login.</p>
            </div>

            <!-- SECTION 3: SAAS SUBSCRIPTION & PER-STUDENT PRICING -->
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 font-bold mt-3 flex items-center justify-between">
              <span>3. SaaS Subscription & Per-Student Rate</span>
              <span class="text-[10px] text-amber-800 font-medium">B2B Monthly License</span>
            </div>

            <div class="space-y-2">
              <label class="block font-bold text-slate-700 mb-1">Per-Student Monthly Fee (₹) *</label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input type="number" [(ngModel)]="newSchool.perStudentFee" min="1" step="1"
                         class="w-full pl-8 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" *ngFor="let rate of [15, 20, 25, 30, 50]"
                          (click)="newSchool.perStudentFee = rate"
                          [class.bg-slate-900]="newSchool.perStudentFee === rate"
                          [class.text-white]="newSchool.perStudentFee === rate"
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
          </div>

          <div *ngIf="onboardError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
            {{ onboardError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showOnboardModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="submitOnboardSchool()" [disabled]="onboarding"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
              <span *ngIf="!onboarding">Provision & Onboard School</span>
              <span *ngIf="onboarding">Provisioning Database...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 2: MANAGE & RESTRICT INSTITUTIONAL SERVICES               -->
      <!-- ============================================================== -->
      <div *ngIf="showServicesModal && selectedSchoolForServices"
           class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-start gap-3">
              <!-- Services Modal Logo Box -->
              <div class="w-10 h-10 min-w-[40px] max-w-[40px] h-[40px] min-h-[40px] max-h-[40px] rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1 mt-0.5">
                <img *ngIf="selectedSchoolForServices.logoUrl || selectedSchoolForServices.logo_url" [src]="selectedSchoolForServices.logoUrl || selectedSchoolForServices.logo_url" class="w-full h-full max-w-full max-h-full object-contain pointer-events-none" />
                <div *ngIf="!(selectedSchoolForServices.logoUrl || selectedSchoolForServices.logo_url)" class="w-full h-full rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {{ (selectedSchoolForServices.name || 'S').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                    Service Governance
                  </span>
                  <span class="text-xs font-mono font-bold text-slate-500">{{ selectedSchoolForServices.code }}</span>
                </div>
                <h3 class="text-base font-black text-slate-900 tracking-tight mt-1">
                  Community Service Permissions: {{ selectedSchoolForServices.name }}
                </h3>
                <p class="text-xs text-slate-500">
                  Allow or disallow particular platform services for this institution. Disallowed services are immediately hidden from the school portal and rejected by backend guards.
                </p>
              </div>
            </div>
            <button (click)="showServicesModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Services List -->
          <div class="space-y-3 text-xs">
            <div *ngFor="let svc of availableServices"
                 class="p-4 rounded-2xl border transition-all flex items-center justify-between gap-4"
                 [class.bg-white]="isServiceAllowed(svc.code)"
                 [class.border-slate-200]="isServiceAllowed(svc.code)"
                 [class.shadow-xs]="isServiceAllowed(svc.code)"
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

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div class="text-[11px] text-slate-500">
              Allowed: <strong>{{ availableServices.length - activeDisabledServices.length }}</strong> of {{ availableServices.length }}
            </div>

            <div class="flex items-center gap-2.5">
              <button (click)="showServicesModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
                Cancel
              </button>
              <button (click)="saveServices()" [disabled]="savingServices"
                      class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
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
      <div *ngIf="showPricingModal && selectedSchoolForPricing" class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-4 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-start gap-3">
              <!-- Pricing Modal Logo Box -->
              <div class="w-10 h-10 min-w-[40px] max-w-[40px] h-[40px] min-h-[40px] max-h-[40px] rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-1 mt-0.5">
                <img *ngIf="selectedSchoolForPricing.logoUrl || selectedSchoolForPricing.logo_url" [src]="selectedSchoolForPricing.logoUrl || selectedSchoolForPricing.logo_url" class="w-full h-full max-w-full max-h-full object-contain pointer-events-none" />
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
                    <span>⚡</span> Fetching real-time balance...
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
            <button (click)="showPricingModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

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
                       class="w-full pl-8 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" *ngFor="let rate of [15, 20, 25, 30, 50]"
                        (click)="editingRate = rate"
                        [class.bg-slate-900]="editingRate === rate"
                        [class.text-white]="editingRate === rate"
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
                        [class.bg-slate-900]="adjustmentType === 'NONE'"
                        [class.text-white]="adjustmentType === 'NONE'"
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
                        class="py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border">
                  ➕ Credit (+)
                </button>

                <button type="button" (click)="adjustmentType = 'DEBIT'"
                        [class.bg-rose-600]="adjustmentType === 'DEBIT'"
                        [class.text-white]="adjustmentType === 'DEBIT'"
                        [class.bg-rose-50]="adjustmentType !== 'DEBIT'"
                        [class.text-rose-800]="adjustmentType !== 'DEBIT'"
                        [class.border-rose-200]="adjustmentType !== 'DEBIT'"
                        class="py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border">
                  ➖ Debit (-)
                </button>
              </div>
            </div>

            <!-- Adjustment Amount & Mandatory Reason Fields -->
            <div *ngIf="adjustmentType !== 'NONE'" class="space-y-3 p-3.5 bg-[#f8fafc] border border-slate-200 rounded-2xl animate-fadeIn">
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
                         class="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-800 shadow-xs" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Mandatory Audit Reason * <span class="text-[10px] text-slate-400 font-normal">(Visible on School's Ledger)</span>
                </label>
                <input type="text" [(ngModel)]="adjustmentReason"
                       placeholder="e.g. Offline Cheque Clearance #94821 / Security Deposit Adjustment / Promotional Waiver"
                       class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-xs" />
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

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showPricingModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="savePricing()" [disabled]="savingPricing || (adjustmentType !== 'NONE' && (!(walletAdjustmentAmount || 0) || !adjustmentReason.trim()))"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
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

  schools: SchoolItemWithStats[] = [];
  searchQuery = '';
  loading = false;

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
    if (!this.searchQuery.trim()) return this.schools;
    const q = this.searchQuery.toLowerCase().trim();
    return this.schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.admin?.email && s.admin.email.toLowerCase().includes(q)) ||
        (s.admin?.fullName && s.admin.fullName.toLowerCase().includes(q))
    );
  }

  ngOnInit() {
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
  }

  onSchoolNameChange() {
    const name = this.newSchool.name.trim();
    if (!name) return;

    // Generate acronym from capital letters or words
    const words = name.split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
    } else {
      code = name.slice(0, 4).toUpperCase();
    }
    
    // Append 01 or current count
    this.newSchool.code = `${code}01`;

    if (!this.newSchool.adminEmail || this.newSchool.adminEmail.includes('@')) {
      const cleanDomain = words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).join('');
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
    this.toast.info('⚡ Auto-filled sample school data!');
  }

  submitOnboardSchool() {
    if (!this.newSchool.name.trim() || !this.newSchool.code.trim() || !this.newSchool.adminEmail.trim() || !this.newSchool.adminFirstName.trim()) {
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
      next: (res) => {
        this.onboarding = false;
        this.toast.success(`School "${this.newSchool.name}" successfully onboarded with SaaS rate ₹${this.newSchool.perStudentFee}/student!`);
        this.showOnboardModal = false;
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
        this.showServicesModal = false;
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

  enterSupportLogin(school: SchoolItemWithStats) {
    if (school.status !== 'ACTIVE') {
      this.toast.error('Cannot enter support session for a suspended institution.');
      return;
    }

    this.auth.enterSupportSession(school.id).subscribe({
      next: () => {
        this.toast.success(`Binary Support Active: Switched to "${school.name}"`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toast.error(err.message || 'Failed to initiate support session');
      },
    });
  }

  openPricingModal(school: SchoolItemWithStats) {
    this.selectedSchoolForPricing = school;
    this.editingRate = school.subscription?.perStudentFee || 20;
    this.adjustmentType = 'NONE';
    this.walletAdjustmentAmount = null;
    this.adjustmentReason = '';
    this.showPricingModal = true;
    this.loadingLivePricing = true;

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
    this.api.post('subscription/rate/update', {
      schoolId: this.selectedSchoolForPricing.id,
      perStudentFee: this.editingRate,
      walletAdjustment: finalAdjustment,
      reason: this.adjustmentReason.trim() || 'Super Admin Pricing & Balance Update',
    }).subscribe({
      next: (res: any) => {
        this.savingPricing = false;
        const adjMsg = finalAdjustment !== 0
          ? ` and wallet ${finalAdjustment > 0 ? 'credited by ₹' + finalAdjustment : 'debited by ₹' + Math.abs(finalAdjustment)}`
          : '';
        this.toast.success(`Pricing updated to ₹${this.editingRate}/student${adjMsg}!`);
        this.showPricingModal = false;
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
