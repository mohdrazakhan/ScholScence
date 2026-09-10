import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { ClassItem, SubjectItem, StudentItem, SectionItem } from '../../core/models';

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Academic Structure & Roster</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage classes, subject curriculum, and student enrollments.</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="openAddSubjectModal()"
                  class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5">
            <span>+ Add Subject</span>
          </button>
        </div>
      </div>

      <!-- Tabbed Navigation / Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Classes Hierarchy -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>Classes & Grades ({{ classes.length }})</span>
            <span class="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Pre-K to 12</span>
          </h3>
          <p class="text-[11px] text-slate-400 mb-2">Click any class to view its sections & student directory below.</p>
          <div class="space-y-1.5 overflow-y-auto max-h-80 pr-1">
            <div *ngFor="let c of classes"
                 (click)="selectClass(c)"
                 [class.border-indigo-500]="selectedClass?.id === c.id"
                 [class.bg-indigo-50]="selectedClass?.id === c.id"
                 [class.border-slate-100]="selectedClass?.id !== c.id"
                 class="p-2.5 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer flex items-center justify-between">
              <div>
                <div class="text-xs font-bold text-slate-800">{{ c.name }}</div>
                <div class="text-[10px] text-slate-400">Code: {{ c.code }}</div>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded"
                      [class.bg-indigo-600]="selectedClass?.id === c.id"
                      [class.text-white]="selectedClass?.id === c.id"
                      [class.bg-slate-100]="selectedClass?.id !== c.id"
                      [class.text-slate-600]="selectedClass?.id !== c.id">
                  {{ c.sections.length || 1 }} Section{{ (c.sections.length || 1) > 1 ? 's' : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Subjects Curriculum (with Add / Remove) -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Subject Master ({{ subjects.length }})</span>
            </h3>
            <button (click)="openAddSubjectModal()"
                    class="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors">
              + New
            </button>
          </div>
          <p class="text-[11px] text-slate-400 mb-2">School-wide academic & elective curriculum.</p>
          <div class="space-y-1.5 overflow-y-auto max-h-80 pr-1">
            <div *ngFor="let s of subjects" class="group p-2.5 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-slate-800 truncate">{{ s.name }}</div>
                <div class="text-[10px] text-slate-400">Code: {{ s.code }}</div>
              </div>
              <div class="flex items-center gap-2 ml-2">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {{ s.subject_type }}
                </span>
                <button (click)="confirmDeleteSubject(s, $event)"
                        title="Delete Subject"
                        class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Teacher Subject Assignments -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 class="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>Faculty Assignments</span>
            <span class="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
              {{ selectedClass?.name || 'Class 8' }} Scope
            </span>
          </h3>
          <p class="text-[11px] text-slate-400 mb-2">Class teachers and subject mentors.</p>
          <div class="space-y-2.5 overflow-y-auto max-h-80 pr-1">
            <div class="p-3 rounded-lg border border-violet-100 bg-violet-50/30">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-900">Rahul Sharma</div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 bg-violet-600 text-white rounded">Class Teacher</span>
              </div>
              <div class="text-xs text-slate-600 mt-1.5">{{ selectedClass?.name || 'Class 8' }} - Section {{ selectedSection?.name || 'A' }}</div>
              <div class="text-[11px] text-violet-700 font-medium mt-1">
                Subject: Mathematics (MATH)
              </div>
            </div>
            <div class="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-900">Anita Desai</div>
                <span class="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">Subject Teacher</span>
              </div>
              <div class="text-xs text-slate-600 mt-1.5">{{ selectedClass?.name || 'Class 8' }} - Section {{ selectedSection?.name || 'A' }}</div>
              <div class="text-[11px] text-emerald-700 font-medium mt-1">
                Subject: Science (SCI)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enrolled Students Directory with FretBox Export & Pagination -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div class="flex items-center gap-3 flex-wrap">
            <h3 class="text-sm font-bold text-slate-900">
              {{ selectedClass?.name || 'Class 8' }} - Section {{ selectedSection?.name || 'A' }} Student Directory
            </h3>
            
            <!-- Section switch buttons if class has multiple sections -->
            <div *ngIf="selectedClass && selectedClass.sections && selectedClass.sections.length > 0" class="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg">
              <button *ngFor="let sec of selectedClass.sections"
                      (click)="selectSection(sec)"
                      [class.bg-indigo-600]="selectedSection?.id === sec.id"
                      [class.text-white]="selectedSection?.id === sec.id"
                      [class.text-slate-600]="selectedSection?.id !== sec.id"
                      class="px-2.5 py-0.5 text-xs font-bold rounded transition-colors">
                Sec {{ sec.name }}
              </button>
            </div>

            <span class="text-xs text-slate-500 font-medium">({{ filteredStudents.length }} Students)</span>
          </div>

          <!-- Search filter & Enterprise Export Buttons -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div class="w-full sm:w-56">
              <input type="text" [(ngModel)]="searchQuery" (input)="currentPage = 1" placeholder="Search name or roll no..."
                     class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm" />
            </div>

            <button (click)="exportDirectoryCsv()" [disabled]="students.length === 0"
                    class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors flex-shrink-0">
              <span>📥 CSV</span>
            </button>
            
            <button (click)="printStudentDirectory()" [disabled]="students.length === 0"
                    class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors flex-shrink-0">
              <span>🖨 Print</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th class="px-6 py-3.5">Roll No</th>
                <th class="px-6 py-3.5">Admission No</th>
                <th class="px-6 py-3.5">Student Name</th>
                <th class="px-6 py-3.5">Class & Section</th>
                <th class="px-6 py-3.5">Primary Guardian</th>
                <th class="px-6 py-3.5">Contact Phone</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let st of paginatedStudents" class="hover:bg-slate-50/80 transition-colors">
                <td class="px-6 py-3.5 font-bold text-slate-900">#{{ st.rollNumber }}</td>
                <td class="px-6 py-3.5 text-slate-500 font-mono">{{ st.admissionNumber }}</td>
                <td class="px-6 py-3.5 font-bold text-slate-800">{{ st.fullName }}</td>
                <td class="px-6 py-3.5 text-slate-600">{{ st.className }} - Section {{ st.sectionName }}</td>
                <td class="px-6 py-3.5 text-slate-700 font-semibold">
                  {{ st.primaryContact?.first_name }} {{ st.primaryContact?.last_name || '' }}
                </td>
                <td class="px-6 py-3.5 text-slate-500 font-mono">{{ st.primaryContact?.phone || '—' }}</td>
              </tr>
              <tr *ngIf="paginatedStudents.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-slate-400 text-xs">
                  No students found in this section matching your search.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Pagination Footer (FretBox style) -->
        <div class="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span>Rows per page:</span>
            <select [(ngModel)]="pageSize" (change)="currentPage = 1"
                    class="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            <span>Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredStudents.length }} students</span>
          </div>

          <div class="flex items-center gap-1 self-end sm:self-auto">
            <button (click)="currentPage = currentPage - 1" [disabled]="currentPage === 1"
                    class="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold">
              ‹ Prev
            </button>
            <span class="px-3 py-1 font-bold text-slate-800">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
            <button (click)="currentPage = currentPage + 1" [disabled]="currentPage >= totalPages"
                    class="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold">
              Next ›
            </button>
          </div>
        </div>
      </div>

      <!-- Add Subject Modal -->
      <div *ngIf="showAddSubjectModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Add New Subject</h3>
              <p class="text-xs text-slate-500 mt-0.5">Register a curriculum subject for this campus.</p>
            </div>
            <button (click)="showAddSubjectModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
              <input type="text" [(ngModel)]="newSubject.name" placeholder="e.g. Artificial Intelligence & Robotics"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Subject Code *</label>
                <input type="text" [(ngModel)]="newSubject.code" placeholder="e.g. AIR01"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Subject Type</label>
                <select [(ngModel)]="newSubject.subjectType"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500">
                  <option value="ACADEMIC">Academic / Core</option>
                  <option value="LANGUAGE">Language</option>
                  <option value="ELECTIVE">Elective / Skill</option>
                  <option value="LAB">Lab & Practical</option>
                  <option value="ACTIVITY">Co-Curricular</option>
                  <option value="VOCATIONAL">Vocational</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
              <textarea [(ngModel)]="newSubject.description" rows="2" placeholder="Curriculum syllabus overview..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"></textarea>
            </div>
          </div>

          <div *ngIf="subjectModalError" class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
            {{ subjectModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="showAddSubjectModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button (click)="saveSubject()" [disabled]="savingSubject"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
              <span *ngIf="!savingSubject">Create Subject</span>
              <span *ngIf="savingSubject">Saving...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AcademicsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exportService = inject(ExportService);
  
  classes: ClassItem[] = [];
  subjects: SubjectItem[] = [];
  students: StudentItem[] = [];
  
  selectedClass: ClassItem | null = null;
  selectedSection: SectionItem | null = null;
  
  searchQuery = '';
  currentPage = 1;
  pageSize = 25;

  showAddSubjectModal = false;
  savingSubject = false;
  subjectModalError = '';

  newSubject = {
    name: '',
    code: '',
    subjectType: 'ACADEMIC',
    description: '',
  };

  ngOnInit() {
    this.loadClassesAndSubjects();
  }

  loadClassesAndSubjects() {
    this.api.get<ClassItem[]>('academics/classes').subscribe((res) => {
      this.classes = res;
      if (res.length > 0) {
        // Default to Class 8 or first available class
        const defaultClass = res.find((c) => c.name.includes('Class 8')) || res[0];
        this.selectClass(defaultClass);
      }
    });

    this.api.get<SubjectItem[]>('academics/subjects').subscribe((res) => {
      this.subjects = res;
    });
  }

  selectClass(c: ClassItem) {
    this.selectedClass = c;
    if (c.sections && c.sections.length > 0) {
      this.selectSection(c.sections[0]);
    } else {
      this.selectedSection = null;
      this.students = [];
    }
  }

  selectSection(sec: SectionItem) {
    this.selectedSection = sec;
    this.api.get<StudentItem[]>(`academics/sections/${sec.id}/students`).subscribe((res) => {
      this.students = res;
      this.currentPage = 1;
    });
  }

  get filteredStudents(): StudentItem[] {
    if (!this.searchQuery.trim()) return this.students;
    const q = this.searchQuery.toLowerCase().trim();
    return this.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.rollNumber.toString().includes(q)
    );
  }

  get paginatedStudents(): StudentItem[] {
    const list = this.filteredStudents;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredStudents.length);
  }

  openAddSubjectModal() {
    this.newSubject = {
      name: '',
      code: '',
      subjectType: 'ACADEMIC',
      description: '',
    };
    this.subjectModalError = '';
    this.showAddSubjectModal = true;
  }

  saveSubject() {
    if (!this.newSubject.name.trim() || !this.newSubject.code.trim()) {
      this.subjectModalError = 'Please enter both Subject Name and Subject Code.';
      return;
    }
    this.savingSubject = true;
    this.subjectModalError = '';

    this.api.post<SubjectItem>('academics/subjects', this.newSubject).subscribe({
      next: (created) => {
        this.savingSubject = false;
        this.showAddSubjectModal = false;
        this.subjects.push(created);
        this.toast.success(`Subject "${created.name}" (${created.code}) created successfully!`);
      },
      error: (err) => {
        this.savingSubject = false;
        this.subjectModalError = err.error?.message || 'Failed to create subject. Please check code uniqueness.';
      },
    });
  }

  confirmDeleteSubject(subject: SubjectItem, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to remove the subject "${subject.name}" (${subject.code})?`)) {
      this.api.delete(`academics/subjects/${subject.id}`).subscribe({
        next: () => {
          this.subjects = this.subjects.filter((s) => s.id !== subject.id);
          this.toast.success(`Subject "${subject.name}" removed successfully.`);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to delete subject.');
        },
      });
    }
  }

  exportDirectoryCsv() {
    const className = this.selectedClass?.name || 'Class';
    const sectionName = this.selectedSection?.name || 'A';
    const rows = this.students.map((st) => ({
      rollNumber: st.rollNumber,
      admissionNumber: st.admissionNumber,
      fullName: st.fullName,
      classSection: `${st.className} - Section ${st.sectionName}`,
      guardian: `${st.primaryContact?.first_name || ''} ${st.primaryContact?.last_name || ''}`.trim(),
      phone: st.primaryContact?.phone || '',
    }));

    this.exportService.exportToCsv(
      `Student_Directory_${className}_Sec_${sectionName}`,
      rows,
      [
        { key: 'rollNumber', label: 'Roll No' },
        { key: 'admissionNumber', label: 'Admission Number' },
        { key: 'fullName', label: 'Student Full Name' },
        { key: 'classSection', label: 'Class & Section' },
        { key: 'guardian', label: 'Primary Guardian' },
        { key: 'phone', label: 'Guardian Phone' },
      ]
    );
    this.toast.success('Student roster CSV downloaded!');
  }

  printStudentDirectory() {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Campus';
    const className = this.selectedClass?.name || 'Class';
    const sectionName = this.selectedSection?.name || 'A';

    const rowsHtml = this.students
      .map(
        (st) => `
        <tr>
          <td>#${st.rollNumber}</td>
          <td>${st.admissionNumber}</td>
          <td><strong>${st.fullName}</strong></td>
          <td>${st.className} - Section ${st.sectionName}</td>
          <td>${st.primaryContact?.first_name || ''} ${st.primaryContact?.last_name || ''}</td>
          <td>${st.primaryContact?.phone || '—'}</td>
        </tr>`
      )
      .join('');

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        <strong>Class:</strong> ${className} - Section ${sectionName} | <strong>Total Enrolled:</strong> ${this.students.length} Students
      </div>
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Admission No</th>
            <th>Student Name</th>
            <th>Class & Section</th>
            <th>Guardian Name</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    this.exportService.printReport(`Student Roster - ${className} Section ${sectionName}`, schoolName, tableHtml);
  }
}


