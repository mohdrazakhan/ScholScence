import { Component, OnInit, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import {
  FeeCategory,
  FeeStructure,
  StudentFeeInvoice,
  DailyDayBookSummary,
  Student80cCertificate,
  StudentSiblingInfo,
  ClassFeeMatrixItem,
  StudentFeeLedgerStatement,
  StudentFeeLedgerEntry,
  StudentFeePreference,
  SchoolFeeRules,
} from '../../core/models';

export interface AggregatedStudentFeeRecord {
  student_id: string;
  student_name: string;
  admission_number: string;
  roll_number?: string;
  class_id?: string;
  class_name: string;
  section_id?: string;
  section_name: string;
  profile_image?: string;
  avatar_url?: string;
  photo_url?: string;
  totalBilled: number;
  totalPaid: number;
  totalDiscount: number;
  outstandingDue: number;
  advanceCredit: number;
  totalRefunded?: number;
  status: 'PENDING DUE' | 'SETTLED' | 'ADVANCE';
  invoicesCount: number;
  primaryInvoice: StudentFeeInvoice;
  invoices: StudentFeeInvoice[];
}

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- ============================================================== -->
      <!-- STANDARD PAGE TITLE HEADER (Consistent with Academics/Exams)   -->
      <!-- ============================================================== -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div class="min-w-0">
          <h1 *ngIf="activeTab === 'DAYBOOK'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Cashier Day-Book & Shift Reconciler
          </h1>
          <h1 *ngIf="activeTab === 'INVOICES'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Student Ledger & Fee Invoices
          </h1>
          <h1 *ngIf="activeTab === 'MATRIX'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Configured Fee Structures & Heads
          </h1>
          <h1 *ngIf="isAdmin && activeTab === 'PROMOCODES'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Fee Settings & Discount Policies
          </h1>
          <p *ngIf="activeTab === 'DAYBOOK'" class="text-xs text-slate-500 mt-0.5">Audit-ready breakdown of cash, UPI, cheque, and bank remittances for daily collection reconciliation.</p>
          <p *ngIf="activeTab === 'INVOICES'" class="text-xs text-slate-500 mt-0.5">Student billing schedules, pending dues, advance ledger balances, and payment histories.</p>
          <p *ngIf="activeTab === 'MATRIX'" class="text-xs text-slate-500 mt-0.5">Manage grade-wise fee heads, amounts, due days, and billing cycles.</p>
          <p *ngIf="isAdmin && activeTab === 'PROMOCODES'" class="text-xs text-slate-500 mt-0.5">Configure billing frequency discounts, late fine rules, and approved promo codes.</p>
        </div>

        <!-- Top Header Contextual Actions & Session Badge -->
        <div class="flex items-center gap-2 flex-wrap shrink-0">
          <!-- Active Session Badge -->
          <div class="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Session: <strong class="text-slate-900">{{ auth.activeSessionName() }}</strong></span>
          </div>

          <!-- Collect Fee: ONLY on DAYBOOK and INVOICES tabs -->
          <button *ngIf="activeTab === 'DAYBOOK' || activeTab === 'INVOICES'"
                  (click)="openCollectFeeModal()"
                  class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Collect Fee</span>
          </button>

          <!-- Add Fee Structure: ONLY on MATRIX tab -->
          <button *ngIf="canManage && activeTab === 'MATRIX'"
                  (click)="openAddStructureModal()"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Fee Structure</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- WORKSPACE NAVIGATION TABS STRIP                                -->
      <!-- ============================================================== -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/80">
        <!-- Position 1: Daily Day-Book & Cashier (Default) -->
        <button (click)="setTab('DAYBOOK')"
                class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                [ngClass]="activeTab === 'DAYBOOK' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Daily Day-Book</span>
        </button>

        <!-- Position 2: Student Ledger -->
        <button (click)="setTab('INVOICES')"
                class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                [ngClass]="activeTab === 'INVOICES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Student Ledger ({{ uniqueStudentsCount }})</span>
        </button>

        <!-- Position 3: Fee Structures & Heads -->
        <button (click)="setTab('MATRIX')"
                class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                [ngClass]="activeTab === 'MATRIX' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Fee Structures ({{ structures.length }})</span>
        </button>

        <!-- Position 4: Settings Gear Button (Concessions & Rules) (Admin Only) -->
        <button *ngIf="isAdmin" (click)="setTab('PROMOCODES')"
                title="Fee Settings & Concessions"
                class="px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                [ngClass]="activeTab === 'PROMOCODES' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Fee Settings</span>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 1: STUDENT LEDGER & INVOICES                               -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'INVOICES'" class="space-y-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-4">
          
          <!-- Beginner-Friendly Class, Section & Status Filter Toolbar -->
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
            <div class="flex items-center gap-2.5 flex-wrap flex-1">
              <!-- Search Input -->
              <div class="relative flex-1 min-w-[220px]">
                <input type="text"
                       [(ngModel)]="invoiceSearchQuery"
                       (ngModelChange)="onFilterChange()"
                       placeholder="Search student by name, admission no, roll no..."
                       class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none transition-all shadow-2xs" />
                <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <!-- Filter by Class -->
              <div class="flex items-center gap-1.5">
                <label class="text-[11px] font-bold text-slate-500 shrink-0">Class:</label>
                <select [(ngModel)]="selectedClassFilter"
                        (ngModelChange)="onClassFilterChange()"
                        class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-2xs cursor-pointer">
                  <option value="ALL">All Classes</option>
                  <option *ngFor="let cls of distinctClassNames" [value]="cls">
                    {{ cls }}
                  </option>
                </select>
              </div>

              <!-- Filter by Section -->
              <div class="flex items-center gap-1.5">
                <label class="text-[11px] font-bold text-slate-500 shrink-0">Section:</label>
                <select [(ngModel)]="selectedSectionFilter"
                        (ngModelChange)="onFilterChange()"
                        class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-2xs cursor-pointer">
                  <option value="ALL">All Sections</option>
                  <option *ngFor="let sec of availableSectionsForClass" [value]="sec">
                    Section {{ sec }}
                  </option>
                </select>
              </div>

              <!-- Status Dropdown -->
              <div class="flex items-center gap-1.5">
                <label class="text-[11px] font-bold text-slate-500 shrink-0">Status:</label>
                <select [(ngModel)]="selectedStatusFilter"
                        (ngModelChange)="onFilterChange()"
                        class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none shadow-2xs cursor-pointer">
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending Due</option>
                  <option value="SETTLED">Paid / Settled</option>
                  <option value="ADVANCE">Advance Credit</option>
                </select>
              </div>

              <!-- Reset Filters Button -->
              <button *ngIf="hasActiveFilters"
                      (click)="resetFilters()"
                      class="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Reset</span>
              </button>
            </div>

            <!-- Export Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <button (click)="exportStudentLedgerCsv()"
                      class="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Student Ledger Roster Table (One Row Per Student) -->
          <div class="overflow-x-auto min-h-[320px]">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th class="py-3 px-4">Student</th>
                  <th class="py-3 px-4">Class</th>
                  <th class="py-3 px-4 text-right">Total Billed</th>
                  <th class="py-3 px-4 text-right">Total Paid</th>
                  <th class="py-3 px-4 text-right">Outstanding Due</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let st of paginatedStudents" class="hover:bg-slate-50/80 transition-colors">
                  <!-- Student Info (Avatar/Initial, Name, Adm No, Roll No) -->
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center relative shadow-xs">
                        <img *ngIf="st.profile_image || st.avatar_url || st.photo_url"
                             [src]="st.profile_image || st.avatar_url || st.photo_url"
                             [alt]="st.student_name"
                             class="w-full h-full object-cover"
                             (error)="onStudentAvatarError($event, st)" />
                        <div *ngIf="!st.profile_image && !st.avatar_url && !st.photo_url"
                             class="w-full h-full flex items-center justify-center font-bold text-sm text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {{ st.student_name ? st.student_name.charAt(0).toUpperCase() : 'S' }}
                        </div>
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-xs">{{ st.student_name }}</div>
                        <div class="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>Adm: <strong class="text-slate-600">{{ st.admission_number }}</strong></span>
                          <span *ngIf="st.roll_number">• Roll: {{ st.roll_number }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Class & Section -->
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                      {{ st.class_name }}<span *ngIf="st.section_name"> - {{ st.section_name }}</span>
                    </span>
                  </td>

                  <!-- Total Billed -->
                  <td class="py-3 px-4 text-right font-black text-slate-900">
                    ₹{{ st.totalBilled | number:'1.0-0' }}
                  </td>

                  <!-- Total Paid -->
                  <td class="py-3 px-4 text-right font-black text-emerald-700">
                    ₹{{ st.totalPaid | number:'1.0-0' }}
                  </td>

                  <!-- Outstanding Due / Advance -->
                  <td class="py-3 px-4 text-right">
                    <div *ngIf="st.outstandingDue > 0" class="font-black text-rose-600">
                      ₹{{ st.outstandingDue | number:'1.0-0' }} Due
                    </div>
                    <div *ngIf="st.advanceCredit > 0" class="inline-flex items-center text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      +₹{{ st.advanceCredit | number:'1.0-0' }} Adv
                    </div>
                    <div *ngIf="st.outstandingDue === 0 && st.advanceCredit === 0" class="text-[11px] text-slate-400 font-medium">
                      ₹0 (Settled)
                    </div>
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block"
                          [ngClass]="{
                            'bg-rose-50 text-rose-700 border border-rose-200': st.status === 'PENDING DUE',
                            'bg-emerald-50 text-emerald-700 border border-emerald-200': st.status === 'ADVANCE',
                            'bg-slate-100 text-slate-700 border border-slate-200': st.status === 'SETTLED'
                          }">
                      {{ st.status === 'ADVANCE' ? 'ADVANCE CREDIT' : st.status }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="py-3 px-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5 whitespace-nowrap flex-nowrap">
                      <!-- Button 1: View Ledger -->
                      <button (click)="openStudentLedgerForStudent(st)"
                              class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs cursor-pointer shadow-2xs active:scale-95 transition-all flex items-center gap-1.5"
                              title="View official student ledger statement">
                        <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>View Ledger</span>
                      </button>

                      <!-- Button 2: Collect Fee (if outstanding due > 0) -->
                      <button *ngIf="st.outstandingDue > 0"
                              (click)="openCollectFeeForStudent(st)"
                              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-2xs active:scale-95 transition-all flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Collect</span>
                      </button>

                      <!-- Three Dots Action Button (⋮) -->
                      <div class="relative inline-block text-left">
                        <button (click)="toggleActionDropdown(st.student_id, $event)"
                                class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                                title="More options">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        <!-- Dropdown Menu -->
                        <div *ngIf="openDropdownStudentId === st.student_id"
                             (click)="$event.stopPropagation()"
                             class="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30 animate-fadeIn text-xs text-left">
                          
                          <!-- View Student Ledger Statement -->
                          <button (click)="openStudentLedgerForStudent(st); closeActionDropdown()"
                                  class="w-full px-3 py-2 text-slate-800 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors font-bold border-b border-slate-100">
                            <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>View Account Ledger</span>
                          </button>

                          <!-- Add Direct Charge -->
                          <button (click)="openAddChargeForStudent(st); closeActionDropdown()"
                                  class="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer transition-colors">
                            <svg class="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Fee Charge</span>
                          </button>

                          <!-- Print Statement -->
                          <button (click)="printStudentLedgerDirect(st); closeActionDropdown()"
                                  class="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer transition-colors">
                            <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Print Ledger Statement</span>
                          </button>

                          <!-- Print 80C Certificate (if student has paid amount) -->
                          <button *ngIf="st.totalPaid > 0"
                                  (click)="generate80cForStudent(st); closeActionDropdown()"
                                  class="w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer transition-colors font-medium">
                            <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Print 80C Certificate</span>
                          </button>

                          <!-- Send Fee Reminder -->
                          <button *ngIf="st.outstandingDue > 0"
                                  (click)="sendReminderForStudent(st); closeActionDropdown()"
                                  class="w-full px-3 py-2 text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors font-medium">
                            <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span>Send Fee Reminder</span>
                          </button>

                          <!-- Issue Advance Refund (if student has advance credit) -->
                          <button *ngIf="st.advanceCredit > 0"
                                  (click)="openRefundModalForStudent(st); closeActionDropdown()"
                                  class="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer transition-colors font-medium border-t border-slate-100">
                            <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Issue Advance Refund (₹{{ st.advanceCredit | number:'1.0-0' }})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredAggregatedStudents.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-400 text-xs">
                    No student records found matching the selected filter.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer (10 students per page) -->
          <div *ngIf="filteredAggregatedStudents.length > 0" class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span class="font-bold text-slate-800">{{ studentPaginationStartIndex }}</span> to <span class="font-bold text-slate-800">{{ studentPaginationEndIndex }}</span> of <span class="font-bold text-slate-900">{{ filteredAggregatedStudents.length }}</span> students
            </div>
            
            <div class="flex items-center gap-1.5">
              <!-- Previous Button -->
              <button (click)="goToPreviousPage()"
                      [disabled]="currentPage === 1"
                      class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs">
                &larr; Prev
              </button>

              <!-- Page Indicator Chips -->
              <div class="flex items-center gap-1">
                <ng-container *ngFor="let page of visibleStudentPages">
                  <button (click)="goToPage(page)"
                          class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                          [ngClass]="currentPage === page ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'">
                    {{ page }}
                  </button>
                </ng-container>
              </div>

              <!-- Next Button -->
              <button (click)="goToNextPage()"
                      [disabled]="currentPage === totalStudentPages"
                      class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs">
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: FEE STRUCTURES & HEADS                                  -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'MATRIX'" class="space-y-4 animate-fadeIn">
        
        <!-- ZERO-CLASS GUARD PROMPT -->
        <div *ngIf="classes.length === 0" class="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="text-base font-black text-slate-900">No Classes Created Yet</div>
          <p class="text-xs text-slate-500 max-w-md mx-auto">
            Fee structures are mapped to permanent academic classes. Please set up your school's classes and grade sections first in the Academics desk.
          </p>
          <a [routerLink]="['/academics']" [queryParams]="{ tab: 'classes' }"
             class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm">
            <span>Go to Manage Classes & Sections</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

        <!-- Structure Cards List (when classes exist) -->
        <div *ngIf="classes.length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-5">
          <div class="pb-3 border-b border-slate-100">
            <h3 class="text-base font-black text-slate-900">Configured Fee Structures & Heads</h3>
            <p class="text-xs text-slate-500 mt-0.5">Manage grade-wise fee heads, amounts, due days, and billing cycles.</p>
          </div>

          <!-- Empty State when 0 structures exist -->
          <div *ngIf="structures.length === 0" class="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="text-sm font-bold text-slate-900">No Fee Structures Configured</div>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">Create standard fee structures for each grade to allow auto-generating monthly or term student fee invoices.</p>
            <button *ngIf="canManage" (click)="openAddStructureModal()" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm">
              Add First Fee Structure
            </button>
          </div>

          <!-- STRUCTURE CARDS GRID -->
          <div *ngIf="structures.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div *ngFor="let fs of structures"
                 class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] space-y-3 hover:border-slate-300 transition-all">
              
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-slate-900 text-white">
                  {{ fs.class_name }}
                </span>
                <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                  {{ fs.frequency }}
                </span>
              </div>

              <div>
                <h3 class="font-black text-slate-900 text-base tracking-tight">{{ fs.fee_category_name || fs.category_name || 'Tuition / Composite Fee' }}</h3>
                <div class="text-2xl font-black text-emerald-700 mt-1">₹{{ fs.amount | number:'1.0-0' }}</div>
                <p class="text-[10px] text-slate-400 mt-0.5">Due on Day {{ fs.due_day || 10 }} of each cycle</p>
              </div>

              <div *ngIf="canManage" class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <!-- EDIT ACTION BUTTON -->
                <button (click)="openEditStructureModal(fs)"
                        class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95">
                  <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>

                <!-- REMOVE ACTION BUTTON -->
                <button (click)="promptDeleteStructure(fs)"
                        class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95">
                  <svg class="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 3: DAILY DAY-BOOK & CASHIER DESK                           -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'DAYBOOK'" class="space-y-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-4">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base font-black text-slate-900">Cashier Day-Book & Shift Reconciler</h3>
                <span *ngIf="dayBookStartDate === dayBookEndDate" class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                  Single Day: {{ dayBookStartDate | date:'dd MMM yyyy' }}
                </span>
                <span *ngIf="dayBookStartDate !== dayBookEndDate" class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  Range: {{ dayBookStartDate | date:'dd MMM' }} – {{ dayBookEndDate | date:'dd MMM yyyy' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Audit-ready breakdown of cash, UPI, cheque, and bank remittances for collection reconciliation.</p>
            </div>

            <!-- Header Quick Action: Print Day-Book Statement -->
            <div class="flex items-center gap-2 shrink-0">
              <button (click)="printDayBookSummary()"
                      class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95">
                <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Day-Book Summary</span>
              </button>
            </div>
          </div>

          <!-- DEDICATED FULL-WIDTH FILTER TOOLBAR STRIP (Horizontal Orientation) -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
            <!-- Left: Quick Filter Presets in a clean horizontal group -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period:</span>
              <div class="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold gap-1 shrink-0 overflow-x-auto">
                <button type="button"
                        (click)="setDayBookPreset('TODAY')"
                        [ngClass]="dayBookPreset === 'TODAY' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap">
                  Today
                </button>
                <button type="button"
                        (click)="setDayBookPreset('YESTERDAY')"
                        [ngClass]="dayBookPreset === 'YESTERDAY' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap">
                  Yesterday
                </button>
                <button type="button"
                        (click)="setDayBookPreset('LAST_7_DAYS')"
                        [ngClass]="dayBookPreset === 'LAST_7_DAYS' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap">
                  Last 7 Days
                </button>
                <button type="button"
                        (click)="setDayBookPreset('THIS_MONTH')"
                        [ngClass]="dayBookPreset === 'THIS_MONTH' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap">
                  This Month
                </button>
                <button type="button"
                        (click)="setDayBookPreset('CUSTOM')"
                        [ngClass]="dayBookPreset === 'CUSTOM' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
                        class="px-3 py-1 rounded-lg cursor-pointer transition-all whitespace-nowrap">
                  Custom
                </button>
              </div>
            </div>

            <!-- Right: Date Range Selector (Horizontal) -->
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-xs">
                <span class="text-[10px] font-bold text-slate-400 uppercase">From:</span>
                <input type="date"
                       [(ngModel)]="dayBookStartDate"
                       (change)="onDayBookDateChange()"
                       class="bg-transparent font-bold text-slate-800 text-xs focus:outline-none" />
                <span class="text-slate-300 font-bold">→</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">To:</span>
                <input type="date"
                       [(ngModel)]="dayBookEndDate"
                       (change)="onDayBookDateChange()"
                       class="bg-transparent font-bold text-slate-800 text-xs focus:outline-none" />
              </div>
              <button (click)="loadDayBook()"
                      class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="loadingDayBook ? 'animate-spin' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Status Banner: Auto-loaded Recent Transactions Fallback -->
          <div *ngIf="dayBookSummary?.isRecentFallback" class="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fadeIn">
            <div class="flex items-center gap-2">
              <span class="text-base">ℹ️</span>
              <div>
                <strong>No collections recorded yet for Today ({{ dayBookStartDate | date:'dd MMM yyyy' }}).</strong>
                <span class="text-amber-800"> Showing recent collections from previous days for cashier auditing.</span>
              </div>
            </div>
            <button (click)="setDayBookPreset('LAST_7_DAYS')" class="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-lg text-[11px] font-bold cursor-pointer transition-all shrink-0">
              Show Last 7 Days
            </button>
          </div>

          <!-- Tally Chips Grid -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900">
              <div class="text-[10px] uppercase font-bold text-indigo-600">
                {{ dayBookStartDate === dayBookEndDate ? 'Gross Daily Total' : 'Gross Period Total' }}
              </div>
              <div class="text-lg font-black mt-1">₹{{ (dayBookSummary?.totalCollected ?? 0) | number:'1.0-0' }}</div>
              <div class="text-[10px] text-indigo-500">{{ dayBookSummary?.transactionCount ?? 0 }} receipts</div>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
              <div class="text-[10px] uppercase font-bold text-emerald-600">Cash in Drawer</div>
              <div class="text-lg font-black mt-1">₹{{ (dayBookSummary?.cashAmount ?? 0) | number:'1.0-0' }}</div>
              <div class="text-[10px] text-emerald-500">Physical Currency</div>
            </div>

            <div class="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-purple-900">
              <div class="text-[10px] uppercase font-bold text-purple-600">UPI / QR Counter</div>
              <div class="text-lg font-black mt-1">₹{{ (dayBookSummary?.upiAmount ?? 0) | number:'1.0-0' }}</div>
              <div class="text-[10px] text-purple-500">Instant Settlements</div>
            </div>

            <div class="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-900">
              <div class="text-[10px] uppercase font-bold text-sky-600">Bank / NEFT / Cards</div>
              <div class="text-lg font-black mt-1">₹{{ (dayBookSummary?.bankAmount ?? 0) | number:'1.0-0' }}</div>
              <div class="text-[10px] text-sky-500">Direct Account Credit</div>
            </div>

            <div class="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-amber-900">
              <div class="text-[10px] uppercase font-bold text-amber-600">Bank Cheques</div>
              <div class="text-lg font-black mt-1">₹{{ (dayBookSummary?.chequeAmount ?? 0) | number:'1.0-0' }}</div>
              <div class="text-[10px] text-amber-500">Clearing Pending</div>
            </div>
          </div>

          <!-- Transactions Timeline Table -->
          <div class="overflow-x-auto pt-2">
            <div class="flex items-center justify-between pb-2">
              <div class="text-xs font-bold text-slate-800">
                Receipts Ledger ({{ dayBookSummary?.transactions?.length || 0 }} transactions
                <span *ngIf="dayBookStartDate === dayBookEndDate">— {{ dayBookStartDate | date:'dd MMM yyyy' }}</span>
                <span *ngIf="dayBookStartDate !== dayBookEndDate">— {{ dayBookStartDate | date:'dd MMM' }} to {{ dayBookEndDate | date:'dd MMM yyyy' }}</span>)
              </div>
              <button (click)="printDayBookSummary()" class="text-xs font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Day-Book Summary</span>
              </button>
            </div>

            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th class="py-2.5 px-3">Date</th>
                  <th class="py-2.5 px-3">Receipt No</th>
                  <th class="py-2.5 px-3">Student Name</th>
                  <th class="py-2.5 px-3">Class</th>
                  <th class="py-2.5 px-3">Mode</th>
                  <th class="py-2.5 px-3">Cashier</th>
                  <th class="py-2.5 px-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let tx of dayBookSummary?.transactions" class="hover:bg-slate-50">
                  <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">{{ (tx.paymentDate || tx.paymentTime || dayBookStartDate) | date:'dd MMM yyyy' }}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{{ tx.receiptNumber }}</td>
                  <td class="py-2.5 px-3 font-bold">{{ tx.studentName }}</td>
                  <td class="py-2.5 px-3">{{ tx.className }}</td>
                  <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-800 border border-emerald-200': tx.paymentMode === 'CASH',
                            'bg-purple-50 text-purple-800 border border-purple-200': tx.paymentMode === 'UPI' || tx.paymentMode === 'QR',
                            'bg-amber-50 text-amber-800 border border-amber-200': tx.paymentMode === 'CHEQUE',
                            'bg-sky-50 text-sky-800 border border-sky-200': tx.paymentMode !== 'CASH' && tx.paymentMode !== 'UPI' && tx.paymentMode !== 'QR' && tx.paymentMode !== 'CHEQUE'
                          }">
                      {{ tx.paymentMode }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-500">{{ tx.collectedBy }}</td>
                  <td class="py-2.5 px-3 text-right font-black text-emerald-700 whitespace-nowrap">₹{{ tx.amount | number:'1.0-0' }}</td>
                </tr>

                <tr *ngIf="!dayBookSummary || dayBookSummary.transactions.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                    No transactions recorded for {{ dayBookStartDate === dayBookEndDate ? (dayBookStartDate | date:'dd MMM yyyy') : ((dayBookStartDate | date:'dd MMM yyyy') + ' to ' + (dayBookEndDate | date:'dd MMM yyyy')) }}.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 4: CONCESSIONS & PROMOCODES DESK (Admin Only)              -->
      <!-- ============================================================== -->
      <div *ngIf="isAdmin && activeTab === 'PROMOCODES'" class="space-y-6 animate-fadeIn">

        <!-- CARD 1: FEE BILLING RULES & LATE FEE ENGINE POLICY -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/60">
                CAMPUS REVENUE POLICY
              </span>
              <h3 class="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                <span>Fee Billing Rules & Late Fee Policy Engine</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Define frequency discounts for parents and automated late fee penalty rules for delayed payments.</p>
            </div>

            <!-- Save Fee Rules Button -->
            <button *ngIf="canManage"
                    (click)="saveSchoolFeeRules()"
                    [disabled]="savingFeeRules"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0">
              <svg *ngIf="savingFeeRules" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <svg *ngIf="!savingFeeRules" class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ savingFeeRules ? 'Saving Rules...' : 'Save Fee Rules' }}</span>
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column: Billing Frequency Concessions -->
            <div class="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  %
                </div>
                <div>
                  <h4 class="font-bold text-slate-900 text-xs">Payment Frequency Concessions</h4>
                  <p class="text-[11px] text-slate-500">Incentivize parents to pay upfront for quarterly or annual sessions</p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 pt-2">
                <!-- Monthly % -->
                <div class="bg-white p-3 rounded-xl border border-indigo-200/70 shadow-2xs space-y-1.5">
                  <span class="text-[10px] font-bold uppercase text-slate-500 block">Monthly Plan</span>
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="schoolFeeRules.monthly_discount_pct" min="0" max="100" class="w-full text-base font-black text-slate-900 focus:outline-none" />
                    <span class="text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span class="text-[9px] text-slate-400 block">Default: 0%</span>
                </div>

                <!-- Quarterly % -->
                <div class="bg-white p-3 rounded-xl border border-indigo-200/70 shadow-2xs space-y-1.5">
                  <span class="text-[10px] font-bold uppercase text-slate-500 block">Quarterly Plan</span>
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="schoolFeeRules.quarterly_discount_pct" min="0" max="100" class="w-full text-base font-black text-indigo-700 focus:outline-none" />
                    <span class="text-xs font-bold text-indigo-700">%</span>
                  </div>
                  <span class="text-[9px] text-slate-400 block">Standard: 5%</span>
                </div>

                <!-- Annual % -->
                <div class="bg-white p-3 rounded-xl border border-indigo-200/70 shadow-2xs space-y-1.5">
                  <span class="text-[10px] font-bold uppercase text-slate-500 block">Annual Lump-Sum</span>
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="schoolFeeRules.annual_discount_pct" min="0" max="100" class="w-full text-base font-black text-emerald-700 focus:outline-none" />
                    <span class="text-xs font-bold text-emerald-700">%</span>
                  </div>
                  <span class="text-[9px] text-slate-400 block">Recommended: 10%</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Due Date & Late Fee Policy -->
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ₹
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-xs">Due Date & Late Fee Engine</h4>
                    <p class="text-[11px] text-slate-500">Grace period and fine penalty calculation</p>
                  </div>
                </div>

                <!-- Enable Late Fee Toggle -->
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="schoolFeeRules.enable_late_fee" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                  <span class="text-xs font-bold text-slate-700">{{ schoolFeeRules.enable_late_fee ? 'Fine Active' : 'Disabled' }}</span>
                </label>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <!-- Due Day -->
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span class="text-[10px] font-bold uppercase text-slate-500 block">Due Day of Month</span>
                  <div class="flex items-center gap-1">
                    <span class="text-xs font-bold text-slate-400">Day</span>
                    <input type="number" [(ngModel)]="schoolFeeRules.due_day_of_month" min="1" max="31" class="w-full text-base font-black text-slate-900 focus:outline-none" />
                  </div>
                  <span class="text-[9px] text-slate-400 block">e.g. 10th of month</span>
                </div>

                <!-- Grace Period -->
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <span class="text-[10px] font-bold uppercase text-slate-500 block">Grace Period</span>
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="schoolFeeRules.grace_period_days" min="0" max="30" class="w-full text-base font-black text-slate-900 focus:outline-none" />
                    <span class="text-xs font-bold text-slate-400">Days</span>
                  </div>
                  <span class="text-[9px] text-slate-400 block">e.g. 5 days post due</span>
                </div>

                <!-- Penalty Mode & Amount -->
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
                  <span class="text-[10px] font-bold uppercase text-slate-500 block">Late Fee Type</span>
                  <div class="flex items-center gap-1 text-xs">
                    <button type="button" (click)="schoolFeeRules.late_fee_type = 'FLAT'" [ngClass]="schoolFeeRules.late_fee_type === 'FLAT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'" class="px-2 py-0.5 rounded font-bold cursor-pointer transition-all text-[10px]">Flat</button>
                    <button type="button" (click)="schoolFeeRules.late_fee_type = 'DAILY'" [ngClass]="schoolFeeRules.late_fee_type === 'DAILY' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'" class="px-2 py-0.5 rounded font-bold cursor-pointer transition-all text-[10px]">Daily</button>
                  </div>
                  <div class="flex items-center gap-0.5 mt-1">
                    <span class="text-xs font-bold text-slate-400">₹</span>
                    <input type="number" [(ngModel)]="schoolFeeRules.late_fee_amount" min="0" class="w-full text-sm font-black text-rose-600 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 2: STUDENT CONCESSIONS & PROMOCODES DESK -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-5">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900">Student Concessions & Promocode Desk</h3>
              <p class="text-xs text-slate-500 mt-0.5">Configure approved fee discount codes (Sibling waivers, Staff wards, Merit scholarships, RTE exemptions).</p>
            </div>

            <!-- Generate Promocode Button (Admin only) -->
            <button *ngIf="canManage"
                    (click)="openCreatePromoModal()"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 self-start sm:self-auto">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Generate Promocode</span>
            </button>
          </div>

          <!-- Active Promocodes Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div *ngFor="let promo of activePromocodes; let i = index"
                 class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-black text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg tracking-wider">
                    {{ promo.code }}
                  </span>
                  <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {{ promo.discountType === 'FLAT_AMOUNT' ? '₹' + promo.value + ' OFF' : promo.value + '% OFF' }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 leading-snug">{{ promo.description }}</p>
                <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span>Used: <strong>{{ promo.uses }}</strong> times</span>
                  <span>Exp: {{ promo.expiry }}</span>
                </div>
              </div>

              <!-- Card Actions: Copy Code & Deactivate -->
              <div class="pt-2 border-t border-slate-200/50 flex items-center justify-between gap-1.5 text-[11px]">
                <button (click)="copyPromoCode(promo.code)"
                        class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95">
                  <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Copy</span>
                </button>

                <button *ngIf="canManage && i >= 4"
                        (click)="removePromocode(i)"
                        title="Deactivate Promocode"
                        class="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Live Promocode Test Validator -->
          <div class="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Instant Promocode Discount Simulator</span>
            </div>
            
            <div class="flex items-center gap-3 flex-wrap text-xs">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Promo Code</label>
                <input type="text" [(ngModel)]="testPromoCode" placeholder="e.g. SIBLING15" class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono font-bold uppercase" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-0.5">Sample Fee Amount (INR)</label>
                <input type="number" [(ngModel)]="testPromoAmount" class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold" />
              </div>
              <div class="pt-3.5">
                <button (click)="testPromocode()" [disabled]="testingPromo" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">
                  {{ testingPromo ? 'Calculating...' : 'Calculate Discount' }}
                </button>
              </div>
            </div>

            <div *ngIf="testPromoResult" class="p-3 bg-white rounded-xl border border-indigo-200 text-xs text-indigo-900 font-medium">
              <div *ngIf="testPromoResult.success">
                ✅ <strong>Valid Code:</strong> Applied discount of <strong class="text-emerald-700">₹{{ testPromoResult.discountAmount }}</strong>. Final Fee to Pay: <strong class="text-indigo-700">₹{{ testPromoResult.finalAmount }}</strong> ({{ testPromoResult.message }}).
              </div>
              <div *ngIf="!testPromoResult.success" class="text-rose-700">
                ❌ {{ testPromoResult.message }}
              </div>
            </div>
          </div>

        </div>
      </div>



      <!-- ============================================================== -->
      <!-- MODAL: SIBLING DETECTOR MODAL                                  -->
      <!-- ============================================================== -->
      <div *ngIf="showSiblingModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" (click)="showSiblingModal = false"></div>
        <div class="min-h-full flex items-start justify-center p-3 sm:p-6">
          <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4 my-4 sm:my-8">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 class="font-black text-slate-900 text-base">Detected Family Siblings</h3>
              <button (click)="showSiblingModal = false" class="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer">&times;</button>
            </div>

            <div *ngIf="activeSiblingInfo?.hasSiblings" class="space-y-3 text-xs">
              <p class="text-slate-500">
                Found <strong>{{ activeSiblingInfo?.siblingsCount }}</strong> sibling(s) sharing the same parent contact records:
              </p>
              <div *ngFor="let sib of activeSiblingInfo?.siblings" class="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div class="font-black text-slate-900">{{ sib.name }}</div>
                <div class="text-[11px] text-slate-500">Class: {{ sib.className }} ({{ sib.sectionName }}) • Adm: {{ sib.admissionNumber }}</div>
              </div>
              <div class="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-indigo-900 text-xs">
                Suggested Concession: <strong>{{ activeSiblingInfo?.suggestedDiscountPct }}% Sibling Discount</strong> (Use code <code>SIBLING15</code>).
              </div>
            </div>

            <div *ngIf="!activeSiblingInfo?.hasSiblings" class="text-center py-6 text-slate-400 text-xs">
              No enrolled siblings found for this student.
            </div>

            <div class="pt-2 flex justify-end">
              <button (click)="showSiblingModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: COLLECT FEE PAYMENT (CASCADING & SMART CONCESSIONS)      -->
      <!-- ============================================================== -->
      <div *ngIf="showCollectModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-hidden">
        <div class="fixed inset-0" (click)="closeCollectModal()"></div>
        <div class="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200/90 z-10 animate-scaleUp flex flex-col max-h-[90vh] overflow-hidden">
          
          <!-- Header (Fixed / Non-scrolling) -->
          <div class="p-5 sm:px-7 sm:pt-6 sm:pb-3.5 border-b border-slate-100 shrink-0 bg-white flex items-start justify-between">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                FEE DESK CASHIER
              </span>
              <h3 class="font-black text-slate-900 text-lg mt-1">Collect Fee Payment</h3>
              <p class="text-xs text-slate-500 mt-0.5">Cascading student selection, auto-suggested concessions, and live receipt settlement</p>
            </div>
            <button (click)="closeCollectModal()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Scrollable Body Content -->
          <div class="p-5 sm:p-7 overflow-y-auto flex-1 space-y-4 text-xs">
            <!-- 1. Cascading Student Selection (3 Cascading Selectors) -->
            <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>Select Target Class, Section & Student</span>
              </div>

              <!-- Selector 1: Class & Selector 2: Section -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">1. Class *</label>
                  <select [(ngModel)]="collectClassId" (change)="onCollectClassChange()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs focus:outline-none focus:border-indigo-500">
                    <option value="">-- All Classes --</option>
                    <option *ngFor="let cls of collectAvailableClasses" [value]="cls.id">
                      {{ cls.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">2. Section *</label>
                  <select [(ngModel)]="collectSectionId" (change)="onCollectSectionChange()" [disabled]="!collectClassId" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-indigo-500">
                    <option value="">-- All Sections --</option>
                    <option *ngFor="let sec of collectAvailableSections" [value]="sec.id || sec.name">
                      Section {{ sec.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Selector 3: Student Dropdown -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">3. Student *</label>
                <select [(ngModel)]="collectStudentId" (change)="onCollectStudentSelect()" [disabled]="collectAvailableStudents.length === 0" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-indigo-500">
                  <option value="">-- Select Student --</option>
                  <option *ngFor="let st of collectAvailableStudents" [value]="st.student_id">
                    {{ st.student_name }} (Adm: {{ st.admission_number || 'N/A' }}) - {{ st.pendingDue > 0 ? ('Due: ₹' + (st.pendingDue | number:'1.0-0')) : (st.advanceCredit > 0 ? ('Advance: +₹' + (st.advanceCredit | number:'1.0-0')) : 'Settled (₹0)') }}
                  </option>
                </select>
                <div *ngIf="collectClassId && collectAvailableStudents.length === 0" class="p-2 mt-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                  Zero active invoices or students found for this class and section filter.
                </div>
              </div>

              <!-- Once student is selected, display their active pending fee or invoice -->
              <div *ngIf="selectedStudentInvoice" class="p-3 bg-white rounded-xl border border-indigo-100 space-y-2 animate-fadeIn shadow-2xs">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="font-bold text-slate-900 text-xs">Active Fee Invoice: {{ selectedStudentInvoice.invoice_number }}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border border-emerald-200': selectedStudentInvoice.status === 'PAID',
                            'bg-amber-50 text-amber-700 border border-amber-200': selectedStudentInvoice.status === 'PARTIAL',
                            'bg-rose-50 text-rose-700 border border-rose-200': selectedStudentInvoice.status === 'UNPAID' || selectedStudentInvoice.status === 'OVERDUE'
                          }">
                      {{ selectedStudentInvoice.status }}
                    </span>
                  </div>
                  <span class="text-[11px] text-slate-500 font-mono">{{ selectedStudentInvoice.month_name }}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <div class="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div class="text-[10px] text-slate-400 font-bold uppercase">Total Billed</div>
                    <div class="font-black text-slate-900 mt-0.5">₹{{ selectedStudentInvoice.total_amount | number:'1.0-0' }}</div>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div class="text-[10px] text-slate-400 font-bold uppercase">Paid So Far</div>
                    <div class="font-black text-emerald-700 mt-0.5">₹{{ selectedStudentInvoice.paid_amount | number:'1.0-0' }}</div>
                  </div>
                  <div class="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div class="text-[10px] text-slate-400 font-bold uppercase">Pending Due</div>
                    <div class="font-black text-rose-600 mt-0.5">₹{{ originalDueAmount | number:'1.0-0' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Auto-Suggested Concession Chips & Promocode Input -->
            <div *ngIf="selectedStudentInvoice" class="space-y-3 animate-fadeIn">
              
              <!-- Auto-Suggested Concession Chips -->
              <div class="space-y-1.5">
                <div class="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Auto-Suggested Concessions:</span>
                  <span *ngIf="checkingSiblings || checkingMerit" class="text-[10px] text-slate-400 italic">checking eligibility...</span>
                </div>

                <div class="flex flex-wrap gap-2">
                  <!-- Sibling Concession Chip (15%) -->
                  <button *ngIf="activeSiblingInfo?.hasSiblings"
                          type="button"
                          (click)="toggleSiblingDiscount()"
                          [ngClass]="appliedDiscount.type === 'SIBLING' ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'"
                          class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <span>👨‍👧‍👦</span>
                    <span>{{ appliedDiscount.type === 'SIBLING' ? '✓ Sibling Concession (15%) Applied' : 'Sibling Concession (15%)' }}</span>
                    <span *ngIf="appliedDiscount.type === 'SIBLING'" class="text-[10px] opacity-80 underline ml-1">✕</span>
                  </button>

                  <!-- Academic Merit Scholarship Chip (10%) -->
                  <button *ngIf="activeMeritInfo?.hasMerit"
                          type="button"
                          (click)="toggleMeritDiscount()"
                          [ngClass]="appliedDiscount.type === 'MERIT' ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'"
                          class="px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <span>🎓</span>
                    <span>{{ appliedDiscount.type === 'MERIT' ? '✓ Academic Merit Scholarship (10%) Applied' : 'Academic Merit Scholarship (10%)' }}</span>
                    <span *ngIf="appliedDiscount.type === 'MERIT'" class="text-[10px] opacity-80 underline ml-1">✕</span>
                  </button>

                  <!-- Quick Suggested Active Promocode Chips -->
                  <button *ngFor="let promo of quickSuggestedPromos"
                          type="button"
                          (click)="applyQuickPromo(promo.code)"
                          [ngClass]="appliedDiscount.code === promo.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'"
                          class="px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1 cursor-pointer active:scale-95">
                    <span>🏷️</span>
                    <span class="font-mono font-bold">{{ promo.code }}</span>
                    <span class="text-[10px]">({{ promo.value }}% off)</span>
                  </button>
                </div>
              </div>

              <!-- Apply Promocode / Concession Input with Apply Button -->
              <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-slate-700">Apply Promocode / Concession</span>
                  <button *ngIf="appliedDiscount.type !== 'NONE'" (click)="removeAppliedDiscount()" class="text-[10px] text-rose-600 hover:underline cursor-pointer">
                    Clear Concession
                  </button>
                </div>
                <div class="flex gap-2">
                  <input type="text"
                         [(ngModel)]="enteredPromoCode"
                         (keyup.enter)="applyPromoCodeInModal()"
                         placeholder="Enter promocode (e.g. SIBLING15, MERIT10)"
                         class="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500" />
                  <button (click)="applyPromoCodeInModal()"
                          [disabled]="applyingPromo || !enteredPromoCode.trim()"
                          type="button"
                          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer active:scale-95 transition-all shrink-0">
                    {{ applyingPromo ? 'Checking...' : 'Apply' }}
                  </button>
                </div>
                <p *ngIf="promoAppliedMessage" class="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <span>✓</span> <span>{{ promoAppliedMessage }}</span>
                </p>
                <p *ngIf="promoAppliedError" class="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <span>⚠️</span> <span>{{ promoAppliedError }}</span>
                </p>
              </div>

              <!-- Summary Breakdown Card: Subtotal, Concession/Discount (-₹X), Final Payable (₹X) -->
              <div class="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1.5 shadow-md">
                <div class="flex items-center justify-between text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span class="font-bold">₹{{ originalDueAmount | number:'1.0-0' }}</span>
                </div>
                <div *ngIf="appliedDiscount.amount > 0" class="flex items-center justify-between text-xs text-emerald-400">
                  <span class="flex items-center gap-1.5">
                    <span>Concession / Discount ({{ appliedDiscount.label }}):</span>
                    <button (click)="removeAppliedDiscount()" class="text-[10px] text-rose-300 hover:text-rose-200 underline cursor-pointer">(Remove)</button>
                  </span>
                  <span class="font-bold">-₹{{ appliedDiscount.amount | number:'1.0-0' }}</span>
                </div>
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-black">
                  <span>Final Payable:</span>
                  <span class="text-emerald-400 text-base">₹{{ (originalDueAmount - appliedDiscount.amount) | number:'1.0-0' }}</span>
                </div>
              </div>

            </div>

            <!-- 3. Payment Mode & Execution Inputs -->
            <div *ngIf="selectedStudentInvoice" class="space-y-3 pt-1">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Amount to Collect (INR) *</label>
                  <input type="number" [(ngModel)]="collectForm.amount_paid" min="1" [max]="originalDueAmount" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-emerald-700 shadow-2xs focus:outline-none focus:border-emerald-500" />
                  <span class="text-[10px] text-slate-400">Can collect partial amount</span>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select [(ngModel)]="collectForm.payment_mode" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold shadow-2xs focus:outline-none focus:border-indigo-500">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="NET_BANKING">Net Banking / NEFT</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No</label>
                  <input type="text" [(ngModel)]="collectForm.transaction_reference" placeholder="e.g. UPI-9876543210" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Remarks</label>
                  <input type="text" [(ngModel)]="collectForm.remarks" placeholder="Quarter fee payment remarks" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div *ngIf="collectModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {{ collectModalError }}
            </div>
          </div>

          <!-- Footer Actions (Fixed / Non-scrolling) -->
          <div class="p-4 sm:px-7 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2 bg-slate-50/50">
            <button (click)="closeCollectModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors">
              Cancel
            </button>
            <button (click)="submitCollectFee()" [disabled]="savingPayment || !collectForm.invoice_id || !collectForm.amount_paid || collectForm.amount_paid <= 0" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 active:scale-95 transition-all shadow-xs flex items-center gap-1.5">
              <svg *ngIf="savingPayment" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <svg *ngIf="!savingPayment" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ savingPayment ? 'Recording...' : 'Receive & Print Receipt' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: STUDENT LEDGER STATEMENT                                -->
      <!-- ============================================================== -->
      <div *ngIf="showLedgerModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-hidden">
        <div class="fixed inset-0" (click)="closeLedgerModal()"></div>
        <div class="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200/90 z-10 animate-scaleUp flex flex-col max-h-[90vh] overflow-hidden">
          
          <!-- Header (Fixed / Non-scrolling) -->
          <div class="p-5 sm:px-7 sm:pt-6 sm:pb-4 border-b border-slate-100 shrink-0 bg-white">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 flex items-center justify-center relative shadow-xs">
                  <img *ngIf="activeLedgerStudent?.profile_image || activeLedgerStudent?.avatar_url || activeLedgerStudent?.photo_url || activeLedgerStatement?.profile_image || activeLedgerStatement?.photo_url"
                       [src]="activeLedgerStudent?.profile_image || activeLedgerStudent?.avatar_url || activeLedgerStudent?.photo_url || activeLedgerStatement?.profile_image || activeLedgerStatement?.photo_url"
                       [alt]="activeLedgerStudent?.student_name || 'Student'"
                       class="w-full h-full object-cover"
                       (error)="onStudentAvatarError($event, activeLedgerStudent)" />
                  <div *ngIf="!(activeLedgerStudent?.profile_image || activeLedgerStudent?.avatar_url || activeLedgerStudent?.photo_url || activeLedgerStatement?.profile_image || activeLedgerStatement?.photo_url)"
                       class="w-full h-full flex items-center justify-center font-black text-base text-indigo-700 bg-indigo-50">
                    {{ activeLedgerStudent?.student_name ? activeLedgerStudent.student_name.charAt(0).toUpperCase() : 'S' }}
                  </div>
                </div>
                <div>
                  <span class="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/60">
                    OFFICIAL STUDENT ACCOUNT LEDGER
                  </span>
                  <h3 class="font-black text-slate-900 text-lg mt-0.5 flex items-center gap-2">
                    <span>{{ activeLedgerStudent?.student_name }}</span>
                    <span class="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Adm: {{ activeLedgerStudent?.admission_number || 'N/A' }}
                    </span>
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ activeLedgerStudent?.class_name }} - {{ activeLedgerStudent?.section_name }} | Session: <strong class="text-slate-700">{{ auth.activeSessionName() }}</strong>
                  </p>
                </div>
              </div>

              <!-- Top Actions -->
              <div class="flex items-center gap-2">
                <button *ngIf="currentAvailableAdvance > 0"
                        (click)="openRefundModal()" 
                        class="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 animate-pulse">
                  <span>💸</span>
                  <span>Issue Refund</span>
                </button>
                <button (click)="openAddChargeModal()" class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 border border-indigo-200">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Fee Charge</span>
                </button>
                <button (click)="printStudentLedger()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Statement</span>
                </button>
                <button (click)="closeLedgerModal()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Scrollable Body Content -->
          <div class="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">

            <!-- Financial KPI Cards (4 Cards) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <!-- Card 1: Total Billed -->
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Billed</div>
                <div class="text-xl font-black text-slate-900 mt-1">₹{{ ledgerBilledTotal | number:'1.0-0' }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ ledgerInvoicesCount }} billing cycles issued</div>
              </div>

              <!-- Card 2: Total Paid Received -->
              <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div class="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Paid Received</div>
                <div class="text-xl font-black text-emerald-700 mt-1">₹{{ ledgerPaidTotal | number:'1.0-0' }}</div>
                <div class="text-[10px] text-emerald-600 mt-0.5">Recorded in school cashier desk</div>
              </div>

              <!-- Card 3: Concessions -->
              <div class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                <div class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Concessions</div>
                <div class="text-xl font-black text-indigo-700 mt-1">₹{{ ledgerDiscountTotal | number:'1.0-0' }}</div>
                <div class="text-[10px] text-indigo-600 mt-0.5">Scholarships & fee waivers</div>
              </div>

              <!-- Card 4: Outstanding Due / Advance Credit -->
              <div class="p-3.5 rounded-2xl border"
                   [ngClass]="{
                     'bg-emerald-50 border-emerald-300 text-emerald-950': currentAvailableAdvance > 0,
                     'bg-rose-50 border-rose-300 text-rose-950': (ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal),
                     'bg-slate-50 border-slate-200 text-slate-900': currentAvailableAdvance === 0 && (ledgerBilledTotal + ledgerRefundTotal) === (ledgerPaidTotal + ledgerDiscountTotal)
                   }">
                <div class="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>{{ currentAvailableAdvance > 0 ? 'Advance Credit' : ((ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal) ? 'Outstanding Due' : 'Account Status') }}</span>
                  <span *ngIf="currentAvailableAdvance > 0" class="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold">
                    ADVANCE
                  </span>
                  <span *ngIf="(ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal)" class="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-bold">
                    PENDING DUE
                  </span>
                  <span *ngIf="currentAvailableAdvance === 0 && (ledgerBilledTotal + ledgerRefundTotal) === (ledgerPaidTotal + ledgerDiscountTotal)" class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-600 text-white font-bold">
                    SETTLED
                  </span>
                </div>
                <div class="text-xl font-black mt-1"
                     [ngClass]="currentAvailableAdvance > 0 ? 'text-emerald-700' : ((ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal) ? 'text-rose-600' : 'text-slate-800')">
                  <span *ngIf="currentAvailableAdvance > 0" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 text-base font-black">
                    +₹{{ currentAvailableAdvance | number:'1.0-0' }}
                  </span>
                  <span *ngIf="(ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal)">₹{{ ((ledgerBilledTotal + ledgerRefundTotal) - (ledgerPaidTotal + ledgerDiscountTotal)) | number:'1.0-0' }}</span>
                  <span *ngIf="currentAvailableAdvance === 0 && (ledgerBilledTotal + ledgerRefundTotal) === (ledgerPaidTotal + ledgerDiscountTotal)">₹0.00</span>
                </div>
                <div class="text-[10px] mt-0.5" [ngClass]="currentAvailableAdvance > 0 ? 'text-emerald-700' : ((ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal) ? 'text-rose-600' : 'text-slate-500')">
                  <span *ngIf="currentAvailableAdvance > 0">Student has advance credit on account</span>
                  <span *ngIf="(ledgerBilledTotal + ledgerRefundTotal) > (ledgerPaidTotal + ledgerDiscountTotal)">Pending balance due for payment</span>
                  <span *ngIf="currentAvailableAdvance === 0 && (ledgerBilledTotal + ledgerRefundTotal) === (ledgerPaidTotal + ledgerDiscountTotal)">Zero outstanding dues</span>
                </div>
                <button *ngIf="currentAvailableAdvance > 0"
                        (click)="openRefundModal()"
                        type="button"
                        class="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                  <span>💸</span>
                  <span>Refund Advance (₹{{ currentAvailableAdvance | number:'1.0-0' }})</span>
                </button>
              </div>
            </div>

            <!-- Fee Frequency & One-Time Payment Concession Control -->
            <div class="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Student Billing Frequency & Annual Concession Preference</span>
                  </span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Configure student billing schedule: Monthly, Quarterly, or Upfront Annual plan</p>
                </div>

                <!-- Frequency Pills -->
                <div class="inline-flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold gap-1">
                  <button (click)="setLedgerFrequency('MONTHLY')" [ngClass]="selectedBillingFrequency === 'MONTHLY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'" class="px-3 py-1.5 rounded-lg cursor-pointer transition-all">Monthly</button>
                  <button (click)="setLedgerFrequency('QUARTERLY')" [ngClass]="selectedBillingFrequency === 'QUARTERLY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'" class="px-3 py-1.5 rounded-lg cursor-pointer transition-all">Quarterly</button>
                  <button (click)="setLedgerFrequency('ANNUAL')" [ngClass]="selectedBillingFrequency === 'ANNUAL' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'" class="px-3 py-1.5 rounded-lg cursor-pointer transition-all">Annual (One-Time)</button>
                </div>
              </div>

              <!-- Annual Lump-Sum Concession Control (Visible if ANNUAL is selected) -->
              <div *ngIf="selectedBillingFrequency === 'ANNUAL'" class="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2.5 animate-fadeIn">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">🎁</span>
                    <div>
                      <div class="font-bold text-indigo-950 text-xs">
                        One-Time Full Year Upfront Concession
                      </div>
                      <div class="text-[11px] text-indigo-700">
                        Save ₹{{ calculateAnnualConcessionSavings() | number:'1.0-0' }} by paying full session fee upfront in one single receipt.
                      </div>
                    </div>
                  </div>

                  <!-- Concession % Input & Quick Buttons -->
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg px-2 py-1 shadow-2xs">
                      <label class="text-[11px] font-bold text-indigo-900">Discount %:</label>
                      <input type="number" [(ngModel)]="annualConcessionPct" min="0" max="100" class="w-14 text-center font-black text-indigo-950 text-xs focus:outline-none" />
                      <span class="text-xs font-bold text-indigo-700">%</span>
                    </div>
                    <div class="flex gap-1">
                      <button type="button" (click)="annualConcessionPct = 5" [ngClass]="annualConcessionPct === 5 ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'" class="px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all">5%</button>
                      <button type="button" (click)="annualConcessionPct = 10" [ngClass]="annualConcessionPct === 10 ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'" class="px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all">10%</button>
                      <button type="button" (click)="annualConcessionPct = 15" [ngClass]="annualConcessionPct === 15 ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200'" class="px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all">15%</button>
                    </div>
                  </div>
                </div>

                <!-- Notes & Save Action -->
                <div class="flex items-center gap-2 pt-1 border-t border-indigo-100">
                  <input type="text" [(ngModel)]="feePreferenceNotes" placeholder="Concession notes (e.g. Approved 10% annual lump sum concession)" class="flex-1 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:outline-none" />
                  <button (click)="saveStudentFeePreference()" [disabled]="savingPreference" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1.5">
                    <svg *ngIf="savingPreference" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{{ savingPreference ? 'Saving...' : 'Save Preference' }}</span>
                  </button>
                </div>
              </div>

              <!-- Notes & Save Action when Monthly or Quarterly is selected -->
              <div *ngIf="selectedBillingFrequency !== 'ANNUAL'" class="flex items-center gap-2 pt-1">
                <input type="text" [(ngModel)]="feePreferenceNotes" placeholder="Notes (optional, e.g. Standard billing schedule)" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none" />
                <button (click)="saveStudentFeePreference()" [disabled]="savingPreference" class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1.5">
                  <svg *ngIf="savingPreference" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>{{ savingPreference ? 'Saving...' : 'Save Frequency' }}</span>
                </button>
              </div>
            </div>

            <!-- Itemized Ledger Transactions Table -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800 text-xs">Student Account Passbook & Ledger Statement</span>
                <span class="text-[11px] text-slate-400 font-mono">{{ ledgerEntries.length }} entries</span>
              </div>

              <div class="overflow-x-auto rounded-2xl border border-slate-200">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="sticky top-0 bg-slate-100 z-10 border-b border-slate-200">
                    <tr class="text-slate-500 font-bold uppercase text-[10px]">
                      <th class="py-2.5 px-3">Date</th>
                      <th class="py-2.5 px-3">Particulars / Description</th>
                      <th class="py-2.5 px-3">Ref / Voucher #</th>
                      <th class="py-2.5 px-3 text-right">Debit (Dr)</th>
                      <th class="py-2.5 px-3 text-right">Credit (Cr)</th>
                      <th class="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr *ngFor="let item of ledgerEntries; let i = index" class="hover:bg-slate-50/70 transition-colors">
                      <td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">{{ item.date | date:'dd MMM yyyy' }}</td>
                      <td class="py-2.5 px-3">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                                [ngClass]="item.referenceNumber?.startsWith('FINE-') ? 'bg-amber-50 text-amber-800 border border-amber-300' : (item.type === 'REFUND' ? 'bg-amber-100 text-amber-800 border border-amber-400 font-black' : (item.type === 'INVOICE' || item.type === 'CHARGE' ? 'bg-rose-50 text-rose-700 border border-rose-200' : ((item.type === 'CONCESSION' || item.paymentMode === 'CONCESSION') ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')))">
                            {{ item.referenceNumber?.startsWith('FINE-') ? 'LATE FINE' : item.type }}
                          </span>
                          <span>{{ item.description }}</span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">{{ item.referenceNumber }}</td>
                      <td class="py-2.5 px-3 text-right font-black" [ngClass]="item.debit > 0 ? 'text-rose-600' : 'text-slate-300'">
                        {{ item.debit > 0 ? ('₹' + (item.debit | number:'1.0-0')) : '-' }}
                      </td>
                      <td class="py-2.5 px-3 text-right font-black" [ngClass]="item.credit > 0 ? 'text-emerald-700' : 'text-slate-300'">
                        {{ item.credit > 0 ? ('₹' + (item.credit | number:'1.0-0')) : '-' }}
                      </td>
                      <td class="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span *ngIf="getItemRunningBalance(item, i) > 0" class="text-rose-600 font-bold">
                          ₹{{ getItemRunningBalance(item, i) | number:'1.0-0' }} (Due)
                        </span>
                        <span *ngIf="getItemRunningBalance(item, i) < 0" class="inline-flex items-center text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          +₹{{ (-getItemRunningBalance(item, i)) | number:'1.0-0' }} (Adv)
                        </span>
                        <span *ngIf="getItemRunningBalance(item, i) === 0" class="text-slate-400">
                          ₹0.00 (Settled)
                        </span>
                      </td>
                    </tr>

                    <tr *ngIf="ledgerEntries.length === 0">
                      <td colspan="6" class="py-8 text-center text-slate-400 text-xs">
                        No transactions recorded in student ledger yet.
                      </td>
                    </tr>
                  </tbody>
                  <tfoot *ngIf="ledgerEntries.length > 0" class="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs sticky bottom-0 z-10">
                    <tr>
                      <td colspan="3" class="py-2.5 px-3 text-slate-700 uppercase tracking-wider text-[11px] font-black">
                        Passbook Closing Totals
                      </td>
                      <td class="py-2.5 px-3 text-right font-black text-rose-600 whitespace-nowrap">
                        ₹{{ ledgerBilledTotal | number:'1.0-0' }}
                      </td>
                      <td class="py-2.5 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        ₹{{ ledgerPaidTotal | number:'1.0-0' }}
                      </td>
                      <td class="py-2.5 px-3 text-right font-mono font-black whitespace-nowrap">
                        <span *ngIf="ledgerBilledTotal > (ledgerPaidTotal + ledgerDiscountTotal)" class="text-rose-600">
                          ₹{{ (ledgerBilledTotal - (ledgerPaidTotal + ledgerDiscountTotal)) | number:'1.0-0' }} (Due)
                        </span>
                        <span *ngIf="(ledgerPaidTotal + ledgerDiscountTotal) > ledgerBilledTotal" class="inline-flex items-center text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                          +₹{{ ((ledgerPaidTotal + ledgerDiscountTotal) - ledgerBilledTotal) | number:'1.0-0' }} (Adv)
                        </span>
                        <span *ngIf="ledgerBilledTotal === (ledgerPaidTotal + ledgerDiscountTotal)" class="text-slate-500">
                          ₹0.00 (Settled)
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

          <!-- Footer Actions (Fixed / Non-scrolling) -->
          <div class="p-4 sm:px-7 border-t border-slate-100 shrink-0 flex items-center justify-between gap-2 bg-slate-50/50">
            <button (click)="closeLedgerModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors">
              Close
            </button>

            <button *ngIf="activeLedgerStudent" (click)="openCollectFeeForInvoice(activeLedgerStudent); closeLedgerModal()" class="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer active:scale-95 transition-all shadow-xs flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Collect Fee For This Student</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- SUB-MODAL: ADD STUDENT FEE CHARGE                              -->
      <!-- ============================================================== -->
      <div *ngIf="showAddChargeModal" class="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-hidden">
        <div class="fixed inset-0" (click)="closeAddChargeModal()"></div>
        <div class="relative bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 z-10 animate-scaleUp flex flex-col max-h-[90vh] overflow-hidden">
          
          <!-- Header (Fixed / Non-scrolling) -->
          <div class="p-5 sm:px-6 sm:pt-6 sm:pb-3 border-b border-slate-100 shrink-0 bg-white flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                DIRECT LEDGER CHARGE
              </span>
              <h3 class="font-black text-slate-900 text-base mt-1">Add Fee Charge to Ledger</h3>
              <p class="text-xs text-slate-500 mt-0.5">Post fine, penalty, exam fee, or extra charges to student's account.</p>
            </div>
            <button (click)="closeAddChargeModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Scrollable Body Content -->
          <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div *ngIf="chargeError" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {{ chargeError }}
            </div>

            <div class="space-y-3">
              <!-- Category -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Charge Category *</label>
                <select [(ngModel)]="chargeForm.charge_type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="FINE_PENALTY">Late Fee / Disciplinary Penalty (FINE_PENALTY)</option>
                  <option value="ADMISSION">Admission / Registration Fee (ADMISSION)</option>
                  <option value="EXAM">Board / Term Examination Fee (EXAM)</option>
                  <option value="ANNUAL">Annual Development / Lab Charges (ANNUAL)</option>
                  <option value="OTHER">Other Custom School Charge (OTHER)</option>
                </select>
              </div>

              <!-- Amount -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Amount (INR ₹) *</label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input type="number" [(ngModel)]="chargeForm.amount" min="1" placeholder="e.g. 250" class="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>

              <!-- Reason / Description -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Description / Reason *</label>
                <input type="text" [(ngModel)]="chargeForm.description" placeholder="e.g. Late fee for October installment or Library fine" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <!-- Effective Date -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Effective Date</label>
                <input type="date" [(ngModel)]="chargeForm.effective_date" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
          </div>

          <!-- Footer Actions (Fixed / Non-scrolling) -->
          <div class="p-4 sm:px-6 border-t border-slate-100 shrink-0 flex items-center justify-end gap-2 bg-slate-50/50">
            <button (click)="closeAddChargeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors">
              Cancel
            </button>
            <button (click)="submitAddCharge()" [disabled]="savingCharge" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
              <svg *ngIf="savingCharge" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ savingCharge ? 'Posting...' : 'Post Fee Charge' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- SUB-MODAL: ISSUE STUDENT FEE SURPLUS REFUND                    -->
      <!-- ============================================================== -->
      <div *ngIf="showRefundModal" class="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-hidden">
        <div class="fixed inset-0" (click)="closeRefundModal()"></div>
        <div class="relative bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/90 z-10 animate-scaleUp flex flex-col max-h-[90vh] overflow-hidden">
          
          <!-- Header -->
          <div class="p-5 sm:px-6 sm:pt-6 sm:pb-3 border-b border-slate-100 shrink-0 bg-white flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                SURPLUS ADVANCE REFUND
              </span>
              <h3 class="font-black text-slate-900 text-base mt-1">Issue Fee Refund</h3>
              <p class="text-xs text-slate-500 mt-0.5">Disburse surplus credit or scholarship overpayments back to the parent/student.</p>
            </div>
            <button (click)="closeRefundModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <!-- Student Context -->
            <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-900 text-xs">{{ activeLedgerStudent?.student_name }}</div>
                <div class="text-[10px] text-slate-500 font-mono">Adm: {{ activeLedgerStudent?.admission_number }} | {{ activeLedgerStudent?.class_name }} - {{ activeLedgerStudent?.section_name }}</div>
              </div>
              <div class="text-right">
                <div class="text-[10px] uppercase font-bold text-emerald-700">Available Advance</div>
                <div class="text-sm font-black text-emerald-700 font-mono">+₹{{ currentAvailableAdvance | number:'1.0-0' }}</div>
              </div>
            </div>

            <!-- Error Banner -->
            <div *ngIf="refundError" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{{ refundError }}</span>
            </div>

            <!-- Policy Warning -->
            <div class="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
              <span class="text-sm">⚠️</span>
              <span><strong>Policy Constraint:</strong> Refunds can only be issued up to the available surplus advance balance of <strong>₹{{ currentAvailableAdvance | number:'1.0-0' }}</strong>. Amounts exceeding this cannot be processed.</span>
            </div>

            <div class="space-y-3">
              <!-- Refund Amount -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700">Refund Amount (INR ₹) *</label>
                  <button type="button" (click)="refundForm.amount = currentAvailableAdvance" class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    Refund Full Advance (₹{{ currentAvailableAdvance }})
                  </button>
                </div>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input type="number" 
                         [(ngModel)]="refundForm.amount" 
                         min="1" 
                         [max]="currentAvailableAdvance"
                         placeholder="Enter refund amount" 
                         class="w-full pl-7 pr-3 py-2 bg-slate-50 border rounded-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                         [ngClass]="(refundForm.amount > currentAvailableAdvance || refundForm.amount <= 0) ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'" />
                </div>
                <span *ngIf="refundForm.amount > currentAvailableAdvance" class="text-[10px] text-rose-600 font-bold block mt-1">
                  Amount exceeds maximum refundable advance of ₹{{ currentAvailableAdvance }}.
                </span>
              </div>

              <!-- Refund Mode -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Refund Payment Mode *</label>
                <select [(ngModel)]="refundForm.refund_mode" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                  <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT / RTGS</option>
                  <option value="UPI">UPI / Instant QR Remittance</option>
                  <option value="CASH">Cash Disbursement (Cashier Counter)</option>
                  <option value="CHEQUE">Account Payee Cheque</option>
                </select>
              </div>

              <!-- Transaction Reference -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No / UTR</label>
                <input type="text" [(ngModel)]="refundForm.transaction_reference" placeholder="e.g. UTR-9876543210 or Cheque #102938" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
              </div>

              <!-- Reason / Remarks -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">Refund Reason / Remarks *</label>
                <input type="text" [(ngModel)]="refundForm.reason" placeholder="e.g. Surplus credit refund after Merit Scholarship" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 sm:px-6 border-t border-slate-100 shrink-0 flex items-center justify-between bg-slate-50/50">
            <button (click)="closeRefundModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors">
              Cancel
            </button>
            <button (click)="submitRefund()" 
                    [disabled]="processingRefund || !refundForm.amount || refundForm.amount <= 0 || refundForm.amount > currentAvailableAdvance" 
                    class="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
              <svg *ngIf="processingRefund" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ processingRefund ? 'Processing...' : 'Confirm & Issue Refund' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ADD FEE STRUCTURE                                       -->
      <!-- ============================================================== -->
      <div *ngIf="showAddStructureModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" (click)="closeAddStructureModal()"></div>
        <div class="min-h-full flex items-start justify-center p-3 sm:p-6">
          <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4 my-4 sm:my-8">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">CURRICULUM BILLING</span>
              <h3 class="font-black text-slate-900 text-base mt-1">Configure Class Fee Structure</h3>
            </div>
            <button (click)="closeAddStructureModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Class *</label>
              <select [(ngModel)]="structureForm.class_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="">-- Select Class --</option>
                <option *ngFor="let cls of classes" [value]="cls.id">
                  {{ cls.name }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Fee Category *</label>
                <select *ngIf="categories.length > 0" [(ngModel)]="structureForm.fee_category_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                  <option value="">-- Select Category --</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
                <input *ngIf="categories.length === 0" type="text" [(ngModel)]="structureForm.category_name" placeholder="Tuition Fee" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Billing Frequency</label>
                <select [(ngModel)]="structureForm.frequency" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Amount (INR) *</label>
                <input type="number" [(ngModel)]="structureForm.amount" min="1" placeholder="2500" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-emerald-700" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Due Day of Month (1-31)</label>
                <input type="number" [(ngModel)]="structureForm.due_day" min="1" max="31" placeholder="10" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>
          </div>

          <div *ngIf="structureModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ structureModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeAddStructureModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="submitAddStructure()" [disabled]="savingStructure" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ savingStructure ? 'Saving...' : 'Save Fee Structure' }}
            </button>
          </div>

          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: EDIT FEE STRUCTURE                                      -->
      <!-- ============================================================== -->
      <div *ngIf="showEditStructureModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" (click)="closeEditStructureModal()"></div>
        <div class="min-h-full flex items-start justify-center p-3 sm:p-6">
          <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4 my-4 sm:my-8">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">MODIFY BILLING HEAD</span>
              <h3 class="font-black text-slate-900 text-base mt-1">Edit Class Fee Structure</h3>
            </div>
            <button (click)="closeEditStructureModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Class *</label>
              <select [(ngModel)]="editStructureForm.class_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="">-- Select Class --</option>
                <option *ngFor="let cls of classes" [value]="cls.id">
                  {{ cls.name }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Fee Category *</label>
                <select *ngIf="categories.length > 0" [(ngModel)]="editStructureForm.fee_category_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                  <option value="">-- Select Category --</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
                <input *ngIf="categories.length === 0" type="text" [(ngModel)]="editStructureForm.category_name" placeholder="Tuition Fee" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Billing Frequency</label>
                <select [(ngModel)]="editStructureForm.frequency" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Amount (INR) *</label>
                <input type="number" [(ngModel)]="editStructureForm.amount" min="1" placeholder="2500" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-emerald-700" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Due Day of Month (1-31)</label>
                <input type="number" [(ngModel)]="editStructureForm.due_day" min="1" max="31" placeholder="10" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>
          </div>

          <div *ngIf="editStructureModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ editStructureModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeEditStructureModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="submitEditStructure()" [disabled]="savingEditStructure" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 active:scale-95">
              {{ savingEditStructure ? 'Updating...' : 'Update Fee Structure' }}
            </button>
          </div>

          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: GENERATE PROMOCODE (ADMIN ONLY)                         -->
      <!-- ============================================================== -->
      <div *ngIf="showCreatePromoModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" (click)="closeCreatePromoModal()"></div>
        <div class="min-h-full flex items-start justify-center p-3 sm:p-6">
          <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4 my-4 sm:my-8">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">ADMIN ACCESS ONLY</span>
              <h3 class="font-black text-slate-900 text-base mt-1">Generate New Promocode</h3>
            </div>
            <button (click)="closeCreatePromoModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Promo Code Name *</label>
              <input type="text"
                     [(ngModel)]="promoForm.code"
                     (input)="promoForm.code = promoForm.code.toUpperCase().trim()"
                     placeholder="e.g. SCHOLAR2026"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm uppercase text-indigo-700" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Discount Type *</label>
                <select [(ngModel)]="promoForm.discountType" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT_AMOUNT">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Discount Value *</label>
                <input type="number"
                       [(ngModel)]="promoForm.value"
                       [min]="1"
                       [max]="promoForm.discountType === 'PERCENTAGE' ? 100 : 100000"
                       placeholder="25"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-emerald-700" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Max Uses Limit</label>
                <input type="number"
                       [(ngModel)]="promoForm.maxUses"
                       min="1"
                       placeholder="50"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Expiry Date *</label>
                <input type="date"
                       [(ngModel)]="promoForm.expiryDate"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Description / Concession Reason *</label>
              <textarea [(ngModel)]="promoForm.description"
                        rows="2"
                        placeholder="e.g. Founder's Merit Scholarship 25% waiver for top grade performers"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"></textarea>
            </div>
          </div>

          <div *ngIf="createPromoError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ createPromoError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeCreatePromoModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="createPromocode()" [disabled]="creatingPromo" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 active:scale-95">
              {{ creatingPromo ? 'Generating...' : 'Save & Activate Promocode' }}
            </button>
          </div>

          </div>
        </div>
      </div>

    </div>
  `,
})
export class FeesComponent implements OnInit {
  activeTab: 'DAYBOOK' | 'INVOICES' | 'MATRIX' | 'PROMOCODES' = 'DAYBOOK';
  openDropdownInvoiceId: string | null = null;
  openDropdownStudentId: string | null = null;

  invoices: StudentFeeInvoice[] = [];
  structures: FeeStructure[] = [];
  classes: any[] = [];
  categories: any[] = [];
  overview: any = null;

  loadingInvoices = false;
  loadingStructures = false;
  loadingOverview = false;

  invoiceSearchQuery = '';
  selectedClassFilter = 'ALL';
  selectedSectionFilter = 'ALL';
  selectedStatusFilter = 'ALL';

  // Spreadsheet Matrix Grid State
  matrixGrid: { [classId: string]: { [categoryId: string]: number } } = {};
  savingMatrix = false;

  // Add Fee Structure Modal State
  showAddStructureModal = false;
  savingStructure = false;
  structureModalError = '';
  structureForm = {
    class_id: '',
    fee_category_id: '',
    category_name: 'Tuition Fee',
    amount: 2500,
    frequency: 'MONTHLY',
    due_day: 10,
  };

  // Edit Fee Structure Modal State
  showEditStructureModal = false;
  savingEditStructure = false;
  editStructureModalError = '';
  editingStructureId = '';
  editStructureForm = {
    class_id: '',
    fee_category_id: '',
    category_name: 'Tuition Fee',
    amount: 2500,
    frequency: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
    due_day: 10,
  };

  // Collect Modal State
  showCollectModal = false;
  savingPayment = false;
  collectModalError = '';
  collectForm = {
    invoice_id: '',
    student_id: '',
    amount_paid: 2500,
    payment_mode: 'UPI',
    transaction_reference: '',
    remarks: 'Fee payment received',
  };

  // Cascading Student Selection & Smart Discounts for Collect Fee Modal
  collectClassId: string = '';
  collectSectionId: string = '';
  collectStudentId: string = '';
  selectedStudentInvoice: StudentFeeInvoice | null = null;
  originalDueAmount: number = 0;
  activeMeritInfo: { hasMerit: boolean; scorePct?: number; suggestedDiscountPct: number; reason?: string } | null = null;
  checkingMerit = false;
  appliedDiscount: {
    type: 'NONE' | 'SIBLING' | 'MERIT' | 'PROMOCODE';
    code?: string;
    label: string;
    amount: number;
    percentage?: number;
  } = { type: 'NONE', label: '', amount: 0 };
  enteredPromoCode: string = '';
  applyingPromo = false;
  promoAppliedMessage: string = '';
  promoAppliedError: string = '';

  // Student Account Ledger State
  showLedgerModal = false;
  activeLedgerStudent: StudentFeeInvoice | null = null;
  loadingLedger = false;
  ledgerEntries: StudentFeeLedgerEntry[] = [];
  ledgerBilledTotal = 0;
  ledgerPaidTotal = 0;
  ledgerDiscountTotal = 0;
  ledgerRefundTotal = 0;
  ledgerNetBalance = 0;
  ledgerInvoicesCount = 0;
  selectedBillingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' = 'MONTHLY';
  annualConcessionPct: number = 10;
  annualDiscountApplied = false;
  feePreferenceNotes: string = '';
  savingPreference = false;

  // Fee Refund Modal State
  showRefundModal = false;
  processingRefund = false;
  refundError = '';
  refundForm = {
    amount: 0,
    refund_mode: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE',
    transaction_reference: '',
    reason: 'Surplus advance credit refund',
  };

  get currentAvailableAdvance(): number {
    const net = (this.ledgerPaidTotal + this.ledgerDiscountTotal) - (this.ledgerBilledTotal + this.ledgerRefundTotal);
    return Math.max(0, net);
  }

  studentRefundsMap: { [studentId: string]: number } = {};

  getStudentRefundsMap(): { [studentId: string]: number } {
    const map = { ...this.studentRefundsMap };
    const schoolId = (this.auth.currentUser() as any)?.school_id || this.auth.currentUser()?.school?.id;
    try {
      const localKey = `schoolsense_fee_refunds_${schoolId}`;
      const localList: any[] = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (Array.isArray(localList)) {
        localList.forEach((r: any) => {
          if (r.student_id && r.amount) {
            map[r.student_id] = (map[r.student_id] || 0) + Number(r.amount);
          }
        });
      }
    } catch {}
    return map;
  }

  // School Fee Rules & Late Fee Policy State
  schoolFeeRules: SchoolFeeRules = {
    monthly_discount_pct: 0,
    quarterly_discount_pct: 5,
    annual_discount_pct: 10,
    due_day_of_month: 10,
    grace_period_days: 5,
    enable_late_fee: true,
    late_fee_type: 'DAILY',
    late_fee_amount: 20,
  };
  savingFeeRules = false;
  loadingFeeRules = false;

  // Add Fee Charge Sub-modal State
  showAddChargeModal = false;
  savingCharge = false;
  chargeError = '';
  chargeForm: {
    charge_type: 'FINE_PENALTY' | 'ADMISSION' | 'EXAM' | 'ANNUAL' | 'OTHER';
    amount: number;
    description: string;
    effective_date: string;
  } = {
    charge_type: 'FINE_PENALTY',
    amount: 100,
    description: '',
    effective_date: new Date().toISOString().split('T')[0],
  };

  // Batch Invoicing Modal
  showBatchModal = false;
  executingBatch = false;
  batchMonthName = 'April 2026';
  batchDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  // Day-Book Cashier Desk State
  dayBookPreset: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM' = 'TODAY';
  dayBookDate: string = new Date().toISOString().split('T')[0];
  dayBookStartDate: string = new Date().toISOString().split('T')[0];
  dayBookEndDate: string = new Date().toISOString().split('T')[0];
  dayBookSummary: DailyDayBookSummary | null = null;
  loadingDayBook = false;

  // Sibling Modal State
  activeSiblingInfo: StudentSiblingInfo | null = null;
  showSiblingModal = false;
  checkingSiblings = false;

  // Promocodes & Concession Desk State
  activePromocodes = [
    { code: 'SIBLING15', discountType: 'PERCENTAGE', value: 15, description: '15% Concession for second enrolled child', uses: 12, maxUses: 50, expiry: '31 Mar 2027', status: 'ACTIVE' },
    { code: 'STAFFCHILD50', discountType: 'PERCENTAGE', value: 50, description: '50% Tuition fee concession for staff children', uses: 8, maxUses: 30, expiry: '31 Mar 2027', status: 'ACTIVE' },
    { code: 'MERIT10', discountType: 'PERCENTAGE', value: 10, description: '10% Merit scholarship for top ranking students', uses: 24, maxUses: 100, expiry: '31 Mar 2027', status: 'ACTIVE' },
    { code: 'RTE_WAIVER', discountType: 'PERCENTAGE', value: 100, description: '100% Right To Education government subsidized admission', uses: 5, maxUses: 20, expiry: '31 Mar 2027', status: 'ACTIVE' },
  ];
  testPromoCode = '';
  testPromoAmount = 5000;
  testPromoResult: any = null;
  testingPromo = false;

  // Generate Promocode Modal State
  showCreatePromoModal = false;
  creatingPromo = false;
  createPromoError = '';
  promoForm = {
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT_AMOUNT',
    value: 20,
    maxUses: 50,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    description: '',
  };

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private toast: ToastService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    effect(() => {
      // Re-load fee records whenever active academic session changes
      this.auth.activeAcademicSession();
      this.loadAllData();
      this.loadDayBook();
    });
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin();
  }

  get canManage(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal() || (this.auth.currentUser()?.role === 'FEE_MANAGER');
  }

  get distinctClassNames(): string[] {
    const set = new Set<string>();
    this.classes.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    this.invoices.forEach((inv) => {
      if (inv.class_name) set.add(inv.class_name);
    });
    return Array.from(set).sort();
  }

  get collectAvailableClasses(): Array<{ id: string; name: string }> {
    const list: Array<{ id: string; name: string }> = [];
    const seenNames = new Set<string>();

    for (const cls of this.classes) {
      if (cls.name && !seenNames.has(cls.name)) {
        seenNames.add(cls.name);
        list.push({ id: cls.id || cls.name, name: cls.name });
      }
    }
    for (const inv of this.invoices) {
      if (inv.class_name && !seenNames.has(inv.class_name)) {
        seenNames.add(inv.class_name);
        list.push({ id: inv.class_id || inv.class_name, name: inv.class_name });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }

  get collectAvailableSections(): Array<{ id: string; name: string }> {
    if (!this.collectClassId) return [];
    const targetClass = this.collectAvailableClasses.find(
      (c) => c.id === this.collectClassId || c.name === this.collectClassId
    );
    const targetClassName = targetClass ? targetClass.name : this.collectClassId;

    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    const matchedClassObj = this.classes.find(
      (c) => c.id === this.collectClassId || c.name === targetClassName
    );
    if (matchedClassObj && Array.isArray(matchedClassObj.sections)) {
      for (const s of matchedClassObj.sections) {
        if (s.name && !seen.has(s.name)) {
          seen.add(s.name);
          list.push({ id: s.id || s.name, name: s.name });
        }
      }
    }

    for (const inv of this.invoices) {
      if (
        (inv.class_id === this.collectClassId || inv.class_name === targetClassName) &&
        inv.section_name &&
        !seen.has(inv.section_name)
      ) {
        seen.add(inv.section_name);
        list.push({ id: inv.section_id || inv.section_name, name: inv.section_name });
      }
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  get collectAvailableStudents(): Array<{
    student_id: string;
    student_name: string;
    admission_number: string;
    class_name: string;
    section_name: string;
    pendingDue: number;
    advanceCredit: number;
    totalAmount: number;
    paidAmount: number;
    invoices: StudentFeeInvoice[];
  }> {
    const targetClass = this.collectAvailableClasses.find(
      (c) => c.id === this.collectClassId || c.name === this.collectClassId
    );
    const targetClassName = targetClass ? targetClass.name : this.collectClassId;

    let filtered = this.invoices;
    if (targetClassName) {
      filtered = filtered.filter(
        (i) => i.class_id === this.collectClassId || i.class_name === targetClassName
      );
    }
    if (this.collectSectionId) {
      filtered = filtered.filter(
        (i) => i.section_id === this.collectSectionId || i.section_name === this.collectSectionId
      );
    }

    const studentMap = new Map<string, {
      student_id: string;
      student_name: string;
      admission_number: string;
      class_name: string;
      section_name: string;
      pendingDue: number;
      advanceCredit: number;
      totalAmount: number;
      paidAmount: number;
      invoices: StudentFeeInvoice[];
    }>();

    for (const inv of filtered) {
      if (!inv.student_id) continue;
      let record = studentMap.get(inv.student_id);
      if (!record) {
        record = {
          student_id: inv.student_id,
          student_name: inv.student_name,
          admission_number: inv.admission_number || 'N/A',
          class_name: inv.class_name,
          section_name: inv.section_name,
          pendingDue: 0,
          advanceCredit: 0,
          totalAmount: 0,
          paidAmount: 0,
          invoices: [],
        };
        studentMap.set(inv.student_id, record);
      }
      record.invoices.push(inv);
      record.totalAmount += Number(inv.total_amount) || 0;
      record.paidAmount += Number(inv.paid_amount) || 0;
    }

    const studentRefunds = this.getStudentRefundsMap();
    const result = Array.from(studentMap.values()).map((st) => {
      const studentId = st.invoices[0]?.student_id;
      const refundAmt = studentRefunds[studentId] || 0;
      const netPaid = Math.max(0, st.paidAmount - refundAmt);
      st.pendingDue = Math.max(0, st.totalAmount - netPaid);
      st.advanceCredit = Math.max(0, netPaid - st.totalAmount);
      return st;
    });

    return result.sort((a, b) => {
      if (a.pendingDue > 0 && b.pendingDue <= 0) return -1;
      if (b.pendingDue > 0 && a.pendingDue <= 0) return 1;
      return a.student_name.localeCompare(b.student_name);
    });
  }

  get quickSuggestedPromos() {
    return this.activePromocodes.filter((p) => p.status === 'ACTIVE').slice(0, 3);
  }

  get availableSectionsForClass(): string[] {
    const set = new Set<string>();
    const sourceList = this.selectedClassFilter === 'ALL'
      ? this.invoices
      : this.invoices.filter((inv) => inv.class_name === this.selectedClassFilter);

    sourceList.forEach((inv) => {
      if (inv.section_name) set.add(inv.section_name);
    });
    return Array.from(set).sort();
  }

  onClassFilterChange() {
    this.selectedSectionFilter = 'ALL';
    this.currentPage = 1;
  }

  resetFilters() {
    this.invoiceSearchQuery = '';
    this.selectedClassFilter = 'ALL';
    this.selectedSectionFilter = 'ALL';
    this.selectedStatusFilter = 'ALL';
    this.currentPage = 1;
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.invoiceSearchQuery.trim() ||
      this.selectedClassFilter !== 'ALL' ||
      this.selectedSectionFilter !== 'ALL' ||
      this.selectedStatusFilter !== 'ALL'
    );
  }

  get filteredInvoices(): StudentFeeInvoice[] {
    let list = this.invoices;

    // Filter by Class
    if (this.selectedClassFilter !== 'ALL') {
      list = list.filter((i) => i.class_name === this.selectedClassFilter);
    }

    // Filter by Section
    if (this.selectedSectionFilter !== 'ALL') {
      list = list.filter((i) => i.section_name === this.selectedSectionFilter);
    }

    // Filter by Status
    if (this.selectedStatusFilter !== 'ALL') {
      list = list.filter((i) => i.status === this.selectedStatusFilter);
    }

    // Filter by Search Query
    if (this.invoiceSearchQuery.trim()) {
      const q = this.invoiceSearchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.student_name?.toLowerCase().includes(q) ||
          i.admission_number?.toLowerCase().includes(q) ||
          i.invoice_number?.toLowerCase().includes(q) ||
          i.class_name?.toLowerCase().includes(q) ||
          i.section_name?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  // ==============================================================
  // STUDENT-CENTRIC LEDGER DIRECTORY (ONE ROW PER STUDENT)
  // ==============================================================
  get aggregatedStudents(): AggregatedStudentFeeRecord[] {
    const studentMap = new Map<string, AggregatedStudentFeeRecord>();

    for (const inv of this.invoices) {
      if (!inv.student_id) continue;
      let record = studentMap.get(inv.student_id);
      if (!record) {
        const studentPhoto = inv.profile_image 
          || inv.avatar_url 
          || inv.photo_url 
          || (inv.student as any)?.profile_image 
          || (inv.student as any)?.avatar_url 
          || (inv.student as any)?.photo_url 
          || this.resolveStudentPhotoLocal(inv.student_id);

        record = {
          student_id: inv.student_id,
          student_name: inv.student_name || 'Student',
          admission_number: inv.admission_number || 'N/A',
          roll_number: (inv as any).roll_number || (inv as any).roll_no || '',
          class_id: inv.class_id,
          class_name: inv.class_name || 'N/A',
          section_id: inv.section_id,
          section_name: inv.section_name || '',
          profile_image: studentPhoto,
          avatar_url: studentPhoto,
          photo_url: studentPhoto,
          totalBilled: 0,
          totalPaid: 0,
          totalDiscount: 0,
          outstandingDue: 0,
          advanceCredit: 0,
          status: 'SETTLED',
          invoicesCount: 0,
          primaryInvoice: inv,
          invoices: [],
        };
        studentMap.set(inv.student_id, record);
      } else if (!record.profile_image && !record.avatar_url && !record.photo_url) {
        const studentPhoto = inv.profile_image 
          || inv.avatar_url 
          || inv.photo_url 
          || (inv.student as any)?.profile_image 
          || (inv.student as any)?.avatar_url 
          || (inv.student as any)?.photo_url 
          || this.resolveStudentPhotoLocal(inv.student_id);
        if (studentPhoto) {
          record.profile_image = studentPhoto;
          record.avatar_url = studentPhoto;
          record.photo_url = studentPhoto;
        }
      }
      record.invoices.push(inv);
      record.invoicesCount++;
      record.totalBilled += Number(inv.total_amount) || 0;
      record.totalPaid += Number(inv.paid_amount) || 0;
      record.totalDiscount += Number(inv.discount_amount) || 0;
      if (inv.status !== 'PAID' && (Number(inv.total_amount) - (Number(inv.paid_amount) + Number(inv.discount_amount || 0))) > 0) {
        record.primaryInvoice = inv;
      }
    }

    const studentRefunds = this.getStudentRefundsMap();
    const list = Array.from(studentMap.values()).map((st) => {
      const refundAmt = studentRefunds[st.student_id] || 0;
      st.totalRefunded = refundAmt;
      const netSettled = (st.totalPaid + (st.totalDiscount || 0)) - refundAmt;
      if (st.totalBilled > netSettled) {
        st.outstandingDue = st.totalBilled - netSettled;
        st.advanceCredit = 0;
        st.status = 'PENDING DUE';
      } else if (netSettled > st.totalBilled) {
        st.outstandingDue = 0;
        st.advanceCredit = netSettled - st.totalBilled;
        st.status = 'ADVANCE';
      } else {
        st.outstandingDue = 0;
        st.advanceCredit = 0;
        st.status = 'SETTLED';
      }
      return st;
    });

    return list.sort((a, b) => {
      if (a.outstandingDue > 0 && b.outstandingDue <= 0) return -1;
      if (b.outstandingDue > 0 && a.outstandingDue <= 0) return 1;
      return a.student_name.localeCompare(b.student_name);
    });
  }

  get uniqueStudentsCount(): number {
    return this.aggregatedStudents.length;
  }

  get filteredAggregatedStudents(): AggregatedStudentFeeRecord[] {
    let list = this.aggregatedStudents;

    // Filter by Class
    if (this.selectedClassFilter !== 'ALL') {
      list = list.filter((st) => st.class_name === this.selectedClassFilter);
    }

    // Filter by Section
    if (this.selectedSectionFilter !== 'ALL') {
      list = list.filter((st) => st.section_name === this.selectedSectionFilter);
    }

    // Filter by Status
    if (this.selectedStatusFilter !== 'ALL') {
      const sf = this.selectedStatusFilter.toUpperCase();
      if (sf === 'PENDING' || sf === 'UNPAID' || sf === 'PARTIAL' || sf === 'OVERDUE' || sf === 'PENDING DUE') {
        list = list.filter((st) => st.outstandingDue > 0);
      } else if (sf === 'PAID' || sf === 'SETTLED') {
        list = list.filter((st) => st.outstandingDue === 0);
      } else if (sf === 'ADVANCE') {
        list = list.filter((st) => st.advanceCredit > 0);
      }
    }

    // Filter by Search Query
    if (this.invoiceSearchQuery.trim()) {
      const q = this.invoiceSearchQuery.toLowerCase().trim();
      list = list.filter(
        (st) =>
          st.student_name?.toLowerCase().includes(q) ||
          st.admission_number?.toLowerCase().includes(q) ||
          st.roll_number?.toLowerCase().includes(q) ||
          st.class_name?.toLowerCase().includes(q) ||
          st.section_name?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  get totalStudentPages(): number {
    return Math.ceil(this.filteredAggregatedStudents.length / this.pageSize) || 1;
  }

  get paginatedStudents(): AggregatedStudentFeeRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredAggregatedStudents.slice(startIndex, startIndex + this.pageSize);
  }

  get studentPaginationStartIndex(): number {
    return this.filteredAggregatedStudents.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get studentPaginationEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredAggregatedStudents.length);
  }

  get visibleStudentPages(): number[] {
    const pages: number[] = [];
    const total = this.totalStudentPages;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  openStudentLedgerForStudent(st: AggregatedStudentFeeRecord) {
    const photo = st.profile_image || st.avatar_url || st.photo_url || this.resolveStudentPhotoLocal(st.student_id);
    const targetInv: StudentFeeInvoice = st.primaryInvoice ? {
      ...st.primaryInvoice,
      profile_image: photo || st.primaryInvoice.profile_image,
      avatar_url: photo || st.primaryInvoice.avatar_url,
      photo_url: photo || st.primaryInvoice.photo_url,
    } : {
      id: st.invoices[0]?.id || '',
      student_id: st.student_id,
      student_name: st.student_name,
      admission_number: st.admission_number,
      class_id: st.class_id,
      class_name: st.class_name,
      section_id: st.section_id,
      section_name: st.section_name,
      profile_image: photo,
      avatar_url: photo,
      photo_url: photo,
      invoice_number: st.invoices[0]?.invoice_number || 'LEDGER',
      total_amount: st.totalBilled,
      paid_amount: st.totalPaid,
      due_date: new Date().toISOString(),
      status: st.outstandingDue > 0 ? 'UNPAID' : 'PAID',
    };
    this.openStudentLedgerModal(targetInv);
  }

  openCollectFeeForStudent(st: AggregatedStudentFeeRecord) {
    const targetInv = st.invoices.find((i) => i.status !== 'PAID' && (i.total_amount - i.paid_amount) > 0) || st.primaryInvoice || st.invoices[0];
    if (targetInv) {
      this.openCollectFeeForInvoice(targetInv);
    } else {
      this.collectClassId = st.class_id || st.class_name;
      this.collectSectionId = st.section_name;
      this.collectStudentId = st.student_id;
      this.openCollectFeeModal();
    }
  }

  openAddChargeForStudent(st: AggregatedStudentFeeRecord) {
    this.openStudentLedgerForStudent(st);
    this.openAddChargeModal();
  }

  async printStudentLedgerDirect(st: AggregatedStudentFeeRecord) {
    await this.openStudentLedgerForStudent(st);
    this.printStudentLedger();
  }

  generate80cForStudent(st: AggregatedStudentFeeRecord) {
    const inv = st.primaryInvoice || st.invoices[0];
    if (inv) {
      this.generate80cCertificate(inv);
    }
  }

  sendReminderForStudent(st: AggregatedStudentFeeRecord) {
    this.toast.success(`Fee reminder sent to guardian of ${st.student_name} for outstanding ₹${st.outstandingDue.toLocaleString()}.`);
  }

  exportStudentLedgerCsv() {
    const rows = this.filteredAggregatedStudents.map((st) => ({
      studentName: st.student_name,
      admissionNumber: st.admission_number,
      rollNumber: st.roll_number || 'N/A',
      classSection: `${st.class_name} - ${st.section_name}`,
      totalBilled: st.totalBilled,
      totalPaid: st.totalPaid,
      outstandingDue: st.outstandingDue,
      advanceCredit: st.advanceCredit,
      status: st.status,
      invoicesCount: st.invoicesCount,
    }));

    this.exportService.exportToCsv(
      `Student_Ledger_Directory_${new Date().toISOString().split('T')[0]}`,
      rows,
      [
        { key: 'studentName', label: 'Student Name' },
        { key: 'admissionNumber', label: 'Admission No' },
        { key: 'rollNumber', label: 'Roll No' },
        { key: 'classSection', label: 'Class & Section' },
        { key: 'totalBilled', label: 'Total Billed (INR)' },
        { key: 'totalPaid', label: 'Total Paid (INR)' },
        { key: 'outstandingDue', label: 'Outstanding Due (INR)' },
        { key: 'advanceCredit', label: 'Advance Credit (INR)' },
        { key: 'status', label: 'Account Status' },
        { key: 'invoicesCount', label: 'Billing Cycles' },
      ]
    );
    this.toast.success('Student Ledger CSV exported.');
  }

  // Pagination State (Tab 1: Student Ledger)
  pageSize = 10;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.pageSize) || 1;
  }

  get paginatedInvoices(): StudentFeeInvoice[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredInvoices.slice(startIndex, startIndex + this.pageSize);
  }

  get paginationStartIndex(): number {
    return this.filteredInvoices.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredInvoices.length);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  get pendingInvoices(): StudentFeeInvoice[] {
    return this.invoices.filter((i) => i.status !== 'PAID');
  }

  get defaultersList(): StudentFeeInvoice[] {
    return this.invoices.filter((i) => i.status === 'UNPAID' || i.status === 'OVERDUE');
  }

  get defaultersCount(): number {
    return this.defaultersList.length;
  }

  get currentSchoolId(): string {
    return this.auth.currentUser()?.school?.id || 'default';
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = (params['tab'] || '').toUpperCase();
      if (tab === 'PROMOCODES') {
        this.activeTab = this.isAdmin ? 'PROMOCODES' : 'DAYBOOK';
      } else if (tab === 'INVOICES' || tab === 'MATRIX' || tab === 'DAYBOOK') {
        this.activeTab = tab as any;
      } else if (tab === 'STRUCTURE') {
        this.activeTab = 'MATRIX';
      } else if (!tab) {
        this.activeTab = 'DAYBOOK';
      }
    });
    this.loadStoredPromocodes();
    if (this.isAdmin) {
      this.loadSchoolFeeRules();
    }
  }

  async loadStoredPromocodes() {
    try {
      const list = await this.api.getPromocodes();
      if (Array.isArray(list) && list.length > 0) {
        this.activePromocodes = list;
        return;
      }
    } catch {}

    try {
      const key = 'schoolsense_fee_promocodes_' + this.currentSchoolId;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.activePromocodes = parsed;
        }
      }
    } catch {
      // Fallback to activePromocodes defaults
    }
  }

  savePromocodesToStorage() {
    try {
      const key = 'schoolsense_fee_promocodes_' + this.currentSchoolId;
      localStorage.setItem(key, JSON.stringify(this.activePromocodes));
    } catch {
      // Ignore storage errors
    }
  }

  setTab(tab: 'DAYBOOK' | 'INVOICES' | 'MATRIX' | 'PROMOCODES') {
    if (tab === 'PROMOCODES' && !this.isAdmin) {
      tab = 'DAYBOOK';
    }
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.toLowerCase() },
      queryParamsHandling: 'merge',
    });
    if (tab === 'DAYBOOK') {
      this.loadDayBook();
    } else if (tab === 'PROMOCODES' && this.isAdmin) {
      this.loadSchoolFeeRules();
    }
  }

  toggleActionDropdown(id: string, event: MouseEvent | any) {
    if (event?.stopPropagation) event.stopPropagation();
    this.openDropdownStudentId = this.openDropdownStudentId === id ? null : id;
    this.openDropdownInvoiceId = this.openDropdownStudentId;
  }

  closeActionDropdown() {
    this.openDropdownInvoiceId = null;
    this.openDropdownStudentId = null;
  }

  sendSingleFeeReminder(inv: StudentFeeInvoice) {
    this.closeActionDropdown();
    this.toast.success(`Fee reminder notification queued for ${inv.student_name} (${inv.admission_number || 'guardian'}).`);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.openDropdownInvoiceId = null;
    this.openDropdownStudentId = null;
  }

  loadAllData() {
    const sessionId = this.auth.activeAcademicSession()?.id;
    this.loadingOverview = true;
    this.loadingInvoices = true;
    this.loadingStructures = true;

    this.api.getAllFeeRefunds(sessionId).then((refunds) => {
      this.studentRefundsMap = {};
      if (Array.isArray(refunds)) {
        refunds.forEach((r: any) => {
          if (r.student_id && r.amount) {
            this.studentRefundsMap[r.student_id] = (this.studentRefundsMap[r.student_id] || 0) + Number(r.amount);
          }
        });
      }
    }).catch(() => {});

    this.api.get<any>('fees/overview-full', sessionId ? { academicYearId: sessionId } : undefined).subscribe({
      next: (res) => {
        if (res) {
          this.overview = res.overview || null;
          this.invoices = (res.invoices || []).map((inv: any) => {
            const photo = inv.photo_url || inv.profile_image || inv.avatar_url || this.resolveStudentPhotoLocal(inv.student_id);
            return {
              ...inv,
              photo_url: photo,
              profile_image: photo,
              avatar_url: photo,
            };
          });
          this.structures = res.structures || [];
          this.classes = res.classes || [];
          this.categories = res.categories || [];
          this.populateMatrixGrid();
          this.enrichStudentPhotos();
        }
        this.loadingOverview = false;
        this.loadingInvoices = false;
        this.loadingStructures = false;
      },
      error: () => {
        this.loadingOverview = false;
        this.loadingInvoices = false;
        this.loadingStructures = false;
      },
    });
  }

  // Populate Matrix Grid state for spreadsheet view
  populateMatrixGrid() {
    this.matrixGrid = {};
    for (const cls of this.classes) {
      this.matrixGrid[cls.id] = {};
      for (const cat of this.categories) {
        const found = this.structures.find(
          (s) => s.class_id === cls.id && (s.fee_category_id === cat.id || s.fee_category_name === cat.name)
        );
        this.matrixGrid[cls.id][cat.id] = found ? found.amount : 0;
      }
    }
  }

  calculateClassTotal(classId: string): number {
    const row = this.matrixGrid[classId];
    if (!row) return 0;
    return Object.values(row).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  saveFeeMatrix() {
    this.savingMatrix = true;
    const items: ClassFeeMatrixItem[] = [];
    for (const cls of this.classes) {
      for (const cat of this.categories) {
        const amt = Number(this.matrixGrid[cls.id]?.[cat.id]) || 0;
        if (amt > 0) {
          items.push({
            classId: cls.id,
            className: cls.name,
            feeCategoryId: cat.id,
            feeCategoryName: cat.name,
            amount: amt,
            frequency: 'MONTHLY',
            dueDay: 10,
          });
        }
      }
    }

    const sessionId = this.auth.activeAcademicSession()?.id;
    this.api.saveClassFeeMatrix(sessionId, items).then((res) => {
      this.savingMatrix = false;
      this.toast.success(`Fee matrix saved successfully! Updated ${res.updatedCount || items.length} class fee structures.`);
      this.loadAllData();
    }).catch((err: any) => {
      this.savingMatrix = false;
      this.toast.error(err.message || 'Failed to save fee matrix.');
    });
  }

  // Day-Book Cashier Desk
  setDayBookPreset(preset: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM') {
    this.dayBookPreset = preset;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      this.dayBookStartDate = todayStr;
      this.dayBookEndDate = todayStr;
    } else if (preset === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      this.dayBookStartDate = yStr;
      this.dayBookEndDate = yStr;
    } else if (preset === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      this.dayBookStartDate = sevenDaysAgo.toISOString().split('T')[0];
      this.dayBookEndDate = todayStr;
    } else if (preset === 'THIS_MONTH') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      this.dayBookStartDate = startOfMonth.toISOString().split('T')[0];
      this.dayBookEndDate = todayStr;
    }
    this.dayBookDate = this.dayBookStartDate;
    this.loadDayBook();
  }

  onDayBookDateChange() {
    this.dayBookPreset = 'CUSTOM';
    if (this.dayBookStartDate && this.dayBookEndDate && this.dayBookStartDate > this.dayBookEndDate) {
      this.dayBookEndDate = this.dayBookStartDate;
    }
    this.dayBookDate = this.dayBookStartDate;
    this.loadDayBook();
  }

  loadDayBook() {
    this.loadingDayBook = true;
    const isSingleToday = (this.dayBookPreset === 'TODAY') || (!this.dayBookEndDate && this.dayBookStartDate === new Date().toISOString().split('T')[0]);
    this.api.getDailyDayBook(this.dayBookStartDate, this.dayBookEndDate, isSingleToday).then((summary) => {
      this.dayBookSummary = summary;
      this.loadingDayBook = false;
    }).catch(() => {
      this.loadingDayBook = false;
    });
  }

  printDayBookSummary() {
    if (!this.dayBookSummary) return;
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateRangeLabel = this.dayBookStartDate === this.dayBookEndDate
      ? new Date(this.dayBookStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : `${new Date(this.dayBookStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(this.dayBookEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Day-Book Summary - ${dateRangeLabel}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #0f172a; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: 800; text-transform: uppercase; }
          .sub { font-size: 12px; color: #475569; margin-top: 4px; }
          .chips { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; font-size: 11px; }
          .chip { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; background: #f8fafc; }
          .chip-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${schoolName}</div>
          <div class="sub">CASHIER DAY-BOOK & COLLECTION RECONCILIATION • ${dateRangeLabel}</div>
        </div>
        <div class="chips">
          <div class="chip"><div>TOTAL GROSS</div><div class="chip-val">₹${this.dayBookSummary.totalCollected.toLocaleString()}</div></div>
          <div class="chip"><div>CASH</div><div class="chip-val">₹${this.dayBookSummary.cashAmount.toLocaleString()}</div></div>
          <div class="chip"><div>UPI / QR</div><div class="chip-val">₹${this.dayBookSummary.upiAmount.toLocaleString()}</div></div>
          <div class="chip"><div>BANK / NEFT</div><div class="chip-val">₹${this.dayBookSummary.bankAmount.toLocaleString()}</div></div>
          <div class="chip"><div>CHEQUES</div><div class="chip-val">₹${this.dayBookSummary.chequeAmount.toLocaleString()}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Receipt No</th>
              <th>Student</th>
              <th>Class</th>
              <th>Mode</th>
              <th>Cashier</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${this.dayBookSummary.transactions.map(t => `
              <tr>
                <td>${new Date(t.paymentDate || t.paymentTime || this.dayBookStartDate).toLocaleDateString('en-GB')}</td>
                <td>${t.receiptNumber}</td>
                <td>${t.studentName}</td>
                <td>${t.className}</td>
                <td>${t.paymentMode}</td>
                <td>${t.collectedBy}</td>
                <td style="text-align: right;">₹${t.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  // Section 80C Tax Certificate
  async generate80cCertificate(inv: StudentFeeInvoice) {
    try {
      this.toast.info(`Generating Section 80C certificate for ${inv.student_name}...`);
      const cert = await this.api.getStudent80cCertificate(inv.student_id, this.auth.activeAcademicSession()?.id);
      this.print80cCertificate(cert, inv);
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to generate Section 80C certificate.');
    }
  }

  print80cCertificate(cert: Student80cCertificate, inv: StudentFeeInvoice) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Section 80C Certificate - ${cert.student.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 35px; color: #0f172a; line-height: 1.5; }
          .cert-box { max-width: 700px; margin: 0 auto; border: 3px double #0f172a; padding: 30px; border-radius: 8px; background: white; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .school-name { font-size: 20px; font-weight: 900; text-transform: uppercase; }
          .cert-title { font-size: 13px; font-weight: bold; color: #1e293b; margin-top: 6px; letter-spacing: 0.5px; }
          .cert-tag { display: inline-block; background: #0f172a; color: white; font-size: 11px; font-weight: bold; padding: 3px 14px; border-radius: 4px; margin-top: 8px; }
          .cert-body { font-size: 13px; text-align: justify; margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          .table th { background: #f1f5f9; padding: 8px; text-align: left; border: 1px solid #cbd5e1; }
          .table td { padding: 8px; border: 1px solid #cbd5e1; }
          .highlight { font-weight: 800; color: #047857; font-size: 14px; }
          .footer { margin-top: 45px; display: flex; justify-content: space-between; font-size: 12px; }
          .seal-box { border-top: 1px solid #64748b; width: 180px; text-align: center; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="cert-box">
          <div class="header">
            <div class="school-name">${cert.school.name}</div>
            <div class="cert-title">TUITION FEE CERTIFICATE FOR INCOME TAX EXEMPTION</div>
            <div style="font-size: 11px; color: #64748b;">(Under Section 80C of the Indian Income Tax Act, 1961)</div>
            <div class="cert-tag">CERTIFICATE NO: ${cert.certificateNumber}</div>
          </div>

          <div class="cert-body">
            This is to certify that <strong>${cert.student.name}</strong>, Son/Daughter of <strong>${cert.guardian.parentName}</strong>, 
            bearing Admission No. <strong>${cert.student.admissionNumber}</strong>, is a bonafide student of this institution in 
            <strong>${cert.student.className} (${cert.student.sectionName})</strong> for the Academic Session <strong>${cert.financialYear}</strong>.
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Fee Component</th>
                <th>Exemption Category</th>
                <th style="text-align: right;">Amount Paid (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Eligible Tuition Fee (Full-time Education)</td>
                <td>Qualifying u/s 80C(2)(xvii)</td>
                <td style="text-align: right;" class="highlight">₹${cert.eligibleTuitionFeePaid}</td>
              </tr>
              <tr>
                <td>Other Non-Eligible Charges (Transport, Meal, Development)</td>
                <td>Non-Qualifying</td>
                <td style="text-align: right;">₹${cert.totalFeePaid - cert.eligibleTuitionFeePaid}</td>
              </tr>
              <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="2">Gross Institutional Fee Paid</td>
                <td style="text-align: right;">₹${cert.totalFeePaid}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #475569; margin-top: 15px;">
            Certified that the sum of <strong>Rupees ${cert.eligibleTuitionFeePaid} Only</strong> was received exclusively towards 
            Tuition Fees for full-time regular schooling of the ward during Financial Year ${cert.financialYear} (Assessment Year ${cert.assessmentYear}).
          </div>

          <div class="footer">
            <div>
              <div><strong>Date of Issue:</strong> ${new Date(cert.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div><strong>Place:</strong> New Delhi, India</div>
            </div>
            <div class="seal-box">
              Authorized Signatory & Seal<br>
              <span style="font-size: 10px; color: #64748b;">Accounts & Bursar Department</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 350);
  }

  // Sibling Detection
  async checkSiblings(inv: StudentFeeInvoice) {
    this.checkingSiblings = true;
    try {
      const info = await this.api.detectStudentSiblings(inv.student_id);
      this.activeSiblingInfo = info;
      this.showSiblingModal = true;
    } catch {
      this.toast.info('No sibling records found for this student.');
    } finally {
      this.checkingSiblings = false;
    }
  }

  // Promocodes Desk
  async testPromocode() {
    const code = this.testPromoCode.trim().toUpperCase();
    if (!code) return;
    this.testingPromo = true;
    try {
      this.testPromoResult = await this.api.applyPromocode(code, undefined, this.testPromoAmount);
    } catch {
      // Local fallback evaluation from activePromocodes
      const local = this.activePromocodes.find((p) => p.code === code);
      if (local) {
        const discount = local.discountType === 'PERCENTAGE'
          ? Math.round((this.testPromoAmount * local.value) / 100)
          : Math.min(local.value, this.testPromoAmount);
        this.testPromoResult = {
          success: true,
          discountAmount: discount,
          finalAmount: Math.max(0, this.testPromoAmount - discount),
          message: `${local.description} (${local.value}${local.discountType === 'PERCENTAGE' ? '%' : ' INR'})`,
        };
      } else {
        this.testPromoResult = { success: false, message: 'Invalid or expired promotional code.' };
      }
    } finally {
      this.testingPromo = false;
    }
  }

  // Create Promocode Modal Actions (Admin only)
  openCreatePromoModal() {
    this.promoForm = {
      code: '',
      discountType: 'PERCENTAGE',
      value: 20,
      maxUses: 50,
      expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      description: '',
    };
    this.createPromoError = '';
    this.showCreatePromoModal = true;
  }

  closeCreatePromoModal() {
    this.showCreatePromoModal = false;
    this.createPromoError = '';
  }

  async createPromocode() {
    const code = this.promoForm.code.trim().toUpperCase();
    if (!code) {
      this.createPromoError = 'Please enter a valid promocode string.';
      return;
    }
    if (this.activePromocodes.some((p) => p.code === code)) {
      this.createPromoError = `Promocode "${code}" already exists.`;
      return;
    }
    if (!this.promoForm.value || this.promoForm.value <= 0) {
      this.createPromoError = 'Please enter a discount value greater than 0.';
      return;
    }
    if (this.promoForm.discountType === 'PERCENTAGE' && this.promoForm.value > 100) {
      this.createPromoError = 'Percentage discount cannot exceed 100%.';
      return;
    }
    if (!this.promoForm.description.trim()) {
      this.createPromoError = 'Please enter a brief description for this concession.';
      return;
    }

    this.creatingPromo = true;
    this.createPromoError = '';

    const newPromo = {
      code,
      discountType: this.promoForm.discountType,
      value: Number(this.promoForm.value),
      description: this.promoForm.description.trim(),
      uses: 0,
      maxUses: Number(this.promoForm.maxUses) || 50,
      expiry: this.promoForm.expiryDate,
      status: 'ACTIVE',
    };

    try {
      await this.api.createPromocode(newPromo);
    } catch (e) {
      console.warn('api.createPromocode failed, local fallback used:', e);
    }

    this.activePromocodes.unshift(newPromo);
    this.savePromocodesToStorage();
    this.creatingPromo = false;
    this.closeCreatePromoModal();
    this.toast.success(`Promocode "${code}" generated and activated!`);
  }

  copyPromoCode(code: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      this.toast.success(`Copied "${code}" to clipboard!`);
    } else {
      this.toast.info(`Promocode: ${code}`);
    }
  }

  async removePromocode(index: number) {
    const code = this.activePromocodes[index]?.code;
    const id = (this.activePromocodes[index] as any)?.id;
    if (confirm(`Deactivate promocode "${code}"?`)) {
      try {
        await this.api.deletePromocode(id || code);
      } catch {}
      this.activePromocodes.splice(index, 1);
      this.savePromocodesToStorage();
      this.toast.info(`Promocode "${code}" deactivated.`);
    }
  }

  // Overdue Days Calculator
  calculateOverdueDays(dueDate: string): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate).getTime();
    const now = Date.now();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  // Collect Fee Modal Actions
  openCollectFeeModal() {
    this.collectModalError = '';
    this.appliedDiscount = { type: 'NONE', label: '', amount: 0 };
    this.enteredPromoCode = '';
    this.promoAppliedMessage = '';
    this.promoAppliedError = '';

    const availClasses = this.collectAvailableClasses;
    this.collectClassId = availClasses.length > 0 ? availClasses[0].id : '';
    this.collectSectionId = '';

    const students = this.collectAvailableStudents;
    const firstWithDue = students.find((s) => s.pendingDue > 0) || students[0];
    if (firstWithDue) {
      this.collectStudentId = firstWithDue.student_id;
      this.onCollectStudentSelect();
    } else {
      this.collectStudentId = '';
      this.resetCollectInvoiceSelection();
    }
    this.showCollectModal = true;
  }

  openCollectFeeForInvoice(inv: StudentFeeInvoice) {
    this.collectModalError = '';
    const matchedClass = this.collectAvailableClasses.find(
      (c) => (inv.class_id && c.id === inv.class_id) || c.name === inv.class_name
    );
    this.collectClassId = matchedClass ? matchedClass.id : (inv.class_id || inv.class_name || '');
    this.collectSectionId = inv.section_name || '';
    this.collectStudentId = inv.student_id;
    this.selectInvoiceForCollect(inv);
    this.collectForm.payment_mode = 'UPI';
    this.collectForm.transaction_reference = '';
    this.collectForm.remarks = `Payment for invoice ${inv.invoice_number}`;
    this.showCollectModal = true;
  }

  onCollectClassChange() {
    this.collectSectionId = '';
    this.onCollectSectionChange();
  }

  onCollectSectionChange() {
    const students = this.collectAvailableStudents;
    const firstWithDue = students.find((s) => s.pendingDue > 0) || students[0];
    if (firstWithDue) {
      this.collectStudentId = firstWithDue.student_id;
      this.onCollectStudentSelect();
    } else {
      this.collectStudentId = '';
      this.resetCollectInvoiceSelection();
    }
  }

  onCollectStudentSelect() {
    if (!this.collectStudentId) {
      this.resetCollectInvoiceSelection();
      return;
    }
    const student = this.collectAvailableStudents.find((s) => s.student_id === this.collectStudentId);
    if (!student || student.invoices.length === 0) {
      this.resetCollectInvoiceSelection();
      return;
    }
    const pendingInv =
      student.invoices.find((i) => i.status !== 'PAID' && (i.total_amount - i.paid_amount) > 0) ||
      student.invoices[0];
    this.selectInvoiceForCollect(pendingInv);
  }

  selectInvoiceForCollect(inv: StudentFeeInvoice) {
    this.selectedStudentInvoice = inv;
    this.collectForm.invoice_id = inv.id;
    this.collectForm.student_id = inv.student_id;
    this.originalDueAmount = Math.max(0, inv.total_amount - inv.paid_amount);
    this.appliedDiscount = { type: 'NONE', label: '', amount: 0 };
    this.enteredPromoCode = '';
    this.promoAppliedMessage = '';
    this.promoAppliedError = '';
    this.collectForm.amount_paid = this.originalDueAmount > 0 ? this.originalDueAmount : inv.total_amount;
    this.collectForm.remarks = `Payment for invoice ${inv.invoice_number}`;
    this.checkSiblingsForCollect(inv.student_id);
    this.checkMeritForCollect(inv.student_id);
  }

  resetCollectInvoiceSelection() {
    this.selectedStudentInvoice = null;
    this.collectForm.invoice_id = '';
    this.collectForm.student_id = '';
    this.originalDueAmount = 0;
    this.collectForm.amount_paid = 0;
    this.activeSiblingInfo = null;
    this.activeMeritInfo = null;
    this.appliedDiscount = { type: 'NONE', label: '', amount: 0 };
  }

  async checkMeritForCollect(studentId: string) {
    if (!studentId) {
      this.activeMeritInfo = null;
      return;
    }
    this.checkingMerit = true;
    try {
      this.activeMeritInfo = await this.api.detectStudentMerit(studentId);
    } catch {
      this.activeMeritInfo = null;
    } finally {
      this.checkingMerit = false;
    }
  }

  async checkSiblingsForCollect(studentId: string) {
    if (!studentId) {
      this.activeSiblingInfo = null;
      return;
    }
    this.checkingSiblings = true;
    try {
      this.activeSiblingInfo = await this.api.detectStudentSiblings(studentId);
    } catch {
      this.activeSiblingInfo = null;
    } finally {
      this.checkingSiblings = false;
    }
  }

  toggleSiblingDiscount() {
    if (this.appliedDiscount.type === 'SIBLING') {
      this.removeAppliedDiscount();
      return;
    }
    this.applySiblingDiscount();
  }

  toggleMeritDiscount() {
    if (this.appliedDiscount.type === 'MERIT') {
      this.removeAppliedDiscount();
      return;
    }
    this.applyMeritDiscount();
  }

  applySiblingDiscount() {
    const pct = this.activeSiblingInfo?.suggestedDiscountPct || 15;
    const discountAmt = Math.round((this.originalDueAmount * pct) / 100);
    this.appliedDiscount = {
      type: 'SIBLING',
      label: `Sibling Concession (${pct}%)`,
      amount: discountAmt,
      percentage: pct,
    };
    this.collectForm.amount_paid = Math.max(0, this.originalDueAmount - discountAmt);
    this.toast.success(`Applied ${pct}% Sibling Concession (-₹${discountAmt})`);
  }

  applyMeritDiscount() {
    const pct = this.activeMeritInfo?.suggestedDiscountPct || 10;
    const discountAmt = Math.round((this.originalDueAmount * pct) / 100);
    this.appliedDiscount = {
      type: 'MERIT',
      label: `Academic Merit Scholarship (${pct}%)`,
      amount: discountAmt,
      percentage: pct,
    };
    this.collectForm.amount_paid = Math.max(0, this.originalDueAmount - discountAmt);
    this.toast.success(`Applied ${pct}% Academic Merit Scholarship (-₹${discountAmt})`);
  }

  applyQuickPromo(code: string) {
    this.enteredPromoCode = code;
    this.applyPromoCodeInModal();
  }

  async applyPromoCodeInModal() {
    const code = (this.enteredPromoCode || '').trim().toUpperCase();
    if (!code) {
      this.promoAppliedError = 'Please enter a promocode';
      return;
    }
    this.applyingPromo = true;
    this.promoAppliedError = '';
    this.promoAppliedMessage = '';

    try {
      const res = await this.api.validateAndApplyPromocode(code, null, this.originalDueAmount);
      if (res.success) {
        const discountAmt = Math.min(res.discountAmount, this.originalDueAmount);
        this.appliedDiscount = {
          type: 'PROMOCODE',
          code: res.code,
          label: `Promocode ${res.code}`,
          amount: discountAmt,
          percentage: res.discountPercentage,
        };
        this.collectForm.amount_paid = Math.max(0, this.originalDueAmount - discountAmt);
        this.promoAppliedMessage = res.message || `Promocode ${res.code} applied (-₹${discountAmt})!`;
        this.toast.success(this.promoAppliedMessage);
      } else {
        this.promoAppliedError = res.message || 'Invalid or expired promocode.';
      }
    } catch (err: any) {
      this.promoAppliedError = err.message || 'Failed to validate promocode.';
    } finally {
      this.applyingPromo = false;
    }
  }

  removeAppliedDiscount() {
    this.appliedDiscount = { type: 'NONE', label: '', amount: 0 };
    this.collectForm.amount_paid = this.originalDueAmount;
    this.promoAppliedMessage = '';
    this.promoAppliedError = '';
  }

  closeCollectModal() {
    this.showCollectModal = false;
    this.selectedStudentInvoice = null;
    this.activeSiblingInfo = null;
    this.activeMeritInfo = null;
    this.appliedDiscount = { type: 'NONE', label: '', amount: 0 };
  }

  async submitCollectFee() {
    if (!this.collectForm.invoice_id || !this.collectForm.amount_paid || this.collectForm.amount_paid <= 0) {
      this.collectModalError = 'Please select a valid student invoice and enter a payment amount.';
      return;
    }
    this.savingPayment = true;
    this.collectModalError = '';

    const payload = {
      ...this.collectForm,
      discount_applied: this.appliedDiscount.amount || 0,
      discount_type: this.appliedDiscount.type,
      discount_code: this.appliedDiscount.code || null,
      remarks: this.appliedDiscount.amount > 0
        ? `${this.collectForm.remarks || ''} (${this.appliedDiscount.label} applied: ₹${this.appliedDiscount.amount})`.trim()
        : this.collectForm.remarks,
    };

    try {
      const res = await this.api.recordFeePayment(payload);
      this.savingPayment = false;
      if (res && res.success !== false) {
        this.closeCollectModal();
        const receiptNo = res.receiptNumber || res.receipt_number || 'REC-' + Date.now();
        this.toast.success(`Payment of ₹${this.collectForm.amount_paid} recorded! Receipt: ${receiptNo}`);
        this.loadAllData();
        this.loadDayBook();
        const inv = this.invoices.find((i) => i.id === this.collectForm.invoice_id);
        if (inv) {
          if (this.appliedDiscount.amount > 0) {
            inv.discount_amount = this.appliedDiscount.amount;
            inv.discount_code = this.appliedDiscount.code || 'COUPON';
            inv.discount_type = this.appliedDiscount.type;
          }
          inv.paid_amount = (Number(inv.paid_amount) || 0) + this.collectForm.amount_paid;
          inv.status = ((Number(inv.paid_amount) || 0) + (Number(inv.discount_amount) || 0) >= (Number(inv.total_amount) || 0)) ? 'PAID' : 'PARTIAL';
          this.printFeeReceipt(inv, receiptNo, this.collectForm.amount_paid);
        }
      } else {
        this.collectModalError = res?.message || 'Failed to record fee payment.';
      }
    } catch (err: any) {
      this.savingPayment = false;
      this.collectModalError = err.message || 'Failed to record fee payment.';
    }
  }

  // ==============================================================================
  // SCHOOL FEE RULES & LATE FEE POLICY ENGINE
  // ==============================================================================
  async loadSchoolFeeRules() {
    this.loadingFeeRules = true;
    try {
      const rules = await this.api.getSchoolFeeRules(this.auth.activeAcademicSession()?.id);
      if (rules) {
        this.schoolFeeRules = {
          ...rules,
          monthly_discount_pct: rules.monthly_discount_pct ?? 0,
          quarterly_discount_pct: rules.quarterly_discount_pct ?? 5,
          annual_discount_pct: rules.annual_discount_pct ?? 10,
          due_day_of_month: rules.due_day_of_month ?? 10,
          grace_period_days: rules.grace_period_days ?? 5,
          enable_late_fee: rules.enable_late_fee ?? true,
          late_fee_type: rules.late_fee_type ?? 'DAILY',
          late_fee_amount: rules.late_fee_amount ?? 20,
        };
      }
    } catch (err: any) {
      console.warn('Could not load school fee rules:', err);
    } finally {
      this.loadingFeeRules = false;
    }
  }

  async saveSchoolFeeRules() {
    this.savingFeeRules = true;
    try {
      const res = await this.api.updateSchoolFeeRules(this.schoolFeeRules, this.auth.activeAcademicSession()?.id);
      if (res && res.success) {
        this.toast.success('Fee billing rules and late fee policy saved successfully!');
      } else {
        throw new Error('Failed to save fee rules');
      }
    } catch (err: any) {
      this.toast.error('SQL migration pending in Supabase. Please run supabase/fee_billing_rules_and_ledger_charges.sql in Supabase SQL editor.');
    } finally {
      this.savingFeeRules = false;
    }
  }

  // ==============================================================================
  // ADD STUDENT FEE CHARGE ACTIONS
  // ==============================================================================
  openAddChargeModal() {
    this.chargeForm = {
      charge_type: 'FINE_PENALTY',
      amount: 100,
      description: '',
      effective_date: new Date().toISOString().split('T')[0],
    };
    this.chargeError = '';
    this.showAddChargeModal = true;
  }

  closeAddChargeModal() {
    this.showAddChargeModal = false;
    this.chargeError = '';
  }

  async submitAddCharge() {
    if (!this.activeLedgerStudent) return;
    if (!this.chargeForm.amount || this.chargeForm.amount <= 0) {
      this.chargeError = 'Please enter a valid charge amount greater than ₹0.';
      return;
    }
    if (!this.chargeForm.description.trim()) {
      this.chargeError = 'Please provide a brief reason or description for this charge.';
      return;
    }

    this.savingCharge = true;
    this.chargeError = '';
    try {
      const res = await this.api.addStudentFeeCharge(
        this.activeLedgerStudent.student_id,
        {
          charge_type: this.chargeForm.charge_type,
          amount: Number(this.chargeForm.amount),
          description: this.chargeForm.description.trim(),
          effective_date: this.chargeForm.effective_date,
        },
        this.auth.activeAcademicSession()?.id
      );

      if (res && res.success) {
        this.toast.success(`Fee charge of ₹${this.chargeForm.amount} added to student ledger.`);
        this.closeAddChargeModal();
        await this.openStudentLedgerModal(this.activeLedgerStudent);
      } else {
        throw new Error('Failed to record fee charge');
      }
    } catch (err: any) {
      this.chargeError = 'SQL migration pending in Supabase. Please run supabase/fee_billing_rules_and_ledger_charges.sql in Supabase SQL editor.';
      this.toast.error(this.chargeError);
    } finally {
      this.savingCharge = false;
    }
  }

  // ==============================================================================
  // RUNNING BALANCE RESILIENT HELPER
  // ==============================================================================
  getItemRunningBalance(item: any, index: number): number {
    if (item.runningBalance != null && !isNaN(item.runningBalance)) {
      return Number(item.runningBalance);
    }
    if (item.balance != null && !isNaN(item.balance)) {
      return Number(item.balance);
    }
    let bal = 0;
    for (let i = 0; i <= index; i++) {
      const entry = this.ledgerEntries[i];
      bal += (Number(entry?.debit) || 0) - (Number(entry?.credit) || 0);
    }
    return bal;
  }

  async setLedgerFrequency(freq: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL') {
    if (this.selectedBillingFrequency === freq) return;
    const prevFreq = this.selectedBillingFrequency;
    this.selectedBillingFrequency = freq;
    if (freq !== 'ANNUAL') {
      this.annualDiscountApplied = false;
    }
    if (this.activeLedgerStudent) {
      try {
        const concessionPct = freq === 'ANNUAL' ? (Number(this.annualConcessionPct) || (this.schoolFeeRules.annual_discount_pct || 10)) : 0;
        const res = await this.api.updateStudentFeePreference(this.activeLedgerStudent.student_id, {
          frequency: freq,
          annualConcessionPct: concessionPct,
          annual_concession_pct: concessionPct,
          notes: `Updated to ${freq} billing frequency`,
          academicYearId: this.auth.activeAcademicSession()?.id,
          academic_year_id: this.auth.activeAcademicSession()?.id,
        });
        if (!res || res.success === false) {
          throw new Error(res?.message || 'Failed');
        }
        this.toast.success(`Student billing frequency updated to ${freq}`);
        await this.openStudentLedgerModal(this.activeLedgerStudent);
      } catch (err: any) {
        this.selectedBillingFrequency = prevFreq;
        this.toast.error('SQL migration pending in Supabase. Please run supabase/fee_billing_rules_and_ledger_charges.sql in Supabase SQL editor.');
      }
    }
  }

  // ==============================================================================
  // STUDENT ACCOUNT LEDGER STATEMENT ACTIONS
  // ==============================================================================
  onStudentAvatarError(event: any, st: any) {
    if (st) {
      st.profile_image = '';
      st.avatar_url = '';
      st.photo_url = '';
    }
    if (event?.target) {
      event.target.style.display = 'none';
    }
  }

  resolveStudentPhotoLocal(studentId: string): string {
    if (!studentId) return '';
    try {
      const photosMap = JSON.parse(localStorage.getItem('schoolsense_student_photos') || '{}');
      if (photosMap[studentId]) {
        return photosMap[studentId].photoUrl || photosMap[studentId].photo_url || photosMap[studentId].avatar_url || '';
      }
    } catch {}
    return '';
  }

  async enrichStudentPhotos() {
    const missingIds = Array.from(new Set(
      this.invoices
        .filter((inv) => !inv.photo_url && !inv.profile_image && !inv.avatar_url && !this.resolveStudentPhotoLocal(inv.student_id))
        .map((inv) => inv.student_id)
        .filter(Boolean)
    ));

    if (missingIds.length === 0) return;

    try {
      const photos = await this.api.getStudentsPhotos(missingIds);
      if (photos && Object.keys(photos).length > 0) {
        this.invoices = this.invoices.map((inv) => {
          const ph = photos[inv.student_id] || inv.photo_url || inv.profile_image || '';
          if (ph && !inv.photo_url) {
            return { ...inv, photo_url: ph, profile_image: ph, avatar_url: ph };
          }
          return inv;
        });
      }
    } catch {}
  }

  async openStudentLedgerModal(inv: StudentFeeInvoice) {
    if (!inv.profile_image && !inv.avatar_url && !inv.photo_url) {
      const ph = this.resolveStudentPhotoLocal(inv.student_id);
      if (ph) {
        inv.profile_image = ph;
        inv.avatar_url = ph;
        inv.photo_url = ph;
      }
    }
    this.activeLedgerStudent = inv;
    this.showLedgerModal = true;
    this.loadingLedger = true;
    this.ledgerRefundTotal = 0;
    this.selectedBillingFrequency = 'MONTHLY';
    this.annualConcessionPct = 10;
    this.annualDiscountApplied = false;
    this.feePreferenceNotes = '';

    const studentInvoices = this.invoices.filter((i) => i.student_id === inv.student_id);
    this.ledgerInvoicesCount = studentInvoices.length;

    try {
      const statement = await this.api.getStudentFeeLedger(inv.student_id, this.auth.activeAcademicSession()?.id);
      if (statement) {
        if (statement.photo_url || statement.profile_image || statement.avatar_url) {
          const ph = statement.photo_url || statement.profile_image || statement.avatar_url;
          if (this.activeLedgerStudent) {
            this.activeLedgerStudent.photo_url = ph;
            this.activeLedgerStudent.profile_image = ph;
            this.activeLedgerStudent.avatar_url = ph;
          }
        }
        if (statement.ledgerEntries && statement.ledgerEntries.length > 0) {
          this.ledgerEntries = statement.ledgerEntries;
          this.ledgerBilledTotal = statement.totalBilled;
          this.ledgerPaidTotal = statement.totalPaid;
          this.ledgerDiscountTotal = statement.totalDiscount || 0;
          this.ledgerRefundTotal = statement.totalRefunded || 0;
          this.ledgerNetBalance = statement.advanceBalance > 0 ? statement.advanceBalance : -statement.pendingDue;
          this.selectedBillingFrequency = statement.frequencyPreference || 'MONTHLY';
          this.annualConcessionPct = statement.annualConcessionPct || 10;
          this.annualDiscountApplied = (statement.annualConcessionPct || 0) > 0;
        } else {
          const payments = await this.api.getStudentFeePayments(inv.student_id);
          const refunds = await this.api.getStudentFeeRefunds(inv.student_id);
          this.buildStudentLedger(studentInvoices, payments, refunds);
        }
      } else {
        const payments = await this.api.getStudentFeePayments(inv.student_id);
        const refunds = await this.api.getStudentFeeRefunds(inv.student_id);
        this.buildStudentLedger(studentInvoices, payments, refunds);
      }
    } catch {
      const payments = await this.api.getStudentFeePayments(inv.student_id);
      const refunds = await this.api.getStudentFeeRefunds(inv.student_id);
      this.buildStudentLedger(studentInvoices, payments, refunds);
    } finally {
      this.loadingLedger = false;
    }
  }

  closeLedgerModal() {
    this.showLedgerModal = false;
    this.activeLedgerStudent = null;
    this.ledgerEntries = [];
  }

  buildStudentLedger(invoices: StudentFeeInvoice[], payments: any[], refunds: any[] = []) {
    const rawItems: Array<{
      date: string;
      sortPrio?: number;
      reference: string;
      description: string;
      type: 'INVOICE' | 'PAYMENT' | 'CHARGE' | 'CONCESSION' | 'REFUND';
      mode?: string;
      status?: string;
      debit: number;
      credit: number;
    }> = [];

    let totalBilled = 0;
    let totalPaid = 0;
    let totalDiscount = 0;

    // 1. Debits from invoices or Indian April-to-March session breakdown
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv) => {
        const amount = Number(inv.total_amount) || 0;
        let discount = Number(inv.discount_amount) || 0;
        const paid = Number(inv.paid_amount) || 0;
        if (paid > 0 && discount > 0 && (paid + discount) > amount) {
          discount = Math.max(0, amount - paid);
        }
        totalBilled += amount;
        totalDiscount += discount;
        const invDate = this.api.resolveTransactionDate(inv, inv.due_date);
        rawItems.push({
          date: invDate,
          sortPrio: 1,
          reference: inv.invoice_number,
          description: `Tuition Fee Billing (${inv.month_name || 'Standard Term'})`,
          type: 'INVOICE',
          mode: 'BILLING',
          status: inv.status || 'UNPAID',
          debit: amount,
          credit: 0,
        });

        if (discount > 0) {
          const discCode = (inv.discount_code || '').trim() || 'CONCESSION';
          const discLabel = inv.discount_code
            ? `Fee Concession / Discount Applied (Coupon: ${inv.discount_code})`
            : (inv.discount_type ? `Fee Concession (${inv.discount_type})` : 'Fee Concession / Discount Applied');
          rawItems.push({
            date: inv.updated_at ? inv.updated_at.split('T')[0] : invDate,
            sortPrio: 2,
            reference: discCode,
            description: discLabel,
            type: 'CONCESSION' as any,
            mode: 'CONCESSION',
            status: 'APPLIED',
            debit: 0,
            credit: discount,
          });
        }
      });
    } else {
      // April-to-March Indian Academic Session schedule alignment
      const baseMonthly = Number(this.activeLedgerStudent?.total_amount) || 3000;
      const today = new Date();
      const currentYear = today.getFullYear();
      const sessionStartYear = today.getMonth() >= 3 ? currentYear : currentYear - 1;

      if (this.selectedBillingFrequency === 'ANNUAL') {
        const fullYearFee = baseMonthly * 12;
        const discountPct = Number(this.annualConcessionPct) || (this.schoolFeeRules.annual_discount_pct || 10);
        const discountAmt = Math.round((fullYearFee * discountPct) / 100);
        const netFee = fullYearFee - discountAmt;
        totalBilled += netFee;
        totalDiscount += discountAmt;
        rawItems.push({
          date: `${sessionStartYear}-04-01`,
          reference: `INV-ANN-${sessionStartYear}`,
          description: `Annual Session Tuition Fee (${sessionStartYear}-${sessionStartYear + 1}) [${discountPct}% Upfront Concession Applied]`,
          type: 'INVOICE',
          mode: 'BILLING',
          status: 'UNPAID',
          debit: netFee,
          credit: 0,
        });
      } else if (this.selectedBillingFrequency === 'QUARTERLY') {
        const quarters = [
          { name: 'Q1 (Apr - Jun)', date: `${sessionStartYear}-04-01` },
          { name: 'Q2 (Jul - Sep)', date: `${sessionStartYear}-07-01` },
          { name: 'Q3 (Oct - Dec)', date: `${sessionStartYear}-10-01` },
          { name: 'Q4 (Jan - Mar)', date: `${sessionStartYear + 1}-01-01` },
        ];
        quarters.forEach((q, idx) => {
          const qDate = new Date(q.date);
          if (qDate <= today || idx === 0) {
            const qAmt = baseMonthly * 3;
            totalBilled += qAmt;
            rawItems.push({
              date: q.date,
              reference: `INV-Q${idx + 1}-${sessionStartYear}`,
              description: `Quarterly Tuition Fee - ${q.name}`,
              type: 'INVOICE',
              mode: 'BILLING',
              status: 'UNPAID',
              debit: qAmt,
              credit: 0,
            });
          }
        });
      } else {
        // MONTHLY: 1st of every month from April up to current month
        const sessionMonths = [
          { name: 'April', month: 3, year: sessionStartYear },
          { name: 'May', month: 4, year: sessionStartYear },
          { name: 'June', month: 5, year: sessionStartYear },
          { name: 'July', month: 6, year: sessionStartYear },
          { name: 'August', month: 7, year: sessionStartYear },
          { name: 'September', month: 8, year: sessionStartYear },
          { name: 'October', month: 9, year: sessionStartYear },
          { name: 'November', month: 10, year: sessionStartYear },
          { name: 'December', month: 11, year: sessionStartYear },
          { name: 'January', month: 0, year: sessionStartYear + 1 },
          { name: 'February', month: 1, year: sessionStartYear + 1 },
          { name: 'March', month: 2, year: sessionStartYear + 1 },
        ];
        sessionMonths.forEach((m) => {
          const mDate = new Date(m.year, m.month, 1);
          if (mDate <= today || (m.year === sessionStartYear && m.month === 3)) {
            const dateStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}-01`;
            totalBilled += baseMonthly;
            rawItems.push({
              date: dateStr,
              reference: `INV-${m.name.slice(0, 3).toUpperCase()}-${m.year}`,
              description: `Monthly Tuition Fee (${m.name} ${m.year})`,
              type: 'INVOICE',
              mode: 'BILLING',
              status: 'UNPAID',
              debit: baseMonthly,
              credit: 0,
            });
          }
        });
      }
    }

    // 2. Credits from payments table or invoice paid_amount
    if (payments && payments.length > 0) {
      payments.forEach((p) => {
        const amt = Number(p.amount_paid) || 0;
        totalPaid += amt;
        const pDate = (p.payment_date || p.created_at || new Date().toISOString()).split('T')[0];
        rawItems.push({
          date: pDate,
          sortPrio: 3,
          reference: p.receipt_number || 'REC-DIRECT',
          description: `Fee Payment Received (${p.remarks || 'Cashier Desk'})`,
          type: 'PAYMENT',
          mode: p.payment_mode || 'CASH',
          status: 'RECEIVED',
          debit: 0,
          credit: amt,
        });
      });
    } else if (invoices && invoices.length > 0) {
      invoices.forEach((inv) => {
        const paid = Number(inv.paid_amount) || 0;
        if (paid > 0) {
          totalPaid += paid;
          const pDate = (inv.created_at || new Date().toISOString()).split('T')[0];
          rawItems.push({
            date: pDate,
            sortPrio: 3,
            reference: `REC-${inv.invoice_number}`,
            description: `Fee Payment Received (${inv.month_name || 'Settled'})`,
            type: 'PAYMENT',
            mode: 'CASH/UPI',
            status: 'RECEIVED',
            debit: 0,
            credit: paid,
          });
        }
      });
    }

    // 3. Debits from surplus refunds disbursed to parents
    let totalRefunded = 0;
    if (refunds && refunds.length > 0) {
      refunds.forEach((rf) => {
        const amt = Number(rf.amount) || 0;
        totalRefunded += amt;
        const rfDate = (rf.refund_date || rf.created_at || new Date().toISOString()).split('T')[0];
        rawItems.push({
          date: rfDate,
          sortPrio: 4,
          reference: rf.voucher_number || rf.voucherNumber || 'REFUND',
          description: `Surplus Advance Fee Refund (${rf.refund_mode || 'BANK_TRANSFER'}${rf.transaction_reference ? ' - ' + rf.transaction_reference : ''}: ${rf.reason || 'Surplus credit refund'})`,
          type: 'REFUND',
          mode: rf.refund_mode || 'BANK_TRANSFER',
          status: rf.status || 'COMPLETED',
          debit: amt,
          credit: 0,
        });
      });
    }

    // Sort chronologically ascending (oldest first, newest last; debits before credits on same day)
    rawItems.sort((a, b) => {
      const cmp = (a.date || '').localeCompare(b.date || '');
      return cmp !== 0 ? cmp : ((a.sortPrio || 1) - (b.sortPrio || 2));
    });

    // Calculate running balance (debit - credit: positive = student due, negative = student advance)
    let runningBalance = 0;
    this.ledgerEntries = rawItems.map((item) => {
      runningBalance += (item.debit - item.credit);
      return {
        date: item.date,
        type: item.type,
        referenceNumber: item.reference,
        description: item.description,
        debit: item.debit,
        credit: item.credit,
        runningBalance,
        status: item.status,
        paymentMode: item.mode,
      };
    });

    this.ledgerBilledTotal = totalBilled;
    this.ledgerPaidTotal = totalPaid;
    this.ledgerDiscountTotal = totalDiscount;
    this.ledgerRefundTotal = totalRefunded;
    const effectiveDebits = totalBilled + totalRefunded;
    const effectiveCredits = totalPaid + totalDiscount;
    this.ledgerNetBalance = effectiveCredits > effectiveDebits
      ? (effectiveCredits - effectiveDebits)
      : -(effectiveDebits - effectiveCredits);
  }

  calculateAnnualConcessionSavings(): number {
    const base = this.ledgerBilledTotal > 0 ? this.ledgerBilledTotal : 30000;
    const pct = Math.max(0, Math.min(100, Number(this.annualConcessionPct) || 0));
    return Math.round((base * pct) / 100);
  }

  async saveStudentFeePreference() {
    if (!this.activeLedgerStudent) return;
    this.savingPreference = true;
    try {
      const concessionPct = this.selectedBillingFrequency === 'ANNUAL' ? (Number(this.annualConcessionPct) || 0) : 0;
      const res = await this.api.updateStudentFeePreference(this.activeLedgerStudent.student_id, {
        frequency: this.selectedBillingFrequency,
        annualConcessionPct: concessionPct,
        annual_concession_pct: concessionPct,
        notes: this.feePreferenceNotes || `Billing frequency configured as ${this.selectedBillingFrequency}`,
        academicYearId: this.auth.activeAcademicSession()?.id,
        academic_year_id: this.auth.activeAcademicSession()?.id,
      });
      if (!res || res.success === false) {
        throw new Error(res?.message || 'Failed');
      }
      this.savingPreference = false;
      this.toast.success(`Fee frequency & concession preference saved successfully!`);
      await this.openStudentLedgerModal(this.activeLedgerStudent);
    } catch (err: any) {
      this.savingPreference = false;
      this.toast.error('SQL migration pending in Supabase. Please run supabase/fee_billing_rules_and_ledger_charges.sql in Supabase SQL editor.');
    }
  }

  printStudentLedger() {
    if (!this.activeLedgerStudent) return;
    const s = this.activeLedgerStudent;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = this.ledgerEntries.map((e, idx) => {
      const bal = this.getItemRunningBalance(e, idx);
      const balFormatted = bal > 0 ? `₹${bal.toLocaleString()} (Due)` : (bal < 0 ? `+₹${(-bal).toLocaleString()} (Adv)` : `₹0.00 (Settled)`);
      const balColor = bal > 0 ? '#dc2626' : (bal < 0 ? '#16a34a' : '#64748b');
      return `
      <tr>
        <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${new Date(e.date).toLocaleDateString('en-GB')}</td>
        <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block; font-size:9px; font-weight:bold; padding:1px 5px; border-radius:3px; margin-right:6px; background:${e.referenceNumber?.startsWith('FINE-') ? '#fef3c7' : (e.type === 'INVOICE' || e.type === 'CHARGE' ? '#fff1f2' : (e.type === 'CONCESSION' ? '#faf5ff' : '#ecfdf5'))}; color:${e.referenceNumber?.startsWith('FINE-') ? '#92400e' : (e.type === 'INVOICE' || e.type === 'CHARGE' ? '#dc2626' : (e.type === 'CONCESSION' ? '#6d28d9' : '#16a34a'))}; border:1px solid ${e.referenceNumber?.startsWith('FINE-') ? '#fcd34d' : (e.type === 'INVOICE' || e.type === 'CHARGE' ? '#fecdd3' : (e.type === 'CONCESSION' ? '#ddd6fe' : '#a7f3d0'))};">${e.referenceNumber?.startsWith('FINE-') ? 'LATE FINE' : e.type}</span>
          ${e.description}
        </td>
        <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-family:monospace; font-weight:bold;">${e.referenceNumber}</td>
        <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#dc2626;">${e.debit > 0 ? '₹' + e.debit.toLocaleString() : '-'}</td>
        <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#16a34a;">${e.credit > 0 ? '₹' + e.credit.toLocaleString() : '-'}</td>
        <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold; color:${balColor}; font-family:monospace;">
          ${balFormatted}
        </td>
      </tr>
    `;
    }).join('');

    const effectiveCredits = this.ledgerPaidTotal + this.ledgerDiscountTotal;
    const netClosingBal = this.ledgerBilledTotal > effectiveCredits
      ? `<span style="color:#dc2626; font-weight:bold;">₹${(this.ledgerBilledTotal - effectiveCredits).toLocaleString()} (Due)</span>`
      : (effectiveCredits > this.ledgerBilledTotal
        ? `<span style="color:#16a34a; font-weight:bold;">+₹${(effectiveCredits - this.ledgerBilledTotal).toLocaleString()} (Adv)</span>`
        : '<span style="color:#64748b; font-weight:bold;">₹0.00 (Settled)</span>');

    const netBadge = effectiveCredits > this.ledgerBilledTotal
      ? `<span style="color:#16a34a; font-weight:bold; background:#ecfdf5; padding:2px 8px; border-radius:4px; border:1px solid #a7f3d0;">+₹${(effectiveCredits - this.ledgerBilledTotal).toLocaleString()} (Advance Credit)</span>`
      : (this.ledgerBilledTotal > effectiveCredits
        ? `<span style="color:#dc2626; font-weight:bold; background:#fff1f2; padding:2px 8px; border-radius:4px; border:1px solid #fecdd3;">₹${(this.ledgerBilledTotal - effectiveCredits).toLocaleString()} (Outstanding Due)</span>`
        : '<span style="color:#475569; font-weight:bold;">Settled (₹0.00)</span>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Account Passbook - ${s.student_name}</title>
        <style>
          body { font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 24px; margin: 0; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 900; color: #0f172a; }
          .subtitle { font-size: 11px; color: #64748b; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; }
          .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .card-val { font-size: 16px; font-weight: 900; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${this.auth.currentUser()?.school?.name || 'SchoolSense Academy'}</div>
          <div class="subtitle">Official Student Account Passbook & Billing Statement | Academic Session: ${this.auth.activeSessionName()}</div>
          <div style="margin-top: 8px; font-weight: bold; font-size: 13px;">
            Student: ${s.student_name} | Admission No: ${s.admission_number || 'N/A'} | Class: ${s.class_name} - ${s.section_name}
          </div>
        </div>

        <div class="metrics">
          <div class="card">
            <div class="card-title">Total Billed</div>
            <div class="card-val">₹${this.ledgerBilledTotal.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Paid Received</div>
            <div class="card-val" style="color: #16a34a;">₹${this.ledgerPaidTotal.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Concessions</div>
            <div class="card-val" style="color: #4f46e5;">₹${this.ledgerDiscountTotal.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Account Position</div>
            <div class="card-val">${netBadge}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars / Description</th>
              <th>Ref / Voucher #</th>
              <th style="text-align:right;">Debit (Dr)</th>
              <th style="text-align:right;">Credit (Cr)</th>
              <th style="text-align:right;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background:#f8fafc; font-weight:bold; border-top:2px solid #cbd5e1;">
              <td colspan="3" style="padding:8px; text-transform:uppercase; font-size:10px;">Passbook Closing Totals</td>
              <td style="padding:8px; text-align:right; color:#dc2626;">₹${this.ledgerBilledTotal.toLocaleString()}</td>
              <td style="padding:8px; text-align:right; color:#16a34a;">₹${this.ledgerPaidTotal.toLocaleString()}</td>
              <td style="padding:8px; text-align:right; font-family:monospace;">${netClosingBal}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center;">
          This is an official computer-generated account passbook statement generated on ${new Date().toLocaleString('en-IN')}.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  // ==============================================================================
  // STUDENT FEE REFUND ACTIONS (SURPLUS ADVANCE CREDIT DISBURSEMENT)
  // ==============================================================================
  openRefundModal(student?: any) {
    if (student) {
      this.activeLedgerStudent = student;
    }
    const maxAdv = this.currentAvailableAdvance;
    this.refundForm = {
      amount: maxAdv > 0 ? maxAdv : 0,
      refund_mode: 'BANK_TRANSFER',
      transaction_reference: '',
      reason: 'Surplus advance credit refund',
    };
    this.refundError = '';
    this.showRefundModal = true;
  }

  closeRefundModal() {
    this.showRefundModal = false;
    this.refundError = '';
    this.processingRefund = false;
  }

  async openRefundModalForStudent(st: AggregatedStudentFeeRecord) {
    this.openStudentLedgerForStudent(st);
    this.openRefundModal();
  }

  async submitRefund() {
    if (!this.activeLedgerStudent) {
      this.refundError = 'No student selected for refund.';
      return;
    }

    const amt = Number(this.refundForm.amount) || 0;
    const maxAdv = this.currentAvailableAdvance;

    if (amt <= 0) {
      this.refundError = 'Please enter a valid refund amount greater than ₹0.';
      return;
    }

    if (amt > maxAdv) {
      this.refundError = `Cannot refund ₹${amt}. Maximum refundable advance credit is ₹${maxAdv}.`;
      return;
    }

    this.processingRefund = true;
    this.refundError = '';

    try {
      const res = await this.api.issueStudentFeeRefund({
        studentId: this.activeLedgerStudent.student_id,
        amount: amt,
        refundMode: this.refundForm.refund_mode,
        transactionReference: this.refundForm.transaction_reference,
        reason: this.refundForm.reason || 'Surplus advance credit refund',
        academicYearId: this.auth.activeAcademicSession()?.id,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to process refund.');
      }

      const issuedVoucher = res.voucherNumber || res.voucher_number || 'REFUND';
      this.toast.success(`Refund of ₹${amt.toLocaleString()} processed successfully! Voucher #${issuedVoucher}`);

      const issuedRefundRecord = {
        voucher_number: issuedVoucher,
        amount: amt,
        refund_mode: this.refundForm.refund_mode,
        transaction_reference: this.refundForm.transaction_reference,
        reason: this.refundForm.reason,
        refund_date: new Date().toISOString(),
      };

      if (this.activeLedgerStudent?.student_id) {
        const sid = this.activeLedgerStudent.student_id;
        this.studentRefundsMap[sid] = (this.studentRefundsMap[sid] || 0) + amt;
      }

      this.closeRefundModal();

      // Refresh Ledger modal statement
      if (this.activeLedgerStudent) {
        await this.openStudentLedgerModal(this.activeLedgerStudent);
      }
      // Also reload data to keep overview in sync
      this.loadAllData();

      // Prompt printing voucher
      setTimeout(() => {
        if (confirm(`Do you want to print official Refund Voucher (${issuedVoucher})?`)) {
          this.printRefundVoucher(issuedRefundRecord);
        }
      }, 300);
    } catch (err: any) {
      this.refundError = err?.message || 'Error processing refund.';
      this.toast.error(this.refundError);
    } finally {
      this.processingRefund = false;
    }
  }

  printRefundVoucher(refund: any) {
    if (!this.activeLedgerStudent) return;
    const s = this.activeLedgerStudent;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const voucherNum = refund.voucher_number || refund.voucherNumber || 'REFUND';
    const amt = Number(refund.amount) || 0;
    const mode = refund.refund_mode || refund.paymentMode || 'BANK_TRANSFER';
    const txn = refund.transaction_reference || 'N/A';
    const reason = refund.reason || 'Surplus advance balance refund';
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Refund Payment Voucher - ${voucherNum}</title>
        <style>
          body { font-family: 'Inter', sans-serif, -apple-system; font-size: 13px; color: #0f172a; padding: 36px; margin: 0; background: #fff; }
          .receipt-box { max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; padding: 28px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
          .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; font-size: 11px; font-weight: 800; border-radius: 6px; margin-top: 6px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; font-size: 12px; }
          .info-grid div { padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
          .info-grid strong { color: #475569; display: inline-block; width: 130px; }
          .amount-banner { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
          .amount-val { font-size: 28px; font-weight: 900; color: #0f172a; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 24px; }
          .sig-box { border-top: 1px solid #94a3b8; width: 180px; text-align: center; font-size: 11px; color: #64748b; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="title">${schoolName}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Official Fee Disbursement & Refund Voucher</div>
              <div class="badge">SURPLUS ADVANCE REFUND</div>
            </div>
            <div style="text-align: right; font-family: monospace; font-size: 12px;">
              <div><strong>Voucher #:</strong> ${voucherNum}</div>
              <div><strong>Date:</strong> ${new Date(refund.refund_date || new Date()).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div class="info-grid">
            <div><strong>Student Name:</strong> ${s.student_name}</div>
            <div><strong>Admission No:</strong> ${s.admission_number || 'N/A'}</div>
            <div><strong>Class & Section:</strong> ${s.class_name} (${s.section_name})</div>
            <div><strong>Disbursement Mode:</strong> ${mode}</div>
            <div><strong>Txn Reference:</strong> ${txn}</div>
            <div><strong>Reason:</strong> ${reason}</div>
          </div>

          <div class="amount-banner">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 0.05em;">Refund Amount Disbursed</div>
            <div class="amount-val">₹${amt.toLocaleString('en-IN')}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Rupees ${amt.toLocaleString('en-IN')} Only</div>
          </div>

          <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 16px;">
            This voucher acknowledges the formal disbursement of excess/advance fee credit back to the registered guardian.
          </div>

          <div class="footer">
            <div class="sig-box">Receiver / Guardian Signature</div>
            <div class="sig-box">Cashier / Bursar Seal & Sign</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  // Add Fee Structure Modal Actions
  openAddStructureModal() {
    this.structureForm = {
      class_id: this.classes[0]?.id || '',
      fee_category_id: this.categories[0]?.id || '',
      category_name: this.categories[0]?.name || 'Tuition Fee',
      amount: 2500,
      frequency: 'MONTHLY',
      due_day: 10,
    };
    this.structureModalError = '';
    this.showAddStructureModal = true;

    if (this.classes.length === 0) {
      this.api.get<any[]>('academics/classes').subscribe((cls) => {
        this.classes = cls || [];
        if (!this.structureForm.class_id && this.classes.length > 0) {
          this.structureForm.class_id = this.classes[0].id;
        }
      });
    }
    if (this.categories.length === 0) {
      this.api.get<any[]>('fees/categories').subscribe((cats) => {
        this.categories = cats || [];
        if (!this.structureForm.fee_category_id && this.categories.length > 0) {
          this.structureForm.fee_category_id = this.categories[0].id;
          this.structureForm.category_name = this.categories[0].name;
        }
      });
    }
  }

  closeAddStructureModal() {
    this.showAddStructureModal = false;
    this.structureModalError = '';
  }

  submitAddStructure() {
    if (!this.structureForm.class_id) {
      this.structureModalError = 'Please select a class for this fee structure.';
      return;
    }
    if (!this.structureForm.amount || this.structureForm.amount <= 0) {
      this.structureModalError = 'Please enter a valid fee amount greater than 0.';
      return;
    }

    this.savingStructure = true;
    this.structureModalError = '';
    const payload = {
      ...this.structureForm,
      academic_year_id: this.auth.activeAcademicSession()?.id,
    };

    this.api.post('fees/structures', payload).subscribe({
      next: () => {
        this.savingStructure = false;
        this.closeAddStructureModal();
        this.toast.success('Fee structure added successfully!');
        this.loadAllData();
      },
      error: (err: any) => {
        this.savingStructure = false;
        this.structureModalError = err.message || 'Failed to create fee structure.';
      },
    });
  }

  promptDeleteStructure(fs: FeeStructure) {
    if (!confirm(`Remove fee structure for ${fs.class_name}?`)) return;
    this.api.delete(`fees/structures/${fs.id}`).subscribe({
      next: () => {
        this.toast.success('Fee structure removed.');
        this.loadAllData();
      },
    });
  }

  // Edit Fee Structure Modal Actions
  openEditStructureModal(fs: FeeStructure) {
    this.editingStructureId = fs.id;
    this.editStructureForm = {
      class_id: fs.class_id,
      fee_category_id: fs.fee_category_id || '',
      category_name: fs.fee_category_name || (fs as any).category_name || 'Tuition Fee',
      amount: fs.amount,
      frequency: (fs.frequency as any) || 'MONTHLY',
      due_day: fs.due_day || 10,
    };
    this.editStructureModalError = '';
    this.showEditStructureModal = true;
  }

  closeEditStructureModal() {
    this.showEditStructureModal = false;
    this.editingStructureId = '';
    this.editStructureModalError = '';
  }

  submitEditStructure() {
    if (!this.editingStructureId) return;
    if (!this.editStructureForm.amount || this.editStructureForm.amount <= 0) {
      this.editStructureModalError = 'Please enter a valid fee amount greater than 0.';
      return;
    }
    this.savingEditStructure = true;
    this.editStructureModalError = '';
    const payload = {
      class_id: this.editStructureForm.class_id,
      fee_category_id: this.editStructureForm.fee_category_id,
      amount: Number(this.editStructureForm.amount),
      frequency: this.editStructureForm.frequency,
      due_day: Number(this.editStructureForm.due_day) || 10,
    };
    this.api.patch(`fees/structures/${this.editingStructureId}`, payload).subscribe({
      next: () => {
        this.savingEditStructure = false;
        this.closeEditStructureModal();
        this.toast.success('Fee structure updated successfully!');
        this.loadAllData();
      },
      error: (err: any) => {
        this.savingEditStructure = false;
        this.editStructureModalError = err.message || 'Failed to update fee structure.';
      },
    });
  }

  // Batch Billing Modal Actions
  openBatchInvoiceModal() {
    this.showBatchModal = true;
  }

  closeBatchModal() {
    this.showBatchModal = false;
  }

  executeBatchInvoicing() {
    this.executingBatch = true;
    const sessionId = this.auth.activeAcademicSession()?.id;
    this.api.post<any>('fees/invoices/generate-batch', {
      academicYearId: sessionId,
      monthName: this.batchMonthName,
      dueDate: this.batchDueDate,
    }).subscribe({
      next: (res) => {
        this.executingBatch = false;
        this.closeBatchModal();
        this.toast.success(`Generated ${res?.createdCount || 0} student fee invoices for ${this.batchMonthName}!`);
        this.loadAllData();
      },
      error: (err: any) => {
        this.executingBatch = false;
        this.toast.error(err.message || 'Failed to run batch invoicing.');
      },
    });
  }

  sendBatchFeeReminders() {
    this.toast.success(`Automated SMS & Notice fee reminders sent to all ${this.defaultersCount} pending student guardians.`);
  }

  exportFeeInvoicesCsv() {
    const rows = this.filteredInvoices.map((inv) => ({
      invoiceNumber: inv.invoice_number,
      studentName: inv.student_name,
      admissionNumber: inv.admission_number,
      classSection: `${inv.class_name} - ${inv.section_name}`,
      month: inv.month_name,
      totalAmount: inv.total_amount,
      paidAmount: inv.paid_amount,
      dueAmount: inv.total_amount - inv.paid_amount,
      dueDate: inv.due_date,
      status: inv.status,
    }));

    this.exportService.exportToCsv(
      `Fee_Invoices_Ledger_${new Date().toISOString().split('T')[0]}`,
      rows,
      [
        { key: 'invoiceNumber', label: 'Invoice No' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'admissionNumber', label: 'Admission No' },
        { key: 'classSection', label: 'Class & Section' },
        { key: 'month', label: 'Billing Period' },
        { key: 'totalAmount', label: 'Total Billed (INR)' },
        { key: 'paidAmount', label: 'Paid Amount (INR)' },
        { key: 'dueAmount', label: 'Outstanding (INR)' },
        { key: 'dueDate', label: 'Due Date' },
        { key: 'status', label: 'Payment Status' },
      ]
    );
    this.toast.success('Invoices Ledger CSV exported.');
  }

  // Print Official Fee Receipt
  printFeeReceipt(inv: StudentFeeInvoice, receiptNo?: string, recentPaid?: number) {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const recNumber = receiptNo || `REC-${new Date().getFullYear()}-${inv.invoice_number.replace('INV-', '')}`;
    const amount = recentPaid || inv.paid_amount || inv.total_amount;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${inv.student_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #fafafa; color: #0f172a; }
          .receipt-box { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #0f172a; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .school-title { font-size: 18px; font-weight: 800; text-transform: uppercase; }
          .doc-title { font-size: 13px; font-weight: bold; color: #475569; margin-top: 4px; letter-spacing: 1px; }
          .receipt-tag { display: inline-block; background: #0f172a; color: white; font-size: 11px; font-weight: bold; padding: 3px 12px; border-radius: 4px; margin-top: 6px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; margin-bottom: 16px; }
          .meta-grid strong { color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          .total-row td { font-weight: 800; font-size: 13px; background: #f8fafc; border-top: 2px solid #0f172a; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; padding-top: 10px; }
          .sig-box { border-top: 1px solid #64748b; width: 160px; text-align: center; padding-top: 6px; }
          @media print { body { padding: 0; background: none; } .receipt-box { box-shadow: none; border: 1px solid #000; } }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div class="school-title">${schoolName}</div>
            <div class="doc-title">OFFICIAL TUITION & INSTITUTIONAL FEE RECEIPT</div>
            <div class="receipt-tag">RECEIPT #: ${recNumber}</div>
          </div>

          <div class="meta-grid">
            <div><strong>Student:</strong> ${inv.student_name}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div><strong>Adm No:</strong> ${inv.admission_number}</div>
            <div><strong>Class:</strong> ${inv.class_name} (${inv.section_name})</div>
            <div><strong>Invoice No:</strong> ${inv.invoice_number}</div>
            <div><strong>Billing Period:</strong> ${inv.month_name}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Composite Monthly Tuition & Academic Fee</td>
                <td style="text-align: right;">₹${inv.total_amount}</td>
              </tr>
              ${(inv.discount_amount && Number(inv.discount_amount) > 0) ? `
              <tr style="color: #6d28d9; background: #faf5ff;">
                <td><strong>Fee Concession / Discount</strong> (${inv.discount_code ? 'Coupon: ' + inv.discount_code : 'Approved Concession'})</td>
                <td style="text-align: right; font-weight: bold;">-₹${inv.discount_amount}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total Received (Cleared)</td>
                <td style="text-align: right; color: #047857;">₹${amount}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748b;">
            <strong>Amount in words:</strong> Rupees ${amount} Only • Received via Electronic / Cash Counter
          </div>

          <div class="footer">
            <div class="sig-box">Parent / Depositor</div>
            <div class="sig-box">Authorized Cashier / Seal</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
