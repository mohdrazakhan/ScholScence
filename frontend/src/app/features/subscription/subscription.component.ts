import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import {
  SubscriptionDetailsResponse,
  MonthlyCalculationResponse,
  WalletTransaction,
  StudentBillingBreakdownItem,
} from '../../core/models';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
              SaaS Billing & License
            </span>
            <span class="text-xs text-slate-300">•</span>
            <span class="text-xs font-bold text-slate-600">Institutional School Wallet</span>
          </div>

          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>SaaS Subscription & School Wallet</span>
            <span *ngIf="subscription?.status === 'ACTIVE'" class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Active License
            </span>
          </h1>

          <p class="text-xs text-slate-500 mt-0.5">
            Manage your campus per-student software subscription, view live student count billing, and top up your institutional prepaid/postpaid wallet.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Refresh Data -->
          <button (click)="loadAllData()" [disabled]="loading"
                  class="p-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer">
            <svg class="w-4 h-4" [class.animate-spin]="loading" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <!-- Run Billing Cycle (Simulate / Deduct) -->
          <button *ngIf="canManage" (click)="executeMonthlyBilling()" [disabled]="executingBilling || (calcData?.total_students === 0)"
                  title="Deduct monthly subscription fee from wallet (allows negative balance)"
                  class="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-2xl border border-indigo-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{{ executingBilling ? 'Processing...' : 'Run Monthly Billing' }}</span>
          </button>

          <!-- Top-Up Wallet Button -->
          <button *ngIf="canManage" (click)="openTopUpModal()"
                  class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-emerald-600 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Top Up / Load Wallet</span>
          </button>
        </div>
      </div>

      <!-- Negative Balance / Arrears Warning Alert (if balance < 0) -->
      <div *ngIf="wallet && wallet.balance < 0"
           class="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-sm shrink-0">
            ⚠️
          </div>
          <div>
            <div class="text-xs font-black">
              POSTPAID CREDIT ARREARS: Outstanding Balance of ₹{{ Math.abs(wallet.balance) | number:'1.2-2' }}
            </div>
            <p class="text-[11px] text-rose-700 mt-0.5">
              Your software operations remain fully functional under your postpaid credit allowance. Please top up your wallet to settle outstanding monthly dues.
            </p>
          </div>
        </div>
        <button (click)="openTopUpModal(Math.abs(wallet.balance))"
                class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 shadow-sm">
          Pay Arrears Now
        </button>
      </div>

      <!-- Financial Metric Cards (Claymorphic) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- CARD 1: WALLET BALANCE -->
        <div class="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[6px_6px_16px_#e2e8f0,-6px_-6px_16px_#ffffff] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Campus Wallet Balance</span>
            <span class="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold"
                  [ngClass]="(wallet?.balance || 0) < 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'">
              💳
            </span>
          </div>
          <div>
            <div class="text-2xl font-black tracking-tight"
                 [ngClass]="(wallet?.balance || 0) < 0 ? 'text-rose-600' : 'text-slate-900'">
              ₹{{ (wallet?.balance || 0) | number:'1.2-2' }}
            </div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px]">
              <span *ngIf="(wallet?.balance || 0) >= 0" class="text-emerald-700 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active & Funded
              </span>
              <span *ngIf="(wallet?.balance || 0) < 0" class="text-rose-700 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Overdue / Negative
              </span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Limit: ₹5,000 Credit</span>
            <button (click)="openTopUpModal()" class="text-emerald-700 font-bold hover:underline cursor-pointer">
              + Recharge
            </button>
          </div>
        </div>

        <!-- CARD 2: ACTIVE ENROLLED STUDENTS -->
        <div class="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[6px_6px_16px_#e2e8f0,-6px_-6px_16px_#ffffff] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Billable Students</span>
            <span class="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-xs font-bold">
              👥
            </span>
          </div>
          <div>
            <div class="text-2xl font-black text-slate-900 tracking-tight">
              {{ calcData?.total_students ?? stats?.active_students ?? 0 }}
            </div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
              <span>Auto-synced from student roster</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Roster Headcount</span>
            <span class="font-bold text-indigo-600">Live Active</span>
          </div>
        </div>

        <!-- CARD 3: CONTRACTED PER-STUDENT RATE -->
        <div class="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[6px_6px_16px_#e2e8f0,-6px_-6px_16px_#ffffff] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Per-Student Rate</span>
            <span class="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xs font-bold">
              🏷️
            </span>
          </div>
          <div>
            <div class="text-2xl font-black text-slate-900 tracking-tight">
              ₹{{ subscription?.per_student_fee || 20 | number:'1.2-2' }}
              <span class="text-xs font-bold text-slate-400">/ student / mo</span>
            </div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
              <span>Configured at onboarding</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Cycle: Monthly</span>
            <span class="font-bold text-slate-600">{{ subscription?.currency || 'INR' }}</span>
          </div>
        </div>

        <!-- CARD 4: ESTIMATED MONTHLY COST -->
        <div class="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-[6px_6px_16px_#e2e8f0,-6px_-6px_16px_#ffffff] space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Monthly Fee</span>
            <span class="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-xs font-bold">
              📅
            </span>
          </div>
          <div>
            <div class="text-2xl font-black text-indigo-700 tracking-tight">
              ₹{{ calcData?.total_calculated_fee ?? stats?.estimated_monthly_fee ?? 0 | number:'1.2-2' }}
            </div>
            <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
              <span>{{ calcData?.total_students || 0 }} Students × ₹{{ subscription?.per_student_fee || 20 }}</span>
            </div>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Next Billing: {{ subscription?.next_billing_date | date:'mediumDate' }}</span>
            <span class="font-bold text-purple-700">Auto-Debit</span>
          </div>
        </div>

      </div>

      <!-- Main Tabs: 1. Student Calculation Breakdown | 2. Wallet Ledger & Transactions -->
      <div class="bg-white rounded-3xl border border-slate-200/90 shadow-[6px_6px_16px_#e2e8f0,-6px_-6px_16px_#ffffff] overflow-hidden">
        
        <!-- Tab Headers -->
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-[#fbfcfe]">
          <div class="flex items-center gap-2">
            <button (click)="activeTab = 'CALCULATION'"
                    [class.bg-slate-900]="activeTab === 'CALCULATION'"
                    [class.text-white]="activeTab === 'CALCULATION'"
                    [class.shadow-xs]="activeTab === 'CALCULATION'"
                    [class.bg-white]="activeTab !== 'CALCULATION'"
                    [class.text-slate-600]="activeTab !== 'CALCULATION'"
                    class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200/80 transition-all cursor-pointer flex items-center gap-2">
              <span>🧮 Live Calculation & Student Roster</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black"
                    [ngClass]="activeTab === 'CALCULATION' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'">
                {{ calcData?.total_students || 0 }}
              </span>
            </button>

            <button (click)="activeTab = 'LEDGER'"
                    [class.bg-slate-900]="activeTab === 'LEDGER'"
                    [class.text-white]="activeTab === 'LEDGER'"
                    [class.shadow-xs]="activeTab === 'LEDGER'"
                    [class.bg-white]="activeTab !== 'LEDGER'"
                    [class.text-slate-600]="activeTab !== 'LEDGER'"
                    class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200/80 transition-all cursor-pointer flex items-center gap-2">
              <span>📜 Wallet Statements & Ledger</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black"
                    [ngClass]="activeTab === 'LEDGER' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'">
                {{ transactions.length }}
              </span>
            </button>
          </div>

          <!-- Tab Search / Export -->
          <div class="flex items-center gap-2">
            <input type="text" [(ngModel)]="searchQuery" placeholder="Filter records..."
                   class="px-3.5 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-800 shadow-inner w-48 sm:w-60" />
            <button (click)="exportActiveTabCsv()"
                    class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <!-- TAB 1 CONTENT: LIVE CALCULATION & PRORATION BREAKDOWN -->
        <div *ngIf="activeTab === 'CALCULATION'" class="p-5 space-y-4">
          
          <!-- Proration Policy Info Box -->
          <div class="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2 text-xs">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2 font-black text-indigo-950">
                <span>📋 Automated Billing & Proration Calculation Engine:</span>
              </div>
              <span class="text-[11px] font-bold text-indigo-700">
                Cycle: <strong>{{ calcData?.cycle_month || 'Current Month' }}</strong>
              </span>
            </div>
            <ul class="text-[11px] text-indigo-900 space-y-1 list-disc pl-4 font-medium leading-relaxed">
              <li><strong>Standard Active Students:</strong> Enrolled on or before the 1st of the month are charged the full monthly contracted fee of <strong>₹{{ subscription?.per_student_fee || 20 }}.00</strong>.</li>
              <li><strong>Mid-Month Enrollments (> 7 days active):</strong> Charged full monthly rate.</li>
              <li><strong>Late Enrollments (< 7 days active):</strong> Discounted with pro-rata daily charge so schools never overpay for newly admitted students.</li>
            </ul>
          </div>

          <!-- Breakdown Table (Desktop) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700">
              <thead class="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-y border-slate-100">
                <tr>
                  <th class="py-3 px-4">#</th>
                  <th class="py-3 px-4">Student Name & Admission</th>
                  <th class="py-3 px-4">Class & Section</th>
                  <th class="py-3 px-4">Enrollment Date</th>
                  <th class="py-3 px-4">Billing Rule / Note</th>
                  <th class="py-3 px-4 text-right">Calculated Fee</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let st of filteredBreakdown; let i = index" class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">{{ i + 1 }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900">{{ st.student_name }}</div>
                    <div class="text-[10px] font-mono text-slate-400">{{ st.admission_number }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {{ st.class_name }} - {{ st.section_name }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {{ st.enrollment_date | date:'mediumDate' }}
                  </td>
                  <td class="py-3 px-4">
                    <span class="text-[11px] font-semibold"
                          [ngClass]="st.billing_note.includes('Prorated') ? 'text-amber-700 font-bold' : 'text-slate-600'">
                      {{ st.billing_note }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                    ₹{{ st.student_fee | number:'1.2-2' }}
                  </td>
                </tr>

                <tr *ngIf="filteredBreakdown.length === 0">
                  <td colspan="6" class="py-8 text-center text-slate-400 italic">
                    No active students enrolled in this school yet. Add students under "Classes & Student Roster" to calculate billing.
                  </td>
                </tr>
              </tbody>
              <tfoot *ngIf="filteredBreakdown.length > 0" class="bg-slate-50 font-black text-xs border-t-2 border-slate-200">
                <tr>
                  <td colspan="5" class="py-3 px-4 text-right uppercase text-slate-600">Total Calculated Monthly SaaS Invoicing:</td>
                  <td class="py-3 px-4 text-right text-indigo-700 text-base font-black font-mono">
                    ₹{{ calcData?.total_calculated_fee || 0 | number:'1.2-2' }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Mobile Cards for Breakdown -->
          <div class="block md:hidden space-y-2.5">
            <div *ngFor="let st of filteredBreakdown"
                 class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-bold text-slate-900 text-xs">{{ st.student_name }}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{{ st.admission_number }} • {{ st.class_name }}-{{ st.section_name }}</div>
                </div>
                <div class="text-right">
                  <div class="font-black text-indigo-700 text-sm">₹{{ st.student_fee | number:'1.2-2' }}</div>
                  <div class="text-[9px] text-slate-400 uppercase font-bold">This Month</div>
                </div>
              </div>
              <div class="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span>Enrolled: {{ st.enrollment_date | date:'shortDate' }}</span>
                <span class="font-bold text-slate-700">{{ st.billing_note }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- TAB 2 CONTENT: WALLET LEDGER & TRANSACTION STATEMENTS -->
        <div *ngIf="activeTab === 'LEDGER'" class="p-5 space-y-4">
          
          <!-- Desktop Ledger Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700">
              <thead class="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-y border-slate-100">
                <tr>
                  <th class="py-3 px-4">Date & Time</th>
                  <th class="py-3 px-4">Reference ID</th>
                  <th class="py-3 px-4">Type</th>
                  <th class="py-3 px-4">Category & Description</th>
                  <th class="py-3 px-4 text-center">Students</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                  <th class="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let t of filteredTransactions" class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-3 px-4 text-slate-500 text-[11px]">
                    {{ t.created_at | date:'medium' }}
                  </td>
                  <td class="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                    {{ t.reference_id }}
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                          [ngClass]="t.transaction_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                      {{ t.transaction_type }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900">{{ t.category }}</div>
                    <div class="text-[11px] text-slate-500 truncate max-w-xs">{{ t.description || 'System Ledger Entry' }}</div>
                  </td>
                  <td class="py-3 px-4 text-center font-bold text-slate-700">
                    {{ t.student_count || '-' }}
                  </td>
                  <td class="py-3 px-4 text-right font-black font-mono text-sm"
                      [ngClass]="t.amount > 0 ? 'text-emerald-700' : 'text-rose-600'">
                    {{ t.amount > 0 ? '+' : '' }}₹{{ t.amount | number:'1.2-2' }}
                  </td>
                  <td class="py-3 px-4 text-right font-black font-mono text-xs"
                      [ngClass]="t.balance_after < 0 ? 'text-rose-600' : 'text-slate-800'">
                    ₹{{ t.balance_after | number:'1.2-2' }}
                  </td>
                </tr>

                <tr *ngIf="filteredTransactions.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-400 italic">
                    No wallet transactions recorded yet. Click "+ Top Up / Load Wallet" to deposit funds.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards for Transactions -->
          <div class="block md:hidden space-y-2.5">
            <div *ngFor="let t of filteredTransactions"
                 class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase"
                          [ngClass]="t.transaction_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">
                      {{ t.transaction_type }}
                    </span>
                    <span class="font-mono text-xs font-bold text-slate-900">{{ t.reference_id }}</span>
                  </div>
                  <div class="text-[11px] text-slate-600 mt-1">{{ t.description }}</div>
                </div>
                <div class="text-right font-mono">
                  <div class="font-black text-sm"
                       [ngClass]="t.amount > 0 ? 'text-emerald-700' : 'text-rose-600'">
                    {{ t.amount > 0 ? '+' : '' }}₹{{ t.amount | number:'1.2-2' }}
                  </div>
                  <div class="text-[10px] text-slate-400">Bal: ₹{{ t.balance_after | number:'1.2-2' }}</div>
                </div>
              </div>
              <div class="text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60">
                {{ t.created_at | date:'medium' }}
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- ============================================================== -->
      <!-- MODAL: LOAD FUNDS / TOP UP PREPAID & POSTPAID WALLET            -->
      <!-- ============================================================== -->
      <div *ngIf="showTopUpModal" class="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-5 animate-scaleUp">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-lg shadow-xs">
                💳
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Load Funds into School Wallet</h3>
                <p class="text-xs text-slate-500">Deposit balance for automated per-student monthly billing deductions.</p>
              </div>
            </div>
            <button (click)="showTopUpModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Current Balance Display -->
          <div class="p-3.5 rounded-2xl border flex items-center justify-between text-xs"
               [ngClass]="(wallet?.balance || 0) < 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-800'">
            <div>
              <div class="text-[10px] font-bold uppercase opacity-75">Current Wallet Balance</div>
              <div class="text-lg font-black mt-0.5">₹{{ (wallet?.balance || 0) | number:'1.2-2' }}</div>
            </div>
            <span *ngIf="(wallet?.balance || 0) < 0" class="px-2.5 py-1 rounded-xl bg-rose-200 text-rose-900 font-black text-[10px] uppercase">
              Arrears Due
            </span>
          </div>

          <!-- Quick Amount Selector -->
          <div class="space-y-2 text-xs">
            <label class="block font-bold text-slate-700">Select Top-Up Amount</label>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button type="button" *ngFor="let amt of [500, 1000, 2500, 5000, 10000]"
                      (click)="topUpAmount = amt"
                      [class.bg-slate-900]="topUpAmount === amt"
                      [class.text-white]="topUpAmount === amt"
                      [class.bg-slate-100]="topUpAmount !== amt"
                      [class.text-slate-700]="topUpAmount !== amt"
                      class="py-2 rounded-xl font-black text-xs transition-all cursor-pointer">
                ₹{{ amt }}
              </button>
            </div>
          </div>

          <!-- Custom Amount Input -->
          <div class="space-y-1 text-xs">
            <label class="block font-bold text-slate-700">Or Enter Custom Amount (₹) *</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input type="number" [(ngModel)]="topUpAmount" min="1" step="100" placeholder="e.g. 3000"
                     class="w-full pl-8 pr-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>
          </div>

          <!-- Payment Mode -->
          <div class="space-y-1 text-xs">
            <label class="block font-bold text-slate-700">Payment Simulation / Settlement Mode</label>
            <select [(ngModel)]="topUpMethod"
                    class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
              <option value="SIMULATED_INSTANT">⚡ Instant Wallet Direct Deposit (Demo/Live)</option>
              <option value="UPI_BANK_TRANSFER">🏦 NetBanking / UPI Transfer Settlement</option>
              <option value="OFFLINE_CHEQUE">📄 Institutional Cheque / DD Verified</option>
            </select>
          </div>

          <!-- Notes / Reference -->
          <div class="space-y-1 text-xs">
            <label class="block font-bold text-slate-700">Transaction Remarks / Notes</label>
            <input type="text" [(ngModel)]="topUpNotes" placeholder="e.g. Term 1 Student Licensing Advance"
                   class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showTopUpModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="submitTopUp()" [disabled]="submittingTopUp || topUpAmount <= 0"
                    class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
              <span *ngIf="!submittingTopUp">Load ₹{{ topUpAmount | number:'1.2-2' }} to Wallet</span>
              <span *ngIf="submittingTopUp">Processing Deposit...</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class SubscriptionComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exportService = inject(ExportService);

  Math = Math;

  loading = false;
  activeTab: 'CALCULATION' | 'LEDGER' = 'CALCULATION';
  searchQuery = '';

  subscription: any = null;
  wallet: any = null;
  stats: any = null;
  transactions: WalletTransaction[] = [];
  calcData: MonthlyCalculationResponse | null = null;

  showTopUpModal = false;
  topUpAmount = 1000;
  topUpMethod = 'SIMULATED_INSTANT';
  topUpNotes = '';
  submittingTopUp = false;

  executingBilling = false;

  get canManage(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin();
  }

  get filteredBreakdown(): StudentBillingBreakdownItem[] {
    const list = this.calcData?.students_breakdown || [];
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase().trim();
    return list.filter(
      (st) =>
        st.student_name.toLowerCase().includes(q) ||
        st.admission_number.toLowerCase().includes(q) ||
        (st.class_name && st.class_name.toLowerCase().includes(q)) ||
        (st.billing_note && st.billing_note.toLowerCase().includes(q))
    );
  }

  get filteredTransactions(): WalletTransaction[] {
    if (!this.searchQuery.trim()) return this.transactions;
    const q = this.searchQuery.toLowerCase().trim();
    return this.transactions.filter(
      (t) =>
        t.reference_id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.transaction_type.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.api.get<SubscriptionDetailsResponse>('subscription/overview').subscribe({
      next: (res: any) => {
        this.subscription = res.subscription;
        this.wallet = res.wallet;
        this.stats = res.stats;
        this.transactions = res.transactions || [];
        this.loadCalculation();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Failed to load subscription details');
      },
    });
  }

  loadCalculation() {
    this.api.get<MonthlyCalculationResponse>('subscription/calculate').subscribe({
      next: (calc: any) => {
        this.calcData = calc;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.warn('Calculation load error', err);
      },
    });
  }

  openTopUpModal(suggestedAmount?: number) {
    if (suggestedAmount && suggestedAmount > 0) {
      this.topUpAmount = Math.ceil(suggestedAmount);
    } else {
      this.topUpAmount = 1000;
    }
    this.topUpNotes = 'School Admin Direct Top-Up';
    this.showTopUpModal = true;
  }

  submitTopUp() {
    if (this.topUpAmount <= 0) {
      this.toast.error('Top up amount must be greater than zero.');
      return;
    }
    this.submittingTopUp = true;

    this.api.post('subscription/wallet/top-up', {
      amount: this.topUpAmount,
      method: this.topUpMethod,
      notes: this.topUpNotes || 'School Admin Wallet Top-Up',
    }).subscribe({
      next: (res: any) => {
        this.submittingTopUp = false;
        this.showTopUpModal = false;
        this.toast.success(`Loaded ₹${this.topUpAmount} into school wallet! Ref: ${res.reference_id}`);
        this.loadAllData();
      },
      error: (err) => {
        this.submittingTopUp = false;
        this.toast.error(err.error?.message || 'Failed to top up wallet');
      },
    });
  }

  executeMonthlyBilling() {
    if (!confirm('Run monthly billing cycle now? This will debit the calculated subscription fee from the school wallet.')) {
      return;
    }

    this.executingBilling = true;
    this.api.post('subscription/billing/run', {}).subscribe({
      next: (res: any) => {
        this.executingBilling = false;
        this.toast.success(`Monthly billing executed! Debited ₹${res.amount_debited || 0} for ${res.student_count || 0} students.`);
        this.loadAllData();
      },
      error: (err) => {
        this.executingBilling = false;
        this.toast.error(err.error?.message || 'Failed to execute monthly billing');
      },
    });
  }

  exportActiveTabCsv() {
    if (this.activeTab === 'CALCULATION') {
      const rows = this.filteredBreakdown.map((st) => ({
        admission_number: st.admission_number,
        student_name: st.student_name,
        class_section: `${st.class_name} - ${st.section_name}`,
        enrollment_date: st.enrollment_date,
        billing_rule: st.billing_note,
        fee: st.student_fee,
      }));
      this.exportService.exportToCsv('Student_Billing_Breakdown', rows, [
        { key: 'admission_number', label: 'Admission No' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'class_section', label: 'Class & Section' },
        { key: 'enrollment_date', label: 'Enrollment Date' },
        { key: 'billing_rule', label: 'Billing Note' },
        { key: 'fee', label: 'Calculated Fee (INR)' },
      ]);
    } else {
      const rows = this.filteredTransactions.map((t) => ({
        created_at: t.created_at,
        reference_id: t.reference_id,
        type: t.transaction_type,
        category: t.category,
        description: t.description,
        students: t.student_count || 0,
        amount: t.amount,
        balance_after: t.balance_after,
      }));
      this.exportService.exportToCsv('Wallet_Ledger_Statements', rows, [
        { key: 'created_at', label: 'Date & Time' },
        { key: 'reference_id', label: 'Reference ID' },
        { key: 'type', label: 'Type' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'students', label: 'Student Count' },
        { key: 'amount', label: 'Amount (INR)' },
        { key: 'balance_after', label: 'Balance After (INR)' },
      ]);
    }
  }
}
