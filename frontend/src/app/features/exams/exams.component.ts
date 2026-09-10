import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
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
      <!-- Header & Top Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Exams, Marks & Report Cards</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage exam schedules, bulk marks entry, and printable student scorecards.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Active Exam Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">Exam:</span>
            <select [(ngModel)]="selectedExamId" (change)="onExamChange()"
                    class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-indigo-500">
              <option *ngFor="let ex of exams" [value]="ex.id">
                {{ ex.name }} ({{ ex.code }})
              </option>
            </select>
          </div>

          <!-- Section Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">Class:</span>
            <select [(ngModel)]="selectedSectionId" (change)="onSectionChange()"
                    class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-indigo-500">
              <option value="">All Sections</option>
              <option *ngFor="let sec of availableSections" [value]="sec.id">
                {{ sec.displayName }}
              </option>
            </select>
          </div>

          <!-- Export & Print Actions -->
          <button *ngIf="selectedExamSubject" (click)="exportMarksCsv()"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>📥 Export Excel</span>
          </button>
          <button *ngIf="selectedExamSubject" (click)="printMarksheet()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>🖨 Print Marksheet</span>
          </button>
        </div>
      </div>

      <!-- Exam Summary Banner -->
      <div *ngIf="currentExam" class="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              {{ currentExam.code }}
            </span>
            <h2 class="text-lg font-bold text-white">{{ currentExam.name }}</h2>
          </div>
          <p class="text-xs text-slate-300 mt-1">
            📅 Timeline: {{ currentExam.start_date | date:'mediumDate' }} — {{ currentExam.end_date | date:'mediumDate' }} • 
            Grading Scheme: <span class="font-semibold text-indigo-300">{{ currentExam.grading_scheme?.name || 'CBSE 9-Point Scale' }}</span>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            ● {{ currentExam.status }}
          </span>
        </div>
      </div>

      <!-- Subject Papers Tabs -->
      <div *ngIf="currentExam?.exam_subjects?.length" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Exam Papers (Select to View/Enter Marks)</h3>
          <span class="text-xs text-slate-500">{{ currentExam.exam_subjects.length }} subjects configured</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div *ngFor="let es of currentExam.exam_subjects" (click)="selectExamSubject(es)"
               [class.border-indigo-600]="selectedExamSubject?.id === es.id"
               [class.ring-2]="selectedExamSubject?.id === es.id"
               [class.ring-indigo-600/20]="selectedExamSubject?.id === es.id"
               [class.bg-indigo-50/40]="selectedExamSubject?.id === es.id"
               class="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 cursor-pointer transition-all shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                  {{ es.class_subject?.subject?.code || 'SUB' }}
                </span>
                <span class="text-[10px] font-bold text-slate-500">
                  {{ es.class_subject?.class?.name }}
                </span>
              </div>
              <h4 class="text-sm font-bold text-slate-900 mt-2">{{ es.class_subject?.subject?.name }}</h4>
              <p class="text-xs text-slate-500 mt-1">
                Max Marks: <strong class="text-slate-800">{{ es.max_marks }}</strong> • Pass: <strong>{{ es.passing_marks }}</strong>
              </p>
            </div>

            <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span class="text-slate-500">📅 {{ es.exam_date ? (es.exam_date | date:'mediumDate') : 'Scheduled' }}</span>
              <span class="text-indigo-600 font-bold hover:underline">
                {{ selectedExamSubject?.id === es.id ? '✓ Selected' : 'Enter Marks →' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Marksheet Table Section -->
      <div *ngIf="selectedExamSubject" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <!-- Marksheet Header & KPIs -->
        <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900">
                {{ selectedExamSubject.class_subject?.subject?.name }} Marksheet
              </h3>
              <span class="text-xs font-bold text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                Max: {{ selectedExamSubject.max_marks }} | Pass: {{ selectedExamSubject.passing_marks }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Class: <span class="font-semibold text-slate-700">{{ selectedExamSubject.class_subject?.class?.name }}</span> • 
              Total Students: <span class="font-semibold text-slate-700">{{ studentMarks.length }}</span>
            </p>
          </div>

          <!-- Marksheet KPI Stats -->
          <div class="flex items-center gap-3">
            <div class="px-3 py-2 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <div class="text-[10px] uppercase font-bold text-slate-400">Class Avg</div>
              <div class="text-xs font-bold text-slate-900">{{ calcStats.avgScore }} / {{ selectedExamSubject.max_marks }}</div>
            </div>
            <div class="px-3 py-2 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <div class="text-[10px] uppercase font-bold text-slate-400">Highest</div>
              <div class="text-xs font-bold text-emerald-600">{{ calcStats.highestScore }}</div>
            </div>
            <div class="px-3 py-2 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
              <div class="text-[10px] uppercase font-bold text-slate-400">Pass Rate</div>
              <div class="text-xs font-bold text-indigo-600">{{ calcStats.passRate }}%</div>
            </div>
            <button (click)="saveAllMarks()" [disabled]="savingMarks"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <span *ngIf="!savingMarks">💾 Save All Marks</span>
              <span *ngIf="savingMarks">Saving...</span>
            </button>
          </div>
        </div>

        <!-- Student Marks Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th class="py-3 px-4 w-16">Roll #</th>
                <th class="py-3 px-4">Student Name</th>
                <th class="py-3 px-4 w-28">Section</th>
                <th class="py-3 px-4 w-28">Status</th>
                <th class="py-3 px-4 w-36">Marks Obtained</th>
                <th class="py-3 px-4 w-24">Grade</th>
                <th class="py-3 px-4">Teacher Remarks</th>
                <th class="py-3 px-4 text-right w-28">Actions</th>
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
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
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
                          class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors">
                    {{ s.isAbsent ? 'Absent' : 'Present' }}
                  </button>
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-1.5">
                    <input type="number" [(ngModel)]="s.marksObtained" (ngModelChange)="autoCalculateGrade(s)"
                           [disabled]="s.isAbsent" min="0" [max]="selectedExamSubject.max_marks"
                           class="w-20 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400" />
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
                        class="px-2.5 py-0.5 rounded text-[11px] font-bold border">
                    {{ s.isAbsent ? 'AB' : (s.grade || '-') }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <input type="text" [(ngModel)]="s.remarks" placeholder="Optional remark..."
                         class="w-full px-2.5 py-1 bg-transparent border-b border-slate-200 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none" />
                </td>
                <td class="py-3 px-4 text-right">
                  <button (click)="viewReportCard(s.studentId)"
                          class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 transition-colors">
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

        <!-- FretBox-style Pagination -->
        <div class="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="text-slate-500">
            Showing <strong class="text-slate-800">{{ (page - 1) * pageSize + 1 }}</strong> to 
            <strong class="text-slate-800">{{ Math.min(page * pageSize, studentMarks.length) }}</strong> of 
            <strong class="text-slate-800">{{ studentMarks.length }}</strong> students
          </div>

          <div class="flex items-center gap-2">
            <select [(ngModel)]="pageSize" (change)="page = 1"
                    class="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700">
              <option [value]="10">10 / page</option>
              <option [value]="25">25 / page</option>
              <option [value]="50">50 / page</option>
              <option [value]="100">100 / page</option>
            </select>

            <button (click)="page = page - 1" [disabled]="page <= 1"
                    class="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
              ← Prev
            </button>
            <span class="font-bold text-slate-700 px-1">{{ page }} / {{ totalPages }}</span>
            <button (click)="page = page + 1" [disabled]="page >= totalPages"
                    class="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- Student Report Card Modal -->
      <div *ngIf="showReportModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Official Student Academic Report Card</h3>
              <p class="text-xs text-slate-500">SchoolSense Automated Evaluation System</p>
            </div>
            <button (click)="showReportModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div *ngIf="studentReport" class="space-y-5">
            <!-- Student Header Profile -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
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
            <div class="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-indigo-950">Total Aggregate:</span>
                <span class="text-xs text-indigo-700 ml-1 font-bold">
                  {{ studentReport.summary.totalMarksObtained }} / {{ studentReport.summary.totalMaxMarks }}
                </span>
              </div>
              <div>
                <span class="text-xs font-bold text-indigo-950">Overall Percentage:</span>
                <span class="text-sm font-bold text-indigo-600 ml-1">
                  {{ studentReport.summary.overallPercentage }}%
                </span>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="showReportModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Close
            </button>
            <button (click)="printStudentReportCard()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
              <span>🖨 Print Official Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ExamsComponent implements OnInit {
  api = inject(ApiService);
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

  // Report card modal
  showReportModal = false;
  studentReport: any = null;

  ngOnInit() {
    this.loadSections();
    this.loadExams();
  }

  loadSections() {
    this.api.get<ClassItem[]>('academics/classes').subscribe({
      next: (classes) => {
        const flat: FlatSection[] = [];
        for (const c of classes) {
          if (c.sections && c.sections.length > 0) {
            for (const s of c.sections) {
              flat.push({
                id: s.id,
                name: s.name,
                classId: c.id,
                className: c.name,
                displayName: `${c.name} - Section ${s.name}`,
              });
            }
          }
        }
        this.availableSections = flat;
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
          if (res[0].exam_subjects && res[0].exam_subjects.length > 0) {
            this.selectExamSubject(res[0].exam_subjects[0]);
          }
        }
      },
      error: () => this.toast.error('Failed to load exam schedules'),
    });
  }

  onExamChange() {
    this.currentExam = this.exams.find((e) => e.id === this.selectedExamId);
    if (this.currentExam?.exam_subjects?.length > 0) {
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
        this.toast.success(`Saved marks for ${this.studentMarks.length} students to PostgreSQL`);
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
      `Class: ${this.studentReport.student.className} - Section ${this.studentReport.student.sectionName} | Roll: #${this.studentReport.student.rollNumber} | Adm: ${this.studentReport.student.admissionNumber} | Overall: ${this.studentReport.summary.overallPercentage}%`,
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
