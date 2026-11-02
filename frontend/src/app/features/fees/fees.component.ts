import { Component, OnInit, effect } from '@angular/core';
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
} from '../../core/models';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      
      <!-- ============================================================== -->
      <!-- WORKSPACE TABS & HEADER ACTIONS                                -->
      <!-- ============================================================== -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <!-- 5-Tab Navigation -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <!-- Tab 1: Student Ledger -->
          <button (click)="setTab('INVOICES')"
                  class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  [ngClass]="activeTab === 'INVOICES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Student Ledger ({{ invoices.length }})</span>
          </button>

          <!-- Tab 2: Fee Structures & Heads -->
          <button (click)="setTab('MATRIX')"
                  class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  [ngClass]="activeTab === 'MATRIX' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Fee Structures ({{ structures.length }})</span>
          </button>

          <!-- Tab 3: Daily Day-Book & Cashier -->
          <button (click)="setTab('DAYBOOK')"
                  class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  [ngClass]="activeTab === 'DAYBOOK' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Daily Day-Book</span>
          </button>

          <!-- Tab 4: Concessions & Promocodes -->
          <button *ngIf="canManage" (click)="setTab('PROMOCODES')"
                  class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  [ngClass]="activeTab === 'PROMOCODES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Concessions</span>
          </button>

          <!-- Tab 5: Defaulters & Late Fees -->
          <button (click)="setTab('DEFAULTERS')"
                  class="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  [ngClass]="activeTab === 'DEFAULTERS' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Defaulters ({{ defaultersCount }})</span>
          </button>
        </div>

        <!-- Inline Actions & Session Info -->
        <div class="flex items-center gap-2 flex-wrap shrink-0">
          <!-- Active Session Badge -->
          <div class="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Session: <strong class="text-slate-900">{{ auth.activeSessionName() }}</strong></span>
          </div>

          <!-- Collect Fee Button -->
          <button (click)="openCollectFeeModal()"
                  class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Collect Fee</span>
          </button>

          <!-- Add Fee Structure (in MATRIX tab) -->
          <button *ngIf="canManage && activeTab === 'MATRIX'"
                  (click)="openAddStructureModal()"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Fee Structure</span>
          </button>
        </div>
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
                       placeholder="Search student, adm no, invoice..."
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
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="OVERDUE">Overdue Dues</option>
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
              <button (click)="exportFeeInvoicesCsv()"
                      class="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- Invoices Roster Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th class="py-3 px-4">Invoice No</th>
                  <th class="py-3 px-4">Student</th>
                  <th class="py-3 px-4">Class</th>
                  <th class="py-3 px-4">Billing Month</th>
                  <th class="py-3 px-4">Total Amount</th>
                  <th class="py-3 px-4">Paid / Due</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let inv of paginatedInvoices" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ inv.invoice_number }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900">{{ inv.student_name }}</div>
                    <div class="text-[10px] text-slate-400">Adm: {{ inv.admission_number }}</div>
                  </td>
                  <td class="py-3 px-4">{{ inv.class_name }} - {{ inv.section_name }}</td>
                  <td class="py-3 px-4 font-bold text-slate-600">{{ inv.month_name }}</td>
                  <td class="py-3 px-4 font-black text-slate-900">₹{{ inv.total_amount | number:'1.0-0' }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-emerald-700">₹{{ inv.paid_amount | number:'1.0-0' }}</div>
                    <div class="text-[10px]" [ngClass]="(inv.total_amount - inv.paid_amount) > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'">
                      Due: ₹{{ (inv.total_amount - inv.paid_amount) | number:'1.0-0' }}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border border-emerald-200': inv.status === 'PAID',
                            'bg-amber-50 text-amber-700 border border-amber-200': inv.status === 'PARTIAL',
                            'bg-rose-50 text-rose-700 border border-rose-200': inv.status === 'UNPAID',
                            'bg-red-100 text-red-800 border border-red-300 font-black': inv.status === 'OVERDUE'
                          }">
                      {{ inv.status }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5 whitespace-nowrap flex-nowrap">
                      <!-- Collect Payment (if unpaid/partial) -->
                      <button *ngIf="inv.status !== 'PAID'"
                              (click)="openCollectFeeForInvoice(inv)"
                              class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs active:scale-95">
                        Collect
                      </button>

                      <!-- Print Official Receipt (if payment made) -->
                      <button *ngIf="inv.paid_amount > 0 || inv.status === 'PAID'"
                              (click)="printFeeReceipt(inv)"
                              title="Print Official Fee Receipt"
                              class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>

                      <!-- Generate 80C Certificate (if payment made) -->
                      <button *ngIf="inv.paid_amount > 0"
                              (click)="generate80cCertificate(inv)"
                              title="Generate Income Tax Sec 80C Tuition Fee Certificate"
                              class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[10px] cursor-pointer active:scale-95">
                        80C Cert
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredInvoices.length === 0">
                  <td colspan="8" class="py-12 text-center text-slate-400 text-xs">
                    No student fee invoices found matching the selected filter.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer (10 items per page) -->
          <div *ngIf="filteredInvoices.length > 0" class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span class="font-bold text-slate-800">{{ paginationStartIndex }}</span> to <span class="font-bold text-slate-800">{{ paginationEndIndex }}</span> of <span class="font-bold text-slate-900">{{ filteredInvoices.length }}</span> invoices
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
                <ng-container *ngFor="let page of visiblePages">
                  <button (click)="goToPage(page)"
                          class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                          [ngClass]="currentPage === page ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'">
                    {{ page }}
                  </button>
                </ng-container>
              </div>

              <!-- Next Button -->
              <button (click)="goToNextPage()"
                      [disabled]="currentPage === totalPages"
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
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900">Configured Fee Structures & Heads</h3>
              <p class="text-xs text-slate-500 mt-0.5">Manage grade-wise fee heads, amounts, due days, and billing cycles.</p>
            </div>
            
            <button *ngIf="canManage" (click)="openAddStructureModal()"
                    class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 self-start sm:self-auto">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Fee Structure</span>
            </button>
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
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900">Cashier Day-Book & Shift Reconciler</h3>
              <p class="text-xs text-slate-500 mt-0.5">Audit-ready breakdown of cash, UPI, cheque, and bank remittances for daily collection reconciliation.</p>
            </div>

            <!-- Date Selector -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-bold text-slate-600">Day-Book Date:</label>
              <input type="date"
                     [(ngModel)]="dayBookDate"
                     (change)="loadDayBook()"
                     class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800" />
              <button (click)="loadDayBook()"
                      class="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">
                Refresh
              </button>
            </div>
          </div>

          <!-- Tally Chips Grid -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900">
              <div class="text-[10px] uppercase font-bold text-indigo-600">Gross Daily Total</div>
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
              <div class="text-xs font-bold text-slate-800">Day Receipts Ledger ({{ dayBookSummary?.transactions?.length || 0 }})</div>
              <button (click)="printDayBookSummary()" class="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                Print Day-Book Summary
              </button>
            </div>

            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
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
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-900">{{ tx.receiptNumber }}</td>
                  <td class="py-2.5 px-3 font-bold">{{ tx.studentName }}</td>
                  <td class="py-2.5 px-3">{{ tx.className }}</td>
                  <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {{ tx.paymentMode }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-slate-500">{{ tx.collectedBy }}</td>
                  <td class="py-2.5 px-3 text-right font-black text-emerald-700">₹{{ tx.amount | number:'1.0-0' }}</td>
                </tr>

                <tr *ngIf="!dayBookSummary || dayBookSummary.transactions.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-xs">
                    No transactions recorded on {{ dayBookDate }}.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 4: CONCESSIONS & PROMOCODES DESK                           -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'PROMOCODES'" class="space-y-4 animate-fadeIn">
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
              <span>+ Generate Promocode</span>
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
      <!-- TAB 5: DEFAULTERS & LATE FEES REGISTRY                         -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'DEFAULTERS'" class="space-y-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-4">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-black text-slate-900">Outstanding Dues & Fee Defaulters Registry</h3>
              <p class="text-xs text-slate-500 mt-0.5">Students with unpaid fee balances past the scheduled due date with dynamic late fine calculations</p>
            </div>

            <button (click)="sendBatchFeeReminders()"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>Send SMS Dues Reminders</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th class="py-3 px-4">Student Name</th>
                  <th class="py-3 px-4">Class</th>
                  <th class="py-3 px-4">Invoice No</th>
                  <th class="py-3 px-4">Pending Dues</th>
                  <th class="py-3 px-4">Due Date</th>
                  <th class="py-3 px-4">Overdue Days</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let def of defaultersList" class="hover:bg-slate-50">
                  <td class="py-3 px-4 font-bold text-slate-900">{{ def.student_name }} (Adm: {{ def.admission_number }})</td>
                  <td class="py-3 px-4">{{ def.class_name }} - {{ def.section_name }}</td>
                  <td class="py-3 px-4 font-mono">{{ def.invoice_number }}</td>
                  <td class="py-3 px-4 font-black text-rose-600">₹{{ (def.total_amount - def.paid_amount) | number:'1.0-0' }}</td>
                  <td class="py-3 px-4 font-mono text-slate-500">{{ def.due_date | date:'dd MMM yyyy' }}</td>
                  <td class="py-3 px-4 font-bold text-amber-700">
                    {{ calculateOverdueDays(def.due_date) }} Days Past Due
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button (click)="openCollectFeeForInvoice(def)" class="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer active:scale-95">
                      Collect
                    </button>
                  </td>
                </tr>

                <tr *ngIf="defaultersList.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                    <div class="inline-flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                        <path d="M8.5 12.5l2.2 2.2 4.8-4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span>Excellent! Zero fee defaulters found on campus.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: SIBLING DETECTOR MODAL                                  -->
      <!-- ============================================================== -->
      <div *ngIf="showSiblingModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="showSiblingModal = false"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
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

      <!-- ============================================================== -->
      <!-- MODAL: COLLECT FEE PAYMENT                                     -->
      <!-- ============================================================== -->
      <div *ngIf="showCollectModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeCollectModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-black text-slate-900 text-base">Collect Fee Payment</h3>
            <button (click)="closeCollectModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div *ngIf="pendingInvoices.length > 0; else noPendingInvoicesPrompt">
              <label class="block font-bold text-slate-700 mb-1">Select Invoice *</label>
              <select [(ngModel)]="collectForm.invoice_id" (change)="onCollectInvoiceChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Choose Invoice --</option>
                <option *ngFor="let inv of pendingInvoices" [value]="inv.id">
                  {{ inv.student_name }} - {{ inv.invoice_number }} (Due: ₹{{ inv.total_amount - inv.paid_amount }})
                </option>
              </select>
            </div>

            <!-- Sibling Discount Suggestion (only shown if siblings detected) -->
            <div *ngIf="activeSiblingInfo?.hasSiblings" class="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs space-y-1 animate-fadeIn">
              <div class="font-bold flex items-center gap-1.5 text-indigo-700">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Sibling Detected ({{ activeSiblingInfo?.siblingsCount }} Enrolled)</span>
              </div>
              <p class="text-[11px] text-indigo-800">
                Eligible for <strong>{{ activeSiblingInfo?.suggestedDiscountPct }}% concession</strong> (Policy: <code>SIBLING15</code>).
              </p>
            </div>
            <ng-template #noPendingInvoicesPrompt>
              <div class="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1.5">
                <div class="font-bold flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>No Pending Student Invoices Found</span>
                </div>
                <p class="text-[11px] text-amber-800 leading-relaxed">
                  Student fee invoices are automatically generated upon student admission and grade enrollment based on configured fee structures.
                </p>
              </div>
            </ng-template>

            <div *ngIf="pendingInvoices.length > 0" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Amount to Pay (INR) *</label>
                <input type="number" [(ngModel)]="collectForm.amount_paid" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-emerald-700" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select [(ngModel)]="collectForm.payment_mode" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="CASH">Cash Payment</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="NET_BANKING">Net Banking / NEFT</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>
            </div>

            <div *ngIf="pendingInvoices.length > 0">
              <label class="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No</label>
              <input type="text" [(ngModel)]="collectForm.transaction_reference" placeholder="e.g. UPI-1234567890" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
            </div>

            <div *ngIf="pendingInvoices.length > 0">
              <label class="block font-bold text-slate-700 mb-1">Remarks</label>
              <input type="text" [(ngModel)]="collectForm.remarks" placeholder="Quarter 1 fee payment" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div *ngIf="collectModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ collectModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeCollectModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="submitCollectFee()" [disabled]="savingPayment || pendingInvoices.length === 0" class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ savingPayment ? 'Recording...' : 'Receive & Print Receipt' }}
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ADD FEE STRUCTURE                                       -->
      <!-- ============================================================== -->
      <div *ngIf="showAddStructureModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeAddStructureModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
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

      <!-- ============================================================== -->
      <!-- MODAL: EDIT FEE STRUCTURE                                      -->
      <!-- ============================================================== -->
      <div *ngIf="showEditStructureModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeEditStructureModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
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

      <!-- ============================================================== -->
      <!-- MODAL: GENERATE PROMOCODE (ADMIN ONLY)                         -->
      <!-- ============================================================== -->
      <div *ngIf="showCreatePromoModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeCreatePromoModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
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
  `,
})
export class FeesComponent implements OnInit {
  activeTab: 'INVOICES' | 'MATRIX' | 'DAYBOOK' | 'PROMOCODES' | 'DEFAULTERS' = 'INVOICES';

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

  // Batch Invoicing Modal
  showBatchModal = false;
  executingBatch = false;
  batchMonthName = 'April 2026';
  batchDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  // Day-Book Cashier Desk State
  dayBookDate: string = new Date().toISOString().split('T')[0];
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
      if (tab === 'INVOICES' || tab === 'MATRIX' || tab === 'DAYBOOK' || tab === 'PROMOCODES' || tab === 'DEFAULTERS') {
        this.activeTab = tab as any;
      } else if (tab === 'STRUCTURE') {
        this.activeTab = 'MATRIX';
      }
    });
    this.loadStoredPromocodes();
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

  setTab(tab: 'INVOICES' | 'MATRIX' | 'DAYBOOK' | 'PROMOCODES' | 'DEFAULTERS') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.toLowerCase() },
      queryParamsHandling: 'merge',
    });
    if (tab === 'DAYBOOK') {
      this.loadDayBook();
    }
  }

  loadAllData() {
    const sessionId = this.auth.activeAcademicSession()?.id;
    this.loadingOverview = true;
    this.loadingInvoices = true;
    this.loadingStructures = true;

    this.api.get<any>('fees/overview-full', sessionId ? { academicYearId: sessionId } : undefined).subscribe({
      next: (res) => {
        if (res) {
          this.overview = res.overview || null;
          this.invoices = res.invoices || [];
          this.structures = res.structures || [];
          this.classes = res.classes || [];
          this.categories = res.categories || [];
          this.populateMatrixGrid();
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
  loadDayBook() {
    this.loadingDayBook = true;
    this.api.getDailyDayBook(this.dayBookDate).then((summary) => {
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Day-Book Summary - ${this.dayBookDate}</title>
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
          <div class="sub">DAILY CASHIER DAY-BOOK & COLLECTION RECONCILIATION • ${this.dayBookDate}</div>
        </div>
        <div class="chips">
          <div class="chip"><div>TOTAL GROSS</div><div class="chip-val">₹${this.dayBookSummary.totalCollected}</div></div>
          <div class="chip"><div>CASH</div><div class="chip-val">₹${this.dayBookSummary.cashAmount}</div></div>
          <div class="chip"><div>UPI / QR</div><div class="chip-val">₹${this.dayBookSummary.upiAmount}</div></div>
          <div class="chip"><div>BANK / NEFT</div><div class="chip-val">₹${this.dayBookSummary.bankAmount}</div></div>
          <div class="chip"><div>CHEQUES</div><div class="chip-val">₹${this.dayBookSummary.chequeAmount}</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Receipt No</th><th>Student</th><th>Class</th><th>Mode</th><th>Cashier</th><th style="text-align: right;">Amount (INR)</th></tr>
          </thead>
          <tbody>
            ${this.dayBookSummary.transactions.map(t => `
              <tr><td>${t.receiptNumber}</td><td>${t.studentName}</td><td>${t.className}</td><td>${t.paymentMode}</td><td>${t.collectedBy}</td><td style="text-align: right;">₹${t.amount}</td></tr>
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
    const firstPending = this.pendingInvoices[0];
    this.collectForm = {
      invoice_id: firstPending?.id || '',
      student_id: firstPending?.student_id || '',
      amount_paid: firstPending ? (firstPending.total_amount - firstPending.paid_amount) : 2500,
      payment_mode: 'UPI',
      transaction_reference: '',
      remarks: 'Fee payment received',
    };
    this.collectModalError = '';
    this.showCollectModal = true;
  }

  openCollectFeeForInvoice(inv: StudentFeeInvoice) {
    this.collectForm = {
      invoice_id: inv.id,
      student_id: inv.student_id,
      amount_paid: inv.total_amount - inv.paid_amount,
      payment_mode: 'UPI',
      transaction_reference: '',
      remarks: `Payment for invoice ${inv.invoice_number}`,
    };
    this.collectModalError = '';
    this.showCollectModal = true;
    this.checkSiblingsForCollect(inv.student_id);
  }

  closeCollectModal() {
    this.showCollectModal = false;
    this.activeSiblingInfo = null;
  }

  onCollectInvoiceChange() {
    const inv = this.invoices.find((i) => i.id === this.collectForm.invoice_id);
    if (inv) {
      this.collectForm.student_id = inv.student_id;
      this.collectForm.amount_paid = inv.total_amount - inv.paid_amount;
      this.checkSiblingsForCollect(inv.student_id);
    } else {
      this.activeSiblingInfo = null;
    }
  }

  async checkSiblingsForCollect(studentId: string) {
    if (!studentId) {
      this.activeSiblingInfo = null;
      return;
    }
    try {
      this.activeSiblingInfo = await this.api.detectStudentSiblings(studentId);
    } catch {
      this.activeSiblingInfo = null;
    }
  }

  submitCollectFee() {
    if (!this.collectForm.invoice_id || !this.collectForm.amount_paid || this.collectForm.amount_paid <= 0) {
      this.collectModalError = 'Please select an invoice and enter a valid payment amount.';
      return;
    }
    this.savingPayment = true;
    this.collectModalError = '';

    this.api.post('fees/payments', this.collectForm).subscribe({
      next: (res: any) => {
        this.savingPayment = false;
        this.closeCollectModal();
        this.toast.success(`Payment of ₹${this.collectForm.amount_paid} recorded! Receipt: ${res?.receiptNumber}`);
        this.loadAllData();
        this.loadDayBook();
        const inv = this.invoices.find((i) => i.id === this.collectForm.invoice_id);
        if (inv) {
          this.printFeeReceipt(inv, res?.receiptNumber, this.collectForm.amount_paid);
        }
      },
      error: (err: any) => {
        this.savingPayment = false;
        this.collectModalError = err.message || 'Failed to record fee payment.';
      },
    });
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
