import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { ClassItem, SubjectItem, StudentItem, SectionItem } from '../../core/models';

interface StaffMember {
  id: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  roleName?: string;
  classTeacherSections?: { sectionId: string; sectionName: string; className: string }[];
  subjectAssignments?: { sectionId: string; sectionName: string; className: string; subjectName: string; subjectCode: string }[];
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <!-- Dynamic Section Indicator -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs">
              Academics & Directory
            </span>
            <span class="text-xs text-slate-300">•</span>
            <span *ngIf="activeTab === 'STUDENTS'" class="text-xs font-bold text-slate-600">Classes & Student Roster</span>
            <span *ngIf="activeTab === 'STAFF'" class="text-xs font-bold text-slate-600">Faculty & Staff Directory</span>
            <span *ngIf="activeTab === 'SUBJECTS'" class="text-xs font-bold text-slate-600">Curriculum Subjects Master</span>
          </div>

          <h1 *ngIf="activeTab === 'STUDENTS'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Classes & Student Roster
          </h1>
          <h1 *ngIf="activeTab === 'STAFF'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Faculty & Staff Directory
          </h1>
          <h1 *ngIf="activeTab === 'SUBJECTS'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Curriculum Subjects Master
          </h1>

          <p *ngIf="activeTab === 'STUDENTS'" class="text-xs text-slate-500 mt-0.5">
            Manage grade levels, section capacities, student enrollments, and parent guardian records.
          </p>
          <p *ngIf="activeTab === 'STAFF'" class="text-xs text-slate-500 mt-0.5">
            Manage teaching faculty, staff roles, login credentials, and class teacher allocations.
          </p>
          <p *ngIf="activeTab === 'SUBJECTS'" class="text-xs text-slate-500 mt-0.5">
            Manage subject codes, theory/practical grading weights, and institutional course masters.
          </p>
        </div>

        <!-- Action Buttons Contextual to Active View -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button *ngIf="canManage && activeTab === 'STUDENTS'" (click)="openAddStudentModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>+ Add Student / Child</span>
          </button>

          <button *ngIf="canManage && activeTab === 'STAFF'" (click)="openAddStaffModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Faculty / Principal</span>
          </button>

          <button *ngIf="canManage && activeTab === 'SUBJECTS'" (click)="openAddSubjectModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>+ Add Subject</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 1: CLASSES & STUDENT ROSTER                                -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'STUDENTS'" class="space-y-6">
        <!-- Top Class Cards Quick Selector -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div *ngFor="let c of classes"
               (click)="selectClass(c)"
               [class.bg-slate-900]="selectedClass?.id === c.id"
               [class.text-white]="selectedClass?.id === c.id"
               [class.border-slate-900]="selectedClass?.id === c.id"
               [class.shadow-md]="selectedClass?.id === c.id"
               [class.bg-white]="selectedClass?.id !== c.id"
               [class.text-slate-800]="selectedClass?.id !== c.id"
               [class.border-slate-200]="selectedClass?.id !== c.id"
               class="p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:border-slate-400 shadow-xs">
            <div class="text-xs font-black truncate">{{ c.name }}</div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t text-[10px]"
                 [ngClass]="selectedClass?.id === c.id ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-400'">
              <span>{{ c.sections.length || 1 }} Sec</span>
              <span class="font-mono font-bold">{{ c.code }}</span>
            </div>
          </div>
        </div>

        <!-- Enrolled Students Directory with Clay Table & Pagination -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <div class="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc]">
            <div class="flex items-center gap-3 flex-wrap">
              <h3 class="text-xs sm:text-sm font-black text-slate-900">
                {{ selectedClass?.name || 'Class' }} - {{ formatSection(selectedSection?.name) }} Roster
              </h3>
              
              <!-- Section switch pills -->
              <div *ngIf="selectedClass && selectedClass.sections && selectedClass.sections.length > 0" class="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
                <button *ngFor="let sec of selectedClass.sections"
                        (click)="selectSection(sec)"
                        [class.bg-slate-900]="selectedSection?.id === sec.id"
                        [class.text-white]="selectedSection?.id === sec.id"
                        [class.text-slate-600]="selectedSection?.id !== sec.id"
                        class="px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer">
                  {{ formatSection(sec.name) }}
                </button>
              </div>

              <span class="text-xs text-slate-400 font-medium">({{ filteredStudents.length }} Students)</span>
            </div>

            <!-- Search filter & Export Buttons -->
            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div class="w-full sm:w-56">
                <input type="text" [(ngModel)]="searchQuery" (input)="currentPage = 1" placeholder="Search student name/roll..."
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
                  <th class="px-6 py-3.5">Guardian Phone</th>
                  <th class="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let st of paginatedStudents" class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-3.5 font-bold text-slate-900">#{{ st.rollNumber || '—' }}</td>
                  <td class="px-6 py-3.5 text-slate-500 font-mono">{{ st.admissionNumber }}</td>
                  <td class="px-6 py-3.5 font-bold text-slate-800">{{ st.fullName }}</td>
                  <td class="px-6 py-3.5 text-slate-600">{{ st.className }} - {{ formatSection(st.sectionName) }}</td>
                  <td class="px-6 py-3.5 text-slate-700 font-semibold">
                    {{ st.primaryContact?.first_name }} {{ st.primaryContact?.last_name || '' }}
                  </td>
                  <td class="px-6 py-3.5 text-slate-500 font-mono">{{ st.primaryContact?.phone || '—' }}</td>
                  <td class="px-6 py-3.5">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  </td>
                </tr>
                <tr *ngIf="paginatedStudents.length === 0">
                  <td colspan="7" class="px-6 py-10 text-center text-slate-400 text-xs">
                    No students found in this section. Click "+ Add Student / Child" to enroll children.
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
      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: FACULTY & STAFF DIRECTORY (Principals & Teachers)       -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'STAFF'" class="space-y-6">
        <!-- Faculty Roster Cards / Table -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <div class="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc]">
            <div>
              <h3 class="text-sm font-black text-slate-900">Institutional Faculty & Staff Directory</h3>
              <p class="text-xs text-slate-500">School Principals, Class Teachers, Subject Teachers, and School Administrators.</p>
            </div>

            <div class="flex items-center gap-2">
              <input type="text" [(ngModel)]="staffSearchQuery" placeholder="Search staff name or role..."
                     class="w-56 px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead class="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Staff Member</th>
                  <th class="px-6 py-3.5">Role Designation</th>
                  <th class="px-6 py-3.5">Contact Details</th>
                  <th class="px-6 py-3.5">Class Teacher Incharge</th>
                  <th class="px-6 py-3.5">Teaching Subject Allocations</th>
                  <th class="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let staff of filteredStaff" class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {{ staff.firstName.charAt(0) }}
                      </div>
                      <div>
                        <div class="font-black text-slate-900">{{ staff.fullName }}</div>
                        <div class="text-[10px] text-slate-400 font-mono">ID: {{ staff.id.slice(0, 8) }}...</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shadow-xs"
                          [ngClass]="{
                            'bg-purple-50 text-purple-700 border-purple-200': staff.role === 'PRINCIPAL',
                            'bg-indigo-50 text-indigo-700 border-indigo-200': staff.role === 'SCHOOL_ADMIN',
                            'bg-emerald-50 text-emerald-700 border-emerald-200': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                            'bg-blue-50 text-blue-700 border-blue-200': staff.role === 'TEACHER'
                          }">
                      {{ staff.role === 'PRINCIPAL' ? 'Principal' : (staff.role === 'SCHOOL_ADMIN' ? 'School Admin' : (staff.classTeacherSections?.length ? 'Class Teacher' : 'Teacher')) }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="text-slate-800 font-semibold">{{ staff.email }}</div>
                    <div class="text-slate-500 font-mono text-[11px]">{{ staff.phone || '—' }}</div>
                  </td>
                  <td class="px-6 py-3.5">
                    <div *ngIf="staff.classTeacherSections && staff.classTeacherSections.length > 0">
                      <span *ngFor="let cts of staff.classTeacherSections"
                            class="inline-block px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold mr-1">
                        {{ cts.className }} - {{ cts.sectionName }}
                      </span>
                    </div>
                    <span *ngIf="!staff.classTeacherSections || staff.classTeacherSections.length === 0" class="text-slate-400 text-xs">—</span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div *ngIf="staff.subjectAssignments && staff.subjectAssignments.length > 0" class="flex flex-wrap gap-1">
                      <span *ngFor="let sa of staff.subjectAssignments"
                            class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {{ sa.subjectName }} ({{ sa.className }}-{{ sa.sectionName }})
                      </span>
                    </div>
                    <span *ngIf="!staff.subjectAssignments || staff.subjectAssignments.length === 0" class="text-slate-400 text-xs">—</span>
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredStaff.length === 0">
                  <td colspan="6" class="px-6 py-10 text-center text-slate-400 text-xs">
                    No faculty staff found. Click "+ Add Faculty / Principal" to register school staff.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 3: CURRICULUM SUBJECTS MASTER                              -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'SUBJECTS'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let s of subjects"
               class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-white">
                  {{ s.code }}
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  {{ s.subject_type }}
                </span>
              </div>
              <h3 class="text-sm font-black text-slate-900 mt-1">{{ s.name }}</h3>
              <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">{{ s.description || 'Standard institutional curriculum subject.' }}</p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Active Curriculum
              </span>
              <button *ngIf="canManage" (click)="confirmDeleteSubject(s, $event)"
                      class="text-xs font-bold text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: ADD STUDENT / CHILD                                   -->
      <!-- ============================================================== -->
      <div *ngIf="showAddStudentModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Enroll New Student / Child</h3>
              <p class="text-xs text-slate-500 mt-0.5">Create student record, assign class section, and link guardian profile.</p>
            </div>
            <button (click)="showAddStudentModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900">
              <strong class="font-bold">Student Profile Details</strong>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">First Name *</label>
                <input type="text" [(ngModel)]="newStudent.firstName" placeholder="e.g. Aryan"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Last Name</label>
                <input type="text" [(ngModel)]="newStudent.lastName" placeholder="e.g. Khan"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Admission Number *</label>
                <input type="text" [(ngModel)]="newStudent.admissionNumber" placeholder="e.g. ADM-2026-099"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Roll Number</label>
                <input type="text" [(ngModel)]="newStudent.rollNumber" placeholder="e.g. 15"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1 sm:col-span-2">
                <label class="block font-bold text-slate-700 mb-1">Enrollment Section *</label>
                <select [(ngModel)]="newStudent.sectionId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="">-- Select Class Section --</option>
                  <option *ngFor="let sec of flatSectionsList" [value]="sec.id">
                    {{ sec.className }} - {{ formatSection(sec.name) }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Gender</label>
                <select [(ngModel)]="newStudent.gender"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <input type="date" [(ngModel)]="newStudent.dateOfBirth"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Blood Group</label>
                <input type="text" [(ngModel)]="newStudent.bloodGroup" placeholder="e.g. O+, B+, A+"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- Guardian Section -->
            <div class="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 mt-2">
              <strong class="font-bold">Primary Guardian / Parent Linkage</strong>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Name</label>
                <input type="text" [(ngModel)]="newStudent.guardianName" placeholder="e.g. Tariq Khan"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Relationship</label>
                <select [(ngModel)]="newStudent.relationship"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Phone</label>
                <input type="text" [(ngModel)]="newStudent.guardianPhone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Email (For Login)</label>
                <input type="email" [(ngModel)]="newStudent.guardianEmail" placeholder="parent@demo-school.com"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>
          </div>

          <div *ngIf="studentModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
            {{ studentModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showAddStudentModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="saveStudent()" [disabled]="savingStudent"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!savingStudent">Enroll Student</span>
              <span *ngIf="savingStudent">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 2: ADD PRINCIPAL / TEACHER / STAFF                       -->
      <!-- ============================================================== -->
      <div *ngIf="showAddStaffModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Add Faculty / Principal / Staff</h3>
              <p class="text-xs text-slate-500 mt-0.5">Register staff account, set credentials, and allocate teaching responsibilities.</p>
            </div>
            <button (click)="showAddStaffModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">First Name *</label>
                <input type="text" [(ngModel)]="newStaff.firstName" placeholder="e.g. Vikram"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Last Name</label>
                <input type="text" [(ngModel)]="newStaff.lastName" placeholder="e.g. Malhotra"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Email (Username) *</label>
                <input type="email" [(ngModel)]="newStaff.email" placeholder="v.malhotra@demo-school.com"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input type="text" [(ngModel)]="newStaff.phone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Role Designation *</label>
                <select [(ngModel)]="newStaff.role"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="PRINCIPAL">Principal</option>
                  <option value="CLASS_TEACHER">Class Teacher</option>
                  <option value="TEACHER">Subject Teacher</option>
                  <option value="SCHOOL_ADMIN">School Admin</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Initial Password</label>
                <input type="text" [(ngModel)]="newStaff.password" placeholder="password123"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- Optional Class Teacher Section assignment -->
            <div *ngIf="newStaff.role === 'CLASS_TEACHER' || newStaff.role === 'TEACHER'" class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Designate as Class Teacher For (Optional)</label>
                <select [(ngModel)]="newStaff.classTeacherSectionId"
                        class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800">
                  <option value="">-- No Class Teacher Designation --</option>
                  <option *ngFor="let sec of flatSectionsList" [value]="sec.id">
                    {{ sec.className }} - {{ formatSection(sec.name) }}
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Assigned Section</label>
                  <select [(ngModel)]="newStaff.sectionId"
                          class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800">
                    <option value="">-- Select Section --</option>
                    <option *ngFor="let sec of flatSectionsList" [value]="sec.id">
                      {{ sec.className }} - {{ formatSection(sec.name) }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Assigned Subject</label>
                  <select [(ngModel)]="newStaff.subjectId"
                          class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800">
                    <option value="">-- Select Subject --</option>
                    <option *ngFor="let sub of subjects" [value]="sub.id">
                      {{ sub.name }} ({{ sub.code }})
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="staffModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
            {{ staffModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showAddStaffModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="saveStaff()" [disabled]="savingStaff"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!savingStaff">Register Staff</span>
              <span *ngIf="savingStaff">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 3: ADD SUBJECT                                           -->
      <!-- ============================================================== -->
      <div *ngIf="showAddSubjectModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Add New Subject</h3>
              <p class="text-xs text-slate-500 mt-0.5">Register a curriculum subject for this campus.</p>
            </div>
            <button (click)="showAddSubjectModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
              <input type="text" [(ngModel)]="newSubject.name" placeholder="e.g. Artificial Intelligence & Robotics"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                <input type="text" [(ngModel)]="newSubject.code" placeholder="e.g. AIR01"
                       class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Subject Type</label>
                <select [(ngModel)]="newSubject.subjectType"
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
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
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner"></textarea>
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
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer">
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
  route = inject(ActivatedRoute);
  router = inject(Router);
  
  activeTab: 'STUDENTS' | 'STAFF' | 'SUBJECTS' = 'STUDENTS';

  classes: ClassItem[] = [];
  subjects: SubjectItem[] = [];
  students: StudentItem[] = [];
  staffList: StaffMember[] = [];
  
  selectedClass: ClassItem | null = null;
  selectedSection: SectionItem | null = null;
  
  searchQuery = '';
  staffSearchQuery = '';
  currentPage = 1;
  pageSize = 25;

  // Modals state
  showAddSubjectModal = false;
  savingSubject = false;
  subjectModalError = '';
  newSubject = {
    name: '',
    code: '',
    subjectType: 'ACADEMIC',
    description: '',
  };

  showAddStudentModal = false;
  savingStudent = false;
  studentModalError = '';
  newStudent = {
    firstName: '',
    lastName: '',
    admissionNumber: '',
    rollNumber: '',
    sectionId: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    relationship: 'FATHER',
  };

  showAddStaffModal = false;
  savingStaff = false;
  staffModalError = '';
  newStaff = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    password: 'password123',
    classTeacherSectionId: '',
    sectionId: '',
    subjectId: '',
  };

  formatSection(name?: string): string {
    if (!name) return 'Section A';
    const cleaned = name.replace(/^section\s+/i, '').replace(/^sec\s+/i, '').trim();
    return cleaned ? `Section ${cleaned}` : name;
  }

  get canManage(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal();
  }

  get flatSectionsList(): { id: string; name: string; className: string }[] {
    const list: { id: string; name: string; className: string }[] = [];
    for (const c of this.classes) {
      for (const s of c.sections || []) {
        list.push({ id: s.id, name: s.name, className: c.name });
      }
    }
    return list;
  }

  get filteredStaff(): StaffMember[] {
    if (!this.staffSearchQuery.trim()) return this.staffList;
    const q = this.staffSearchQuery.toLowerCase().trim();
    return this.staffList.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.roleName && s.roleName.toLowerCase().includes(q))
    );
  }

  setTab(tab: 'STUDENTS' | 'STAFF' | 'SUBJECTS') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.toLowerCase() },
      queryParamsHandling: 'merge',
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab']?.toLowerCase();
      if (tab === 'staff') {
        this.activeTab = 'STAFF';
      } else if (tab === 'subjects') {
        this.activeTab = 'SUBJECTS';
      } else if (tab === 'students') {
        this.activeTab = 'STUDENTS';
      }
    });
    this.loadClassesAndSubjects();
    this.loadStaffList();
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

  loadStaffList() {
    this.api.get<StaffMember[]>('academics/staff').subscribe({
      next: (res) => {
        this.staffList = res;
      },
      error: () => {
        this.staffList = [];
      },
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
        (s.rollNumber && s.rollNumber.toString().includes(q))
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

  // --- Add Subject ---
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

  // --- Add Student ---
  openAddStudentModal() {
    this.newStudent = {
      firstName: '',
      lastName: '',
      admissionNumber: `ADM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      rollNumber: `${this.students.length + 1}`,
      sectionId: this.selectedSection?.id || (this.flatSectionsList[0]?.id || ''),
      gender: 'MALE',
      dateOfBirth: '2015-05-15',
      bloodGroup: 'B+',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      relationship: 'FATHER',
    };
    this.studentModalError = '';
    this.showAddStudentModal = true;
  }

  saveStudent() {
    if (!this.newStudent.firstName.trim() || !this.newStudent.admissionNumber.trim() || !this.newStudent.sectionId) {
      this.studentModalError = 'First Name, Admission Number, and Section are required.';
      return;
    }
    this.savingStudent = true;
    this.studentModalError = '';

    this.api.post('academics/students', this.newStudent).subscribe({
      next: (res: any) => {
        this.savingStudent = false;
        this.showAddStudentModal = false;
        this.toast.success(`Student ${res.fullName || this.newStudent.firstName} enrolled successfully!`);
        if (this.selectedSection?.id === this.newStudent.sectionId) {
          this.selectSection(this.selectedSection);
        } else {
          const targetSec = this.flatSectionsList.find((s) => s.id === this.newStudent.sectionId);
          if (targetSec) {
            const cls = this.classes.find((c) => c.sections.some((s) => s.id === targetSec.id));
            if (cls) {
              this.selectedClass = cls;
              const sec = cls.sections.find((s) => s.id === targetSec.id);
              if (sec) this.selectSection(sec);
            }
          }
        }
      },
      error: (err) => {
        this.savingStudent = false;
        this.studentModalError = err.error?.message || 'Failed to enroll student. Please verify admission number.';
      },
    });
  }

  // --- Add Staff ---
  openAddStaffModal() {
    this.newStaff = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'TEACHER',
      password: 'password123',
      classTeacherSectionId: '',
      sectionId: '',
      subjectId: '',
    };
    this.staffModalError = '';
    this.showAddStaffModal = true;
  }

  saveStaff() {
    if (!this.newStaff.firstName.trim() || !this.newStaff.email.trim() || !this.newStaff.role) {
      this.staffModalError = 'First Name, Email, and Role are required.';
      return;
    }
    this.savingStaff = true;
    this.staffModalError = '';

    this.api.post('academics/staff', this.newStaff).subscribe({
      next: (res: any) => {
        this.savingStaff = false;
        this.showAddStaffModal = false;
        this.toast.success(`Staff member ${res.firstName} registered successfully!`);
        this.loadStaffList();
      },
      error: (err) => {
        this.savingStaff = false;
        this.staffModalError = err.error?.message || 'Failed to register staff. Please verify email uniqueness.';
      },
    });
  }

  exportDirectoryCsv() {
    const className = this.selectedClass?.name || 'Class';
    const sectionName = this.formatSection(this.selectedSection?.name);
    const rows = this.students.map((st) => ({
      rollNumber: st.rollNumber,
      admissionNumber: st.admissionNumber,
      fullName: st.fullName,
      classSection: `${st.className} - ${this.formatSection(st.sectionName)}`,
      guardian: `${st.primaryContact?.first_name || ''} ${st.primaryContact?.last_name || ''}`.trim(),
      phone: st.primaryContact?.phone || '',
    }));

    this.exportService.exportToCsv(
      `Student_Directory_${className}_${sectionName.replace(/\s+/g, '_')}`,
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
    const sectionFormatted = this.formatSection(this.selectedSection?.name);

    const rowsHtml = this.students
      .map(
        (st) => `
        <tr>
          <td>#${st.rollNumber}</td>
          <td>${st.admissionNumber}</td>
          <td><strong>${st.fullName}</strong></td>
          <td>${st.className} - ${this.formatSection(st.sectionName)}</td>
          <td>${st.primaryContact?.first_name || ''} ${st.primaryContact?.last_name || ''}</td>
          <td>${st.primaryContact?.phone || '—'}</td>
        </tr>`
      )
      .join('');

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        <strong>Class:</strong> ${className} - ${sectionFormatted} | <strong>Total Enrolled:</strong> ${this.students.length} Students
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

    this.exportService.printReport(`Student Roster - ${className} ${sectionFormatted}`, schoolName, tableHtml);
  }
}
