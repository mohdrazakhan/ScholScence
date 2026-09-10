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
          <h1 class="text-xl font-bold text-slate-900">Homework & Classwork</h1>
          <p class="text-xs text-slate-500 mt-0.5">Assign coursework, set deadlines, and manage parent notifications.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <!-- Class & Section Selector -->
          <div *ngIf="!auth.isParent()" class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-500">Section:</span>
            <select [(ngModel)]="selectedSectionId" (change)="onSectionChange()"
                    class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-indigo-500">
              <option *ngFor="let sec of availableSections" [value]="sec.id">
                {{ sec.displayName }}
              </option>
            </select>
          </div>

          <button *ngIf="homeworkList.length > 0" (click)="exportHomeworkCsv()"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>📥 Export Excel</span>
          </button>
          <button *ngIf="homeworkList.length > 0" (click)="printHomeworkDiary()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>🖨 Print Diary</span>
          </button>

          <button *ngIf="!auth.isParent()" (click)="openCreateModal()"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors flex items-center gap-1.5">
            <span>+ Create Homework</span>
          </button>
        </div>
      </div>

      <!-- Filter / Search Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search homework topic or description..."
                 class="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 w-72" />
        </div>
        <div class="text-xs text-slate-500">
          Showing <strong class="text-slate-800">{{ filteredHomework.length }}</strong> assignments
        </div>
      </div>

      <!-- Homework List Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div *ngFor="let hw of filteredHomework" class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-4">
              <div>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  {{ hw.class_subject?.subject?.name || 'Academic Subject' }}
                </span>
                <h3 class="text-base font-bold text-slate-900 mt-2">{{ hw.title }}</h3>
              </div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
                {{ hw.status }}
              </span>
            </div>

            <p class="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {{ hw.description }}
            </p>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Assigned: <span class="font-semibold text-slate-700">{{ hw.assigned_date | date:'mediumDate' }}</span>
            </div>
            <div>
              Due: <span class="font-bold text-rose-600">{{ hw.due_date | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="filteredHomework.length === 0" class="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center">
          <p class="text-slate-400 text-xs">No homework assignments found matching your filter.</p>
        </div>
      </div>

      <!-- Create Homework Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Create New Homework</h3>
            <button (click)="showCreateModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Target Section</label>
              <select [(ngModel)]="createSectionId" (change)="onModalSectionChange()"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500">
                <option *ngFor="let sec of availableSections" [value]="sec.id">
                  {{ sec.displayName }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <select [(ngModel)]="createClassSubjectId"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500">
                <option *ngFor="let cs of modalClassSubjects" [value]="cs.id">
                  {{ cs.subject.name }} ({{ cs.subject.code }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Homework Title *</label>
              <input type="text" [(ngModel)]="newHw.title" placeholder="e.g. Chapter 4 Exercises & Q1 to Q10"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Description & Instructions *</label>
              <textarea [(ngModel)]="newHw.description" rows="3" placeholder="Provide instructions for students..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input type="date" [(ngModel)]="newHw.dueDate"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="showCreateModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button (click)="createHomework()" [disabled]="creating || !newHw.title || !newHw.description"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
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
    this.loadSections();
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

        if (flat.length > 0) {
          const defaultSec = flat.find((s) => s.displayName.includes('Class 8 - Section A')) || flat[0];
          this.selectedSectionId = defaultSec.id;
          this.createSectionId = defaultSec.id;
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
