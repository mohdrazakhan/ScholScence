import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  SchoolDocument,
  SchoolDocumentType,
  IssueDocumentRequest,
  StudentItem,
} from '../../core/models';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6 sm:space-y-8 animate-fadeIn pb-16">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Documents &amp; Certificates
              </h1>
              <p class="text-xs text-slate-500">
                Official registry of issued certificates, TCs, and bonafide documents with anti-fraud QR verification
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="openIssueModal()"
                  class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2 cursor-pointer group">
            <svg class="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/></svg>
            <span>Issue New Document</span>
          </button>
        </div>
      </div>

      <!-- Overview Metric Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Issued -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Documents</span>
          <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ documents.length }}</div>
          <span class="text-xs font-semibold text-indigo-600 mt-2 block">All issued records</span>
        </div>

        <!-- Valid Certificates -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Valid &amp; Active</span>
          <div class="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{{ activeCount }}</div>
          <span class="text-xs font-semibold text-emerald-600 mt-2 block">Legally verified</span>
        </div>

        <!-- Revoked Documents -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Revoked</span>
          <div class="text-2xl sm:text-3xl font-black text-slate-700 mt-1">{{ revokedCount }}</div>
          <span class="text-xs font-semibold text-rose-500 mt-2 block">Cancelled records</span>
        </div>

        <!-- QR Verification Ready -->
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">QR Security</span>
          <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">100%</div>
          <span class="text-xs font-semibold text-emerald-600 mt-2 block">Tamper-Proof Protected</span>
        </div>
      </div>

      <!-- Controls: Filters, Tabs & Search -->
      <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Type Filter Pills -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button *ngFor="let t of filterTypes"
                    (click)="selectedType = t.key; loadDocuments()"
                    [ngClass]="selectedType === t.key ? 'bg-indigo-600 text-white shadow-xs font-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'"
                    class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
              {{ t.label }}
            </button>
          </div>

          <!-- Search Box -->
          <div class="relative w-full md:w-72">
            <input type="text"
                   [(ngModel)]="searchQuery"
                   (input)="loadDocuments()"
                   placeholder="Search student, serial, or title..."
                   class="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Documents Table Registry -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-black text-slate-900 tracking-tight">Issued Documents Master Log</h2>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
              {{ filteredDocuments.length }} Records
            </span>
          </div>
          <span class="text-xs text-slate-400">Click any document to inspect certificate &amp; QR seal</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th class="py-3 px-4">Serial Number</th>
                <th class="py-3 px-4">Document Title</th>
                <th class="py-3 px-4">Candidate / Student</th>
                <th class="py-3 px-4">Class &amp; Section</th>
                <th class="py-3 px-4">Issue Date</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let doc of filteredDocuments" class="hover:bg-slate-50/80 transition-colors group">
                <!-- Serial Number -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-[11px]">
                      {{ doc.serialNumber }}
                    </span>
                    <button (click)="copyVerificationLink(doc)" title="Copy Public QR Link" class="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                    </button>
                  </div>
                </td>

                <!-- Title & Type -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-900">{{ doc.title }}</div>
                  <span class="text-[10px] text-slate-500 uppercase tracking-wide">{{ formatDocType(doc.documentType) }}</span>
                </td>

                <!-- Candidate -->
                <td class="py-3.5 px-4">
                  <div class="font-bold text-slate-900">{{ doc.recipientName }}</div>
                  <div class="text-[11px] text-slate-400 font-mono" *ngIf="doc.admissionNumber">Adm: {{ doc.admissionNumber }}</div>
                </td>

                <!-- Class -->
                <td class="py-3.5 px-4 text-slate-700">
                  <span *ngIf="doc.className">{{ doc.className }}<span *ngIf="doc.sectionName"> - {{ doc.sectionName }}</span></span>
                  <span *ngIf="!doc.className" class="text-slate-400">—</span>
                </td>

                <!-- Issue Date -->
                <td class="py-3.5 px-4 font-mono text-slate-600">
                  {{ doc.issueDate }}
                </td>

                <!-- Status -->
                <td class="py-3.5 px-4 text-center">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide"
                        [ngClass]="doc.status === 'REVOKED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'">
                    {{ doc.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="previewCertificate(doc)"
                            class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <span>View &amp; Print</span>
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>

                    <button *ngIf="doc.status !== 'REVOKED'"
                            (click)="promptRevoke(doc)"
                            title="Revoke Certificate"
                            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredDocuments.length === 0">
                <td colspan="7" class="py-12 text-center text-slate-400">
                  <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-xl mb-2">📄</div>
                  <p class="font-bold text-slate-600">No documents found matching your filter</p>
                  <p class="text-xs text-slate-400 mt-1">Issue your first certificate by clicking "+ Issue New Document"</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 1: ISSUE NEW DOCUMENT                                       -->
      <!-- ================================================================= -->
      <div *ngIf="showIssueModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Issue Official School Document</h3>
              <p class="text-xs text-slate-500">Auto-generates official serial number and encrypted QR verification</p>
            </div>
            <button (click)="showIssueModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <form (ngSubmit)="submitIssueForm()" class="space-y-4 text-xs font-medium">
            <!-- Document Type -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Document Type *</label>
              <select [(ngModel)]="issueForm.documentType" (change)="onDocTypeChange()" name="documentType" required
                      class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                <option value="BONAFIDE_CERTIFICATE">Bonafide Student Certificate</option>
                <option value="CHARACTER_CERTIFICATE">Character Certificate</option>
                <option value="FEE_NO_DUES">Fee Clearance &amp; No Dues Certificate</option>
                <option value="SPORTS_CERTIFICATE">Sports &amp; Extracurricular Achievement</option>
                <option value="CUSTOM">Custom Institutional Certificate</option>
              </select>
            </div>

            <!-- Student Picker / Auto-fill -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Enrolled Student (Auto-fills details)</label>
              <select [(ngModel)]="selectedStudentId" (change)="onStudentSelect()" name="studentPicker"
                      class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                <option value="">-- Choose from student roster or enter below --</option>
                <option *ngFor="let s of studentRoster" [value]="s.id">
                  {{ s.name }} ({{ s.className }} - {{ s.sectionName }}) • Adm: {{ s.admissionNumber }}
                </option>
              </select>
            </div>

            <!-- Recipient Name & Title -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Student / Recipient Name *</label>
                <input type="text" [(ngModel)]="issueForm.recipientName" name="recipientName" required
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Document Title *</label>
                <input type="text" [(ngModel)]="issueForm.title" name="title" required
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
            </div>

            <!-- Admission No & Roll No -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Admission Number</label>
                <input type="text" [(ngModel)]="issueForm.admissionNumber" name="admissionNumber"
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Parent / Guardian Name</label>
                <input type="text" [(ngModel)]="issueForm.guardianName" name="guardianName"
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
            </div>

            <!-- Class & Section -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class / Grade</label>
                <input type="text" [(ngModel)]="issueForm.className" name="className" placeholder="e.g. Class 10"
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Section</label>
                <input type="text" [(ngModel)]="issueForm.sectionName" name="sectionName" placeholder="e.g. A"
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Roll Number</label>
                <input type="text" [(ngModel)]="issueForm.rollNumber" name="rollNumber" placeholder="e.g. 14"
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
            </div>

            <!-- Issue Date & Serial Number -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Issue Date *</label>
                <input type="date" [(ngModel)]="issueForm.issueDate" name="issueDate" required
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Serial Number (Auto-assigned)</label>
                <input type="text" [(ngModel)]="issueForm.serialNumber" name="serialNumber"
                       class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 focus:outline-none">
              </div>
            </div>

            <!-- Endorsement Remarks -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Institutional Endorsement / Remarks</label>
              <textarea [(ngModel)]="issueForm.remarks" name="remarks" rows="2"
                        placeholder="e.g. Promoted to higher grade. Conduct exemplary. All dues cleared."
                        class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" (click)="showIssueModal = false" class="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button type="submit" [disabled]="submitting"
                      class="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                <span *ngIf="!submitting">Generate &amp; Issue Document</span>
                <span *ngIf="submitting">Generating QR Code...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- MODAL 2: OFFICIAL CERTIFICATE PREVIEW & PRINT VIEW                -->
      <!-- ================================================================= -->
      <div *ngIf="showPreviewModal && previewDoc" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
          <!-- Top Toolbar (Hidden during print) -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span class="text-xs font-bold text-slate-700 font-mono">{{ previewDoc.serialNumber }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="copyVerificationLink(previewDoc)" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                <span>Copy QR Link</span>
              </button>
              <button (click)="printCertificate()" class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                <span>Print Certificate</span>
              </button>
              <button (click)="showPreviewModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
            </div>
          </div>

          <!-- Printable Certificate Sheet (Styled like standard authentic Indian school certificate) -->
          <div class="border-4 border-double border-slate-900 p-6 sm:p-10 rounded-2xl relative bg-white text-slate-900 space-y-6">
            <!-- School Header -->
            <div class="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <h2 class="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950 font-serif">
                {{ schoolName }}
              </h2>
              <p class="text-xs text-slate-600 font-medium">
                {{ schoolAddress || 'Recognized & Affiliated Educational Institution' }} • Affiliation: CBSE-2130894
              </p>
              <p class="text-[11px] text-slate-500 font-mono">School Code: {{ schoolCode }}</p>
            </div>

            <!-- Serial & Date Header Line -->
            <div class="flex items-center justify-between text-xs font-mono font-bold pt-1">
              <div>Ref. Serial No.: <span class="text-slate-950 font-black">{{ previewDoc.serialNumber }}</span></div>
              <div>Date: <span class="text-slate-950 font-black">{{ previewDoc.issueDate }}</span></div>
            </div>

            <!-- Certificate Title -->
            <div class="text-center py-4">
              <h1 class="text-lg sm:text-2xl font-black tracking-widest uppercase border-b-2 border-slate-800 inline-block px-8 pb-1 font-serif">
                {{ previewDoc.title }}
              </h1>
            </div>

            <!-- Body Statement -->
            <div class="text-sm leading-relaxed text-slate-800 space-y-3 font-serif">
              <p>
                This is to certify that
                <span class="font-bold underline decoration-slate-400 underline-offset-4 px-1">{{ previewDoc.recipientName }}</span>,
                <span *ngIf="previewDoc.guardianName">Son / Daughter of <span class="font-bold underline decoration-slate-400 underline-offset-4 px-1">{{ previewDoc.guardianName }}</span>,</span>
                bearing Admission Number
                <span class="font-bold font-mono underline decoration-slate-400 underline-offset-4 px-1">{{ previewDoc.admissionNumber || '—' }}</span>
                <span *ngIf="previewDoc.rollNumber">and Roll No. <span class="font-bold font-mono underline decoration-slate-400 underline-offset-4 px-1">#{{ previewDoc.rollNumber }}</span></span>,
                is / was a bonafide student of this institution studying in
                <span class="font-bold underline decoration-slate-400 underline-offset-4 px-1">{{ previewDoc.className || 'Class 10' }} <span *ngIf="previewDoc.sectionName">Section {{ previewDoc.sectionName }}</span></span>.
              </p>

              <p *ngIf="previewDoc.remarks" class="italic text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-sans">
                <strong>Institutional Note / Endorsement:</strong> {{ previewDoc.remarks }}
              </p>

              <p class="text-xs text-slate-600 font-sans">
                To the best of our knowledge and according to school records, the candidate bears an exemplary moral character.
              </p>
            </div>

            <!-- Bottom Section: Live QR Code + Official Signatures -->
            <div class="pt-8 flex items-end justify-between gap-6 border-t border-slate-300">
              <!-- Live Anti-Fraud QR Code -->
              <div class="flex items-center gap-3">
                <div class="w-24 h-24 p-1 bg-white border border-slate-300 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                  <img *ngIf="qrDataUrl" [src]="qrDataUrl" class="w-full h-full object-contain" alt="Verification QR">
                  <span *ngIf="!qrDataUrl" class="text-[10px] text-slate-400">Loading QR...</span>
                </div>
                <div class="space-y-0.5">
                  <span class="text-[10px] font-black uppercase tracking-wider block text-slate-900 font-sans">Scan to Verify</span>
                  <p class="text-[9px] text-slate-500 max-w-[150px] leading-tight font-sans">
                    Scan with any smartphone camera to verify authenticity on the SchoolSense digital registry.
                  </p>
                  <span class="text-[9px] font-mono text-indigo-700 block font-semibold truncate max-w-[160px]">
                    {{ previewDoc.verificationToken }}
                  </span>
                </div>
              </div>

              <!-- Signatures & Seal -->
              <div class="text-right space-y-8">
                <div class="w-36 border-b-2 border-slate-800 ml-auto"></div>
                <div>
                  <span class="font-bold text-xs uppercase tracking-wider block text-slate-900">Principal / Authorized Signatory</span>
                  <span class="text-[10px] text-slate-500">{{ schoolName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.25s ease-out forwards;
    }
    @media print {
      body * { visibility: hidden; }
      .print\\:p-0, .print\\:p-0 * { visibility: visible; }
      .print\\:hidden { display: none !important; }
      .print\\:border-none { border: none !important; }
    }
  `],
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  documents: SchoolDocument[] = [];
  studentRoster: any[] = [];
  searchQuery = '';
  selectedType = 'ALL';
  selectedStudentId = '';
  submitting = false;

  showIssueModal = false;
  showPreviewModal = false;
  previewDoc: SchoolDocument | null = null;
  qrDataUrl = '';

  filterTypes = [
    { key: 'ALL', label: 'All Documents' },
    { key: 'TRANSFER_CERTIFICATE', label: 'Transfer Cert (TC)' },
    { key: 'BONAFIDE_CERTIFICATE', label: 'Bonafide' },
    { key: 'CHARACTER_CERTIFICATE', label: 'Character' },
    { key: 'FEE_NO_DUES', label: 'No Dues' },
    { key: 'SPORTS_CERTIFICATE', label: 'Sports & Arts' },
    { key: 'CUSTOM', label: 'Custom' },
  ];

  issueForm: IssueDocumentRequest = {
    documentType: 'TRANSFER_CERTIFICATE',
    title: 'Transfer Certificate (TC)',
    recipientName: '',
    admissionNumber: '',
    className: '',
    sectionName: '',
    rollNumber: '',
    guardianName: '',
    issueDate: new Date().toISOString().split('T')[0],
    serialNumber: '',
    remarks: '',
  };

  get schoolName(): string {
    return this.auth.currentUser()?.school?.name || 'Delhi Heritage Academy';
  }

  get schoolCode(): string {
    return this.auth.currentUser()?.school?.code || 'DHA';
  }

  get schoolAddress(): string {
    const s: any = this.auth.currentUser()?.school;
    return `${s?.city || 'New Delhi'}, ${s?.state || 'Delhi'}`;
  }

  get activeCount(): number {
    return this.documents.filter((d) => d.status === 'ISSUED').length;
  }

  get revokedCount(): number {
    return this.documents.filter((d) => d.status === 'REVOKED').length;
  }

  get filteredDocuments(): SchoolDocument[] {
    return this.documents.filter((d) => {
      const matchType = this.selectedType === 'ALL' || d.documentType === this.selectedType;
      if (!matchType) return false;
      if (!this.searchQuery) return true;
      const q = this.searchQuery.toLowerCase().trim();
      return (
        d.recipientName?.toLowerCase().includes(q) ||
        d.serialNumber?.toLowerCase().includes(q) ||
        d.admissionNumber?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q)
      );
    });
  }

  async ngOnInit() {
    await this.loadDocuments();
    await this.loadStudentRoster();
  }

  async loadDocuments() {
    this.documents = await this.documentService.getDocuments({
      type: this.selectedType,
      search: this.searchQuery,
    });
  }

  async loadStudentRoster() {
    try {
      this.api.get<StudentItem[]>('academics/students').subscribe({
        next: (students) => {
          if (Array.isArray(students)) {
            this.studentRoster = students.map((raw: any) => ({
              id: raw.id,
              name: `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || raw.name || 'Student',
              admissionNumber: raw.admissionNumber || raw.admission_number || '',
              className: raw.className || raw.class_name || 'Class 10',
              sectionName: raw.sectionName || raw.section_name || 'A',
              rollNumber: raw.rollNumber || raw.roll_number || '',
              guardianName: raw.guardianName || raw.father_name || raw.fatherName || '',
            }));
          }
        },
        error: () => {},
      });
    } catch {}
  }

  formatDocType(type: string): string {
    return (type || '').replace(/_/g, ' ');
  }

  async openIssueModal() {
    this.selectedStudentId = '';
    const serial = await this.documentService.generateSerialNumber(this.issueForm.documentType);
    this.issueForm = {
      documentType: 'TRANSFER_CERTIFICATE',
      title: 'Transfer Certificate (TC)',
      recipientName: '',
      admissionNumber: '',
      className: '',
      sectionName: '',
      rollNumber: '',
      guardianName: '',
      issueDate: new Date().toISOString().split('T')[0],
      serialNumber: serial,
      remarks: 'Promoted to higher class. All institutional dues cleared.',
    };
    this.showIssueModal = true;
  }

  async onDocTypeChange() {
    const titles: Record<SchoolDocumentType, string> = {
      TRANSFER_CERTIFICATE: 'Transfer Certificate (TC)',
      BONAFIDE_CERTIFICATE: 'Bonafide Student Certificate',
      CHARACTER_CERTIFICATE: 'Character Certificate',
      FEE_NO_DUES: 'Fee Clearance & No Dues Certificate',
      MARKSHEET: 'Official Academic Marksheet',
      REPORT_CARD: 'Student Report Card',
      SPORTS_CERTIFICATE: 'Sports & Co-Curricular Achievement Certificate',
      CUSTOM: 'Official Institutional Certificate',
    };
    this.issueForm.title = titles[this.issueForm.documentType] || 'Institutional Certificate';
    this.issueForm.serialNumber = await this.documentService.generateSerialNumber(this.issueForm.documentType);
  }

  onStudentSelect() {
    if (!this.selectedStudentId) return;
    const student = this.studentRoster.find((s) => s.id === this.selectedStudentId);
    if (student) {
      this.issueForm.studentId = student.id;
      this.issueForm.recipientName = student.name;
      this.issueForm.admissionNumber = student.admissionNumber;
      this.issueForm.className = student.className;
      this.issueForm.sectionName = student.sectionName;
      this.issueForm.rollNumber = student.rollNumber;
      this.issueForm.guardianName = student.guardianName;
    }
  }

  async submitIssueForm() {
    if (!this.issueForm.recipientName || !this.issueForm.title) {
      this.toast.error('Recipient Name and Document Title are required.');
      return;
    }

    this.submitting = true;
    try {
      const doc = await this.documentService.issueDocument(this.issueForm);
      this.toast.success(`Successfully issued ${doc.serialNumber}!`);
      this.showIssueModal = false;
      await this.loadDocuments();
      this.previewCertificate(doc);
    } catch (e: any) {
      this.toast.error(e?.message || 'Failed to issue document.');
    } finally {
      this.submitting = false;
    }
  }

  async previewCertificate(doc: SchoolDocument) {
    this.previewDoc = doc;
    this.qrDataUrl = '';
    this.showPreviewModal = true;
    const verifyUrl = doc.verificationUrl || `${window.location.origin}/verify/${doc.verificationToken}`;
    this.qrDataUrl = await this.documentService.generateQRCodeDataUrl(verifyUrl);
  }

  printCertificate() {
    window.print();
  }

  copyVerificationLink(doc: SchoolDocument) {
    const url = doc.verificationUrl || `${window.location.origin}/verify/${doc.verificationToken}`;
    navigator.clipboard.writeText(url).then(() => {
      this.toast.success('Verification QR link copied to clipboard!');
    });
  }

  async promptRevoke(doc: SchoolDocument) {
    const reason = prompt(`Enter reason to revoke certificate ${doc.serialNumber}:`);
    if (!reason) return;

    await this.documentService.revokeDocument(doc.id, reason);
    this.toast.info(`Document ${doc.serialNumber} revoked.`);
    await this.loadDocuments();
  }
}
