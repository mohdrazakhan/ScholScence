import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';
import { SupabaseService } from '../../core/services/supabase.service';

export interface SchoolItemWithStats {
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

export interface ServiceDefinition {
  code: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export interface LeadActivity {
  id: string;
  type: 'CALL' | 'MEETING' | 'NOTE' | 'REQUIREMENT';
  title: string;
  description: string;
  outcome?: string;
  scheduledAt?: string;
  meetingMode?: 'IN_PERSON' | 'GOOGLE_MEET' | 'ZOOM' | 'PHONE';
  loggedAt: string;
  loggedBy: string;
}

export interface PlatformLead {
  id: string;
  schoolName: string;
  fullName: string;
  phone: string;
  email?: string;
  role?: string;
  city?: string;
  state?: string;
  status: 'NEW' | 'CONTACTED' | 'MEETING_SCHEDULED' | 'DEMO_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
  notes?: string;
  contactPerson: string;
  contactDesignation: string;
  keyConnections?: string;
  requirements?: string;
  currentErp?: string;
  estimatedStudents: number;
  targetRate: number;
  nextFollowupDate?: string;
  targetDeadline?: string;
  activities: LeadActivity[];
  convertedSchoolId?: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyRevenueRecord {
  monthKey: string;
  monthYear: string;
  projectedRevenue: number;
  billedAmount: number;
  collectedAmount: number;
  activeSchoolsCount: number;
  activeStudentsCount: number;
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
    <div class="space-y-6 max-w-7xl mx-auto pb-16 pt-2">
      
      <!-- ============================================================== -->
      <!-- TOP PLATFORM NAVIGATION & MODULE TAB SWITCHER                   -->
      <!-- ============================================================== -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        <!-- Left: Module Tabs -->
        <div class="inline-flex items-center h-11 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-bold shrink-0 flex-wrap gap-1">
          
          <!-- Tab 1: Revenue & Client Analytics -->
          <button (click)="activePlatformTab = 'ANALYTICS'"
                  [class.bg-white]="activePlatformTab === 'ANALYTICS'"
                  [class.text-blue-600]="activePlatformTab === 'ANALYTICS'"
                  [class.shadow-xs]="activePlatformTab === 'ANALYTICS'"
                  [class.text-slate-600]="activePlatformTab !== 'ANALYTICS'"
                  class="h-9 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 hover:text-slate-900">
            <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            <span>Revenue & Client Analytics</span>
          </button>

          <!-- Tab 2: Active Clients Directory -->
          <button (click)="activePlatformTab = 'CLIENTS'"
                  [class.bg-white]="activePlatformTab === 'CLIENTS'"
                  [class.text-blue-600]="activePlatformTab === 'CLIENTS'"
                  [class.shadow-xs]="activePlatformTab === 'CLIENTS'"
                  [class.text-slate-600]="activePlatformTab !== 'CLIENTS'"
                  class="h-9 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 hover:text-slate-900">
            <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18M3 7v14M21 7v14M6 21V11M10 21V11M14 21V11M18 21V11M12 3L2 7h20L12 3z"/>
            </svg>
            <span>Active Clients</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                  [class.bg-blue-50]="activePlatformTab === 'CLIENTS'"
                  [class.text-blue-700]="activePlatformTab === 'CLIENTS'"
                  [class.bg-slate-200]="activePlatformTab !== 'CLIENTS'">{{ schools.length }}</span>
          </button>

          <!-- Tab 3: Track of Leads & Marketing Diary -->
          <button (click)="activePlatformTab = 'LEADS'"
                  [class.bg-white]="activePlatformTab === 'LEADS'"
                  [class.text-blue-600]="activePlatformTab === 'LEADS'"
                  [class.shadow-xs]="activePlatformTab === 'LEADS'"
                  [class.text-slate-600]="activePlatformTab !== 'LEADS'"
                  class="h-9 px-3.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 hover:text-slate-900">
            <svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
            <span>Track of Leads & Diary</span>
            <span *ngIf="dueTodayLeadsCount > 0"
                  class="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse"
                  title="{{ dueTodayLeadsCount }} follow-ups scheduled for today!">
              {{ dueTodayLeadsCount }}
            </span>
            <span *ngIf="dueTodayLeadsCount === 0"
                  class="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                  [class.bg-blue-50]="activePlatformTab === 'LEADS'"
                  [class.text-blue-700]="activePlatformTab === 'LEADS'"
                  [class.bg-slate-200]="activePlatformTab !== 'LEADS'">{{ platformLeads.length }}</span>
          </button>
        </div>

        <!-- Right: Primary Actions based on Active Tab -->
        <div class="flex items-center gap-2.5">
          <button *ngIf="activePlatformTab === 'LEADS'"
                  (click)="openAddLeadModal()"
                  class="h-10 px-4.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Add Prospect School to Diary</span>
          </button>

          <button *ngIf="activePlatformTab === 'CLIENTS'"
                  (click)="openOnboardModal()"
                  class="h-10 px-4.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Onboard New Campus</span>
          </button>

          <button *ngIf="activePlatformTab === 'ANALYTICS'"
                  (click)="loadSchools()"
                  class="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span>Sync Live Stats</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 1: REVENUE & CLIENT ANALYTICS DASHBOARD                    -->
      <!-- ============================================================== -->
      <div *ngIf="activePlatformTab === 'ANALYTICS'" class="space-y-6 animate-fadeIn">
        
        <!-- 1. Revenue & Network KPI Strip -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Total Monthly Revenue (MRR) -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue (MRR)</div>
              <div class="text-2xl font-black text-slate-900 mt-0.5">₹{{ totalMrr | number:'1.0-0' }}</div>
              <div class="text-[11px] text-emerald-600 font-bold truncate flex items-center gap-1 mt-0.5">
                <span>ARR: ₹{{ totalArr | number:'1.0-0' }}</span>
                <span class="text-[10px] text-slate-400 font-normal">/ projected</span>
              </div>
            </div>
          </div>

          <!-- Active Operational Campuses -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M8.5 12l2.5 2.5 5-5" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Client Schools</div>
              <div class="text-2xl font-black text-slate-900 mt-0.5 flex items-center gap-2">
                <span>{{ activeSchoolsCount }}</span>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {{ schools.length ? ((activeSchoolsCount / schools.length) * 100 | number:'1.0-0') : 100 }}% Live
                </span>
              </div>
              <div class="text-[11px] text-slate-500 truncate">Avg {{ averageStudentsPerSchool | number:'1.0-0' }} students / campus</div>
            </div>
          </div>

          <!-- Enrolled Billable Students -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billable Students</div>
              <div class="text-2xl font-black text-slate-900 mt-0.5">{{ totalStudents | number }}</div>
              <div class="text-[11px] text-slate-500 truncate">Avg ₹{{ averagePerStudentFee | number:'1.2-2' }} / student / mo</div>
            </div>
          </div>

          <!-- Collective Wallet Balance -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collective Wallet Balance</div>
              <div class="text-2xl font-black mt-0.5" [class.text-slate-900]="collectiveWalletBalance >= 0" [class.text-rose-600]="collectiveWalletBalance < 0">
                ₹{{ collectiveWalletBalance | number:'1.2-2' }}
              </div>
              <div class="text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                <span *ngIf="arrearsCampusesCount > 0" class="text-rose-600 font-bold">{{ arrearsCampusesCount }} campuses in arrears</span>
                <span *ngIf="arrearsCampusesCount === 0" class="text-emerald-600 font-bold">All campuses solvent</span>
              </div>
            </div>
          </div>

        </div>

        <!-- 2. Collective Monthly SaaS Revenue Breakdown & Period Selector -->
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 space-y-6">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                  SaaS Revenue Ledger
                </span>
                <span class="text-xs text-slate-400">• Multi-tenant Collective Invoicing</span>
              </div>
              <h2 class="text-lg font-black text-slate-900 tracking-tight mt-1">
                Collective Monthly SaaS Earnings & Billings
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                Inspect cross-school monthly earnings, wallet deductions, collections, and active contributing student bases.
              </p>
            </div>

            <!-- Month Selection Pills -->
            <div class="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex-wrap">
              <button *ngFor="let m of monthlyHistory"
                      (click)="selectedMonthKey = m.monthKey"
                      [class.bg-white]="selectedMonthKey === m.monthKey"
                      [class.text-blue-600]="selectedMonthKey === m.monthKey"
                      [class.shadow-xs]="selectedMonthKey === m.monthKey"
                      [class.text-slate-600]="selectedMonthKey !== m.monthKey"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                {{ m.monthYear }}
              </button>
            </div>
          </div>

          <!-- Selected Month Metric Tiles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Collective Billed Revenue ({{ selectedMonthData.monthYear }})</div>
              <div class="text-xl font-black text-slate-900 mt-1">₹{{ selectedMonthData.billedAmount | number:'1.0-0' }}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Invoiced across active client campuses</div>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div class="text-[10px] font-bold text-emerald-800 uppercase">Realized Wallet Collections</div>
              <div class="text-xl font-black text-emerald-900 mt-1">₹{{ selectedMonthData.collectedAmount | number:'1.0-0' }}</div>
              <div class="text-[11px] text-emerald-700 mt-0.5">Debited under row locks successfully</div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div class="text-[10px] font-bold text-slate-400 uppercase">Contributing Campuses & Students</div>
              <div class="text-xl font-black text-slate-900 mt-1">{{ selectedMonthData.activeSchoolsCount }} Campuses</div>
              <div class="text-[11px] text-slate-500 mt-0.5">{{ selectedMonthData.activeStudentsCount | number }} enrolled billable students</div>
            </div>

            <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <div class="text-[10px] font-bold text-indigo-800 uppercase">Collection Realization Rate</div>
              <div class="text-xl font-black text-indigo-900 mt-1">
                {{ (selectedMonthData.collectedAmount / (selectedMonthData.billedAmount || 1)) * 100 | number:'1.1-1' }}%
              </div>
              <div class="text-[11px] text-indigo-700 mt-0.5">SaaS liquidity & realization score</div>
            </div>

          </div>

          <!-- Monthly Historical Bar Comparison Graph -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Past 6 Months Collective Revenue Trend (₹ Billed vs ₹ Collected)</span>
              <div class="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                <span class="flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded-md bg-blue-600 inline-block"></span>
                  <span>Billed SaaS Fees</span>
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                  <span>Realized Collections</span>
                </span>
              </div>
            </div>

            <!-- Bar Chart Container -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-slate-100">
              <div *ngFor="let m of monthlyHistory"
                   (click)="selectedMonthKey = m.monthKey"
                   [class.ring-2]="selectedMonthKey === m.monthKey"
                   [class.ring-blue-500]="selectedMonthKey === m.monthKey"
                   class="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 transition-all cursor-pointer flex flex-col justify-end text-center group">
                
                <div class="h-32 flex items-end justify-center gap-2 px-2 pb-2">
                  <!-- Billed Bar -->
                  <div class="w-5 bg-blue-600 rounded-t-lg transition-all group-hover:bg-blue-700"
                       [style.height.%]="getBarHeightPercent(m.billedAmount)"
                       title="Billed: ₹{{ m.billedAmount | number:'1.0-0' }}">
                  </div>
                  <!-- Collected Bar -->
                  <div class="w-5 bg-emerald-500 rounded-t-lg transition-all group-hover:bg-emerald-600"
                       [style.height.%]="getBarHeightPercent(m.collectedAmount)"
                       title="Collected: ₹{{ m.collectedAmount | number:'1.0-0' }}">
                  </div>
                </div>

                <div class="border-t border-slate-200/80 pt-2">
                  <div class="text-[11px] font-black text-slate-900">{{ m.monthYear }}</div>
                  <div class="text-[10px] text-slate-500 font-bold mt-0.5">₹{{ m.collectedAmount | number:'1.0-0' }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- 3. School-by-School Monthly Revenue Contribution Table -->
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          
          <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">
                Client Schools Revenue Contribution & Financial Health
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Schools ranked by contracted monthly billing (Students × Per-Student Fee) with real-time wallet liquidity.
              </p>
            </div>
            <div class="text-xs font-bold text-slate-500">
              Total Active Clients: <strong class="text-slate-900">{{ activeSchoolsCount }}</strong>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200/80 bg-slate-50/75 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3 px-4"># Rank</th>
                  <th class="py-3 px-4">School / Campus</th>
                  <th class="py-3 px-4">Location</th>
                  <th class="py-3 px-4 text-center">Active Students</th>
                  <th class="py-3 px-4 text-center">Contracted Rate</th>
                  <th class="py-3 px-4 text-right">Monthly Revenue</th>
                  <th class="py-3 px-4 text-right">Wallet Balance</th>
                  <th class="py-3 px-4 text-center">Health</th>
                  <th class="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let s of rankedSchools; let i = index" class="hover:bg-slate-50/60 transition-colors">
                  
                  <!-- Rank -->
                  <td class="py-3 px-4 font-mono font-bold text-slate-400">
                    #{{ i + 1 }}
                  </td>

                  <!-- School Name & Code -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                        <img *ngIf="s.logoUrl || s.logo_url" [src]="s.logoUrl || s.logo_url" class="w-full h-full object-contain pointer-events-none" />
                        <div *ngIf="!(s.logoUrl || s.logo_url)" class="w-full h-full rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                          {{ (s.name || 'S').charAt(0).toUpperCase() }}
                        </div>
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-slate-900 truncate max-w-[220px]">{{ s.name }}</div>
                        <div class="text-[10px] font-mono text-slate-400">{{ s.code }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Location -->
                  <td class="py-3 px-4 text-slate-600">
                    {{ s.city || 'National Campus' }}
                  </td>

                  <!-- Active Students -->
                  <td class="py-3 px-4 text-center font-bold text-slate-800">
                    {{ s.stats?.studentsCount || 0 | number }}
                  </td>

                  <!-- Contracted Rate -->
                  <td class="py-3 px-4 text-center font-bold text-blue-600 font-mono">
                    ₹{{ s.subscription?.perStudentFee || 20 | number:'1.2-2' }}
                  </td>

                  <!-- Monthly Revenue -->
                  <td class="py-3 px-4 text-right font-black text-slate-900 font-mono">
                    ₹{{ (s.stats?.studentsCount || 0) * (s.subscription?.perStudentFee || 20) | number:'1.2-2' }}
                  </td>

                  <!-- Wallet Balance -->
                  <td class="py-3 px-4 text-right font-bold font-mono"
                      [class.text-rose-600]="(s.wallet?.balance || 0) < 0"
                      [class.text-emerald-700]="(s.wallet?.balance || 0) >= 0">
                    ₹{{ s.wallet?.balance || 0 | number:'1.2-2' }}
                  </td>

                  <!-- Health Badge -->
                  <td class="py-3 px-4 text-center">
                    <span *ngIf="(s.wallet?.balance || 0) >= 0"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Prepaid
                    </span>
                    <span *ngIf="(s.wallet?.balance || 0) < 0"
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Arrears
                    </span>
                  </td>

                  <!-- Quick Actions -->
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="openPricingModal(s)"
                              title="Configure SaaS rate and manual wallet adjustments"
                              class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all cursor-pointer">
                        Rate & Wallet
                      </button>
                      <button (click)="enterSupportLogin(s)"
                              title="Enter binary support session"
                              class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-all cursor-pointer">
                        Support
                      </button>
                    </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: ACTIVE CLIENTS DIRECTORY (EXISTING MANAGEMENT)           -->
      <!-- ============================================================== -->
      <div *ngIf="activePlatformTab === 'CLIENTS'" class="space-y-6 animate-fadeIn">
        
        <!-- 1. Network KPI Strip -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
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

        <!-- 2. Search, Filter, Actions Toolbar -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3 sm:px-4 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div class="flex items-center gap-3 flex-1 flex-wrap min-w-0">
            <!-- Search input -->
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

          <!-- Right: Sort, View Toggle, Onboard Action -->
          <div class="flex items-center gap-2.5 shrink-0">
            <!-- Sort dropdown -->
            <div class="relative">
              <select [(ngModel)]="sortBy" (ngModelChange)="currentPage = 1"
                      class="h-10 pl-3 pr-8 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl outline-none appearance-none cursor-pointer transition-colors focus:border-blue-500">
                <option value="NAME">Sort: Name (A-Z)</option>
                <option value="STUDENTS">Sort: Most Students</option>
                <option value="NEWEST">Sort: Newest First</option>
              </select>
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </span>
            </div>

            <!-- View mode toggle -->
            <div class="inline-flex items-center h-10 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button (click)="viewMode = 'GRID'"
                      [class.bg-white]="viewMode === 'GRID'"
                      [class.text-slate-900]="viewMode === 'GRID'"
                      [class.shadow-xs]="viewMode === 'GRID'"
                      [class.text-slate-500]="viewMode !== 'GRID'"
                      class="h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:text-slate-900" title="Grid View">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="7" height="7" x="3" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="3" rx="1"/>
                  <rect width="7" height="7" x="14" y="14" rx="1"/>
                  <rect width="7" height="7" x="3" y="14" rx="1"/>
                </svg>
              </button>
              <button (click)="viewMode = 'TABLE'"
                      [class.bg-white]="viewMode === 'TABLE'"
                      [class.text-slate-900]="viewMode === 'TABLE'"
                      [class.shadow-xs]="viewMode === 'TABLE'"
                      [class.text-slate-500]="viewMode !== 'TABLE'"
                      class="h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:text-slate-900" title="Table View">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
              </button>
            </div>
          </div>

        </div>

        <!-- 3. Cards Grid View -->
        <div *ngIf="viewMode === 'GRID' && !loading && paginatedSchools.length > 0"
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let school of paginatedSchools"
               class="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            
            <div class="p-6 space-y-4">
              <!-- Top Row: Logo, Title, Code, Status -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform p-1">
                    <img *ngIf="school.logoUrl || school.logo_url" [src]="school.logoUrl || school.logo_url" [alt]="school.name" class="w-full h-full object-contain pointer-events-none" />
                    <div *ngIf="!(school.logoUrl || school.logo_url)" class="w-full h-full rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {{ (school.name || 'S').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <h3 class="font-black text-slate-900 text-sm tracking-tight truncate leading-tight" [title]="school.name">
                      {{ school.name }}
                    </h3>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {{ school.code }}
                      </span>
                      <button (click)="copySchoolCode(school, $event)"
                              title="Copy School Code"
                              class="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer">
                        <svg *ngIf="copiedCodeId !== school.id" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                        <span *ngIf="copiedCodeId === school.id" class="text-[9px] text-emerald-600 font-bold">✓</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Status pill -->
                <span *ngIf="school.status === 'ACTIVE'"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active
                </span>
                <span *ngIf="school.status !== 'ACTIVE'"
                      class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shrink-0 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Suspended
                </span>
              </div>

              <!-- Campus Location & Admin details -->
              <div class="space-y-1.5 text-xs text-slate-600 pt-1">
                <div class="flex items-center gap-2 text-slate-500">
                  <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span class="truncate">{{ school.city || 'Campus City' }}, {{ school.state || 'India' }}</span>
                </div>
                <div *ngIf="school.admin?.email" class="flex items-center justify-between gap-2 text-slate-500">
                  <div class="flex items-center gap-2 min-w-0">
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <span class="truncate text-[11px] font-mono text-slate-700">{{ school.admin?.email }}</span>
                  </div>
                  <button (click)="copyAdminEmail(school.admin?.email || '', school.id, $event)"
                          title="Copy Admin Login Email"
                          class="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer shrink-0">
                    <svg *ngIf="copiedAdminEmailId !== school.id" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                    <span *ngIf="copiedAdminEmailId === school.id" class="text-[9px] text-emerald-600 font-bold">✓</span>
                  </button>
                </div>
              </div>

              <!-- Campus Metrics 4-tile grid -->
              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <div class="text-[9px] font-bold text-slate-400 uppercase">Students</div>
                  <div class="text-sm font-black text-slate-900 mt-0.5">{{ school.stats?.studentsCount || 0 }}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <div class="text-[9px] font-bold text-slate-400 uppercase">Staff</div>
                  <div class="text-sm font-black text-slate-900 mt-0.5">{{ school.stats?.totalStaffCount || 0 }}</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <div class="text-[9px] font-bold text-slate-400 uppercase">SaaS Rate</div>
                  <div class="text-sm font-black text-blue-600 mt-0.5 font-mono">₹{{ school.subscription?.perStudentFee || 20 }}/mo</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <div class="text-[9px] font-bold text-slate-400 uppercase">Wallet</div>
                  <div class="text-sm font-black mt-0.5 font-mono" [class.text-rose-600]="(school.wallet?.balance || 0) < 0" [class.text-emerald-700]="(school.wallet?.balance || 0) >= 0">
                    ₹{{ school.wallet?.balance || 0 | number:'1.0-0' }}
                  </div>
                </div>
              </div>

            </div>

            <!-- Footer: Quick Action Controls -->
            <div class="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
              
              <!-- Left: Binary Login Button with clean key icon -->
              <button (click)="enterSupportLogin(school)"
                      [disabled]="enteringSupportId === school.id || school.status !== 'ACTIVE'"
                      class="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5M10 13l-4 4-2-2-2 2 4 4 4-4 2 2 4-4"/>
                  <circle cx="7.5" cy="7.5" r="4.5"/>
                </svg>
                <span *ngIf="enteringSupportId !== school.id">Binary Login</span>
                <span *ngIf="enteringSupportId === school.id" class="animate-pulse">Accessing...</span>
              </button>

              <!-- Right: Pricing, Services, Status Toggle -->
              <div class="flex items-center gap-1.5">
                <button (click)="openPricingModal(school)"
                        title="Configure SaaS rate and manual wallet adjustments"
                        class="h-9 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer">
                  Pricing
                </button>

                <button (click)="openServicesModal(school)"
                        title="Configure Core Microservices Governance"
                        class="h-9 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer">
                  Services
                </button>

                <button (click)="toggleSchoolStatus(school)"
                        title="{{ school.status === 'ACTIVE' ? 'Suspend School' : 'Reactivate School' }}"
                        class="h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border"
                        [class.bg-rose-50]="school.status === 'ACTIVE'"
                        [class.text-rose-600]="school.status === 'ACTIVE'"
                        [class.border-rose-200]="school.status === 'ACTIVE'"
                        [class.bg-emerald-50]="school.status !== 'ACTIVE'"
                        [class.text-emerald-700]="school.status !== 'ACTIVE'"
                        [class.border-emerald-200]="school.status !== 'ACTIVE'">
                  <svg *ngIf="school.status === 'ACTIVE'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  <svg *ngIf="school.status !== 'ACTIVE'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </button>
              </div>

            </div>

          </div>
        </div>

        <!-- 4. Table View -->
        <div *ngIf="viewMode === 'TABLE' && !loading && paginatedSchools.length > 0"
             class="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200/80 bg-slate-50/75 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th class="py-3 px-4">School</th>
                  <th class="py-3 px-4">Location</th>
                  <th class="py-3 px-4">Admin</th>
                  <th class="py-3 px-4 text-center">Students</th>
                  <th class="py-3 px-4 text-center">SaaS Rate</th>
                  <th class="py-3 px-4 text-right">Wallet</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let school of paginatedSchools" class="hover:bg-slate-50/60 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                        <img *ngIf="school.logoUrl || school.logo_url" [src]="school.logoUrl || school.logo_url" class="w-full h-full object-contain pointer-events-none" />
                        <div *ngIf="!(school.logoUrl || school.logo_url)" class="w-full h-full rounded-lg bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                          {{ (school.name || 'S').charAt(0).toUpperCase() }}
                        </div>
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-slate-900 truncate max-w-[200px]">{{ school.name }}</div>
                        <div class="text-[10px] font-mono text-slate-400">{{ school.code }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-slate-600">{{ school.city || 'Campus City' }}</td>
                  <td class="py-3 px-4 text-slate-700 font-mono text-[11px]">{{ school.admin?.email || '—' }}</td>
                  <td class="py-3 px-4 text-center font-bold text-slate-800">{{ school.stats?.studentsCount || 0 }}</td>
                  <td class="py-3 px-4 text-center font-bold text-blue-600 font-mono">₹{{ school.subscription?.perStudentFee || 20 }}/mo</td>
                  <td class="py-3 px-4 text-right font-bold font-mono" [class.text-rose-600]="(school.wallet?.balance || 0) < 0" [class.text-emerald-700]="(school.wallet?.balance || 0) >= 0">
                    ₹{{ school.wallet?.balance || 0 | number:'1.2-2' }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span *ngIf="school.status === 'ACTIVE'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                    <span *ngIf="school.status !== 'ACTIVE'" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Suspended</span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="enterSupportLogin(school)" class="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer">
                        Binary Access
                      </button>
                      <button (click)="openPricingModal(school)" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer">
                        Pricing
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. Empty State -->
        <div *ngIf="!loading && paginatedSchools.length === 0"
             class="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <h3 class="font-bold text-slate-800 text-sm">No schools found</h3>
          <p class="text-xs text-slate-500">Try adjusting your search query or status filter above.</p>
        </div>

        <!-- 6. Bottom Pagination Strip (10 per page) -->
        <div *ngIf="filteredSchools.length > 0"
             class="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-3 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="text-xs text-slate-500 font-medium">
            Showing <strong class="text-slate-900 font-bold">{{ paginationStartIndex }}</strong> to
            <strong class="text-slate-900 font-bold">{{ paginationEndIndex }}</strong> of
            <strong class="text-slate-900 font-bold">{{ filteredSchools.length }}</strong> campuses
          </div>

          <div class="inline-flex items-center gap-1">
            <button (click)="setPage(currentPage - 1)"
                    [disabled]="currentPage === 1"
                    class="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1">
              <span>‹</span>
              <span class="hidden sm:inline">Prev</span>
            </button>

            <ng-container *ngFor="let page of pageNumbers">
              <button *ngIf="page !== -1"
                      (click)="setPage(page)"
                      [class.bg-blue-600]="currentPage === page"
                      [class.text-white]="currentPage === page"
                      [class.border-blue-600]="currentPage === page"
                      [class.shadow-xs]="currentPage === page"
                      [class.bg-white]="currentPage !== page"
                      [class.text-slate-700]="currentPage !== page"
                      [class.border-slate-200]="currentPage !== page"
                      class="h-8 min-w-[32px] px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer hover:bg-blue-50">
                {{ page }}
              </button>
              <span *ngIf="page === -1" class="px-1 text-slate-400 text-xs font-bold">...</span>
            </ng-container>

            <button (click)="setPage(currentPage + 1)"
                    [disabled]="currentPage === totalPages"
                    class="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1">
              <span class="hidden sm:inline">Next</span>
              <span>›</span>
            </button>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 3: TRACK OF LEADS & MARKETING DIARY (CRM)                  -->
      <!-- ============================================================== -->
      <div *ngIf="activePlatformTab === 'LEADS'" class="space-y-6 animate-fadeIn">
        
        <!-- 1. Pipeline Summary KPI Strip -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Total Prospects in Diary -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <path d="M9 14l2 2 4-4"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prospects in Diary</div>
              <div class="text-2xl font-black text-slate-900 mt-0.5">{{ platformLeads.length }}</div>
              <div class="text-[11px] text-slate-500 truncate">Schools in outreach pipeline</div>
            </div>
          </div>

          <!-- Scheduled Meetings & Demos -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planned Meetings</div>
              <div class="text-2xl font-black text-slate-900 mt-0.5">{{ scheduledMeetingsCount }}</div>
              <div class="text-[11px] text-indigo-600 font-bold truncate">Campus visits & online demos</div>
            </div>
          </div>

          <!-- Today's Due Follow-ups -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Follow-ups Due</div>
              <div class="text-2xl font-black mt-0.5" [class.text-amber-600]="dueTodayLeadsCount > 0" [class.text-slate-900]="dueTodayLeadsCount === 0">
                {{ dueTodayLeadsCount }}
              </div>
              <div class="text-[11px] text-slate-500 truncate">Immediate call & agenda tasks</div>
            </div>
          </div>

          <!-- Projected Pipeline Revenue -->
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center gap-4 group">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Pipeline MRR</div>
              <div class="text-2xl font-black text-slate-900 mt-0.5">₹{{ projectedPipelineMrr | number:'1.0-0' }}</div>
              <div class="text-[11px] text-emerald-600 font-bold truncate">From prospective student base</div>
            </div>
          </div>

        </div>

        <!-- 2. Urgent Follow-up Alert Banner (Rendered when dueTodayLeads.length > 0) -->
        <div *ngIf="dueTodayLeads.length > 0"
             class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg class="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div>
              <h4 class="text-xs font-black text-amber-900 uppercase tracking-wider">
                Follow-up Priority Alert ({{ dueTodayLeads.length }} Due Today)
              </h4>
              <p class="text-xs text-amber-800 mt-0.5">
                Immediate marketing schedule tasks:
                <strong class="font-bold text-amber-950">
                  {{ dueTodayLeads[0].schoolName }} ({{ dueTodayLeads[0].contactPerson }})
                </strong>
                <span *ngIf="dueTodayLeads.length > 1">and {{ dueTodayLeads.length - 1 }} other school(s)</span>.
              </p>
            </div>
          </div>
          <button (click)="openLeadDiaryModal(dueTodayLeads[0])"
                  class="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
            <span>Open Diary / Log Call</span>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- 3. Leads Toolbar: Search & Stage Filters -->
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-3 sm:px-4 sm:py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div class="flex items-center gap-3 flex-1 flex-wrap min-w-0">
            <!-- Search Leads -->
            <div class="relative flex-1 min-w-[240px] max-w-md">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
                </svg>
              </span>
              <input type="text" [(ngModel)]="leadSearchQuery"
                     placeholder="Search prospect school, contact person, ERP, requirements..."
                     class="w-full h-10 pl-10 pr-9 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-xs text-slate-900 transition-all outline-none placeholder:text-slate-400 font-medium" />
              <button *ngIf="leadSearchQuery" (click)="leadSearchQuery = ''"
                      class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors">
                ✕
              </button>
            </div>

            <!-- Stage Segmented Pills -->
            <div class="inline-flex items-center h-10 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 text-xs font-bold shrink-0 flex-wrap gap-1">
              <button (click)="leadStatusFilter = 'ALL'"
                      [class.bg-white]="leadStatusFilter === 'ALL'"
                      [class.text-blue-600]="leadStatusFilter === 'ALL'"
                      [class.shadow-xs]="leadStatusFilter === 'ALL'"
                      [class.text-slate-500]="leadStatusFilter !== 'ALL'"
                      class="h-8 px-2.5 rounded-lg transition-all cursor-pointer">
                All ({{ platformLeads.length }})
              </button>
              <button (click)="leadStatusFilter = 'MEETING_SCHEDULED'"
                      [class.bg-white]="leadStatusFilter === 'MEETING_SCHEDULED'"
                      [class.text-blue-600]="leadStatusFilter === 'MEETING_SCHEDULED'"
                      [class.shadow-xs]="leadStatusFilter === 'MEETING_SCHEDULED'"
                      [class.text-slate-500]="leadStatusFilter !== 'MEETING_SCHEDULED'"
                      class="h-8 px-2.5 rounded-lg transition-all cursor-pointer">
                Meetings ({{ getStageCount('MEETING_SCHEDULED') }})
              </button>
              <button (click)="leadStatusFilter = 'PROPOSAL_SENT'"
                      [class.bg-white]="leadStatusFilter === 'PROPOSAL_SENT'"
                      [class.text-blue-600]="leadStatusFilter === 'PROPOSAL_SENT'"
                      [class.shadow-xs]="leadStatusFilter === 'PROPOSAL_SENT'"
                      [class.text-slate-500]="leadStatusFilter !== 'PROPOSAL_SENT'"
                      class="h-8 px-2.5 rounded-lg transition-all cursor-pointer">
                Proposals ({{ getStageCount('PROPOSAL_SENT') }})
              </button>
              <button (click)="leadStatusFilter = 'NEGOTIATION'"
                      [class.bg-white]="leadStatusFilter === 'NEGOTIATION'"
                      [class.text-blue-600]="leadStatusFilter === 'NEGOTIATION'"
                      [class.shadow-xs]="leadStatusFilter === 'NEGOTIATION'"
                      [class.text-slate-500]="leadStatusFilter !== 'NEGOTIATION'"
                      class="h-8 px-2.5 rounded-lg transition-all cursor-pointer">
                Negotiation ({{ getStageCount('NEGOTIATION') }})
              </button>
              <button (click)="leadStatusFilter = 'WON'"
                      [class.bg-white]="leadStatusFilter === 'WON'"
                      [class.text-emerald-700]="leadStatusFilter === 'WON'"
                      [class.shadow-xs]="leadStatusFilter === 'WON'"
                      [class.text-slate-500]="leadStatusFilter !== 'WON'"
                      class="h-8 px-2.5 rounded-lg transition-all cursor-pointer">
                Won ({{ getStageCount('WON') }})
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="openAddLeadModal()"
                    class="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
              <span>Add School to Diary</span>
            </button>
          </div>

        </div>

        <!-- 4. Prospect School Cards Grid -->
        <div *ngIf="filteredLeads.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let lead of filteredLeads"
               class="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            
            <div class="p-6 space-y-4">
              
              <!-- Header: School Name, City & Stage Badge -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      {{ lead.city || 'India Campus' }}
                    </span>
                    <span *ngIf="lead.currentErp" class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                      Current: {{ lead.currentErp }}
                    </span>
                  </div>
                  <h3 class="font-black text-slate-900 text-base tracking-tight truncate mt-1" [title]="lead.schoolName">
                    {{ lead.schoolName }}
                  </h3>
                </div>

                <!-- Stage Pill -->
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border"
                      [ngClass]="getStageBadgeClass(lead.status)">
                  {{ formatStage(lead.status) }}
                </span>
              </div>

              <!-- Persons & Connection Records -->
              <div class="space-y-1.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-xs">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-slate-900 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>{{ lead.contactPerson }}</span>
                  </div>
                  <span class="text-[10px] text-slate-500 font-medium">{{ lead.contactDesignation }}</span>
                </div>

                <div class="flex items-center gap-3 text-slate-600 text-[11px] pt-1 border-t border-slate-200/40">
                  <a [href]="'tel:' + lead.phone" class="hover:text-blue-600 font-mono font-bold flex items-center gap-1">
                    <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span>{{ lead.phone }}</span>
                  </a>
                  <span *ngIf="lead.email" class="truncate font-mono text-slate-500">{{ lead.email }}</span>
                </div>

                <!-- Key Connections / Referred By Note -->
                <div *ngIf="lead.keyConnections" class="text-[10px] text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-lg border border-indigo-100 flex items-start gap-1.5 mt-1">
                  <span class="font-bold shrink-0">🤝 Connection:</span>
                  <span class="truncate">{{ lead.keyConnections }}</span>
                </div>
              </div>

              <!-- Requirements & Software Needs -->
              <div *ngIf="lead.requirements" class="space-y-1">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Requirements</div>
                <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white border border-slate-200/60 p-2.5 rounded-xl">
                  {{ lead.requirements }}
                </p>
              </div>

              <!-- Commercial Scale & Target Timeline -->
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div class="text-[9px] font-bold text-slate-400 uppercase">Est. Students & MRR</div>
                  <div class="text-xs font-black text-slate-900 mt-0.5">
                    {{ lead.estimatedStudents | number }} &#64; ₹{{ lead.targetRate }}/mo
                  </div>
                  <div class="text-[10px] text-emerald-600 font-bold mt-0.5">
                    ₹{{ lead.estimatedStudents * lead.targetRate | number:'1.0-0' }} / mo
                  </div>
                </div>

                <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div class="text-[9px] font-bold text-slate-400 uppercase">Next Follow-up</div>
                  <div class="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <svg class="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span class="truncate">{{ lead.nextFollowupDate ? (lead.nextFollowupDate | date:'mediumDate') : 'Not scheduled' }}</span>
                  </div>
                  <div *ngIf="lead.targetDeadline" class="text-[10px] text-slate-500 truncate mt-0.5">
                    Deadline: {{ lead.targetDeadline | date:'shortDate' }}
                  </div>
                </div>
              </div>

              <!-- Diary Activity Count -->
              <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span class="flex items-center gap-1.5 font-medium">
                  <svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span>{{ lead.activities.length }} activity records logged</span>
                </span>
                <span *ngIf="lead.activities.length > 0" class="text-[10px] font-mono text-slate-400">
                  Last: {{ lead.activities[lead.activities.length - 1].loggedAt | date:'shortDate' }}
                </span>
              </div>

            </div>

            <!-- Card Actions -->
            <div class="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
              
              <!-- Open Diary Modal -->
              <button (click)="openLeadDiaryModal(lead)"
                      class="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>Open Diary</span>
              </button>

              <div class="flex items-center gap-1.5">
                <!-- Quick Call Action -->
                <button (click)="openQuickCall(lead)"
                        title="Log a phone call with notes"
                        class="h-9 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>Call</span>
                </button>

                <!-- Quick Meeting Action -->
                <button (click)="openQuickMeeting(lead)"
                        title="Plan and schedule a campus meeting or demo"
                        class="h-9 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>Meeting</span>
                </button>

                <!-- 1-Click Convert to Onboarded School -->
                <button (click)="convertLeadToSchool(lead)"
                        title="Convert and onboard this prospect school directly into the active tenant database!"
                        class="h-9 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  <span>Onboard</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        <!-- 5. Empty State -->
        <div *ngIf="filteredLeads.length === 0"
             class="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <h3 class="font-bold text-slate-800 text-sm">No prospect schools found</h3>
          <p class="text-xs text-slate-500">Add a new school to your marketing diary or adjust the stage filter above.</p>
          <button (click)="openAddLeadModal()"
                  class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
            + Add First Prospect School
          </button>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: ONBOARD NEW CAMPUS (PRE-FILL CAPABLE)                  -->
      <!-- ============================================================== -->
      <div *ngIf="showOnboardModal" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closeOnboardModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M3 7v14M21 7v14M6 21V11M10 21V11M14 21V11M18 21V11M12 3L2 7h20L12 3z"/></svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Onboard New Campus Tenant</h3>
                <p class="text-xs text-slate-500">Provisions institutional database schema, academic calendar, and root credentials.</p>
              </div>
            </div>
            <button (click)="closeOnboardModal()" class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 text-xs">
            <div *ngIf="onboardError" class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              {{ onboardError }}
            </div>

            <!-- School Details -->
            <div class="space-y-3">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution Details</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">School Name *</label>
                  <input type="text" [(ngModel)]="newSchool.name" (ngModelChange)="onSchoolNameChange()"
                         placeholder="e.g. St. Xavier's International School"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Unique School Code *</label>
                  <input type="text" [(ngModel)]="newSchool.code"
                         placeholder="e.g. SXIS01"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:bg-white focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Affiliation / Board</label>
                  <select [(ngModel)]="newSchool.affiliation" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none">
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="STATE">State Board</option>
                    <option value="IB">IB</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">City</label>
                  <input type="text" [(ngModel)]="newSchool.city" placeholder="City" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">State</label>
                  <input type="text" [(ngModel)]="newSchool.state" placeholder="State" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
              </div>
            </div>

            <!-- Admin Credentials -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Initial Administrator Credentials</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Admin First Name *</label>
                  <input type="text" [(ngModel)]="newSchool.adminFirstName" placeholder="First Name" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Admin Last Name</label>
                  <input type="text" [(ngModel)]="newSchool.adminLastName" placeholder="Last Name" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Admin Email (Login ID) *</label>
                  <input type="email" [(ngModel)]="newSchool.adminEmail" placeholder="admin@school.edu.in" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Admin Phone</label>
                  <input type="text" [(ngModel)]="newSchool.adminPhone" placeholder="+91 98765 43210" class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
              </div>
            </div>

            <!-- Contracted SaaS Rate -->
            <div class="space-y-2 pt-3 border-t border-slate-100">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monetization & Billing Agreement</div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Contracted Per-Student Monthly Fee (₹) *</label>
                <input type="number" [(ngModel)]="newSchool.perStudentFee" min="1" step="1"
                       class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none" />
                <p class="text-[11px] text-slate-500 mt-1">Default is ₹20.00 / student / month billed on the 1st of every month.</p>
              </div>
            </div>

          </div>

          <div class="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button (click)="autoFillSampleSchool()" class="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer">
              ⚡ Auto-fill Sample Data
            </button>
            <div class="flex items-center gap-2.5">
              <button (click)="closeOnboardModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
                Cancel
              </button>
              <button (click)="submitOnboardSchool()" [disabled]="onboarding"
                      class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer">
                <span *ngIf="!onboarding">Provision Campus</span>
                <span *ngIf="onboarding">Provisioning Database...</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 2: SERVICES GOVERNANCE                                   -->
      <!-- ============================================================== -->
      <div *ngIf="showServicesModal && selectedSchoolForServices" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closeServicesModal()"></div>
        <div class="bg-white rounded-3xl max-w-xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Core Services — {{ selectedSchoolForServices.name }}</h3>
              <p class="text-xs text-slate-500">Enable or restrict functional modules for this campus.</p>
            </div>
            <button (click)="closeServicesModal()" class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-6 sm:p-8 overflow-y-auto space-y-3 flex-1 text-xs">
            <div *ngFor="let svc of availableServices"
                 class="p-4 rounded-2xl border transition-all flex items-center justify-between gap-4"
                 [class.bg-slate-50]="!isServiceAllowed(svc.code)"
                 [class.border-slate-200]="!isServiceAllowed(svc.code)"
                 [class.bg-white]="isServiceAllowed(svc.code)"
                 [class.border-emerald-200]="isServiceAllowed(svc.code)">
              <div>
                <div class="font-bold text-slate-900">{{ svc.name }}</div>
                <div class="text-[11px] text-slate-500 mt-0.5">{{ svc.description }}</div>
              </div>
              <button (click)="toggleService(svc.code)"
                      type="button"
                      [class.bg-emerald-600]="isServiceAllowed(svc.code)"
                      [class.bg-slate-300]="!isServiceAllowed(svc.code)"
                      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                <span [class.translate-x-5]="isServiceAllowed(svc.code)"
                      [class.translate-x-0]="!isServiceAllowed(svc.code)"
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>

          <div class="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeServicesModal()" class="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              Cancel
            </button>
            <button (click)="saveServices()" [disabled]="savingServices" class="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer">
              <span *ngIf="!savingServices">Save Service Governance</span>
              <span *ngIf="savingServices">Saving...</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 3: CONFIGURE SAAS PRICING & WALLET ADJUSTMENT             -->
      <!-- ============================================================== -->
      <div *ngIf="showPricingModal && selectedSchoolForPricing" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closePricingModal()"></div>
        <div class="bg-white rounded-3xl max-w-lg w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <div class="px-6 sm:px-7 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <div class="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                SaaS Monetization Engine
              </div>
              <h3 class="text-base font-black text-slate-900 tracking-tight mt-1">
                Configure Pricing & Wallet — {{ selectedSchoolForPricing.name }}
              </h3>
            </div>
            <button (click)="closePricingModal()" class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-6 sm:p-7 overflow-y-auto space-y-4 flex-1 text-xs">
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

            <!-- Rate Setting -->
            <div class="space-y-1.5 text-xs">
              <label class="block font-bold text-slate-700">Contracted Per-Student Monthly Fee (₹) *</label>
              <div class="flex items-center gap-3">
                <div class="relative flex-1">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input type="number" [(ngModel)]="editingRate" min="1" step="1"
                         class="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold focus:bg-white outline-none" />
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" *ngFor="let rate of [15, 20, 25, 30, 50]"
                          (click)="editingRate = rate"
                          [class.bg-blue-600]="editingRate === rate"
                          [class.text-white]="editingRate === rate"
                          [class.bg-slate-100]="editingRate !== rate"
                          class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer">
                    ₹{{ rate }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Wallet Adjustment -->
            <div class="space-y-3 text-xs pt-3 border-t border-slate-100">
              <div>
                <label class="block font-bold text-slate-800 mb-1">Root Wallet Balance Adjustment</label>
                <div class="grid grid-cols-3 gap-2 mt-2">
                  <button type="button" (click)="adjustmentType = 'NONE'; walletAdjustmentAmount = null"
                          [class.bg-blue-600]="adjustmentType === 'NONE'"
                          [class.text-white]="adjustmentType === 'NONE'"
                          [class.bg-slate-100]="adjustmentType !== 'NONE'"
                          class="py-2 rounded-xl font-bold cursor-pointer transition-all">
                    No Adjustment
                  </button>
                  <button type="button" (click)="adjustmentType = 'CREDIT'"
                          [class.bg-emerald-600]="adjustmentType === 'CREDIT'"
                          [class.text-white]="adjustmentType === 'CREDIT'"
                          [class.bg-slate-100]="adjustmentType !== 'CREDIT'"
                          class="py-2 rounded-xl font-bold cursor-pointer transition-all">
                    + Credit Top-Up
                  </button>
                  <button type="button" (click)="adjustmentType = 'DEBIT'"
                          [class.bg-rose-600]="adjustmentType === 'DEBIT'"
                          [class.text-white]="adjustmentType === 'DEBIT'"
                          [class.bg-slate-100]="adjustmentType !== 'DEBIT'"
                          class="py-2 rounded-xl font-bold cursor-pointer transition-all">
                    - Debit Charge
                  </button>
                </div>
              </div>

              <div *ngIf="adjustmentType !== 'NONE'" class="space-y-2">
                <label class="block font-bold text-slate-700">Amount (₹)</label>
                <input type="number" [(ngModel)]="walletAdjustmentAmount" min="1" placeholder="Enter amount"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                <label class="block font-bold text-slate-700 mt-2">Audit Ledger Reason *</label>
                <input type="text" [(ngModel)]="adjustmentReason" placeholder="e.g. Offline Cheque cleared #883920"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
            </div>

          </div>

          <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button (click)="closePricingModal()" class="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 cursor-pointer">
              Cancel
            </button>
            <button (click)="savePricing()" [disabled]="savingPricing" class="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-xs cursor-pointer">
              <span *ngIf="!savingPricing">Save Pricing & Balance</span>
              <span *ngIf="savingPricing">Saving...</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 4: ADD / EDIT PROSPECT SCHOOL TO DIARY                    -->
      <!-- ============================================================== -->
      <div *ngIf="showAddLeadModal" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closeAddLeadModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Add Prospect School to Diary</h3>
                <p class="text-xs text-slate-500">Record outreach details, connections, software pain points, and follow-up timeline.</p>
              </div>
            </div>
            <button (click)="closeAddLeadModal()" class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
              ✕
            </button>
          </div>

          <div class="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 text-xs">
            
            <!-- School Details -->
            <div class="space-y-3">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prospect Campus Info</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">School Name *</label>
                  <input type="text" [(ngModel)]="newLeadForm.schoolName" placeholder="e.g. DPS International Academy"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">City & State</label>
                  <input type="text" [(ngModel)]="newLeadForm.city" placeholder="e.g. Pune, Maharashtra"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500" />
                </div>
              </div>
            </div>

            <!-- Key Contacts & Connection -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Contact Person & Connection</div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input type="text" [(ngModel)]="newLeadForm.contactPerson" placeholder="e.g. Dr. Ramesh Joshi"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Designation</label>
                  <input type="text" [(ngModel)]="newLeadForm.contactDesignation" placeholder="e.g. Principal / Director"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input type="text" [(ngModel)]="newLeadForm.phone" placeholder="+91 98220 12345"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Key Connections / Referred By</label>
                <input type="text" [(ngModel)]="newLeadForm.keyConnections" placeholder="e.g. Referred by Trustee Mr. Sharma, ex-principal of Don Bosco"
                       class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
            </div>

            <!-- Software Pain Points & Commercials -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current ERP, Scale & Commercials</div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Current Software / ERP</label>
                  <input type="text" [(ngModel)]="newLeadForm.currentErp" placeholder="e.g. Fedena, Manual Registers"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Est. Student Count</label>
                  <input type="number" [(ngModel)]="newLeadForm.estimatedStudents" min="0" placeholder="1200"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Target Rate (₹/mo)</label>
                  <input type="number" [(ngModel)]="newLeadForm.targetRate" min="1" placeholder="20"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Custom School Requirements & Feature Requests</label>
                <textarea [(ngModel)]="newLeadForm.requirements" rows="2"
                          placeholder="e.g. Automated RFID bus sync, CBSE 2026 grade cards, dual-signature receipts..."
                          class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"></textarea>
              </div>
            </div>

            <!-- Schedule & Timeline -->
            <div class="space-y-3 pt-3 border-t border-slate-100">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marketing Schedule & Follow-up Timeline</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Next Follow-up Date & Time</label>
                  <input type="datetime-local" [(ngModel)]="newLeadForm.nextFollowupDate"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Target Decision Deadline</label>
                  <input type="date" [(ngModel)]="newLeadForm.targetDeadline"
                         class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
              </div>
            </div>

          </div>

          <div class="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddLeadModal()" class="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              Cancel
            </button>
            <button (click)="saveLeadRecord()" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer">
              Save to Diary
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 5: SCHOOL DIARY & COMMUNICATIONS HUB                     -->
      <!-- ============================================================== -->
      <div *ngIf="showLeadDiaryModal && selectedLeadForDiary" class="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
        <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs -z-10" (click)="closeLeadDiaryModal()"></div>
        <div class="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[92vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden relative z-10 animate-scaleUp">
          
          <!-- Header -->
          <div class="px-6 sm:px-8 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-base font-black text-slate-900">{{ selectedLeadForDiary.schoolName }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" [ngClass]="getStageBadgeClass(selectedLeadForDiary.status)">
                    {{ formatStage(selectedLeadForDiary.status) }}
                  </span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                  <span>{{ selectedLeadForDiary.contactPerson }} ({{ selectedLeadForDiary.contactDesignation }})</span>
                  <span>•</span>
                  <a [href]="'tel:' + selectedLeadForDiary.phone" class="font-mono text-blue-600 font-bold hover:underline">{{ selectedLeadForDiary.phone }}</a>
                </div>
              </div>
            </div>

            <!-- Stage Quick Selector & Close -->
            <div class="flex items-center gap-2">
              <select [(ngModel)]="selectedLeadForDiary.status" (ngModelChange)="updateLeadStatus(selectedLeadForDiary.status)"
                      class="h-8 px-2.5 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg outline-none cursor-pointer">
                <option value="NEW">Stage: New</option>
                <option value="CONTACTED">Stage: Contacted</option>
                <option value="MEETING_SCHEDULED">Stage: Meeting Scheduled</option>
                <option value="PROPOSAL_SENT">Stage: Proposal Sent</option>
                <option value="NEGOTIATION">Stage: Negotiation</option>
                <option value="WON">Stage: Won (Ready to Onboard)</option>
                <option value="LOST">Stage: Lost</option>
              </select>
              <button (click)="closeLeadDiaryModal()" class="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer">
                ✕
              </button>
            </div>
          </div>

          <!-- Diary Sub-Navigation Pills -->
          <div class="px-6 sm:px-8 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs font-bold shrink-0 flex-wrap">
            <button (click)="diaryActiveSubTab = 'TIMELINE'"
                    [class.bg-white]="diaryActiveSubTab === 'TIMELINE'"
                    [class.text-blue-600]="diaryActiveSubTab === 'TIMELINE'"
                    [class.shadow-xs]="diaryActiveSubTab === 'TIMELINE'"
                    [class.text-slate-600]="diaryActiveSubTab !== 'TIMELINE'"
                    class="px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
              <span>Chronological Timeline</span>
              <span class="px-1.5 py-0.5 rounded-md bg-slate-200 text-[10px]">{{ selectedLeadForDiary.activities.length }}</span>
            </button>
            <button (click)="diaryActiveSubTab = 'CALL'"
                    [class.bg-white]="diaryActiveSubTab === 'CALL'"
                    [class.text-blue-600]="diaryActiveSubTab === 'CALL'"
                    [class.shadow-xs]="diaryActiveSubTab === 'CALL'"
                    [class.text-slate-600]="diaryActiveSubTab !== 'CALL'"
                    class="px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
              <span>+ Log Phone Call</span>
            </button>
            <button (click)="diaryActiveSubTab = 'MEETING'"
                    [class.bg-white]="diaryActiveSubTab === 'MEETING'"
                    [class.text-blue-600]="diaryActiveSubTab === 'MEETING'"
                    [class.shadow-xs]="diaryActiveSubTab === 'MEETING'"
                    [class.text-slate-600]="diaryActiveSubTab !== 'MEETING'"
                    class="px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
              <span>+ Plan Meeting</span>
            </button>
            <button (click)="diaryActiveSubTab = 'REQUIREMENTS'"
                    [class.bg-white]="diaryActiveSubTab === 'REQUIREMENTS'"
                    [class.text-blue-600]="diaryActiveSubTab === 'REQUIREMENTS'"
                    [class.shadow-xs]="diaryActiveSubTab === 'REQUIREMENTS'"
                    [class.text-slate-600]="diaryActiveSubTab !== 'REQUIREMENTS'"
                    class="px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
              <span>School Requirements</span>
            </button>
          </div>

          <!-- Diary Body -->
          <div class="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 text-xs">
            
            <!-- SUBTAB 1: LOG CALL FORM -->
            <div *ngIf="diaryActiveSubTab === 'CALL'" class="space-y-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
              <h4 class="font-bold text-slate-900 text-sm">Log Phone Call & Conversation Record</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Call Outcome *</label>
                  <select [(ngModel)]="newActivityCall.outcome" class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none">
                    <option value="Answered - Interested">Answered - Interested & Positive</option>
                    <option value="Answered - Gatekeeper / Call Back">Answered - Busy / Call Back Requested</option>
                    <option value="Meeting / Demo Fixed">Meeting / Demo Fixed</option>
                    <option value="Rate Negotiation">Rate / Commercials Discussion</option>
                    <option value="Voicemail / No Answer">Voicemail / No Answer</option>
                    <option value="Not Interested">Not Interested / Retaining Old Software</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Next Follow-up Schedule</label>
                  <input type="datetime-local" [(ngModel)]="newActivityCall.nextFollowupDate"
                         class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Conversation Summary & Key Notes *</label>
                <textarea [(ngModel)]="newActivityCall.description" rows="3"
                          placeholder="Summarize discussion points, management reactions, questions raised, and promised action items..."
                          class="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button (click)="diaryActiveSubTab = 'TIMELINE'" class="px-4 py-2 bg-white text-slate-700 rounded-xl border border-slate-200 cursor-pointer font-bold">
                  Cancel
                </button>
                <button (click)="submitActivityCall()" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer font-bold">
                  Save Call to Diary
                </button>
              </div>
            </div>

            <!-- SUBTAB 2: PLAN MEETING FORM -->
            <div *ngIf="diaryActiveSubTab === 'MEETING'" class="space-y-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <h4 class="font-bold text-slate-900 text-sm">Plan Campus Meeting or Online Demo</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Meeting Title / Agenda *</label>
                  <input type="text" [(ngModel)]="newActivityMeeting.title" placeholder="e.g. Live Parent App Walkthrough for Senior Teachers"
                         class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Meeting Mode</label>
                  <select [(ngModel)]="newActivityMeeting.meetingMode" class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none">
                    <option value="IN_PERSON">In-Person Campus Visit</option>
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom Conference</option>
                    <option value="PHONE">Phone Conference</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Scheduled Date & Time *</label>
                  <input type="datetime-local" [(ngModel)]="newActivityMeeting.scheduledAt"
                         class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Expected Attendees</label>
                  <input type="text" [(ngModel)]="newActivityMeeting.attendees" placeholder="e.g. Principal, Academic Coordinator, 2 Trustees"
                         class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Preparation Checklist & Notes</label>
                <textarea [(ngModel)]="newActivityMeeting.description" rows="2"
                          placeholder="Carry brochures, prepare sample CBSE report cards, test demo student profiles..."
                          class="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button (click)="diaryActiveSubTab = 'TIMELINE'" class="px-4 py-2 bg-white text-slate-700 rounded-xl border border-slate-200 cursor-pointer font-bold">
                  Cancel
                </button>
                <button (click)="submitActivityMeeting()" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer font-bold">
                  Schedule Meeting
                </button>
              </div>
            </div>

            <!-- SUBTAB 3: REQUIREMENTS & NOTES EDITOR -->
            <div *ngIf="diaryActiveSubTab === 'REQUIREMENTS'" class="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 class="font-bold text-slate-900 text-sm">School Requirements & Decision Deadlines</h4>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Custom Module Requirements</label>
                <textarea [(ngModel)]="selectedLeadForDiary.requirements" rows="3"
                          placeholder="Custom features requested, reporting templates, payment gateways, mobile app customizations..."
                          class="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none"></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Current ERP Pain Points</label>
                  <input type="text" [(ngModel)]="selectedLeadForDiary.currentErp"
                         placeholder="e.g. Fedena (High maintenance, poor support)"
                         class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Target Decision Deadline</label>
                  <input type="date" [(ngModel)]="selectedLeadForDiary.targetDeadline"
                         class="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none" />
                </div>
              </div>

              <div class="flex items-center justify-end pt-2">
                <button (click)="saveLeadRequirements()" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer font-bold">
                  Update Requirements
                </button>
              </div>
            </div>

            <!-- SUBTAB 4: CHRONOLOGICAL ACTIVITY TIMELINE -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-slate-900 text-sm">Chronological Communications Log</h4>
                <div class="flex items-center gap-2">
                  <button (click)="diaryActiveSubTab = 'CALL'" class="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer">
                    + Log Call
                  </button>
                  <span class="text-slate-300">•</span>
                  <button (click)="diaryActiveSubTab = 'MEETING'" class="text-indigo-600 hover:text-indigo-800 text-xs font-bold cursor-pointer">
                    + Plan Meeting
                  </button>
                </div>
              </div>

              <div *ngIf="selectedLeadForDiary.activities.length === 0" class="text-center py-8 text-slate-400">
                No activity logs recorded yet. Log your first call or schedule a demo above!
              </div>

              <div *ngIf="selectedLeadForDiary.activities.length > 0" class="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                <div *ngFor="let act of selectedLeadForDiary.activities"
                     class="relative pl-8 space-y-1 group">
                  
                  <!-- Timeline Dot -->
                  <div class="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
                       [class.bg-blue-600]="act.type === 'CALL'"
                       [class.bg-indigo-600]="act.type === 'MEETING'"
                       [class.bg-emerald-600]="act.type === 'REQUIREMENT'"
                       [class.bg-slate-500]="act.type === 'NOTE'">
                  </div>

                  <div class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase"
                              [class.bg-blue-50]="act.type === 'CALL'"
                              [class.text-blue-700]="act.type === 'CALL'"
                              [class.bg-indigo-50]="act.type === 'MEETING'"
                              [class.text-indigo-700]="act.type === 'MEETING'"
                              [class.bg-slate-100]="act.type === 'NOTE'"
                              [class.text-slate-700]="act.type === 'NOTE'">
                          {{ act.type }}
                        </span>
                        <span class="font-bold text-slate-900 text-xs">{{ act.title }}</span>
                      </div>
                      <span class="text-[10px] text-slate-400 font-mono">{{ act.loggedAt | date:'medium' }}</span>
                    </div>

                    <div *ngIf="act.outcome" class="text-[11px] font-bold text-emerald-700 mt-1">
                      Outcome: {{ act.outcome }}
                    </div>

                    <div *ngIf="act.scheduledAt" class="text-[11px] font-bold text-indigo-700 mt-1">
                      📅 Scheduled for: {{ act.scheduledAt | date:'medium' }} ({{ act.meetingMode || 'In Person' }})
                    </div>

                    <p *ngIf="act.description" class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {{ act.description }}
                    </p>

                    <div class="text-[10px] text-slate-400 mt-1">
                      Logged by: {{ act.loggedBy }}
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

          <!-- Diary Footer -->
          <div class="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button (click)="convertLeadToSchool(selectedLeadForDiary)"
                    class="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Convert to Active Campus (1-Click Onboard)</span>
            </button>

            <button (click)="closeLeadDiaryModal()" class="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              Close Diary
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
  supabase = inject(SupabaseService);

  constructor() {
    effect(() => {
      const active = this.modalService.activeModal();
      if (!active) {
        this.showOnboardModal = false;
        this.showServicesModal = false;
        this.showPricingModal = false;
        this.showAddLeadModal = false;
        this.showLeadDiaryModal = false;
      }
    });
  }

  // Active platform tab
  activePlatformTab: 'ANALYTICS' | 'CLIENTS' | 'LEADS' = 'ANALYTICS';

  // Schools list state
  schools: SchoolItemWithStats[] = [];
  searchQuery = '';
  loading = false;
  statusFilter: 'ALL' | 'ACTIVE' | 'SUSPENDED' = 'ALL';
  sortBy: 'NAME' | 'STUDENTS' | 'NEWEST' = 'NAME';
  viewMode: 'GRID' | 'TABLE' = 'GRID';

  copiedCodeId: string | null = null;
  copiedAdminEmailId: string | null = null;
  enteringSupportId: string | null = null;

  // Onboard modal
  showOnboardModal = false;
  onboarding = false;
  onboardError = '';

  // Services modal
  showServicesModal = false;
  selectedSchoolForServices: SchoolItemWithStats | null = null;
  activeDisabledServices: string[] = [];
  savingServices = false;
  availableServices = AVAILABLE_SERVICES;

  // Pricing & Wallet modal
  showPricingModal = false;
  selectedSchoolForPricing: SchoolItemWithStats | null = null;
  editingRate = 20;
  adjustmentType: 'NONE' | 'CREDIT' | 'DEBIT' = 'NONE';
  walletAdjustmentAmount: number | null = null;
  adjustmentReason = '';
  savingPricing = false;
  loadingLivePricing = false;

  // Leads CRM & Diary State
  platformLeads: PlatformLead[] = [];
  leadSearchQuery = '';
  leadStatusFilter: 'ALL' | 'NEW' | 'CONTACTED' | 'MEETING_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST' = 'ALL';
  showAddLeadModal = false;
  showLeadDiaryModal = false;
  selectedLeadForDiary: PlatformLead | null = null;
  diaryActiveSubTab: 'TIMELINE' | 'CALL' | 'MEETING' | 'REQUIREMENTS' = 'TIMELINE';

  // Quick activity forms
  newActivityCall = {
    outcome: 'Answered - Interested',
    title: 'Phone Call with School Management',
    description: '',
    nextFollowupDate: '',
  };

  newActivityMeeting = {
    title: 'Campus Product Walkthrough & Demo',
    scheduledAt: '',
    meetingMode: 'IN_PERSON' as 'IN_PERSON' | 'GOOGLE_MEET' | 'ZOOM' | 'PHONE',
    attendees: '',
    description: '',
  };

  newLeadForm: Partial<PlatformLead> = {
    schoolName: '',
    city: '',
    contactPerson: '',
    contactDesignation: 'Principal',
    phone: '',
    email: '',
    keyConnections: '',
    currentErp: '',
    estimatedStudents: 1000,
    targetRate: 20,
    requirements: '',
    nextFollowupDate: '',
    targetDeadline: '',
    status: 'NEW',
  };

  // Monthly Revenue History State
  selectedMonthKey = '2026-10';
  monthlyHistory: MonthlyRevenueRecord[] = [];

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

  // Getters for Analytics Tab
  get totalMrr(): number {
    return this.schools
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + (s.stats?.studentsCount || 0) * (s.subscription?.perStudentFee || 20), 0);
  }

  get totalArr(): number {
    return this.totalMrr * 12;
  }

  get averageStudentsPerSchool(): number {
    const activeCount = this.activeSchoolsCount;
    if (!activeCount) return 0;
    return this.totalStudents / activeCount;
  }

  get averagePerStudentFee(): number {
    const active = this.schools.filter((s) => s.status === 'ACTIVE');
    if (!active.length) return 20;
    const totalFees = active.reduce((acc, s) => acc + (s.subscription?.perStudentFee || 20), 0);
    return totalFees / active.length;
  }

  get collectiveWalletBalance(): number {
    return this.schools.reduce((acc, s) => acc + (s.wallet?.balance || 0), 0);
  }

  get arrearsCampusesCount(): number {
    return this.schools.filter((s) => (s.wallet?.balance || 0) < 0).length;
  }

  get rankedSchools(): SchoolItemWithStats[] {
    return [...this.schools].sort((a, b) => {
      const revA = (a.stats?.studentsCount || 0) * (a.subscription?.perStudentFee || 20);
      const revB = (b.stats?.studentsCount || 0) * (b.subscription?.perStudentFee || 20);
      return revB - revA;
    });
  }

  get selectedMonthData(): MonthlyRevenueRecord {
    const found = this.monthlyHistory.find((m) => m.monthKey === this.selectedMonthKey);
    if (found) return found;
    return {
      monthKey: '2026-10',
      monthYear: 'Oct 2026',
      projectedRevenue: this.totalMrr,
      billedAmount: this.totalMrr,
      collectedAmount: this.totalMrr,
      activeSchoolsCount: this.activeSchoolsCount,
      activeStudentsCount: this.totalStudents,
    };
  }

  getBarHeightPercent(amount: number): number {
    const maxVal = Math.max(...this.monthlyHistory.map((m) => m.billedAmount), 1);
    const pct = Math.round((amount / maxVal) * 100);
    return Math.max(12, Math.min(100, pct));
  }

  // Getters for Leads Tab
  get scheduledMeetingsCount(): number {
    return this.platformLeads.filter(
      (l) => l.status === 'MEETING_SCHEDULED' || l.status === 'DEMO_SCHEDULED'
    ).length;
  }

  get dueTodayLeads(): PlatformLead[] {
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.platformLeads.filter((l) => {
      if (!l.nextFollowupDate) return false;
      const fDate = l.nextFollowupDate.slice(0, 10);
      return fDate <= todayStr && l.status !== 'WON' && l.status !== 'LOST';
    });
  }

  get dueTodayLeadsCount(): number {
    return this.dueTodayLeads.length;
  }

  get projectedPipelineMrr(): number {
    return this.platformLeads
      .filter((l) => l.status !== 'LOST' && l.status !== 'WON')
      .reduce((sum, l) => sum + (l.estimatedStudents || 0) * (l.targetRate || 20), 0);
  }

  get filteredLeads(): PlatformLead[] {
    let list = this.platformLeads;
    if (this.leadStatusFilter !== 'ALL') {
      list = list.filter((l) => l.status === this.leadStatusFilter);
    }
    if (this.leadSearchQuery.trim()) {
      const q = this.leadSearchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.schoolName.toLowerCase().includes(q) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          l.contactPerson.toLowerCase().includes(q) ||
          (l.keyConnections && l.keyConnections.toLowerCase().includes(q)) ||
          (l.requirements && l.requirements.toLowerCase().includes(q)) ||
          (l.currentErp && l.currentErp.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getStageCount(stage: string): number {
    return this.platformLeads.filter((l) => l.status === stage).length;
  }

  formatStage(stage: string): string {
    switch (stage) {
      case 'NEW': return 'New Prospect';
      case 'CONTACTED': return 'Contacted';
      case 'MEETING_SCHEDULED': return 'Meeting Planned';
      case 'DEMO_SCHEDULED': return 'Demo Planned';
      case 'PROPOSAL_SENT': return 'Proposal Sent';
      case 'NEGOTIATION': return 'In Negotiation';
      case 'WON': return 'Won / Onboarded';
      case 'LOST': return 'Lost';
      default: return stage;
    }
  }

  getStageBadgeClass(stage: string): string {
    switch (stage) {
      case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONTACTED': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MEETING_SCHEDULED':
      case 'DEMO_SCHEDULED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PROPOSAL_SENT': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'NEGOTIATION': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'WON': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LOST': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  // Getters for Active Clients Tab
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

    if (this.statusFilter === 'ACTIVE') {
      list = list.filter((s) => s.status === 'ACTIVE');
    } else if (this.statusFilter === 'SUSPENDED') {
      list = list.filter((s) => s.status !== 'ACTIVE');
    }

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
    if (!this.auth.isSuperAdmin() || this.auth.isSupportSession()) {
      this.toast.error('Security Restriction: Accessible only by the authorized Platform Administrator.');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadSchools();
    this.loadLeadsData();
    this.initMonthlyHistory();
  }

  loadSchools() {
    this.loading = true;
    this.auth.getAllSchools().subscribe({
      next: (data) => {
        this.schools = data;
        this.loading = false;
        this.initMonthlyHistory();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Failed to load school network');
      },
    });
  }

  initMonthlyHistory() {
    const currentMrr = this.totalMrr || 245600;
    this.monthlyHistory = [
      {
        monthKey: '2026-10',
        monthYear: 'Oct 2026',
        projectedRevenue: currentMrr,
        billedAmount: currentMrr,
        collectedAmount: currentMrr,
        activeSchoolsCount: this.activeSchoolsCount || 14,
        activeStudentsCount: this.totalStudents || 12280,
      },
      {
        monthKey: '2026-09',
        monthYear: 'Sep 2026',
        projectedRevenue: Math.round(currentMrr * 0.94),
        billedAmount: Math.round(currentMrr * 0.94),
        collectedAmount: Math.round(currentMrr * 0.92),
        activeSchoolsCount: Math.max(1, (this.activeSchoolsCount || 14) - 1),
        activeStudentsCount: Math.round((this.totalStudents || 12280) * 0.95),
      },
      {
        monthKey: '2026-08',
        monthYear: 'Aug 2026',
        projectedRevenue: Math.round(currentMrr * 0.88),
        billedAmount: Math.round(currentMrr * 0.88),
        collectedAmount: Math.round(currentMrr * 0.85),
        activeSchoolsCount: Math.max(1, (this.activeSchoolsCount || 14) - 2),
        activeStudentsCount: Math.round((this.totalStudents || 12280) * 0.9),
      },
      {
        monthKey: '2026-07',
        monthYear: 'Jul 2026',
        projectedRevenue: Math.round(currentMrr * 0.82),
        billedAmount: Math.round(currentMrr * 0.82),
        collectedAmount: Math.round(currentMrr * 0.8),
        activeSchoolsCount: Math.max(1, (this.activeSchoolsCount || 14) - 3),
        activeStudentsCount: Math.round((this.totalStudents || 12280) * 0.85),
      },
      {
        monthKey: '2026-06',
        monthYear: 'Jun 2026',
        projectedRevenue: Math.round(currentMrr * 0.75),
        billedAmount: Math.round(currentMrr * 0.75),
        collectedAmount: Math.round(currentMrr * 0.73),
        activeSchoolsCount: Math.max(1, (this.activeSchoolsCount || 14) - 4),
        activeStudentsCount: Math.round((this.totalStudents || 12280) * 0.78),
      },
      {
        monthKey: '2026-05',
        monthYear: 'May 2026',
        projectedRevenue: Math.round(currentMrr * 0.68),
        billedAmount: Math.round(currentMrr * 0.68),
        collectedAmount: Math.round(currentMrr * 0.65),
        activeSchoolsCount: Math.max(1, (this.activeSchoolsCount || 14) - 5),
        activeStudentsCount: Math.round((this.totalStudents || 12280) * 0.7),
      },
    ];
  }

  // Leads CRM Data Loading & Persistence
  loadLeadsData() {
    // 1. Try reading from Supabase RPC first
    this.supabase.rpc('get_platform_crm_leads').then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length > 0) {
        this.platformLeads = data as PlatformLead[];
        localStorage.setItem('schoolsense_platform_leads', JSON.stringify(this.platformLeads));
      } else {
        // 2. Read from localStorage or Seed default prospect schools
        this.loadLeadsFromStorageOrSeed();
      }
    }).catch(() => {
      this.loadLeadsFromStorageOrSeed();
    });
  }

  loadLeadsFromStorageOrSeed() {
    const saved = localStorage.getItem('schoolsense_platform_leads');
    if (saved) {
      try {
        this.platformLeads = JSON.parse(saved);
        return;
      } catch (e) {
        console.error('Failed to parse saved leads', e);
      }
    }

    // Default Seed Leads (Realistic Indian Schools)
    const today = new Date().toISOString().slice(0, 10);
    this.platformLeads = [
      {
        id: 'lead-1',
        schoolName: 'Greenwood World Academy',
        fullName: 'Dr. Anand Rao',
        phone: '+91 98450 11223',
        email: 'anand.rao@greenwoodworld.in',
        role: 'Director of Academics',
        city: 'Bangalore, Karnataka',
        status: 'MEETING_SCHEDULED',
        contactPerson: 'Dr. Anand Rao',
        contactDesignation: 'Director of Academics',
        keyConnections: 'Introduced by Board Member Mr. K. V. Sastry (ex-Principal of DPS Bangalore)',
        currentErp: 'Campus 365 (Slow fee reconciliation, parents complaining of mobile app crashes)',
        requirements: 'Automated bus GPS parent notifications, CBSE 2026 grade card templates, and multi-branch fee receipts.',
        estimatedStudents: 1850,
        targetRate: 22,
        nextFollowupDate: `${today}T15:30:00`,
        targetDeadline: '2026-11-15',
        activities: [
          {
            id: 'act-1',
            type: 'CALL',
            title: 'Discovery Call with Dr. Anand',
            outcome: 'Answered - Interested',
            description: 'Discussed high parent dissatisfaction with current ERP fees module. Scheduled academic council demo.',
            loggedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            loggedBy: 'Platform Admin',
          },
          {
            id: 'act-2',
            type: 'MEETING',
            title: 'Live Product Walkthrough with Academic Council',
            scheduledAt: `${today}T15:30:00`,
            meetingMode: 'GOOGLE_MEET',
            description: 'Showcase teacher homework posting, attendance roll call, and instant parent notifications.',
            loggedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            loggedBy: 'Platform Admin',
          },
        ],
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'lead-2',
        schoolName: "St. Xavier's Senior Secondary School",
        fullName: "Sister Maria D'Souza",
        phone: '+91 94140 77889',
        email: 'principal@stxaviersjaipur.org',
        role: 'Principal',
        city: 'Jaipur, Rajasthan',
        status: 'PROPOSAL_SENT',
        contactPerson: "Sister Maria D'Souza",
        contactDesignation: 'Principal',
        keyConnections: 'Referred by Fr. Thomas from Don Bosco Pune (our active live client)',
        currentErp: 'Manual Registers & Excel spreadsheets',
        requirements: 'Simple web portal for teachers with one-tap roll call and parent circulars. Strict privacy requirement.',
        estimatedStudents: 2400,
        targetRate: 18,
        nextFollowupDate: `${today}T11:00:00`,
        targetDeadline: '2026-11-10',
        activities: [
          {
            id: 'act-3',
            type: 'CALL',
            title: 'Transition from Excel Discussion',
            outcome: 'Answered - Interested',
            description: 'Sister Maria emphasized that staff needs an extremely simple Hindi/English interface.',
            loggedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            loggedBy: 'Platform Admin',
          },
          {
            id: 'act-4',
            type: 'MEETING',
            title: 'In-Person Campus Presentation',
            scheduledAt: new Date(Date.now() - 86400000).toISOString(),
            meetingMode: 'IN_PERSON',
            description: 'Demonstrated offline data safety and fast daily roll call. Sent formal proposal at ₹18/student.',
            loggedAt: new Date(Date.now() - 86400000).toISOString(),
            loggedBy: 'Platform Admin',
          },
        ],
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'lead-3',
        schoolName: 'Delhi Heritage Public School',
        fullName: 'Mr. Vikramaditya Singh',
        phone: '+91 99180 33445',
        email: 'trustee@delhiheritagelko.com',
        role: 'Managing Trustee',
        city: 'Lucknow, Uttar Pradesh',
        status: 'NEGOTIATION',
        contactPerson: 'Mr. Vikramaditya Singh',
        contactDesignation: 'Managing Trustee',
        keyConnections: 'Direct connection with brother Mr. Digvijay Singh (State Education Board delegate)',
        currentErp: 'Entab (Contract expiring November 30th)',
        requirements: 'Biometric staff attendance integration + Parent Grievance Desk ticket SLA tracking.',
        estimatedStudents: 3200,
        targetRate: 20,
        nextFollowupDate: '2026-10-19T14:00:00',
        targetDeadline: '2026-11-25',
        activities: [
          {
            id: 'act-5',
            type: 'CALL',
            title: 'Contract Expiry & Migration Timeline',
            outcome: 'Rate Negotiation',
            description: 'Negotiating volume discount for 3200 students. Agreed on ₹20/student with 30-day trial in senior wing.',
            loggedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
            loggedBy: 'Platform Admin',
          },
        ],
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'lead-4',
        schoolName: 'Ryan Global Academy',
        fullName: 'Mrs. Preeti Mehta',
        phone: '+91 98200 55667',
        role: 'Head of School',
        city: 'Mumbai, Maharashtra',
        status: 'NEW',
        contactPerson: 'Mrs. Preeti Mehta',
        contactDesignation: 'Head of School',
        keyConnections: 'Sourced from CBSE Principals Conference Mumbai 2026',
        currentErp: 'Fedena Open-Source (AWS server crash issues)',
        requirements: 'Fully managed cloud hosting, zero maintenance overhead, automated exam marksheet calculation.',
        estimatedStudents: 1600,
        targetRate: 25,
        nextFollowupDate: '2026-10-20T10:30:00',
        activities: [
          {
            id: 'act-6',
            type: 'NOTE',
            title: 'Lead Sourced from Mumbai Symposium',
            description: 'Interested in replacing legacy self-hosted server with SchoolSense cloud solution.',
            loggedAt: new Date(Date.now() - 86400000).toISOString(),
            loggedBy: 'Platform Admin',
          },
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    this.persistLeads();
  }

  persistLeads() {
    localStorage.setItem('schoolsense_platform_leads', JSON.stringify(this.platformLeads));
  }

  // Lead Actions
  openAddLeadModal() {
    this.newLeadForm = {
      schoolName: '',
      city: '',
      contactPerson: '',
      contactDesignation: 'Principal / Administrator',
      phone: '',
      email: '',
      keyConnections: '',
      currentErp: '',
      estimatedStudents: 1000,
      targetRate: 20,
      requirements: '',
      nextFollowupDate: '',
      targetDeadline: '',
      status: 'NEW',
    };
    this.showAddLeadModal = true;
    this.modalService.open('SUPER_ADMIN_ADD_LEAD');
  }

  closeAddLeadModal() {
    this.showAddLeadModal = false;
    this.modalService.close();
  }

  saveLeadRecord() {
    if (!this.newLeadForm.schoolName?.trim() || !this.newLeadForm.contactPerson?.trim() || !this.newLeadForm.phone?.trim()) {
      this.toast.error('Please specify School Name, Contact Person, and Phone Number.');
      return;
    }

    const newLead: PlatformLead = {
      id: `lead-${Date.now()}`,
      schoolName: this.newLeadForm.schoolName.trim(),
      fullName: this.newLeadForm.contactPerson.trim(),
      phone: this.newLeadForm.phone.trim(),
      email: this.newLeadForm.email?.trim() || '',
      city: this.newLeadForm.city?.trim() || '',
      status: (this.newLeadForm.status as any) || 'NEW',
      contactPerson: this.newLeadForm.contactPerson.trim(),
      contactDesignation: this.newLeadForm.contactDesignation?.trim() || 'Principal',
      keyConnections: this.newLeadForm.keyConnections?.trim() || '',
      requirements: this.newLeadForm.requirements?.trim() || '',
      currentErp: this.newLeadForm.currentErp?.trim() || '',
      estimatedStudents: Number(this.newLeadForm.estimatedStudents) || 500,
      targetRate: Number(this.newLeadForm.targetRate) || 20,
      nextFollowupDate: this.newLeadForm.nextFollowupDate || undefined,
      targetDeadline: this.newLeadForm.targetDeadline || undefined,
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'NOTE',
          title: 'Prospect School Created in Diary',
          description: `Added to outreach diary. Requirements: ${this.newLeadForm.requirements || 'Initial inquiry'}.`,
          loggedAt: new Date().toISOString(),
          loggedBy: 'Platform Admin',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Save to RPC if available
    this.supabase.rpc('save_platform_crm_lead', { p_lead: newLead }).catch(() => {});

    this.platformLeads.unshift(newLead);
    this.persistLeads();
    this.toast.success(`Prospect "${newLead.schoolName}" successfully added to marketing diary!`);
    this.closeAddLeadModal();
  }

  openLeadDiaryModal(lead: PlatformLead) {
    this.selectedLeadForDiary = lead;
    this.diaryActiveSubTab = 'TIMELINE';
    this.newActivityCall = {
      outcome: 'Answered - Interested',
      title: 'Phone Call with School Management',
      description: '',
      nextFollowupDate: '',
    };
    this.newActivityMeeting = {
      title: 'Campus Product Walkthrough & Demo',
      scheduledAt: '',
      meetingMode: 'IN_PERSON',
      attendees: '',
      description: '',
    };
    this.showLeadDiaryModal = true;
    this.modalService.open('SUPER_ADMIN_LEAD_DIARY');
  }

  closeLeadDiaryModal() {
    this.showLeadDiaryModal = false;
    this.modalService.close();
  }

  openQuickCall(lead: PlatformLead) {
    this.openLeadDiaryModal(lead);
    this.diaryActiveSubTab = 'CALL';
  }

  openQuickMeeting(lead: PlatformLead) {
    this.openLeadDiaryModal(lead);
    this.diaryActiveSubTab = 'MEETING';
  }

  updateLeadStatus(newStatus: any) {
    if (!this.selectedLeadForDiary) return;
    this.selectedLeadForDiary.status = newStatus;

    // Log status change activity
    const act: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'NOTE',
      title: `Pipeline Stage Updated to ${this.formatStage(newStatus)}`,
      description: `Prospect status changed to ${newStatus}.`,
      loggedAt: new Date().toISOString(),
      loggedBy: 'Platform Admin',
    };
    this.selectedLeadForDiary.activities.push(act);
    this.persistLeads();
    this.supabase.rpc('save_platform_crm_lead', { p_lead: this.selectedLeadForDiary }).catch(() => {});
    this.toast.info(`Updated status to "${this.formatStage(newStatus)}"`);
  }

  submitActivityCall() {
    if (!this.selectedLeadForDiary) return;
    if (!this.newActivityCall.description.trim()) {
      this.toast.error('Please enter conversation notes / summary.');
      return;
    }

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'CALL',
      title: this.newActivityCall.title,
      outcome: this.newActivityCall.outcome,
      description: this.newActivityCall.description.trim(),
      loggedAt: new Date().toISOString(),
      loggedBy: 'Platform Admin',
    };

    this.selectedLeadForDiary.activities.push(activity);
    if (this.newActivityCall.nextFollowupDate) {
      this.selectedLeadForDiary.nextFollowupDate = this.newActivityCall.nextFollowupDate;
    }
    if (this.selectedLeadForDiary.status === 'NEW') {
      this.selectedLeadForDiary.status = 'CONTACTED';
    }

    this.persistLeads();
    this.supabase.rpc('log_platform_lead_activity', {
      p_lead_id: this.selectedLeadForDiary.id,
      p_activity: activity,
    }).catch(() => {});

    this.toast.success('Call log and conversation summary saved to diary!');
    this.diaryActiveSubTab = 'TIMELINE';
  }

  submitActivityMeeting() {
    if (!this.selectedLeadForDiary) return;
    if (!this.newActivityMeeting.scheduledAt) {
      this.toast.error('Please specify the scheduled date & time.');
      return;
    }

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      type: 'MEETING',
      title: this.newActivityMeeting.title,
      scheduledAt: this.newActivityMeeting.scheduledAt,
      meetingMode: this.newActivityMeeting.meetingMode,
      description: `${this.newActivityMeeting.description.trim()}${this.newActivityMeeting.attendees ? ' | Attendees: ' + this.newActivityMeeting.attendees : ''}`,
      loggedAt: new Date().toISOString(),
      loggedBy: 'Platform Admin',
    };

    this.selectedLeadForDiary.activities.push(activity);
    this.selectedLeadForDiary.nextFollowupDate = this.newActivityMeeting.scheduledAt;
    this.selectedLeadForDiary.status = 'MEETING_SCHEDULED';

    this.persistLeads();
    this.supabase.rpc('log_platform_lead_activity', {
      p_lead_id: this.selectedLeadForDiary.id,
      p_activity: activity,
    }).catch(() => {});

    this.toast.success('Meeting scheduled and added to follow-up schedule!');
    this.diaryActiveSubTab = 'TIMELINE';
  }

  saveLeadRequirements() {
    if (!this.selectedLeadForDiary) return;
    this.persistLeads();
    this.supabase.rpc('save_platform_crm_lead', { p_lead: this.selectedLeadForDiary }).catch(() => {});
    this.toast.success('School requirements and deadlines updated!');
    this.diaryActiveSubTab = 'TIMELINE';
  }

  convertLeadToSchool(lead: PlatformLead) {
    lead.status = 'WON';
    this.persistLeads();

    const nameParts = lead.contactPerson.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'Administrator';

    // Generate acronym
    const words = lead.schoolName.trim().split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
    } else {
      code = lead.schoolName.slice(0, 4).toUpperCase();
    }
    const randomSuffix = Math.floor(10 + Math.random() * 90);

    this.newSchool = {
      name: lead.schoolName,
      code: `${code}${randomSuffix}`,
      affiliation: 'CBSE',
      city: lead.city || '',
      state: lead.state || '',
      addressLine1: lead.city ? `${lead.city} Campus` : '',
      email: lead.email || '',
      phone: lead.phone || '',
      postalCode: '',
      adminFirstName: firstName,
      adminLastName: lastName,
      adminEmail: lead.email || `admin@${lead.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.in`,
      adminPhone: lead.phone || '',
      adminPassword: 'password123',
      perStudentFee: lead.targetRate || 20,
    };

    this.closeLeadDiaryModal();
    this.openOnboardModal();
    this.toast.info(`Pre-filled onboarding form from diary lead "${lead.schoolName}"!`);
  }

  // Active Clients Methods
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

    const words = name.split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
    } else {
      code = name.slice(0, 4).toUpperCase();
    }
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

  openPricingModal(school: SchoolItemWithStats) {
    this.selectedSchoolForPricing = school;
    this.editingRate = school.subscription?.perStudentFee || 20;
    this.adjustmentType = 'NONE';
    this.walletAdjustmentAmount = null;
    this.adjustmentReason = '';
    this.showPricingModal = true;
    this.loadingLivePricing = true;
    this.modalService.open('SUPER_ADMIN_PRICING');

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
}
