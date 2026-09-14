import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { ModalService } from '../../core/services/modal.service';
import { ClassItem, SubjectItem, StudentItem, SectionItem, AcademicSession, AlumniStudent, StudentDeactivationRequest } from '../../core/models';

interface StaffMember {
  id: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  roleName?: string;
  primarySubjectId?: string;
  primarySubjectName?: string;
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
          <h1 *ngIf="activeTab === 'CLASSES'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manage Classes & Grade Sections
          </h1>
          <h1 *ngIf="activeTab === 'STUDENTS'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Student Admissions & Enrolled Roster
          </h1>
          <h1 *ngIf="activeTab === 'ALUMNI'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Alumni & Graduated Students Directory</span>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Permanent Register
            </span>
          </h1>
          <h1 *ngIf="activeTab === 'STAFF'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Faculty & Staff Directory
          </h1>
          <h1 *ngIf="activeTab === 'SUBJECTS'" class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Curriculum Subjects Master
          </h1>

          <p *ngIf="activeTab === 'CLASSES'" class="text-xs text-slate-500 mt-0.5">
            Configure institutional grade hierarchy, custom section divisions (e.g. Lotus, Ruby, Section A), and classroom capacities.
          </p>
          <p *ngIf="activeTab === 'STUDENTS'" class="text-xs text-slate-500 mt-0.5">
            Manage student admissions, parent guardian records, and view enrolled class rosters.
          </p>
          <p *ngIf="activeTab === 'ALUMNI'" class="text-xs text-slate-500 mt-0.5">
            Permanent register of students who completed their terminal class or graduated from the institution.
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
          <!-- Session Pill & Switcher Dropdown (Just like header dropdown!) -->
          <div *ngIf="canManage" class="relative inline-block">
            <button type="button" (click)="toggleSessionDropdown($event)"
                    class="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold rounded-2xl border border-indigo-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Switch or create academic sessions">
              <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>Session: {{ auth.activeSessionName() }}</span>
              <svg class="w-3.5 h-3.5 text-indigo-500 transition-transform duration-200" [class.rotate-180]="isSessionDropdownOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Backdrop to close dropdown -->
            <div *ngIf="isSessionDropdownOpen" (click)="isSessionDropdownOpen = false" class="fixed inset-0 z-40"></div>

            <!-- Dropdown Menu -->
            <div *ngIf="isSessionDropdownOpen"
                 class="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
              
              <div class="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Available Sessions</span>
                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                  {{ academicSessions.length }}
                </span>
              </div>

              <div class="max-h-56 overflow-y-auto py-1 space-y-0.5 custom-clay-scroll">
                <button *ngFor="let ses of academicSessions"
                        type="button"
                        (click)="selectSessionFromDropdown(ses, $event)"
                        class="w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer"
                        [ngClass]="auth.activeAcademicSession()?.id === ses.id ? 'bg-indigo-50/80 text-indigo-950 font-bold' : 'text-slate-700 font-medium'">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span>{{ ses.name }}</span>
                      <span *ngIf="ses.is_current" class="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        CURRENT
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-normal mt-0.5">
                      {{ ses.start_date }} ➔ {{ ses.end_date }}
                    </div>
                  </div>

                  <div *ngIf="auth.activeAcademicSession()?.id === ses.id" class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                    ✓
                  </div>
                </button>

                <div *ngIf="academicSessions.length === 0" class="px-3 py-3 text-center text-xs text-slate-400">
                  No sessions found
                </div>
              </div>

              <!-- Manage Sessions & Rollover link inside dropdown -->
              <div class="pt-1 border-t border-slate-100 px-1.5">
                <button type="button"
                        (click)="openSessionModal(); isSessionDropdownOpen = false"
                        class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Session & Rollover</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Buttons for CLASSES tab -->
          <button *ngIf="canManage && activeTab === 'CLASSES'" (click)="openAddClassModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Class</span>
          </button>

          <!-- Buttons for STUDENTS tab -->
          <button *ngIf="canManage && activeTab === 'STUDENTS'" (click)="openAddStudentModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Add Student</span>
          </button>

          <button *ngIf="canManage && (activeTab === 'STUDENTS' || activeTab === 'ALUMNI')" (click)="openSessionModal()"
                  class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md border border-indigo-600 transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Rollover & Promote</span>
          </button>

          <button *ngIf="canManage && activeTab === 'STAFF'" (click)="openAddStaffModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Faculty</span>
          </button>

          <button *ngIf="canManage && activeTab === 'SUBJECTS'" (click)="openAddSubjectModal()"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_12px_#cbd5e1,-4px_-4px_12px_#ffffff] border border-slate-900 transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 1: MANAGE CLASSES & SECTIONS (Dedicated Workspace)          -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'CLASSES'" class="space-y-6 animate-fadeIn">
        
        <!-- Summary Stats Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Grade Levels</div>
              <div class="text-xl font-black text-slate-900 mt-0.5">{{ classes.length }} Classes</div>
              <div class="text-[10px] text-slate-500">From Pre-Nursery to Grade 12</div>
            </div>
          </div>

          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Divisions</div>
              <div class="text-xl font-black text-emerald-700 mt-0.5">{{ totalSectionsCount }} Sections</div>
              <div class="text-[10px] text-slate-500">Custom and lettered divisions</div>
            </div>
          </div>

          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
              <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Intake & Capacity</div>
              <div class="text-xl font-black text-purple-700 mt-0.5">{{ totalEnrolledStudents }} / {{ totalCampusCapacity }}</div>
              <div class="text-[10px] text-slate-500">Enrolled out of total classroom capacity</div>
            </div>
          </div>
        </div>

        <!-- Classes & Sections Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div *ngFor="let c of classes"
               class="bg-white rounded-3xl border border-slate-200/90 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
            
            <!-- Class Card Header -->
            <div>
              <div class="flex items-start justify-between gap-3 relative">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-slate-900 text-white">
                      {{ c.code }}
                    </span>
                  </div>
                  <h3 class="text-base font-black text-slate-900 tracking-tight mt-1">{{ c.name }}</h3>
                </div>

                <!-- Class Header 3-Dot Actions Menu -->
                <div class="relative">
                  <button type="button" (click)="toggleClassMenu(c.id, $event)" title="Class Actions"
                          class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                  </button>

                  <!-- Class Action Dropdown -->
                  <div *ngIf="activeClassMenuId === c.id"
                       class="absolute right-0 top-9.5 w-48 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-slate-200 py-1.5 z-30 animate-fadeIn text-xs">
                    <button type="button" (click)="viewClassRoster(c)"
                            class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Class</span>
                    </button>

                    <button type="button" (click)="openEditClassModal(c, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Class</span>
                    </button>

                    <button type="button" (click)="openAddSectionModal(c)"
                            class="w-full px-3.5 py-2 text-left font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Section</span>
                    </button>

                    <div class="my-1 border-t border-slate-100"></div>

                    <button type="button" (click)="promptDeleteClass(c, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Class</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Sections Container -->
              <div class="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Sections ({{ c.sections.length || 0 }})</span>
                  <span>Capacity: <strong class="text-slate-700">{{ getClassEnrolledCount(c) }} / {{ getClassCapacity(c) }}</strong></span>
                </div>

                <div class="grid grid-cols-1 gap-2 pt-1">
                  <div *ngFor="let sec of c.sections"
                       class="p-3 bg-[#f8fafc] hover:bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between transition-all group shadow-2xs relative">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {{ (sec.code || sec.name).slice(0, 2).toUpperCase() }}
                      </div>
                      <div class="min-w-0">
                        <div class="text-xs font-black text-slate-900 truncate">
                          {{ formatSection(sec.name) }}
                        </div>
                        <div class="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>Capacity: <strong class="text-slate-700">{{ sec.enrolled_count || 0 }} / {{ sec.capacity || 40 }}</strong></span>
                          <span class="text-slate-300">•</span>
                          <span *ngIf="getSectionClassTeacher(sec)" class="text-emerald-700 font-bold inline-flex items-center gap-1">
                            <svg class="w-3 h-3 text-emerald-600 inline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>CT: {{ getSectionClassTeacher(sec)?.fullName }}</span>
                          </span>
                          <span *ngIf="!getSectionClassTeacher(sec)" class="text-slate-400 italic">
                            CT: Unassigned
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0 relative">
                      <button (click)="viewStudentsOfSection(c, sec)" title="View Enrolled Students"
                              class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs">
                        View Roster
                      </button>

                      <!-- Section 3-Dot Menu -->
                      <div class="relative">
                        <button type="button" (click)="toggleSectionMenu(sec.id, $event)" title="Section Actions"
                                class="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs">
                          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2"/>
                            <circle cx="12" cy="12" r="2"/>
                            <circle cx="12" cy="19" r="2"/>
                          </svg>
                        </button>

                        <!-- Section Dropdown Menu -->
                        <div *ngIf="activeSectionMenuId === sec.id"
                             class="absolute right-0 top-8.5 w-44 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-slate-200 py-1.5 z-30 animate-fadeIn text-xs">
                          <button type="button" (click)="viewStudentsOfSection(c, sec)"
                                  class="w-full px-3 py-1.5 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View Roster</span>
                          </button>

                          <button type="button" (click)="openEditSectionModal(sec, c, $event)"
                                  class="w-full px-3 py-1.5 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Section</span>
                          </button>

                          <div class="my-1 border-t border-slate-100"></div>

                          <button type="button" (click)="promptDeleteSection(sec, c, $event)"
                                  class="w-full px-3 py-1.5 text-left font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete Section</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="!c.sections || c.sections.length === 0" class="p-4 text-center text-xs text-slate-400 italic bg-[#f8fafc] rounded-2xl border border-dashed border-slate-200">
                    No sections added yet. Click "+ Add Section" below.
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Bottom Footer -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: <strong class="text-emerald-600">Active</strong></span>
              <button (click)="openAddSectionModal(c)" class="text-indigo-600 hover:text-indigo-800 font-bold text-xs cursor-pointer">
                + Add Section
              </button>
            </div>
          </div>

          <!-- Add Class Quick Action Card -->
          <div (click)="openAddClassModal()"
               class="p-6 rounded-3xl border-2 border-dashed border-slate-300 hover:border-slate-800 bg-[#f8fafc] hover:bg-white transition-all cursor-pointer flex flex-col items-center justify-center text-center text-slate-600 hover:text-slate-900 group min-h-[220px] shadow-xs">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-600 flex items-center justify-center transition-all mb-3 shadow-xs">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span class="text-sm font-black text-slate-800 group-hover:text-slate-900">Add New Class / Grade</span>
            <span class="text-xs text-slate-400 font-medium mt-1">Configure new grade level and custom sections</span>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: STUDENT ROSTER (Clean Student Admissions & Roster)      -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'STUDENTS'" class="space-y-4 sm:space-y-6 animate-fadeIn">
        
        <!-- Top Clean Class Selector (when classes exist) -->
        <div *ngIf="classes.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          <div *ngFor="let c of classes"
               (click)="selectClass(c)"
               [class.bg-slate-900]="selectedClass?.id === c.id"
               [class.text-white]="selectedClass?.id === c.id"
               [class.border-slate-900]="selectedClass?.id === c.id"
               [class.shadow-md]="selectedClass?.id === c.id"
               [class.bg-white]="selectedClass?.id !== c.id"
               [class.text-slate-800]="selectedClass?.id !== c.id"
               [class.border-slate-200]="selectedClass?.id !== c.id"
               class="p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:border-slate-400 shadow-xs active:scale-[0.97]">
            <div class="text-xs font-black truncate">{{ c.name }}</div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t text-[10px]"
                 [ngClass]="selectedClass?.id === c.id ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-400'">
              <span>{{ c.sections.length || 0 }} Sec</span>
              <span class="font-mono font-bold">{{ c.code }}</span>
            </div>
          </div>
        </div>

        <!-- If 0 classes configured: prompt to go to Classes tab -->
        <div *ngIf="classes.length === 0"
             class="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
            <svg class="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 class="text-base font-black text-slate-900">No Academic Classes Configured Yet</h3>
          <p class="text-xs text-slate-500 max-w-md">
            Before enrolling students, please configure your school's classes and sections in the dedicated Classes & Sections management section.
          </p>
          <button (click)="setTab('CLASSES')"
                  class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2">
            <span>Manage Classes & Sections →</span>
          </button>
        </div>

        <!-- Enrolled Students Directory with Clay Table, Mobile Cards & Pagination -->
        <div *ngIf="classes.length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <!-- Top Section: Class Heading, Section Pills, Status Filters & Action Bar -->
          <div class="p-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-[#f8fafc]/90 space-y-3.5">
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              
              <!-- Left: Class Title, Section Switcher Pills, Status Filter Pills -->
              <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <!-- Class & Section Name Header -->
                <div class="flex items-center gap-2">
                  <h3 class="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    {{ selectedClass?.name || 'Class' }} - {{ formatSection(selectedSection?.name) }} Roster
                  </h3>
                  <span class="px-2 py-0.5 rounded-xl bg-slate-200/80 text-[10px] font-black text-slate-700">
                    {{ filteredStudents.length }}
                  </span>
                </div>

                <!-- Section switch pills -->
                <div *ngIf="selectedClass && selectedClass.sections && selectedClass.sections.length > 0"
                     class="flex items-center gap-1 bg-white border border-slate-200/90 p-1 rounded-2xl shadow-2xs overflow-x-auto max-w-full">
                  <button *ngFor="let sec of selectedClass.sections"
                          (click)="selectSection(sec)"
                          [class.bg-slate-900]="selectedSection?.id === sec.id"
                          [class.text-white]="selectedSection?.id === sec.id"
                          [class.text-slate-600]="selectedSection?.id !== sec.id"
                          [class.shadow-xs]="selectedSection?.id === sec.id"
                          class="px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0">
                    {{ formatSection(sec.name) }}
                  </button>
                </div>

                <!-- Status Filter Pills (All / Active / Inactive) -->
                <div class="flex items-center gap-1 bg-white border border-slate-200/90 p-1 rounded-2xl shadow-2xs">
                  <button (click)="studentStatusFilter = 'ALL'; currentPage = 1"
                          [class.bg-slate-900]="studentStatusFilter === 'ALL'"
                          [class.text-white]="studentStatusFilter === 'ALL'"
                          [class.text-slate-600]="studentStatusFilter !== 'ALL'"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer">
                    All
                  </button>
                  <button (click)="studentStatusFilter = 'ACTIVE'; currentPage = 1"
                          [class.bg-emerald-600]="studentStatusFilter === 'ACTIVE'"
                          [class.text-white]="studentStatusFilter === 'ACTIVE'"
                          [class.text-slate-600]="studentStatusFilter !== 'ACTIVE'"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer">
                    Active
                  </button>
                  <button (click)="studentStatusFilter = 'INACTIVE'; currentPage = 1"
                          [class.bg-rose-600]="studentStatusFilter === 'INACTIVE'"
                          [class.text-white]="studentStatusFilter === 'INACTIVE'"
                          [class.text-slate-600]="studentStatusFilter !== 'INACTIVE'"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer">
                    Inactive
                  </button>
                </div>
              </div>

              <!-- Right: Review Deactivation Requests, Search & Action Buttons -->
              <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between xl:justify-end">
                <!-- Review Deactivation Requests Button (Clean Claymorphic Style matching UI theme) -->
                <button *ngIf="canDirectlyDeactivateStudent" (click)="openDeactivationRequestsModal()"
                        title="Review Student Deactivation Requests"
                        class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Deactivation Requests</span>
                  <span *ngIf="pendingDeactivationRequestsCount > 0"
                        class="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black leading-none">
                    {{ pendingDeactivationRequestsCount }}
                  </span>
                </button>

                <button *ngIf="!canDirectlyDeactivateStudent && canRequestStudentDeactivation" (click)="openDeactivationRequestsModal()"
                        title="My Student Deactivation Requests"
                        class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-2xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>My Requests</span>
                  <span *ngIf="myDeactivationRequestsCount > 0"
                        class="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black leading-none">
                    {{ myDeactivationRequestsCount }}
                  </span>
                </button>

                <!-- Search Input with Icon -->
                <div class="relative w-full sm:w-60">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input type="text" [(ngModel)]="searchQuery" (input)="currentPage = 1" placeholder="Search student name/adm..."
                         class="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
                  <button *ngIf="searchQuery" (click)="searchQuery = ''; currentPage = 1"
                          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">&times;</button>
                </div>

                <!-- Export CSV & Print Buttons -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button (click)="exportRosterCsv()" [disabled]="students.length === 0" title="Export CSV"
                          class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 rounded-2xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>CSV</span>
                  </button>
                  
                  <button (click)="printRoster()" [disabled]="students.length === 0" title="Print Roster"
                          class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 rounded-2xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- VIEW 1: DESKTOP CLAY TABLE (md:block) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead class="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Roll No</th>
                  <th class="px-6 py-3.5">Admission No</th>
                  <th class="px-6 py-3.5">Student Name</th>
                  <th class="px-6 py-3.5">Gender / Blood</th>
                  <th class="px-6 py-3.5">Guardian Contact</th>
                  <th class="px-6 py-3.5">Class & Section</th>
                  <th class="px-6 py-3.5">Status</th>
                  <th class="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let st of paginatedStudents" class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-3.5 font-bold font-mono text-slate-700">#{{ st.rollNumber || '—' }}</td>
                  <td class="px-6 py-3.5 font-mono text-slate-500 font-semibold">{{ st.admissionNumber }}</td>
                  <td class="px-6 py-3.5 font-bold text-slate-900">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">
                        {{ st.firstName.charAt(0) }}
                      </span>
                      <span>{{ st.fullName }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 text-slate-500 capitalize">
                    {{ st.gender?.toLowerCase() || '—' }} <span *ngIf="st.bloodGroup" class="font-bold text-slate-700">({{ st.bloodGroup }})</span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="font-bold text-slate-800">{{ st.primaryContact?.first_name || '—' }} {{ st.primaryContact?.last_name || '' }}</div>
                    <div class="text-[10px] font-mono text-slate-400">{{ st.primaryContact?.phone || '—' }}</div>
                  </td>
                  <td class="px-6 py-3.5 text-slate-700 font-semibold">
                    {{ st.className }} - {{ formatSection(st.sectionName) }}
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs"
                          [ngClass]="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'">
                      {{ (st.status || 'ACTIVE').toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-right">
                    <!-- Admin / Principal direct status toggle -->
                    <div *ngIf="canDirectlyDeactivateStudent" class="flex items-center justify-end gap-1.5">
                      <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                              (click)="openToggleStudentStatus(st, 'INACTIVE', $event)"
                              class="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs">
                        Deactivate
                      </button>
                      <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'INACTIVE'"
                              (click)="openToggleStudentStatus(st, 'ACTIVE', $event)"
                              class="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs">
                        Reactivate
                      </button>
                    </div>

                    <!-- Teacher request deactivation action -->
                    <div *ngIf="!canDirectlyDeactivateStudent && canRequestStudentDeactivation" class="flex items-center gap-1.5">
                      <ng-container *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'">
                        <span *ngIf="isStudentDeactivationPending(st.studentId || st.id || st.enrollmentId)"
                              class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <svg class="w-3 h-3 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Request Pending</span>
                        </span>
                        <button *ngIf="!isStudentDeactivationPending(st.studentId || st.id || st.enrollmentId)"
                                (click)="openTeacherDeactModal(st, $event)"
                                class="px-2.5 py-1 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs">
                          Request Inactive
                        </button>
                      </ng-container>
                      <span *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'INACTIVE'" class="text-slate-400 text-xs">
                        Inactive
                      </span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="paginatedStudents.length === 0">
                  <td colspan="8" class="px-6 py-10 text-center text-slate-400 text-xs">
                    No students match the selected filter. Click "+ Add Student / Child" to add students.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- VIEW 2: MOBILE CLAYMORPHIC CARDS VIEW (md:hidden) -->
          <div class="block md:hidden p-3.5 space-y-3">
            <div *ngFor="let st of paginatedStudents"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/90 shadow-xs space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] font-mono">
                      #{{ st.rollNumber || '—' }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] font-mono">
                      {{ st.admissionNumber }}
                    </span>
                    <span class="px-2 py-0.5 rounded-md border font-bold text-[9px]"
                          [ngClass]="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                      {{ (st.status || 'ACTIVE').toUpperCase() }}
                    </span>
                  </div>
                  <h4 class="text-sm font-black text-slate-900 mt-1">{{ st.fullName }}</h4>
                </div>
                <span class="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs shrink-0">
                  {{ st.className }} - {{ formatSection(st.sectionName) }}
                </span>
              </div>

              <!-- Guardian Contact Info -->
              <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <span class="text-[10px] text-slate-400 font-semibold block">Guardian</span>
                  <span class="font-bold text-slate-800">{{ st.primaryContact?.first_name }} {{ st.primaryContact?.last_name || '' }}</span>
                </div>
                <a *ngIf="st.primaryContact?.phone"
                   [href]="'tel:' + st.primaryContact.phone"
                   class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                  <svg class="w-3 h-3 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{{ st.primaryContact.phone }}</span>
                </a>
              </div>

              <!-- Mobile Actions Footer -->
              <div class="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                <div *ngIf="canDirectlyDeactivateStudent">
                  <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                          (click)="openToggleStudentStatus(st, 'INACTIVE', $event)"
                          class="px-3 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Deactivate Student
                  </button>
                  <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'INACTIVE'"
                          (click)="openToggleStudentStatus(st, 'ACTIVE', $event)"
                          class="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Reactivate Student
                  </button>
                </div>

                <div *ngIf="!canDirectlyDeactivateStudent && canRequestStudentDeactivation">
                  <ng-container *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'">
                    <span *ngIf="isStudentDeactivationPending(st.studentId || st.id || st.enrollmentId)"
                          class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <svg class="w-3 h-3 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Request Pending</span>
                    </span>
                    <button *ngIf="!isStudentDeactivationPending(st.studentId || st.id || st.enrollmentId)"
                            (click)="openTeacherDeactModal(st, $event)"
                            class="px-3 py-1 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                      Request Inactive
                    </button>
                  </ng-container>
                </div>
              </div>
            </div>

            <div *ngIf="paginatedStudents.length === 0" class="p-8 text-center text-slate-400 text-xs">
              No students enrolled in this section. Click "+ Add Student / Child" to add students.
            </div>
          </div>

          <!-- Table Pagination Footer -->
          <div class="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div class="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
              <span>Rows per page:</span>
              <select [(ngModel)]="pageSize" (change)="currentPage = 1"
                      class="px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none shadow-xs">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
              <span class="text-slate-500 hidden sm:inline">Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredStudents.length }}</span>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
              <button (click)="currentPage = currentPage - 1" [disabled]="currentPage === 1"
                      class="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95">
                ‹ Prev
              </button>
              <span class="px-3 py-1.5 font-bold text-slate-800 text-xs">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
              <button (click)="currentPage = currentPage + 1" [disabled]="currentPage >= totalPages"
                      class="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95">
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: ALUMNI DIRECTORY (Graduated Students Register)          -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'ALUMNI'" class="space-y-4 sm:space-y-6">
        
        <!-- Alumni Metrics Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-inner">
              <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Alumni Graduated</div>
              <div class="text-xl font-black text-slate-900 mt-0.5">{{ alumniList.length }}</div>
            </div>
          </div>

          <div class="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 shadow-inner">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Terminal Exit Grade</div>
              <div class="text-xl font-black text-slate-900 mt-0.5">Class 12</div>
            </div>
          </div>

          <div class="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-inner">
              <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Academic Session</div>
              <div class="text-xl font-black text-slate-900 mt-0.5">{{ auth.activeSessionName() }}</div>
            </div>
          </div>
        </div>

        <!-- Alumni Register Card with Claymorphic Table & Mobile Cards -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <div class="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-[#f8fafc]">
            
            <div class="flex items-center gap-3 flex-wrap">
              <div class="flex items-center gap-2">
                <h3 class="text-xs sm:text-sm font-black text-slate-900">
                  Graduated Alumni Register
                </h3>
                <span class="text-[11px] text-amber-600 font-bold">({{ filteredAlumni.length }})</span>
              </div>

              <!-- Session filter dropdown -->
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-[11px] text-slate-400 font-semibold">Graduation Batch:</span>
                <select [(ngModel)]="selectedGraduationSession" (change)="alumniCurrentPage = 1"
                        class="px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 shadow-xs cursor-pointer">
                  <option value="ALL">All Batches</option>
                  <option *ngFor="let s of availableGraduationSessions" [value]="s">{{ s }}</option>
                </select>
              </div>
            </div>

            <!-- Search filter & Export Buttons -->
            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto">
              <div class="w-full sm:w-64">
                <input type="text" [(ngModel)]="alumniSearchQuery" (input)="alumniCurrentPage = 1" placeholder="Search alumni name/adm..."
                       class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button (click)="exportAlumniCsv()" [disabled]="alumniList.length === 0"
                        class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all flex-1 sm:flex-initial justify-center cursor-pointer disabled:opacity-40 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>CSV</span>
                </button>
                
                <button (click)="printAlumniDirectory()" [disabled]="alumniList.length === 0"
                        class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all flex-1 sm:flex-initial justify-center cursor-pointer disabled:opacity-40 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          <!-- DESKTOP TABLE VIEW (md:block) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead class="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Admission No</th>
                  <th class="px-6 py-3.5">Alumni Student Name</th>
                  <th class="px-6 py-3.5">Terminal Class & Sec</th>
                  <th class="px-6 py-3.5">Passing Session</th>
                  <th class="px-6 py-3.5">Primary Guardian</th>
                  <th class="px-6 py-3.5">Guardian Phone</th>
                  <th class="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let al of paginatedAlumni" class="hover:bg-amber-50/40 transition-colors">
                  <td class="px-6 py-3.5 font-mono text-slate-600 font-bold">{{ al.admission_number }}</td>
                  <td class="px-6 py-3.5 font-bold text-slate-900">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center">
                        {{ al.full_name.charAt(0) }}
                      </span>
                      <span>{{ al.full_name }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 text-slate-700 font-medium">
                    {{ al.last_class_name || 'Class 12' }} - {{ formatSection(al.last_section_name) }}
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                      <svg class="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      <span>{{ al.graduation_session || 'Graduated' }}</span>
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-slate-700 font-semibold">
                    {{ al.primary_contact?.first_name || '—' }} {{ al.primary_contact?.last_name || '' }}
                  </td>
                  <td class="px-6 py-3.5 text-slate-500 font-mono">{{ al.primary_contact?.phone || '—' }}</td>
                  <td class="px-6 py-3.5">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ALUMNI
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredAlumni.length === 0">
                  <td colspan="7" class="px-6 py-14 text-center text-slate-400">
                    <div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 font-bold text-2xl shadow-inner">
                      <svg class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div class="font-black text-slate-800 text-sm">No Alumni Records Yet</div>
                    <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                      Students in the highest grade (Class 12) automatically graduate and enter this Alumni Directory when you perform an annual session rollover.
                    </p>
                    <button *ngIf="canManage" (click)="openSessionModal()"
                            class="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 mx-auto">
                      <svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Open Session Rollover Engine</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MOBILE CARD VIEW (md:hidden) -->
          <div class="block md:hidden p-3.5 space-y-3">
            <div *ngFor="let al of paginatedAlumni"
                 class="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-[3px_3px_10px_#e2e8f0,-3px_-3px_10px_#ffffff] space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center shrink-0">
                    {{ al.full_name.charAt(0) }}
                  </div>
                  <div>
                    <h4 class="text-sm font-black text-slate-900">{{ al.full_name }}</h4>
                    <div class="text-[11px] font-mono text-slate-400">{{ al.admission_number }}</div>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  ALUMNI
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Class</span>
                  <span class="font-bold text-slate-800">{{ al.last_class_name || 'Class 12' }} - {{ formatSection(al.last_section_name) }}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passing Session</span>
                  <span class="font-mono font-bold text-indigo-700">{{ al.graduation_session || 'Graduated' }}</span>
                </div>
              </div>

              <div *ngIf="al.primary_contact?.phone" class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-slate-400 font-semibold">
                  Guardian: {{ al.primary_contact?.first_name }}
                </span>
                <a [href]="'tel:' + al.primary_contact?.phone" class="font-mono font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{{ al.primary_contact?.phone }}</span>
                </a>
              </div>
            </div>

            <div *ngIf="filteredAlumni.length === 0" class="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <div class="font-bold text-slate-700 text-xs">No Alumni Records Found</div>
              <p class="text-[11px] text-slate-400 mt-1">Graduated students appear here following an annual session rollover.</p>
            </div>
          </div>

          <!-- Alumni Pagination Bar -->
          <div *ngIf="filteredAlumni.length > alumniPageSize" class="p-3.5 sm:px-6 sm:py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f8fafc] text-xs">
            <div class="text-slate-500 text-[11px] font-semibold text-center sm:text-left">
              Showing {{ (alumniCurrentPage - 1) * alumniPageSize + 1 }}–{{ Math.min(alumniCurrentPage * alumniPageSize, filteredAlumni.length) }} of {{ filteredAlumni.length }} alumni
            </div>
            <div class="flex items-center gap-1.5">
              <button (click)="alumniCurrentPage = alumniCurrentPage - 1" [disabled]="alumniCurrentPage === 1"
                      class="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer shadow-xs">
                Prev
              </button>
              <span class="px-3 py-1.5 font-bold text-slate-800 text-[11px]">
                {{ alumniCurrentPage }} / {{ alumniTotalPages }}
              </span>
              <button (click)="alumniCurrentPage = alumniCurrentPage + 1" [disabled]="alumniCurrentPage === alumniTotalPages"
                      class="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer shadow-xs">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- ============================================================== -->
      <!-- TAB 3: FACULTY & STAFF DIRECTORY (Principals & Teachers)       -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'STAFF'" class="space-y-4 animate-fadeIn">
        
        <!-- Faculty Directory Minimal Claymorphic Card Container -->
        <div class="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-[6px_6px_20px_rgba(203,213,225,0.45),-4px_-4px_16px_rgba(255,255,255,0.9)] overflow-hidden">
          
          <!-- Top Section: Status Gradient Tabs & Search/Action Bar -->
          <div class="p-3.5 sm:p-5 border-b border-slate-100 bg-[#f8fafc]/90 space-y-3.5">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              <!-- Status Gradient Tabs (All / Active / Inactive) -->
              <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full lg:w-auto">
                <!-- Tab: All Staff -->
                <button (click)="staffStatusFilter = 'ALL'; staffCurrentPage = 1"
                        [ngClass]="staffStatusFilter === 'ALL'
                          ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)] border-indigo-500 scale-[1.02]'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200/90 shadow-[2px_2px_6px_#e2e8f0,-2px_-2px_6px_#ffffff]'"
                        class="px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95">
                  <svg class="w-4 h-4 shrink-0" [ngClass]="staffStatusFilter === 'ALL' ? 'text-white' : 'text-indigo-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>All Staff</span>
                  <span class="px-2 py-0.5 rounded-xl text-[11px] font-black font-mono"
                        [ngClass]="staffStatusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'">
                    {{ staffList.length }}
                  </span>
                </button>

                <!-- Tab: Active Staff -->
                <button (click)="staffStatusFilter = 'ACTIVE'; staffCurrentPage = 1"
                        [ngClass]="staffStatusFilter === 'ACTIVE'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] border-emerald-500 scale-[1.02]'
                          : 'bg-white text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700 border-slate-200/90 shadow-[2px_2px_6px_#e2e8f0,-2px_-2px_6px_#ffffff]'"
                        class="px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95">
                  <span class="relative flex h-2.5 w-2.5">
                    <span *ngIf="staffStatusFilter === 'ACTIVE'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5" [ngClass]="staffStatusFilter === 'ACTIVE' ? 'bg-white' : 'bg-emerald-500'"></span>
                  </span>
                  <span>Active</span>
                  <span class="px-2 py-0.5 rounded-xl text-[11px] font-black font-mono"
                        [ngClass]="staffStatusFilter === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'">
                    {{ activeStaffCount }}
                  </span>
                </button>

                <!-- Tab: Inactive Staff -->
                <button (click)="staffStatusFilter = 'INACTIVE'; staffCurrentPage = 1"
                        [ngClass]="staffStatusFilter === 'INACTIVE'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[0_4px_14px_rgba(244,63,94,0.35)] border-rose-500 scale-[1.02]'
                          : 'bg-white text-slate-700 hover:bg-rose-50/50 hover:text-rose-700 border-slate-200/90 shadow-[2px_2px_6px_#e2e8f0,-2px_-2px_6px_#ffffff]'"
                        class="px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95">
                  <span class="w-2.5 h-2.5 rounded-full" [ngClass]="staffStatusFilter === 'INACTIVE' ? 'bg-white' : 'bg-rose-500'"></span>
                  <span>Inactive</span>
                  <span class="px-2 py-0.5 rounded-xl text-[11px] font-black font-mono"
                        [ngClass]="staffStatusFilter === 'INACTIVE' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-800 border border-rose-200/60'">
                    {{ inactiveStaffCount }}
                  </span>
                </button>
              </div>

              <!-- Search Bar & Action Buttons -->
              <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto">
                <div class="relative flex-1 sm:w-64">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input type="text" [(ngModel)]="staffSearchQuery" (input)="staffCurrentPage = 1" placeholder="Search staff name, role, email..."
                         class="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
                  <button *ngIf="staffSearchQuery" (click)="staffSearchQuery = ''; staffCurrentPage = 1"
                          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">&times;</button>
                </div>

                <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
                  <button (click)="exportStaffCsv()" [disabled]="staffList.length === 0"
                          title="Export Faculty CSV"
                          class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 rounded-2xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>CSV</span>
                  </button>
                  
                  <button (click)="printStaffDirectory()" [disabled]="staffList.length === 0"
                          title="Print Faculty Directory"
                          class="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 rounded-2xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Role Filter Chips Bar (Minimal Claymorphic Gradient Pills) -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs scrollbar-none">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Role:</span>
              
              <!-- All Roles -->
              <button (click)="staffRoleFilter = 'ALL'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-sm border-slate-900'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 shadow-2xs'"
                      class="px-2.5 py-1 rounded-xl font-bold border transition-all cursor-pointer shrink-0 active:scale-95">
                All Roles
              </button>

              <!-- Principals -->
              <button (click)="staffRoleFilter = 'PRINCIPAL'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'PRINCIPAL'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm border-transparent'
                        : 'bg-white text-purple-900 hover:bg-purple-50 border-purple-200 shadow-2xs'"
                      class="px-2.5 py-1 rounded-xl font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'PRINCIPAL' ? 'text-white' : 'text-purple-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Principals</span>
                <span class="text-[10px] font-mono opacity-90">({{ principalsCount }})</span>
              </button>

              <!-- School Admins -->
              <button (click)="staffRoleFilter = 'SCHOOL_ADMIN'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'SCHOOL_ADMIN'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm border-transparent'
                        : 'bg-white text-indigo-900 hover:bg-indigo-50 border-indigo-200 shadow-2xs'"
                      class="px-2.5 py-1 rounded-xl font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'SCHOOL_ADMIN' ? 'text-white' : 'text-indigo-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>School Admins</span>
                <span class="text-[10px] font-mono opacity-90">({{ adminsCount }})</span>
              </button>

              <!-- Class Incharges -->
              <button (click)="staffRoleFilter = 'CLASS_TEACHER'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'CLASS_TEACHER'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border-transparent'
                        : 'bg-white text-emerald-900 hover:bg-emerald-50 border-emerald-200 shadow-2xs'"
                      class="px-2.5 py-1 rounded-xl font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'CLASS_TEACHER' ? 'text-white' : 'text-emerald-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Class Incharges</span>
                <span class="text-[10px] font-mono opacity-90">({{ classTeachersCount }})</span>
              </button>

              <!-- Subject Teachers -->
              <button (click)="staffRoleFilter = 'TEACHER'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'TEACHER'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-sm border-transparent'
                        : 'bg-white text-blue-900 hover:bg-blue-50 border-blue-200 shadow-2xs'"
                      class="px-2.5 py-1 rounded-xl font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'TEACHER' ? 'text-white' : 'text-blue-600'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Subject Teachers</span>
                <span class="text-[10px] font-mono opacity-90">({{ teachersCount }})</span>
              </button>
            </div>
          </div>

          <!-- VIEW 1: DESKTOP TABLE VIEW (md:block) -->
          <div class="hidden md:block overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead class="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">Staff Member</th>
                  <th class="px-6 py-3.5">Role Designation</th>
                  <th class="px-6 py-3.5">Contact Details</th>
                  <th class="px-6 py-3.5">Class Teacher Incharge</th>
                  <th class="px-6 py-3.5">Teaching Subject Allocations</th>
                  <th class="px-6 py-3.5">Status</th>
                  <th class="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let staff of paginatedStaff" class="hover:bg-slate-50/80 transition-colors">
                  <!-- Staff Name & Avatar -->
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs text-white"
                           [ngClass]="{
                             'bg-gradient-to-br from-purple-600 to-indigo-700': staff.role === 'PRINCIPAL',
                             'bg-gradient-to-br from-indigo-700 to-slate-900': staff.role === 'SCHOOL_ADMIN',
                             'bg-gradient-to-br from-emerald-600 to-teal-700': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                             'bg-gradient-to-br from-blue-600 to-indigo-600': staff.role === 'TEACHER'
                           }">
                        {{ staff.firstName.charAt(0) }}
                      </div>
                      <div>
                        <div class="flex items-center gap-1.5">
                          <span class="font-black text-slate-900">{{ staff.fullName }}</span>
                          <span *ngIf="auth.currentUser()?.id === staff.id" class="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 font-black text-[9px]">
                            YOU
                          </span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono">ID: {{ staff.id.slice(0, 8) }}...</div>
                      </div>
                    </div>
                  </td>

                  <!-- Role Pill -->
                  <td class="px-6 py-3.5">
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shadow-xs inline-flex items-center gap-1.5"
                          [ngClass]="{
                            'bg-purple-50 text-purple-700 border-purple-200': staff.role === 'PRINCIPAL',
                            'bg-indigo-50 text-indigo-700 border-indigo-200': staff.role === 'SCHOOL_ADMIN',
                            'bg-emerald-50 text-emerald-700 border-emerald-200': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                            'bg-blue-50 text-blue-700 border-blue-200': staff.role === 'TEACHER'
                          }">
                      <svg *ngIf="staff.role === 'PRINCIPAL'" class="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                      </svg>
                      <svg *ngIf="staff.role === 'SCHOOL_ADMIN'" class="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <svg *ngIf="staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length" class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <svg *ngIf="staff.role === 'TEACHER' && !staff.classTeacherSections?.length" class="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>{{ staff.role === 'PRINCIPAL' ? 'Principal' : (staff.role === 'SCHOOL_ADMIN' ? 'School Admin' : (staff.classTeacherSections?.length ? 'Class Teacher' : 'Teacher')) }}</span>
                    </span>
                  </td>

                  <!-- Contact -->
                  <td class="px-6 py-3.5">
                    <a [href]="'mailto:' + staff.email" class="text-slate-800 font-semibold hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{{ staff.email }}</span>
                    </a>
                    <div *ngIf="staff.phone" class="text-slate-500 font-mono text-[11px] mt-0.5 flex items-center gap-1.5">
                      <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a [href]="'tel:' + staff.phone" class="hover:text-slate-900">{{ staff.phone }}</a>
                    </div>
                    <div *ngIf="!staff.phone" class="text-slate-400 text-[11px] mt-0.5">—</div>
                  </td>

                  <!-- Incharge -->
                  <td class="px-6 py-3.5">
                    <div *ngIf="staff.classTeacherSections && staff.classTeacherSections.length > 0" class="flex flex-wrap gap-1">
                      <span *ngFor="let cts of staff.classTeacherSections"
                            class="inline-block px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        {{ cts.className }} - {{ cts.sectionName }}
                      </span>
                    </div>
                    <span *ngIf="!staff.classTeacherSections || staff.classTeacherSections.length === 0" class="text-slate-400 text-xs">—</span>
                  </td>

                  <!-- Subjects -->
                  <td class="px-6 py-3.5">
                    <div *ngIf="staff.subjectAssignments && staff.subjectAssignments.length > 0" class="flex flex-wrap gap-1">
                      <span *ngFor="let sa of staff.subjectAssignments"
                            class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {{ sa.subjectName }} ({{ sa.className }}-{{ sa.sectionName }})
                      </span>
                    </div>
                    <span *ngIf="!staff.subjectAssignments || staff.subjectAssignments.length === 0" class="text-slate-400 text-xs">—</span>
                  </td>

                  <!-- Status Badge -->
                  <td class="px-6 py-3.5">
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-black border shadow-2xs inline-flex items-center gap-1.5"
                          [ngClass]="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                      <span>{{ (staff.status || 'ACTIVE').toUpperCase() }}</span>
                    </span>
                  </td>

                  <!-- Action Buttons -->
                  <td class="px-6 py-3.5">
                    <div *ngIf="canDeactivateStaff(staff)" class="flex items-center gap-1.5">
                      <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                              (click)="openToggleStaffStatus(staff, 'INACTIVE', $event)"
                              class="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95">
                        Deactivate
                      </button>
                      <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'"
                              (click)="openToggleStaffStatus(staff, 'ACTIVE', $event)"
                              class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95">
                        Reactivate
                      </button>
                    </div>
                    <span *ngIf="!canDeactivateStaff(staff)" class="text-slate-400 text-xs italic">Protected</span>
                  </td>
                </tr>

                <tr *ngIf="paginatedStaff.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div class="font-bold text-slate-700 text-xs">No Faculty / Staff Matching Filter</div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Try resetting the status or role filters above.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- VIEW 2: MOBILE CLAYMORPHIC CARDS VIEW (md:hidden) -->
          <div class="block md:hidden p-3.5 space-y-3">
            <div *ngFor="let staff of paginatedStaff"
                 class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[3px_3px_10px_#e2e8f0,-3px_-3px_10px_#ffffff] space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs text-white"
                       [ngClass]="{
                         'bg-gradient-to-br from-purple-600 to-indigo-700': staff.role === 'PRINCIPAL',
                         'bg-gradient-to-br from-indigo-700 to-slate-900': staff.role === 'SCHOOL_ADMIN',
                         'bg-gradient-to-br from-emerald-600 to-teal-700': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                         'bg-gradient-to-br from-blue-600 to-indigo-600': staff.role === 'TEACHER'
                       }">
                    {{ staff.firstName.charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1">
                      <h4 class="text-xs font-black text-slate-900 truncate">{{ staff.fullName }}</h4>
                      <span *ngIf="auth.currentUser()?.id === staff.id" class="px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold text-[8px]">YOU</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono">ID: {{ staff.id.slice(0, 8) }}...</div>
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold border shadow-xs"
                        [ngClass]="{
                          'bg-purple-50 text-purple-700 border-purple-200': staff.role === 'PRINCIPAL',
                          'bg-indigo-50 text-indigo-700 border-indigo-200': staff.role === 'SCHOOL_ADMIN',
                          'bg-emerald-50 text-emerald-700 border-emerald-200': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                          'bg-blue-50 text-blue-700 border-blue-200': staff.role === 'TEACHER'
                        }">
                    {{ staff.role === 'PRINCIPAL' ? 'Principal' : (staff.role === 'SCHOOL_ADMIN' ? 'Admin' : (staff.classTeacherSections?.length ? 'Class Teacher' : 'Teacher')) }}
                  </span>
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold border"
                        [ngClass]="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                    {{ (staff.status || 'ACTIVE').toUpperCase() }}
                  </span>
                </div>
              </div>

              <!-- Contact & Phone -->
              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 gap-2">
                <a [href]="'mailto:' + staff.email" class="min-w-0 truncate hover:text-indigo-600 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="font-bold text-slate-800 text-xs truncate">{{ staff.email }}</span>
                </a>
                <a *ngIf="staff.phone"
                   [href]="'tel:' + staff.phone"
                   class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 shadow-xs shrink-0">
                  <svg class="w-3 h-3 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Call</span>
                </a>
              </div>

              <!-- Incharge / Subjects -->
              <div *ngIf="(staff.classTeacherSections && staff.classTeacherSections.length > 0) || (staff.subjectAssignments && staff.subjectAssignments.length > 0)"
                   class="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div *ngIf="staff.classTeacherSections && staff.classTeacherSections.length > 0" class="flex items-center gap-1 flex-wrap">
                  <span class="text-[10px] text-slate-500 font-bold">Incharge:</span>
                  <span *ngFor="let cts of staff.classTeacherSections"
                        class="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {{ cts.className }} - {{ cts.sectionName }}
                  </span>
                </div>

                <div *ngIf="staff.subjectAssignments && staff.subjectAssignments.length > 0" class="flex items-center gap-1 flex-wrap">
                  <span class="text-[10px] text-slate-500 font-bold">Subjects:</span>
                  <span *ngFor="let sa of staff.subjectAssignments"
                        class="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-semibold border border-slate-200">
                    {{ sa.subjectName }} ({{ sa.className }}-{{ sa.sectionName }})
                  </span>
                </div>
              </div>

              <!-- Mobile Actions Footer for Staff -->
              <div *ngIf="canDeactivateStaff(staff)" class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                        (click)="openToggleStaffStatus(staff, 'INACTIVE', $event)"
                        class="px-3 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Deactivate Staff
                </button>
                <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'"
                        (click)="openToggleStaffStatus(staff, 'ACTIVE', $event)"
                        class="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Reactivate Staff
                </button>
              </div>
            </div>

            <div *ngIf="paginatedStaff.length === 0" class="p-8 text-center text-slate-400 text-xs">
              No faculty staff matching this filter.
            </div>
          </div>

          <!-- Staff Table Pagination Footer -->
          <div *ngIf="filteredStaff.length > staffPageSize" class="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div class="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
              <span>Rows per page:</span>
              <select [(ngModel)]="staffPageSize" (change)="staffCurrentPage = 1"
                      class="px-2.5 py-1 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none shadow-xs">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
              <span class="text-slate-500 hidden sm:inline">Showing {{ staffStartIndex + 1 }}-{{ staffEndIndex }} of {{ filteredStaff.length }}</span>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
              <button (click)="staffCurrentPage = staffCurrentPage - 1" [disabled]="staffCurrentPage === 1"
                      class="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95">
                ‹ Prev
              </button>
              <span class="px-3 py-1.5 font-bold text-slate-800 text-xs">Page {{ staffCurrentPage }} of {{ staffTotalPages || 1 }}</span>
              <button (click)="staffCurrentPage = staffCurrentPage + 1" [disabled]="staffCurrentPage >= staffTotalPages"
                      class="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95">
                Next ›
              </button>
            </div>
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
      <!-- MODAL: ACADEMIC SESSIONS & PROMOTION ROLLOVER ENGINE           -->
      <!-- ============================================================== -->
      <!-- Academic Session & Promotion Rollover Modal -->
      <div *ngIf="showSessionModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
          <!-- Fixed Modal Header (Never scrolls) -->
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-black text-slate-900 tracking-tight">Academic Sessions & Annual Promotion Engine</h3>
                <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Switch active session or roll over students into a new academic year.</p>
              </div>
            </div>
            <button (click)="closeSessionModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Scrollable Modal Body (Only content scrolls) -->
          <div class="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-clay-scroll bg-white">
            
            <!-- Section 1: Active & Existing Sessions Grid -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900 uppercase tracking-wider">Campus Academic Sessions</span>
                <span class="text-[11px] text-slate-400 font-bold">{{ academicSessions.length }} sessions configured</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div *ngFor="let ses of academicSessions"
                     [ngClass]="isSessionActive(ses) ? 'border-indigo-600 bg-indigo-50/60 shadow-sm' : 'border-slate-200 bg-white'"
                     class="p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-xs">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-black text-xs text-slate-900">{{ ses.name }}</span>
                      <span *ngIf="ses.is_current" class="px-2 py-0.2 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        CURRENT
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium mt-1">
                      {{ ses.start_date }} ➔ {{ ses.end_date }}
                    </div>
                    <div class="text-[10px] text-slate-600 font-bold mt-0.5">
                      {{ ses.student_count || 0 }} Students • {{ ses.section_count || 0 }} Sections
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <button *ngIf="!isSessionActive(ses)"
                            (click)="switchAcademicSession(ses)"
                            class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs">
                      Switch
                    </button>
                    <span *ngIf="isSessionActive(ses)"
                          class="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-black shadow-xs">
                      ACTIVE
                    </span>

                    <!-- Delete Session Button -->
                    <button *ngIf="canManage && academicSessions.length > 1"
                            (click)="promptDeleteSession(ses)"
                            title="Delete session"
                            class="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            aria-label="Delete session">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Create New Session & Annual Student Rollover Form -->
            <div class="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3.5">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-slate-900 text-indigo-300 font-black text-xs flex items-center justify-center shadow-xs">
                  <svg class="w-3.5 h-3.5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                <div>
                  <h4 class="text-xs font-black text-slate-900">Provision New Session & Annual Student Promotion</h4>
                  <p class="text-[11px] text-slate-500">Roll over students to the next grade level and transition terminal class to Alumni.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Session Name *</label>
                  <input type="text" [(ngModel)]="newSession.name" placeholder="e.g. 2027–2028"
                         class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input type="date" [(ngModel)]="newSession.startDate"
                         class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input type="date" [(ngModel)]="newSession.endDate"
                         class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
              </div>

              <!-- Promotion Checkbox & Rollover Rules Explanation -->
              <div class="space-y-2 pt-1 border-t border-slate-200/80">
                <label class="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="newSession.promoteStudents"
                         class="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 mt-0.5" />
                  <div class="text-xs">
                    <span class="font-black text-slate-900">Import & Auto-Promote Students from Active Session</span>
                    <p class="text-[11px] text-slate-500 mt-0.5">
                      All students advance to the next class automatically. Final grade students move to Alumni Directory.
                    </p>
                  </div>
                </label>

                <!-- Dynamic Rollover Explanatory Callout -->
                <div *ngIf="newSession.promoteStudents" class="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-indigo-950 text-[11px] space-y-1 animate-fadeIn">
                  <div class="font-bold flex items-center gap-1.5 text-indigo-900">
                    <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>How Annual Student Promotion & Rollover Works:</span>
                  </div>
                  <ul class="list-disc list-inside space-y-0.5 text-indigo-800 pl-1">
                    <li><strong>Lower Grades:</strong> Students advance sequentially (e.g. Class 1 ➔ Class 2, Class 9 ➔ Class 10).</li>
                    <li><strong>Terminal Class:</strong> Students in the highest class (e.g. Class 12) graduate to <strong>ALUMNI</strong> status and are stored in the permanent <strong>Alumni Directory</strong>.</li>
                    <li><strong>Sections:</strong> All class sections are automatically replicated for the new academic year.</li>
                  </ul>
                </div>

                <label class="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" [(ngModel)]="newSession.isCurrent"
                         class="w-4 h-4 rounded text-slate-900 focus:ring-slate-900" />
                  <span class="text-xs font-bold text-slate-800">Set as Current School Session</span>
                </label>
              </div>
            </div>

            <div *ngIf="sessionModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ sessionModalError }}
            </div>
          </div>

          <!-- Fixed Modal Footer with Actions (Always fully visible, never cut off) -->
          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button type="button" (click)="closeSessionModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Close
            </button>
            <button type="button" (click)="saveSessionAndRollover()" [disabled]="savingSession"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95">
              <svg *ngIf="savingSession" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ savingSession ? 'Executing Rollover...' : 'Create Session & Execute Rollover' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Custom Claymorphic Confirmation Modal for Deleting Academic Session -->
      <div *ngIf="sessionToDelete" class="fixed inset-0 flex items-center justify-center p-4 z-[80] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200/90 space-y-4 animate-scaleUp">
          
          <!-- Header with Warning Icon -->
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
              <svg class="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Delete Academic Session</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Are you sure you want to permanently delete <span class="font-bold text-slate-900">"{{ sessionToDelete.name }}"</span>?
              </p>
            </div>
          </div>

          <!-- Clear Explanatory Note of What Happens -->
          <div class="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2 text-xs">
            <div class="flex items-center gap-1.5 font-bold text-rose-900 text-[11px] uppercase tracking-wider">
              <svg class="w-3.5 h-3.5 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>What will happen:</span>
            </div>
            <ul class="text-[11px] text-rose-800 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
              <li>Academic session <strong>"{{ sessionToDelete.name }}"</strong> will be removed from your school configuration.</li>
              <li>Classes, student enrollments, and sections attached to this session will be unlinked.</li>
              <li>If <strong>"{{ sessionToDelete.name }}"</strong> is currently active, your campus will automatically switch to the nearest active academic year.</li>
            </ul>
          </div>

          <!-- Modal Action Buttons -->
          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button type="button"
                    (click)="cancelDeleteSession()"
                    [disabled]="isDeletingSession"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="button"
                    (click)="executeDeleteSession()"
                    [disabled]="isDeletingSession"
                    class="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="isDeletingSession" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isDeletingSession ? 'Deleting...' : 'Yes, Delete Session' }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: ADD STUDENT / CHILD                                   -->
      <!-- ============================================================== -->
      <div *ngIf="showAddStudentModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Enroll New Student / Child</h3>
              <p class="text-xs text-slate-500 mt-0.5">Create student record, assign class section, and link guardian profile.</p>
            </div>
            <button (click)="closeAddStudentModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900">
              <strong class="font-bold">Student Profile Details</strong>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-bold text-slate-700">Admission Number *</label>
                  <button type="button" (click)="newStudent.admissionNumber = generateUniqueAdmissionNumber()"
                          class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                    <svg class="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Auto-generate</span>
                  </button>
                </div>
                <input type="text" [(ngModel)]="newStudent.admissionNumber" placeholder="e.g. ADM-2026-1049"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Roll Number</label>
                <input type="text" [(ngModel)]="newStudent.rollNumber" placeholder="e.g. 15"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Class / Grade *</label>
                <select [(ngModel)]="studentEnrollClassId" (change)="onStudentEnrollClassChange()"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="" disabled>-- Select Class --</option>
                  <option *ngFor="let c of classes" [value]="c.id">
                    {{ c.name }} ({{ c.code }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Section / Division *</label>
                <select [(ngModel)]="newStudent.sectionId" [disabled]="!studentEnrollClassId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner disabled:opacity-50">
                  <option value="" disabled>-- Select Section --</option>
                  <option *ngFor="let sec of studentEnrollSections" [value]="sec.id">
                    {{ formatSection(sec.name) }}
                  </option>
                </select>
                <div *ngIf="studentEnrollClassId && studentEnrollSections.length === 0" class="text-[10px] text-rose-500 font-bold mt-1">
                  No sections in this class.
                </div>
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Name</label>
                <input type="text" [(ngModel)]="newStudent.guardianName" placeholder="e.g. Alex Johnson"
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Phone</label>
                <input type="text" [(ngModel)]="newStudent.guardianPhone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Email (For Login)</label>
                <input type="email" [(ngModel)]="newStudent.guardianEmail" placeholder="parent@gmail.com"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div *ngIf="studentModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ studentModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddStudentModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="saveStudent()" [disabled]="savingStudent"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingStudent">Enroll Student</span>
              <span *ngIf="savingStudent">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="showAddStaffModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Add Faculty / Teacher</h3>
                <p class="text-xs text-slate-500 mt-0.5">Register faculty member into school directory. Class teacher & subject roles can be assigned anytime.</p>
              </div>
            </div>
            <button (click)="closeAddStaffModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:px-6 py-4 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Role Designation *</label>
                <select [(ngModel)]="newStaff.role"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="CLASS_TEACHER">Class Teacher</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="SCHOOL_ADMIN">School Admin</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Primary Subject Specialization</label>
                <select [(ngModel)]="newStaff.primarySubjectId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="">-- General / Subject Specialist --</option>
                  <option *ngFor="let sub of subjects" [value]="sub.id">
                    {{ sub.name }} ({{ sub.code }})
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input type="text" [(ngModel)]="newStaff.phone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Email (Username) *</label>
                <input type="email" [(ngModel)]="newStaff.email" placeholder="v.malhotra@schoolscence.in"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Initial Password</label>
              <input type="text" [(ngModel)]="newStaff.password" placeholder="password123"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="staffModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ staffModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddStaffModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="saveStaff()" [disabled]="savingStaff"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingStaff">Register Staff</span>
              <span *ngIf="savingStaff">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="showAddSubjectModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Add New Subject</h3>
              <p class="text-xs text-slate-500 mt-0.5">Register a curriculum subject for this campus.</p>
            </div>
            <button (click)="closeAddSubjectModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:px-6 py-4 space-y-3.5 overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
              <input type="text" [(ngModel)]="newSubject.name" placeholder="e.g. Artificial Intelligence & Robotics"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div *ngIf="subjectModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ subjectModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddSubjectModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="saveSubject()" [disabled]="savingSubject"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingSubject">Create Subject</span>
              <span *ngIf="savingSubject">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 4: ADD CLASS / GRADE LEVEL                               -->
      <!-- ============================================================== -->
      <div *ngIf="showAddClassModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Add New Class / Grade Level</h3>
              <p class="text-xs text-slate-500 mt-0.5">Provision academic grade level with flexible custom section names.</p>
            </div>
            <button (click)="closeAddClassModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Class / Grade Name *</label>
              <select [(ngModel)]="newClass.name" (change)="onGradeSelect(newClass.name)"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner font-medium">
                <option value="" disabled>-- Select Class / Grade Level --</option>
                <option *ngFor="let g of STANDARD_GRADE_LEVELS" [value]="g.name">{{ g.name }}</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Class Code *</label>
              <input type="text" [(ngModel)]="newClass.code" placeholder="e.g. CLS_1, NUR, LKG"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <!-- Sections to Provision (Custom Section Tags & Presets) -->
            <div class="space-y-2">
              <label class="block font-bold text-slate-700">Sections to Provision *</label>
              
              <!-- Active Section Chips -->
              <div class="flex items-center gap-1.5 flex-wrap p-2.5 bg-slate-50 border border-slate-200 rounded-2xl min-h-[44px]">
                <div *ngFor="let s of newClass.sectionsList"
                     class="px-2.5 py-1 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-fadeIn">
                  <span>{{ formatSection(s) }}</span>
                  <button type="button" (click)="removeSectionFromNewClass(s)" class="text-slate-400 hover:text-white leading-none font-black text-sm cursor-pointer">&times;</button>
                </div>
                <div *ngIf="newClass.sectionsList.length === 0" class="text-xs text-rose-500 font-semibold p-1">
                  Please add at least 1 section.
                </div>
              </div>

              <!-- Custom Name Input Tag -->
              <div class="flex items-center gap-2 mt-1">
                <input type="text" [(ngModel)]="customSectionInput" (keydown.enter)="addCustomSectionToNewClass()" placeholder="Type custom name (e.g. Lotus, Ruby, Boys, Commerce) & press Enter..."
                       class="flex-1 px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
                <button type="button" (click)="addCustomSectionToNewClass()"
                        class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-xs transition-all cursor-pointer">
                  + Add
                </button>
              </div>

              <!-- Quick Preset Categories -->
              <div class="space-y-1.5 pt-1">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <button type="button" *ngFor="let p of ['A', 'B', 'C', 'D', 'E']"
                          (click)="togglePresetSectionInNewClass(p)"
                          [class.bg-indigo-100]="newClass.sectionsList.includes('Section ' + p) || newClass.sectionsList.includes(p)"
                          [class.text-indigo-800]="newClass.sectionsList.includes('Section ' + p) || newClass.sectionsList.includes(p)"
                          [class.border-indigo-300]="newClass.sectionsList.includes('Section ' + p) || newClass.sectionsList.includes(p)"
                          class="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">
                    + Sec {{ p }}
                  </button>
                  <button type="button" *ngFor="let g of ['Ruby', 'Emerald', 'Sapphire', 'Diamond']"
                          (click)="togglePresetSectionInNewClass(g)"
                          [class.bg-amber-100]="newClass.sectionsList.includes(g)"
                          [class.text-amber-800]="newClass.sectionsList.includes(g)"
                          [class.border-amber-300]="newClass.sectionsList.includes(g)"
                          class="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">
                    + {{ g }}
                  </button>
                  <button type="button" *ngFor="let h of ['Lotus', 'Rose', 'Sunflower', 'Newton', 'Einstein']"
                          (click)="togglePresetSectionInNewClass(h)"
                          [class.bg-emerald-100]="newClass.sectionsList.includes(h)"
                          [class.text-emerald-800]="newClass.sectionsList.includes(h)"
                          [class.border-emerald-300]="newClass.sectionsList.includes(h)"
                          class="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">
                    + {{ h }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Default Student Capacity per Section</label>
              <input type="number" [(ngModel)]="newClass.capacity" min="10" max="100"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="classModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ classModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddClassModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="submitAddClass()" [disabled]="savingClass || newClass.sectionsList.length === 0"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingClass">Create Class & Sections</span>
              <span *ngIf="savingClass">Creating...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 5: ADD SECTION TO CLASS                                  -->
      <!-- ============================================================== -->
      <div *ngIf="showAddSectionModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Add New Section</h3>
              <p class="text-xs text-slate-500 mt-0.5">Attach another section division to an existing class.</p>
            </div>
            <button (click)="closeAddSectionModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Parent Class *</label>
              <select [(ngModel)]="newSection.class_id"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                <option value="" disabled>-- Select Class --</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} ({{ c.code }})</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Section Name *</label>
              <input type="text" [(ngModel)]="newSection.name" (input)="onSectionNameChange()" placeholder="e.g. Section C, Lotus, Ruby, Shift-A"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <!-- Suggestion Chips for Add Section -->
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Suggestions:</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" *ngFor="let name of ['Section C', 'Section D', 'Ruby', 'Emerald', 'Lotus', 'Rose', 'Einstein', 'Morning', 'Science']"
                        (click)="setSectionPreset(name)"
                        class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 cursor-pointer transition-colors">
                  {{ name }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Section Code *</label>
                <input type="text" [(ngModel)]="newSection.code" placeholder="e.g. C, RUBY, LOTUS"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Student Capacity</label>
                <input type="number" [(ngModel)]="newSection.capacity" min="10" max="100"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Class Teacher (Homeroom In-charge)</label>
              <select [(ngModel)]="newSection.class_teacher_id"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                <option value="">-- No Class Teacher (Assign Later) --</option>
                <option *ngFor="let t of teachersList" [value]="t.id">
                  {{ t.fullName }} ({{ t.roleName || t.role }})
                </option>
              </select>
              <p class="text-[10px] text-slate-400 mt-1">Class Teacher takes morning homeroom roll call and attendance.</p>
            </div>

            <div *ngIf="sectionModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ sectionModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddSectionModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="submitAddSection()" [disabled]="savingSection"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingSection">Add Section</span>
              <span *ngIf="savingSection">Adding...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: EDIT CLASS                                              -->
      <!-- ============================================================== -->
      <div *ngIf="showEditClassModal && classToEdit" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[75] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Edit Class / Grade Level</h3>
              <p class="text-xs text-slate-500 mt-0.5">Update class name and code.</p>
            </div>
            <button (click)="closeEditClassModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Standard Grade Level</label>
              <select [(ngModel)]="editClassForm.name" (change)="onEditGradeSelect(editClassForm.name)"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner font-medium">
                <option *ngFor="let g of STANDARD_GRADE_LEVELS" [value]="g.name">{{ g.name }}</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Class Name *</label>
              <input type="text" [(ngModel)]="editClassForm.name" placeholder="e.g. Class 1, Nursery"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner font-medium" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Class Code *</label>
              <input type="text" [(ngModel)]="editClassForm.code" placeholder="e.g. CLS_1, NUR, LKG"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="editClassModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ editClassModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeEditClassModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="submitEditClass()" [disabled]="savingEditClass"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingEditClass">Save Changes</span>
              <span *ngIf="savingEditClass">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: EDIT SECTION                                            -->
      <!-- ============================================================== -->
      <div *ngIf="showEditSectionModal && sectionToEdit" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[75] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Edit Section</h3>
              <p class="text-xs text-slate-500 mt-0.5">Modify section details for {{ sectionToEdit.classItem.name }}.</p>
            </div>
            <button (click)="closeEditSectionModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Section Name *</label>
              <input type="text" [(ngModel)]="editSectionForm.name" (input)="onEditSectionNameChange()" placeholder="e.g. Section A, Lotus, Ruby"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <!-- Suggestion Chips for Edit Section -->
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button type="button" *ngFor="let name of ['Section A', 'Section B', 'Section C', 'Ruby', 'Emerald', 'Lotus', 'Rose', 'Newton']"
                        (click)="setEditSectionPreset(name)"
                        class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 cursor-pointer transition-colors">
                  {{ name }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Section Code *</label>
                <input type="text" [(ngModel)]="editSectionForm.code" placeholder="e.g. A, B, LOTUS"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Student Capacity</label>
                <input type="number" [(ngModel)]="editSectionForm.capacity" min="10" max="100"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Class Teacher (Homeroom In-charge)</label>
              <select [(ngModel)]="editSectionForm.class_teacher_id"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                <option value="">-- No Class Teacher Assigned --</option>
                <option *ngFor="let t of teachersList" [value]="t.id">
                  {{ t.fullName }} ({{ t.roleName || t.role }})
                </option>
              </select>
              <p class="text-[10px] text-slate-400 mt-1">Class Teacher takes morning homeroom roll call and attendance.</p>
            </div>

            <div *ngIf="editSectionModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ editSectionModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeEditSectionModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="submitEditSection()" [disabled]="savingEditSection"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingEditSection">Save Changes</span>
              <span *ngIf="savingEditSection">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: DELETE CLASS CONFIRMATION                               -->
      <!-- ============================================================== -->
      <div *ngIf="showDeleteClassModal && classToDelete" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[80] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Delete Class & All Sections?</h3>
              <p class="text-xs text-slate-500 mt-1">
                You are about to delete <strong class="text-slate-800">{{ classToDelete.name }} ({{ classToDelete.code }})</strong>.
              </p>
            </div>
          </div>

          <div class="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 text-xs text-rose-900">
            <div class="font-bold flex items-center gap-1.5 text-rose-700">
              <span>⚠️ What will happen when you delete this class:</span>
            </div>
            <ul class="list-disc pl-4 space-y-1 text-[11px] text-rose-800 leading-relaxed font-medium">
              <li>All <strong>{{ classToDelete.sections.length || 0 }} sections</strong> belonging to this class will be permanently removed.</li>
              <li>Students enrolled in this class will become unassigned and require re-enrollment.</li>
              <li>Class timetables, attendance records, and exam entries linked to this class will be unlinked.</li>
            </ul>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="closeDeleteClassModal()" [disabled]="isDeletingClass"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="executeDeleteClass()" [disabled]="isDeletingClass"
                    class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5">
              <span *ngIf="!isDeletingClass">Delete Class</span>
              <span *ngIf="isDeletingClass">Deleting...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: DELETE SECTION CONFIRMATION                             -->
      <!-- ============================================================== -->
      <div *ngIf="showDeleteSectionModal && sectionToDelete" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[80] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Delete Section?</h3>
              <p class="text-xs text-slate-500 mt-1">
                You are about to delete <strong class="text-slate-800">{{ formatSection(sectionToDelete.section.name) }}</strong> from <strong class="text-slate-800">{{ sectionToDelete.classItem.name }}</strong>.
              </p>
            </div>
          </div>

          <div class="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 text-xs text-rose-900">
            <div class="font-bold flex items-center gap-1.5 text-rose-700">
              <span>⚠️ What will happen when you delete this section:</span>
            </div>
            <ul class="list-disc pl-4 space-y-1 text-[11px] text-rose-800 leading-relaxed font-medium">
              <li>Section division <strong>{{ formatSection(sectionToDelete.section.name) }}</strong> will be permanently removed.</li>
              <li>Students currently assigned to this section will lose their section assignment and need to be re-allocated.</li>
              <li>Section-specific timetables and attendance logs will be unlinked.</li>
            </ul>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="closeDeleteSectionModal()" [disabled]="isDeletingSection"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="executeDeleteSection()" [disabled]="isDeletingSection"
                    class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5">
              <span *ngIf="!isDeletingSection">Delete Section</span>
              <span *ngIf="isDeletingSection">Deleting...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 6: STAFF STATUS CONFIRMATION MODAL                       -->
      <!-- ============================================================== -->
      <div *ngIf="showStaffStatusModal && selectedStaffForStatus" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-xs"
                 [ngClass]="staffStatusAction === 'INACTIVE' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'">
              <svg *ngIf="staffStatusAction === 'INACTIVE'" class="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <svg *ngIf="staffStatusAction !== 'INACTIVE'" class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">
                {{ staffStatusAction === 'INACTIVE' ? 'Deactivate Staff Account' : 'Reactivate Staff Account' }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Target Staff: <span class="font-bold text-slate-900">{{ selectedStaffForStatus.fullName }}</span> ({{ selectedStaffForStatus.role }})
              </p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl space-y-2 text-xs"
               [ngClass]="staffStatusAction === 'INACTIVE' ? 'bg-rose-50/70 border border-rose-200 text-rose-800' : 'bg-emerald-50/70 border border-emerald-200 text-emerald-800'">
            <div class="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ staffStatusAction === 'INACTIVE' ? 'Account Deactivation Details:' : 'Account Reactivation Details:' }}</span>
            </div>
            <ul class="space-y-1 list-disc pl-4 text-[11px] leading-relaxed">
              <li *ngIf="staffStatusAction === 'INACTIVE'">The staff user account (<strong>{{ selectedStaffForStatus.email }}</strong>) will be set to <strong>INACTIVE</strong>.</li>
              <li *ngIf="staffStatusAction === 'INACTIVE'">Staff member will be prevented from logging into the portal until reactivated.</li>
              <li *ngIf="staffStatusAction === 'ACTIVE'">The staff user account (<strong>{{ selectedStaffForStatus.email }}</strong>) will be restored to <strong>ACTIVE</strong> status and login access will be resumed.</li>
            </ul>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" (click)="closeStaffStatusModal()" [disabled]="updatingStaffStatus"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executeToggleStaffStatus()" [disabled]="updatingStaffStatus"
                    class="px-5 py-2.5 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    [ngClass]="staffStatusAction === 'INACTIVE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'">
              <svg *ngIf="updatingStaffStatus" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ updatingStaffStatus ? 'Updating...' : (staffStatusAction === 'INACTIVE' ? 'Confirm Deactivation' : 'Confirm Reactivation') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 7: DIRECT STUDENT STATUS MODAL (Admin / Principal)       -->
      <!-- ============================================================== -->
      <div *ngIf="showStudentStatusModal && selectedStudentForStatus" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-xs"
                 [ngClass]="studentStatusAction === 'INACTIVE' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'">
              <svg *ngIf="studentStatusAction === 'INACTIVE'" class="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <svg *ngIf="studentStatusAction !== 'INACTIVE'" class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">
                {{ studentStatusAction === 'INACTIVE' ? 'Deactivate Student Record' : 'Reactivate Student Record' }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Student: <span class="font-bold text-slate-900">{{ selectedStudentForStatus.fullName }}</span> (Adm: {{ selectedStudentForStatus.admissionNumber }})
              </p>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason / Notes for Status Change</label>
              <input type="text" [(ngModel)]="studentStatusReason" placeholder="e.g. Transferred to another institution / Relocated"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div class="p-3.5 rounded-2xl space-y-1 text-xs"
                 [ngClass]="studentStatusAction === 'INACTIVE' ? 'bg-amber-50/80 border border-amber-200 text-amber-900' : 'bg-emerald-50/80 border border-emerald-200 text-emerald-900'">
              <div class="font-bold text-[11px] flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ studentStatusAction === 'INACTIVE' ? 'Inactive Student Details:' : 'Reactivation Details:' }}</span>
              </div>
              <p class="text-[11px] leading-relaxed">
                {{ studentStatusAction === 'INACTIVE' ? 'Student enrollment will be marked INACTIVE and removed from daily active class rosters unless filtered.' : 'Student enrollment will be restored to ACTIVE status across classroom modules.' }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" (click)="closeStudentStatusModal()" [disabled]="updatingStudentStatus"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executeToggleStudentStatus()" [disabled]="updatingStudentStatus"
                    class="px-5 py-2.5 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    [ngClass]="studentStatusAction === 'INACTIVE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'">
              <svg *ngIf="updatingStudentStatus" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ updatingStudentStatus ? 'Updating...' : (studentStatusAction === 'INACTIVE' ? 'Confirm Deactivate' : 'Confirm Reactivate') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 8: TEACHER STUDENT DEACTIVATION REQUEST MODAL            -->
      <!-- ============================================================== -->
      <div *ngIf="showTeacherDeactModal && selectedStudentForDeactRequest" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Request Student Deactivation</h3>
                <p class="text-xs text-slate-500 mt-0.5">Submit request to Principal & Admin for deactivation approval.</p>
              </div>
            </div>
            <button (click)="closeTeacherDeactModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Student Record</span>
              <span class="font-black text-slate-900">{{ selectedStudentForDeactRequest.fullName }}</span>
              <span class="text-slate-500 ml-1">({{ selectedStudentForDeactRequest.admissionNumber }})</span>
            </div>
            <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 text-xs shadow-2xs">
              {{ selectedStudentForDeactRequest.className }} - {{ formatSection(selectedStudentForDeactRequest.sectionName) }}
            </span>
          </div>

          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Primary Reason *</label>
              <select [(ngModel)]="deactRequestReason"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                <option value="Transfer / Relocation">Transfer / Relocation to another city/school</option>
                <option value="Prolonged Absence / Dropped Out">Prolonged Unexcused Absence / Dropped Out</option>
                <option value="Parent Request / Withdrawal">Parent Formal Request / Voluntary Withdrawal</option>
                <option value="Disciplinary Action">Disciplinary Suspension / Expulsion</option>
                <option value="Financial / Fee Default">Long-term Fee Default / Non-payment</option>
                <option value="Medical / Health Reasons">Medical / Health Reasons</option>
                <option value="Other">Other Reasons (Specify in Remarks)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Detailed Remarks & Justification *</label>
              <textarea [(ngModel)]="deactRequestComments" rows="3" placeholder="Provide background details, dates of communication with parents, or reasons..."
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner"></textarea>
            </div>

            <div *ngIf="deactModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ deactModalError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" (click)="closeTeacherDeactModal()" [disabled]="submittingDeactRequest"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="submitTeacherDeactRequest()" [disabled]="submittingDeactRequest"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="submittingDeactRequest" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ submittingDeactRequest ? 'Submitting...' : 'Submit Request to Admin' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 9: DEACTIVATION REQUESTS REVIEW QUEUE MODAL              -->
      <!-- ============================================================== -->
      <div *ngIf="showDeactivationRequestsModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black text-base shadow-xs">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Student Deactivation Requests Queue</h3>
                <p class="text-xs text-slate-500 mt-0.5">Review teacher submissions for student status deactivations.</p>
              </div>
            </div>
            <button (click)="closeDeactivationRequestsModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <!-- Review Notes Input (for Admin/Principal when reviewing) -->
            <div *ngIf="canDirectlyDeactivateStudent" class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label class="block font-bold text-slate-700 text-[11px]">Optional Reviewer Notes / Remarks (Attached upon decision)</label>
              <input type="text" [(ngModel)]="reviewNotes" placeholder="e.g. Approved per parent transfer certificate..."
                     class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <!-- List of Deactivation Requests -->
            <div class="space-y-3">
              <div *ngFor="let req of deactivationRequests"
                   class="p-4 rounded-2xl border transition-all space-y-3"
                   [ngClass]="{
                     'bg-amber-50/50 border-amber-200 shadow-xs': req.status === 'PENDING',
                     'bg-emerald-50/40 border-emerald-200': req.status === 'APPROVED',
                     'bg-slate-50 border-slate-200 opacity-80': req.status === 'REJECTED'
                   }">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-black text-sm text-slate-900">{{ req.student_name }}</span>
                      <span class="font-mono text-slate-500 text-[11px]">({{ req.admission_number }})</span>
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                            [ngClass]="{
                              'bg-amber-100 text-amber-800 border-amber-300': req.status === 'PENDING',
                              'bg-emerald-100 text-emerald-800 border-emerald-300': req.status === 'APPROVED',
                              'bg-rose-100 text-rose-800 border-rose-300': req.status === 'REJECTED'
                            }">
                        {{ req.status }}
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      Class: <strong>{{ req.class_name || 'N/A' }} - {{ formatSection(req.section_name) }}</strong>
                    </div>
                  </div>

                  <span class="text-[10px] text-slate-400 font-mono shrink-0">
                    {{ req.created_at ? (req.created_at | date:'short') : 'Recently' }}
                  </span>
                </div>

                <div class="p-3 bg-white/90 border border-slate-200/80 rounded-xl space-y-1">
                  <div class="text-[11px]">
                    <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Reason: </span>
                    <strong class="text-slate-800">{{ req.reason }}</strong>
                  </div>
                  <div *ngIf="req.comments" class="text-[11px] text-slate-600 mt-1 italic">
                    "{{ req.comments }}"
                  </div>
                  <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-100 mt-1">
                    Submitted by: <strong class="text-slate-700">{{ req.requested_by_name || 'Teacher' }}</strong> ({{ req.requested_by_role || 'TEACHER' }})
                  </div>
                </div>

                <!-- Review details if already reviewed -->
                <div *ngIf="req.status !== 'PENDING'" class="text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2 pt-1">
                  <span>Reviewed by <strong>{{ req.reviewed_by_name || 'Authority' }}</strong></span>
                  <span *ngIf="req.review_notes" class="italic text-slate-500">Note: {{ req.review_notes }}</span>
                </div>

                <!-- Action buttons for Pending requests (Admin / Principal only) -->
                <div *ngIf="req.status === 'PENDING' && canDirectlyDeactivateStudent" class="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/80">
                  <button type="button" (click)="reviewDeactivationRequest(req, 'REJECTED')"
                          class="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Reject Request</span>
                  </button>
                  <button type="button" (click)="reviewDeactivationRequest(req, 'APPROVED')"
                          class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Approve & Deactivate Student</span>
                  </button>
                </div>
              </div>

              <div *ngIf="deactivationRequests.length === 0" class="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div class="font-bold text-slate-700 text-xs">No Deactivation Requests</div>
                <p class="text-[11px] text-slate-400 mt-1">When teachers submit student deactivation requests, they will appear here for review.</p>
              </div>
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-between shrink-0">
            <span class="text-xs text-slate-500 font-semibold">{{ deactivationRequests.length }} Total Requests</span>
            <button (click)="closeDeactivationRequestsModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Close
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
  modalService = inject(ModalService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  
  Math = Math;

  activeTab: 'CLASSES' | 'STUDENTS' | 'ALUMNI' | 'STAFF' | 'SUBJECTS' = 'CLASSES';

  classes: ClassItem[] = [];
  subjects: SubjectItem[] = [];
  students: StudentItem[] = [];
  staffList: StaffMember[] = [];
  alumniList: AlumniStudent[] = [];
  academicSessions: AcademicSession[] = [];
  
  selectedClass: ClassItem | null = null;
  selectedSection: SectionItem | null = null;
  
  searchQuery = '';
  staffSearchQuery = '';
  alumniSearchQuery = '';
  selectedGraduationSession = 'ALL';
  currentPage = 1;
  pageSize = 25;
  alumniCurrentPage = 1;
  alumniPageSize = 25;

  // Standard Grade Levels List
  readonly STANDARD_GRADE_LEVELS = [
    { name: 'Pre-Nursery', code: 'PRE_NUR', order: 1 },
    { name: 'Nursery', code: 'NUR', order: 2 },
    { name: 'LKG', code: 'LKG', order: 3 },
    { name: 'UKG', code: 'UKG', order: 4 },
    { name: 'Class 1', code: 'CLS_1', order: 5 },
    { name: 'Class 2', code: 'CLS_2', order: 6 },
    { name: 'Class 3', code: 'CLS_3', order: 7 },
    { name: 'Class 4', code: 'CLS_4', order: 8 },
    { name: 'Class 5', code: 'CLS_5', order: 9 },
    { name: 'Class 6', code: 'CLS_6', order: 10 },
    { name: 'Class 7', code: 'CLS_7', order: 11 },
    { name: 'Class 8', code: 'CLS_8', order: 12 },
    { name: 'Class 9', code: 'CLS_9', order: 13 },
    { name: 'Class 10', code: 'CLS_10', order: 14 },
    { name: 'Class 11', code: 'CLS_11', order: 15 },
    { name: 'Class 12', code: 'CLS_12', order: 16 },
  ];

  // Class & Section Management
  showAddClassModal = false;
  savingClass = false;
  classModalError = '';
  customSectionInput = '';
  newClass = {
    name: '',
    code: '',
    display_order: 1,
    capacity: 40,
    sectionsList: ['Section A', 'Section B'],
  };

  showAddSectionModal = false;
  savingSection = false;
  sectionModalError = '';
  newSection = {
    class_id: '',
    name: 'Section B',
    code: 'B',
    capacity: 40,
    class_teacher_id: '',
  };

  // 3-Dot Action Menus
  activeClassMenuId: string | null = null;
  activeSectionMenuId: string | null = null;

  // Edit Class Modal
  showEditClassModal = false;
  savingEditClass = false;
  editClassModalError = '';
  classToEdit: ClassItem | null = null;
  editClassForm = {
    name: '',
    code: '',
    display_order: 1,
  };

  // Edit Section Modal
  showEditSectionModal = false;
  savingEditSection = false;
  editSectionModalError = '';
  sectionToEdit: { section: SectionItem; classItem: ClassItem } | null = null;
  editSectionForm = {
    name: '',
    code: '',
    capacity: 40,
    display_order: 1,
    class_teacher_id: '',
  };

  // Delete Confirmation Modals
  showDeleteClassModal = false;
  classToDelete: ClassItem | null = null;
  isDeletingClass = false;

  showDeleteSectionModal = false;
  sectionToDelete: { section: SectionItem; classItem: ClassItem } | null = null;
  isDeletingSection = false;

  // Modals state
  showSessionModal = false;
  savingSession = false;
  sessionModalError = '';
  sessionToDelete: AcademicSession | null = null;
  isDeletingSession = false;
  newSession = {
    name: '2027–2028',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    isCurrent: true,
    promoteStudents: true,
  };

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
  studentEnrollClassId = '';
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
    primarySubjectId: '',
    password: 'password123',
  };

  // Status Management & Deactivation Requests State
  deactivationRequests: StudentDeactivationRequest[] = [];
  showDeactivationRequestsModal = false;
  loadingDeactivationRequests = false;
  reviewNotes = '';
  studentStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  staffStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  staffRoleFilter: 'ALL' | 'PRINCIPAL' | 'SCHOOL_ADMIN' | 'CLASS_TEACHER' | 'TEACHER' = 'ALL';
  staffCurrentPage = 1;
  staffPageSize = 25;

  get teachersList(): StaffMember[] {
    return (this.staffList || []).filter(
      (s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    );
  }

  getSectionClassTeacher(sec: SectionItem | null | undefined): StaffMember | undefined {
    if (!sec || !sec.class_teacher_id) return undefined;
    return this.staffList.find((s) => s.id === sec.class_teacher_id);
  }

  get activeStaffCount(): number {
    return this.staffList.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  }

  get inactiveStaffCount(): number {
    return this.staffList.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'INACTIVE').length;
  }

  get principalsCount(): number {
    return this.staffList.filter((s) => (s.role || '').toUpperCase() === 'PRINCIPAL').length;
  }

  get adminsCount(): number {
    return this.staffList.filter((s) => (s.role || '').toUpperCase() === 'SCHOOL_ADMIN').length;
  }

  get classTeachersCount(): number {
    return this.staffList.filter((s) => (s.role || '').toUpperCase() === 'CLASS_TEACHER' || (s.classTeacherSections && s.classTeacherSections.length > 0)).length;
  }

  get teachersCount(): number {
    return this.staffList.filter((s) => (s.role || '').toUpperCase() === 'TEACHER').length;
  }

  showStaffStatusModal = false;
  selectedStaffForStatus: StaffMember | null = null;
  staffStatusAction: 'ACTIVE' | 'INACTIVE' = 'INACTIVE';
  updatingStaffStatus = false;

  showStudentStatusModal = false;
  selectedStudentForStatus: StudentItem | null = null;
  studentStatusAction: 'ACTIVE' | 'INACTIVE' = 'INACTIVE';
  studentStatusReason = '';
  updatingStudentStatus = false;

  showTeacherDeactModal = false;
  selectedStudentForDeactRequest: StudentItem | null = null;
  deactRequestReason = 'Transfer / Relocation';
  deactRequestComments = '';
  submittingDeactRequest = false;
  deactModalError = '';

  get canDirectlyDeactivateStudent(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal();
  }

  get canRequestStudentDeactivation(): boolean {
    return this.auth.isTeacher() || this.auth.isClassTeacher();
  }

  canDeactivateStaff(staff: StaffMember): boolean {
    const currentUser = this.auth.currentUser();
    if (currentUser?.id === staff.id) return false;
    if (this.auth.isSuperAdmin() || this.auth.isSchoolAdmin() || this.auth.isAdmin()) {
      return true;
    }
    if (this.auth.isPrincipal()) {
      const targetRole = (staff.role || '').toUpperCase();
      return targetRole !== 'SUPER_ADMIN' && targetRole !== 'SCHOOL_ADMIN' && targetRole !== 'PRINCIPAL';
    }
    return false;
  }

  get pendingDeactivationRequestsCount(): number {
    return this.deactivationRequests.filter((r) => r.status === 'PENDING').length;
  }

  get myDeactivationRequestsCount(): number {
    const uid = this.auth.currentUser()?.id;
    return this.deactivationRequests.filter((r) => r.requested_by_user_id === uid).length;
  }

  isStudentDeactivationPending(studentId: string): boolean {
    return this.deactivationRequests.some((r) => r.student_id === studentId && r.status === 'PENDING');
  }

  getStudentPendingRequest(studentId: string): StudentDeactivationRequest | undefined {
    return this.deactivationRequests.find((r) => r.student_id === studentId && r.status === 'PENDING');
  }

  isSessionActive(ses: AcademicSession): boolean {
    const active = this.auth.activeAcademicSession();
    if (active) return active.id === ses.id;
    return !!ses.is_current;
  }

  formatSection(name?: string): string {
    if (!name) return 'Section A';
    const trimmed = name.trim();
    if (/^[A-Za-z]$/.test(trimmed)) {
      return `Section ${trimmed.toUpperCase()}`;
    }
    return trimmed;
  }

  formatErrorMessage(err: any, fallback = 'Operation failed. Please try again.'): string {
    const raw = err?.error?.message || err?.message || (typeof err === 'string' ? err : '');
    if (!raw) return fallback;

    if (raw.includes('uq_classes_school_code') || raw.includes('uq_classes_school_name') || (raw.includes('duplicate key') && raw.includes('classes'))) {
      return 'A class with this name or code already exists in your school.';
    }
    if (raw.includes('uq_sections_class_name') || raw.includes('uq_sections_class_code') || (raw.includes('duplicate key') && raw.includes('sections'))) {
      return 'A section with this name already exists in this class.';
    }
    if (raw.includes('uq_academic_sessions') || (raw.includes('duplicate key') && raw.includes('session'))) {
      return 'An academic session with this name already exists.';
    }
    if (raw.includes('admission_number') || raw.includes('uq_students_admission')) {
      return 'A student with this admission number already exists in this school.';
    }
    if (raw.includes('uq_subjects_school_code') || (raw.includes('duplicate key') && raw.includes('subjects'))) {
      return 'A subject with this code already exists in your curriculum.';
    }
    if (raw.includes('duplicate key value violates unique constraint') || raw.includes('23505')) {
      return 'This record already exists. Please ensure values are unique.';
    }
    return raw;
  }

  isSessionDropdownOpen = false;

  toggleSessionDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.isSessionDropdownOpen = !this.isSessionDropdownOpen;
  }

  selectSessionFromDropdown(ses: AcademicSession, event?: Event) {
    if (event) event.stopPropagation();
    this.isSessionDropdownOpen = false;
    this.switchAcademicSession(ses);
  }

  get canManage(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal();
  }

  get totalSectionsCount(): number {
    return this.classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0);
  }

  get totalCampusCapacity(): number {
    return this.classes.reduce((sum, c) => sum + this.getClassCapacity(c), 0);
  }

  get totalEnrolledStudents(): number {
    return this.classes.reduce((sum, c) => sum + this.getClassEnrolledCount(c), 0);
  }

  getClassCapacity(c: ClassItem): number {
    if (!c.sections || c.sections.length === 0) return 0;
    return c.sections.reduce((sum, s) => sum + (s.capacity || 40), 0);
  }

  getClassEnrolledCount(c: ClassItem): number {
    if (!c.sections || c.sections.length === 0) return 0;
    return c.sections.reduce((sum, s: any) => sum + (Number(s.enrolled_count) || 0), 0);
  }

  get studentEnrollSections(): SectionItem[] {
    const cls = this.classes.find((c) => c.id === this.studentEnrollClassId);
    return cls?.sections || [];
  }

  onStudentEnrollClassChange() {
    const sections = this.studentEnrollSections;
    this.newStudent.sectionId = sections.length > 0 ? sections[0].id : '';
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
    let list = this.staffList;
    if (this.staffStatusFilter === 'ACTIVE') {
      list = list.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    } else if (this.staffStatusFilter === 'INACTIVE') {
      list = list.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'INACTIVE');
    }

    if (this.staffRoleFilter !== 'ALL') {
      if (this.staffRoleFilter === 'CLASS_TEACHER') {
        list = list.filter((s) => (s.role || '').toUpperCase() === 'CLASS_TEACHER' || (s.classTeacherSections && s.classTeacherSections.length > 0));
      } else {
        list = list.filter((s) => (s.role || '').toUpperCase() === this.staffRoleFilter);
      }
    }

    if (!this.staffSearchQuery.trim()) return list;
    const q = this.staffSearchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        s.role.toLowerCase().includes(q) ||
        (s.roleName && s.roleName.toLowerCase().includes(q)) ||
        (s.classTeacherSections && s.classTeacherSections.some((cts) => `${cts.className} ${cts.sectionName}`.toLowerCase().includes(q))) ||
        (s.subjectAssignments && s.subjectAssignments.some((sa) => `${sa.subjectName} ${sa.className} ${sa.sectionName}`.toLowerCase().includes(q)))
    );
  }

  get paginatedStaff(): StaffMember[] {
    const list = this.filteredStaff;
    const start = (this.staffCurrentPage - 1) * this.staffPageSize;
    return list.slice(start, start + this.staffPageSize);
  }

  get staffTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredStaff.length / this.staffPageSize));
  }

  get staffStartIndex(): number {
    return (this.staffCurrentPage - 1) * this.staffPageSize;
  }

  get staffEndIndex(): number {
    return Math.min(this.staffStartIndex + this.staffPageSize, this.filteredStaff.length);
  }

  exportStaffCsv() {
    const rows = this.filteredStaff.map((s) => ({
      fullName: s.fullName,
      role: s.role,
      email: s.email,
      phone: s.phone || '',
      classIncharge: (s.classTeacherSections || []).map((cts) => `${cts.className}-${cts.sectionName}`).join(', ') || 'None',
      subjects: (s.subjectAssignments || []).map((sa) => `${sa.subjectName} (${sa.className}-${sa.sectionName})`).join(', ') || 'None',
      status: (s.status || 'ACTIVE').toUpperCase(),
    }));

    this.exportService.exportToCsv(
      `Faculty_Staff_Directory_${this.staffStatusFilter.toLowerCase()}`,
      rows,
      [
        { key: 'fullName', label: 'Staff Full Name' },
        { key: 'role', label: 'Role Designation' },
        { key: 'email', label: 'Email / Username' },
        { key: 'phone', label: 'Phone Number' },
        { key: 'classIncharge', label: 'Class Teacher Incharge' },
        { key: 'subjects', label: 'Teaching Subject Allocations' },
        { key: 'status', label: 'Account Status' },
      ]
    );
    this.toast.success('Faculty directory CSV downloaded!');
  }

  printStaffDirectory() {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Campus';
    const rowsHtml = this.filteredStaff
      .map(
        (s) => `
        <tr>
          <td><strong>${s.fullName}</strong></td>
          <td>${s.role}</td>
          <td>${s.email}</td>
          <td>${s.phone || '—'}</td>
          <td>${(s.classTeacherSections || []).map((cts) => `${cts.className}-${cts.sectionName}`).join(', ') || '—'}</td>
          <td>${(s.status || 'ACTIVE').toUpperCase()}</td>
        </tr>`
      )
      .join('');

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        <strong>Faculty & Staff Directory</strong> | <strong>Total Listed:</strong> ${this.filteredStaff.length} Members | <strong>Status Filter:</strong> ${this.staffStatusFilter}
      </div>
      <table>
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Class Incharge</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    this.exportService.printReport('Faculty and Staff Directory', schoolName, tableHtml);
  }

  get availableGraduationSessions(): string[] {
    const set = new Set<string>();
    for (const a of this.alumniList) {
      if (a.graduation_session) set.add(a.graduation_session);
    }
    return Array.from(set).sort().reverse();
  }

  get filteredAlumni(): AlumniStudent[] {
    return this.alumniList.filter((a) => {
      if (this.selectedGraduationSession !== 'ALL' && a.graduation_session !== this.selectedGraduationSession) {
        return false;
      }
      if (!this.alumniSearchQuery.trim()) return true;
      const q = this.alumniSearchQuery.toLowerCase().trim();
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.admission_number.toLowerCase().includes(q) ||
        (a.last_class_name && a.last_class_name.toLowerCase().includes(q)) ||
        (a.graduation_session && a.graduation_session.toLowerCase().includes(q)) ||
        (a.primary_contact?.first_name && a.primary_contact.first_name.toLowerCase().includes(q))
      );
    });
  }

  get paginatedAlumni(): AlumniStudent[] {
    const start = (this.alumniCurrentPage - 1) * this.alumniPageSize;
    return this.filteredAlumni.slice(start, start + this.alumniPageSize);
  }

  get alumniTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAlumni.length / this.alumniPageSize));
  }

  setTab(tab: 'CLASSES' | 'STUDENTS' | 'ALUMNI' | 'STAFF' | 'SUBJECTS') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.toLowerCase() },
      queryParamsHandling: 'merge',
    });
    if (tab === 'ALUMNI') {
      this.loadAlumniList();
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab']?.toLowerCase();
      if (tab === 'classes') {
        this.activeTab = 'CLASSES';
      } else if (tab === 'staff') {
        this.activeTab = 'STAFF';
      } else if (tab === 'subjects') {
        this.activeTab = 'SUBJECTS';
      } else if (tab === 'alumni') {
        this.activeTab = 'ALUMNI';
      } else if (tab === 'students') {
        this.activeTab = 'STUDENTS';
      }

      if (params['manageSessions'] || params['openSessionModal'] === 'true') {
        this.openSessionModal();
      }
    });

    this.loadAcademicSessions();
    this.loadClassesAndSubjects();
    this.loadStaffList();
    this.loadAlumniList();
    this.loadDeactivationRequests();
  }

  loadDeactivationRequests() {
    this.loadingDeactivationRequests = true;
    this.api.get<StudentDeactivationRequest[]>('academics/students/deactivation-requests').subscribe({
      next: (res) => {
        this.deactivationRequests = res || [];
        this.loadingDeactivationRequests = false;
      },
      error: () => {
        this.deactivationRequests = [];
        this.loadingDeactivationRequests = false;
      },
    });
  }

  // --- Staff Status Toggle ---
  openToggleStaffStatus(staff: StaffMember, newStatus: 'ACTIVE' | 'INACTIVE', event: Event) {
    event.stopPropagation();
    this.selectedStaffForStatus = staff;
    this.staffStatusAction = newStatus;
    this.modalService.open('STAFF_STATUS_MODAL');
    this.showStaffStatusModal = true;
  }

  closeStaffStatusModal() {
    this.modalService.close();
    this.showStaffStatusModal = false;
    this.selectedStaffForStatus = null;
  }

  executeToggleStaffStatus() {
    if (!this.selectedStaffForStatus) return;
    const staff = this.selectedStaffForStatus;
    const action = this.staffStatusAction;
    this.updatingStaffStatus = true;

    this.api.patch(`academics/staff/${staff.id}/status`, { status: action }).subscribe({
      next: () => {
        this.updatingStaffStatus = false;
        this.closeStaffStatusModal();
        staff.status = action;
        this.toast.success(`Staff member "${staff.fullName}" is now ${action}.`);
        this.loadStaffList();
      },
      error: (err: any) => {
        this.updatingStaffStatus = false;
        this.toast.error(err.error?.message || err.message || 'Failed to update staff status.');
      },
    });
  }

  // --- Student Status Direct Toggle (Admin / Principal) ---
  openToggleStudentStatus(student: StudentItem, newStatus: 'ACTIVE' | 'INACTIVE', event: Event) {
    event.stopPropagation();
    this.selectedStudentForStatus = student;
    this.studentStatusAction = newStatus;
    this.studentStatusReason = newStatus === 'INACTIVE' ? 'Administrative deactivation' : 'Re-admitted / Reactivated';
    this.modalService.open('STUDENT_STATUS_MODAL');
    this.showStudentStatusModal = true;
  }

  closeStudentStatusModal() {
    this.modalService.close();
    this.showStudentStatusModal = false;
    this.selectedStudentForStatus = null;
  }

  executeToggleStudentStatus() {
    if (!this.selectedStudentForStatus) return;
    const student = this.selectedStudentForStatus;
    const action = this.studentStatusAction;
    this.updatingStudentStatus = true;

    const studentId = student.studentId || student.id || student.enrollmentId;
    this.api.patch(`academics/students/${studentId}/status`, {
      status: action,
      reason: this.studentStatusReason.trim() || undefined,
    }).subscribe({
      next: () => {
        this.updatingStudentStatus = false;
        this.closeStudentStatusModal();
        student.status = action;
        this.toast.success(`Student "${student.fullName}" marked as ${action}.`);
        if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err: any) => {
        this.updatingStudentStatus = false;
        this.toast.error(err.error?.message || err.message || 'Failed to update student status.');
      },
    });
  }

  // --- Teacher Student Deactivation Request ---
  openTeacherDeactModal(student: StudentItem, event: Event) {
    event.stopPropagation();
    this.selectedStudentForDeactRequest = student;
    this.deactRequestReason = 'Transfer / Relocation';
    this.deactRequestComments = '';
    this.deactModalError = '';
    this.modalService.open('TEACHER_DEACT_MODAL');
    this.showTeacherDeactModal = true;
  }

  closeTeacherDeactModal() {
    this.modalService.close();
    this.showTeacherDeactModal = false;
    this.selectedStudentForDeactRequest = null;
  }

  submitTeacherDeactRequest() {
    if (!this.selectedStudentForDeactRequest) return;
    if (!this.deactRequestReason.trim()) {
      this.deactModalError = 'Please select a reason.';
      return;
    }
    if (!this.deactRequestComments.trim()) {
      this.deactModalError = 'Please provide detailed remarks / justification for deactivation.';
      return;
    }
    this.submittingDeactRequest = true;
    this.deactModalError = '';

    const payload = {
      student_id: this.selectedStudentForDeactRequest.studentId || this.selectedStudentForDeactRequest.id || this.selectedStudentForDeactRequest.enrollmentId,
      student_name: this.selectedStudentForDeactRequest.fullName,
      admission_number: this.selectedStudentForDeactRequest.admissionNumber,
      class_name: this.selectedStudentForDeactRequest.className,
      section_name: this.selectedStudentForDeactRequest.sectionName,
      reason: this.deactRequestReason,
      comments: this.deactRequestComments.trim(),
    };

    this.api.post('academics/students/deactivation-requests', payload).subscribe({
      next: () => {
        this.submittingDeactRequest = false;
        this.closeTeacherDeactModal();
        this.toast.success(`Deactivation request submitted for ${payload.student_name}. Sent to Principal/Admin for review.`);
        this.loadDeactivationRequests();
      },
      error: (err: any) => {
        this.submittingDeactRequest = false;
        this.deactModalError = this.formatErrorMessage(err, 'Failed to submit deactivation request.');
      },
    });
  }

  // --- Deactivation Requests Review Modal ---
  openDeactivationRequestsModal() {
    this.loadDeactivationRequests();
    this.reviewNotes = '';
    this.modalService.open('DEACT_REQUESTS_MODAL');
    this.showDeactivationRequestsModal = true;
  }

  closeDeactivationRequestsModal() {
    this.modalService.close();
    this.showDeactivationRequestsModal = false;
  }

  reviewDeactivationRequest(req: StudentDeactivationRequest, action: 'APPROVED' | 'REJECTED') {
    if (!confirm(`Are you sure you want to ${action === 'APPROVED' ? 'APPROVE (this will mark student INACTIVE)' : 'REJECT'} this request for ${req.student_name}?`)) {
      return;
    }
    this.api.patch(`academics/students/deactivation-requests/${req.id}/review`, {
      action,
      reviewNotes: this.reviewNotes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success(`Request ${action.toLowerCase()} successfully.`);
        this.loadDeactivationRequests();
        if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || err.message || `Failed to ${action.toLowerCase()} request.`);
      },
    });
  }

  get filteredStudents(): StudentItem[] {
    let list = this.students;
    if (this.studentStatusFilter === 'ACTIVE') {
      list = list.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    } else if (this.studentStatusFilter === 'INACTIVE') {
      list = list.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'INACTIVE');
    }
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toString().includes(q))
    );
  }

  loadAcademicSessions() {
    this.api.get<AcademicSession[]>('academics/sessions').subscribe({
      next: (res) => {
        this.academicSessions = res || [];
        if (!this.auth.activeAcademicSession() && this.academicSessions.length > 0) {
          const current = this.academicSessions.find((s) => s.is_current) || this.academicSessions[0];
          this.auth.setActiveSession(current);
        }
      },
      error: (err) => console.error('Failed to load academic sessions', err),
    });
  }

  loadAlumniList() {
    this.api.get<AlumniStudent[]>('academics/alumni').subscribe({
      next: (res) => {
        this.alumniList = res || [];
      },
      error: () => {
        this.alumniList = [];
      },
    });
  }

  loadClassesAndSubjects() {
    const activeSession = this.auth.activeAcademicSession();
    const params = activeSession ? { academicYearId: activeSession.id } : undefined;

    this.api.get<ClassItem[]>('academics/classes', params).subscribe((res) => {
      const sorted = (res || []).sort(
        (a, b) => this.getClassRank(a.name, a.code, a.display_order) - this.getClassRank(b.name, b.code, b.display_order)
      );

      // Scope classes for Teacher
      const teacherClassNames = new Set<string>();
      const teachingScope = this.auth.currentUser()?.teachingScope;
      if (teachingScope) {
        teachingScope.classTeacherSections?.forEach((cts) => teacherClassNames.add(cts.className.toLowerCase()));
        teachingScope.subjectAssignments?.forEach((sa) => teacherClassNames.add(sa.className.toLowerCase()));
      }

      if (this.auth.isTeacher() && teacherClassNames.size > 0) {
        this.classes = sorted.filter((c) => teacherClassNames.has(c.name.toLowerCase()));
      } else {
        this.classes = sorted;
      }

      if (this.classes.length > 0) {
        const stillSelected = this.selectedClass ? this.classes.find((c) => c.id === this.selectedClass?.id) : null;
        this.selectClass(stillSelected || this.classes[0]);
      } else {
        this.selectedClass = null;
        this.selectedSection = null;
        this.students = [];
      }
    });

    this.api.get<SubjectItem[]>('academics/subjects').subscribe((res) => {
      this.subjects = res;
    });
  }

  loadStaffList() {
    this.api.get<StaffMember[]>('academics/staff').subscribe({
      next: (res) => {
        this.staffList = (res || []).filter(
          (s) =>
            s.email?.toLowerCase() !== 'admin@schoolscence.in' &&
            s.id !== '00000000-0000-0000-0000-000000000001' &&
            (s.role || '').toUpperCase() !== 'SUPER_ADMIN'
        );
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
    const activeSession = this.auth.activeAcademicSession();
    const params = activeSession ? { academicYearId: activeSession.id } : undefined;
    this.api.get<StudentItem[]>(`academics/sections/${sec.id}/students`, params).subscribe((res) => {
      this.students = res || [];
      this.currentPage = 1;
    });
  }

  get paginatedStudents(): StudentItem[] {
    const list = this.filteredStudents;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredStudents.length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredStudents.length);
  }

  // --- Session Management & Promotion Rollover ---
  openSessionModal() {
    const currentName = this.auth.activeSessionName();
    let nextName = '2027–2028';
    if (currentName && currentName.includes('–')) {
      const parts = currentName.split('–');
      const startYear = parseInt(parts[0], 10);
      const endYear = parseInt(parts[1], 10);
      if (!isNaN(startYear) && !isNaN(endYear)) {
        nextName = `${startYear + 1}–${endYear + 1}`;
      }
    } else if (currentName && currentName.includes('-')) {
      const parts = currentName.split('-');
      const startYear = parseInt(parts[0], 10);
      const endYear = parseInt(parts[1], 10);
      if (!isNaN(startYear) && !isNaN(endYear)) {
        nextName = `${startYear + 1}–${endYear + 1}`;
      }
    }

    this.newSession = {
      name: nextName,
      startDate: '2027-04-01',
      endDate: '2028-03-31',
      isCurrent: true,
      promoteStudents: true,
    };
    this.sessionModalError = '';
    this.modalService.open('SESSION_MODAL');
    this.showSessionModal = true;
  }

  closeSessionModal() {
    this.modalService.close();
    this.showSessionModal = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { manageSessions: null, openSessionModal: null },
      queryParamsHandling: 'merge',
    });
  }

  switchAcademicSession(session: AcademicSession) {
    this.auth.setActiveSession(session);
    this.toast.success(`Switched active academic session to "${session.name}"`);
    this.loadClassesAndSubjects();
    this.loadAlumniList();
  }

  promptDeleteSession(session: AcademicSession) {
    if (this.academicSessions.length <= 1) {
      this.toast.warning('Cannot delete the only configured academic session.');
      return;
    }
    this.modalService.open('DELETE_SESSION');
    this.sessionToDelete = session;
  }

  cancelDeleteSession() {
    this.modalService.close();
    this.sessionToDelete = null;
    this.isDeletingSession = false;
  }

  executeDeleteSession() {
    if (!this.sessionToDelete) return;
    const session = this.sessionToDelete;
    this.isDeletingSession = true;

    this.api.delete(`academics/sessions/${session.id}`).subscribe({
      next: () => {
        this.isDeletingSession = false;
        this.sessionToDelete = null;
        this.modalService.close();
        this.toast.success(`Academic session "${session.name}" deleted successfully.`);

        const active = this.auth.activeAcademicSession();
        if (active && active.id === session.id) {
          const remaining = this.academicSessions.filter((s) => s.id !== session.id);
          const nextCurrent = remaining.find((s) => s.is_current) || remaining[0];
          if (nextCurrent) {
            this.auth.setActiveSession(nextCurrent);
          }
        }

        this.loadAcademicSessions();
        this.loadClassesAndSubjects();
        this.loadAlumniList();
      },
      error: (err: any) => {
        this.isDeletingSession = false;
        this.toast.error(err.message || 'Failed to delete academic session.');
      },
    });
  }

  saveSessionAndRollover() {
    if (!this.newSession.name.trim() || !this.newSession.startDate || !this.newSession.endDate) {
      this.sessionModalError = 'Session Name, Start Date, and End Date are required.';
      return;
    }

    this.savingSession = true;
    this.sessionModalError = '';

    const currentSession = this.auth.activeAcademicSession() || this.academicSessions.find((s) => s.is_current);

    this.api.post<any>('academics/sessions', {
      name: this.newSession.name,
      startDate: this.newSession.startDate,
      endDate: this.newSession.endDate,
      isCurrent: this.newSession.isCurrent,
    }).subscribe({
      next: (created: any) => {
        const newSessionId = created.session_id || created.id;

        // If promotion requested and we have a previous session to promote from
        if (this.newSession.promoteStudents && currentSession && newSessionId) {
          this.api.post<any>('academics/sessions/rollover', {
            fromSessionId: currentSession.id,
            toSessionId: newSessionId,
          }).subscribe({
            next: (rolloverRes: any) => {
              this.savingSession = false;
              this.closeSessionModal();
              this.toast.success(
                `Session ${this.newSession.name} created! Promoted ${rolloverRes.promoted_count || 0} students & moved ${rolloverRes.graduated_alumni_count || 0} graduates to Alumni Directory.`
              );
              this.loadAcademicSessions();
              this.loadClassesAndSubjects();
              this.loadAlumniList();
            },
            error: (err: any) => {
              this.savingSession = false;
              this.closeSessionModal();
              this.toast.warning(`Session created, but rollover encountered an issue: ${err.message || 'Check database logs'}`);
              this.loadAcademicSessions();
              this.loadClassesAndSubjects();
              this.loadAlumniList();
            },
          });
        } else {
          this.savingSession = false;
          this.closeSessionModal();
          this.toast.success(`Academic Session "${this.newSession.name}" created successfully!`);
          this.loadAcademicSessions();
          this.loadClassesAndSubjects();
          this.loadAlumniList();
        }
      },
      error: (err: any) => {
        this.savingSession = false;
        this.sessionModalError = this.formatErrorMessage(err, 'Failed to create academic session.');
      },
    });
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
    this.modalService.open('ADD_SUBJECT');
    this.showAddSubjectModal = true;
  }

  closeAddSubjectModal() {
    this.modalService.close();
    this.showAddSubjectModal = false;
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
        this.closeAddSubjectModal();
        this.subjects.push(created);
        this.toast.success(`Subject "${created.name}" (${created.code}) created successfully!`);
      },
      error: (err) => {
        this.savingSubject = false;
        this.subjectModalError = this.formatErrorMessage(err, 'Failed to create subject. Please check code uniqueness.');
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
          this.toast.error(this.formatErrorMessage(err, 'Failed to delete subject.'));
        },
      });
    }
  }

  // --- Add Student ---
  generateUniqueAdmissionNumber(): string {
    const yr = new Date().getFullYear();
    const timeSeq = String(Date.now()).slice(-4);
    const randSeq = Math.floor(100 + Math.random() * 900);
    return `ADM-${yr}-${timeSeq}${randSeq}`;
  }

  openAddStudentModal() {
    const initialClass = this.selectedClass || (this.classes.length > 0 ? this.classes[0] : null);
    this.studentEnrollClassId = initialClass?.id || '';
    const initialSectionId = (this.selectedSection && this.selectedClass?.id === initialClass?.id)
      ? this.selectedSection.id
      : (initialClass?.sections?.[0]?.id || '');

    this.newStudent = {
      firstName: '',
      lastName: '',
      admissionNumber: this.generateUniqueAdmissionNumber(),
      rollNumber: `${this.students.length + 1}`,
      sectionId: initialSectionId,
      gender: 'MALE',
      dateOfBirth: '2015-05-15',
      bloodGroup: 'B+',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      relationship: 'FATHER',
    };
    this.studentModalError = '';
    this.modalService.open('ADD_STUDENT');
    this.showAddStudentModal = true;
  }

  closeAddStudentModal() {
    this.modalService.close();
    this.showAddStudentModal = false;
  }

  saveStudent() {
    if (!this.newStudent.firstName.trim() || !this.newStudent.admissionNumber.trim() || !this.newStudent.sectionId) {
      this.studentModalError = 'First Name, Admission Number, Class, and Section are required.';
      return;
    }
    this.savingStudent = true;
    this.studentModalError = '';

    const payload = {
      ...this.newStudent,
      classId: this.studentEnrollClassId,
      academicYearId: this.auth.activeAcademicSession()?.id,
    };

    this.api.post('academics/students', payload).subscribe({
      next: (res: any) => {
        this.savingStudent = false;
        this.closeAddStudentModal();
        this.toast.success(`Student ${res.fullName || this.newStudent.firstName} enrolled successfully!`);
        
        // Find target class and section to automatically switch view to the student's section
        const targetClass = this.classes.find(c => c.id === this.studentEnrollClassId) 
          || this.classes.find(c => c.sections?.some(s => s.id === this.newStudent.sectionId)) 
          || this.selectedClass;
        const targetSection = targetClass?.sections?.find(s => s.id === this.newStudent.sectionId) 
          || this.selectedSection;

        if (targetClass) this.selectedClass = targetClass;
        if (targetSection) {
          this.selectSection(targetSection);
        } else if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err) => {
        this.savingStudent = false;
        this.studentModalError = this.formatErrorMessage(err, 'Failed to enroll student. Please verify admission number.');
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
      primarySubjectId: '',
      password: 'password123',
    };
    this.staffModalError = '';
    this.modalService.open('ADD_STAFF');
    this.showAddStaffModal = true;
  }

  closeAddStaffModal() {
    this.modalService.close();
    this.showAddStaffModal = false;
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
        this.closeAddStaffModal();
        this.toast.success(`Staff member ${res.firstName} registered successfully!`);
        this.loadStaffList();
      },
      error: (err) => {
        this.savingStaff = false;
        this.staffModalError = this.formatErrorMessage(err, 'Failed to register staff. Please verify email uniqueness.');
      },
    });
  }

  // --- Exports ---
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

  exportAlumniCsv() {
    const rows = this.filteredAlumni.map((al) => ({
      admissionNumber: al.admission_number,
      fullName: al.full_name,
      lastClass: `${al.last_class_name || 'Class 12'} - ${this.formatSection(al.last_section_name)}`,
      graduationSession: al.graduation_session || 'Graduated',
      guardian: `${al.primary_contact?.first_name || ''} ${al.primary_contact?.last_name || ''}`.trim(),
      phone: al.primary_contact?.phone || '',
    }));

    this.exportService.exportToCsv(
      `Alumni_Directory_${this.selectedGraduationSession}`,
      rows,
      [
        { key: 'admissionNumber', label: 'Admission Number' },
        { key: 'fullName', label: 'Alumni Student Name' },
        { key: 'lastClass', label: 'Terminal Class & Section' },
        { key: 'graduationSession', label: 'Passing Academic Session' },
        { key: 'guardian', label: 'Primary Guardian' },
        { key: 'phone', label: 'Guardian Phone' },
      ]
    );
    this.toast.success('Alumni register CSV downloaded!');
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

  printAlumniDirectory() {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Campus';

    const rowsHtml = this.filteredAlumni
      .map(
        (al) => `
        <tr>
          <td>${al.admission_number}</td>
          <td><strong>${al.full_name}</strong></td>
          <td>${al.last_class_name || 'Class 12'} - ${this.formatSection(al.last_section_name)}</td>
          <td>${al.graduation_session || 'Graduated'}</td>
          <td>${al.primary_contact?.first_name || ''} ${al.primary_contact?.last_name || ''}</td>
          <td>${al.primary_contact?.phone || '—'}</td>
        </tr>`
      )
      .join('');

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        <strong>Batch / Session:</strong> ${this.selectedGraduationSession} | <strong>Total Alumni:</strong> ${this.filteredAlumni.length}
      </div>
      <table>
        <thead>
          <tr>
            <th>Admission No</th>
            <th>Student Name</th>
            <th>Terminal Class</th>
            <th>Passing Session</th>
            <th>Guardian Name</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    this.exportService.printReport(`Alumni Register - ${this.selectedGraduationSession}`, schoolName, tableHtml);
  }

  getClassRank(name: string, code?: string, displayOrder?: number): number {
    const norm = (name || '').toLowerCase().trim();
    const codeNorm = (code || '').toLowerCase().trim();

    if (norm.includes('pre-nur') || norm.includes('pre nur') || norm.includes('prenur') || norm.includes('play') || codeNorm.includes('pre_nur') || codeNorm.includes('prenur')) return 1;
    if (norm === 'nursery' || norm.includes('nur') || codeNorm === 'nur') return 2;
    if (norm.includes('lkg') || norm.includes('kg-1') || norm.includes('kg 1') || norm.includes('kg1') || norm.includes('jr') || codeNorm.includes('lkg')) return 3;
    if (norm.includes('ukg') || norm.includes('kg-2') || norm.includes('kg 2') || norm.includes('kg2') || norm.includes('sr') || codeNorm.includes('ukg')) return 4;

    const numMatch = norm.match(/\d+/);
    if (numMatch) {
      return 4 + parseInt(numMatch[0], 10);
    }
    if (typeof displayOrder === 'number' && displayOrder > 0) {
      return 100 + displayOrder;
    }
    return 999;
  }

  // --- Class & Section Management ---
  onGradeSelect(gradeName: string) {
    const found = this.STANDARD_GRADE_LEVELS.find((g) => g.name === gradeName);
    if (found) {
      this.newClass.name = found.name;
      this.newClass.code = found.code;
      this.newClass.display_order = found.order;
    } else {
      this.onClassNameChange();
    }
  }

  onClassNameChange() {
    if (!this.newClass.code) {
      this.newClass.code = this.newClass.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().slice(0, 10);
    }
    this.newClass.display_order = this.getClassRank(this.newClass.name, this.newClass.code);
  }

  openAddClassModal() {
    this.newClass = {
      name: '',
      code: '',
      display_order: (this.classes.length || 0) + 1,
      capacity: 40,
      sectionsList: ['Section A', 'Section B'],
    };
    this.customSectionInput = '';
    this.classModalError = '';
    this.modalService.open('ADD_CLASS');
    this.showAddClassModal = true;
  }

  closeAddClassModal() {
    this.modalService.close();
    this.showAddClassModal = false;
    this.customSectionInput = '';
  }

  addCustomSectionToNewClass() {
    const raw = this.customSectionInput.trim();
    if (!raw) return;
    if (!this.newClass.sectionsList.includes(raw)) {
      this.newClass.sectionsList.push(raw);
    }
    this.customSectionInput = '';
  }

  removeSectionFromNewClass(s: string) {
    const idx = this.newClass.sectionsList.indexOf(s);
    if (idx >= 0) {
      if (this.newClass.sectionsList.length > 1) {
        this.newClass.sectionsList.splice(idx, 1);
      } else {
        this.toast.info('At least one section is required for a class.');
      }
    }
  }

  togglePresetSectionInNewClass(s: string) {
    const formatted = /^[A-Za-z]$/.test(s) ? `Section ${s.toUpperCase()}` : s;
    const direct = s;
    const exists = this.newClass.sectionsList.includes(formatted) || this.newClass.sectionsList.includes(direct);
    if (exists) {
      this.newClass.sectionsList = this.newClass.sectionsList.filter(item => item !== formatted && item !== direct);
      if (this.newClass.sectionsList.length === 0) {
        this.newClass.sectionsList = [formatted];
      }
    } else {
      this.newClass.sectionsList.push(formatted);
    }
  }

  toggleSectionInNewClass(sec: string) {
    const idx = this.newClass.sectionsList.indexOf(sec);
    if (idx >= 0) {
      if (this.newClass.sectionsList.length > 1) {
        this.newClass.sectionsList.splice(idx, 1);
      } else {
        this.toast.info('At least one section is required for a class.');
      }
    } else {
      this.newClass.sectionsList.push(sec);
      this.newClass.sectionsList.sort();
    }
  }

  submitAddClass() {
    if (!this.newClass.name.trim()) {
      this.classModalError = 'Class / Grade name is required.';
      return;
    }
    if (!this.newClass.sectionsList || this.newClass.sectionsList.length === 0) {
      this.classModalError = 'Please add at least 1 section.';
      return;
    }
    this.savingClass = true;
    this.classModalError = '';

    const derivedOrder = this.getClassRank(this.newClass.name, this.newClass.code, this.newClass.display_order);
    const payload = {
      name: this.newClass.name.trim(),
      code: (this.newClass.code || this.newClass.name.replace(/[^a-zA-Z0-9]/g, '')).toUpperCase(),
      display_order: derivedOrder,
      capacity: Number(this.newClass.capacity) || 40,
      sections: this.newClass.sectionsList,
    };

    this.api.post('academics/classes', payload).subscribe({
      next: () => {
        this.savingClass = false;
        this.closeAddClassModal();
        this.toast.success(`Class "${payload.name}" provisioned successfully with sections!`);
        this.loadClassesAndSubjects();
      },
      error: (err) => {
        this.savingClass = false;
        this.classModalError = this.formatErrorMessage(err, 'Failed to create class. Please verify name and code uniqueness.');
      },
    });
  }

  openAddSectionModal(classItem?: ClassItem) {
    const targetClass = classItem || this.selectedClass || (this.classes.length > 0 ? this.classes[0] : null);
    this.newSection = {
      class_id: targetClass?.id || '',
      name: 'Section C',
      code: 'C',
      capacity: 40,
      class_teacher_id: '',
    };
    this.sectionModalError = '';
    this.modalService.open('ADD_SECTION');
    this.showAddSectionModal = true;
  }

  closeAddSectionModal() {
    this.modalService.close();
    this.showAddSectionModal = false;
  }

  onSectionNameChange() {
    if (!this.newSection.code) {
      this.newSection.code = this.newSection.name.replace(/Section\s*/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    }
  }

  setSectionPreset(name: string, code?: string) {
    this.newSection.name = name;
    this.newSection.code = code || name.replace(/Section\s*/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
  }

  submitAddSection() {
    if (!this.newSection.class_id) {
      this.sectionModalError = 'Please select a parent class.';
      return;
    }
    if (!this.newSection.name.trim()) {
      this.sectionModalError = 'Section name is required.';
      return;
    }
    this.savingSection = true;
    this.sectionModalError = '';

    this.api.post('academics/sections', {
      class_id: this.newSection.class_id,
      name: this.newSection.name.trim(),
      code: (this.newSection.code || this.newSection.name.replace(/Section\s*/i, '')).trim().toUpperCase(),
      capacity: Number(this.newSection.capacity) || 40,
      class_teacher_id: this.newSection.class_teacher_id || null,
    }).subscribe({
      next: () => {
        this.savingSection = false;
        this.closeAddSectionModal();
        this.toast.success(`Section "${this.newSection.name}" created successfully!`);
        this.loadClassesAndSubjects();
        this.loadStaffList();
      },
      error: (err) => {
        this.savingSection = false;
        this.sectionModalError = this.formatErrorMessage(err, 'Failed to create section.');
      },
    });
  }

  // 3-Dot Action Menus
  toggleClassMenu(classId: string, event: Event) {
    event.stopPropagation();
    this.activeClassMenuId = this.activeClassMenuId === classId ? null : classId;
    this.activeSectionMenuId = null;
  }

  toggleSectionMenu(sectionId: string, event: Event) {
    event.stopPropagation();
    this.activeSectionMenuId = this.activeSectionMenuId === sectionId ? null : sectionId;
    this.activeClassMenuId = null;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeClassMenuId = null;
    this.activeSectionMenuId = null;
    this.isSessionDropdownOpen = false;
  }

  // View Class Roster
  viewClassRoster(c: ClassItem) {
    this.selectedClass = c;
    this.selectedSection = null;
    this.activeClassMenuId = null;
    this.setTab('STUDENTS');
  }

  // View Section Roster
  viewStudentsOfSection(c: ClassItem, sec: SectionItem) {
    this.selectedClass = c;
    this.selectedSection = sec;
    this.activeClassMenuId = null;
    this.activeSectionMenuId = null;
    this.setTab('STUDENTS');
  }

  // Edit Class Modal Handlers
  openEditClassModal(c: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeClassMenuId = null;
    this.classToEdit = c;
    this.editClassForm = {
      name: c.name,
      code: c.code,
      display_order: c.display_order || 1,
    };
    this.editClassModalError = '';
    this.modalService.open('EDIT_CLASS');
    this.showEditClassModal = true;
  }

  closeEditClassModal() {
    this.modalService.close();
    this.showEditClassModal = false;
    this.classToEdit = null;
    this.editClassModalError = '';
  }

  onEditGradeSelect(gradeName: string) {
    const found = this.STANDARD_GRADE_LEVELS.find((g) => g.name === gradeName);
    if (found) {
      this.editClassForm.code = found.code;
      this.editClassForm.display_order = found.order;
    }
  }

  submitEditClass() {
    if (!this.classToEdit) return;
    if (!this.editClassForm.name.trim()) {
      this.editClassModalError = 'Class name is required.';
      return;
    }
    if (!this.editClassForm.code.trim()) {
      this.editClassModalError = 'Class code is required.';
      return;
    }
    this.savingEditClass = true;
    this.editClassModalError = '';

    this.api.put(`academics/classes/${this.classToEdit.id}`, this.editClassForm).subscribe({
      next: () => {
        this.toast.success(`Class "${this.editClassForm.name}" updated successfully.`);
        this.savingEditClass = false;
        this.closeEditClassModal();
        this.loadClassesAndSubjects();
      },
      error: (err) => {
        this.savingEditClass = false;
        this.editClassModalError = this.formatErrorMessage(err, 'Failed to update class.');
      },
    });
  }

  // Edit Section Modal Handlers
  openEditSectionModal(sec: SectionItem, c: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeSectionMenuId = null;
    this.sectionToEdit = { section: sec, classItem: c };
    this.editSectionForm = {
      name: sec.name,
      code: sec.code || sec.name.replace(/^section\s+/i, '').trim(),
      capacity: sec.capacity || 40,
      display_order: sec.display_order || 1,
      class_teacher_id: sec.class_teacher_id || '',
    };
    this.editSectionModalError = '';
    this.modalService.open('EDIT_SECTION');
    this.showEditSectionModal = true;
  }

  closeEditSectionModal() {
    this.modalService.close();
    this.showEditSectionModal = false;
    this.sectionToEdit = null;
    this.editSectionModalError = '';
  }

  onEditSectionNameChange() {
    const raw = this.editSectionForm.name.trim();
    if (/^[A-Z]$/i.test(raw)) {
      this.editSectionForm.code = raw.toUpperCase();
    } else if (raw) {
      this.editSectionForm.code = raw.replace(/^section\s+/i, '').trim().toUpperCase().slice(0, 10);
    }
  }

  setEditSectionPreset(name: string) {
    this.editSectionForm.name = name;
    this.onEditSectionNameChange();
  }

  submitEditSection() {
    if (!this.sectionToEdit) return;
    if (!this.editSectionForm.name.trim()) {
      this.editSectionModalError = 'Section name is required.';
      return;
    }
    this.savingEditSection = true;
    this.editSectionModalError = '';

    const body: any = {
      name: this.editSectionForm.name.trim(),
      code: this.editSectionForm.code.trim().toUpperCase(),
      capacity: this.editSectionForm.capacity,
      class_teacher_id: this.editSectionForm.class_teacher_id || null,
    };

    this.api.put(`academics/sections/${this.sectionToEdit.section.id}`, body).subscribe({
      next: () => {
        this.toast.success(`Section "${this.formatSection(this.editSectionForm.name)}" updated successfully.`);
        this.savingEditSection = false;
        this.closeEditSectionModal();
        this.loadClassesAndSubjects();
        this.loadStaffList();
      },
      error: (err) => {
        this.savingEditSection = false;
        this.editSectionModalError = this.formatErrorMessage(err, 'Failed to update section.');
      },
    });
  }

  // Delete Class Confirmation Modal Handlers
  promptDeleteClass(c: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeClassMenuId = null;
    this.classToDelete = c;
    this.modalService.open('DELETE_CLASS');
    this.showDeleteClassModal = true;
  }

  closeDeleteClassModal() {
    this.modalService.close();
    this.showDeleteClassModal = false;
    this.classToDelete = null;
  }

  executeDeleteClass() {
    if (!this.classToDelete) return;
    this.isDeletingClass = true;
    this.api.delete(`academics/classes/${this.classToDelete.id}`).subscribe({
      next: () => {
        this.toast.success(`Class "${this.classToDelete?.name}" and its sections deleted successfully.`);
        this.isDeletingClass = false;
        this.closeDeleteClassModal();
        this.loadClassesAndSubjects();
      },
      error: (err) => {
        this.isDeletingClass = false;
        this.toast.error(this.formatErrorMessage(err, 'Failed to delete class.'));
      },
    });
  }

  // Delete Section Confirmation Modal Handlers
  promptDeleteSection(sec: SectionItem, c: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeSectionMenuId = null;
    this.sectionToDelete = { section: sec, classItem: c };
    this.modalService.open('DELETE_SECTION');
    this.showDeleteSectionModal = true;
  }

  closeDeleteSectionModal() {
    this.modalService.close();
    this.showDeleteSectionModal = false;
    this.sectionToDelete = null;
  }

  executeDeleteSection() {
    if (!this.sectionToDelete) return;
    this.isDeletingSection = true;
    this.api.delete(`academics/sections/${this.sectionToDelete.section.id}`).subscribe({
      next: () => {
        this.toast.success(`Section "${this.formatSection(this.sectionToDelete?.section.name || '')}" deleted successfully.`);
        this.isDeletingSection = false;
        this.closeDeleteSectionModal();
        this.loadClassesAndSubjects();
      },
      error: (err) => {
        this.isDeletingSection = false;
        this.toast.error(this.formatErrorMessage(err, 'Failed to delete section.'));
      },
    });
  }
}
