import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { HomeworkItem, ClassItem } from '../../core/models';

interface FlatSection {
  id: string;
  name: string;
  classId: string;
  className: string;
  displayName: string;
}

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Top Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Homework & Classwork</h1>
          <p class="text-xs text-slate-500 mt-0.5">Assign coursework, set deadlines, and manage parent notifications.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Class & Section Selector -->
          <div *ngIf="!auth.isParent()" class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">Section:</span>
            <div class="relative min-w-[200px]">
              <select [(ngModel)]="selectedSectionId" (change)="onSectionChange()"
                      class="w-full appearance-none px-4 py-2 pr-9 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] focus:bg-white focus:outline-none focus:border-slate-800 cursor-pointer transition-all">
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

          <button *ngIf="homeworkList.length > 0" (click)="exportHomeworkCsv()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Excel</span>
          </button>
          <button *ngIf="homeworkList.length > 0" (click)="printHomeworkDiary()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Diary</span>
          </button>

          <button *ngIf="!auth.isParent()" (click)="openCreateModal()"
                  class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.99]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Homework</span>
          </button>
        </div>
      </div>

      <!-- Filter / Search Bar -->
      <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search homework topic or description..."
                 class="px-4 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] w-full sm:w-80" />
        </div>
        <div class="text-xs text-slate-500 font-medium">
          Showing <strong class="text-slate-900">{{ filteredHomework.length }}</strong> assignments
        </div>
      </div>

      <!-- Homework List Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div *ngFor="let hw of filteredHomework" class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400 transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#f8fafc] text-slate-700 border border-slate-200 font-mono shadow-xs">
                  {{ hw.class_subject?.subject?.name || 'Academic Subject' }}
                </span>
                <h3 class="text-base font-bold text-slate-900 mt-2.5">{{ hw.title }}</h3>
              </div>
              <span class="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
                {{ hw.status }}
              </span>
            </div>

            <p class="text-xs text-slate-600 mt-3.5 leading-relaxed bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 shadow-[inset_1px_1px_2px_#e2e8f0]">
              {{ hw.description }}
            </p>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Assigned: <strong class="text-slate-700">{{ hw.assigned_date | date:'mediumDate' }}</strong></span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Due: <strong class="text-rose-600 font-bold">{{ hw.due_date | date:'mediumDate' }}</strong></span>
            </div>
          </div>
        </div>

        <div *ngIf="filteredHomework.length === 0" class="col-span-full bg-white p-12 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] text-center">
          <p class="text-slate-400 text-xs">No homework assignments found matching your filter.</p>
        </div>
      </div>

      <!-- Create Homework Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-black text-slate-900 tracking-tight">Create New Homework</h3>
            <button (click)="showCreateModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Target Section</label>
              <select [(ngModel)]="createSectionId" (change)="onModalSectionChange()"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option *ngFor="let sec of availableSections" [value]="sec.id">
                  {{ sec.displayName }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <select [(ngModel)]="createClassSubjectId"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option *ngFor="let cs of modalClassSubjects" [value]="cs.id">
                  {{ cs.subject.name }} ({{ cs.subject.code }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Homework Title *</label>
              <input type="text" [(ngModel)]="newHw.title" placeholder="e.g. Chapter 4 Exercises & Q1 to Q10"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Description & Instructions *</label>
              <textarea [(ngModel)]="newHw.description" rows="3" placeholder="Provide instructions for students..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input type="date" [(ngModel)]="newHw.dueDate"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showCreateModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="createHomework()" [disabled]="creating || !newHw.title || !newHw.description"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!creating">Publish Homework</span>
              <span *ngIf="creating">Publishing...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HomeworkComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exporter = inject(ExportService);
  
  availableSections: FlatSection[] = [];
  selectedSectionId = '';
  createSectionId = '';
  createClassSubjectId = '';
  modalClassSubjects: any[] = [];
  
  homeworkList: HomeworkItem[] = [];
  searchQuery = '';
  showCreateModal = false;
  creating = false;

  newHw = {
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  ngOnInit() {
    if (!this.auth.isServiceEnabled('HOMEWORK')) return;
    this.loadSections();
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

        if (this.availableSections.length > 0) {
          this.selectedSectionId = this.availableSections[0].id;
          this.createSectionId = this.availableSections[0].id;
          this.loadHomework();
        }
      },
    });
  }

  onSectionChange() {
    this.loadHomework();
  }

  loadHomework() {
    if (!this.selectedSectionId) return;
    this.api.get<HomeworkItem[]>(`homework/section/${this.selectedSectionId}`).subscribe({
      next: (res) => (this.homeworkList = res),
      error: () => this.toast.error('Failed to load homework assignments'),
    });
  }

  get filteredHomework(): HomeworkItem[] {
    if (!this.searchQuery.trim()) return this.homeworkList;
    const q = this.searchQuery.toLowerCase();
    return this.homeworkList.filter((h) => 
      h.title.toLowerCase().includes(q) || 
      h.description.toLowerCase().includes(q) ||
      h.class_subject?.subject?.name.toLowerCase().includes(q)
    );
  }

  openCreateModal() {
    this.createSectionId = this.selectedSectionId;
    this.onModalSectionChange();
    this.showCreateModal = true;
  }

  onModalSectionChange() {
    const sec = this.availableSections.find((s) => s.id === this.createSectionId);
    if (!sec) return;

    this.api.get<any[]>(`academics/classes/${sec.classId}/subjects`).subscribe({
      next: (subjects) => {
        this.modalClassSubjects = subjects;
        if (subjects.length > 0) {
          this.createClassSubjectId = subjects[0].id;
        }
      },
    });
  }

  createHomework() {
    if (!this.newHw.title || !this.newHw.description || !this.createClassSubjectId) return;
    this.creating = true;

    const payload = {
      sectionId: this.createSectionId,
      classSubjectId: this.createClassSubjectId,
      title: this.newHw.title,
      description: this.newHw.description,
      dueDate: this.newHw.dueDate,
    };

    this.api.post('homework', payload).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.toast.success(`Published homework "${this.newHw.title}"`);
        this.newHw.title = '';
        this.newHw.description = '';
        this.loadHomework();
      },
      error: () => {
        this.creating = false;
        this.toast.error('Failed to create homework');
      },
    });
  }

  exportHomeworkCsv() {
    if (!this.homeworkList.length) return;
    const sec = this.availableSections.find((s) => s.id === this.selectedSectionId);
    const filename = `Homework_${sec?.className || 'Class'}_${sec?.name || 'Sec'}.csv`;

    this.exporter.exportToCsv(
      filename,
      this.filteredHomework,
      [
        { header: 'Subject', key: 'class_subject', formatter: (cs) => cs?.subject?.name || 'Subject' },
        { header: 'Title', key: 'title' },
        { header: 'Description', key: 'description' },
        { header: 'Status', key: 'status' },
        { header: 'Assigned Date', key: 'assigned_date', formatter: (d) => new Date(d).toLocaleDateString() },
        { header: 'Due Date', key: 'due_date', formatter: (d) => new Date(d).toLocaleDateString() },
      ],
    );
    this.toast.success(`Exported ${filename}`);
  }

  printHomeworkDiary() {
    const sec = this.availableSections.find((s) => s.id === this.selectedSectionId);
    this.exporter.printReport(
      `Homework & Classwork Diary — ${sec?.displayName || 'Class'}`,
      `Total Assignments: ${this.filteredHomework.length} | Academic Term 2026`,
      this.filteredHomework,
      [
        { header: 'Subject', key: 'class_subject', formatter: (cs) => cs?.subject?.name || 'Subject' },
        { header: 'Title', key: 'title' },
        { header: 'Description', key: 'description' },
        { header: 'Due Date', key: 'due_date', formatter: (d) => new Date(d).toLocaleDateString() },
      ],
    );
  }
}
