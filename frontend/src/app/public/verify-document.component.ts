import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DocumentService } from '../core/services/document.service';
import { DocumentVerificationResult } from '../core/models';

@Component({
  selector: 'app-verify-document',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans antialiased">
      <!-- Top Brand Header -->
      <header class="border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 sm:px-8">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              🛡️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-black tracking-tight text-white">SchoolSense Vault</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Official Public Registry</span>
              </div>
              <p class="text-[11px] text-slate-400">Institutional Document & Certificate Authenticity Verification</p>
            </div>
          </div>
          <a routerLink="/" class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold">
            <span>Home</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
      </header>

      <!-- Main Body -->
      <main class="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col justify-center">
        <!-- Loading State -->
        <div *ngIf="loading" class="text-center py-20 space-y-4">
          <div class="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-sm text-slate-400 font-semibold tracking-wide">Validating digital certificate signature...</p>
        </div>

        <!-- Verified Document Success Card -->
        <div *ngIf="!loading && result?.verified && result?.document" class="space-y-6 animate-fadeIn">
          <!-- Status Banner -->
          <div [ngClass]="result?.document?.status === 'REVOKED'
               ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
               : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'"
               class="p-4 sm:p-5 rounded-3xl border flex items-center gap-4 shadow-xl">
            <div [ngClass]="result?.document?.status === 'REVOKED'
                 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                 : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'"
                 class="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 text-xl font-bold">
              {{ result?.document?.status === 'REVOKED' ? '✕' : '✓' }}
            </div>
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-base sm:text-lg font-black tracking-tight text-white">
                  {{ result?.document?.status === 'REVOKED' ? 'Document Revoked by Institution' : 'Authentic & Verified Document' }}
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase"
                      [ngClass]="result?.document?.status === 'REVOKED' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'">
                  {{ result?.document?.status === 'REVOKED' ? 'Revoked' : 'Official Record Valid' }}
                </span>
              </div>
              <p class="text-xs text-slate-300 mt-1">
                {{ result?.document?.status === 'REVOKED'
                  ? 'This document was cancelled/revoked by the issuing school authorities. It is no longer legally valid.'
                  : 'This record was officially generated, digitally signed and sealed by the verified educational institution below.' }}
              </p>
            </div>
          </div>

          <!-- Document Certificate Container -->
          <div class="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 relative overflow-hidden">
            <!-- Security Watermark pattern -->
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-indigo-50/60 rounded-full blur-3xl pointer-events-none"></div>

            <!-- School Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 font-bold text-xl text-indigo-700 shadow-sm overflow-hidden">
                  <img *ngIf="result?.school?.logoUrl" [src]="result?.school?.logoUrl" class="w-full h-full object-contain" alt="Logo">
                  <span *ngIf="!result?.school?.logoUrl">🏛️</span>
                </div>
                <div>
                  <h2 class="text-lg sm:text-xl font-black text-slate-950 tracking-tight">{{ result?.school?.name }}</h2>
                  <p class="text-xs text-slate-500">
                    {{ result?.school?.city }}, {{ result?.school?.state }} • {{ result?.school?.board || 'Affiliated' }}
                    <span *ngIf="result?.school?.affiliationNumber"> (Affiliation: {{ result?.school?.affiliationNumber }})</span>
                  </p>
                  <p class="text-[11px] text-indigo-600 font-semibold mt-0.5 font-mono">School Code: {{ result?.school?.code }}</p>
                </div>
              </div>

              <!-- Certificate Tag & QR Verification Seal -->
              <div class="text-left sm:text-right shrink-0">
                <span class="inline-block px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-mono font-bold tracking-wider shadow-xs">
                  {{ result?.document?.serialNumber }}
                </span>
                <p class="text-[11px] text-slate-400 mt-1 font-mono">Issued: {{ result?.document?.issueDate }}</p>
              </div>
            </div>

            <!-- Certificate Title -->
            <div class="text-center py-6 sm:py-8 border-b border-slate-100">
              <span class="text-[11px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Official Institutional Document</span>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                {{ result?.document?.title }}
              </h3>
            </div>

            <!-- Certificate Data Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-6 border-b border-slate-200 text-sm">
              <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Candidate / Recipient</span>
                <span class="text-base font-black text-slate-900">{{ result?.document?.recipientName }}</span>
              </div>

              <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Parent / Guardian</span>
                <span class="text-base font-bold text-slate-800">{{ result?.document?.guardianName || '—' }}</span>
              </div>

              <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Admission / Scholar No.</span>
                <span class="text-sm font-black font-mono text-slate-900">{{ result?.document?.admissionNumber || '—' }}</span>
              </div>

              <div class="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class & Section</span>
                <span class="text-sm font-black text-slate-900">
                  {{ result?.document?.className || '—' }} <span *ngIf="result?.document?.sectionName">- Sec {{ result?.document?.sectionName }}</span>
                  <span *ngIf="result?.document?.rollNumber" class="text-xs text-slate-500 font-mono ml-2">(Roll: #{{ result?.document?.rollNumber }})</span>
                </span>
              </div>
            </div>

            <!-- Remarks & Purpose -->
            <div *ngIf="result?.document?.remarks" class="py-5 border-b border-slate-200">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Institutional Endorsement & Remarks</span>
              <p class="text-xs text-slate-700 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/80 leading-relaxed font-medium">
                {{ result?.document?.remarks }}
              </p>
            </div>

            <!-- Revocation Notice if Revoked -->
            <div *ngIf="result?.document?.status === 'REVOKED' && result?.document?.revocationReason" class="py-4">
              <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
                <span class="font-bold block uppercase text-[10px] tracking-wider text-rose-600 mb-1">Reason for Revocation:</span>
                {{ result?.document?.revocationReason }}
              </div>
            </div>

            <!-- Seal & Signature Verification Footer -->
            <div class="pt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs text-slate-500">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span class="font-bold text-slate-800">Tamper-Proof Verification Hash:</span>
                </div>
                <p class="font-mono text-[11px] text-slate-400 break-all">{{ token }}</p>
                <p class="text-[11px] text-slate-400">Verified at: {{ currentTimestamp }}</p>
              </div>

              <div class="text-left sm:text-right">
                <div class="w-32 h-12 border-b-2 border-slate-300 mx-auto sm:ml-auto sm:mr-0 mb-1"></div>
                <span class="font-black text-slate-800 uppercase tracking-wider text-[11px] block">Principal / Registrar</span>
                <span class="text-[10px] text-slate-400">{{ result?.school?.name }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button (click)="printRecord()" class="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Print Official Verification Record</span>
            </button>

            <a routerLink="/login" class="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-semibold">
              <span>School Staff / Admin Portal</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

        <!-- Invalid Document Error State -->
        <div *ngIf="!loading && (!result?.verified || !result?.document)" class="bg-slate-950/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-5 shadow-2xl">
          <div class="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            ⚠️
          </div>
          <div>
            <h2 class="text-xl font-black text-white tracking-tight">Unverified or Invalid Certificate</h2>
            <p class="text-xs text-slate-400 mt-2 leading-relaxed">
              {{ result?.error || 'The certificate serial number or QR code provided could not be authenticated against the official institutional database.' }}
            </p>
          </div>
          <div class="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
            Token queried: {{ token }}
          </div>
          <p class="text-[11px] text-slate-500">
            If you believe this document is genuine, please contact the issuing school administration directly for manual record verification.
          </p>
          <a routerLink="/" class="inline-block px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors">
            Return to SchoolSense
          </a>
        </div>
      </main>

      <!-- Footer -->
      <footer class="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>© 2026 SchoolSense Campus OS. Encrypted Anti-Fraud QR Verification Protocol.</p>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @media print {
      body { background: white !important; color: black !important; }
      header, footer, button, a { display: none !important; }
    }
  `],
})
export class VerifyDocumentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private documentService = inject(DocumentService);

  loading = true;
  token = '';
  result: DocumentVerificationResult | null = null;
  currentTimestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      this.token = params.get('token') || '';
      if (!this.token) {
        this.route.queryParamMap.subscribe(async (qp) => {
          this.token = qp.get('token') || qp.get('serial') || '';
          await this.verify();
        });
      } else {
        await this.verify();
      }
    });
  }

  async verify() {
    this.loading = true;
    try {
      this.result = await this.documentService.verifyDocument(this.token);
    } catch (e: any) {
      this.result = {
        success: false,
        verified: false,
        error: e?.message || 'Verification service error',
      };
    } finally {
      this.loading = false;
    }
  }

  printRecord() {
    window.print();
  }
}
