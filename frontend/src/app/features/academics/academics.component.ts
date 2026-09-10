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
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Academic Structure & Roster</h1>
          <p class="text-xs text-slate-500 mt-0.5">Manage classes, subject curriculum, and student enrollments.</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="openAddSubjectModal()"
                  class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-2 active:scale-[0.99] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      <!-- Tabbed Navigation / 3 Clay Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        <!-- Classes Hierarchy -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span>Classes & Grades ({{ classes.length }})</span>
            </h3>
            <span class="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-xl border border-slate-200 shadow-xs">Pre-K to 12</span>
          </div>
          <p class="text-[11px] text-slate-400 mb-3">Click any class to view its sections & student directory below.</p>
          <div class="space-y-2 overflow-y-auto max-h-80 pr-1">
            <div *ngFor="let c of classes"
                 (click)="selectClass(c)"
                 [class.bg-[#f8fafc]]="selectedClass?.id === c.id"
                 [class.border-slate-800]="selectedClass?.id === c.id"
                 [class.shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff]]="selectedClass?.id === c.id"
                 [class.border-slate-200]="selectedClass?.id !== c.id"
                 [class.bg-white]="selectedClass?.id !== c.id"
                 class="p-3 rounded-2xl border hover:border-slate-400 transition-all cursor-pointer flex items-center justify-between shadow-xs">
              <div>
                <div class="text-xs font-bold text-slate-900">{{ c.name }}</div>
                <div class="text-[10px] text-slate-400 font-mono">Code: {{ c.code }}</div>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-xs"
                      [class.bg-slate-900]="selectedClass?.id === c.id"
                      [class.text-white]="selectedClass?.id === c.id"
                      [class.bg-slate-100]="selectedClass?.id !== c.id"
                      [class.text-slate-600]="selectedClass?.id !== c.id">
                  {{ c.sections.length || 1 }} Sec
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Subjects Curriculum (with Add / Remove) -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span>Subject Master ({{ subjects.length }})</span>
            </h3>
            <button (click)="openAddSubjectModal()"
                    class="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5 rounded-xl transition-all cursor-pointer shadow-xs">
              + New
            </button>
          </div>
          <p class="text-[11px] text-slate-400 mb-3">School-wide academic & elective curriculum.</p>
          <div class="space-y-2 overflow-y-auto max-h-80 pr-1">
            <div *ngFor="let s of subjects" class="group p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-xs">
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-slate-900 truncate">{{ s.name }}</div>
                <div class="text-[10px] text-slate-400 font-mono">Code: {{ s.code }}</div>
              </div>
              <div class="flex items-center gap-2 ml-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  {{ s.subject_type }}
                </span>
                <button (click)="confirmDeleteSubject(s, $event)"
                        title="Delete Subject"
                        class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Teacher Subject Assignments -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>Faculty Assignments</span>
            </h3>
            <span class="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-xl border border-slate-200 shadow-xs">
              {{ selectedClass?.name || 'Class 8' }} Scope
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mb-3">Class teachers and subject mentors.</p>
          <div class="space-y-2.5 overflow-y-auto max-h-80 pr-1">
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-[#f8fafc] shadow-xs">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-900">Rahul Sharma</div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded-lg">Class Teacher</span>
              </div>
              <div class="text-xs text-slate-600 mt-1.5">{{ selectedClass?.name || 'Class 8' }} - Section {{ selectedSection?.name || 'A' }}</div>
              <div class="text-[11px] text-indigo-700 font-semibold mt-1">
                Subject: Mathematics (MATH)
              </div>
            </div>
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-[#f8fafc] shadow-xs">
              <div class="flex items-center justify-between">
                <div class="text-xs font-bold text-slate-900">Anita Desai</div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-lg">Subject Teacher</span>
              </div>
              <div class="text-xs text-slate-600 mt-1.5">{{ selectedClass?.name || 'Class 8' }} - Section {{ selectedSection?.name || 'A' }}</div>
              <div class="text-[11px] text-emerald-700 font-semibold mt-1">
                Subject: Science (SCI)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enrolled Students Directory with Clay Table & Pagination -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
        <div class="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc]">
          <div class="flex items-center gap-3 flex-wrap">
            <h3 class="text-xs sm:text-sm font-bold text-slate-900">
              {{ selectedClass?.name || 'Class 8' }} - Section {{ selectedSection?.name || 'A' }} Student Directory
            </h3>
            
            <!-- Section switch pills -->
            <div *ngIf="selectedClass && selectedClass.sections && selectedClass.sections.length > 0" class="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
              <button *ngFor="let sec of selectedClass.sections"
                      (click)="selectSection(sec)"
                      [class.bg-slate-900]="selectedSection?.id === sec.id"
                      [class.text-white]="selectedSection?.id === sec.id"
                      [class.text-slate-600]="selectedSection?.id !== sec.id"
                      class="px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer">
                Sec {{ sec.name }}
              </button>
            </div>

            <span class="text-xs text-slate-400 font-medium">({{ filteredStudents.length }} Students)</span>
          </div>

          <!-- Search filter & Enterprise Export Buttons -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div class="w-full sm:w-56">
              <input type="text" [(ngModel)]="searchQuery" (input)="currentPage = 1" placeholder="Search name or roll..."
                     class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <button (click)="exportDirectoryCsv()" [disabled]="students.length === 0"
                    class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer disabled:opacity-40">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>CSV</span>
            </button>
            
            <button (click)="printStudentDirectory()" [disabled]="students.length === 0"
                    class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer disabled:opacity-40">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead class="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider">
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

        <!-- Table Pagination Footer -->
        <div class="px-5 py-3.5 border-t border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span>Rows per page:</span>
            <select [(ngModel)]="pageSize" (change)="currentPage = 1"
                    class="px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none shadow-xs">
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            <span class="text-slate-500">Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredStudents.length }} students</span>
          </div>

          <div class="flex items-center gap-1.5 self-end sm:self-auto">
            <button (click)="currentPage = currentPage - 1" [disabled]="currentPage === 1"
                    class="px-3 py-1 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all shadow-xs cursor-pointer">
              ‹ Prev
            </button>
            <span class="px-3 py-1 font-bold text-slate-800">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
            <button (click)="currentPage = currentPage + 1" [disabled]="currentPage >= totalPages"
                    class="px-3 py-1 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all shadow-xs cursor-pointer">
              Next ›
            </button>
          </div>
        </div>
      </div>

      <!-- Add Subject Modal -->
      <div *ngIf="showAddSubjectModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Add New Subject</h3>
              <p class="text-xs text-slate-500 mt-0.5">Register a curriculum subject for this campus.</p>
            </div>
            <button (click)="showAddSubjectModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
              <input type="text" [(ngModel)]="newSubject.name" placeholder="e.g. Artificial Intelligence & Robotics"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                <input type="text" [(ngModel)]="newSubject.code" placeholder="e.g. AIR01"
                       class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Subject Type</label>
                <select [(ngModel)]="newSubject.subjectType"
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
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
              <label class="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <textarea [(ngModel)]="newSubject.description" rows="2" placeholder="Curriculum syllabus overview..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]"></textarea>
            </div>
          </div>

          <div *ngIf="subjectModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
            {{ subjectModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showAddSubjectModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="saveSubject()" [disabled]="savingSubject"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 cursor-pointer">
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
      // Scope classes for Teacher
      const teacherClassNames = new Set<string>();
      const teachingScope = this.auth.currentUser()?.teachingScope;
      if (teachingScope) {
        teachingScope.classTeacherSections?.forEach((cts) => teacherClassNames.add(cts.className.toLowerCase()));
        teachingScope.subjectAssignments?.forEach((sa) => teacherClassNames.add(sa.className.toLowerCase()));
      }

      if (this.auth.isTeacher() && teacherClassNames.size > 0) {
        this.classes = res.filter((c) => teacherClassNames.has(c.name.toLowerCase()));
      } else {
        this.classes = res;
      }

      if (this.classes.length > 0) {
        this.selectClass(this.classes[0]);
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


