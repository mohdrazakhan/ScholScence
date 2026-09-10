import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { Exam, ClassItem } from '../../core/models';

interface FlatSection {
  id: string;
  name: string;
  classId: string;
  className: string;
  displayName: string;
}

interface StudentMarkRow {
  studentId: string;
  enrollmentId: string;
  rollNumber: number;
  admissionNumber: string;
  name: string;
  sectionName: string;
  sectionId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  grade: string;
  remarks: string;
}

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ======================================================================== -->
      <!-- PARENT PORTAL: DEDICATED CHILD REPORT CARD VIEW                          -->
      <!-- ======================================================================== -->
      <ng-container *ngIf="auth.isParent()">
        <!-- Parent Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Student Report Card</h1>
            <p class="text-xs text-slate-500 mt-0.5">Official examination report, subject scores, and teacher evaluations.</p>
          </div>

          <div class="flex items-center gap-2.5">
            <!-- Active Exam Selector -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500">Assessment:</span>
              <div class="relative min-w-[200px]">
                <select [(ngModel)]="selectedExamId" (change)="loadParentReportCard()"
                        class="w-full appearance-none px-4 py-2 pr-9 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] focus:outline-none focus:border-slate-800 cursor-pointer transition-all">
                  <option *ngFor="let ex of exams" [value]="ex.id">
                    {{ ex.name }} ({{ ex.code }})
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Print Official Card Action -->
            <button *ngIf="parentReport" (click)="printParentReportCard()"
                    class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[3px_3px_8px_#cbd5e1,-3px_-3px_8px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Report Card</span>
            </button>
          </div>
        </div>

        <!-- Child Selector Tabs (If Parent has multiple children) -->
        <div *ngIf="parentChildren.length > 1" class="flex items-center gap-2 p-1.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 w-fit">
          <button *ngFor="let child of parentChildren" (click)="selectParentChild(child.id)"
                  [class.bg-white]="selectedChildId === child.id"
                  [class.text-slate-900]="selectedChildId === child.id"
                  [class.shadow-xs]="selectedChildId === child.id"
                  [class.text-slate-500]="selectedChildId !== child.id"
                  class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
            {{ child.name }} ({{ child.className }} - Sec {{ child.sectionName }})
          </button>
        </div>

        <!-- Report Card Container -->
        <div *ngIf="parentReport" class="space-y-6">
          
          <!-- Student Profile & Exam Banner -->
          <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xl border border-indigo-200 shadow-sm shrink-0">
                {{ parentReport.student?.name?.charAt(0) || 'S' }}
              </div>
              <div>
                <div class="flex items-center gap-2.5">
                  <h2 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{{ parentReport.student?.name }}</h2>
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                    Adm: {{ parentReport.student?.admissionNumber }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Class: <strong class="text-slate-800">{{ parentReport.student?.className }} - {{ formatSection(parentReport.student?.sectionName) }}</strong></span>
                  <span>•</span>
                  <span>Roll No: <strong class="text-slate-800">#{{ parentReport.student?.rollNumber }}</strong></span>
                  <span>•</span>
                  <span>Session: <strong class="text-slate-800">{{ parentReport.student?.academicYear || '2026-27' }}</strong></span>
                </p>
              </div>
            </div>

            <!-- Performance KPI Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="px-4 py-2.5 bg-[#f8fafc] rounded-2xl border border-slate-200 text-center shadow-xs">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">Total Aggregate</span>
                <span class="text-sm font-black text-slate-900">{{ parentReport.summary?.totalMarksObtained }} / {{ parentReport.summary?.totalMaxMarks }}</span>
              </div>
              <div class="px-4 py-2.5 bg-[#f8fafc] rounded-2xl border border-slate-200 text-center shadow-xs">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">Percentage</span>
                <span class="text-sm font-black text-indigo-600">{{ parentReport.summary?.overallPercentage }}%</span>
              </div>
              <div class="px-4 py-2.5 bg-[#f8fafc] rounded-2xl border border-slate-200 text-center shadow-xs">
                <span class="text-[9px] uppercase font-bold text-slate-400 block">Overall Grade</span>
                <span class="text-sm font-black text-emerald-600">{{ getParentOverallGrade() }}</span>
              </div>
              <div class="px-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center shadow-xs">
                <span class="text-[9px] uppercase font-bold text-emerald-700 block">Result Status</span>
                <span class="text-xs font-black text-emerald-800">PASSED</span>
              </div>
            </div>
          </div>

          <!-- Subject Marks Breakdown Table -->
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
            <div class="p-5 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
              <div>
                <h3 class="text-sm font-black text-slate-900 tracking-tight">Subject-wise Evaluation & Scores</h3>
                <p class="text-xs text-slate-500">Official marks evaluated by subject faculty</p>
              </div>
              <span class="text-xs font-bold text-slate-600 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-xs">
                {{ parentReport.subjectResults?.length || 0 }} Subjects
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#f8fafc] text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th class="py-3.5 px-5">Subject Name</th>
                    <th class="py-3.5 px-4 text-center">Subject Code</th>
                    <th class="py-3.5 px-4 text-center">Max Marks</th>
                    <th class="py-3.5 px-4 text-center">Pass Marks</th>
                    <th class="py-3.5 px-4 text-center">Marks Obtained</th>
                    <th class="py-3.5 px-4 text-center">Grade</th>
                    <th class="py-3.5 px-5">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let sr of parentReport.subjectResults" class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 px-5 font-bold text-slate-900">{{ sr.subjectName }}</td>
                    <td class="py-3.5 px-4 text-center font-mono text-slate-500">{{ sr.subjectCode || 'SUB' }}</td>
                    <td class="py-3.5 px-4 text-center font-mono text-slate-700">{{ sr.maxMarks }}</td>
                    <td class="py-3.5 px-4 text-center font-mono text-slate-700">{{ sr.passingMarks }}</td>
                    <td class="py-3.5 px-4 text-center font-mono font-black"
                        [class.text-emerald-600]="sr.marksObtained >= sr.passingMarks && !sr.isAbsent"
                        [class.text-rose-600]="sr.marksObtained < sr.passingMarks || sr.isAbsent">
                      {{ sr.isAbsent ? 'Absent' : sr.marksObtained }}
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span [class.bg-emerald-50]="sr.grade?.startsWith('A')"
                            [class.text-emerald-700]="sr.grade?.startsWith('A')"
                            [class.bg-indigo-50]="sr.grade?.startsWith('B')"
                            [class.text-indigo-700]="sr.grade?.startsWith('B')"
                            [class.bg-amber-50]="sr.grade?.startsWith('C')"
                            [class.text-amber-700]="sr.grade?.startsWith('C')"
                            [class.bg-rose-50]="sr.grade === 'F' || sr.isAbsent"
                            [class.text-rose-700]="sr.grade === 'F' || sr.isAbsent"
                            class="px-2.5 py-0.5 rounded-xl text-[11px] font-bold border shadow-xs">
                        {{ sr.isAbsent ? 'AB' : (sr.grade || 'A') }}
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-slate-600 text-xs">{{ sr.remarks || 'Consistent academic performance.' }}</td>
                  </tr>

                  <tr *ngIf="!parentReport.subjectResults?.length">
                    <td colspan="7" class="text-center py-12 text-slate-400 text-xs">
                      No evaluation marks published yet for this examination.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Grade Scale Legend Footer -->
            <div class="p-4 border-t border-slate-100 bg-[#f8fafc] flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
              <span class="font-bold text-slate-700">CBSE 9-Point Grading Scale:</span>
              <div class="flex items-center gap-3 font-medium">
                <span><strong class="text-slate-800">A1:</strong> 91-100</span>
                <span><strong class="text-slate-800">A2:</strong> 81-90</span>
                <span><strong class="text-slate-800">B1:</strong> 71-80</span>
                <span><strong class="text-slate-800">B2:</strong> 61-70</span>
                <span><strong class="text-slate-800">C1:</strong> 51-60</span>
                <span><strong class="text-slate-800">D:</strong> 33-40 (Pass)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State if no report card -->
        <div *ngIf="!parentReport && !loadingParentReport" class="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-xs">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <h3 class="text-sm font-bold text-slate-800">No Assessment Published Yet</h3>
          <p class="text-xs text-slate-500 mt-1">Examination scores will appear here once finalized by teachers.</p>
        </div>
      </ng-container>

      <!-- ======================================================================== -->
      <!-- TEACHER & ADMIN: EXAM MARKS ENTRY CONSOLE                                -->
      <!-- ======================================================================== -->
      <ng-container *ngIf="!auth.isParent()">
        <!-- Header & Top Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Exams, Marks & Report Cards</h1>
            <p class="text-xs text-slate-500 mt-0.5">Manage exam schedules, bulk marks entry, and printable student scorecards.</p>
          </div>

          <div class="flex items-center flex-wrap gap-2.5">
            <!-- Active Exam Selector -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500">Exam:</span>
              <div class="relative min-w-[200px]">
                <select [(ngModel)]="selectedExamId" (change)="onExamChange()"
                        class="w-full appearance-none px-4 py-2 pr-9 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] focus:bg-white focus:outline-none focus:border-slate-800 cursor-pointer transition-all">
                  <option *ngFor="let ex of exams" [value]="ex.id">
                    {{ ex.name }} ({{ ex.code }})
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Section Selector -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500">Class:</span>
              <div class="relative min-w-[180px]">
                <select [(ngModel)]="selectedSectionId" (change)="onSectionChange()"
                        class="w-full appearance-none px-4 py-2 pr-9 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] focus:bg-white focus:outline-none focus:border-slate-800 cursor-pointer transition-all">
                  <option value="">All Sections</option>
                  <option *ngFor="let sec of availableSections" [value]="sec.id">
                    {{ sec.displayName }}
                  </option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Export & Print Actions -->
            <button *ngIf="selectedExamSubject" (click)="exportMarksCsv()"
                    class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export Excel</span>
            </button>
            <button *ngIf="selectedExamSubject" (click)="printMarksheet()"
                    class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Marksheet</span>
            </button>
          </div>
        </div>

        <!-- Exam Summary Clay Banner -->
        <div *ngIf="currentExam" class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="px-3 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono shadow-xs">
                {{ currentExam.code }}
              </span>
              <h2 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{{ currentExam.name }}</h2>
            </div>
            <p class="text-xs text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
              <span>Timeline: <strong class="text-slate-700">{{ currentExam.start_date | date:'mediumDate' }} — {{ currentExam.end_date | date:'mediumDate' }}</strong></span>
              <span>•</span>
              <span>Grading Scheme: <strong class="text-slate-700">{{ currentExam.grading_scheme?.name || 'CBSE 9-Point Scale' }}</strong></span>
            </p>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              ● {{ currentExam.status }}
            </span>
          </div>
        </div>

        <!-- Subject Papers Tabs -->
        <div *ngIf="currentExam?.exam_subjects?.length" class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Exam Papers (Select to View/Enter Marks)</h3>
            <span class="text-xs text-slate-400 font-medium">{{ currentExam.exam_subjects.length }} subjects configured</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div *ngFor="let es of currentExam.exam_subjects" (click)="selectExamSubject(es)"
                 [class.border-slate-900]="selectedExamSubject?.id === es.id"
                 [class.shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]]="selectedExamSubject?.id === es.id"
                 [class.bg-[#f8fafc]]="selectedExamSubject?.id === es.id"
                 [class.bg-white]="selectedExamSubject?.id !== es.id"
                 class="p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400 cursor-pointer transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono">
                    {{ es.class_subject?.subject?.code || 'SUB' }}
                  </span>
                  <span class="text-[10px] font-bold text-slate-500">
                    {{ es.class_subject?.class?.name }}
                  </span>
                </div>
                <h4 class="text-sm font-bold text-slate-900 mt-2.5">{{ es.class_subject?.subject?.name }}</h4>
                <p class="text-xs text-slate-500 mt-1">
                  Max Marks: <strong class="text-slate-800">{{ es.max_marks }}</strong> • Pass: <strong class="text-slate-800">{{ es.passing_marks }}</strong>
                </p>
              </div>

              <div class="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">{{ es.exam_date ? (es.exam_date | date:'mediumDate') : 'Scheduled' }}</span>
                <span class="font-bold text-slate-800 hover:underline">
                  {{ selectedExamSubject?.id === es.id ? 'Selected' : 'Enter Marks →' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Marksheet Table Section -->
        <div *ngIf="selectedExamSubject" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden space-y-0">
          <!-- Marksheet Header & KPIs -->
          <div class="p-5 sm:p-6 border-b border-slate-100 bg-[#f8fafc] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-black text-slate-900 tracking-tight">
                  {{ selectedExamSubject.class_subject?.subject?.name }} Marksheet
                </h3>
                <span class="text-xs font-bold text-slate-700 px-2.5 py-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-xs">
                  Max: {{ selectedExamSubject.max_marks }} | Pass: {{ selectedExamSubject.passing_marks }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Class: <span class="font-semibold text-slate-700">{{ selectedExamSubject.class_subject?.class?.name }}</span> • 
                Total Students: <span class="font-semibold text-slate-700">{{ studentMarks.length }}</span>
              </p>
            </div>

            <!-- Marksheet KPI Stats -->
            <div class="flex items-center gap-2.5 flex-wrap">
              <div class="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                <div class="text-[9px] uppercase font-bold text-slate-400">Class Avg</div>
                <div class="text-xs font-bold text-slate-900">{{ calcStats.avgScore }} / {{ selectedExamSubject.max_marks }}</div>
              </div>
              <div class="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                <div class="text-[9px] uppercase font-bold text-slate-400">Highest</div>
                <div class="text-xs font-bold text-emerald-600">{{ calcStats.highestScore }}</div>
              </div>
              <div class="px-3.5 py-2 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                <div class="text-[9px] uppercase font-bold text-slate-400">Pass Rate</div>
                <div class="text-xs font-bold text-indigo-600">{{ calcStats.passRate }}%</div>
              </div>
              <button (click)="saveAllMarks()" [disabled]="savingMarks"
                      class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span *ngIf="!savingMarks">Save All Marks</span>
                <span *ngIf="savingMarks">Saving...</span>
              </button>
            </div>
          </div>

          <!-- Student Marks Data Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-[#f8fafc] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th class="py-3.5 px-4 w-16">Roll #</th>
                  <th class="py-3.5 px-4">Student Name</th>
                  <th class="py-3.5 px-4 w-28">Section</th>
                  <th class="py-3.5 px-4 w-28">Status</th>
                  <th class="py-3.5 px-4 w-36">Marks Obtained</th>
                  <th class="py-3.5 px-4 w-24">Grade</th>
                  <th class="py-3.5 px-4">Teacher Remarks</th>
                  <th class="py-3.5 px-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-xs">
                <tr *ngFor="let s of pagedStudents" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-bold text-slate-700">#{{ s.rollNumber }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900">{{ s.name }}</div>
                    <div class="text-[10px] font-mono text-slate-400">Adm: {{ s.admissionNumber }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#f8fafc] text-slate-700 border border-slate-200 shadow-xs">
                      Sec {{ s.sectionName }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <button (click)="toggleAbsent(s)"
                            [class.bg-rose-50]="s.isAbsent"
                            [class.text-rose-700]="s.isAbsent"
                            [class.border-rose-200]="s.isAbsent"
                            [class.bg-emerald-50]="!s.isAbsent"
                            [class.text-emerald-700]="!s.isAbsent"
                            [class.border-emerald-200]="!s.isAbsent"
                            class="px-3 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer shadow-xs">
                      {{ s.isAbsent ? 'Absent' : 'Present' }}
                    </button>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5">
                      <input type="number" [(ngModel)]="s.marksObtained" (ngModelChange)="autoCalculateGrade(s)"
                             [disabled]="s.isAbsent" min="0" [max]="selectedExamSubject.max_marks"
                             class="w-20 px-3 py-1 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 disabled:bg-slate-100 disabled:text-slate-400 shadow-[inset_1px_1px_2px_#e2e8f0]" />
                      <span class="text-slate-400 text-[10px]">/ {{ selectedExamSubject.max_marks }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span [class.bg-emerald-50]="s.grade.startsWith('A')"
                          [class.text-emerald-700]="s.grade.startsWith('A')"
                          [class.bg-indigo-50]="s.grade.startsWith('B')"
                          [class.text-indigo-700]="s.grade.startsWith('B')"
                          [class.bg-amber-50]="s.grade.startsWith('C')"
                          [class.text-amber-700]="s.grade.startsWith('C')"
                          [class.bg-rose-50]="s.grade === 'F' || s.isAbsent"
                          [class.text-rose-700]="s.grade === 'F' || s.isAbsent"
                          class="px-2.5 py-0.5 rounded-xl text-[11px] font-bold border shadow-xs">
                      {{ s.isAbsent ? 'AB' : (s.grade || '-') }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <input type="text" [(ngModel)]="s.remarks" placeholder="Optional remark..."
                           class="w-full px-2.5 py-1 bg-transparent border-b border-slate-200 text-xs text-slate-700 focus:border-slate-800 focus:outline-none" />
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button (click)="viewReportCard(s.studentId)"
                            class="px-3 py-1 bg-[#f8fafc] hover:bg-white text-slate-800 text-[11px] font-bold rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer">
                      Report Card
                    </button>
                  </td>
                </tr>

                <tr *ngIf="studentMarks.length === 0">
                  <td colspan="8" class="text-center py-12 text-slate-400 text-xs">
                    No students enrolled in this section or subject.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-5 py-3.5 border-t border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="text-slate-500">
              Showing <strong class="text-slate-800">{{ (page - 1) * pageSize + 1 }}</strong> to 
              <strong class="text-slate-800">{{ Math.min(page * pageSize, studentMarks.length) }}</strong> of 
              <strong class="text-slate-800">{{ studentMarks.length }}</strong> students
            </div>

            <div class="flex items-center gap-2">
              <select [(ngModel)]="pageSize" (change)="page = 1"
                      class="px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
                <option [value]="10">10 / page</option>
                <option [value]="25">25 / page</option>
                <option [value]="50">50 / page</option>
                <option [value]="100">100 / page</option>
              </select>

              <button (click)="page = page - 1" [disabled]="page <= 1"
                      class="px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-xs cursor-pointer">
                ‹ Prev
              </button>
              <span class="font-bold text-slate-700 px-1">{{ page }} / {{ totalPages }}</span>
              <button (click)="page = page + 1" [disabled]="page >= totalPages"
                      class="px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-xs cursor-pointer">
                Next ›
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Student Report Card Modal (For Teachers / Admins to preview individual scorecard) -->
      <div *ngIf="showReportModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-6 my-8">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Official Student Academic Report Card</h3>
              <p class="text-xs text-slate-500">SchoolSense Automated Evaluation System</p>
            </div>
            <button (click)="showReportModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div *ngIf="studentReport" class="space-y-5">
            <!-- Student Header Profile -->
            <div class="p-4 sm:p-5 bg-[#f8fafc] rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shadow-xs">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                <span class="font-bold text-slate-900 text-sm">{{ studentReport.student.name }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Class & Section</span>
                <span class="font-bold text-slate-900">{{ studentReport.student.className }} - Sec {{ studentReport.student.sectionName }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Roll Number</span>
                <span class="font-bold text-slate-900 font-mono">#{{ studentReport.student.rollNumber }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Admission No.</span>
                <span class="font-bold text-slate-900 font-mono">{{ studentReport.student.admissionNumber }}</span>
              </div>
            </div>

            <!-- Subject Scores Table -->
            <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#f8fafc] text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th class="py-2.5 px-3">Subject</th>
                    <th class="py-2.5 px-3 text-center">Max Marks</th>
                    <th class="py-2.5 px-3 text-center">Pass Marks</th>
                    <th class="py-2.5 px-3 text-center">Marks Obtained</th>
                    <th class="py-2.5 px-3 text-center">Grade</th>
                    <th class="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let sr of studentReport.subjectResults" class="hover:bg-slate-50">
                    <td class="py-2.5 px-3 font-bold text-slate-900">{{ sr.subjectName }}</td>
                    <td class="py-2.5 px-3 text-center font-mono text-slate-600">{{ sr.maxMarks }}</td>
                    <td class="py-2.5 px-3 text-center font-mono text-slate-600">{{ sr.passingMarks }}</td>
                    <td class="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                      {{ sr.isAbsent ? 'Absent' : sr.marksObtained }}
                    </td>
                    <td class="py-2.5 px-3 text-center font-bold text-indigo-600">{{ sr.grade }}</td>
                    <td class="py-2.5 px-3 text-slate-500 text-[11px]">{{ sr.remarks || 'Satisfactory' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Summary Box -->
            <div class="p-4 sm:p-5 bg-[#f8fafc] rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <span class="text-xs font-bold text-slate-900">Total Aggregate:</span>
                <span class="text-xs text-indigo-700 ml-1 font-bold">
                  {{ studentReport.summary.totalMarksObtained }} / {{ studentReport.summary.totalMaxMarks }}
                </span>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-900">Overall Percentage:</span>
                <span class="text-sm font-bold text-indigo-600 ml-1">
                  {{ studentReport.summary.overallPercentage }}%
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showReportModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Close
            </button>
            <button (click)="printStudentReportCard()" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Official Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ExamsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exporter = inject(ExportService);
  Math = Math;

  exams: Exam[] = [];
  selectedExamId = '';
  currentExam: any = null;

  availableSections: FlatSection[] = [];
  selectedSectionId = '';

  selectedExamSubject: any = null;
  studentMarks: StudentMarkRow[] = [];
  savingMarks = false;

  // Pagination
  page = 1;
  pageSize = 10;

  // Teacher preview modal
  showReportModal = false;
  studentReport: any = null;

  // Parent Portal Specific State
  selectedChildId = '';
  parentReport: any = null;
  loadingParentReport = false;

  get parentChildren(): any[] {
    return this.auth.currentUser()?.children || [];
  }

  ngOnInit() {
    if (!this.auth.isServiceEnabled('EXAMS')) return;
    if (this.auth.isParent()) {
      if (this.parentChildren.length > 0) {
        this.selectedChildId = this.parentChildren[0].id;
      }
      this.loadExams();
    } else {
      this.loadSections();
      this.loadExams();
    }
  }

  selectParentChild(childId: string) {
    this.selectedChildId = childId;
    this.loadParentReportCard();
  }

  loadParentReportCard() {
    if (!this.selectedChildId) {
      if (this.parentChildren.length > 0) {
        this.selectedChildId = this.parentChildren[0].id;
      } else {
        return;
      }
    }

    this.loadingParentReport = true;
    const url = `exams/student/${this.selectedChildId}/report${this.selectedExamId ? '?examId=' + this.selectedExamId : ''}`;
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.parentReport = res;
        this.loadingParentReport = false;
      },
      error: () => {
        this.loadingParentReport = false;
        this.toast.error('Could not load report card for the selected student');
      },
    });
  }

  getParentOverallGrade(): string {
    const pct = Number(this.parentReport?.summary?.overallPercentage) || 0;
    if (pct >= 90) return 'A1';
    if (pct >= 80) return 'A2';
    if (pct >= 70) return 'B1';
    if (pct >= 60) return 'B2';
    if (pct >= 50) return 'C1';
    if (pct >= 40) return 'C2';
    if (pct >= 33) return 'D';
    return 'F';
  }

  formatSection(name?: string): string {
    if (!name) return 'Section A';
    const cleaned = name.replace(/^section\s+/i, '').replace(/^sec\s+/i, '').trim();
    return cleaned ? `Section ${cleaned}` : name;
  }

  printParentReportCard() {
    if (!this.parentReport) return;
    this.exporter.printReport(
      `Student Academic Report Card — ${this.parentReport.student?.name}`,
      `Class: ${this.parentReport.student?.className} - ${this.formatSection(this.parentReport.student?.sectionName)} | Roll: #${this.parentReport.student?.rollNumber} | Adm: ${this.parentReport.student?.admissionNumber} | Overall: ${this.parentReport.summary?.overallPercentage}% (${this.getParentOverallGrade()})`,
      this.parentReport.subjectResults,
      [
        { header: 'Subject', key: 'subjectName' },
        { header: 'Max Marks', key: 'maxMarks' },
        { header: 'Pass Marks', key: 'passingMarks' },
        { header: 'Marks Obtained', key: 'marksObtained', formatter: (v, r) => (r.isAbsent ? 'Absent' : String(v)) },
        { header: 'Grade', key: 'grade' },
        { header: 'Teacher Remarks', key: 'remarks' },
      ],
    );
  }

  loadSections() {
    this.api.get<ClassItem[]>('academics/classes').subscribe({
      next: (classes) => {
        const flat: FlatSection[] = [];
        for (const c of classes) {
          if (c.sections && c.sections.length > 0) {
            for (const s of c.sections) {
              const secName = s.name.startsWith('Section') ? s.name : `Section ${s.name}`;
              flat.push({
                id: s.id,
                name: s.name,
                classId: c.id,
                className: c.name,
                displayName: `${c.name} - ${secName}`,
              });
            }
          }
        }

        // Scope to assigned teaching sections if Teacher
        const teacherSectionIds = new Set<string>();
        const teachingScope = this.auth.currentUser()?.teachingScope;
        if (teachingScope) {
          teachingScope.classTeacherSections?.forEach((cts) => teacherSectionIds.add(cts.sectionId));
          teachingScope.subjectAssignments?.forEach((sa) => teacherSectionIds.add(sa.sectionId));
        }

        if (this.auth.isTeacher() && teacherSectionIds.size > 0) {
          this.availableSections = flat.filter((sec) => teacherSectionIds.has(sec.id));
        } else {
          this.availableSections = flat;
        }
      },
    });
  }

  loadExams() {
    this.api.get<Exam[]>('exams').subscribe({
      next: (res) => {
        this.exams = res;
        if (res.length > 0) {
          this.selectedExamId = res[0].id;
          this.currentExam = res[0];

          if (this.auth.isParent()) {
            this.loadParentReportCard();
          } else if (res[0].exam_subjects && res[0].exam_subjects.length > 0) {
            this.selectExamSubject(res[0].exam_subjects[0]);
          }
        }
      },
      error: () => this.toast.error('Failed to load exam schedules'),
    });
  }

  onExamChange() {
    this.currentExam = this.exams.find((e) => e.id === this.selectedExamId);
    if (this.auth.isParent()) {
      this.loadParentReportCard();
    } else if (this.currentExam?.exam_subjects?.length > 0) {
      this.selectExamSubject(this.currentExam.exam_subjects[0]);
    } else {
      this.selectedExamSubject = null;
      this.studentMarks = [];
    }
  }

  onSectionChange() {
    if (this.selectedExamSubject) {
      this.loadSubjectMarks();
    }
  }

  selectExamSubject(es: any) {
    this.selectedExamSubject = es;
    this.page = 1;
    this.loadSubjectMarks();
  }

  loadSubjectMarks() {
    if (!this.selectedExamSubject) return;
    const url = `exams/subjects/${this.selectedExamSubject.id}/marks${this.selectedSectionId ? '?sectionId=' + this.selectedSectionId : ''}`;
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.studentMarks = res.students || [];
      },
      error: () => this.toast.error('Could not load student marks list'),
    });
  }

  get pagedStudents(): StudentMarkRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.studentMarks.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.studentMarks.length / this.pageSize) || 1;
  }

  get calcStats() {
    if (!this.studentMarks.length || !this.selectedExamSubject) {
      return { avgScore: '0.0', highestScore: 0, passRate: '0.0' };
    }
    const max = Number(this.selectedExamSubject.max_marks) || 100;
    const pass = Number(this.selectedExamSubject.passing_marks) || 33;
    const present = this.studentMarks.filter((s) => !s.isAbsent && s.marksObtained != null);
    if (!present.length) {
      return { avgScore: '0.0', highestScore: 0, passRate: '0.0' };
    }
    const total = present.reduce((acc, s) => acc + (s.marksObtained || 0), 0);
    const avg = (total / present.length).toFixed(1);
    const highest = Math.max(...present.map((s) => s.marksObtained || 0));
    const passed = present.filter((s) => (s.marksObtained || 0) >= pass).length;
    const passRate = ((passed / present.length) * 100).toFixed(1);

    return { avgScore: avg, highestScore: highest, passRate };
  }

  toggleAbsent(s: StudentMarkRow) {
    s.isAbsent = !s.isAbsent;
    if (s.isAbsent) {
      s.marksObtained = null;
      s.grade = 'AB';
    } else {
      this.autoCalculateGrade(s);
    }
  }

  autoCalculateGrade(s: StudentMarkRow) {
    if (s.isAbsent || s.marksObtained == null) return;
    const max = Number(this.selectedExamSubject?.max_marks) || 100;
    const pct = (s.marksObtained / max) * 100;

    if (pct >= 90) s.grade = 'A1';
    else if (pct >= 80) s.grade = 'A2';
    else if (pct >= 70) s.grade = 'B1';
    else if (pct >= 60) s.grade = 'B2';
    else if (pct >= 50) s.grade = 'C1';
    else if (pct >= 40) s.grade = 'C2';
    else if (pct >= 33) s.grade = 'D';
    else s.grade = 'F';
  }

  saveAllMarks() {
    if (!this.selectedExamSubject) return;
    this.savingMarks = true;

    const payload = {
      examSubjectId: this.selectedExamSubject.id,
      marks: this.studentMarks.map((s) => ({
        studentId: s.studentId,
        marksObtained: s.marksObtained,
        isAbsent: s.isAbsent,
        grade: s.grade,
        remarks: s.remarks,
      })),
    };

    this.api.post('exams/marks/bulk', payload).subscribe({
      next: () => {
        this.savingMarks = false;
        this.toast.success(`Saved marks for ${this.studentMarks.length} students`);
      },
      error: () => {
        this.savingMarks = false;
        this.toast.error('Failed to save exam marks');
      },
    });
  }

  exportMarksCsv() {
    if (!this.selectedExamSubject || !this.studentMarks.length) return;
    const subName = this.selectedExamSubject.class_subject?.subject?.name || 'Subject';
    const filename = `Marksheet_${subName}_${this.currentExam?.code || 'Exam'}.csv`;

    this.exporter.exportToCsv(
      filename,
      this.studentMarks,
      [
        { header: 'Roll No', key: 'rollNumber' },
        { header: 'Admission No', key: 'admissionNumber' },
        { header: 'Student Name', key: 'name' },
        { header: 'Section', key: 'sectionName' },
        { header: 'Attendance', key: 'isAbsent', formatter: (val) => (val ? 'Absent' : 'Present') },
        { header: 'Marks Obtained', key: 'marksObtained', formatter: (val) => (val != null ? String(val) : '-') },
        { header: 'Grade', key: 'grade' },
        { header: 'Remarks', key: 'remarks' },
      ],
    );
    this.toast.success(`Exported ${filename}`);
  }

  printMarksheet() {
    if (!this.selectedExamSubject) return;
    const subName = this.selectedExamSubject.class_subject?.subject?.name || 'Subject';
    this.exporter.printReport(
      `Official Marksheet — ${subName} (${this.currentExam?.name})`,
      `Class: ${this.selectedExamSubject.class_subject?.class?.name} | Max Marks: ${this.selectedExamSubject.max_marks} | Pass Marks: ${this.selectedExamSubject.passing_marks}`,
      this.studentMarks,
      [
        { header: 'Roll #', key: 'rollNumber' },
        { header: 'Adm No', key: 'admissionNumber' },
        { header: 'Student Name', key: 'name' },
        { header: 'Sec', key: 'sectionName' },
        { header: 'Status', key: 'isAbsent', formatter: (v) => (v ? 'ABSENT' : 'PRESENT') },
        { header: 'Marks', key: 'marksObtained', formatter: (v) => (v != null ? String(v) : '-') },
        { header: 'Grade', key: 'grade' },
        { header: 'Remarks', key: 'remarks' },
      ],
    );
  }

  viewReportCard(studentId: string) {
    this.api.get<any>(`exams/student/${studentId}/report?examId=${this.selectedExamId}`).subscribe({
      next: (res) => {
        this.studentReport = res;
        this.showReportModal = true;
      },
      error: () => this.toast.error('Could not load student report card'),
    });
  }

  printStudentReportCard() {
    if (!this.studentReport) return;
    this.exporter.printReport(
      `Student Academic Report Card — ${this.studentReport.student.name}`,
      `Class: ${this.studentReport.student.className} - ${this.formatSection(this.studentReport.student.sectionName)} | Roll: #${this.studentReport.student.rollNumber} | Adm: ${this.studentReport.student.admissionNumber} | Overall: ${this.studentReport.summary.overallPercentage}%`,
      this.studentReport.subjectResults,
      [
        { header: 'Subject', key: 'subjectName' },
        { header: 'Max Marks', key: 'maxMarks' },
        { header: 'Pass Marks', key: 'passingMarks' },
        { header: 'Marks Obtained', key: 'marksObtained', formatter: (v, r) => (r.isAbsent ? 'Absent' : String(v)) },
        { header: 'Grade', key: 'grade' },
        { header: 'Remarks', key: 'remarks' },
      ],
    );
  }
}

