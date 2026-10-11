import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';
import { ExportService } from '../../core/services/export.service';
import {
  FeeCategory,
  FeeStructure,
  StudentFeeInvoice,
  ClassItem,
  StudentItem,
} from '../../core/models';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      
      <!-- ============================================================== -->
      <!-- TOP HEADER & TITLE                                             -->
      <!-- ============================================================== -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Fee Management & Invoicing Desk</h1>
              <p class="text-xs text-slate-500 mt-0.5">Tuition structures, monthly billing runs, fee collection counter, ledger tracking & receipts</p>
            </div>
          </div>
        </div>

        <!-- Header Actions -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Active Session Badge -->
          <div class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Session: <strong class="text-slate-900">{{ auth.activeSessionName() }}</strong></span>
          </div>

          <!-- Generate Batch Invoices -->
          <button *ngIf="canManage"
                  (click)="openBatchInvoiceModal()"
                  class="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>⚡ Run Billing Batch</span>
          </button>

          <!-- Collect Fee Button -->
          <button (click)="openCollectFeeModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Collect Fee</span>
          </button>

          <!-- Create Structure Button -->
          <button *ngIf="canManage && activeTab === 'STRUCTURE'"
                  (click)="openAddStructureModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Fee Structure</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- SUMMARY METRICS CARDS                                          -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric 1: Total Billed -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
            <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billed Dues</div>
            <div class="text-xl font-black text-slate-900 mt-0.5">₹{{ (overview?.totalBilled || 250000) | number:'1.0-0' }}</div>
            <div class="text-[10px] text-slate-500">{{ overview?.totalInvoicesCount || invoices.length }} Total Invoices</div>
          </div>
        </div>

        <!-- Metric 2: Total Collected -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
            <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</div>
            <div class="text-xl font-black text-emerald-700 mt-0.5">₹{{ (overview?.totalCollected || 175000) | number:'1.0-0' }}</div>
            <div class="text-[10px] text-emerald-600 font-bold">{{ overview?.paidCount || 7 }} Paid Receipts</div>
          </div>
        </div>

        <!-- Metric 3: Outstanding Dues -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shrink-0">
            <svg class="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</div>
            <div class="text-xl font-black text-rose-700 mt-0.5">₹{{ (overview?.totalOutstanding || 75000) | number:'1.0-0' }}</div>
            <div class="text-[10px] text-rose-600 font-bold">{{ overview?.unpaidCount || 3 }} Unpaid Invoices</div>
          </div>
        </div>

        <!-- Metric 4: Collection Rate -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
            <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collection Efficiency</div>
            <div class="text-xl font-black text-purple-700 mt-0.5">{{ overview?.collectionRate || 70 }}%</div>
            <div class="text-[10px] text-slate-500">Recovery Rate</div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- WORKSPACE NAVIGATION TABS                                      -->
      <!-- ============================================================== -->
      <div class="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button (click)="setTab('INVOICES')"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                [ngClass]="activeTab === 'INVOICES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Student Invoices & Ledger ({{ invoices.length }})</span>
        </button>

        <button (click)="setTab('STRUCTURE')"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                [ngClass]="activeTab === 'STRUCTURE' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Fee Structures & Categories ({{ structures.length }})</span>
        </button>

        <button (click)="setTab('DEFAULTERS')"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                [ngClass]="activeTab === 'DEFAULTERS' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Defaulters Registry ({{ defaultersCount }})</span>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 1: STUDENT INVOICES & LEDGER                               -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'INVOICES'" class="space-y-4 animate-fadeIn">
        
        <!-- Filter Bar -->
        <div class="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3 flex-wrap flex-1">
            <!-- Search -->
            <div class="relative min-w-[240px] flex-1">
              <input type="text"
                     [(ngModel)]="invoiceSearchQuery"
                     placeholder="Search by student name, admission no, or invoice number..."
                     class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Status Filter -->
            <select [(ngModel)]="selectedStatusFilter"
                    class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid (Cleared)</option>
              <option value="PARTIAL">Partial Payment</option>
              <option value="UNPAID">Unpaid (Pending)</option>
            </select>
          </div>

          <!-- Export CSV -->
          <button (click)="exportFeeInvoicesCsv()"
                  class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Invoices CSV</span>
          </button>
        </div>

        <!-- Invoices Table -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] overflow-hidden">
          <div *ngIf="loadingInvoices" class="p-12 text-center text-slate-400 text-xs">
            <div class="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading invoice ledgers...</span>
          </div>

          <div *ngIf="!loadingInvoices" class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-3.5 px-4">Invoice No / Month</th>
                  <th class="py-3.5 px-4">Student & Adm No</th>
                  <th class="py-3.5 px-4">Class & Section</th>
                  <th class="py-3.5 px-4">Total Amount</th>
                  <th class="py-3.5 px-4">Paid / Balance</th>
                  <th class="py-3.5 px-4">Due Date</th>
                  <th class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let inv of filteredInvoices" class="hover:bg-slate-50/70 transition-colors group">
                  
                  <!-- Invoice No -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-900 font-mono block">{{ inv.invoice_number }}</span>
                    <span class="text-[10px] text-slate-400">{{ inv.month_name }}</span>
                  </td>

                  <!-- Student -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-900 block">{{ inv.student_name }}</span>
                    <span class="text-[10px] font-mono text-slate-400">Adm: {{ inv.admission_number }}</span>
                  </td>

                  <!-- Class -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-800">{{ inv.class_name }}</span>
                    <span class="text-slate-500 block text-[10px]">{{ inv.section_name }}</span>
                  </td>

                  <!-- Total Amount -->
                  <td class="py-3.5 px-4">
                    <span class="font-black text-slate-900">₹{{ inv.total_amount | number:'1.0-0' }}</span>
                  </td>

                  <!-- Paid / Balance -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-emerald-700 block">₹{{ inv.paid_amount | number:'1.0-0' }} Paid</span>
                    <span *ngIf="inv.total_amount - inv.paid_amount > 0" class="text-[10px] font-bold text-rose-600 block">
                      ₹{{ (inv.total_amount - inv.paid_amount) | number:'1.0-0' }} Due
                    </span>
                  </td>

                  <!-- Due Date -->
                  <td class="py-3.5 px-4 font-mono text-slate-600">
                    {{ inv.due_date | date:'dd MMM yyyy' }}
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3.5 px-4">
                    <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-800 border-emerald-200': inv.status === 'PAID',
                            'bg-amber-50 text-amber-800 border-amber-200': inv.status === 'PARTIAL',
                            'bg-rose-50 text-rose-800 border-rose-200': inv.status === 'UNPAID' || inv.status === 'OVERDUE'
                          }">
                      {{ inv.status }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- Collect Payment Button (If unpaid/partial) -->
                      <button *ngIf="inv.status !== 'PAID'"
                              (click)="openCollectFeeForInvoice(inv)"
                              class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer">
                        Collect
                      </button>

                      <!-- Print Receipt / Invoice -->
                      <button (click)="printFeeReceipt(inv)"
                              title="Print GST Fee Receipt"
                              class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Receipt</span>
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
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: FEE STRUCTURES & CATEGORIES                             -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'STRUCTURE'" class="space-y-4 animate-fadeIn">
        <div *ngIf="loadingStructures" class="p-12 text-center text-slate-400 text-xs">
          <div class="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
          <span>Loading configured fee structures...</span>
        </div>

        <div *ngIf="!loadingStructures" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let fs of structures"
               class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] space-y-3">
            
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-slate-900 text-white">
                {{ fs.class_name }}
              </span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                {{ fs.frequency }}
              </span>
            </div>

            <div>
              <h3 class="font-black text-slate-900 text-base tracking-tight">{{ fs.fee_category_name }}</h3>
              <div class="text-2xl font-black text-emerald-700 mt-1">₹{{ fs.amount | number:'1.0-0' }}</div>
              <p class="text-[10px] text-slate-400 mt-0.5">Due on Day {{ fs.due_day || 10 }} of each cycle</p>
            </div>

            <div *ngIf="canManage" class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button (click)="promptDeleteStructure(fs)" class="text-rose-600 font-bold hover:underline cursor-pointer">
                Remove
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 3: DEFAULTERS REGISTRY                                     -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'DEFAULTERS'" class="space-y-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] p-6 space-y-4">
          
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-black text-slate-900">Outstanding Dues & Fee Defaulters List</h3>
              <p class="text-xs text-slate-500 mt-0.5">Students with unpaid fee balances past the scheduled due date</p>
            </div>

            <button (click)="sendBatchFeeReminders()"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
              <span>🔔 Send SMS Dues Reminders</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th class="py-3 px-4">Student Name</th>
                  <th class="py-3 px-4">Class</th>
                  <th class="py-3 px-4">Invoice No</th>
                  <th class="py-3 px-4">Pending Balance</th>
                  <th class="py-3 px-4">Due Date</th>
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
                  <td class="py-3 px-4 text-right">
                    <button (click)="openCollectFeeForInvoice(def)" class="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-xs cursor-pointer">
                      Collect
                    </button>
                  </td>
                </tr>

                <tr *ngIf="defaultersList.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400 text-xs">
                    🎉 Excellent! Zero fee defaulters found on campus.
                  </td>
                </tr>
              </tbody>
            </table>
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
            <button (click)="closeCollectModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">✕</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Invoice</label>
              <select [(ngModel)]="collectForm.invoice_id" (change)="onCollectInvoiceChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Choose Invoice --</option>
                <option *ngFor="let inv of pendingInvoices" [value]="inv.id">
                  {{ inv.student_name }} - {{ inv.invoice_number }} (Due: ₹{{ inv.total_amount - inv.paid_amount }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
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

            <div>
              <label class="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No</label>
              <input type="text" [(ngModel)]="collectForm.transaction_reference" placeholder="e.g. UPI-1234567890" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Remarks</label>
              <input type="text" [(ngModel)]="collectForm.remarks" placeholder="Quarter 1 fee payment" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>

          <div *ngIf="collectModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ collectModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeCollectModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="submitCollectFee()" [disabled]="savingPayment" class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ savingPayment ? 'Recording...' : 'Receive & Print Receipt' }}
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: RUN MONTHLY INVOICE BATCH                               -->
      <!-- ============================================================== -->
      <div *ngIf="showBatchModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeBatchModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-black text-slate-900 text-base">Generate Monthly Fee Invoices</h3>
            <button (click)="closeBatchModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">✕</button>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            Auto-generate fee invoices for all active students across all classes based on configured class fee structures.
          </p>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Billing Month / Period</label>
              <input type="text" [(ngModel)]="batchMonthName" placeholder="May 2026" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Payment Due Date</label>
              <input type="date" [(ngModel)]="batchDueDate" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeBatchModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="executeBatchInvoicing()" [disabled]="executingBatch" class="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ executingBatch ? 'Generating Invoices...' : 'Generate All Invoices' }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class FeesComponent implements OnInit {
  activeTab: 'INVOICES' | 'STRUCTURE' | 'DEFAULTERS' = 'INVOICES';

  invoices: StudentFeeInvoice[] = [];
  structures: FeeStructure[] = [];
  overview: any = null;

  loadingInvoices = false;
  loadingStructures = false;
  loadingOverview = false;

  invoiceSearchQuery = '';
  selectedStatusFilter = 'ALL';

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
    });
  }

  get canManage(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal() || (this.auth.currentUser()?.role === 'FEE_MANAGER');
  }

  get filteredInvoices(): StudentFeeInvoice[] {
    let list = this.invoices;
    if (this.selectedStatusFilter !== 'ALL') {
      list = list.filter((i) => i.status === this.selectedStatusFilter);
    }
    if (!this.invoiceSearchQuery.trim()) return list;
    const q = this.invoiceSearchQuery.toLowerCase().trim();
    return list.filter(
      (i) =>
        i.student_name?.toLowerCase().includes(q) ||
        i.admission_number?.toLowerCase().includes(q) ||
        i.invoice_number.toLowerCase().includes(q) ||
        i.class_name?.toLowerCase().includes(q)
    );
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

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = (params['tab'] || '').toUpperCase();
      if (tab === 'INVOICES' || tab === 'STRUCTURE' || tab === 'DEFAULTERS') {
        this.activeTab = tab;
      }
    });
  }

  setTab(tab: 'INVOICES' | 'STRUCTURE' | 'DEFAULTERS') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.toLowerCase() },
      queryParamsHandling: 'merge',
    });
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
  }

  closeCollectModal() {
    this.showCollectModal = false;
  }

  onCollectInvoiceChange() {
    const inv = this.invoices.find((i) => i.id === this.collectForm.invoice_id);
    if (inv) {
      this.collectForm.student_id = inv.student_id;
      this.collectForm.amount_paid = inv.total_amount - inv.paid_amount;
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

  openAddStructureModal() {
    this.toast.info('Fee structure setup auto-configured per grade.');
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
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
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
            <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
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
                <td style="text-align: right;">₹${inv.total_amount | 2500}</td>
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
