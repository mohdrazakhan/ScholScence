import { Component, OnInit, inject, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, getClassPedagogicalRank } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { ModalService } from '../../core/services/modal.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ClassItem, SubjectItem, StudentItem, SectionItem, AcademicSession, AlumniStudent, StudentDeactivationRequest, StudentLifecycleLog } from '../../core/models';

interface StaffMember {
  id: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  avatarUrl?: string;
  role: string;
  roleName?: string;
  primarySubjectId?: string;
  primarySubjectName?: string;
  classTeacherSections?: { sectionId: string; sectionName: string; className: string }[];
  subjectAssignments?: { sectionId: string; sectionName: string; className: string; subjectName: string; subjectCode: string }[];
  gender?: string;
  dateOfBirth?: string;
  dob?: string;
  qualification?: string;
  experience?: string;
  joiningDate?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  department?: string;
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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div class="min-w-0">
          <h1 *ngIf="activeTab === 'CLASSES'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Manage Classes & Grade Sections
          </h1>
          <h1 *ngIf="activeTab === 'STUDENTS'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Student Admissions & Enrolled Roster
          </h1>
          <div *ngIf="activeTab === 'ALUMNI'">
            <h1 class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Alumni & Graduated Students Directory
            </h1>
            <div class="flex items-center flex-wrap gap-2 mt-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                Permanent Register
              </span>
              <p class="text-xs text-slate-500 leading-relaxed">
                Permanent register of students who completed their terminal class.
              </p>
            </div>
          </div>
          <h1 *ngIf="activeTab === 'STAFF'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Faculty & Staff Directory
          </h1>
          <h1 *ngIf="activeTab === 'SUBJECTS'" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Curriculum Subjects Master
          </h1>

          <p *ngIf="activeTab === 'CLASSES'" class="text-xs text-slate-500 mt-1 leading-relaxed">
            Configure grade hierarchy, section divisions, and classroom capacities.
          </p>
          <p *ngIf="activeTab === 'STUDENTS'" class="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage student admissions, parent guardian records, and class rosters.
          </p>
          <p *ngIf="activeTab === 'STAFF'" class="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage teaching faculty, staff roles, credentials, and class allocations.
          </p>
          <p *ngIf="activeTab === 'SUBJECTS'" class="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage subject codes, theory/practical grading weights, and courses.
          </p>
        </div>

        <!-- Action Buttons Contextual to Active View -->
        <div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto">
          <!-- Session Pill & Switcher Dropdown (Neutral Style) -->
          <div *ngIf="canManage" class="relative inline-block">
            <button type="button" (click)="toggleSessionDropdown($event)"
                    class="px-3 py-2 sm:px-3.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Switch or create academic sessions">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Session: {{ auth.activeSessionName() }}</span>
              <svg class="w-3 h-3 text-slate-400 transition-transform duration-200" [class.rotate-180]="isSessionDropdownOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Backdrop to close dropdown -->
            <div *ngIf="isSessionDropdownOpen" (click)="isSessionDropdownOpen = false" class="fixed inset-0 z-40"></div>

            <!-- Dropdown Menu -->
            <div *ngIf="isSessionDropdownOpen"
                 class="absolute left-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn">
              
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
                        [ngClass]="auth.activeAcademicSession()?.id === ses.id ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 font-medium'">
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

                  <div *ngIf="auth.activeAcademicSession()?.id === ses.id" class="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
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
                        class="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer">
                  <span>⚡ Manage Sessions & Rollover</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Buttons for CLASSES tab -->
          <button *ngIf="canManage && activeTab === 'CLASSES'" (click)="openAddClassModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Class</span>
          </button>

          <!-- Buttons for STUDENTS tab -->
          <button *ngIf="canManage && activeTab === 'STUDENTS'" (click)="openAddStudentModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Add Student</span>
          </button>

          <!-- Buttons for ALUMNI tab -->
          <button *ngIf="canManage && activeTab === 'ALUMNI'" (click)="openAddAlumniModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Add Alumni</span>
          </button>

          <!-- Buttons for STAFF tab -->
          <button *ngIf="canManage && activeTab === 'STAFF'" (click)="openAddStaffModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Faculty</span>
          </button>

          <!-- Buttons for SUBJECTS tab -->
          <button *ngIf="canManage && activeTab === 'SUBJECTS'" (click)="openAddSubjectModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
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
        <!-- Mobile View (Single Merged Card) -->
        <div class="sm:hidden p-4 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
          <div class="grid grid-cols-3 divide-x divide-slate-100 text-center">
            <!-- Metric 1: Total Classes -->
            <div class="px-1.5 flex flex-col items-center justify-center">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Classes</span>
              <span class="text-base font-black text-slate-900 mt-0.5">
                {{ loadingClasses ? '—' : classes.length }}
              </span>
              <span class="text-[9px] text-slate-500 truncate mt-0.5">Grade Levels</span>
            </div>

            <!-- Metric 2: Active Sections -->
            <div class="px-1.5 flex flex-col items-center justify-center">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sections</span>
              <span class="text-base font-black text-emerald-700 mt-0.5">
                {{ loadingClasses ? '—' : totalSectionsCount }}
              </span>
              <span class="text-[9px] text-slate-500 truncate mt-0.5">Divisions</span>
            </div>

            <!-- Metric 3: Students & Capacity -->
            <div class="px-1.5 flex flex-col items-center justify-center">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Intake</span>
              <span class="text-base font-black text-purple-700 mt-0.5">
                {{ loadingClasses ? '—' : (totalEnrolledStudents + '/' + totalCampusCapacity) }}
              </span>
              <span class="text-[9px] text-slate-500 truncate mt-0.5">Students/Cap</span>
            </div>
          </div>
        </div>

        <!-- Desktop View (3 Distinct Cards) -->
        <div class="hidden sm:grid sm:grid-cols-3 gap-4">
          <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
              <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Grade Levels</div>
              <div class="text-xl font-black text-slate-900 mt-0.5">{{ loadingClasses ? '—' : (classes.length + ' Classes') }}</div>
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
              <div class="text-xl font-black text-emerald-700 mt-0.5">{{ loadingClasses ? '—' : (totalSectionsCount + ' Sections') }}</div>
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
              <div class="text-xl font-black text-purple-700 mt-0.5">{{ loadingClasses ? '—' : (totalEnrolledStudents + ' / ' + totalCampusCapacity) }}</div>
              <div class="text-[10px] text-slate-500">Enrolled out of total classroom capacity</div>
            </div>
          </div>
        </div>

        <!-- Classes Loading State: Modern Animated Circle Loader -->
        <div *ngIf="loadingClasses" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] p-16 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
          <div class="relative w-16 h-16 flex items-center justify-center">
            <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-indigo-500 animate-spin"></div>
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center absolute shadow-inner">
              <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.948 49.948 0 00-9.902 3.912l-.003.002c-.114.06-.24.09-.366.09a.747.747 0 01-.366-.09l-.003-.002A49.948 49.948 0 002.062 10.057.75.75 0 011.83 8.72a60.65 60.65 0 0110.47-5.915z" />
                <path d="M5.68 12.32a.75.75 0 00-.736.638C4.544 15.352 4.148 18.067 4 20.25a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75c0-1.748.243-3.921.65-6.02a.75.75 0 00-.638-.86l-.332-.05zM12 15.75c-3.14 0-6.035-.873-8.25-2.38v4.38a1 1 0 00.5.866C6.544 19.92 9.172 20.5 12 20.5s5.456-.58 7.75-1.884a1 1 0 00.5-.866v-4.38c-2.215 1.507-5.11 2.38-8.25 2.38z" />
              </svg>
            </div>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-black text-slate-900 tracking-tight">Loading Academic Classes</h4>
            <p class="text-xs text-slate-400 font-medium">Fetching grade hierarchy, sections, and curriculum...</p>
          </div>
        </div>

        <!-- Classes & Sections Cards Grid (Loaded) -->
        <div *ngIf="!loadingClasses" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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

                <!-- Right Header: Total Intake / Fill Badge + 3-Dot Actions Menu -->
                <div class="flex items-center gap-2">
                  <!-- Intake Capacity & Fill Badge -->
                  <div class="px-2.5 py-1 rounded-xl text-[11px] font-black border flex items-center gap-1.5 shadow-2xs transition-all"
                       [ngClass]="getClassEnrolledCount(c) >= getClassCapacity(c) && getClassCapacity(c) > 0 
                         ? 'bg-rose-50 border-rose-200 text-rose-700' 
                         : getClassEnrolledCount(c) > 0 
                           ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
                           : 'bg-slate-50 border-slate-200 text-slate-500'"
                       title="Total Enrolled Students / Total Section Capacity across all sections">
                    <span class="w-1.5 h-1.5 rounded-full"
                          [ngClass]="getClassEnrolledCount(c) >= getClassCapacity(c) && getClassCapacity(c) > 0 
                            ? 'bg-rose-500' 
                            : getClassEnrolledCount(c) > 0 
                              ? 'bg-indigo-500' 
                              : 'bg-slate-400'"></span>
                    <span>{{ getClassEnrolledCount(c) }} / {{ getClassCapacity(c) }}</span>
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

                    <button type="button" (click)="openAddSubjectToClass(c, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Add Subject</span>
                    </button>

                    <button type="button" (click)="openAddSectionModal(c)"
                            class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                      <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
            </div>

            <!-- Sections Container (Collapsible) -->
            <div class="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div (click)="toggleSectionsCollapse(c.id, $event)"
                     class="flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer select-none transition-colors group">
                  <div class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-all shadow-2xs">
                      <svg *ngIf="isSectionsExpanded(c.id)" class="w-3.5 h-3.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      <svg *ngIf="!isSectionsExpanded(c.id)" class="w-3.5 h-3.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <span>Sections ({{ c.sections.length || 0 }})</span>
                  </div>
                  <span>Capacity: <strong class="text-slate-700">{{ getClassEnrolledCount(c) }} / {{ getClassCapacity(c) }}</strong></span>
                </div>

                <!-- Sections list (Collapsible, hidden by default unless expanded) -->
                <div *ngIf="isSectionsExpanded(c.id)" class="grid grid-cols-1 gap-2 pt-1 animate-fadeIn">
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

                          <button type="button" (click)="openAddSubjectToSection(sec, c, $event)"
                                  class="w-full px-3 py-1.5 text-left font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition-colors cursor-pointer">
                            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>Add Subject</span>
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

              <!-- Class Curriculum Subjects Overview (Collapsible) -->
              <div class="mt-3.5 pt-3 border-t border-slate-100/90">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                  <div (click)="toggleSubjectsCollapse(c.id, $event)"
                       class="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 cursor-pointer select-none transition-colors group">
                    <span class="w-5 h-5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-all shadow-2xs">
                      <svg *ngIf="isSubjectsExpanded(c.id)" class="w-3.5 h-3.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      <svg *ngIf="!isSubjectsExpanded(c.id)" class="w-3.5 h-3.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Class Subjects ({{ getClassSubjects(c).length }})</span>
                  </div>

                  <button type="button" (click)="openAddSubjectToClass(c, $event)"
                          class="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    <span>Add Subject</span>
                  </button>
                </div>

                <!-- Subjects list (Collapsible, hidden by default unless expanded) -->
                <div *ngIf="isSubjectsExpanded(c.id)" class="animate-fadeIn">
                  <div *ngIf="getClassSubjects(c).length > 0" class="flex flex-wrap gap-1.5 pt-0.5">
                    <span *ngFor="let sub of getClassSubjects(c)" 
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white text-slate-800 border border-slate-200/90 shadow-2xs group/sub hover:border-slate-300 transition-colors">
                      <span class="font-bold text-slate-900">{{ sub.name }}</span>
                      <span *ngIf="!sub.is_all_sections && sub.section_names?.length" 
                            class="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-900 font-bold border border-amber-200">
                        {{ sub.section_names.join(', ') }}
                      </span>
                      <span *ngIf="sub.is_all_sections || !sub.section_names?.length" 
                            class="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        All Sec
                      </span>
                      <!-- Remove Subject Button -->
                      <button *ngIf="canManage"
                              type="button" 
                              (click)="promptDeleteSubject(sub, c, $event)" 
                              title="Remove Subject {{ sub.name }}"
                              class="w-4 h-4 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer ml-0.5">
                        <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </span>
                  </div>

                  <div *ngIf="getClassSubjects(c).length === 0" 
                       (click)="openAddSubjectToClass(c, $event)"
                       class="py-2 px-3 bg-slate-50/70 hover:bg-indigo-50/50 border border-dashed border-slate-200 hover:border-indigo-300 rounded-xl text-center cursor-pointer transition-colors group">
                    <span class="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 flex items-center justify-center gap-1">
                      <svg class="w-3 h-3 text-slate-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                      No subjects added yet. Click to add.
                    </span>
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
        <!-- Top Tactile Neumorphic Class Selector (Push Style on Selected) -->
        <div *ngIf="!loadingClasses && classes.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          <div *ngFor="let c of classes"
               (click)="selectClass(c)"
               [ngClass]="selectedClass?.id === c.id 
                 ? 'neu-pushed' 
                 : 'neu-elevated'"
               class="p-3 sm:p-3.5 rounded-2xl cursor-pointer flex flex-col justify-between select-none">
            <div class="flex items-center justify-between gap-1">
              <span class="text-xs font-black truncate" [class.text-slate-900]="selectedClass?.id === c.id" [class.text-slate-800]="selectedClass?.id !== c.id">
                {{ c.name }}
              </span>
              <span class="text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0"
                    [ngClass]="selectedClass?.id === c.id 
                      ? 'bg-slate-900 text-white shadow-2xs' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'"
                    title="Enrolled Students / Total Capacity">
                {{ getClassEnrolledCount(c) }}/{{ getClassCapacity(c) }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-2.5 pt-2 border-t text-[10px]"
                 [ngClass]="selectedClass?.id === c.id ? 'border-slate-300/80 text-slate-600 font-bold' : 'border-slate-100 text-slate-400 font-medium'">
              <span>{{ c.sections.length || 0 }} Sec</span>
              <span class="font-mono font-bold">{{ c.code }}</span>
            </div>
          </div>
        </div>

        <!-- If 0 classes configured: prompt to go to Classes tab -->
        <div *ngIf="!loadingClasses && classes.length === 0"
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
        <div *ngIf="!loadingClasses && classes.length > 0" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <!-- Top Section: Class Heading, Section Pills, Status Filters & Action Bar -->
          <div class="p-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-[#f8fafc]/90 rounded-t-3xl space-y-3.5">
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
                  <button (click)="studentStatusFilter = 'SUSPENDED'; currentPage = 1"
                          [class.bg-amber-600]="studentStatusFilter === 'SUSPENDED'"
                          [class.text-white]="studentStatusFilter === 'SUSPENDED'"
                          [class.text-slate-600]="studentStatusFilter !== 'SUSPENDED'"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer">
                    Suspended
                  </button>
                  <button (click)="studentStatusFilter = 'LEFTOUT'; currentPage = 1"
                          [class.bg-purple-600]="studentStatusFilter === 'LEFTOUT'"
                          [class.text-white]="studentStatusFilter === 'LEFTOUT'"
                          [class.text-slate-600]="studentStatusFilter !== 'LEFTOUT'"
                          class="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer">
                    Leftout / TC
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

          <!-- Student Directory Loading State: Modern Animated Circle Loader -->
          <div *ngIf="loadingStudents || loadingClasses" class="p-16 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
            <div class="relative w-16 h-16 flex items-center justify-center">
              <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-indigo-500 animate-spin"></div>
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center absolute shadow-inner">
                <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.633 13.067 13.067 0 01-6.761 1.87 13.067 13.067 0 01-6.761-1.87.75.75 0 01-.363-.633l-.001-.122zM16.5 19.128l-.003.043-.012.142-.05.357a8.55 8.55 0 01-.353 1.157c.725.105 1.47.16 2.228.16 2.916 0 5.617-.79 7.9-2.164a.75.75 0 00.39-.656v-.007a6.375 6.375 0 00-10.1-5.195 7.848 7.848 0 010 6.36z" />
                </svg>
              </div>
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-black text-slate-900 tracking-tight">Loading Student Roster</h4>
              <p class="text-xs text-slate-400 font-medium">Please wait a moment while admissions and grade rosters synchronize...</p>
            </div>
          </div>

          <!-- VIEW 1: DESKTOP CLAY TABLE (md:block) -->
          <div *ngIf="!loadingStudents && !loadingClasses" class="hidden md:block overflow-x-auto min-h-[380px] pb-32">
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
                <tr *ngFor="let st of paginatedStudents; let idx = index"
                    class="hover:bg-slate-50/80 transition-colors"
                    [class.relative]="true"
                    [class.z-30]="activeStudentMenuId === (st.studentId || st.id)">
                  <td class="px-6 py-3.5 font-bold font-mono text-slate-700">#{{ st.rollNumber || '—' }}</td>
                  <td class="px-6 py-3.5 font-mono text-slate-500 font-semibold">{{ st.admissionNumber }}</td>
                  <td class="px-6 py-3.5 font-bold text-slate-900">
                    <div (click)="viewStudentDetails(st, $event)" class="flex items-center gap-2.5 cursor-pointer group hover:text-indigo-600 transition-colors">
                      <div class="w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center group-hover:bg-indigo-600 transition-colors shrink-0 overflow-hidden border border-slate-200">
                        <img *ngIf="st.photoUrl || st.photo_url" [src]="st.photoUrl || st.photo_url" class="w-full h-full object-cover" alt="Student" />
                        <span *ngIf="!st.photoUrl && !st.photo_url">{{ st.firstName.charAt(0) }}</span>
                      </div>
                      <span class="group-hover:underline underline-offset-2">{{ st.fullName }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 text-slate-500 capitalize">
                    {{ st.gender?.toLowerCase() || '—' }} <span *ngIf="st.bloodGroup" class="font-bold text-slate-700">({{ st.bloodGroup }})</span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="flex items-center gap-2">
                      <div *ngIf="st.guardianPhotoUrl || st.primaryContact?.photo_url || st.primaryContact?.photoUrl" class="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200">
                        <img [src]="st.guardianPhotoUrl || st.primaryContact?.photo_url || st.primaryContact?.photoUrl" class="w-full h-full object-cover" alt="Guardian" />
                      </div>
                      <div>
                        <div class="font-bold text-slate-800">{{ st.primaryContact?.first_name || '—' }} {{ st.primaryContact?.last_name || '' }}</div>
                        <div class="text-[10px] font-mono text-slate-400">{{ st.primaryContact?.phone || '—' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 text-slate-700 font-semibold">
                    {{ st.className }} - {{ formatSection(st.sectionName) }}
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border-emerald-200': (st.status || 'ACTIVE').toUpperCase() === 'ACTIVE',
                            'bg-indigo-50 text-indigo-700 border-indigo-200': (st.status || 'ACTIVE').toUpperCase() === 'ALUMNI' || (st.status || 'ACTIVE').toUpperCase() === 'GRADUATED',
                            'bg-rose-50 text-rose-700 border-rose-200': (st.status || 'ACTIVE').toUpperCase() === 'INACTIVE',
                            'bg-amber-50 text-amber-800 border-amber-200': (st.status || 'ACTIVE').toUpperCase() === 'SUSPENDED',
                            'bg-purple-50 text-purple-700 border-purple-200': (st.status || 'ACTIVE').toUpperCase() === 'LEFTOUT' || (st.status || 'ACTIVE').toUpperCase() === 'TRANSFERRED'
                          }">
                      {{ (st.status || 'ACTIVE').toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-right">
                    <div class="relative inline-block text-right">
                      <!-- 3-Dot Action Button -->
                      <button type="button" (click)="toggleStudentMenu(st.studentId || st.id, $event)" title="Student Actions"
                              class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>

                      <!-- Student Dropdown Actions List (Directly Anchored to 3-Dot Button) -->
                      <div *ngIf="activeStudentMenuId === (st.studentId || st.id)"
                           [ngClass]="getStudentMenuPlacement(st)"
                           class="absolute right-0 w-52 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-xs text-left">
                        
                        <!-- 0. View Details & Logs Option -->
                        <button type="button" (click)="viewStudentDetails(st, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Details & Logs</span>
                        </button>

                        <!-- 1. Edit Option (Admin / Management) -->
                        <button *ngIf="canManage" type="button" (click)="openEditStudentModal(st, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Details</span>
                        </button>

                        <!-- ================= ADMIN / PRINCIPAL DIRECT ACTIONS ================= -->
                        <ng-container *ngIf="canDirectlyDeactivateStudent">
                          <!-- Promote to Next Class -->
                          <button type="button" (click)="openPromoteStudentModal(st, $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Promote to Next Class</span>
                          </button>

                          <!-- Change Section -->
                          <button type="button" (click)="openChangeSectionModal(st, $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Change Section</span>
                          </button>

                          <!-- Demote to Previous Class -->
                          <button type="button" (click)="openDemoteStudentModal(st, $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            <span>Demote to Previous Class</span>
                          </button>

                          <!-- Mark Inactive / Active -->
                          <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                                  type="button" (click)="openToggleStudentStatus(st, 'INACTIVE', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span>Mark Inactive</span>
                          </button>

                          <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'ACTIVE'"
                                  type="button" (click)="openToggleStudentStatus(st, 'ACTIVE', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Mark Active</span>
                          </button>

                          <!-- Suspend Student Option -->
                          <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'SUSPENDED'"
                                  type="button" (click)="openToggleStudentStatus(st, 'SUSPENDED', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Suspend Student</span>
                          </button>

                          <!-- Leftout / TC Option -->
                          <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'LEFTOUT'"
                                  type="button" (click)="openToggleStudentStatus(st, 'LEFTOUT', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Mark Leftout / TC</span>
                          </button>

                          <!-- Convert / Graduate to Alumni -->
                          <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'ALUMNI'"
                                  type="button" (click)="openConvertToAlumniModal(st, $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-1.5">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            <span>Graduate to Alumni</span>
                          </button>
                        </ng-container>

                        <!-- ================= TEACHER REQUEST WORKFLOW (REQUEST-ONLY) ================= -->
                        <ng-container *ngIf="!canDirectlyDeactivateStudent && canRequestStudentDeactivation">
                          <!-- Request Promotion -->
                          <button type="button" (click)="openTeacherAcademicRequestModal(st, 'PROMOTION', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Request Promotion</span>
                          </button>

                          <!-- Request Section Change -->
                          <button type="button" (click)="openTeacherAcademicRequestModal(st, 'SECTION_CHANGE', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Request Section Change</span>
                          </button>

                          <!-- Request Demotion -->
                          <button type="button" (click)="openTeacherAcademicRequestModal(st, 'DEMOTION', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            <span>Request Demotion</span>
                          </button>

                          <!-- Request Inactive -->
                          <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                                  type="button" (click)="openTeacherAcademicRequestModal(st, 'INACTIVE', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span>Request Inactive</span>
                          </button>

                          <!-- Request Leftout / TC -->
                          <button type="button" (click)="openTeacherAcademicRequestModal(st, 'LEFTOUT', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Request Leftout / TC</span>
                          </button>

                          <!-- Request Alumni Status -->
                          <button type="button" (click)="openTeacherAcademicRequestModal(st, 'ALUMNI', $event)"
                                  class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-1.5">
                            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            <span>Request Alumni Status</span>
                          </button>
                        </ng-container>
                      </div>
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
          <div *ngIf="!loadingStudents && !loadingClasses" class="block md:hidden p-3.5 space-y-3">
            <div *ngFor="let st of paginatedStudents; let idx = index"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/90 shadow-xs space-y-2.5"
                 [class.relative]="true"
                 [class.z-30]="activeStudentMenuId === (st.studentId || st.id)">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 shadow-xs">
                    <img *ngIf="st.photoUrl || st.photo_url" [src]="st.photoUrl || st.photo_url" class="w-full h-full object-cover" alt="Student" />
                    <span *ngIf="!st.photoUrl && !st.photo_url">{{ st.firstName.charAt(0) }}</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md bg-slate-900 text-white font-black text-[10px] font-mono">
                        #{{ st.rollNumber || '—' }}
                      </span>
                      <span class="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] font-mono">
                        {{ st.admissionNumber }}
                      </span>
                      <span class="px-2 py-0.5 rounded-md border font-bold text-[9px]"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-700 border-emerald-200': (st.status || 'ACTIVE').toUpperCase() === 'ACTIVE',
                              'bg-indigo-50 text-indigo-700 border-indigo-200': (st.status || 'ACTIVE').toUpperCase() === 'ALUMNI' || (st.status || 'ACTIVE').toUpperCase() === 'GRADUATED',
                              'bg-rose-50 text-rose-700 border-rose-200': (st.status || 'ACTIVE').toUpperCase() === 'INACTIVE',
                              'bg-amber-50 text-amber-800 border-amber-200': (st.status || 'ACTIVE').toUpperCase() === 'SUSPENDED',
                              'bg-purple-50 text-purple-700 border-purple-200': (st.status || 'ACTIVE').toUpperCase() === 'LEFTOUT' || (st.status || 'ACTIVE').toUpperCase() === 'TRANSFERRED'
                            }">
                        {{ (st.status || 'ACTIVE').toUpperCase() }}
                      </span>
                    </div>
                    <h4 (click)="viewStudentDetails(st, $event)" class="text-sm font-black text-slate-900 mt-1 cursor-pointer hover:text-indigo-600 transition-colors hover:underline underline-offset-2">{{ st.fullName }}</h4>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
                    {{ st.className }} - {{ formatSection(st.sectionName) }}
                  </span>

                  <!-- Mobile 3-Dot Action Button -->
                  <div class="relative inline-block text-right">
                    <button type="button" (click)="toggleStudentMenu(st.studentId || st.id, $event)" title="Student Actions"
                            class="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                      </svg>
                    </button>

                    <!-- Student Dropdown Actions List (Directly Anchored to 3-Dot Button) -->
                    <div *ngIf="activeStudentMenuId === (st.studentId || st.id)"
                         [ngClass]="getStudentMenuPlacement(st)"
                         class="absolute right-0 w-52 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-xs text-left">
                      
                      <!-- 0. View Details & Logs Option -->
                      <button type="button" (click)="viewStudentDetails(st, $event)"
                              class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                        <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Details & Logs</span>
                      </button>

                      <!-- 1. Edit Option (Admin / Management) -->
                      <button *ngIf="canManage" type="button" (click)="openEditStudentModal(st, $event)"
                              class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                        <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Details</span>
                      </button>

                      <!-- ================= ADMIN / PRINCIPAL DIRECT ACTIONS ================= -->
                      <ng-container *ngIf="canDirectlyDeactivateStudent">
                        <!-- Promote to Next Class -->
                        <button type="button" (click)="openPromoteStudentModal(st, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>Promote to Next Class</span>
                        </button>

                        <!-- Change Section -->
                        <button type="button" (click)="openChangeSectionModal(st, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Change Section</span>
                        </button>

                        <!-- Demote to Previous Class -->
                        <button type="button" (click)="openDemoteStudentModal(st, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                          <span>Demote to Previous Class</span>
                        </button>

                        <!-- Mark Inactive / Active -->
                        <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                                type="button" (click)="openToggleStudentStatus(st, 'INACTIVE', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <span>Mark Inactive</span>
                        </button>

                        <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'ACTIVE'"
                                type="button" (click)="openToggleStudentStatus(st, 'ACTIVE', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Mark Active</span>
                        </button>

                        <!-- Suspend Student Option -->
                        <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'SUSPENDED'"
                                type="button" (click)="openToggleStudentStatus(st, 'SUSPENDED', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Suspend Student</span>
                        </button>

                        <!-- Leftout / TC Option -->
                        <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'LEFTOUT'"
                                type="button" (click)="openToggleStudentStatus(st, 'LEFTOUT', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Mark Leftout / TC</span>
                        </button>

                        <!-- Convert / Graduate to Alumni -->
                        <button *ngIf="(st.status || 'ACTIVE').toUpperCase() !== 'ALUMNI'"
                                type="button" (click)="openConvertToAlumniModal(st, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-1.5">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span>Graduate to Alumni</span>
                        </button>
                      </ng-container>

                      <!-- ================= TEACHER REQUEST WORKFLOW (REQUEST-ONLY) ================= -->
                      <ng-container *ngIf="!canDirectlyDeactivateStudent && canRequestStudentDeactivation">
                        <!-- Request Promotion -->
                        <button type="button" (click)="openTeacherAcademicRequestModal(st, 'PROMOTION', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>Request Promotion</span>
                        </button>

                        <!-- Request Section Change -->
                        <button type="button" (click)="openTeacherAcademicRequestModal(st, 'SECTION_CHANGE', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Request Section Change</span>
                        </button>

                        <!-- Request Demotion -->
                        <button type="button" (click)="openTeacherAcademicRequestModal(st, 'DEMOTION', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                          <span>Request Demotion</span>
                        </button>

                        <!-- Request Inactive -->
                        <button *ngIf="(st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                                type="button" (click)="openTeacherAcademicRequestModal(st, 'INACTIVE', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <span>Request Inactive</span>
                        </button>

                        <!-- Request Leftout / TC -->
                        <button type="button" (click)="openTeacherAcademicRequestModal(st, 'LEFTOUT', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Request Leftout / TC</span>
                        </button>

                        <!-- Request Alumni Status -->
                        <button type="button" (click)="openTeacherAcademicRequestModal(st, 'ALUMNI', $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-1.5">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span>Request Alumni Status</span>
                        </button>
                      </ng-container>
                    </div>
                  </div>
                </div>
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
        <!-- Mobile View (Single Merged Card) -->
        <div class="sm:hidden p-4 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff]">
          <div class="grid grid-cols-2 divide-x divide-slate-100 text-center">
            <div class="px-2 flex flex-col items-center justify-center">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alumni</span>
              <span class="text-lg font-black text-slate-900 mt-0.5">{{ alumniList.length }}</span>
              <span class="text-[10px] text-slate-500 mt-0.5">Graduated</span>
            </div>
            <div class="px-2 flex flex-col items-center justify-center">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Batch</span>
              <span class="text-sm font-black text-indigo-700 mt-0.5 tracking-tight whitespace-nowrap">{{ selectedGraduationSession !== 'ALL' ? selectedGraduationSession : (auth.activeSessionName() || '2028–2029') }}</span>
              <span class="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">{{ selectedGraduationSession !== 'ALL' ? 'Filtered Batch' : 'Active Session' }}</span>
            </div>
          </div>
        </div>

        <!-- Desktop View (2 Distinct Cards) -->
        <div class="hidden sm:grid sm:grid-cols-2 gap-3.5">
          <div class="p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs">
              <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Alumni Graduated</div>
              <div class="text-xl font-black text-slate-900 mt-0.5">{{ alumniList.length }}</div>
            </div>
          </div>

          <div class="p-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center shrink-0 shadow-2xs">
              <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">{{ selectedGraduationSession !== 'ALL' ? 'Filtered Batch' : 'Active Academic Session' }}</div>
              <div class="text-xl font-black text-slate-900 mt-0.5 truncate">{{ selectedGraduationSession !== 'ALL' ? selectedGraduationSession : auth.activeSessionName() }}</div>
            </div>
          </div>
        </div>

        <!-- Alumni Register Card with Claymorphic Table & Mobile Cards -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <div class="p-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#f8fafc]">
            
            <div class="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap">
              <div class="flex items-center gap-1.5">
                <h3 class="text-xs sm:text-sm font-black text-slate-900">
                  Alumni Register
                </h3>
                <span class="text-[11px] text-slate-500 font-bold">({{ filteredAlumni.length }})</span>
              </div>

              <!-- Session filter dropdown -->
              <div class="flex items-center gap-1.5 text-xs ml-auto sm:ml-2">
                <span class="text-[11px] text-slate-400 font-semibold hidden sm:inline">Batch:</span>
                <select [(ngModel)]="selectedGraduationSession" (change)="alumniCurrentPage = 1"
                        class="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 shadow-2xs cursor-pointer">
                  <option value="ALL">All Batches</option>
                  <option *ngFor="let s of availableGraduationSessions" [value]="s">{{ s }}</option>
                </select>
              </div>
            </div>

            <!-- Search filter & Export Buttons -->
            <div class="flex items-center gap-2 w-full lg:w-auto">
              <div class="flex-1 sm:w-64">
                <input type="text" [(ngModel)]="alumniSearchQuery" (input)="alumniCurrentPage = 1" placeholder="Search name, admission #..."
                       class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button (click)="exportAlumniCsv()" [disabled]="alumniList.length === 0"
                        title="Export CSV"
                        class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>CSV</span>
                </button>
                
                <button (click)="printAlumniDirectory()" [disabled]="alumniList.length === 0"
                        title="Print Directory"
                        class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Alumni Directory Loading State -->
          <div *ngIf="loadingAlumni" class="p-16 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
            <div class="relative w-12 h-12 flex items-center justify-center">
              <div class="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-800 animate-spin"></div>
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-black text-slate-900 tracking-tight">Loading Alumni Directory</h4>
              <p class="text-xs text-slate-400 font-medium">Synchronizing graduate records...</p>
            </div>
          </div>

          <!-- DESKTOP TABLE VIEW (md:block) -->
          <div *ngIf="!loadingAlumni" class="hidden md:block overflow-x-auto min-h-[380px] pb-32">
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
                  <th class="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let al of paginatedAlumni"
                    class="hover:bg-slate-50/80 transition-colors"
                    [class.relative]="true"
                    [class.z-30]="activeAlumniMenuId === al.student_id">
                  <td class="px-6 py-3.5 font-mono text-slate-600 font-bold">{{ al.admission_number }}</td>
                  <td class="px-6 py-3.5 font-bold text-slate-900">
                    <div (click)="viewStudentDetails(al, $event)" class="flex items-center gap-2 cursor-pointer group hover:text-indigo-600 transition-colors">
                      <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                        {{ (al.full_name || al.first_name || 'A').charAt(0) }}
                      </span>
                      <span class="group-hover:underline underline-offset-2">{{ al.full_name }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 text-slate-700 font-medium">
                    {{ al.last_class_name || 'Class 12' }} - {{ formatSection(al.last_section_name) }}
                  </td>
                  <td class="px-6 py-3.5">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <svg class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      ALUMNI
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-right">
                    <div class="relative inline-block text-right">
                      <!-- 3-Dot Action Button -->
                      <button type="button" (click)="toggleAlumniMenu(al.student_id, $event)" title="Alumni Actions"
                              class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>

                      <!-- Alumni Dropdown Actions List (Viewport Fixed on Top of Everything) -->
                      <div *ngIf="activeAlumniMenuId === al.student_id"
                           [ngStyle]="alumniMenuStyle"
                           class="fixed w-56 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] border border-slate-200 py-1.5 z-[100] animate-fadeIn text-xs text-left">
                        
                        <!-- View Student Lifecycle Journey & Logs -->
                        <button type="button" (click)="openAlumniJourneyModal(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-900 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>Lifecycle Logs & Journey</span>
                        </button>

                        <!-- Generate Transfer Certificate (TC) -->
                        <button type="button" (click)="openTcModal(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Transfer Certificate (TC)</span>
                        </button>

                        <!-- Generate Character Certificate -->
                        <button type="button" (click)="openCharacterCertModal(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Character Certificate</span>
                        </button>

                        <!-- Generate Alumni Certificate (with Alumni #) -->
                        <button type="button" (click)="openAlumniCertModal(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span>Alumni Certificate</span>
                        </button>

                        <!-- View Profile -->
                        <button type="button" (click)="viewStudentDetails(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Profile</span>
                        </button>

                        <!-- Edit Alumni -->
                        <button *ngIf="canManage" type="button" (click)="openEditAlumniModal(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                          <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Details</span>
                        </button>

                        <!-- Delete Record -->
                        <button *ngIf="canManage" type="button" (click)="promptDeleteAlumni(al, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100">
                          <svg class="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Record</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredAlumni.length === 0">
                  <td colspan="8" class="px-6 py-14 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                      <svg class="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div class="font-black text-slate-800 text-sm">No Alumni Records Yet</div>
                    <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                      Students in the highest grade (Class 12) automatically graduate upon session rollover, or you can register alumni directly.
                    </p>
                    <button *ngIf="canManage" (click)="openAddAlumniModal()"
                            class="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 mx-auto">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add First Alumni Student</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- MOBILE CARD VIEW (md:hidden) -->
          <div *ngIf="!loadingAlumni" class="block md:hidden p-3.5 space-y-3">
            <div *ngFor="let al of paginatedAlumni"
                 class="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-[3px_3px_10px_#e2e8f0,-3px_-3px_10px_#ffffff] space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div (click)="viewStudentDetails(al, $event)" class="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                    {{ (al.full_name || al.first_name || 'A').charAt(0) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-black text-slate-900 truncate">{{ al.full_name }}</h4>
                    <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span class="text-[11px] font-mono font-bold text-slate-700">Adm: {{ al.admission_number }}</span>
                      <span class="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[140px]">ID: {{ al.alumni_number || 'ALU-REG' }}</span>
                    </div>
                  </div>
                </div>
                
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  ALUMNI
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-xs">
                <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Class</span>
                  <span class="font-bold text-slate-800 text-xs mt-0.5 block truncate">{{ al.last_class_name || 'Class 12' }} - {{ formatSection(al.last_section_name) }}</span>
                </div>
                <div class="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Passing Session</span>
                  <span class="font-mono font-bold text-indigo-700 text-xs mt-0.5 block truncate">{{ al.graduation_session || 'Graduated' }}</span>
                </div>
              </div>

              <!-- Mobile Quick Actions Row -->
              <div class="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5 text-center">
                <button type="button" (click)="openAlumniJourneyModal(al, $event)"
                        class="py-1.5 px-1 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs transition-all active:scale-95">
                  Logs
                </button>
                <button type="button" (click)="openTcModal(al, $event)"
                        class="py-1.5 px-1 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs transition-all active:scale-95">
                  TC
                </button>
                <button type="button" (click)="openCharacterCertModal(al, $event)"
                        class="py-1.5 px-1 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs transition-all active:scale-95">
                  Char Cert
                </button>
                <button type="button" (click)="openAlumniCertModal(al, $event)"
                        class="py-1.5 px-1 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs transition-all active:scale-95">
                  Alumni Cert
                </button>
              </div>

              <div *ngIf="al.primary_contact?.phone" class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span class="text-[11px] text-slate-400 font-semibold truncate">
                  Guardian: {{ al.primary_contact?.first_name }}
                </span>
                <a [href]="'tel:' + al.primary_contact?.phone" class="font-mono font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 shrink-0 ml-2">
                  <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{{ al.primary_contact?.phone }}</span>
                </a>
              </div>
            </div>

            <div *ngIf="filteredAlumni.length === 0" class="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <div class="font-bold text-slate-700 text-xs">No Alumni Records Found</div>
              <p class="text-[11px] text-slate-400 mt-1">Graduated students appear here following an annual session rollover or direct registration.</p>
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
          
          <!-- Top Section: Status Segmented Tabs & Search/Action Bar -->
          <div class="p-3.5 sm:p-5 border-b border-slate-100 bg-[#f8fafc]/90 space-y-3.5">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              <!-- Status Claymorphic Segmented Filter Tabs (All / Active / Inactive) -->
              <div class="inline-flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] gap-1 overflow-x-auto scrollbar-none shrink-0">
                <!-- Tab: All Staff -->
                <button (click)="staffStatusFilter = 'ALL'; staffCurrentPage = 1"
                        [ngClass]="staffStatusFilter === 'ALL'
                          ? 'bg-white text-slate-900 shadow-[2px_2px_6px_#e2e8f0,-2px_-2px_6px_#ffffff] font-bold border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'"
                        class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>All Staff</span>
                  <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono"
                        [ngClass]="staffStatusFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/60 text-slate-600'">
                    {{ staffList.length }}
                  </span>
                </button>

                <!-- Tab: Active Staff -->
                <button (click)="staffStatusFilter = 'ACTIVE'; staffCurrentPage = 1"
                        [ngClass]="staffStatusFilter === 'ACTIVE'
                          ? 'bg-white text-slate-900 shadow-[2px_2px_6px_#e2e8f0,-2px_-2px_6px_#ffffff] font-bold border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'"
                        class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active</span>
                  <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono"
                        [ngClass]="staffStatusFilter === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-200/60 text-slate-600'">
                    {{ activeStaffCount }}
                  </span>
                </button>

                <!-- Tab: Inactive Staff -->
                <button (click)="staffStatusFilter = 'INACTIVE'; staffCurrentPage = 1"
                        [ngClass]="staffStatusFilter === 'INACTIVE'
                          ? 'bg-white text-slate-900 shadow-[2px_2px_6px_#e2e8f0,-2px_-2px_6px_#ffffff] font-bold border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent font-medium'"
                        class="px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Inactive</span>
                  <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono"
                        [ngClass]="staffStatusFilter === 'INACTIVE' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : 'bg-slate-200/60 text-slate-600'">
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
                  <input type="text" [(ngModel)]="staffSearchQuery" (input)="staffCurrentPage = 1" placeholder="Search name, role, email..."
                         class="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] transition-all" />
                  <button *ngIf="staffSearchQuery" (click)="staffSearchQuery = ''; staffCurrentPage = 1"
                          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">&times;</button>
                </div>

                <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
                  <button (click)="exportStaffCsv()" [disabled]="staffList.length === 0"
                          title="Export Faculty CSV"
                          class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>CSV</span>
                  </button>
                  
                  <button (click)="printStaffDirectory()" [disabled]="staffList.length === 0"
                          title="Print Faculty Directory"
                          class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 active:scale-95">
                    <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Role Filter Chips Bar (Minimal Claymorphic Neutral Pills) -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs scrollbar-none pt-0.5">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Role:</span>
              
              <!-- All Roles -->
              <button (click)="staffRoleFilter = 'ALL'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 active:scale-95">
                All Roles
              </button>

              <!-- Principals -->
              <button (click)="staffRoleFilter = 'PRINCIPAL'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'PRINCIPAL'
                        ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'PRINCIPAL' ? 'text-white' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Principals</span>
                <span class="text-[10px] font-mono" [ngClass]="staffRoleFilter === 'PRINCIPAL' ? 'text-white/80' : 'text-slate-400'">({{ principalsCount }})</span>
              </button>

              <!-- School Admins -->
              <button (click)="staffRoleFilter = 'SCHOOL_ADMIN'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'SCHOOL_ADMIN'
                        ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'SCHOOL_ADMIN' ? 'text-white' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>School Admins</span>
                <span class="text-[10px] font-mono" [ngClass]="staffRoleFilter === 'SCHOOL_ADMIN' ? 'text-white/80' : 'text-slate-400'">({{ adminsCount }})</span>
              </button>

              <!-- Class Incharges -->
              <button (click)="staffRoleFilter = 'CLASS_TEACHER'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'CLASS_TEACHER'
                        ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'CLASS_TEACHER' ? 'text-white' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Class Incharges</span>
                <span class="text-[10px] font-mono" [ngClass]="staffRoleFilter === 'CLASS_TEACHER' ? 'text-white/80' : 'text-slate-400'">({{ classTeachersCount }})</span>
              </button>

              <!-- Subject Teachers -->
              <button (click)="staffRoleFilter = 'TEACHER'; staffCurrentPage = 1"
                      [ngClass]="staffRoleFilter === 'TEACHER'
                        ? 'bg-slate-900 text-white shadow-xs border-slate-900'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 shadow-[2px_2px_5px_#e2e8f0,-2px_-2px_5px_#ffffff]'"
                      class="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5" [ngClass]="staffRoleFilter === 'TEACHER' ? 'text-white' : 'text-slate-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Subject Teachers</span>
                <span class="text-[10px] font-mono" [ngClass]="staffRoleFilter === 'TEACHER' ? 'text-white/80' : 'text-slate-400'">({{ teachersCount }})</span>
              </button>
            </div>
          </div>

          <!-- Staff Directory Loading State: Modern Animated Circle Loader -->
          <div *ngIf="loadingStaff" class="p-16 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
            <div class="relative w-16 h-16 flex items-center justify-center">
              <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-indigo-500 animate-spin"></div>
              <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center absolute shadow-inner">
                <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-black text-slate-900 tracking-tight">Loading Faculty & Staff</h4>
              <p class="text-xs text-slate-400 font-medium">Please wait a moment while employee records synchronize...</p>
            </div>
          </div>

          <!-- VIEW 1: DESKTOP TABLE VIEW (md:block) -->
          <div *ngIf="!loadingStaff" class="hidden md:block overflow-x-auto min-h-[380px] pb-32">
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
                    <div class="flex items-start gap-3">
                      <div class="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs text-white overflow-hidden border border-slate-200 mt-0.5"
                           [ngClass]="{
                             'bg-gradient-to-br from-purple-600 to-indigo-700': staff.role === 'PRINCIPAL',
                             'bg-gradient-to-br from-indigo-700 to-slate-900': staff.role === 'SCHOOL_ADMIN',
                             'bg-gradient-to-br from-emerald-600 to-teal-700': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                             'bg-gradient-to-br from-blue-600 to-indigo-600': staff.role === 'TEACHER'
                           }">
                        <img *ngIf="staff.photoUrl || staff.avatarUrl" [src]="staff.photoUrl || staff.avatarUrl" class="w-full h-full object-cover" alt="Staff" />
                        <span *ngIf="!staff.photoUrl && !staff.avatarUrl">{{ staff.firstName.charAt(0) }}</span>
                      </div>
                      <div class="space-y-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-black text-slate-900">{{ staff.fullName }}</span>
                          <span *ngIf="auth.currentUser()?.id === staff.id" class="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 font-black text-[9px]">
                            YOU
                          </span>
                          <span *ngIf="staff.gender" class="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold">
                            {{ staff.gender === 'MALE' ? 'Male' : (staff.gender === 'FEMALE' ? 'Female' : staff.gender) }}
                          </span>
                          <span *ngIf="staff.bloodGroup" class="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
                            {{ staff.bloodGroup }}
                          </span>
                        </div>
                        
                        <!-- Qualification & Experience Badges -->
                        <div *ngIf="staff.qualification || staff.experience || staff.department" class="flex items-center gap-1 flex-wrap text-[10px]">
                          <span *ngIf="staff.qualification" class="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md font-semibold">
                            {{ staff.qualification }}
                          </span>
                          <span *ngIf="staff.experience" class="text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded-md font-semibold">
                            {{ staff.experience }}
                          </span>
                          <span *ngIf="staff.department" class="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-md font-medium">
                            {{ staff.department }}
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
                    <div *ngIf="staff.address" class="text-slate-400 text-[10px] mt-1 flex items-center gap-1 max-w-[200px] truncate" [title]="staff.address">
                      <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="truncate">{{ staff.address }}</span>
                    </div>
                    <div *ngIf="!staff.phone && !staff.address" class="text-slate-400 text-[11px] mt-0.5">—</div>
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

                  <!-- Action Buttons (Vertical 3-Dot Action Menu) -->
                  <td class="px-6 py-3.5 text-right" [class.relative]="activeStaffMenuId === staff.id" [class.z-40]="activeStaffMenuId === staff.id" (click)="$event.stopPropagation()">
                    <div class="relative inline-block text-right">
                      <!-- 3-Dot Action Button -->
                      <button type="button" (click)="toggleStaffMenu(staff.id, $event)" title="Faculty Actions"
                              class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>

                      <!-- Staff Dropdown Actions Menu (Directly Anchored to 3-Dot Button) -->
                      <div *ngIf="activeStaffMenuId === staff.id"
                           [ngClass]="getStaffMenuPlacement(staff)"
                           class="absolute right-0 w-56 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-xs text-left">
                        
                        <!-- 1. View Full Profile -->
                        <button type="button" (click)="openViewStaffProfile(staff, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Full Profile</span>
                        </button>

                        <!-- 2. Edit Details (Admin / Principal) -->
                        <button *ngIf="canManage" type="button" (click)="openEditStaffModal(staff, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Details</span>
                        </button>

                        <!-- 3. View Weekly Routine / Timetable -->
                        <button type="button" (click)="navigateToFacultyTimetable(staff, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                          <svg class="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Weekly Routine</span>
                        </button>

                        <!-- 4. Deactivate / Reactivate Status Toggle -->
                        <ng-container *ngIf="canDeactivateStaff(staff)">
                          <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                                  type="button" (click)="openToggleStaffStatus(staff, 'INACTIVE', $event); activeStaffMenuId = null"
                                  class="w-full px-3.5 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span>Deactivate Faculty</span>
                          </button>

                          <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'"
                                  type="button" (click)="openToggleStaffStatus(staff, 'ACTIVE', $event); activeStaffMenuId = null"
                                  class="w-full px-3.5 py-2 text-left font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                            <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Reactivate Faculty</span>
                          </button>
                        </ng-container>

                        <!-- 5. Remove from Directory (Admin / Super Admin / Principal) -->
                        <button *ngIf="canDeactivateStaff(staff)"
                                type="button" (click)="confirmDeleteStaff(staff, $event)"
                                class="w-full px-3.5 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100">
                          <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove from Directory</span>
                        </button>
                      </div>
                    </div>
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
          <div *ngIf="!loadingStaff" class="block md:hidden p-3.5 space-y-3">
            <div *ngFor="let staff of paginatedStaff"
                 class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[3px_3px_10px_#e2e8f0,-3px_-3px_10px_#ffffff] space-y-3 relative"
                 [class.z-30]="activeStaffMenuId === staff.id">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" (click)="openViewStaffProfile(staff, $event)">
                  <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs text-white overflow-hidden border border-slate-200"
                       [ngClass]="{
                         'bg-gradient-to-br from-purple-600 to-indigo-700': staff.role === 'PRINCIPAL',
                         'bg-gradient-to-br from-indigo-700 to-slate-900': staff.role === 'SCHOOL_ADMIN',
                         'bg-gradient-to-br from-emerald-600 to-teal-700': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                         'bg-gradient-to-br from-blue-600 to-indigo-600': staff.role === 'TEACHER'
                       }">
                    <img *ngIf="staff.photoUrl || staff.avatarUrl" [src]="staff.photoUrl || staff.avatarUrl" class="w-full h-full object-cover" alt="Staff" />
                    <span *ngIf="!staff.photoUrl && !staff.avatarUrl">{{ staff.firstName.charAt(0) }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <h4 class="text-xs font-black text-slate-900 truncate hover:text-indigo-600 transition-colors">{{ staff.fullName }}</h4>
                      <span *ngIf="auth.currentUser()?.id === staff.id" class="px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold text-[8px]">YOU</span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold border shadow-xs"
                            [ngClass]="{
                              'bg-purple-50 text-purple-700 border-purple-200': staff.role === 'PRINCIPAL',
                              'bg-indigo-50 text-indigo-700 border-indigo-200': staff.role === 'SCHOOL_ADMIN',
                              'bg-emerald-50 text-emerald-700 border-emerald-200': staff.role === 'CLASS_TEACHER' || staff.classTeacherSections?.length,
                              'bg-blue-50 text-blue-700 border-blue-200': staff.role === 'TEACHER'
                            }">
                        {{ staff.role === 'PRINCIPAL' ? 'Principal' : (staff.role === 'SCHOOL_ADMIN' ? 'Admin' : (staff.classTeacherSections?.length ? 'Class Teacher' : 'Teacher')) }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded-lg text-[8px] font-bold border"
                            [ngClass]="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                        {{ (staff.status || 'ACTIVE').toUpperCase() }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Mobile 3-Dot Action Button -->
                <div class="relative shrink-0" (click)="$event.stopPropagation()">
                  <button type="button" (click)="toggleStaffMenu(staff.id, $event)" title="Staff Actions"
                          class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                  </button>

                  <!-- Mobile Attached Dropdown Menu -->
                  <div *ngIf="activeStaffMenuId === staff.id"
                       [ngClass]="getStaffMenuPlacement(staff)"
                       class="absolute right-0 w-52 bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.22)] border border-slate-200/90 py-1.5 z-50 animate-fadeIn text-xs text-left">
                    <button type="button" (click)="openViewStaffProfile(staff, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-slate-800 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                      <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Full Profile</span>
                    </button>

                    <button *ngIf="canManage" type="button" (click)="openEditStaffModal(staff, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                      <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Details</span>
                    </button>

                    <button type="button" (click)="navigateToFacultyTimetable(staff, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-slate-100">
                      <svg class="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Weekly Routine</span>
                    </button>

                    <ng-container *ngIf="canDeactivateStaff(staff)">
                      <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'ACTIVE'"
                              type="button" (click)="openToggleStaffStatus(staff, 'INACTIVE', $event); activeStaffMenuId = null"
                              class="w-full px-3.5 py-2 text-left font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                        <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span>Deactivate Faculty</span>
                      </button>

                      <button *ngIf="(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'"
                              type="button" (click)="openToggleStaffStatus(staff, 'ACTIVE', $event); activeStaffMenuId = null"
                              class="w-full px-3.5 py-2 text-left font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                        <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Reactivate Faculty</span>
                      </button>
                    </ng-container>

                    <button *ngIf="canDeactivateStaff(staff)"
                            type="button" (click)="confirmDeleteStaff(staff, $event)"
                            class="w-full px-3.5 py-2 text-left font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100">
                      <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove from Directory</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Enriched Faculty Badges in Mobile View -->
              <div *ngIf="staff.qualification || staff.experience || staff.department || staff.bloodGroup || staff.gender"
                   class="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span *ngIf="staff.qualification" class="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg font-semibold">
                  {{ staff.qualification }}
                </span>
                <span *ngIf="staff.experience" class="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg font-semibold">
                  {{ staff.experience }}
                </span>
                <span *ngIf="staff.department" class="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg font-medium">
                  {{ staff.department }}
                </span>
                <span *ngIf="staff.bloodGroup" class="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg font-bold">
                  {{ staff.bloodGroup }}
                </span>
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

              <!-- Residential Address snippet if provided -->
              <div *ngIf="staff.address" class="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ staff.address }}</span>
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

              <!-- Quick Action Bar in Mobile Card Footer -->
              <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button type="button" (click)="openViewStaffProfile(staff, $event)"
                        class="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 text-center transition-colors cursor-pointer shadow-2xs active:scale-95">
                  Profile
                </button>
                <button *ngIf="canManage" type="button" (click)="openEditStaffModal(staff, $event)"
                        class="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold border border-indigo-200 text-center transition-colors cursor-pointer shadow-2xs active:scale-95">
                  Edit
                </button>
                <button type="button" (click)="navigateToFacultyTimetable(staff, $event)"
                        class="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-bold border border-blue-200 text-center transition-colors cursor-pointer shadow-2xs active:scale-95">
                  Routine
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
        
        <!-- Subjects Loading State: Modern Animated Circle Loader -->
        <div *ngIf="loadingClasses" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] p-16 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
          <div class="relative w-16 h-16 flex items-center justify-center">
            <div class="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-indigo-500 animate-spin"></div>
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center absolute shadow-inner">
              <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
              </svg>
            </div>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-black text-slate-900 tracking-tight">Loading Curriculum Subjects</h4>
            <p class="text-xs text-slate-400 font-medium">Please wait a moment while assigned subjects synchronize...</p>
          </div>
        </div>

        <!-- Subjects Grid (Loaded) -->
        <div *ngIf="!loadingClasses" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              
              <!-- Assigned Class & Sections Tags -->
              <div *ngIf="s.class_name || (s.section_names && s.section_names.length > 0)" class="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span *ngIf="s.class_name" class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                  {{ s.class_name }}
                </span>
                <span *ngIf="!s.is_all_sections && s.section_names?.length" class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  Sections: {{ s.section_names.join(', ') }}
                </span>
                <span *ngIf="s.is_all_sections" class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  All Sections
                </span>
              </div>

              <p class="text-xs text-slate-500 mt-2 leading-relaxed">{{ s.description || 'Standard institutional curriculum subject.' }}</p>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Active Curriculum
              </span>
              <button *ngIf="canManage" (click)="promptDeleteSubject(s, undefined, $event)"
                      class="text-xs font-bold text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                Delete
              </button>
            </div>
          </div>

          <div *ngIf="subjects.length === 0" class="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            <p class="text-sm font-black text-slate-700">No Curriculum Subjects Configured</p>
            <p class="text-xs text-slate-400 mt-1">Add subjects to your classes or configure campus curriculum.</p>
            <button (click)="openAddSubjectModal()" class="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer">
              + Add First Subject
            </button>
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
              <div class="space-y-3 pt-1 border-t border-slate-200/80">
                <label class="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="newSession.promoteStudents"
                         class="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 mt-0.5" />
                  <div class="text-xs">
                    <span class="font-black text-slate-900">Import & Auto-Promote Students from Previous Session</span>
                    <p class="text-[11px] text-slate-500 mt-0.5">
                      All students advance to the next class automatically. Final grade students move to Alumni Directory.
                    </p>
                  </div>
                </label>

                <!-- Source Session Selector & Rollover Callout -->
                <div *ngIf="newSession.promoteStudents" class="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-indigo-950 text-[11px] space-y-2 animate-fadeIn">
                  <div>
                    <label class="block font-bold text-indigo-950 mb-1">Source Session to Promote Students From *</label>
                    <select [(ngModel)]="newSession.fromSessionId"
                            class="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs">
                      <option *ngFor="let s of academicSessions" [value]="s.id">
                        {{ s.name }} ({{ s.id === auth.activeAcademicSession()?.id ? 'Active' : s.is_current ? 'Current' : 'Session' }})
                      </option>
                    </select>
                  </div>

                  <div class="font-bold flex items-center gap-1.5 text-indigo-900 pt-1 border-t border-indigo-100">
                    <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Annual Promotion & Grade Progression:</span>
                  </div>
                  <ul class="list-disc list-inside space-y-0.5 text-indigo-800 pl-1">
                    <li><strong>Grades Progression:</strong> Nursery ➔ LKG ➔ UKG ➔ Class 1 ... ➔ Class 12.</li>
                    <li><strong>Terminal Class:</strong> Class 12 students graduate to <strong>ALUMNI</strong> and appear in Alumni Directory.</li>
                    <li><strong>Sections:</strong> All class sections are automatically replicated for the new session.</li>
                  </ul>
                </div>

                <label class="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" [(ngModel)]="newSession.isCurrent"
                         class="w-4 h-4 rounded text-slate-900 focus:ring-slate-900" />
                  <span class="text-xs font-bold text-slate-800">Set as Current School Session</span>
                </label>
              </div>
              <!-- Section 3: Reset Database & Start Fresh -->
              <div *ngIf="canManage" class="p-4 bg-rose-50/70 border border-rose-200/90 rounded-2xl space-y-2.5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-start gap-2.5">
                    <span class="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                      ⚠️
                    </span>
                    <div>
                      <h4 class="text-xs font-black text-rose-950">Clean Database & Reset All Sessions/Students</h4>
                      <p class="text-[11px] text-rose-700">Wipe all enrolled students, promotional test sessions, and restart with a single clean 2026–2027 session.</p>
                    </div>
                  </div>
                  <button type="button" (click)="openResetConfirmModal()"
                          class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 self-end sm:self-auto">
                    Reset All Data
                  </button>
                </div>
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

      <!-- Custom Claymorphic Confirmation Modal for Full Database Reset -->
      <div *ngIf="showResetConfirmModal" class="fixed inset-0 flex items-center justify-center p-4 z-[90] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 text-xl shadow-xs">
              ⚠️
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Wipe All Students & Sessions?</h3>
              <p class="text-xs text-slate-500 mt-0.5">
                This action is irreversible and prepares your campus for fresh student enrollment.
              </p>
            </div>
          </div>

          <div class="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 text-xs text-rose-900">
            <div class="font-black flex items-center gap-1.5">
              <span>What will be cleared:</span>
            </div>
            <ul class="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 pl-1">
              <li>All enrolled students across all classes and sections</li>
              <li>All test academic sessions (reset to single active 2026–2027 session)</li>
              <li>Attendance logs, exam marks, and alumni history</li>
            </ul>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="cancelResetConfirm()" [disabled]="isResettingDatabase"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button type="button" (click)="executeResetDatabase()" [disabled]="isResettingDatabase"
                    class="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="isResettingDatabase" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isResettingDatabase ? 'Resetting Database...' : 'Yes, Delete All & Start Fresh' }}</span>
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
              <h3 class="text-base font-black text-slate-900 tracking-tight">{{ isEditingStudent ? 'Edit Student Details' : 'Enroll New Student / Child' }}</h3>
              <p class="text-xs text-slate-500 mt-0.5">{{ isEditingStudent ? 'Update student profile, roll number, class assignment, or guardian details.' : 'Create student record, assign class section, and link guardian profile.' }}</p>
            </div>
            <button (click)="closeAddStudentModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 flex items-center justify-between">
              <strong class="font-bold">Student Profile Details</strong>
              <span *ngIf="newStudent.photoUrl" (click)="removeStudentPhoto()" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">
                Remove Photo
              </span>
            </div>

            <!-- Student Photo Upload Card -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                <img *ngIf="newStudent.photoUrl" [src]="newStudent.photoUrl" class="w-full h-full object-cover" alt="Student Preview" />
                <span *ngIf="!newStudent.photoUrl" class="text-base font-black text-slate-400">
                  {{ (newStudent.firstName || 'S').charAt(0).toUpperCase() }}
                </span>
                <label class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold">
                  <span>{{ newStudent.photoUrl ? 'Change' : 'Upload' }}</span>
                  <input type="file" accept="image/*" (change)="onStudentPhotoSelected($event)" class="hidden" />
                </label>
              </div>
              <div class="flex-1 space-y-1">
                <label [class.opacity-50]="uploadingStudentPhoto"
                       class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>{{ uploadingStudentPhoto ? 'Optimizing...' : (newStudent.photoUrl ? 'Change Student Photo' : 'Upload Student Photo') }}</span>
                  <input type="file" accept="image/*" (change)="onStudentPhotoSelected($event)" [disabled]="uploadingStudentPhoto" class="hidden" />
                </label>
                <p class="text-[10px] text-slate-400">Student passport size photo for ID card, roster, and certificates.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">First Name *</label>
                <input type="text" [(ngModel)]="newStudent.firstName"
                       (keypress)="allowOnlyLetters($event)"
                       (input)="newStudent.firstName = sanitizeName(newStudent.firstName)"
                       placeholder="e.g. Aryan"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Last Name</label>
                <input type="text" [(ngModel)]="newStudent.lastName"
                       (keypress)="allowOnlyLetters($event)"
                       (input)="newStudent.lastName = sanitizeName(newStudent.lastName)"
                       placeholder="e.g. Khan"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-bold text-slate-700">Admission Number *</label>
                  <button type="button" (click)="autoGenerateAdmissionNumber()"
                          class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                    <svg class="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Auto-generate</span>
                  </button>
                </div>
                <input type="text" [(ngModel)]="newStudent.admissionNumber" placeholder="e.g. ADM-DEL-2026-0001"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Roll Number</label>
                <input type="text" [(ngModel)]="newStudent.rollNumber"
                       (keypress)="allowOnlyNumbers($event)"
                       (input)="newStudent.rollNumber = sanitizeNumber(newStudent.rollNumber)"
                       placeholder="e.g. 15"
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
                <select [(ngModel)]="newStudent.bloodGroup"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="">-- Select Blood Group --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <!-- Guardian / Parent Linkage Section -->
            <div class="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 mt-3 flex items-center justify-between">
              <div>
                <strong class="font-black text-xs block text-slate-900">Parent & Guardian Linkage</strong>
                <span class="text-[10px] text-slate-500">Record parents' contact details & assign a primary login email</span>
              </div>
              <span *ngIf="newStudent.guardianPhotoUrl" (click)="removeGuardianPhoto()" class="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">
                Remove Photo
              </span>
            </div>

            <!-- Guardian Photo Upload Card -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                <img *ngIf="newStudent.guardianPhotoUrl" [src]="newStudent.guardianPhotoUrl" class="w-full h-full object-cover" alt="Guardian Preview" />
                <span *ngIf="!newStudent.guardianPhotoUrl" class="text-sm font-black text-slate-400">
                  {{ (newStudent.fatherName || newStudent.motherName || newStudent.guardianName || 'P').charAt(0).toUpperCase() }}
                </span>
                <label class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[9px] font-bold">
                  <span>{{ newStudent.guardianPhotoUrl ? 'Change' : 'Upload' }}</span>
                  <input type="file" accept="image/*" (change)="onGuardianPhotoSelected($event)" class="hidden" />
                </label>
              </div>
              <div class="flex-1 space-y-1">
                <label [class.opacity-50]="uploadingGuardianPhoto"
                       class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span>{{ uploadingGuardianPhoto ? 'Optimizing...' : (newStudent.guardianPhotoUrl ? 'Change Photo' : 'Upload Guardian Photo') }}</span>
                  <input type="file" accept="image/*" (change)="onGuardianPhotoSelected($event)" [disabled]="uploadingGuardianPhoto" class="hidden" />
                </label>
                <p class="text-[10px] text-slate-400">Parent identity photo for campus gate pass verification.</p>
              </div>
            </div>

            <!-- 1. Father Details -->
            <div class="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span class="text-xs font-black text-slate-800 uppercase tracking-wide">1. Father's Details</span>
                </div>
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <input type="radio" name="primaryGuardianType" [(ngModel)]="newStudent.primaryGuardianType" value="FATHER" class="text-indigo-600 focus:ring-indigo-500" />
                  <span>Primary Login</span>
                </label>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Father's Name</label>
                  <input type="text" [(ngModel)]="newStudent.fatherName"
                         (keypress)="allowOnlyLetters($event)"
                         (input)="newStudent.fatherName = sanitizeName(newStudent.fatherName)"
                         placeholder="e.g. Rajesh Sharma"
                         class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Father's Phone Number</label>
                  <input type="text" [(ngModel)]="newStudent.fatherPhone"
                         (keypress)="allowPhoneChars($event)"
                         (input)="newStudent.fatherPhone = sanitizePhone(newStudent.fatherPhone)"
                         placeholder="+91 98765 43210"
                         class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
              </div>
            </div>

            <!-- 2. Mother Details -->
            <div class="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                  <span class="text-xs font-black text-slate-800 uppercase tracking-wide">2. Mother's Details</span>
                </div>
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <input type="radio" name="primaryGuardianType" [(ngModel)]="newStudent.primaryGuardianType" value="MOTHER" class="text-indigo-600 focus:ring-indigo-500" />
                  <span>Primary Login</span>
                </label>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Mother's Name</label>
                  <input type="text" [(ngModel)]="newStudent.motherName"
                         (keypress)="allowOnlyLetters($event)"
                         (input)="newStudent.motherName = sanitizeName(newStudent.motherName)"
                         placeholder="e.g. Sunita Sharma"
                         class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Mother's Phone Number</label>
                  <input type="text" [(ngModel)]="newStudent.motherPhone"
                         (keypress)="allowPhoneChars($event)"
                         (input)="newStudent.motherPhone = sanitizePhone(newStudent.motherPhone)"
                         placeholder="+91 98765 43211"
                         class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
              </div>
            </div>

            <!-- 3. Other / Local Guardian Details (Optional) -->
            <div class="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="text-xs font-black text-slate-800 uppercase tracking-wide">3. Other / Local Guardian (Optional)</span>
                </div>
                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                  <input type="radio" name="primaryGuardianType" [(ngModel)]="newStudent.primaryGuardianType" value="GUARDIAN" class="text-indigo-600 focus:ring-indigo-500" />
                  <span>Primary Login</span>
                </label>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Guardian Name</label>
                  <input type="text" [(ngModel)]="newStudent.guardianName"
                         (keypress)="allowOnlyLetters($event)"
                         (input)="newStudent.guardianName = sanitizeName(newStudent.guardianName)"
                         placeholder="e.g. Ramesh Sharma"
                         class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Guardian Phone</label>
                  <input type="text" [(ngModel)]="newStudent.guardianPhone"
                         (keypress)="allowPhoneChars($event)"
                         (input)="newStudent.guardianPhone = sanitizePhone(newStudent.guardianPhone)"
                         placeholder="+91 98765 43212"
                         class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-xs mb-1">Relationship</label>
                  <select [(ngModel)]="newStudent.guardianRelationship"
                          class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner">
                    <option value="GUARDIAN">Legal Guardian</option>
                    <option value="UNCLE">Uncle</option>
                    <option value="AUNT">Aunt</option>
                    <option value="GRANDPARENT">Grandparent</option>
                    <option value="SIBLING">Elder Sibling</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Single Login Email Account for Parent Portal with Double Entry / Confirmation -->
            <div class="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block font-black text-slate-900 text-xs">
                    Parent Portal Login Email
                    <span class="text-indigo-600 font-semibold">(Single Account)</span>
                  </label>
                  <span class="text-[10px] text-slate-500">Enter and verify the primary email address for parent portal access</span>
                </div>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                  {{ newStudent.primaryGuardianType === 'FATHER' ? "Father's Login" : (newStudent.primaryGuardianType === 'MOTHER' ? "Mother's Login" : "Guardian's Login") }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-slate-700 text-xs">
                      Login Email Address
                    </label>
                    <button *ngIf="newStudent.guardianEmail" type="button" (click)="hideLoginEmail = !hideLoginEmail"
                            class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 focus:outline-none transition-colors">
                      <svg *ngIf="!hideLoginEmail" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <svg *ngIf="hideLoginEmail" class="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                      <span>{{ hideLoginEmail ? 'Show' : 'Hide' }}</span>
                    </button>
                  </div>
                  <input [type]="hideLoginEmail ? 'password' : 'email'"
                         [(ngModel)]="newStudent.guardianEmail"
                         (focus)="hideLoginEmail = false"
                         (copy)="$event.preventDefault()"
                         (cut)="$event.preventDefault()"
                         placeholder="e.g. parent@gmail.com"
                         class="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-inner select-none" />
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block font-bold text-slate-700 text-xs">
                      Verify / Confirm Email *
                    </label>
                    <span *ngIf="newStudent.guardianEmail && newStudent.confirmGuardianEmail && (newStudent.guardianEmail.trim().toLowerCase() === newStudent.confirmGuardianEmail.trim().toLowerCase())"
                          class="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Emails match</span>
                    </span>
                    <span *ngIf="newStudent.guardianEmail && newStudent.confirmGuardianEmail && (newStudent.guardianEmail.trim().toLowerCase() !== newStudent.confirmGuardianEmail.trim().toLowerCase())"
                          class="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <svg class="w-3 h-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Mismatch</span>
                    </span>
                  </div>
                  <input type="email"
                         [(ngModel)]="newStudent.confirmGuardianEmail"
                         (focus)="hideLoginEmail = true"
                         (input)="hideLoginEmail = true"
                         (paste)="$event.preventDefault()"
                         (drop)="$event.preventDefault()"
                         placeholder="Re-enter email to verify"
                         [ngClass]="newStudent.guardianEmail && newStudent.confirmGuardianEmail && (newStudent.guardianEmail.trim().toLowerCase() !== newStudent.confirmGuardianEmail.trim().toLowerCase()) ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500' : 'border-indigo-200 bg-white focus:border-indigo-600'"
                         class="w-full px-3.5 py-2 border rounded-xl text-xs text-slate-900 focus:outline-none shadow-inner" />
                </div>
              </div>

              <p class="text-[10px] text-slate-500 leading-tight">
                This verified email will be used by the family to log into the SchoolSense Parent Portal to track attendance, fees, homework, and report cards.
              </p>
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
              <span *ngIf="!savingStudent">{{ isEditingStudent ? 'Save Changes' : 'Enroll Student' }}</span>
              <span *ngIf="savingStudent">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="showAddStaffModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] sm:max-h-[92vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
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
            <!-- Staff Photo Upload Card -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                <img *ngIf="newStaff.photoUrl" [src]="newStaff.photoUrl" class="w-full h-full object-cover" alt="Faculty Preview" />
                <span *ngIf="!newStaff.photoUrl" class="text-base font-black text-slate-400">
                  {{ (newStaff.firstName || 'T').charAt(0).toUpperCase() }}
                </span>
                <label class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold">
                  <span>{{ newStaff.photoUrl ? 'Change' : 'Upload' }}</span>
                  <input type="file" accept="image/*" (change)="onStaffPhotoSelected($event)" class="hidden" />
                </label>
              </div>
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <label [class.opacity-50]="uploadingStaffPhoto"
                         class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span>{{ uploadingStaffPhoto ? 'Optimizing...' : (newStaff.photoUrl ? 'Change Faculty Photo' : 'Upload Faculty Photo') }}</span>
                    <input type="file" accept="image/*" (change)="onStaffPhotoSelected($event)" [disabled]="uploadingStaffPhoto" class="hidden" />
                  </label>
                  <button *ngIf="newStaff.photoUrl" type="button" (click)="removeStaffPhoto()"
                          class="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-[11px] font-bold rounded-xl border border-rose-200 transition-colors">
                    Remove
                  </button>
                </div>
                <p class="text-[10px] text-slate-400">Official profile picture for faculty directory, class assignments, and student timetable.</p>
              </div>
            </div>

            <!-- SECTION 1: Basic Identity & Account -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>1. Basic Identity & Login Credentials</span>
            </div>

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

            <!-- SECTION 2: Personal & Biographical Details -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mt-3">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span>2. Personal & Biographical Details</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Gender</label>
                <select [(ngModel)]="newStaff.gender"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
                <input type="date" [(ngModel)]="newStaff.dateOfBirth"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Blood Group</label>
                <select [(ngModel)]="newStaff.bloodGroup"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="">-- Select --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <!-- SECTION 3: Professional Qualifications & Experience -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mt-3">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>3. Professional Qualifications & Background</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Highest Qualification / Degree</label>
                <input type="text" [(ngModel)]="newStaff.qualification" placeholder="e.g. M.Sc Mathematics, B.Ed"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Teaching Experience</label>
                <input type="text" [(ngModel)]="newStaff.experience" placeholder="e.g. 5 Years, 8+ Years"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Joining</label>
                <input type="date" [(ngModel)]="newStaff.joiningDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Department / Division</label>
                <input type="text" [(ngModel)]="newStaff.department" placeholder="e.g. Science & Maths / Senior Wing"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- SECTION 4: Residential Address & Emergency Contact -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mt-3">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>4. Residential Address & Emergency Contact</span>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Residential / Contact Address</label>
              <textarea [(ngModel)]="newStaff.address" rows="2" placeholder="e.g. Flat 402, Lotus Tower, Civil Lines, New Delhi - 110054"
                        class="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner resize-none"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                <input type="text" [(ngModel)]="newStaff.emergencyContactName" placeholder="e.g. Spouse / Parent Name"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input type="text" [(ngModel)]="newStaff.emergencyContactPhone" placeholder="+91 98111 22233"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
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

      <!-- ============================================================== -->
      <!-- ============================================================== -->
      <!-- MODAL: VIEW FACULTY / STAFF FULL PROFILE                       -->
      <!-- ============================================================== -->
      <div *ngIf="showStaffProfileModal && selectedStaffProfile" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeStaffProfileModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] sm:max-h-[92vh] shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-slate-200/90 overflow-hidden animate-scaleUp z-10">
          
          <!-- Clean Minimal Header -->
          <div class="p-5 sm:px-6 py-4.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3.5 min-w-0">
              <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 overflow-hidden border border-slate-200 shadow-2xs"
                   [ngClass]="{
                     'bg-purple-50 text-purple-700': selectedStaffProfile.role === 'PRINCIPAL',
                     'bg-indigo-50 text-indigo-700': selectedStaffProfile.role === 'SCHOOL_ADMIN',
                     'bg-emerald-50 text-emerald-700': selectedStaffProfile.role === 'CLASS_TEACHER' || selectedStaffProfile.classTeacherSections?.length,
                     'bg-blue-50 text-blue-700': selectedStaffProfile.role === 'TEACHER'
                   }">
                <img *ngIf="selectedStaffProfile.photoUrl || selectedStaffProfile.avatarUrl" [src]="selectedStaffProfile.photoUrl || selectedStaffProfile.avatarUrl" class="w-full h-full object-cover" alt="Faculty Avatar" />
                <span *ngIf="!selectedStaffProfile.photoUrl && !selectedStaffProfile.avatarUrl">{{ selectedStaffProfile.firstName.charAt(0) }}</span>
              </div>
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate">{{ selectedStaffProfile.fullName }}</h3>
                  <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border shadow-2xs"
                        [ngClass]="(selectedStaffProfile.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                    {{ (selectedStaffProfile.status || 'ACTIVE').toUpperCase() }}
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-wrap text-xs">
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold border shadow-2xs"
                        [ngClass]="{
                          'bg-purple-50 text-purple-700 border-purple-200': selectedStaffProfile.role === 'PRINCIPAL',
                          'bg-indigo-50 text-indigo-700 border-indigo-200': selectedStaffProfile.role === 'SCHOOL_ADMIN',
                          'bg-emerald-50 text-emerald-700 border-emerald-200': selectedStaffProfile.role === 'CLASS_TEACHER' || selectedStaffProfile.classTeacherSections?.length,
                          'bg-blue-50 text-blue-700 border-blue-200': selectedStaffProfile.role === 'TEACHER'
                        }">
                    {{ selectedStaffProfile.role === 'PRINCIPAL' ? 'Principal' : (selectedStaffProfile.role === 'SCHOOL_ADMIN' ? 'School Admin' : (selectedStaffProfile.classTeacherSections?.length ? 'Class Teacher' : 'Teacher')) }}
                  </span>
                  <span *ngIf="selectedStaffProfile.department" class="text-slate-500 text-[11px] font-medium">
                    Dept: {{ selectedStaffProfile.department }}
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 font-mono">Employee ID: {{ selectedStaffProfile.id }}</div>
              </div>
            </div>
            <button (click)="closeStaffProfileModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0">&times;</button>
          </div>

          <!-- Modal Scrollable Content -->
          <div class="p-5 sm:px-6 py-5 space-y-5 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            
            <!-- 1. Contact & Identity Grid -->
            <div>
              <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>1. Contact & Identity</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                  <a [href]="'mailto:' + selectedStaffProfile.email" class="text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1.5 transition-colors">
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span class="truncate">{{ selectedStaffProfile.email }}</span>
                  </a>
                </div>

                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</div>
                  <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a *ngIf="selectedStaffProfile.phone" [href]="'tel:' + selectedStaffProfile.phone" class="hover:text-indigo-600 font-mono">{{ selectedStaffProfile.phone }}</a>
                    <span *ngIf="!selectedStaffProfile.phone" class="text-slate-400 font-normal">Not Provided</span>
                  </div>
                </div>

                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender & Blood Group</div>
                  <div class="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{{ selectedStaffProfile.gender ? (selectedStaffProfile.gender === 'MALE' ? 'Male' : (selectedStaffProfile.gender === 'FEMALE' ? 'Female' : selectedStaffProfile.gender)) : '—' }}</span>
                    <span *ngIf="selectedStaffProfile.bloodGroup" class="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                      Blood: {{ selectedStaffProfile.bloodGroup }}
                    </span>
                  </div>
                </div>

                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth (DOB)</div>
                  <div class="text-xs font-bold text-slate-900 font-mono">
                    {{ selectedStaffProfile.dateOfBirth || selectedStaffProfile.dob || '—' }}
                  </div>
                </div>
              </div>

              <!-- Address -->
              <div *ngIf="selectedStaffProfile.address" class="mt-3 p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</div>
                <div class="text-xs text-slate-800 font-medium leading-relaxed">{{ selectedStaffProfile.address }}</div>
              </div>
            </div>

            <!-- 2. Academic & Teaching Role Details -->
            <div>
              <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>2. Professional Credentials & Experience</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualification</div>
                  <div class="text-xs font-bold text-slate-900">{{ selectedStaffProfile.qualification || '—' }}</div>
                </div>

                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</div>
                  <div class="text-xs font-bold text-slate-900">{{ selectedStaffProfile.experience || '—' }}</div>
                </div>

                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</div>
                  <div class="text-xs font-bold text-slate-900 font-mono">{{ selectedStaffProfile.joiningDate || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- 3. Class Teacher & Subject Allocations -->
            <div>
              <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>3. Class Incharge & Teaching Allocations</span>
              </div>
              <div class="space-y-3">
                <!-- Class Teacher incharge sections -->
                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-2">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Teacher Incharge of:</div>
                  <div *ngIf="selectedStaffProfile.classTeacherSections && selectedStaffProfile.classTeacherSections.length > 0" class="flex flex-wrap gap-2">
                    <span *ngFor="let cts of selectedStaffProfile.classTeacherSections"
                          class="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ cts.className }} - {{ cts.sectionName }}</span>
                    </span>
                  </div>
                  <div *ngIf="!selectedStaffProfile.classTeacherSections || selectedStaffProfile.classTeacherSections.length === 0" class="text-slate-400 italic text-xs">
                    No class incharge assigned.
                  </div>
                </div>

                <!-- Subject assignments -->
                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-2">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Subjects:</div>
                  <div *ngIf="selectedStaffProfile.subjectAssignments && selectedStaffProfile.subjectAssignments.length > 0" class="flex flex-wrap gap-2">
                    <span *ngFor="let sa of selectedStaffProfile.subjectAssignments"
                          class="px-2.5 py-1 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs">
                      {{ sa.subjectName }} ({{ sa.className }}-{{ sa.sectionName }})
                    </span>
                  </div>
                  <div *ngIf="!selectedStaffProfile.subjectAssignments || selectedStaffProfile.subjectAssignments.length === 0" class="text-slate-400 italic text-xs">
                    No subjects allocated.
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Emergency Contact Info -->
            <div *ngIf="selectedStaffProfile.emergencyContactName || selectedStaffProfile.emergencyContactPhone">
              <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>4. Emergency Contact</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</div>
                  <div class="text-xs font-bold text-slate-900">{{ selectedStaffProfile.emergencyContactName || '—' }}</div>
                </div>
                <div class="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-1">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emergency Phone</div>
                  <a *ngIf="selectedStaffProfile.emergencyContactPhone" [href]="'tel:' + selectedStaffProfile.emergencyContactPhone" class="text-xs font-bold text-slate-900 font-mono hover:text-indigo-600 hover:underline">
                    {{ selectedStaffProfile.emergencyContactPhone }}
                  </a>
                  <div *ngIf="!selectedStaffProfile.emergencyContactPhone" class="text-xs text-slate-400">—</div>
                </div>
              </div>
            </div>

          </div>

          <!-- Modal Footer Actions -->
          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-between gap-2.5 shrink-0">
            <button type="button" (click)="navigateToFacultyTimetable(selectedStaffProfile)"
                    class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Weekly Routine</span>
            </button>

            <div class="flex items-center gap-2">
              <button *ngIf="canManage" type="button" (click)="openEditStaffModal(selectedStaffProfile)"
                      class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
                <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Details</span>
              </button>

              <button (click)="closeStaffProfileModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs active:scale-95">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: EDIT FACULTY / STAFF DETAILS                            -->
      <!-- ============================================================== -->
      <div *ngIf="showEditStaffModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[75] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeEditStaffModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] sm:max-h-[92vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp z-10">
          
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Edit Faculty Details</h3>
                <p class="text-xs text-slate-500 mt-0.5">Update staff personal details, role designation, and qualifications.</p>
              </div>
            </div>
            <button (click)="closeEditStaffModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:px-6 py-4 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <!-- Staff Photo Upload Card -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative group">
                <img *ngIf="editStaffForm.photoUrl" [src]="editStaffForm.photoUrl" class="w-full h-full object-cover" alt="Faculty Preview" />
                <span *ngIf="!editStaffForm.photoUrl" class="text-base font-black text-slate-400">
                  {{ (editStaffForm.firstName || 'T').charAt(0).toUpperCase() }}
                </span>
                <label class="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-[10px] font-bold">
                  <span>{{ editStaffForm.photoUrl ? 'Change' : 'Upload' }}</span>
                  <input type="file" accept="image/*" (change)="onEditStaffPhotoSelected($event)" class="hidden" />
                </label>
              </div>
              <div class="flex-1 space-y-1">
                <div class="flex items-center gap-2">
                  <label [class.opacity-50]="uploadingEditStaffPhoto"
                         class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span>{{ uploadingEditStaffPhoto ? 'Optimizing...' : (editStaffForm.photoUrl ? 'Change Faculty Photo' : 'Upload Faculty Photo') }}</span>
                    <input type="file" accept="image/*" (change)="onEditStaffPhotoSelected($event)" [disabled]="uploadingEditStaffPhoto" class="hidden" />
                  </label>
                  <button *ngIf="editStaffForm.photoUrl" type="button" (click)="removeEditStaffPhoto()"
                          class="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-[11px] font-bold rounded-xl border border-rose-200 transition-colors">
                    Remove
                  </button>
                </div>
                <p class="text-[10px] text-slate-400">Official profile picture for faculty directory, class assignments, and student timetable.</p>
              </div>
            </div>

            <!-- SECTION 1: Basic Identity & Role -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>1. Basic Identity & Role</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">First Name *</label>
                <input type="text" [(ngModel)]="editStaffForm.firstName" placeholder="e.g. Vikram"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Last Name</label>
                <input type="text" [(ngModel)]="editStaffForm.lastName" placeholder="e.g. Malhotra"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Role Designation *</label>
                <select [(ngModel)]="editStaffForm.role"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="CLASS_TEACHER">Class Teacher</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="SCHOOL_ADMIN">School Admin</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Primary Subject Specialization</label>
                <select [(ngModel)]="editStaffForm.primarySubjectId"
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
                <input type="text" [(ngModel)]="editStaffForm.phone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" [value]="editStaffForm.email" disabled
                       class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-500 cursor-not-allowed shadow-inner" />
              </div>
            </div>

            <!-- SECTION 2: Personal & Biographical Details -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mt-3">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span>2. Personal & Biographical Details</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Gender</label>
                <select [(ngModel)]="editStaffForm.gender"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
                <input type="date" [(ngModel)]="editStaffForm.dateOfBirth"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Blood Group</label>
                <select [(ngModel)]="editStaffForm.bloodGroup"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="">-- Select --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <!-- SECTION 3: Professional Qualifications & Experience -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mt-3">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>3. Professional Qualifications & Background</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Highest Qualification / Degree</label>
                <input type="text" [(ngModel)]="editStaffForm.qualification" placeholder="e.g. M.Sc Mathematics, B.Ed"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Teaching Experience</label>
                <input type="text" [(ngModel)]="editStaffForm.experience" placeholder="e.g. 5 Years, 8+ Years"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Joining</label>
                <input type="date" [(ngModel)]="editStaffForm.joiningDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Department / Division</label>
                <input type="text" [(ngModel)]="editStaffForm.department" placeholder="e.g. Science & Maths / Senior Wing"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- SECTION 4: Residential Address & Emergency Contact -->
            <div class="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-800 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mt-3">
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>4. Residential Address & Emergency Contact</span>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Residential / Contact Address</label>
              <textarea [(ngModel)]="editStaffForm.address" rows="2" placeholder="e.g. Flat 402, Lotus Tower, Civil Lines, New Delhi - 110054"
                        class="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner resize-none"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                <input type="text" [(ngModel)]="editStaffForm.emergencyContactName" placeholder="e.g. Spouse / Parent Name"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input type="text" [(ngModel)]="editStaffForm.emergencyContactPhone" placeholder="+91 98111 22233"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div *ngIf="editStaffModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ editStaffModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeEditStaffModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs active:scale-95">
              Cancel
            </button>
            <button (click)="saveEditStaff()" [disabled]="savingStaffEdit"
                    class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5">
              <span *ngIf="!savingStaffEdit">Save Changes</span>
              <span *ngIf="savingStaffEdit">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: DELETE / REMOVE FACULTY CONFIRMATION                    -->
      <!-- ============================================================== -->
      <div *ngIf="showDeleteStaffModal && staffToDelete" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[80] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeDeleteStaffModal()"></div>
        <div class="bg-white rounded-3xl max-w-md w-full flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp z-10">
          
          <div class="p-6 text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-inner">
              <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 class="text-base font-black text-slate-900 tracking-tight">Remove Faculty Member?</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove <strong class="text-slate-900">{{ staffToDelete.fullName }}</strong> ({{ staffToDelete.email }}) from the school directory?
            </p>
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 text-left">
              <strong>Notice:</strong> This will detach the faculty member from active class teacher and subject assignments in your school.
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeDeleteStaffModal()" class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="executeDeleteStaff()" [disabled]="deletingStaff"
                    class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5">
              <span *ngIf="!deletingStaff">Confirm Removal</span>
              <span *ngIf="deletingStaff">Removing...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ADD / EDIT ALUMNI STUDENT                               -->
      <!-- ============================================================== -->
      <div *ngIf="showAddAlumniModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">
                  {{ isEditingAlumni ? 'Edit Alumni Record' : 'Register New Alumni Student' }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">Permanent institutional record for graduated student.</p>
              </div>
            </div>
            <button (click)="closeAlumniModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:px-6 py-4 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">First Name *</label>
                <input type="text" [(ngModel)]="newAlumni.firstName" placeholder="e.g. Rahul"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Last Name</label>
                <input type="text" [(ngModel)]="newAlumni.lastName" placeholder="e.g. Sharma"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Admission Number *</label>
                <input type="text" [(ngModel)]="newAlumni.admissionNumber" placeholder="e.g. ADM-DEL-2026-0001"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Gender</label>
                <select [(ngModel)]="newAlumni.gender"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Graduation / Passing Session *</label>
                <select [(ngModel)]="newAlumni.graduationSession"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option *ngFor="let ses of academicSessions" [value]="ses.name">{{ ses.name }}</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <input type="date" [(ngModel)]="newAlumni.dateOfBirth"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Terminal Exit Class</label>
                <select [(ngModel)]="newAlumni.className"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner">
                  <option *ngFor="let c of classes" [value]="c.name">{{ c.name }}</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Terminal Section</label>
                <input type="text" [(ngModel)]="newAlumni.sectionName" placeholder="e.g. Section A"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Primary Guardian Name</label>
                <input type="text" [(ngModel)]="newAlumni.guardianName" placeholder="e.g. Suresh Sharma"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Guardian Phone</label>
                <input type="text" [(ngModel)]="newAlumni.guardianPhone" placeholder="+91 98765 43210"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div *ngIf="alumniModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ alumniModalError }}
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAlumniModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="saveAlumni()" [disabled]="savingAlumni"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95">
              <span *ngIf="!savingAlumni">{{ isEditingAlumni ? 'Save Changes' : 'Register Alumni' }}</span>
              <span *ngIf="savingAlumni">Saving...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: DELETE ALUMNI CONFIRMATION                              -->
      <!-- ============================================================== -->
      <div *ngIf="showDeleteAlumniModal" class="fixed inset-0 flex items-center justify-center p-4 z-[75] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 text-center animate-scaleUp">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-inner">
            <svg class="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-black text-slate-900">Remove Alumni Record?</h3>
            <p class="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <strong class="text-slate-800">{{ alumniToDelete?.full_name }}</strong> ({{ alumniToDelete?.admission_number }}) from the alumni directory?
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2">
            <button (click)="cancelDeleteAlumni()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
              Cancel
            </button>
            <button (click)="executeDeleteAlumni()" [disabled]="isDeletingAlumni"
                    class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              <span *ngIf="!isDeletingAlumni">Yes, Delete</span>
              <span *ngIf="isDeletingAlumni">Deleting...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ADD / CONFIGURE SUBJECT FOR CLASS & SECTIONS            -->
      <!-- ============================================================== -->
      <div *ngIf="showAddSubjectModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          
          <!-- Modal Header -->
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">
                  {{ subjectTargetClass ? 'Add Subject to ' + subjectTargetClass.name : 'Add Subject to Curriculum' }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">Define subject name, auto-generated code, and section applicability.</p>
              </div>
            </div>
            <button (click)="closeAddSubjectModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-5 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1 custom-clay-scroll bg-white">
            
            <!-- Target Class Selector -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Target Class / Grade Level *</label>
              <select [(ngModel)]="selectedSubjectClassId" (change)="onSubjectClassChange(selectedSubjectClassId)"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner font-semibold">
                <option value="">-- General / Applicable to All Classes --</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }} ({{ c.code }})</option>
              </select>
            </div>

            <!-- Subject Name & Quick Suggestions -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
              <input type="text" [(ngModel)]="newSubject.name" (ngModelChange)="onSubjectNameChange()"
                     placeholder="e.g. Biology, Mathematics, Computer Science"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              
              <!-- Quick Suggestions Chips -->
              <div class="mt-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quick Suggestions:</span>
                <div class="flex flex-wrap gap-1.5">
                  <button type="button" *ngFor="let sug of quickSubjectSuggestions" (click)="applyQuickSubject(sug)"
                          class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer">
                    + {{ sug }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Subject Code (Auto-Generated & Editable) & Subject Type -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-bold text-slate-700">Subject Code *</label>
                  <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    ✨ Auto-Generated
                  </span>
                </div>
                <div class="relative">
                  <input type="text" [(ngModel)]="newSubject.code" placeholder="e.g. BIO-10"
                         class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
                  <button type="button" (click)="regenerateCode()" title="Regenerate Unique Code"
                          class="absolute right-2 top-2 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer">
                    ↻ Refresh
                  </button>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Unique campus identifier (fully customizable).</p>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Subject Type</label>
                <select [(ngModel)]="newSubject.subjectType"
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner font-semibold">
                  <option value="ACADEMIC">Academic / Theory</option>
                  <option value="LAB">Lab & Practical</option>
                  <option value="LANGUAGE">Language</option>
                  <option value="ELECTIVE">Elective / Skill</option>
                  <option value="ACTIVITY">Co-Curricular</option>
                  <option value="VOCATIONAL">Vocational</option>
                </select>
              </div>
            </div>

            <!-- Section Applicability / Section Selection -->
            <div *ngIf="subjectTargetClass && subjectTargetClass.sections && subjectTargetClass.sections.length > 0" 
                 class="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-black text-slate-900">Section Applicability</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Is this subject taught across all sections or specific sections only?</p>
                </div>
              </div>

              <!-- Option Tabs: All Sections vs Specific Sections -->
              <div class="grid grid-cols-2 gap-2">
                <button type="button" (click)="selectAllSectionsForSubject()"
                        [ngClass]="newSubject.isAllSections ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'"
                        class="p-2.5 rounded-xl text-left transition-all cursor-pointer">
                  <div class="flex items-center gap-1.5 font-bold text-xs">
                    <span class="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px]"
                          [ngClass]="newSubject.isAllSections ? 'border-white bg-white text-indigo-600' : 'border-slate-400'">
                      ✓
                    </span>
                    <span>All Sections</span>
                  </div>
                  <div class="text-[10px] mt-0.5 opacity-80 truncate">
                    Applicable to all {{ subjectTargetClass.sections.length }} sections
                  </div>
                </button>

                <button type="button" (click)="selectSpecificSectionsForSubject()"
                        [ngClass]="!newSubject.isAllSections ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'"
                        class="p-2.5 rounded-xl text-left transition-all cursor-pointer">
                  <div class="flex items-center gap-1.5 font-bold text-xs">
                    <span class="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px]"
                          [ngClass]="!newSubject.isAllSections ? 'border-white bg-white text-indigo-600' : 'border-slate-400'">
                      ✓
                    </span>
                    <span>Specific Sections Only</span>
                  </div>
                  <div class="text-[10px] mt-0.5 opacity-80 truncate">
                    Select individual sections
                  </div>
                </button>
              </div>

              <!-- Specific Section Checkboxes Grid -->
              <div *ngIf="!newSubject.isAllSections" class="pt-2 border-t border-slate-200/80 space-y-2 animate-fadeIn">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Choose which sections have this subject:</span>
                  <span class="text-indigo-600">{{ newSubject.selectedSectionIds.length }} / {{ subjectTargetClass.sections.length }} Selected</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div *ngFor="let sec of subjectTargetClass.sections"
                       (click)="toggleSubjectSection(sec.id)"
                       [ngClass]="isSectionSelectedForSubject(sec.id) ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-bold' : 'bg-white border-slate-200 text-slate-600 font-medium opacity-75'"
                       class="p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border flex items-center justify-center text-[10px]"
                           [ngClass]="isSectionSelectedForSubject(sec.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'">
                        <span *ngIf="isSectionSelectedForSubject(sec.id)">✓</span>
                      </div>
                      <span class="text-xs">{{ formatSection(sec.name) }}</span>
                    </div>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/80">
                      {{ sec.code || 'SEC' }}
                    </span>
                  </div>
                </div>

                <div *ngIf="newSubject.selectedSectionIds.length === 0" class="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span>Please check at least one section for this subject.</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
              <textarea [(ngModel)]="newSubject.description" rows="2" placeholder="Syllabus overview, topics, or notes..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner"></textarea>
            </div>

            <div *ngIf="subjectModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ subjectModalError }}
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button (click)="closeAddSubjectModal()" class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="saveSubject()" [disabled]="savingSubject"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5">
              <svg *ngIf="!savingSubject" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              <span *ngIf="!savingSubject">Save & Assign Subject</span>
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
      <!-- MODAL: DELETE / REMOVE SUBJECT CONFIRMATION                   -->
      <!-- ============================================================== -->
      <div *ngIf="showDeleteSubjectModal && subjectToDelete" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[80] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Remove Subject?</h3>
              <p class="text-xs text-slate-500 mt-1">
                You are about to remove <strong class="text-slate-800">{{ subjectToDelete.subject.name }} ({{ subjectToDelete.subject.code }})</strong><span *ngIf="subjectToDelete.classItem"> from <strong class="text-slate-800">{{ subjectToDelete.classItem.name }}</strong></span>.
              </p>
            </div>
          </div>

          <div class="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 text-xs text-rose-900">
            <div class="font-bold flex items-center gap-1.5 text-rose-700">
              <span>⚠️ What will happen when you remove this subject:</span>
            </div>
            <ul class="list-disc pl-4 space-y-1 text-[11px] text-rose-800 leading-relaxed font-medium">
              <li>This subject will be unlinked from the academic class curriculum.</li>
              <li>Subject teacher assignments and timetable periods for this subject will be removed.</li>
              <li>You can re-add or re-configure this subject at any time.</li>
            </ul>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="closeDeleteSubjectModal()" [disabled]="isDeletingSubject"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button (click)="executeDeleteSubject()" [disabled]="isDeletingSubject"
                    class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5">
              <span *ngIf="!isDeletingSubject">Remove Subject</span>
              <span *ngIf="isDeletingSubject">Removing...</span>
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
      <div *ngIf="showStudentStatusModal && selectedStudentForStatus" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[110] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeStudentStatusModal()"></div>
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp relative z-10">
          <div class="flex items-start gap-3.5">
            <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
              <!-- Inactive Icon -->
              <svg *ngIf="studentStatusAction === 'INACTIVE'" class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <!-- Active Icon -->
              <svg *ngIf="studentStatusAction === 'ACTIVE'" class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Suspended Icon -->
              <svg *ngIf="studentStatusAction === 'SUSPENDED'" class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <!-- Leftout Icon -->
              <svg *ngIf="studentStatusAction === 'LEFTOUT'" class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">
                {{ studentStatusAction === 'INACTIVE' ? 'Deactivate Student Record' : 
                   studentStatusAction === 'ACTIVE' ? 'Reactivate Student Record' : 
                   studentStatusAction === 'SUSPENDED' ? 'Suspend Student Enrollment' : 'Mark Student as Leftout / TC' }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                Student: <span class="font-bold text-slate-900">{{ selectedStudentForStatus.fullName }}</span> (Adm: {{ selectedStudentForStatus.admissionNumber }})
              </p>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason / Notes for Status Change</label>
              <input type="text" [(ngModel)]="studentStatusReason" placeholder="e.g. Transferred / Relocated / Administrative"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <!-- Leftout / TC Alumni option (Eligible for any completed class) -->
            <div *ngIf="studentStatusAction === 'LEFTOUT'" class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label class="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="alsoMarkAsAlumni" class="mt-0.5 w-4 h-4 rounded text-slate-900 accent-slate-900 cursor-pointer" />
                <div>
                  <span class="font-bold text-slate-900 block text-xs">Register in Alumni Directory</span>
                  <span class="text-[11px] text-slate-500 leading-tight block">Student completed studies up to {{ selectedStudentForStatus.className }} and is eligible for institutional alumni status.</span>
                </div>
              </label>

              <div *ngIf="alsoMarkAsAlumni" class="pt-2 border-t border-slate-200/70 space-y-2">
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Transfer Certificate (TC) Number</label>
                  <input type="text" [(ngModel)]="leftoutTcNumber" placeholder="e.g. TC-2026-088"
                         class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
                </div>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs text-slate-700">
              <div class="font-bold text-[11px] flex items-center gap-1.5 text-slate-900">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Status Details:</span>
              </div>
              <p class="text-[11px] leading-relaxed text-slate-600">
                {{ studentStatusAction === 'INACTIVE' ? 'Student will be marked INACTIVE and excluded from active class rosters and billing unless filtered.' : 
                   studentStatusAction === 'ACTIVE' ? 'Student will be restored to ACTIVE status across classroom modules and rosters.' : 
                   studentStatusAction === 'SUSPENDED' ? 'Student will be marked SUSPENDED and restricted from daily class activities until reactivated.' : 
                   'Student will be marked as LEFTOUT / TC and transferred out of active roster.' }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeStudentStatusModal()" [disabled]="updatingStudentStatus"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executeToggleStudentStatus()" [disabled]="updatingStudentStatus"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="updatingStudentStatus" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ updatingStudentStatus ? 'Updating...' : 'Confirm Status Change' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: PROMOTE STUDENT DIRECTLY (Admin / Principal)            -->
      <!-- ============================================================== -->
      <div *ngIf="showPromoteStudentModal && selectedStudentForPromote" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[110] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closePromoteStudentModal()"></div>
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp relative z-10">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Promote Student to Next Class</h3>
                <p class="text-xs text-slate-500 mt-0.5">Advance student to the next academic standard and assign section.</p>
              </div>
            </div>
            <button (click)="closePromoteStudentModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <!-- Student Current Details -->
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Student Record</span>
              <span class="font-black text-slate-900">{{ selectedStudentForPromote.fullName }}</span>
              <span class="text-slate-500 ml-1 font-mono">({{ selectedStudentForPromote.admissionNumber }})</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Current Grade</span>
              <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
                {{ selectedStudentForPromote.className }} - {{ formatSection(selectedStudentForPromote.sectionName) }}
              </span>
            </div>
          </div>

          <div class="space-y-3.5 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Class *</label>
                <select [(ngModel)]="promoteTargetClassId" (change)="onPromoteClassChange()"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let c of sortedClasses" [value]="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Section *</label>
                <select [(ngModel)]="promoteTargetSectionId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let sec of availableSectionsForPromoteClass" [value]="sec.id">
                    {{ formatSection(sec.name) }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Roll Number in New Class</label>
                <input type="text" [(ngModel)]="promoteRollNumber" placeholder="e.g. 15"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Academic Session</label>
                <input type="text" [value]="activeSession?.name || 'Active Session'" readonly disabled
                       class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason / Promotion Remarks</label>
              <input type="text" [(ngModel)]="promoteReason" placeholder="e.g. Passed annual examinations / Mid-term acceleration"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="promoteModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ promoteModalError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="closePromoteStudentModal()" [disabled]="executingPromote"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executePromoteStudent()" [disabled]="executingPromote"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="executingPromote" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ executingPromote ? 'Promoting...' : 'Execute Promotion' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: CHANGE SECTION DIRECTLY (Admin / Principal)             -->
      <!-- ============================================================== -->
      <div *ngIf="showChangeSectionModal && selectedStudentForSectionChange" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[110] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeChangeSectionModal()"></div>
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp relative z-10">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Change Student Section</h3>
                <p class="text-xs text-slate-500 mt-0.5">Transfer student to another section in {{ selectedStudentForSectionChange.className }}.</p>
              </div>
            </div>
            <button (click)="closeChangeSectionModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Student</span>
              <span class="font-black text-slate-900">{{ selectedStudentForSectionChange.fullName }}</span>
            </div>
            <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
              Current: {{ formatSection(selectedStudentForSectionChange.sectionName) }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Section *</label>
              <select [(ngModel)]="sectionChangeTargetSectionId"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                <option *ngFor="let sec of availableSectionsForCurrentClass" [value]="sec.id">
                  {{ formatSection(sec.name) }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">New Roll Number in Section</label>
              <input type="text" [(ngModel)]="sectionChangeRollNumber" placeholder="e.g. 05"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason for Transfer</label>
              <input type="text" [(ngModel)]="sectionChangeReason" placeholder="e.g. Section balancing / Parental request"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="sectionChangeModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ sectionChangeModalError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeChangeSectionModal()" [disabled]="executingSectionChange"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executeChangeSection()" [disabled]="executingSectionChange"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="executingSectionChange" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ executingSectionChange ? 'Updating...' : 'Transfer Section' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: DEMOTE / REASSIGN TO PREVIOUS CLASS (Admin / Principal) -->
      <!-- ============================================================== -->
      <div *ngIf="showDemoteStudentModal && selectedStudentForDemote" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[110] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeDemoteStudentModal()"></div>
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp relative z-10">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Reassign / Demote Student</h3>
                <p class="text-xs text-slate-500 mt-0.5">Reassign student to a previous grade standard for remediation.</p>
              </div>
            </div>
            <button (click)="closeDemoteStudentModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Student</span>
              <span class="font-black text-slate-900">{{ selectedStudentForDemote.fullName }}</span>
              <span class="text-slate-500 ml-1 font-mono">({{ selectedStudentForDemote.admissionNumber }})</span>
            </div>
            <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
              Current: {{ selectedStudentForDemote.className }} - {{ formatSection(selectedStudentForDemote.sectionName) }}
            </span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Previous Class *</label>
                <select [(ngModel)]="demoteTargetClassId" (change)="onDemoteClassChange()"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let c of sortedClasses" [value]="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Target Section *</label>
                <select [(ngModel)]="demoteTargetSectionId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let sec of availableSectionsForDemoteClass" [value]="sec.id">
                    {{ formatSection(sec.name) }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Roll Number in Target Class</label>
              <input type="text" [(ngModel)]="demoteRollNumber" placeholder="e.g. 20"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason / Academic Remediation Remarks *</label>
              <input type="text" [(ngModel)]="demoteReason" placeholder="e.g. Academic remediation / Parental request"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="demoteModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ demoteModalError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeDemoteStudentModal()" [disabled]="executingDemote"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executeDemoteStudent()" [disabled]="executingDemote"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="executingDemote" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ executingDemote ? 'Reassigning...' : 'Confirm Reassignment' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: CONVERT / GRADUATE TO ALUMNI (Admin / Principal)        -->
      <!-- ============================================================== -->
      <div *ngIf="showConvertToAlumniModal && selectedStudentForAlumniConversion" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[110] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeConvertToAlumniModal()"></div>
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp relative z-10">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Graduate to Alumni Directory</h3>
                <p class="text-xs text-slate-500 mt-0.5">Eligible for any completed class (e.g. Class 3 or Class 12). Admission ID remains permanent.</p>
              </div>
            </div>
            <button (click)="closeConvertToAlumniModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Student Record</span>
              <span class="font-black text-slate-900">{{ selectedStudentForAlumniConversion.fullName }}</span>
              <span class="text-slate-500 ml-1 font-mono">({{ selectedStudentForAlumniConversion.admissionNumber }})</span>
            </div>
            <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
              {{ selectedStudentForAlumniConversion.className }} - {{ formatSection(selectedStudentForAlumniConversion.sectionName) }}
            </span>
          </div>

          <div class="space-y-3.5 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Graduating / Terminal Class *</label>
                <select [(ngModel)]="alumniConversionGraduatingClassId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let c of sortedClasses" [value]="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Passing / Leaving Academic Session *</label>
                <input type="text" [(ngModel)]="alumniConversionSession" placeholder="e.g. 2026–2027"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Transfer Certificate (TC) / Serial Number</label>
              <input type="text" [(ngModel)]="alumniConversionTcNumber" placeholder="e.g. TC/DEL/2026/0142"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Graduation Remarks / Notes</label>
              <input type="text" [(ngModel)]="alumniConversionRemarks" placeholder="e.g. Completed Class 3 and relocated - eligible alumni"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div *ngIf="alumniConversionModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ alumniConversionModalError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeConvertToAlumniModal()" [disabled]="executingAlumniConversion"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="executeConvertToAlumni()" [disabled]="executingAlumniConversion"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="executingAlumniConversion" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ executingAlumniConversion ? 'Moving...' : 'Move to Alumni Directory' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: TEACHER ACADEMIC ACTION REQUEST (Teacher Role)          -->
      <!-- ============================================================== -->
      <div *ngIf="showAcademicRequestModal && selectedStudentForAcademicRequest" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[110] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeTeacherAcademicRequestModal()"></div>
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 space-y-4 animate-scaleUp relative z-10">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-xl shrink-0 shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Submit Academic Action Request</h3>
                <p class="text-xs text-slate-500 mt-0.5">Submitted requests are reviewed and approved by Principal / Admin.</p>
              </div>
            </div>
            <button (click)="closeTeacherAcademicRequestModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl cursor-pointer">&times;</button>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Student Record</span>
              <span class="font-black text-slate-900">{{ selectedStudentForAcademicRequest.fullName }}</span>
              <span class="text-slate-500 ml-1 font-mono">({{ selectedStudentForAcademicRequest.admissionNumber }})</span>
            </div>
            <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
              {{ selectedStudentForAcademicRequest.className }} - {{ formatSection(selectedStudentForAcademicRequest.sectionName) }}
            </span>
          </div>

          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Request Action Type *</label>
              <select [(ngModel)]="academicRequestType" (change)="onAcademicRequestTypeChange()"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                <option value="PROMOTION">Promote to Next Class</option>
                <option value="SECTION_CHANGE">Transfer Section (within class)</option>
                <option value="DEMOTION">Demote to Previous Class</option>
                <option value="ALUMNI">Convert / Graduate to Alumni</option>
                <option value="INACTIVE">Mark Student Inactive</option>
                <option value="LEFTOUT">Mark Leftout / TC Issued</option>
              </select>
            </div>

            <!-- Dynamic target fields for Promotion & Demotion -->
            <div *ngIf="academicRequestType === 'PROMOTION' || academicRequestType === 'DEMOTION'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Proposed Target Class *</label>
                <select [(ngModel)]="academicRequestTargetClassId" (change)="onAcademicRequestClassChange()"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let c of sortedClasses" [value]="c.id">
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Proposed Section *</label>
                <select [(ngModel)]="academicRequestTargetSectionId"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option *ngFor="let sec of availableSectionsForAcademicRequestClass" [value]="sec.id">
                    {{ formatSection(sec.name) }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Dynamic target section for Section Change -->
            <div *ngIf="academicRequestType === 'SECTION_CHANGE'">
              <label class="block font-bold text-slate-700 mb-1">Proposed Target Section *</label>
              <select [(ngModel)]="academicRequestTargetSectionId"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                <option *ngFor="let sec of availableSectionsForCurrentClass" [value]="sec.id">
                  {{ formatSection(sec.name) }}
                </option>
              </select>
            </div>

            <!-- Dynamic field for Alumni -->
            <div *ngIf="academicRequestType === 'ALUMNI'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Graduation Session</label>
                <input type="text" [(ngModel)]="academicRequestPassingSession" placeholder="e.g. 2026–2027"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">TC Number (if issued)</label>
                <input type="text" [(ngModel)]="academicRequestTcNumber" placeholder="e.g. TC-2026-04"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Primary Justification / Reason *</label>
              <input type="text" [(ngModel)]="academicRequestReason" placeholder="e.g. Completed Class 3 curriculum with distinction / Parent request"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Detailed Teacher Notes *</label>
              <textarea [(ngModel)]="academicRequestComments" rows="3" placeholder="Provide background details, examination scores, or parent communication context..."
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner"></textarea>
            </div>

            <div *ngIf="academicRequestModalError" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
              {{ academicRequestModalError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" (click)="closeTeacherAcademicRequestModal()" [disabled]="submittingAcademicRequest"
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="submitTeacherAcademicRequest()" [disabled]="submittingAcademicRequest"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="submittingAcademicRequest" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ submittingAcademicRequest ? 'Submitting...' : 'Submit Request to Administration' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 9: ACADEMIC & STATUS REQUESTS REVIEW QUEUE MODAL          -->
      <!-- ============================================================== -->
      <div *ngIf="showDeactivationRequestsModal" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[70] animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[85vh] sm:max-h-[88vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-base shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Academic & Status Requests Queue</h3>
                <p class="text-xs text-slate-500 mt-0.5">Review teacher submissions for promotions, section transfers, demotions, and alumni status.</p>
              </div>
            </div>
            <button (click)="closeDeactivationRequestsModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Filter Tabs -->
          <div class="px-5 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button type="button" (click)="academicRequestFilterTab = 'ALL'"
                    class="px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                    [ngClass]="academicRequestFilterTab === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'">
              All ({{ deactivationRequests.length }})
            </button>
            <button type="button" (click)="academicRequestFilterTab = 'PENDING'"
                    class="px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    [ngClass]="academicRequestFilterTab === 'PENDING' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'">
              <span>Pending</span>
              <span *ngIf="pendingDeactivationRequestsCount > 0"
                    class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
                    [ngClass]="academicRequestFilterTab === 'PENDING' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'">
                {{ pendingDeactivationRequestsCount }}
              </span>
            </button>
            <button type="button" (click)="academicRequestFilterTab = 'APPROVED'"
                    class="px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                    [ngClass]="academicRequestFilterTab === 'APPROVED' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'">
              Approved
            </button>
            <button type="button" (click)="academicRequestFilterTab = 'REJECTED'"
                    class="px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                    [ngClass]="academicRequestFilterTab === 'REJECTED' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'">
              Rejected
            </button>
          </div>

          <div class="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 custom-clay-scroll bg-white">
            <!-- Review Notes Input (for Admin/Principal when reviewing) -->
            <div *ngIf="canDirectlyDeactivateStudent" class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <label class="block font-bold text-slate-700 text-[11px]">Optional Reviewer Notes / Remarks (Attached upon decision)</label>
              <input type="text" [(ngModel)]="reviewNotes" placeholder="e.g. Approved per parent transfer certificate..."
                     class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-inner" />
            </div>

            <!-- List of Requests -->
            <div class="space-y-3">
              <div *ngFor="let req of filteredAcademicRequests"
                   class="p-4 rounded-2xl border transition-all space-y-3 bg-white"
                   [ngClass]="{
                     'border-slate-300 shadow-xs': req.status === 'PENDING',
                     'border-slate-200 bg-slate-50/50': req.status === 'APPROVED',
                     'border-slate-200 opacity-80': req.status === 'REJECTED'
                   }">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-black text-sm text-slate-900">{{ req.student_name }}</span>
                      <span class="font-mono text-slate-500 text-[11px]">({{ req.admission_number }})</span>
                      
                      <!-- Request Type Badge -->
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase bg-slate-100 text-slate-800 border-slate-300">
                        {{ formatRequestType(req.request_type) }}
                      </span>

                      <!-- Status Badge -->
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                            [ngClass]="{
                              'bg-slate-900 text-white border-slate-900': req.status === 'PENDING',
                              'bg-slate-100 text-slate-800 border-slate-300': req.status === 'APPROVED',
                              'bg-rose-50 text-rose-700 border-rose-200': req.status === 'REJECTED'
                            }">
                        {{ req.status }}
                      </span>
                    </div>

                    <div class="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>Current: <strong>{{ req.class_name || 'N/A' }} - {{ formatSection(req.section_name) }}</strong></span>
                      <span *ngIf="req.target_class_name || req.target_section_name" class="font-bold text-slate-400">→</span>
                      <span *ngIf="req.target_class_name || req.target_section_name" class="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        Target: {{ req.target_class_name || req.class_name }} - {{ formatSection(req.target_section_name) }}
                      </span>
                      <span *ngIf="req.passing_session" class="text-slate-500">
                        (Session: <strong>{{ req.passing_session }}</strong>)
                      </span>
                    </div>
                  </div>

                  <span class="text-[10px] text-slate-400 font-mono shrink-0">
                    {{ req.created_at ? (req.created_at | date:'short') : 'Recently' }}
                  </span>
                </div>

                <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <div class="text-[11px]">
                    <span class="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Reason: </span>
                    <strong class="text-slate-800">{{ req.reason }}</strong>
                  </div>
                  <div *ngIf="req.comments" class="text-[11px] text-slate-600 mt-1 italic">
                    "{{ req.comments }}"
                  </div>
                  <div class="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 mt-1">
                    Submitted by: <strong class="text-slate-700">{{ req.requested_by_name || 'Teacher' }}</strong> ({{ req.requested_by_role || 'TEACHER' }})
                  </div>
                </div>

                <!-- Review details if already reviewed -->
                <div *ngIf="req.status !== 'PENDING'" class="text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                  <span>Reviewed by <strong>{{ req.reviewed_by_name || 'Authority' }}</strong></span>
                  <span *ngIf="req.review_notes" class="italic text-slate-500">Note: {{ req.review_notes }}</span>
                </div>

                <!-- Action buttons for Pending requests (Admin / Principal only) -->
                <div *ngIf="req.status === 'PENDING' && canDirectlyDeactivateStudent" class="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/80">
                  <button type="button" (click)="reviewDeactivationRequest(req, 'REJECTED')"
                          class="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-rose-700 border border-rose-300 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1">
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
                    <span>Approve & Apply Action</span>
                  </button>
                </div>
              </div>

              <div *ngIf="filteredAcademicRequests.length === 0" class="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div class="font-bold text-slate-700 text-xs">No Requests Found</div>
                <p class="text-[11px] text-slate-400 mt-1">No academic or status change requests match the selected tab filter.</p>
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

      <!-- ============================================================== -->
      <!-- MODAL: ALUMNI LIFECYCLE SUMMARY & JOURNEY LOGS                 -->
      <!-- ============================================================== -->
      <div *ngIf="showAlumniJourneyModal && selectedAlumniForJourney" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[80] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeAlumniJourneyModal()"></div>
        <div class="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp relative z-10">
          <!-- Header -->
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-lg shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Student Academic Lifecycle & Journey Logs</h3>
                <p class="text-xs text-slate-500 mt-0.5">Comprehensive audit trail from Day 1 of enrollment to alumni graduation.</p>
              </div>
            </div>
            <button (click)="closeAlumniJourneyModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <!-- Body Content -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            <!-- Student Profile Badge Card -->
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                  {{ (selectedAlumniForJourney.full_name || 'A').charAt(0) }}
                </div>
                <div>
                  <h4 class="text-base font-black text-slate-900">{{ selectedAlumniForJourney.full_name }}</h4>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span class="font-mono font-bold text-slate-700">Permanent Adm: {{ selectedAlumniForJourney.admission_number }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                      Alumni ID: {{ selectedAlumniForJourney.alumni_number || 'ALU-REG' }}
                    </span>
                    <span *ngIf="selectedAlumniForJourney.gender" class="text-slate-500">({{ selectedAlumniForJourney.gender }})</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span class="px-3 py-1 bg-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs">
                  Graduated: {{ selectedAlumniForJourney.last_class_name || 'Class 12' }} ({{ selectedAlumniForJourney.graduation_session }})
                </span>
              </div>
            </div>

            <!-- Lifecycle Key Stats Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Date of Admission</span>
                <span class="font-bold text-slate-800 text-xs mt-0.5 block">
                  {{ (selectedAlumniForJourney.admission_date ? (selectedAlumniForJourney.admission_date | date:'mediumDate') : 'Recorded') }}
                </span>
                <span class="text-[10px] text-slate-500">in {{ selectedAlumniForJourney.admission_class_name || 'Class' }}</span>
              </div>

              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Graduation / Exit</span>
                <span class="font-bold text-slate-800 text-xs mt-0.5 block">
                  {{ (selectedAlumniForJourney.leaving_date ? (selectedAlumniForJourney.leaving_date | date:'mediumDate') : 'Session End') }}
                </span>
                <span class="text-[10px] text-slate-500">{{ selectedAlumniForJourney.graduation_session }}</span>
              </div>

              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">TC / Leaving Serial</span>
                <span class="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                  {{ selectedAlumniForJourney.tc_number || 'TC-ISSUED' }}
                </span>
                <span class="text-[10px] text-slate-500">Official Register</span>
              </div>

              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span class="text-[10px] uppercase font-bold text-slate-400 block">Institutional Conduct</span>
                <span class="font-bold text-slate-800 text-xs mt-0.5 block">
                  {{ selectedAlumniForJourney.conduct || 'Exemplary' }}
                </span>
                <span class="text-[10px] text-slate-500">Bonafide Record</span>
              </div>
            </div>

            <!-- Chronological Lifecycle Timeline -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <h5 class="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Chronological Lifecycle Journey & Milestones ({{ alumniJourneyLogs.length }})</span>
                </h5>
                <span class="text-[10px] text-slate-400 font-mono">Admission ID: {{ selectedAlumniForJourney.admission_number }}</span>
              </div>

              <div *ngIf="loadingAlumniJourney" class="p-10 text-center text-slate-400">
                <div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin mx-auto mb-2"></div>
                <span>Compiling student journey transcript...</span>
              </div>

              <!-- Timeline Items Container -->
              <div *ngIf="!loadingAlumniJourney" class="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div *ngFor="let log of alumniJourneyLogs; let idx = index" class="relative flex items-start gap-3.5 pl-1.5">
                  <!-- Timeline Step Dot -->
                  <div class="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 z-10 shadow-xs ring-4 ring-white">
                    {{ idx + 1 }}
                  </div>

                  <!-- Timeline Content Box -->
                  <div class="p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-2xl border border-slate-200 flex-1 space-y-1.5">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <div class="flex items-center gap-2">
                        <span class="font-black text-slate-900 text-xs">{{ log.title }}</span>
                        <span *ngIf="log.academic_session" class="px-2 py-0.5 bg-white text-slate-700 text-[10px] font-mono font-bold rounded-md border border-slate-200">
                          {{ log.academic_session }}
                        </span>
                      </div>
                      <span class="text-[10px] font-mono text-slate-400">
                        {{ log.timestamp ? (log.timestamp | date:'mediumDate') : 'Recorded' }}
                      </span>
                    </div>

                    <p class="text-[11px] text-slate-600 leading-relaxed">{{ log.description }}</p>

                    <div *ngIf="log.class_name || log.roll_number || log.alumni_number || log.tc_number" class="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-medium flex-wrap">
                      <span *ngIf="log.class_name" class="font-bold text-slate-700">Class: {{ log.class_name }} ({{ formatSection(log.section_name) }})</span>
                      <span *ngIf="log.roll_number">• Roll: {{ log.roll_number }}</span>
                      <span *ngIf="log.alumni_number">• Alumni ID: <strong class="font-mono text-slate-800">{{ log.alumni_number }}</strong></span>
                      <span *ngIf="log.tc_number">• TC No: <strong class="font-mono text-slate-800">{{ log.tc_number }}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" (click)="openTcModal(selectedAlumniForJourney, $event)"
                      class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Transfer Certificate (TC)</span>
              </button>

              <button type="button" (click)="openCharacterCertModal(selectedAlumniForJourney, $event)"
                      class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Character Cert</span>
              </button>

              <button type="button" (click)="openAlumniCertModal(selectedAlumniForJourney, $event)"
                      class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Alumni Cert</span>
              </button>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button type="button" (click)="printStudentJourneyTranscript()"
                      class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Journey Transcript</span>
              </button>
              <button type="button" (click)="closeAlumniJourneyModal()"
                      class="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-2xl cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: TRANSFER / SCHOOL LEAVING CERTIFICATE (TC)              -->
      <!-- ============================================================== -->
      <div *ngIf="showTcModal && selectedAlumniForTc" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[90] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeTcModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp relative z-10">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-lg shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Generate Transfer Certificate (TC)</h3>
                <p class="text-xs text-slate-500 mt-0.5">Official School Leaving / Transfer Certificate with institutional compliance.</p>
              </div>
            </div>
            <button (click)="closeTcModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Alumnus Record</span>
                <span class="font-black text-slate-900 text-sm">{{ selectedAlumniForTc.full_name }}</span>
                <span class="text-slate-500 ml-1.5 font-mono">({{ selectedAlumniForTc.admission_number }})</span>
              </div>
              <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
                {{ selectedAlumniForTc.last_class_name || 'Class 12' }} - {{ formatSection(selectedAlumniForTc.last_section_name) }}
              </span>
            </div>

            <!-- Configuration Fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">TC Serial Number *</label>
                <input type="text" [(ngModel)]="tcForm.tcNumber" placeholder="e.g. TC/2026/0142"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Issue Date *</label>
                <input type="date" [(ngModel)]="tcForm.issueDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Promotion / Academic Qualification *</label>
                <input type="text" [(ngModel)]="tcForm.promotionStatus" placeholder="e.g. Qualified for next higher class"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">School Dues Paid Up To *</label>
                <input type="text" [(ngModel)]="tcForm.duesPaidMonth" placeholder="e.g. March 2026 (All Dues Cleared)"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">General Conduct & Character *</label>
                <select [(ngModel)]="tcForm.conduct"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option value="Exemplary">Exemplary</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Satisfactory">Satisfactory</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Reason for Leaving *</label>
                <input type="text" [(ngModel)]="tcForm.reasonForLeaving" placeholder="e.g. Completed Class Course / Relocation"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- Live Document Preview Box (Directly Editable) -->
            <div class="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl font-serif space-y-2.5 text-slate-900">
              <div class="pb-2 border-b border-slate-300">
                <div class="flex items-center justify-between">
                  <div class="text-[10px] uppercase tracking-widest font-sans font-bold text-slate-400">Institutional Preview (Editable)</div>
                  <button type="button" (click)="updateTcCertificateBody()" title="Reset / Auto-Generate statement from form inputs"
                          class="text-[10px] font-sans font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 hover:underline">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span>Reset / Auto-Generate</span>
                  </button>
                </div>
                <div class="text-center mt-1">
                  <div class="text-sm font-black uppercase tracking-wider">{{ auth.currentUser()?.school?.name || 'SchoolSense Academy' }}</div>
                  <div class="text-[10px] font-sans text-slate-500 font-semibold">TRANSFER / SCHOOL LEAVING CERTIFICATE • TC NO: {{ tcForm.tcNumber }}</div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">Official Certification Statement (Click below to edit):</label>
                <textarea [(ngModel)]="tcForm.certificateBody" rows="3"
                          placeholder="Edit or customize official certificate statement text..."
                          class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-xs resize-y"></textarea>
              </div>
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button type="button" (click)="closeTcModal()" [disabled]="savingTc"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button type="button" (click)="printTransferCertificate()" [disabled]="savingTc"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="savingTc" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ savingTc ? 'Generating...' : 'Print Official TC' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: CHARACTER & CONDUCT CERTIFICATE                         -->
      <!-- ============================================================== -->
      <div *ngIf="showCharacterCertModal && selectedAlumniForCharacterCert" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[90] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeCharacterCertModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp relative z-10">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-lg shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Generate Character Certificate</h3>
                <p class="text-xs text-slate-500 mt-0.5">Bonafide conduct & character certification for higher education / institutions.</p>
              </div>
            </div>
            <button (click)="closeCharacterCertModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Student Record</span>
                <span class="font-black text-slate-900 text-sm">{{ selectedAlumniForCharacterCert.full_name }}</span>
                <span class="text-slate-500 ml-1.5 font-mono">({{ selectedAlumniForCharacterCert.admission_number }})</span>
              </div>
              <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-bold text-slate-800 text-xs shadow-2xs">
                {{ selectedAlumniForCharacterCert.last_class_name || 'Class 12' }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Certificate Serial Number *</label>
                <input type="text" [(ngModel)]="characterCertForm.certNumber" placeholder="e.g. CC/2026/0088"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Issue Date *</label>
                <input type="date" [(ngModel)]="characterCertForm.issueDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Conduct & Moral Bearing *</label>
                <select [(ngModel)]="characterCertForm.conduct"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner cursor-pointer">
                  <option value="Exemplary & Commendable">Exemplary & Commendable</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Co-Curricular Participation</label>
                <input type="text" [(ngModel)]="characterCertForm.coCurricularRemarks" placeholder="e.g. Actively participated in sports and debate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- Preview box (Directly Editable) -->
            <div class="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl font-serif space-y-2.5 text-slate-900">
              <div class="pb-2 border-b border-slate-300">
                <div class="flex items-center justify-between">
                  <div class="text-[10px] uppercase tracking-widest font-sans font-bold text-slate-400">Institutional Preview (Editable)</div>
                  <button type="button" (click)="updateCharacterCertificateBody()" title="Reset / Auto-Generate statement from form inputs"
                          class="text-[10px] font-sans font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 hover:underline">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span>Reset / Auto-Generate</span>
                  </button>
                </div>
                <div class="text-center mt-1">
                  <div class="text-sm font-black uppercase tracking-wider">{{ auth.currentUser()?.school?.name || 'SchoolSense Academy' }}</div>
                  <div class="text-[10px] font-sans text-slate-500 font-semibold">CHARACTER & CONDUCT CERTIFICATE • SERIAL NO: {{ characterCertForm.certNumber }}</div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">Official Character Certification Text (Click below to edit):</label>
                <textarea [(ngModel)]="characterCertForm.certificateBody" rows="4"
                          placeholder="Edit or customize character certificate statement text..."
                          class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-xs resize-y"></textarea>
              </div>
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button type="button" (click)="closeCharacterCertModal()" [disabled]="savingCharacterCert"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button type="button" (click)="printCharacterCertificate()" [disabled]="savingCharacterCert"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="savingCharacterCert" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ savingCharacterCert ? 'Generating...' : 'Print Character Certificate' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ALUMNI RECOGNITION & MEMBERSHIP CERTIFICATE             -->
      <!-- ============================================================== -->
      <div *ngIf="showAlumniCertModal && selectedAlumniForAlumniCert" class="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[90] animate-fadeIn">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" (click)="closeAlumniCertModal()"></div>
        <div class="bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-slate-200/90 overflow-hidden animate-scaleUp relative z-10">
          <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-black text-lg shadow-xs">
                <svg class="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900 tracking-tight">Generate Official Alumni Certificate</h3>
                <p class="text-xs text-slate-500 mt-0.5">Certificate of Alumni Recognition featuring permanent Alumni Registration Number.</p>
              </div>
            </div>
            <button (click)="closeAlumniCertModal()" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">&times;</button>
          </div>

          <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Alumnus Name</span>
                <span class="font-black text-slate-900 text-sm">{{ selectedAlumniForAlumniCert.full_name }}</span>
                <span class="text-slate-500 ml-1.5 font-mono">({{ selectedAlumniForAlumniCert.admission_number }})</span>
              </div>
              <span class="px-2.5 py-1 bg-white rounded-xl border border-slate-200 font-mono font-bold text-slate-800 text-xs shadow-2xs">
                Alumni ID: {{ alumniCertForm.alumniNumber }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Permanent Alumni Number *</label>
                <input type="text" [(ngModel)]="alumniCertForm.alumniNumber" placeholder="e.g. ALU-2026-0042"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Certificate Serial Number *</label>
                <input type="text" [(ngModel)]="alumniCertForm.certNumber" placeholder="e.g. AC/2026/0122"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Issue Date *</label>
                <input type="date" [(ngModel)]="alumniCertForm.issueDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Recognition Statement</label>
                <input type="text" [(ngModel)]="alumniCertForm.honorsRemarks" placeholder="e.g. Inducted into lifelong Alumni Guild"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-inner" />
              </div>
            </div>

            <!-- Preview box (Directly Editable) -->
            <div class="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl font-serif space-y-2.5 text-slate-900">
              <div class="pb-2 border-b border-slate-300">
                <div class="flex items-center justify-between">
                  <div class="text-[10px] uppercase tracking-widest font-sans font-bold text-slate-400">Institutional Preview (Editable)</div>
                  <button type="button" (click)="updateAlumniCertificateBody()" title="Reset / Auto-Generate statement from form inputs"
                          class="text-[10px] font-sans font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1 hover:underline">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span>Reset / Auto-Generate</span>
                  </button>
                </div>
                <div class="text-center mt-1">
                  <div class="text-sm font-black uppercase tracking-wider">{{ auth.currentUser()?.school?.name || 'SchoolSense Academy' }}</div>
                  <div class="text-[10px] font-sans text-slate-500 font-semibold">CERTIFICATE OF ALUMNI RECOGNITION • ALUMNI ID: {{ alumniCertForm.alumniNumber }}</div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1">Official Recognition Statement Text (Click below to edit):</label>
                <textarea [(ngModel)]="alumniCertForm.certificateBody" rows="3"
                          placeholder="Edit or customize alumni recognition statement text..."
                          class="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 shadow-xs resize-y"></textarea>
              </div>
            </div>
          </div>

          <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl flex items-center justify-end gap-2.5 shrink-0">
            <button type="button" (click)="closeAlumniCertModal()" [disabled]="savingAlumniCert"
                    class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer shadow-2xs">
              Cancel
            </button>
            <button type="button" (click)="printAlumniCertificate()" [disabled]="savingAlumniCert"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50">
              <svg *ngIf="savingAlumniCert" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ savingAlumniCert ? 'Generating...' : 'Print Alumni Certificate' }}</span>
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
  imageUploadService = inject(ImageUploadService);
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

  // Alumni Management
  showAddAlumniModal = false;
  isEditingAlumni = false;
  editingAlumniId = '';
  savingAlumni = false;
  alumniModalError = '';
  activeAlumniMenuId: string | null = null;
  alumniMenuStyle: Record<string, string> = {};
  showDeleteAlumniModal = false;
  alumniToDelete: AlumniStudent | null = null;
  isDeletingAlumni = false;
  newAlumni = {
    firstName: '',
    lastName: '',
    admissionNumber: '',
    gender: 'MALE',
    dateOfBirth: '',
    className: 'Class 12',
    sectionName: 'Section A',
    graduationSession: '',
    guardianName: '',
    guardianPhone: '',
    rollNumber: '1',
  };

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

  // Loading state flags
  loadingClasses = true;
  loadingStudents = false;
  loadingStaff = false;
  loadingAlumni = false;

  // 3-Dot Action Menus
  activeClassMenuId: string | null = null;
  activeSectionMenuId: string | null = null;

  // Collapsible Accordion State for Sections & Subjects (Collapsed by default)
  expandedClassSections = new Set<string>();
  expandedClassSubjects = new Set<string>();

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

  showDeleteSubjectModal = false;
  subjectToDelete: { subject: SubjectItem; classItem?: ClassItem } | null = null;
  isDeletingSubject = false;

  // Modals state
  showSessionModal = false;
  savingSession = false;
  sessionModalError = '';
  sessionToDelete: AcademicSession | null = null;
  isDeletingSession = false;
  showResetConfirmModal = false;
  isResettingDatabase = false;
  newSession = {
    name: '2027–2028',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    isCurrent: true,
    promoteStudents: true,
    fromSessionId: '',
  };

  showAddSubjectModal = false;
  savingSubject = false;
  subjectModalError = '';
  subjectTargetClass: ClassItem | null = null;
  selectedSubjectClassId = '';
  quickSubjectSuggestions: string[] = [
    'Mathematics',
    'English',
    'Science',
    'Biology',
    'Physics',
    'Chemistry',
    'Social Studies',
    'Computer Science',
    'Hindi',
    'EVS',
    'Art & Craft',
    'General Knowledge',
  ];
  newSubject = {
    name: '',
    code: '',
    subjectType: 'ACADEMIC',
    description: '',
    isAllSections: true,
    selectedSectionIds: [] as string[],
  };

  showAddStudentModal = false;
  savingStudent = false;
  studentModalError = '';
  studentEnrollClassId = '';
  uploadingStudentPhoto = false;
  uploadingGuardianPhoto = false;
  uploadingStaffPhoto = false;
  hideLoginEmail = false;

  newStudent = {
    firstName: '',
    lastName: '',
    admissionNumber: '',
    rollNumber: '',
    sectionId: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    photoUrl: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: 'GUARDIAN',
    primaryGuardianType: 'FATHER' as 'FATHER' | 'MOTHER' | 'GUARDIAN',
    guardianEmail: '',
    confirmGuardianEmail: '',
    guardianPhotoUrl: '',
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
    photoUrl: '',
    role: 'TEACHER',
    primarySubjectId: '',
    password: 'password123',
    gender: 'MALE',
    dateOfBirth: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    department: '',
  };

  // Status Management & Deactivation Requests State
  activeStudentMenuId: string | null = null;
  studentMenuStyle: { [key: string]: string } = {};
  isEditingStudent = false;
  editingStudentId: string | null = null;
  deactivationRequests: StudentDeactivationRequest[] = [];
  showDeactivationRequestsModal = false;
  loadingDeactivationRequests = false;
  reviewNotes = '';
  studentStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEFTOUT' = 'ACTIVE';
  staffStatusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  staffRoleFilter: 'ALL' | 'PRINCIPAL' | 'SCHOOL_ADMIN' | 'CLASS_TEACHER' | 'TEACHER' = 'ALL';
  staffCurrentPage = 1;
  staffPageSize = 25;

  // Staff 3-Dot Actions & Profile/Edit State
  activeStaffMenuId: string | null = null;
  staffMenuStyle: { [key: string]: string } = {};
  showStaffProfileModal = false;
  selectedStaffProfile: StaffMember | null = null;
  showEditStaffModal = false;
  editingStaffId: string | null = null;
  editStaffForm: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoUrl: '',
    role: 'TEACHER',
    primarySubjectId: '',
    gender: 'MALE',
    dateOfBirth: '',
    qualification: '',
    experience: '',
    joiningDate: '',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    department: '',
  };
  savingStaffEdit = false;
  editStaffModalError = '';
  uploadingEditStaffPhoto = false;
  showDeleteStaffModal = false;
  staffToDelete: StaffMember | null = null;
  deletingStaff = false;

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
  studentStatusAction: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEFTOUT' = 'INACTIVE';
  studentStatusReason = '';
  updatingStudentStatus = false;

  showTeacherDeactModal = false;
  selectedStudentForDeactRequest: StudentItem | null = null;
  deactRequestReason = 'Transfer / Relocation';
  deactRequestComments = '';
  submittingDeactRequest = false;
  deactModalError = '';

  // Promotion State
  showPromoteStudentModal = false;
  selectedStudentForPromote: StudentItem | null = null;
  promoteTargetClassId = '';
  promoteTargetSectionId = '';
  promoteRollNumber = '';
  promoteReason = '';
  executingPromote = false;
  promoteModalError = '';

  // Section Change State
  showChangeSectionModal = false;
  selectedStudentForSectionChange: StudentItem | null = null;
  sectionChangeTargetSectionId = '';
  sectionChangeRollNumber = '';
  sectionChangeReason = '';
  executingSectionChange = false;
  sectionChangeModalError = '';

  // Demotion State
  showDemoteStudentModal = false;
  selectedStudentForDemote: StudentItem | null = null;
  demoteTargetClassId = '';
  demoteTargetSectionId = '';
  demoteRollNumber = '';
  demoteReason = '';
  executingDemote = false;
  demoteModalError = '';

  // Convert to Alumni State
  showConvertToAlumniModal = false;
  selectedStudentForAlumniConversion: StudentItem | null = null;
  alumniConversionSession = '';
  alumniConversionGraduatingClassId = '';
  alumniConversionGraduatingSectionId = '';
  alumniConversionTcNumber = '';
  alumniConversionRemarks = '';
  executingAlumniConversion = false;
  alumniConversionModalError = '';

  // Teacher Academic Request State
  showAcademicRequestModal = false;
  selectedStudentForAcademicRequest: StudentItem | null = null;
  academicRequestType: 'PROMOTION' | 'SECTION_CHANGE' | 'DEMOTION' | 'ALUMNI' | 'INACTIVE' | 'LEFTOUT' = 'PROMOTION';
  academicRequestTargetClassId = '';
  academicRequestTargetSectionId = '';
  academicRequestTargetRollNumber = '';
  academicRequestPassingSession = '';
  academicRequestTcNumber = '';
  academicRequestReason = '';
  academicRequestComments = '';
  submittingAcademicRequest = false;
  academicRequestModalError = '';

  // Leftout / Status modal extensions
  alsoMarkAsAlumni = false;
  leftoutTcNumber = '';
  academicRequestFilterTab: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';

  // Alumni Journey & Lifecycle Logs State
  showAlumniJourneyModal = false;
  selectedAlumniForJourney: AlumniStudent | null = null;
  loadingAlumniJourney = false;
  alumniJourneyLogs: StudentLifecycleLog[] = [];
  alumniJourneySummary: any = null;

  // Transfer Certificate (TC) Modal State
  showTcModal = false;
  selectedAlumniForTc: AlumniStudent | null = null;
  savingTc = false;
  tcForm = {
    tcNumber: '',
    bookNumber: '01',
    issueDate: '',
    promotionStatus: 'Qualified for promotion to next standard',
    duesPaidMonth: 'March (All Dues Cleared)',
    conduct: 'Exemplary',
    reasonForLeaving: 'Course completed / Graduated',
    workingDaysTotal: '220',
    workingDaysPresent: '214',
    remarks: 'Student bears good moral character.',
    certificateBody: '',
  };

  // Character Certificate Modal State
  showCharacterCertModal = false;
  selectedAlumniForCharacterCert: AlumniStudent | null = null;
  savingCharacterCert = false;
  characterCertForm = {
    certNumber: '',
    issueDate: '',
    conduct: 'Exemplary & Commendable',
    coCurricularRemarks: 'Actively participated in school academic, cultural, and sports activities.',
    remarks: 'We wish them excellence and bright success in all future pursuits.',
    certificateBody: '',
  };

  // Alumni Certificate Modal State
  showAlumniCertModal = false;
  selectedAlumniForAlumniCert: AlumniStudent | null = null;
  savingAlumniCert = false;
  alumniCertForm = {
    certNumber: '',
    alumniNumber: '',
    issueDate: '',
    honorsRemarks: 'Recognized for successful academic completion and awarded lifelong institutional alumni status.',
    certificateBody: '',
  };

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

  constructor() {
    effect(() => {
      // Triggered reactively whenever user switches active session
      const activeSes = this.auth.activeAcademicSession();
      if (activeSes) {
        this.loadClassesAndSubjects();
        this.loadAlumniList();
      }
    });
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

  // --- Pedagogical & Academic Ordering Getters ---
  get sortedClasses(): ClassItem[] {
    return [...(this.classes || [])].sort((a, b) => {
      const rankA = getClassPedagogicalRank(a.name, a.code, a.display_order);
      const rankB = getClassPedagogicalRank(b.name, b.code, b.display_order);
      if (rankA !== rankB) return rankA - rankB;
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }

  get availableSectionsForPromoteClass(): SectionItem[] {
    if (!this.promoteTargetClassId) return [];
    const targetCls = this.classes.find(c => c.id === this.promoteTargetClassId);
    return targetCls?.sections || [];
  }

  get availableSectionsForDemoteClass(): SectionItem[] {
    if (!this.demoteTargetClassId) return [];
    const targetCls = this.classes.find(c => c.id === this.demoteTargetClassId);
    return targetCls?.sections || [];
  }

  get availableSectionsForCurrentClass(): SectionItem[] {
    if (!this.selectedStudentForSectionChange) return this.selectedClass?.sections || [];
    const cls = this.classes.find(c => c.name === this.selectedStudentForSectionChange?.className || c.id === this.selectedClass?.id);
    return cls?.sections || this.selectedClass?.sections || [];
  }

  get availableSectionsForAcademicRequestClass(): SectionItem[] {
    if (!this.academicRequestTargetClassId) return [];
    const targetCls = this.classes.find(c => c.id === this.academicRequestTargetClassId);
    return targetCls?.sections || [];
  }

  get filteredAcademicRequests(): StudentDeactivationRequest[] {
    if (this.academicRequestFilterTab === 'ALL') {
      return this.deactivationRequests;
    }
    return this.deactivationRequests.filter(r => (r.status || 'PENDING') === this.academicRequestFilterTab);
  }

  formatRequestType(type?: string): string {
    switch (type) {
      case 'PROMOTION': return 'Promote to Next Class';
      case 'DEMOTION': return 'Demote to Previous Class';
      case 'SECTION_CHANGE': return 'Transfer Section';
      case 'ALUMNI': return 'Graduate to Alumni';
      case 'INACTIVE': return 'Mark Inactive';
      case 'SUSPENDED': return 'Suspend Student';
      case 'LEFTOUT': return 'Mark Leftout / TC';
      default: return type || 'Deactivation Request';
    }
  }

  // --- Student Status Direct Toggle (Admin / Principal) ---
  openToggleStudentStatus(student: StudentItem, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEFTOUT', event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.selectedStudentForStatus = student;
    this.studentStatusAction = newStatus;
    this.alsoMarkAsAlumni = false;
    this.leftoutTcNumber = '';
    const defaultReasons: Record<string, string> = {
      ACTIVE: 'Re-admitted / Reactivated',
      INACTIVE: 'Administrative deactivation',
      SUSPENDED: 'Disciplinary suspension',
      LEFTOUT: 'Transfer Certificate / Left school',
    };
    this.studentStatusReason = defaultReasons[newStatus] || '';
    this.modalService.open('STUDENT_STATUS_MODAL');
    this.showStudentStatusModal = true;
  }

  closeStudentStatusModal() {
    this.modalService.close();
    this.showStudentStatusModal = false;
    this.selectedStudentForStatus = null;
    this.alsoMarkAsAlumni = false;
    this.leftoutTcNumber = '';
  }

  executeToggleStudentStatus() {
    if (!this.selectedStudentForStatus) return;
    const student = this.selectedStudentForStatus;
    const action = this.studentStatusAction;
    this.updatingStudentStatus = true;

    const studentId = student.studentId || student.id || student.enrollmentId;

    if (action === 'LEFTOUT' && this.alsoMarkAsAlumni) {
      const currentCls = this.classes.find(c => c.name.toLowerCase() === student.className.toLowerCase() || c.id === this.selectedClass?.id);
      const payload = {
        student_id: studentId,
        graduating_class_id: currentCls?.id || this.classes[0]?.id || '',
        graduating_session: this.auth.activeAcademicSession()?.name || '2026–2027',
        tc_number: this.leftoutTcNumber.trim() || undefined,
        remarks: this.studentStatusReason.trim() || `Left school / TC issued in ${student.className} and added to Alumni`,
      };
      this.api.post('academics/students/convert-alumni', payload).subscribe({
        next: () => {
          this.updatingStudentStatus = false;
          this.closeStudentStatusModal();
          student.status = 'ALUMNI';
          this.toast.success(`Student "${student.fullName}" marked as Leftout and registered in Alumni Directory.`);
          this.loadAlumniList();
          if (this.selectedSection) {
            this.selectSection(this.selectedSection);
          }
        },
        error: (err: any) => {
          this.updatingStudentStatus = false;
          this.toast.error(this.formatErrorMessage(err, 'Failed to update student status.'));
        },
      });
      return;
    }

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
        this.toast.error(this.formatErrorMessage(err, 'Failed to update student status.'));
      },
    });
  }

  // --- Student Direct Promotion (Admin / Principal) ---
  openPromoteStudentModal(student: StudentItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.selectedStudentForPromote = student;
    this.promoteRollNumber = student.rollNumber ? String(student.rollNumber) : '';
    this.promoteReason = 'Annual academic promotion to next grade level';
    this.promoteModalError = '';

    const sorted = this.sortedClasses;
    const currentIndex = sorted.findIndex(c => c.name.toLowerCase() === student.className.toLowerCase() || c.id === this.selectedClass?.id);
    if (currentIndex >= 0 && currentIndex < sorted.length - 1) {
      this.promoteTargetClassId = sorted[currentIndex + 1].id;
    } else {
      this.promoteTargetClassId = sorted[0]?.id || '';
    }
    this.onPromoteClassChange();
    this.modalService.open('PROMOTE_STUDENT_MODAL');
    this.showPromoteStudentModal = true;
  }

  closePromoteStudentModal() {
    this.modalService.close();
    this.showPromoteStudentModal = false;
    this.selectedStudentForPromote = null;
    this.promoteModalError = '';
  }

  onPromoteClassChange() {
    const sections = this.availableSectionsForPromoteClass;
    if (sections && sections.length > 0) {
      this.promoteTargetSectionId = sections[0].id;
    } else {
      this.promoteTargetSectionId = '';
    }
  }

  executePromoteStudent() {
    if (!this.selectedStudentForPromote) return;
    if (!this.promoteTargetClassId) {
      this.promoteModalError = 'Please select a target class.';
      return;
    }
    if (!this.promoteTargetSectionId) {
      this.promoteModalError = 'Please select a target section.';
      return;
    }

    this.executingPromote = true;
    this.promoteModalError = '';

    const student = this.selectedStudentForPromote;
    const studentId = student.studentId || student.id || student.enrollmentId;

    const payload = {
      student_id: studentId,
      target_class_id: this.promoteTargetClassId,
      target_section_id: this.promoteTargetSectionId,
      target_roll_number: this.promoteRollNumber ? Number(this.promoteRollNumber) : undefined,
      reason: this.promoteReason.trim() || undefined,
    };

    this.api.post('academics/students/promote', payload).subscribe({
      next: () => {
        this.executingPromote = false;
        this.closePromoteStudentModal();
        this.toast.success(`Student "${student.fullName}" promoted successfully! Admission number remains ${student.admissionNumber}.`);
        this.loadClassesAndSubjects();
        if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err: any) => {
        this.executingPromote = false;
        this.promoteModalError = this.formatErrorMessage(err, 'Failed to promote student.');
      },
    });
  }

  // --- Student Direct Section Change (Admin / Principal) ---
  openChangeSectionModal(student: StudentItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.selectedStudentForSectionChange = student;
    this.sectionChangeRollNumber = student.rollNumber ? String(student.rollNumber) : '';
    this.sectionChangeReason = 'Section rebalancing / Class division transfer';
    this.sectionChangeModalError = '';

    const sections = this.availableSectionsForCurrentClass;
    const otherSection = sections.find(s => s.name.toLowerCase() !== student.sectionName.toLowerCase());
    this.sectionChangeTargetSectionId = otherSection?.id || sections[0]?.id || '';

    this.modalService.open('CHANGE_SECTION_MODAL');
    this.showChangeSectionModal = true;
  }

  closeChangeSectionModal() {
    this.modalService.close();
    this.showChangeSectionModal = false;
    this.selectedStudentForSectionChange = null;
    this.sectionChangeModalError = '';
  }

  executeChangeSection() {
    if (!this.selectedStudentForSectionChange) return;
    if (!this.sectionChangeTargetSectionId) {
      this.sectionChangeModalError = 'Please select a target section.';
      return;
    }

    this.executingSectionChange = true;
    this.sectionChangeModalError = '';

    const student = this.selectedStudentForSectionChange;
    const studentId = student.studentId || student.id || student.enrollmentId;

    const payload = {
      student_id: studentId,
      target_section_id: this.sectionChangeTargetSectionId,
      target_roll_number: this.sectionChangeRollNumber ? Number(this.sectionChangeRollNumber) : undefined,
      reason: this.sectionChangeReason.trim() || undefined,
    };

    this.api.post('academics/students/change-section', payload).subscribe({
      next: () => {
        this.executingSectionChange = false;
        this.closeChangeSectionModal();
        this.toast.success(`Student "${student.fullName}" transferred to new section successfully.`);
        this.loadClassesAndSubjects();
        if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err: any) => {
        this.executingSectionChange = false;
        this.sectionChangeModalError = this.formatErrorMessage(err, 'Failed to transfer section.');
      },
    });
  }

  // --- Student Direct Demotion (Admin / Principal) ---
  openDemoteStudentModal(student: StudentItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.selectedStudentForDemote = student;
    this.demoteRollNumber = student.rollNumber ? String(student.rollNumber) : '';
    this.demoteReason = 'Academic review / Foundational reassignment';
    this.demoteModalError = '';

    const sorted = this.sortedClasses;
    const currentIndex = sorted.findIndex(c => c.name.toLowerCase() === student.className.toLowerCase() || c.id === this.selectedClass?.id);
    if (currentIndex > 0) {
      this.demoteTargetClassId = sorted[currentIndex - 1].id;
    } else {
      this.demoteTargetClassId = sorted[0]?.id || '';
    }
    this.onDemoteClassChange();
    this.modalService.open('DEMOTE_STUDENT_MODAL');
    this.showDemoteStudentModal = true;
  }

  closeDemoteStudentModal() {
    this.modalService.close();
    this.showDemoteStudentModal = false;
    this.selectedStudentForDemote = null;
    this.demoteModalError = '';
  }

  onDemoteClassChange() {
    const sections = this.availableSectionsForDemoteClass;
    if (sections && sections.length > 0) {
      this.demoteTargetSectionId = sections[0].id;
    } else {
      this.demoteTargetSectionId = '';
    }
  }

  executeDemoteStudent() {
    if (!this.selectedStudentForDemote) return;
    if (!this.demoteTargetClassId) {
      this.demoteModalError = 'Please select a target class.';
      return;
    }
    if (!this.demoteTargetSectionId) {
      this.demoteModalError = 'Please select a target section.';
      return;
    }

    this.executingDemote = true;
    this.demoteModalError = '';

    const student = this.selectedStudentForDemote;
    const studentId = student.studentId || student.id || student.enrollmentId;

    const payload = {
      student_id: studentId,
      target_class_id: this.demoteTargetClassId,
      target_section_id: this.demoteTargetSectionId,
      target_roll_number: this.demoteRollNumber ? Number(this.demoteRollNumber) : undefined,
      reason: this.demoteReason.trim() || undefined,
    };

    this.api.post('academics/students/demote', payload).subscribe({
      next: () => {
        this.executingDemote = false;
        this.closeDemoteStudentModal();
        this.toast.success(`Student "${student.fullName}" moved to target class successfully.`);
        this.loadClassesAndSubjects();
        if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err: any) => {
        this.executingDemote = false;
        this.demoteModalError = this.formatErrorMessage(err, 'Failed to reassign student.');
      },
    });
  }

  // --- Student Direct Convert to Alumni (Admin / Principal) ---
  openConvertToAlumniModal(student: StudentItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.selectedStudentForAlumniConversion = student;
    this.alumniConversionSession = this.auth.activeAcademicSession()?.name || '2026–2027';
    
    const currentCls = this.classes.find(c => c.name.toLowerCase() === student.className.toLowerCase() || c.id === this.selectedClass?.id);
    this.alumniConversionGraduatingClassId = currentCls?.id || this.classes[0]?.id || '';
    this.alumniConversionTcNumber = '';
    this.alumniConversionRemarks = `Completed ${student.className} and graduated to institutional alumni`;
    this.alumniConversionModalError = '';

    this.modalService.open('CONVERT_ALUMNI_MODAL');
    this.showConvertToAlumniModal = true;
  }

  closeConvertToAlumniModal() {
    this.modalService.close();
    this.showConvertToAlumniModal = false;
    this.selectedStudentForAlumniConversion = null;
    this.alumniConversionModalError = '';
  }

  executeConvertToAlumni() {
    if (!this.selectedStudentForAlumniConversion) return;
    if (!this.alumniConversionGraduatingClassId) {
      this.alumniConversionModalError = 'Please select the graduating/terminal class.';
      return;
    }
    if (!this.alumniConversionSession.trim()) {
      this.alumniConversionModalError = 'Please specify the passing academic session.';
      return;
    }

    this.executingAlumniConversion = true;
    this.alumniConversionModalError = '';

    const student = this.selectedStudentForAlumniConversion;
    const studentId = student.studentId || student.id || student.enrollmentId;

    const payload = {
      student_id: studentId,
      graduating_class_id: this.alumniConversionGraduatingClassId,
      graduating_session: this.alumniConversionSession.trim(),
      tc_number: this.alumniConversionTcNumber.trim() || undefined,
      remarks: this.alumniConversionRemarks.trim() || undefined,
    };

    this.api.post('academics/students/convert-alumni', payload).subscribe({
      next: () => {
        this.executingAlumniConversion = false;
        this.closeConvertToAlumniModal();
        student.status = 'ALUMNI';
        this.toast.success(`Student "${student.fullName}" successfully moved to Alumni Directory! Permanent admission number: ${student.admissionNumber}`);
        this.loadAlumniList();
        if (this.selectedSection) {
          this.selectSection(this.selectedSection);
        }
      },
      error: (err: any) => {
        this.executingAlumniConversion = false;
        this.alumniConversionModalError = this.formatErrorMessage(err, 'Failed to convert student to alumni.');
      },
    });
  }

  // --- Teacher Academic Action Request Modal (Teacher Role) ---
  openTeacherAcademicRequestModal(student: StudentItem, requestType: 'PROMOTION' | 'SECTION_CHANGE' | 'DEMOTION' | 'ALUMNI' | 'INACTIVE' | 'LEFTOUT' = 'PROMOTION', event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.selectedStudentForAcademicRequest = student;
    this.academicRequestType = requestType;
    this.academicRequestPassingSession = this.auth.activeAcademicSession()?.name || '2026–2027';
    this.academicRequestTcNumber = '';
    this.academicRequestTargetRollNumber = student.rollNumber ? String(student.rollNumber) : '';

    const defaultReasons: Record<string, string> = {
      PROMOTION: 'Qualified for academic promotion to next grade level',
      SECTION_CHANGE: 'Section transfer / Classroom balance request',
      DEMOTION: 'Needs foundational revision in previous class level',
      ALUMNI: `Completed studies up to ${student.className} - move to alumni`,
      INACTIVE: 'Parent requested temporary withdrawal / fee hold',
      LEFTOUT: 'Transfer Certificate requested / student relocated',
    };
    this.academicRequestReason = defaultReasons[requestType] || '';
    this.academicRequestComments = '';
    this.academicRequestModalError = '';

    this.onAcademicRequestTypeChange();
    this.modalService.open('TEACHER_ACADEMIC_REQUEST_MODAL');
    this.showAcademicRequestModal = true;
  }

  closeTeacherAcademicRequestModal() {
    this.modalService.close();
    this.showAcademicRequestModal = false;
    this.selectedStudentForAcademicRequest = null;
    this.academicRequestModalError = '';
  }

  onAcademicRequestTypeChange() {
    const student = this.selectedStudentForAcademicRequest;
    if (!student) return;
    const sorted = this.sortedClasses;
    const currentIndex = sorted.findIndex(c => c.name.toLowerCase() === student.className.toLowerCase() || c.id === this.selectedClass?.id);

    if (this.academicRequestType === 'PROMOTION') {
      if (currentIndex >= 0 && currentIndex < sorted.length - 1) {
        this.academicRequestTargetClassId = sorted[currentIndex + 1].id;
      } else {
        this.academicRequestTargetClassId = sorted[0]?.id || '';
      }
      this.onAcademicRequestClassChange();
    } else if (this.academicRequestType === 'DEMOTION') {
      if (currentIndex > 0) {
        this.academicRequestTargetClassId = sorted[currentIndex - 1].id;
      } else {
        this.academicRequestTargetClassId = sorted[0]?.id || '';
      }
      this.onAcademicRequestClassChange();
    } else if (this.academicRequestType === 'SECTION_CHANGE') {
      const sections = this.availableSectionsForCurrentClass;
      const otherSection = sections.find(s => s.name.toLowerCase() !== student.sectionName.toLowerCase());
      this.academicRequestTargetSectionId = otherSection?.id || sections[0]?.id || '';
    }
  }

  onAcademicRequestClassChange() {
    const sections = this.availableSectionsForAcademicRequestClass;
    if (sections && sections.length > 0) {
      this.academicRequestTargetSectionId = sections[0].id;
    } else {
      this.academicRequestTargetSectionId = '';
    }
  }

  submitTeacherAcademicRequest() {
    if (!this.selectedStudentForAcademicRequest) return;
    if (!this.academicRequestReason.trim()) {
      this.academicRequestModalError = 'Please provide a primary justification / reason.';
      return;
    }
    if (!this.academicRequestComments.trim()) {
      this.academicRequestModalError = 'Please provide detailed teacher remarks.';
      return;
    }

    const student = this.selectedStudentForAcademicRequest;
    const studentId = student.studentId || student.id || student.enrollmentId;
    const targetClass = this.classes.find(c => c.id === this.academicRequestTargetClassId);
    const targetSection = (targetClass?.sections || this.classes.flatMap(c => c.sections || [])).find(s => s.id === this.academicRequestTargetSectionId);

    this.submittingAcademicRequest = true;
    this.academicRequestModalError = '';

    const payload = {
      student_id: studentId,
      student_name: student.fullName,
      admission_number: student.admissionNumber,
      class_name: student.className,
      section_name: student.sectionName,
      request_type: this.academicRequestType,
      target_class_id: (this.academicRequestType === 'PROMOTION' || this.academicRequestType === 'DEMOTION') ? this.academicRequestTargetClassId : undefined,
      target_class_name: targetClass?.name,
      target_section_id: (this.academicRequestType === 'PROMOTION' || this.academicRequestType === 'DEMOTION' || this.academicRequestType === 'SECTION_CHANGE') ? this.academicRequestTargetSectionId : undefined,
      target_section_name: targetSection?.name,
      target_roll_number: this.academicRequestTargetRollNumber ? Number(this.academicRequestTargetRollNumber) : undefined,
      passing_session: this.academicRequestType === 'ALUMNI' ? this.academicRequestPassingSession : undefined,
      leaving_certificate_number: (this.academicRequestType === 'ALUMNI' || this.academicRequestType === 'LEFTOUT') ? this.academicRequestTcNumber : undefined,
      reason: this.academicRequestReason.trim(),
      comments: this.academicRequestComments.trim(),
    };

    this.api.post('academics/students/deactivation-requests', payload).subscribe({
      next: () => {
        this.submittingAcademicRequest = false;
        this.closeTeacherAcademicRequestModal();
        this.toast.success(`Academic request for "${student.fullName}" submitted successfully. Sent to Principal / Admin for review.`);
        this.loadDeactivationRequests();
      },
      error: (err: any) => {
        this.submittingAcademicRequest = false;
        this.academicRequestModalError = this.formatErrorMessage(err, 'Failed to submit academic request.');
      },
    });
  }

  // --- Teacher Deactivation Modal (Compatibility alias) ---
  openTeacherDeactModal(student: StudentItem, event: Event) {
    this.openTeacherAcademicRequestModal(student, 'INACTIVE', event);
  }

  closeTeacherDeactModal() {
    this.closeTeacherAcademicRequestModal();
  }

  submitTeacherDeactRequest() {
    this.submitTeacherAcademicRequest();
  }

  // --- Academic Requests Review Queue Modal ---
  openDeactivationRequestsModal() {
    this.loadDeactivationRequests();
    this.academicRequestFilterTab = 'PENDING';
    this.reviewNotes = '';
    this.modalService.open('DEACT_REQUESTS_MODAL');
    this.showDeactivationRequestsModal = true;
  }

  closeDeactivationRequestsModal() {
    this.modalService.close();
    this.showDeactivationRequestsModal = false;
  }

  reviewDeactivationRequest(req: StudentDeactivationRequest, action: 'APPROVED' | 'REJECTED') {
    const actionLabel = action === 'APPROVED' ? 'APPROVE & EXECUTE' : 'REJECT';
    if (!confirm(`Are you sure you want to ${actionLabel} this ${this.formatRequestType(req.request_type)} request for ${req.student_name}?`)) {
      return;
    }
    this.api.patch(`academics/students/deactivation-requests/${req.id}/review`, {
      action,
      reviewNotes: this.reviewNotes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success(`Request ${action.toLowerCase()} successfully.`);
        this.loadDeactivationRequests();
        this.loadClassesAndSubjects();
        this.loadAlumniList();
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
      list = list.filter((s) => {
        const st = (s.status || 'ACTIVE').toUpperCase();
        return st === 'ACTIVE' || st === 'ALUMNI' || st === 'GRADUATED';
      });
    } else if (this.studentStatusFilter === 'INACTIVE') {
      list = list.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'INACTIVE');
    } else if (this.studentStatusFilter === 'SUSPENDED') {
      list = list.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'SUSPENDED');
    } else if (this.studentStatusFilter === 'LEFTOUT') {
      list = list.filter((s) => {
        const st = (s.status || 'ACTIVE').toUpperCase();
        return st === 'LEFTOUT' || st === 'TRANSFERRED';
      });
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
    this.loadingAlumni = true;
    const activeSession = this.auth.activeAcademicSession();
    const params = activeSession ? { academicYearId: activeSession.id } : undefined;
    this.api.get<AlumniStudent[]>('academics/alumni', params).subscribe({
      next: (res) => {
        this.alumniList = res || [];
        this.loadingAlumni = false;
      },
      error: () => {
        this.alumniList = [];
        this.loadingAlumni = false;
      },
    });
  }

  // --- Alumni Management Handlers ---
  toggleAlumniMenu(studentId: string, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeAlumniMenuId === studentId) {
      this.activeAlumniMenuId = null;
      return;
    }
    this.activeAlumniMenuId = studentId;

    const btn = (event.currentTarget || event.target) as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const dropdownHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < dropdownHeight ? `${rect.top - dropdownHeight - 8}px` : `${rect.bottom + 8}px`;
    const right = `${window.innerWidth - rect.right}px`;

    this.alumniMenuStyle = {
      position: 'fixed',
      top,
      right,
      zIndex: '100',
    };
  }

  openAddAlumniModal() {
    this.isEditingAlumni = false;
    this.editingAlumniId = '';
    const activeSession = this.auth.activeAcademicSession();
    const defaultGradSession = activeSession?.name || (this.academicSessions.length > 0 ? this.academicSessions[0].name : '2027–2028');

    this.newAlumni = {
      firstName: '',
      lastName: '',
      admissionNumber: '',
      gender: 'MALE',
      dateOfBirth: '',
      className: 'Class 12',
      sectionName: 'Section A',
      graduationSession: defaultGradSession,
      guardianName: '',
      guardianPhone: '',
      rollNumber: '1',
    };

    // Auto-fetch next admission number
    this.api.getNextAdmissionNumber().then((res) => {
      if (res?.admissionNumber && !this.newAlumni.admissionNumber) {
        this.newAlumni.admissionNumber = res.admissionNumber;
      }
    }).catch(() => {});

    this.alumniModalError = '';
    this.modalService.open('ALUMNI_MODAL');
    this.showAddAlumniModal = true;
  }

  openEditAlumniModal(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;
    this.isEditingAlumni = true;
    this.editingAlumniId = al.student_id;

    const parts = (al.full_name || `${al.first_name || ''} ${al.last_name || ''}`).trim().split(' ');
    const firstName = al.first_name || parts[0] || '';
    const lastName = al.last_name || parts.slice(1).join(' ') || '';

    let formattedDob = '';
    const dobRaw = al.date_of_birth || al.dateOfBirth;
    if (dobRaw) {
      try {
        formattedDob = String(dobRaw).includes('T') ? String(dobRaw).split('T')[0] : String(dobRaw);
      } catch {}
    }

    this.newAlumni = {
      firstName,
      lastName,
      admissionNumber: al.admission_number || '',
      gender: (al.gender || 'MALE').toUpperCase(),
      dateOfBirth: formattedDob,
      className: al.last_class_name || 'Class 12',
      sectionName: al.last_section_name || 'Section A',
      graduationSession: al.graduation_session || this.auth.activeSessionName() || '',
      guardianName: `${al.primary_contact?.first_name || ''} ${al.primary_contact?.last_name || ''}`.trim(),
      guardianPhone: al.primary_contact?.phone || '',
      rollNumber: String(al.last_roll_number || '1'),
    };
    this.alumniModalError = '';
    this.modalService.open('ALUMNI_MODAL');
    this.showAddAlumniModal = true;
  }

  closeAlumniModal() {
    this.modalService.close();
    this.showAddAlumniModal = false;
    this.isEditingAlumni = false;
    this.editingAlumniId = '';
  }

  saveAlumni() {
    if (!this.newAlumni.firstName.trim()) {
      this.alumniModalError = 'Student First Name is required.';
      return;
    }

    this.savingAlumni = true;
    this.alumniModalError = '';

    const matchedClass = this.classes.find(
      (c) => c.name.toLowerCase() === this.newAlumni.className.toLowerCase()
    ) || (this.classes.length > 0 ? this.classes[this.classes.length - 1] : null);

    const matchedSec = matchedClass?.sections?.find(
      (s) => s.name.toLowerCase() === this.newAlumni.sectionName.toLowerCase()
    ) || matchedClass?.sections?.[0];

    const matchedSession = this.academicSessions.find(
      (s) => s.name === this.newAlumni.graduationSession
    );

    const payload = {
      admissionNumber: this.newAlumni.admissionNumber,
      firstName: this.newAlumni.firstName,
      lastName: this.newAlumni.lastName,
      gender: this.newAlumni.gender,
      dateOfBirth: this.newAlumni.dateOfBirth,
      classId: matchedClass?.id,
      className: this.newAlumni.className,
      sectionId: matchedSec?.id,
      sectionName: this.newAlumni.sectionName,
      academicYearId: matchedSession?.id || this.auth.activeAcademicSession()?.id,
      graduationSession: this.newAlumni.graduationSession,
      guardianName: this.newAlumni.guardianName,
      guardianPhone: this.newAlumni.guardianPhone,
      rollNumber: this.newAlumni.rollNumber,
    };

    if (this.isEditingAlumni && this.editingAlumniId) {
      this.api.put(`academics/alumni/${this.editingAlumniId}`, payload).subscribe({
        next: () => {
          this.savingAlumni = false;
          this.closeAlumniModal();
          this.toast.success('Alumni record updated successfully.');
          this.loadAlumniList();
        },
        error: (err: any) => {
          this.savingAlumni = false;
          this.alumniModalError = this.formatErrorMessage(err, 'Failed to update alumni record.');
        },
      });
    } else {
      this.api.post('academics/alumni', payload).subscribe({
        next: () => {
          this.savingAlumni = false;
          this.closeAlumniModal();
          this.toast.success(`Alumni student "${this.newAlumni.firstName}" registered successfully.`);
          this.loadAlumniList();
        },
        error: (err: any) => {
          this.savingAlumni = false;
          this.alumniModalError = this.formatErrorMessage(err, 'Failed to register alumni student.');
        },
      });
    }
  }

  promptDeleteAlumni(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;
    this.alumniToDelete = al;
    this.modalService.open('DELETE_ALUMNI');
    this.showDeleteAlumniModal = true;
  }

  cancelDeleteAlumni() {
    this.modalService.close();
    this.showDeleteAlumniModal = false;
    this.alumniToDelete = null;
    this.isDeletingAlumni = false;
  }

  executeDeleteAlumni() {
    if (!this.alumniToDelete) return;
    this.isDeletingAlumni = true;
    const targetId = this.alumniToDelete.student_id;

    this.api.delete(`academics/alumni/${targetId}`).subscribe({
      next: () => {
        this.isDeletingAlumni = false;
        this.cancelDeleteAlumni();
        this.toast.success('Alumni record removed successfully.');
        this.loadAlumniList();
      },
      error: (err: any) => {
        this.isDeletingAlumni = false;
        this.toast.error(err.message || 'Failed to remove alumni record.');
      },
    });
  }

  printAlumniLeavingCertificate(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;

    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
    const studentPhoto = al.photo_url || al.photoUrl || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toast.error('Unable to open print window. Please check your browser popup blocker.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>School Leaving Certificate - ${al.full_name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .cert-container { border: 4px double #334155; padding: 40px; text-align: center; border-radius: 8px; max-width: 800px; margin: 0 auto; position: relative; }
          .logo-box { margin-bottom: 12px; }
          .logo-img { max-height: 70px; max-width: 120px; object-fit: contain; }
          .photo-box { position: absolute; top: 40px; right: 40px; width: 100px; height: 120px; border: 1px dashed #64748b; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; text-align: center; padding: 4px; background: #f8fafc; }
          .photo-img { width: 100%; height: 100%; object-fit: cover; }
          .school-header { font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #0f172a; margin-bottom: 4px; }
          .sub-header { font-size: 14px; color: #64748b; margin-bottom: 24px; }
          .cert-title { font-size: 22px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; letter-spacing: 1px; color: #1e293b; }
          .cert-body { text-align: justify; font-size: 16px; margin-bottom: 40px; line-height: 2; }
          .highlight { font-weight: bold; text-decoration: underline; }
          .signature-row { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 20px; font-size: 14px; }
          .sig-line { border-top: 1px solid #64748b; width: 180px; padding-top: 6px; }
          @media print { @page { margin: 20mm; } }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="photo-box">
            ${studentPhoto ? `<img src="${studentPhoto}" class="photo-img" alt="Student Photo">` : 'Affix Passport Size Photo'}
          </div>
          <div class="logo-box">
            ${schoolLogo ? `<img src="${schoolLogo}" class="logo-img" alt="School Logo">` : ''}
          </div>
          <div class="school-header">${schoolName}</div>
          <div class="sub-header">Institutional Alumni & Graduate Record</div>
          <div class="cert-title">SCHOOL LEAVING / GRADUATION CERTIFICATE</div>
          <div class="cert-body">
            This is to certify that <span class="highlight">${al.full_name}</span>, bearing Admission Number <span class="highlight">${al.admission_number}</span>, has successfully completed their studies at this institution in <span class="highlight">${al.last_class_name || 'Class 12'} (${al.last_section_name || 'Section A'})</span> during the Academic Session <span class="highlight">${al.graduation_session || 'Graduated'}</span>.
            <br><br>
            According to institutional records, their date of birth is <span class="highlight">${al.date_of_birth || al.dateOfBirth || 'Recorded'}</span> and primary guardian on record is <span class="highlight">${al.primary_contact?.first_name || 'Guardian'} ${al.primary_contact?.last_name || ''}</span>. Their conduct and character during their tenure have been exemplary.
          </div>
          <div class="signature-row">
            <div>
              <div class="sig-line">Date of Issue: ${new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <div class="sig-line">Class Teacher / Registrar</div>
            </div>
            <div>
              <div class="sig-line">Principal / Head of Institution</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  // --- ALUMNI JOURNEY & LIFECYCLE LOGS ---
  openAlumniJourneyModal(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;
    this.selectedAlumniForJourney = al;
    this.showAlumniJourneyModal = true;
    this.loadingAlumniJourney = true;
    this.alumniJourneyLogs = [];
    this.alumniJourneySummary = null;

    this.api.get<any>(`academics/students/${al.student_id}/lifecycle-logs`).subscribe({
      next: (res) => {
        this.loadingAlumniJourney = false;
        if (res) {
          this.alumniJourneyLogs = res.logs || [];
          this.alumniJourneySummary = res.summary || null;
        }
      },
      error: (err: any) => {
        this.loadingAlumniJourney = false;
        this.toast.error(err.message || 'Failed to load student lifecycle logs.');
      }
    });
  }

  closeAlumniJourneyModal() {
    this.showAlumniJourneyModal = false;
    this.selectedAlumniForJourney = null;
    this.alumniJourneyLogs = [];
    this.alumniJourneySummary = null;
  }

  printStudentJourneyTranscript() {
    if (!this.selectedAlumniForJourney) return;
    const al = this.selectedAlumniForJourney;
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
    const studentPhoto = al.photo_url || al.photoUrl || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toast.error('Unable to open print window. Please allow popups.');
      return;
    }

    const rows = this.alumniJourneyLogs.map((l, i) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: center;">${i + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${l.academic_session || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><strong>${l.title}</strong><br><span style="color: #64748b; font-size: 11px;">${l.description}</span></td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${l.class_name ? l.class_name + ' (' + (l.section_name || 'A') + ')' : '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${l.timestamp ? new Date(l.timestamp).toLocaleDateString() : 'Recorded'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Lifecycle Transcript - ${al.full_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-box { margin-bottom: 8px; }
          .logo-img { max-height: 55px; max-width: 100px; object-fit: contain; }
          .school-title { font-size: 22px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 4px; }
          .doc-title { font-size: 14px; font-weight: bold; letter-spacing: 1px; color: #475569; }
          .student-card-container { display: flex; gap: 15px; margin-bottom: 20px; }
          .student-card { flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; }
          .student-photo-box { width: 80px; height: 95px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; text-align: center; }
          .student-photo-box img { width: 100%; height: 100%; object-fit: cover; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #0f172a; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; padding: 0 10px; }
          .sig-box { border-top: 1px solid #64748b; width: 180px; text-align: center; padding-top: 6px; }
          @media print { @page { margin: 15mm; size: A4 portrait; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${schoolLogo ? `<div class="logo-box"><img src="${schoolLogo}" class="logo-img" alt="School Logo"></div>` : ''}
          <div class="school-title">${schoolName}</div>
          <div class="doc-title">OFFICIAL STUDENT LIFECYCLE & ACADEMIC TRANSCRIPT</div>
        </div>
        <div class="student-card-container">
          <div class="student-card">
            <div><strong>Student Name:</strong> ${al.full_name}</div>
            <div><strong>Permanent Adm No:</strong> ${al.admission_number}</div>
            <div><strong>Alumni ID:</strong> ${al.alumni_number || 'ALU-REG'}</div>
            <div><strong>First Admission:</strong> ${al.admission_date ? new Date(al.admission_date).toLocaleDateString() : 'Recorded'} (${al.admission_class_name || 'Class'})</div>
            <div><strong>Graduation Session:</strong> ${al.graduation_session || 'Completed'}</div>
            <div><strong>TC Serial No:</strong> ${al.tc_number || 'TC-ISSUED'}</div>
          </div>
          <div class="student-photo-box">
            ${studentPhoto ? `<img src="${studentPhoto}" alt="Student Photo">` : 'Photo'}
          </div>
        </div>
        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Chronological Milestones & Lifecycle History</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="width: 90px;">Session</th>
              <th>Milestone / Event Description</th>
              <th style="width: 130px;">Class & Section</th>
              <th style="width: 90px;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          <div class="sig-box">Date: ${new Date().toLocaleDateString()}<br>Institutional Seal</div>
          <div class="sig-box">Registrar / Academics In-Charge</div>
          <div class="sig-box">Principal / Head of Institution</div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  }

  // --- TRANSFER CERTIFICATE (TC) ---
  updateTcCertificateBody() {
    if (!this.selectedAlumniForTc) return;
    const al = this.selectedAlumniForTc;
    this.tcForm.certificateBody = `This is to certify that ${al.full_name}, bearing permanent Admission ID ${al.admission_number}, studied in this school up to ${al.last_class_name || 'Class 12'} in session ${al.graduation_session || new Date().getFullYear()}. All institutional dues have been paid up to ${this.tcForm.duesPaidMonth}. General conduct during their tenure was ${this.tcForm.conduct}.`;
  }

  openTcModal(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;
    this.selectedAlumniForTc = al;
    const year = al.graduation_session ? al.graduation_session.split('-')[0].trim() : new Date().getFullYear().toString();
    const cleanAdm = (al.admission_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
    this.tcForm = {
      tcNumber: al.tc_number || `TC/${year}/${cleanAdm}`,
      bookNumber: '01',
      issueDate: al.tc_issue_date ? new Date(al.tc_issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      promotionStatus: 'Qualified for promotion to next standard',
      duesPaidMonth: 'March (All Dues Cleared)',
      conduct: al.conduct || 'Exemplary',
      reasonForLeaving: al.leaving_reason || 'Course completed / Graduated',
      workingDaysTotal: '220',
      workingDaysPresent: '214',
      remarks: 'Student bears good moral character.',
      certificateBody: '',
    };
    this.updateTcCertificateBody();
    this.showTcModal = true;
  }

  closeTcModal() {
    this.showTcModal = false;
    this.selectedAlumniForTc = null;
  }

  printTransferCertificate() {
    if (!this.selectedAlumniForTc) return;
    const al = this.selectedAlumniForTc;
    this.savingTc = true;

    const payload = {
      student_id: al.student_id,
      certificate_type: 'TRANSFER_CERTIFICATE',
      certificate_number: this.tcForm.tcNumber,
      issue_date: this.tcForm.issueDate || new Date().toISOString(),
      conduct: this.tcForm.conduct,
      leaving_reason: this.tcForm.reasonForLeaving,
      remarks: this.tcForm.certificateBody || this.tcForm.remarks,
    };

    this.api.post('academics/alumni/certificates', payload).subscribe({
      next: () => {
        this.savingTc = false;
        al.tc_number = this.tcForm.tcNumber;
        al.tc_issue_date = this.tcForm.issueDate;
        this.toast.success('Transfer Certificate record updated.');
        this.renderTransferCertPrintWindow(al);
        this.closeTcModal();
      },
      error: (err: any) => {
        this.savingTc = false;
        this.toast.error(err.message || 'Failed to save certificate record.');
        this.renderTransferCertPrintWindow(al);
        this.closeTcModal();
      }
    });
  }

  private renderTransferCertPrintWindow(al: AlumniStudent) {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
    const studentPhoto = al.photo_url || al.photoUrl || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transfer Certificate - ${al.full_name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #0f172a; line-height: 1.6; }
          .cert-border { border: 3px double #0f172a; padding: 35px; max-width: 800px; margin: 0 auto; position: relative; }
          .logo-box { margin-bottom: 8px; }
          .logo-img { max-height: 60px; max-width: 100px; object-fit: contain; }
          .photo-box { position: absolute; top: 35px; right: 35px; width: 95px; height: 115px; border: 1px dashed #64748b; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; text-align: center; padding: 4px; background: #f8fafc; }
          .photo-img { width: 100%; height: 100%; object-fit: cover; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .school-name { font-size: 26px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          .school-sub { font-size: 12px; color: #475569; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
          .doc-title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin: 15px 0 20px 0; letter-spacing: 1.5px; }
          .meta-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 15px; }
          .cert-statement { font-size: 13.5px; line-height: 1.8; text-align: justify; margin-bottom: 20px; padding: 12px 15px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; }
          .cert-grid { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .cert-grid td { padding: 8px 6px; font-size: 14px; vertical-align: top; border-bottom: 1px dotted #cbd5e1; }
          .cert-grid td.q-no { width: 35px; font-weight: bold; color: #475569; }
          .cert-grid td.q-label { width: 320px; font-weight: 600; }
          .cert-grid td.q-val { font-weight: bold; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 50px; font-size: 13px; font-weight: bold; }
          .sig-box { border-top: 1px solid #0f172a; width: 190px; text-align: center; padding-top: 6px; }
          @media print { @page { margin: 15mm; size: A4 portrait; } }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="photo-box">
            ${studentPhoto ? `<img src="${studentPhoto}" class="photo-img" alt="Student Photo">` : 'Affix Photo'}
          </div>
          <div class="header">
            ${schoolLogo ? `<div class="logo-box"><img src="${schoolLogo}" class="logo-img" alt="School Logo"></div>` : ''}
            <div class="school-name">${schoolName}</div>
            <div class="school-sub">Recognized & Affiliated Educational Institution</div>
          </div>
          <div class="doc-title">TRANSFER / SCHOOL LEAVING CERTIFICATE</div>
          <div class="meta-row">
            <div>TC No: <span style="font-family: monospace;">${this.tcForm.tcNumber}</span></div>
            <div>Book No: <span style="font-family: monospace;">${this.tcForm.bookNumber}</span></div>
            <div>Admission No: <span style="font-family: monospace;">${al.admission_number}</span></div>
          </div>
          <div class="cert-statement">
            ${this.tcForm.certificateBody ? this.tcForm.certificateBody.replace(/\n/g, '<br>') : `This is to certify that <strong>${al.full_name}</strong>, bearing permanent Admission ID <strong>${al.admission_number}</strong>, studied in this school up to <strong>${al.last_class_name || 'Class 12'}</strong> in session <strong>${al.graduation_session || ''}</strong>. All institutional dues have been paid up to <strong>${this.tcForm.duesPaidMonth}</strong>. General conduct during their tenure was <strong>${this.tcForm.conduct}</strong>.`}
          </div>
          <table class="cert-grid">
            <tr>
              <td class="q-no">1.</td>
              <td class="q-label">Name of Student:</td>
              <td class="q-val">${al.full_name}</td>
            </tr>
            <tr>
              <td class="q-no">2.</td>
              <td class="q-label">Mother's / Father's / Guardian's Name:</td>
              <td class="q-val">${al.primary_contact?.first_name || 'Guardian'} ${al.primary_contact?.last_name || ''}</td>
            </tr>
            <tr>
              <td class="q-no">3.</td>
              <td class="q-label">Nationality:</td>
              <td class="q-val">Indian</td>
            </tr>
            <tr>
              <td class="q-no">4.</td>
              <td class="q-label">Date of First Admission to the School:</td>
              <td class="q-val">${al.admission_date ? new Date(al.admission_date).toLocaleDateString() : 'Recorded'} (Class: ${al.admission_class_name || 'N/A'})</td>
            </tr>
            <tr>
              <td class="q-no">5.</td>
              <td class="q-label">Date of Birth (according to Admission Register):</td>
              <td class="q-val">${al.date_of_birth || al.dateOfBirth || 'Recorded in School Register'}</td>
            </tr>
            <tr>
              <td class="q-no">6.</td>
              <td class="q-label">Class in which the pupil last studied:</td>
              <td class="q-val">${al.last_class_name || 'Class 12'} (${al.last_section_name || 'Section A'})</td>
            </tr>
            <tr>
              <td class="q-no">7.</td>
              <td class="q-label">School / Board Annual Examination last taken:</td>
              <td class="q-val">${this.tcForm.promotionStatus}</td>
            </tr>
            <tr>
              <td class="q-no">8.</td>
              <td class="q-label">Month up to which the school dues paid:</td>
              <td class="q-val">${this.tcForm.duesPaidMonth}</td>
            </tr>
            <tr>
              <td class="q-no">9.</td>
              <td class="q-label">Total No. of Working Days / Present:</td>
              <td class="q-val">${this.tcForm.workingDaysPresent} / ${this.tcForm.workingDaysTotal} Days</td>
            </tr>
            <tr>
              <td class="q-no">10.</td>
              <td class="q-label">General Conduct:</td>
              <td class="q-val">${this.tcForm.conduct}</td>
            </tr>
            <tr>
              <td class="q-no">11.</td>
              <td class="q-label">Reason for leaving the school:</td>
              <td class="q-val">${this.tcForm.reasonForLeaving}</td>
            </tr>
            <tr>
              <td class="q-no">12.</td>
              <td class="q-label">Any other remarks:</td>
              <td class="q-val">${this.tcForm.remarks}</td>
            </tr>
          </table>
          <div class="sig-row">
            <div class="sig-box">Prepared & Checked By</div>
            <div class="sig-box">Class Teacher / In-Charge</div>
            <div class="sig-box">Principal (with School Seal)</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  }

  // --- CHARACTER CERTIFICATE ---
  updateCharacterCertificateBody() {
    if (!this.selectedAlumniForCharacterCert) return;
    const al = this.selectedAlumniForCharacterCert;
    const gName = `${al.primary_contact?.first_name || 'Guardian'} ${al.primary_contact?.last_name || ''}`.trim();
    this.characterCertForm.certificateBody = `This is to certify that ${al.full_name}, child of ${gName || 'Guardian'}, bearing Permanent Admission ID ${al.admission_number}, was a bonafide student of this institution in ${al.last_class_name || 'Class 12'} (${al.last_section_name || 'Section A'}) during the Academic Session ${al.graduation_session || 'Graduated'}.\n\nDuring their period of study at this school, their conduct, character, and moral bearing have been ${this.characterCertForm.conduct}. ${this.characterCertForm.coCurricularRemarks ? this.characterCertForm.coCurricularRemarks + ' ' : ''}\n\nTo the best of our knowledge and belief, they bear good moral character and have not been subject to any disciplinary action. ${this.characterCertForm.remarks}`;
  }

  openCharacterCertModal(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;
    this.selectedAlumniForCharacterCert = al;
    const year = al.graduation_session ? al.graduation_session.split('-')[0].trim() : new Date().getFullYear().toString();
    const cleanAdm = (al.admission_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
    this.characterCertForm = {
      certNumber: al.character_cert_number || `CC/${year}/${cleanAdm}`,
      issueDate: new Date().toISOString().split('T')[0],
      conduct: al.conduct || 'Exemplary & Commendable',
      coCurricularRemarks: 'Actively participated in school academic, cultural, and sports activities.',
      remarks: 'We wish them excellence and bright success in all future pursuits.',
      certificateBody: '',
    };
    this.updateCharacterCertificateBody();
    this.showCharacterCertModal = true;
  }

  closeCharacterCertModal() {
    this.showCharacterCertModal = false;
    this.selectedAlumniForCharacterCert = null;
  }

  printCharacterCertificate() {
    if (!this.selectedAlumniForCharacterCert) return;
    const al = this.selectedAlumniForCharacterCert;
    this.savingCharacterCert = true;

    const payload = {
      student_id: al.student_id,
      certificate_type: 'CHARACTER_CERTIFICATE',
      certificate_number: this.characterCertForm.certNumber,
      issue_date: this.characterCertForm.issueDate || new Date().toISOString(),
      conduct: this.characterCertForm.conduct,
      remarks: this.characterCertForm.certificateBody || this.characterCertForm.remarks,
    };

    this.api.post('academics/alumni/certificates', payload).subscribe({
      next: () => {
        this.savingCharacterCert = false;
        al.character_cert_number = this.characterCertForm.certNumber;
        this.toast.success('Character Certificate issued.');
        this.renderCharacterCertPrintWindow(al);
        this.closeCharacterCertModal();
      },
      error: (err: any) => {
        this.savingCharacterCert = false;
        this.toast.error(err.message || 'Failed to save certificate record.');
        this.renderCharacterCertPrintWindow(al);
        this.closeCharacterCertModal();
      }
    });
  }

  private renderCharacterCertPrintWindow(al: AlumniStudent) {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
    const studentPhoto = al.photo_url || al.photoUrl || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Character Certificate - ${al.full_name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #0f172a; line-height: 1.8; }
          .cert-border { border: 4px double #0f172a; padding: 45px; max-width: 800px; margin: 0 auto; text-align: center; position: relative; }
          .logo-box { margin-bottom: 10px; }
          .logo-img { max-height: 65px; max-width: 110px; object-fit: contain; }
          .photo-box { position: absolute; top: 45px; right: 45px; width: 95px; height: 115px; border: 1px dashed #64748b; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; text-align: center; padding: 4px; background: #f8fafc; }
          .photo-img { width: 100%; height: 100%; object-fit: cover; }
          .school-name { font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
          .school-sub { font-size: 13px; color: #475569; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
          .doc-title { font-size: 22px; font-weight: bold; text-decoration: underline; margin: 30px 0 25px 0; letter-spacing: 2px; }
          .cert-meta { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 30px; }
          .cert-body { text-align: justify; font-size: 16px; line-height: 2.2; margin-bottom: 50px; }
          .highlight { font-weight: bold; text-decoration: underline; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px; font-weight: bold; padding: 0 20px; }
          .sig-box { border-top: 1px solid #0f172a; width: 190px; text-align: center; padding-top: 6px; }
          @media print { @page { margin: 20mm; size: A4 portrait; } }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="photo-box">
            ${studentPhoto ? `<img src="${studentPhoto}" class="photo-img" alt="Student Photo">` : 'Affix Photo'}
          </div>
          <div class="logo-box">
            ${schoolLogo ? `<img src="${schoolLogo}" class="logo-img" alt="School Logo">` : ''}
          </div>
          <div class="school-name">${schoolName}</div>
          <div class="school-sub">Office of the Registrar & Academic Council</div>
          <div class="doc-title">CHARACTER & CONDUCT CERTIFICATE</div>
          <div class="cert-meta">
            <div>Certificate No: <span style="font-family: monospace;">${this.characterCertForm.certNumber}</span></div>
            <div>Date of Issue: ${this.characterCertForm.issueDate ? new Date(this.characterCertForm.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
          </div>
          <div class="cert-body">
            ${this.characterCertForm.certificateBody ? this.characterCertForm.certificateBody.replace(/\n/g, '<br>') : `This is to certify that <span class="highlight">${al.full_name}</span>, child of <span class="highlight">${al.primary_contact?.first_name || 'Guardian'} ${al.primary_contact?.last_name || ''}</span>, bearing Permanent Admission ID <span class="highlight">${al.admission_number}</span>, was a bonafide student of this institution in <span class="highlight">${al.last_class_name || 'Class 12'} (${al.last_section_name || 'Section A'})</span> during the Academic Session <span class="highlight">${al.graduation_session || 'Graduated'}</span>.<br><br>During their period of study at this school, their conduct, character, and moral bearing have been <span class="highlight">${this.characterCertForm.conduct}</span>. ${this.characterCertForm.coCurricularRemarks}<br><br>To the best of our knowledge and belief, they bear good moral character and have not been subject to any disciplinary action. ${this.characterCertForm.remarks}`}
          </div>
          <div class="sig-row">
            <div class="sig-box">Class Teacher</div>
            <div class="sig-box">Registrar / Seal</div>
            <div class="sig-box">Principal / Head of Institution</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  }

  // --- ALUMNI CERTIFICATE ---
  updateAlumniCertificateBody() {
    if (!this.selectedAlumniForAlumniCert) return;
    const al = this.selectedAlumniForAlumniCert;
    this.alumniCertForm.certificateBody = `This is to certify that ${al.full_name} (Permanent Admission ID: ${al.admission_number}) has completed their course of study in ${al.last_class_name || 'Class 12'} (${al.last_section_name || 'Section A'}) and is officially registered as a lifetime Alumni Member of this institution under Registration ID ${this.alumniCertForm.alumniNumber}. ${this.alumniCertForm.honorsRemarks}`;
  }

  openAlumniCertModal(al: AlumniStudent, event?: Event) {
    if (event) event.stopPropagation();
    this.activeAlumniMenuId = null;
    this.selectedAlumniForAlumniCert = al;
    const year = al.graduation_session ? al.graduation_session.split('-')[0].trim() : new Date().getFullYear().toString();
    const cleanAdm = (al.admission_number || '0000').replace(/[^a-zA-Z0-9]/g, '');
    const alumniNo = al.alumni_number || `ALU-${year}-${cleanAdm}`;
    this.alumniCertForm = {
      certNumber: al.alumni_cert_number || `AC/${year}/${cleanAdm}`,
      alumniNumber: alumniNo,
      issueDate: new Date().toISOString().split('T')[0],
      honorsRemarks: 'Recognized for successful academic completion and awarded lifelong institutional alumni status.',
      certificateBody: '',
    };
    this.updateAlumniCertificateBody();
    this.showAlumniCertModal = true;
  }

  closeAlumniCertModal() {
    this.showAlumniCertModal = false;
    this.selectedAlumniForAlumniCert = null;
  }

  printAlumniCertificate() {
    if (!this.selectedAlumniForAlumniCert) return;
    const al = this.selectedAlumniForAlumniCert;
    this.savingAlumniCert = true;

    const payload = {
      student_id: al.student_id,
      certificate_type: 'ALUMNI_CERTIFICATE',
      certificate_number: this.alumniCertForm.certNumber,
      alumni_number: this.alumniCertForm.alumniNumber,
      issue_date: this.alumniCertForm.issueDate || new Date().toISOString(),
      remarks: this.alumniCertForm.certificateBody || this.alumniCertForm.honorsRemarks,
    };

    this.api.post('academics/alumni/certificates', payload).subscribe({
      next: () => {
        this.savingAlumniCert = false;
        al.alumni_number = this.alumniCertForm.alumniNumber;
        al.alumni_cert_number = this.alumniCertForm.certNumber;
        this.toast.success('Alumni Certificate generated.');
        this.renderAlumniCertPrintWindow(al);
        this.closeAlumniCertModal();
      },
      error: (err: any) => {
        this.savingAlumniCert = false;
        this.toast.error(err.message || 'Failed to save certificate record.');
        this.renderAlumniCertPrintWindow(al);
        this.closeAlumniCertModal();
      }
    });
  }

  private renderAlumniCertPrintWindow(al: AlumniStudent) {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
    const studentPhoto = al.photo_url || al.photoUrl || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Alumni Certificate - ${al.full_name}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; color: #0f172a; line-height: 1.8; }
          .cert-border { border: 5px double #0f172a; padding: 45px; max-width: 820px; margin: 0 auto; text-align: center; background: #fafafa; position: relative; }
          .logo-box { margin-bottom: 10px; }
          .logo-img { max-height: 65px; max-width: 110px; object-fit: contain; }
          .photo-box { position: absolute; top: 45px; right: 45px; width: 95px; height: 115px; border: 1px dashed #64748b; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; text-align: center; padding: 4px; background: #f8fafc; }
          .photo-img { width: 100%; height: 100%; object-fit: cover; }
          .school-name { font-size: 30px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; color: #0f172a; }
          .school-sub { font-size: 13px; color: #475569; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
          .doc-title { font-size: 24px; font-weight: bold; margin: 30px 0 15px 0; letter-spacing: 3px; color: #0f172a; text-transform: uppercase; }
          .alumni-badge { display: inline-block; background: #0f172a; color: #ffffff; padding: 6px 18px; font-family: monospace; font-size: 14px; font-weight: bold; border-radius: 4px; margin-bottom: 25px; letter-spacing: 1px; }
          .cert-body { text-align: justify; font-size: 16px; line-height: 2.2; margin-bottom: 45px; }
          .highlight { font-weight: bold; text-decoration: underline; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 55px; font-size: 13px; font-weight: bold; padding: 0 20px; }
          .sig-box { border-top: 1px solid #0f172a; width: 200px; text-align: center; padding-top: 6px; }
          @media print { @page { margin: 20mm; size: A4 landscape; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="cert-border">
          <div class="photo-box">
            ${studentPhoto ? `<img src="${studentPhoto}" class="photo-img" alt="Student Photo">` : 'Affix Photo'}
          </div>
          <div class="logo-box">
            ${schoolLogo ? `<img src="${schoolLogo}" class="logo-img" alt="School Logo">` : ''}
          </div>
          <div class="school-name">${schoolName}</div>
          <div class="school-sub">Alumni Association & Institutional Registry</div>
          <div class="doc-title">Certificate of Alumni Recognition</div>
          <div class="alumni-badge">PERMANENT ALUMNI ID: ${this.alumniCertForm.alumniNumber}</div>
          <div class="cert-body">
            ${this.alumniCertForm.certificateBody ? this.alumniCertForm.certificateBody.replace(/\n/g, '<br>') : `This certificate is proudly conferred upon <span class="highlight">${al.full_name}</span> (Permanent School Admission ID: <span class="highlight">${al.admission_number}</span>) in formal recognition of successfully completing their course of education up to <span class="highlight">${al.last_class_name || 'Class 12'} (${al.last_section_name || 'Section A'})</span> in Academic Session <span class="highlight">${al.graduation_session || 'Graduated'}</span>.<br><br>Having maintained an honorable standing throughout their school career, they are hereby officially enrolled into the lifelong Alumni Guild of this institution under Registration ID <span class="highlight">${this.alumniCertForm.alumniNumber}</span> with all associated honours and privileges.<br><br>${this.alumniCertForm.honorsRemarks}`}
          </div>
          <div class="sig-row">
            <div class="sig-box">Date of Issue: ${this.alumniCertForm.issueDate ? new Date(this.alumniCertForm.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            <div class="sig-box">President / Alumni Relations</div>
            <div class="sig-box">Principal / Head of Institution</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  }

  loadClassesAndSubjects() {
    this.loadingClasses = true;
    const activeSession = this.auth.activeAcademicSession();
    const params = activeSession ? { academicYearId: activeSession.id } : undefined;

    this.api.get<ClassItem[]>('academics/classes', params).subscribe({
      next: (res) => {
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
        this.loadingClasses = false;
      },
      error: () => {
        this.classes = [];
        this.loadingClasses = false;
      },
    });

    this.api.get<SubjectItem[]>('academics/subjects').subscribe({
      next: (res) => {
        this.subjects = res || [];
      },
      error: () => {
        this.subjects = [];
      },
    });
  }

  loadStaffList() {
    this.loadingStaff = true;
    this.api.get<StaffMember[]>('academics/staff').subscribe({
      next: (res) => {
        this.staffList = (res || []).filter((s) => {
          const r = (s.role || '').toUpperCase();
          return (
            s.email?.toLowerCase() !== 'admin@schoolscence.in' &&
            s.id !== '00000000-0000-0000-0000-000000000001' &&
            r !== 'SUPER_ADMIN' &&
            r !== 'GUARDIAN' &&
            r !== 'PARENT' &&
            r !== 'STUDENT'
          );
        });
        this.loadingStaff = false;
      },
      error: () => {
        this.staffList = [];
        this.loadingStaff = false;
      },
    });
  }

  selectClass(c: ClassItem) {
    this.selectedClass = c;
    if (c.sections && c.sections.length > 0) {
      const stillSection = this.selectedSection ? c.sections.find((s) => s.id === this.selectedSection?.id) : null;
      this.selectSection(stillSection || c.sections[0]);
    } else {
      this.selectedSection = null;
      this.students = [];
    }
  }

  selectSection(sec: SectionItem) {
    this.selectedSection = sec;
    this.loadingStudents = true;
    const activeSession = this.auth.activeAcademicSession();
    const params = activeSession ? { academicYearId: activeSession.id } : undefined;
    this.api.get<StudentItem[]>(`academics/sections/${sec.id}/students`, params).subscribe({
      next: (res) => {
        this.students = res || [];
        this.currentPage = 1;
        this.loadingStudents = false;
        const activeCount = this.students.filter(
          (st) => (st.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
        ).length;
        sec.enrolled_count = activeCount;
      },
      error: () => {
        this.students = [];
        this.loadingStudents = false;
      },
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
    // Determine the latest existing session chronologically to prefill next session name and source
    const sorted = [...this.academicSessions].sort((a, b) => {
      const aStart = a.start_date || a.created_at || '';
      const bStart = b.start_date || b.created_at || '';
      return bStart.localeCompare(aStart);
    });

    const latest = sorted[0];
    let nextName = '2028–2029';
    let nextStart = '2028-04-01';
    let nextEnd = '2029-03-31';

    if (latest?.name) {
      const parts = latest.name.split(/[–\-]/);
      const startYear = parseInt(parts[0], 10);
      const endYear = parseInt(parts[1], 10);
      if (!isNaN(startYear) && !isNaN(endYear)) {
        nextName = `${startYear + 1}–${endYear + 1}`;
        nextStart = `${startYear + 1}-04-01`;
        nextEnd = `${endYear + 1}-03-31`;
      }
    }

    const defaultFromSessionId = latest?.id || this.auth.activeAcademicSession()?.id || this.academicSessions.find((s) => s.is_current)?.id || '';

    this.newSession = {
      name: nextName,
      startDate: nextStart,
      endDate: nextEnd,
      isCurrent: true,
      promoteStudents: true,
      fromSessionId: defaultFromSessionId,
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

    const fromSessionId = this.newSession.fromSessionId || this.auth.activeAcademicSession()?.id || this.academicSessions.find((s) => s.is_current)?.id;

    this.api.post<any>('academics/sessions', {
      name: this.newSession.name,
      startDate: this.newSession.startDate,
      endDate: this.newSession.endDate,
      isCurrent: this.newSession.isCurrent,
    }).subscribe({
      next: (created: any) => {
        const newSessionId = created.session_id || created.id;
        const newSessionObj: AcademicSession = {
          id: newSessionId,
          school_id: created.school_id,
          name: created.name || this.newSession.name,
          start_date: created.start_date || this.newSession.startDate,
          end_date: created.end_date || this.newSession.endDate,
          is_current: this.newSession.isCurrent,
          status: 'ACTIVE',
        };

        if (this.newSession.isCurrent) {
          this.auth.setActiveSession(newSessionObj);
        }

        // If promotion requested and we have a source session to promote from
        if (this.newSession.promoteStudents && fromSessionId && newSessionId) {
          this.api.post<any>('academics/sessions/rollover', {
            fromSessionId: fromSessionId,
            toSessionId: newSessionId,
          }).subscribe({
            next: (rolloverRes: any) => {
              this.savingSession = false;
              this.closeSessionModal();
              this.toast.success(
                `Session ${this.newSession.name} created! Promoted ${rolloverRes.promoted_count || 0} students & graduated ${rolloverRes.graduated_alumni_count || 0} to Alumni Directory.`
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

  openResetConfirmModal() {
    this.showResetConfirmModal = true;
  }

  cancelResetConfirm() {
    this.showResetConfirmModal = false;
    this.isResettingDatabase = false;
  }

  executeResetDatabase() {
    this.isResettingDatabase = true;
    this.api.post<any>('academics/reset-all', {}).subscribe({
      next: (res: any) => {
        this.isResettingDatabase = false;
        this.showResetConfirmModal = false;
        this.closeSessionModal();
        if (res.session) {
          this.auth.setActiveSession(res.session);
        }
        this.toast.success('Database reset completed! All students and test sessions cleared. Clean 2026–2027 session is active.');
        this.loadAcademicSessions();
        this.loadClassesAndSubjects();
        this.loadAlumniList();
      },
      error: (err: any) => {
        this.isResettingDatabase = false;
        this.toast.error(err.message || 'Failed to reset database.');
      },
    });
  }

  // --- Add Subject Handlers ---
  openAddSubjectToClass(c: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeClassMenuId = null;
    this.subjectTargetClass = c;
    this.selectedSubjectClassId = c.id;
    this.newSubject = {
      name: '',
      code: '',
      subjectType: 'ACADEMIC',
      description: '',
      isAllSections: true,
      selectedSectionIds: (c.sections || []).map((s) => s.id),
    };
    this.subjectModalError = '';
    this.modalService.open('ADD_SUBJECT');
    this.showAddSubjectModal = true;
  }

  openAddSubjectToSection(sec: SectionItem, c: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeSectionMenuId = null;
    this.subjectTargetClass = c;
    this.selectedSubjectClassId = c.id;
    this.newSubject = {
      name: '',
      code: '',
      subjectType: 'ACADEMIC',
      description: '',
      isAllSections: false,
      selectedSectionIds: [sec.id],
    };
    this.subjectModalError = '';
    this.modalService.open('ADD_SUBJECT');
    this.showAddSubjectModal = true;
  }

  openAddSubjectModal() {
    this.subjectTargetClass = this.selectedClass || (this.classes.length > 0 ? this.classes[0] : null);
    this.selectedSubjectClassId = this.subjectTargetClass?.id || '';
    this.newSubject = {
      name: '',
      code: '',
      subjectType: 'ACADEMIC',
      description: '',
      isAllSections: true,
      selectedSectionIds: this.subjectTargetClass ? (this.subjectTargetClass.sections || []).map((s) => s.id) : [],
    };
    this.subjectModalError = '';
    this.modalService.open('ADD_SUBJECT');
    this.showAddSubjectModal = true;
  }

  closeAddSubjectModal() {
    this.modalService.close();
    this.showAddSubjectModal = false;
    this.subjectTargetClass = null;
    this.selectedSubjectClassId = '';
    this.subjectModalError = '';
  }

  onSubjectClassChange(classId: string) {
    const found = this.classes.find((c) => c.id === classId) || null;
    this.subjectTargetClass = found;
    if (found) {
      if (this.newSubject.isAllSections) {
        this.newSubject.selectedSectionIds = (found.sections || []).map((s) => s.id);
      } else {
        this.newSubject.selectedSectionIds = (found.sections || []).slice(0, 1).map((s) => s.id);
      }
      if (this.newSubject.name.trim()) {
        this.newSubject.code = this.generateSubjectCode(this.newSubject.name, found);
      }
    } else {
      this.newSubject.selectedSectionIds = [];
      if (this.newSubject.name.trim()) {
        this.newSubject.code = this.generateSubjectCode(this.newSubject.name, null);
      }
    }
  }

  generateSubjectCode(name: string, targetClass?: ClassItem | null): string {
    if (!name || !name.trim()) return '';
    const clean = name.trim();

    let prefix = '';
    const words = clean.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 1) {
      const w = words[0].toUpperCase();
      if (w.startsWith('BIO')) prefix = 'BIO';
      else if (w.startsWith('MATH')) prefix = 'MATH';
      else if (w.startsWith('PHY')) prefix = 'PHY';
      else if (w.startsWith('CHEM')) prefix = 'CHEM';
      else if (w.startsWith('ENG')) prefix = 'ENG';
      else if (w.startsWith('HIN')) prefix = 'HIN';
      else if (w.startsWith('SCI')) prefix = 'SCI';
      else if (w.startsWith('COMP') || w.startsWith('CS')) prefix = 'CS';
      else if (w.startsWith('HIST')) prefix = 'HIST';
      else if (w.startsWith('GEO')) prefix = 'GEO';
      else if (w.startsWith('ECON')) prefix = 'ECON';
      else if (w.startsWith('ART')) prefix = 'ART';
      else if (w.startsWith('MUS')) prefix = 'MUS';
      else if (w.startsWith('SAN')) prefix = 'SANS';
      else prefix = w.slice(0, 4);
    } else {
      if (clean.toLowerCase().includes('social')) prefix = 'SST';
      else if (clean.toLowerCase().includes('computer')) prefix = 'CS';
      else if (clean.toLowerCase().includes('physical')) prefix = 'PE';
      else if (clean.toLowerCase().includes('environmental') || clean.toLowerCase().includes('evs')) prefix = 'EVS';
      else if (clean.toLowerCase().includes('general knowledge') || clean.toLowerCase().includes('gk')) prefix = 'GK';
      else {
        prefix = words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
      }
    }

    let classSuffix = '';
    if (targetClass) {
      const cNorm = (targetClass.name || '').toLowerCase();
      const numMatch = cNorm.match(/\d+/);
      if (numMatch) {
        classSuffix = numMatch[0];
      } else if (cNorm.includes('pre-nur') || cNorm.includes('prenur')) {
        classSuffix = 'PNUR';
      } else if (cNorm.includes('nur')) {
        classSuffix = 'NUR';
      } else if (cNorm.includes('lkg')) {
        classSuffix = 'LKG';
      } else if (cNorm.includes('ukg')) {
        classSuffix = 'UKG';
      } else if (targetClass.code) {
        classSuffix = targetClass.code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
      }
    }

    const baseCode = classSuffix ? `${prefix}-${classSuffix}` : prefix;

    let finalCode = baseCode;
    let counter = 1;
    const existingCodes = new Set((this.subjects || []).map((s) => (s.code || '').toUpperCase()));
    while (existingCodes.has(finalCode.toUpperCase())) {
      finalCode = `${baseCode}-${counter}`;
      counter++;
    }
    return finalCode;
  }

  onSubjectNameChange() {
    if (!this.newSubject.name.trim()) return;
    this.newSubject.code = this.generateSubjectCode(this.newSubject.name, this.subjectTargetClass);
  }

  regenerateCode() {
    this.newSubject.code = this.generateSubjectCode(this.newSubject.name, this.subjectTargetClass);
  }

  applyQuickSubject(sug: string) {
    this.newSubject.name = sug;
    this.newSubject.code = this.generateSubjectCode(sug, this.subjectTargetClass);
    const lower = sug.toLowerCase();
    if (lower.includes('lab') || lower.includes('practical')) {
      this.newSubject.subjectType = 'LAB';
    } else if (lower.includes('english') || lower.includes('hindi') || lower.includes('sanskrit')) {
      this.newSubject.subjectType = 'LANGUAGE';
    } else if (lower.includes('art') || lower.includes('music') || lower.includes('craft')) {
      this.newSubject.subjectType = 'ACTIVITY';
    } else {
      this.newSubject.subjectType = 'ACADEMIC';
    }
  }

  selectAllSectionsForSubject() {
    this.newSubject.isAllSections = true;
    if (this.subjectTargetClass) {
      this.newSubject.selectedSectionIds = (this.subjectTargetClass.sections || []).map((s) => s.id);
    }
  }

  selectSpecificSectionsForSubject() {
    this.newSubject.isAllSections = false;
    if (this.newSubject.selectedSectionIds.length === 0 && this.subjectTargetClass?.sections?.length) {
      this.newSubject.selectedSectionIds = [this.subjectTargetClass.sections[0].id];
    }
  }

  toggleSubjectSection(secId: string) {
    const idx = this.newSubject.selectedSectionIds.indexOf(secId);
    if (idx >= 0) {
      this.newSubject.selectedSectionIds.splice(idx, 1);
    } else {
      this.newSubject.selectedSectionIds.push(secId);
    }
  }

  isSectionSelectedForSubject(secId: string): boolean {
    return this.newSubject.selectedSectionIds.includes(secId);
  }

  toggleSectionsCollapse(classId: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.expandedClassSections.has(classId)) {
      this.expandedClassSections.delete(classId);
    } else {
      this.expandedClassSections.add(classId);
    }
  }

  isSectionsExpanded(classId: string): boolean {
    return this.expandedClassSections.has(classId);
  }

  toggleSubjectsCollapse(classId: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.expandedClassSubjects.has(classId)) {
      this.expandedClassSubjects.delete(classId);
    } else {
      this.expandedClassSubjects.add(classId);
    }
  }

  isSubjectsExpanded(classId: string): boolean {
    return this.expandedClassSubjects.has(classId);
  }

  getClassSubjects(c: ClassItem): SubjectItem[] {
    const directSubs = c.subjects || [];
    if (directSubs.length > 0) return directSubs;
    return (this.subjects || []).filter(
      (s) =>
        s.class_id === c.id ||
        (s.section_ids && s.section_ids.some((sid) => (c.sections || []).some((cs) => cs.id === sid)))
    );
  }

  getSectionSubjects(sec: SectionItem): SubjectItem[] {
    const directSubs = sec.subjects || [];
    if (directSubs.length > 0) return directSubs;
    return (this.subjects || []).filter(
      (s) =>
        (s.section_ids && s.section_ids.includes(sec.id)) ||
        (s.class_id === sec.class_id && s.is_all_sections)
    );
  }

  saveSubject() {
    if (!this.newSubject.name.trim() || !this.newSubject.code.trim()) {
      this.subjectModalError = 'Please enter both Subject Name and Subject Code.';
      return;
    }

    if (this.subjectTargetClass && !this.newSubject.isAllSections && this.newSubject.selectedSectionIds.length === 0) {
      this.subjectModalError = 'Please select at least one section for this subject.';
      return;
    }

    // Check for duplicate subject in target class
    if (this.subjectTargetClass) {
      const existingInClass = this.getClassSubjects(this.subjectTargetClass);
      const nameNorm = this.newSubject.name.trim().toLowerCase();
      const codeNorm = this.newSubject.code.trim().toUpperCase();
      if (existingInClass.some((s) => s.name.toLowerCase() === nameNorm || s.code.toUpperCase() === codeNorm)) {
        this.subjectModalError = `A subject with name "${this.newSubject.name.trim()}" or code "${this.newSubject.code.trim()}" is already assigned to ${this.subjectTargetClass.name}.`;
        return;
      }
    }

    this.savingSubject = true;
    this.subjectModalError = '';

    const payload = {
      name: this.newSubject.name.trim(),
      code: this.newSubject.code.trim().toUpperCase(),
      subject_type: this.newSubject.subjectType,
      description: this.newSubject.description?.trim() || '',
      class_id: this.subjectTargetClass?.id || null,
      class_name: this.subjectTargetClass?.name || null,
      is_all_sections: this.newSubject.isAllSections,
      section_ids: this.newSubject.isAllSections
        ? (this.subjectTargetClass ? (this.subjectTargetClass.sections || []).map((s) => s.id) : [])
        : this.newSubject.selectedSectionIds,
    };

    this.api.post<SubjectItem>('academics/subjects', payload).subscribe({
      next: (created) => {
        this.savingSubject = false;
        this.closeAddSubjectModal();
        const secDesc = !this.newSubject.isAllSections
          ? ` (${this.newSubject.selectedSectionIds.length} specific sections)`
          : '';
        this.toast.success(
          `Subject "${created.name}" (${created.code}) successfully added to ${
            this.subjectTargetClass ? this.subjectTargetClass.name : 'curriculum'
          }${secDesc}!`
        );
        this.loadClassesAndSubjects();
      },
      error: (err) => {
        this.savingSubject = false;
        this.subjectModalError = this.formatErrorMessage(
          err,
          'Failed to create subject. Please check if code is already in use.'
        );
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
          this.loadClassesAndSubjects();
        },
        error: (err) => {
          this.toast.error(this.formatErrorMessage(err, 'Failed to delete subject.'));
        },
      });
    }
  }

  // --- Add / Edit Student ---
  autoGenerateAdmissionNumber() {
    this.api.get<{ admissionNumber: string; sequence: number }>('academics/students/next-admission-number').subscribe({
      next: (res) => {
        if (res?.admissionNumber) {
          this.newStudent.admissionNumber = res.admissionNumber;
        }
      },
      error: () => {
        if (!this.newStudent.admissionNumber) {
          this.newStudent.admissionNumber = this.generateUniqueAdmissionNumber();
        }
      },
    });
  }

  generateUniqueAdmissionNumber(): string {
    const user = this.auth.currentUser();
    const schoolName = user?.school?.name || (user as any)?.school_name || 'DEL';
    const cleanLetters = (schoolName || 'DEL').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let schoolPrefix = (cleanLetters.slice(0, 3) || 'DEL').padEnd(3, 'D');
    const yr = new Date().getFullYear();

    const existingAdmissionNumbers = new Set<string>();
    let maxSerial = 0;

    // 1. Scan total enrolled students across campus
    const totalCampusEnrolled = this.classes.reduce(
      (sum, c) => sum + (c.sections?.reduce((sSum: number, s: any) => sSum + (Number(s.enrolled_count) || 0), 0) || 0),
      0
    );
    if (totalCampusEnrolled > maxSerial) {
      maxSerial = totalCampusEnrolled;
    }

    // 2. Scan currently loaded students for admission numbers
    (this.students || []).forEach((st: any) => {
      if (st.admissionNumber) {
        const raw = String(st.admissionNumber).trim().toUpperCase();
        const normalized = raw.replace(/[\u2013\u2014\u2212]/g, '-').replace(/\s+/g, '');
        existingAdmissionNumbers.add(raw);
        existingAdmissionNumbers.add(normalized);

        const pfxMatch = normalized.match(/^ADM-([A-Z0-9]{2,6})-\d{4}-(\d+)$/i);
        if (pfxMatch) {
          if (pfxMatch[1]) schoolPrefix = pfxMatch[1].toUpperCase();
          if (pfxMatch[2]) {
            const num = parseInt(pfxMatch[2], 10);
            if (!isNaN(num) && num > maxSerial) maxSerial = num;
          }
        }
      }
    });

    let candidateSerial = Math.max(1, maxSerial + 1);
    let candidate = `ADM-${schoolPrefix}-${yr}-${String(candidateSerial).padStart(4, '0')}`;

    while (
      existingAdmissionNumbers.has(candidate.toUpperCase()) ||
      existingAdmissionNumbers.has(candidate.replace(/-/g, '–').toUpperCase())
    ) {
      candidateSerial++;
      candidate = `ADM-${schoolPrefix}-${yr}-${String(candidateSerial).padStart(4, '0')}`;
    }

    return candidate;
  }

  getStudentMenuPlacement(student: any): string {
    const sId = student.studentId || student.id;
    const idx = this.paginatedStudents.findIndex(s => (s.studentId || s.id) === sId);
    const total = this.paginatedStudents.length;
    // If it's near the bottom of the visible page, open upwards to prevent cutting off
    if ((total >= 3 && idx >= total - 2) || (total === 2 && idx === 1)) {
      return 'bottom-full mb-1.5 origin-bottom-right';
    }
    return 'top-full mt-1.5 origin-top-right';
  }

  toggleStudentMenu(studentId: string, event: Event) {
    event.stopPropagation();
    if (this.activeStudentMenuId === studentId) {
      this.activeStudentMenuId = null;
      return;
    }

    this.activeStudentMenuId = studentId;
    this.activeStaffMenuId = null;
    this.activeClassMenuId = null;
    this.activeSectionMenuId = null;
    this.activeAlumniMenuId = null;
  }

  openAddStudentModal() {
    this.isEditingStudent = false;
    this.editingStudentId = null;
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
      photoUrl: '',
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelationship: 'GUARDIAN',
      primaryGuardianType: 'FATHER',
      guardianEmail: '',
      confirmGuardianEmail: '',
      guardianPhotoUrl: '',
      relationship: 'FATHER',
    };
    this.studentModalError = '';
    this.hideLoginEmail = false;
    this.autoGenerateAdmissionNumber();
    this.modalService.open('ADD_STUDENT');
    this.showAddStudentModal = true;
  }

  // --- Input Validation and Sanitization Helpers ---
  sanitizeName(value: string): string {
    return (value || '').replace(/[^a-zA-Z\s.'-]/g, '');
  }

  sanitizeNumber(value: string): string {
    return (value || '').replace(/\D/g, '');
  }

  sanitizePhone(value: string): string {
    return (value || '').replace(/[^0-9+\-\s()]/g, '');
  }

  allowOnlyLetters(event: KeyboardEvent): boolean {
    const char = event.key;
    if (char.length > 1 || /^[a-zA-Z\s.'-]$/.test(char) || event.ctrlKey || event.metaKey || event.altKey) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  allowOnlyNumbers(event: KeyboardEvent): boolean {
    const char = event.key;
    if (char.length > 1 || /^[0-9]$/.test(char) || event.ctrlKey || event.metaKey || event.altKey) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  allowPhoneChars(event: KeyboardEvent): boolean {
    const char = event.key;
    if (char.length > 1 || /^[0-9+\-\s()]$/.test(char) || event.ctrlKey || event.metaKey || event.altKey) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  // --- Photo Upload Handlers for Students & Guardians ---
  async onStudentPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingStudentPhoto = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'students', 600, 600, 0.85);
      this.newStudent.photoUrl = url;
      this.toast.success('Student photo attached successfully.');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to upload student photo.');
    } finally {
      this.uploadingStudentPhoto = false;
      input.value = '';
    }
  }

  removeStudentPhoto() {
    this.newStudent.photoUrl = '';
  }

  async onGuardianPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingGuardianPhoto = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'guardians', 600, 600, 0.85);
      this.newStudent.guardianPhotoUrl = url;
      this.toast.success('Guardian photo attached successfully.');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to upload guardian photo.');
    } finally {
      this.uploadingGuardianPhoto = false;
      input.value = '';
    }
  }

  removeGuardianPhoto() {
    this.newStudent.guardianPhotoUrl = '';
  }

  async onStaffPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingStaffPhoto = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'staff', 600, 600, 0.85);
      this.newStaff.photoUrl = url;
      this.toast.success('Faculty photo attached successfully.');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to upload faculty photo.');
    } finally {
      this.uploadingStaffPhoto = false;
      input.value = '';
    }
  }

  removeStaffPhoto() {
    this.newStaff.photoUrl = '';
  }

  viewStudentDetails(student: any, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    const targetId = student?.studentId || student?.id || student?.enrollmentId;
    if (targetId) {
      this.router.navigate(['/academics/student', targetId]);
    }
  }

  openEditStudentModal(student: StudentItem, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    this.isEditingStudent = true;
    this.editingStudentId = student.studentId || student.id || student.enrollmentId;

    // Find class that has this student's section or matches class name
    let classObj = this.classes.find(c => 
      c.name === student.className || 
      (c.sections || []).some(s => s.name === student.sectionName || s.id === student.sectionId)
    );
    if (!classObj && this.classes.length > 0) {
      classObj = this.classes[0];
    }
    this.studentEnrollClassId = classObj?.id || '';

    // Split name into first and last name
    const parts = (student.fullName || '').trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    // Find section id
    const secObj = classObj?.sections?.find(s => s.name === student.sectionName || s.id === student.sectionId);

    let formattedDob = '';
    const dobRaw = student.dateOfBirth || student.dob;
    if (dobRaw) {
      try {
        const dStr = String(dobRaw).trim();
        formattedDob = dStr.includes('T') ? dStr.split('T')[0] : dStr;
      } catch {}
    }

    const primaryRel = ((student as any).primaryGuardianType || student.primaryContact?.relationship || 'FATHER').toUpperCase() as 'FATHER' | 'MOTHER' | 'GUARDIAN';
    const primaryFullName = `${student.primaryContact?.first_name || ''} ${student.primaryContact?.last_name || ''}`.trim();
    const primaryPhone = student.primaryContact?.phone || '';
    const existingEmail = (student as any).guardianEmail || student.primaryContact?.email || '';

    this.newStudent = {
      firstName: firstName,
      lastName: lastName,
      admissionNumber: student.admissionNumber || '',
      rollNumber: student.rollNumber !== undefined && student.rollNumber !== null ? String(student.rollNumber) : '',
      sectionId: secObj?.id || student.sectionId || (classObj?.sections?.[0]?.id || ''),
      gender: (student.gender || 'MALE').toUpperCase(),
      dateOfBirth: formattedDob,
      bloodGroup: student.bloodGroup || '',
      photoUrl: student.photoUrl || student.photo_url || '',
      fatherName: (student as any).fatherName || (student as any).father_name || (primaryRel === 'FATHER' ? primaryFullName : ''),
      fatherPhone: (student as any).fatherPhone || (student as any).father_phone || (primaryRel === 'FATHER' ? primaryPhone : ''),
      motherName: (student as any).motherName || (student as any).mother_name || (primaryRel === 'MOTHER' ? primaryFullName : ''),
      motherPhone: (student as any).motherPhone || (student as any).mother_phone || (primaryRel === 'MOTHER' ? primaryPhone : ''),
      guardianName: (student as any).guardianName || (student as any).guardian_name || (primaryRel === 'GUARDIAN' ? primaryFullName : ''),
      guardianPhone: (student as any).guardianPhone || (student as any).guardian_phone || (primaryRel === 'GUARDIAN' ? primaryPhone : ''),
      guardianRelationship: (student as any).guardianRelationship || 'GUARDIAN',
      primaryGuardianType: primaryRel === 'MOTHER' ? 'MOTHER' : (primaryRel === 'GUARDIAN' ? 'GUARDIAN' : 'FATHER'),
      guardianEmail: existingEmail,
      confirmGuardianEmail: existingEmail,
      guardianPhotoUrl: student.guardianPhotoUrl || (student as any).guardian_photo_url || student.primaryContact?.photoUrl || (student.primaryContact as any)?.photo_url || '',
      relationship: primaryRel,
    };

    this.studentModalError = '';
    this.hideLoginEmail = false;
    this.modalService.open('EDIT_STUDENT');
    this.showAddStudentModal = true;
  }

  closeAddStudentModal() {
    this.modalService.close();
    this.showAddStudentModal = false;
    this.isEditingStudent = false;
    this.editingStudentId = null;
  }

  changeStudentStatus(student: StudentItem, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEFTOUT' | 'TRANSFERRED', event?: Event) {
    if (event) event.stopPropagation();
    this.activeStudentMenuId = null;
    const targetStudentId = student.studentId || student.id || student.enrollmentId;
    const actionMap: Record<string, string> = {
      ACTIVE: 'activate',
      INACTIVE: 'deactivate',
      SUSPENDED: 'suspend',
      LEFTOUT: 'mark as leftout / TC',
      TRANSFERRED: 'mark as transferred',
    };
    const actionLabel = actionMap[status] || 'change status of';

    if (!confirm(`Are you sure you want to ${actionLabel} ${student.fullName}?`)) {
      return;
    }

    const payload = {
      status,
      reason: `Status changed to ${status} via administration roster panel`,
    };

    this.api.patch(`academics/students/${targetStudentId}/status`, payload).subscribe({
      next: () => {
        student.status = status;
        this.toast.success(`Student ${student.fullName} status updated to ${status}.`);
        this.loadClassesAndSubjects();
      },
      error: (err: any) => {
        this.toast.error(this.formatErrorMessage(err, `Failed to update status to ${status}.`));
      },
    });
  }

  saveStudent() {
    if (!this.newStudent.firstName.trim() || !this.newStudent.admissionNumber.trim() || !this.newStudent.sectionId) {
      this.studentModalError = 'First Name, Admission Number, Class, and Section are required.';
      return;
    }

    // Verify login email double entry matching
    const email1 = (this.newStudent.guardianEmail || '').trim().toLowerCase();
    const email2 = (this.newStudent.confirmGuardianEmail || '').trim().toLowerCase();

    if (email1 || email2) {
      if (email1 !== email2) {
        this.studentModalError = 'Parent Portal Login Email and Confirmation Email do not match. Please verify both fields.';
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email1)) {
        this.studentModalError = 'Please enter a valid email address (e.g. parent@gmail.com).';
        return;
      }
    }

    this.savingStudent = true;
    this.studentModalError = '';

    // Resolve primary guardian contact details based on selected login user
    let primaryName = this.newStudent.fatherName;
    let primaryPhone = this.newStudent.fatherPhone;
    let primaryRelationship = 'FATHER';

    if (this.newStudent.primaryGuardianType === 'MOTHER') {
      primaryName = this.newStudent.motherName || this.newStudent.fatherName;
      primaryPhone = this.newStudent.motherPhone || this.newStudent.fatherPhone;
      primaryRelationship = 'MOTHER';
    } else if (this.newStudent.primaryGuardianType === 'GUARDIAN') {
      primaryName = this.newStudent.guardianName || this.newStudent.fatherName || this.newStudent.motherName;
      primaryPhone = this.newStudent.guardianPhone || this.newStudent.fatherPhone || this.newStudent.motherPhone;
      primaryRelationship = this.newStudent.guardianRelationship || 'GUARDIAN';
    } else {
      if (!primaryName && this.newStudent.motherName) {
        primaryName = this.newStudent.motherName;
        primaryPhone = this.newStudent.motherPhone;
        primaryRelationship = 'MOTHER';
      } else if (!primaryName && this.newStudent.guardianName) {
        primaryName = this.newStudent.guardianName;
        primaryPhone = this.newStudent.guardianPhone;
        primaryRelationship = this.newStudent.guardianRelationship || 'GUARDIAN';
      }
    }

    const payload = {
      ...this.newStudent,
      guardianName: primaryName || this.newStudent.guardianName || 'Parent',
      guardianPhone: primaryPhone || this.newStudent.guardianPhone || '',
      relationship: primaryRelationship,
      classId: this.studentEnrollClassId,
      academicYearId: this.auth.activeAcademicSession()?.id,
    };

    if (this.isEditingStudent && this.editingStudentId) {
      this.api.patch(`academics/students/${this.editingStudentId}`, payload).subscribe({
        next: (res: any) => {
          this.savingStudent = false;
          this.closeAddStudentModal();
          this.toast.success(`Student ${res?.fullName || this.newStudent.firstName} updated successfully!`);
          this.loadClassesAndSubjects();
        },
        error: (err) => {
          this.savingStudent = false;
          this.studentModalError = this.formatErrorMessage(err, 'Failed to update student details.');
        },
      });
    } else {
      this.api.post('academics/students', payload).subscribe({
        next: (res: any) => {
          this.savingStudent = false;
          this.closeAddStudentModal();
          this.toast.success(`Student ${res.fullName || this.newStudent.firstName} enrolled successfully!`);
          this.loadClassesAndSubjects();
        },
        error: (err) => {
          this.savingStudent = false;
          this.studentModalError = this.formatErrorMessage(err, 'Failed to enroll student. Please verify admission number.');
        },
      });
    }
  }

  // --- Add Staff ---
  openAddStaffModal() {
    this.newStaff = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      photoUrl: '',
      role: 'TEACHER',
      primarySubjectId: '',
      password: 'password123',
      gender: 'MALE',
      dateOfBirth: '',
      qualification: '',
      experience: '',
      joiningDate: '',
      bloodGroup: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      department: '',
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

  // --- Staff 3-Dot Actions & Profile/Edit Modal Handlers ---
  getStaffMenuPlacement(staff: StaffMember): string {
    const idx = this.paginatedStaff.findIndex(s => s.id === staff.id);
    const total = this.paginatedStaff.length;
    // If it's near the bottom of a large list (last 2 rows in 4+ list), open upwards to stay fully visible
    if (total >= 4 && idx >= total - 2) {
      return 'bottom-full mb-1.5 origin-bottom-right';
    }
    return 'top-full mt-1.5 origin-top-right';
  }

  toggleStaffMenu(staffId: string, event: Event) {
    event.stopPropagation();
    if (this.activeStaffMenuId === staffId) {
      this.activeStaffMenuId = null;
      return;
    }

    this.activeStaffMenuId = staffId;
    this.activeStudentMenuId = null;
    this.activeClassMenuId = null;
    this.activeSectionMenuId = null;
    this.activeAlumniMenuId = null;
  }

  openViewStaffProfile(staff: StaffMember, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStaffMenuId = null;
    this.selectedStaffProfile = staff;
    this.modalService.open('STAFF_PROFILE_MODAL');
    this.showStaffProfileModal = true;
  }

  closeStaffProfileModal() {
    this.modalService.close();
    this.showStaffProfileModal = false;
    this.selectedStaffProfile = null;
  }

  navigateToFacultyTimetable(staff: StaffMember, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStaffMenuId = null;
    this.router.navigate(['/timetable'], { queryParams: { type: 'faculty', staffId: staff.id } });
  }

  openEditStaffModal(staff: StaffMember, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStaffMenuId = null;
    this.editingStaffId = staff.id;
    this.editStaffForm = {
      firstName: staff.firstName || staff.fullName?.split(' ')[0] || '',
      lastName: staff.lastName || (staff.fullName?.includes(' ') ? staff.fullName.substring(staff.fullName.indexOf(' ') + 1) : ''),
      email: staff.email || '',
      phone: staff.phone || '',
      photoUrl: staff.photoUrl || staff.avatarUrl || '',
      role: staff.role || 'TEACHER',
      primarySubjectId: staff.primarySubjectId || '',
      gender: staff.gender || 'MALE',
      dateOfBirth: staff.dateOfBirth || staff.dob || '',
      qualification: staff.qualification || '',
      experience: staff.experience || '',
      joiningDate: staff.joiningDate || '',
      bloodGroup: staff.bloodGroup || '',
      address: staff.address || '',
      emergencyContactName: staff.emergencyContactName || '',
      emergencyContactPhone: staff.emergencyContactPhone || '',
      department: staff.department || '',
    };
    this.editStaffModalError = '';
    this.modalService.open('EDIT_STAFF_MODAL');
    this.showEditStaffModal = true;
  }

  closeEditStaffModal() {
    this.modalService.close();
    this.showEditStaffModal = false;
    this.editingStaffId = null;
  }

  async onEditStaffPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    try {
      this.uploadingEditStaffPhoto = true;
      const url = await this.imageUploadService.processAndUploadImage(file, 'staff', 600, 600, 0.85);
      this.editStaffForm.photoUrl = url;
      this.toast.success('Faculty photo updated successfully.');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to upload faculty photo.');
    } finally {
      this.uploadingEditStaffPhoto = false;
      input.value = '';
    }
  }

  removeEditStaffPhoto() {
    this.editStaffForm.photoUrl = '';
  }

  saveEditStaff() {
    if (!this.editStaffForm.firstName?.trim()) {
      this.editStaffModalError = 'First name is required.';
      return;
    }
    if (!this.editingStaffId) return;

    this.savingStaffEdit = true;
    this.editStaffModalError = '';

    this.api.patch(`academics/staff/${this.editingStaffId}`, this.editStaffForm).subscribe({
      next: (res: any) => {
        this.savingStaffEdit = false;
        this.toast.success('Faculty details updated successfully!');
        
        if (this.selectedStaffProfile && this.selectedStaffProfile.id === this.editingStaffId) {
          Object.assign(this.selectedStaffProfile, {
            ...this.editStaffForm,
            fullName: `${this.editStaffForm.firstName} ${this.editStaffForm.lastName || ''}`.trim()
          });
        }
        
        this.closeEditStaffModal();
        this.loadStaffList();
      },
      error: (err) => {
        this.savingStaffEdit = false;
        this.editStaffModalError = this.formatErrorMessage(err, 'Failed to update faculty member.');
      }
    });
  }

  confirmDeleteStaff(staff: StaffMember, event?: Event) {
    if (event) event.stopPropagation();
    this.activeStaffMenuId = null;
    this.staffToDelete = staff;
    this.modalService.open('DELETE_STAFF_MODAL');
    this.showDeleteStaffModal = true;
  }

  closeDeleteStaffModal() {
    this.modalService.close();
    this.showDeleteStaffModal = false;
    this.staffToDelete = null;
  }

  executeDeleteStaff() {
    if (!this.staffToDelete) return;
    const target = this.staffToDelete;
    this.deletingStaff = true;

    this.api.delete(`academics/staff/${target.id}`).subscribe({
      next: () => {
        this.deletingStaff = false;
        this.closeDeleteStaffModal();
        this.toast.success(`Faculty member "${target.fullName}" was removed from the directory.`);
        if (this.selectedStaffProfile?.id === target.id) {
          this.closeStaffProfileModal();
        }
        this.loadStaffList();
      },
      error: (err: any) => {
        this.deletingStaff = false;
        this.toast.error(err.error?.message || err.message || 'Failed to remove staff member.');
      }
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

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowScroll() {
    if (this.activeStudentMenuId) {
      this.activeStudentMenuId = null;
    }
    if (this.activeAlumniMenuId) {
      this.activeAlumniMenuId = null;
    }
    if (this.activeStaffMenuId) {
      this.activeStaffMenuId = null;
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeClassMenuId = null;
    this.activeSectionMenuId = null;
    this.activeStudentMenuId = null;
    this.activeAlumniMenuId = null;
    this.activeStaffMenuId = null;
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

  // Delete Subject Confirmation Modal Handlers
  promptDeleteSubject(subject: SubjectItem, classItem?: ClassItem, event?: Event) {
    if (event) event.stopPropagation();
    this.subjectToDelete = { subject, classItem };
    this.modalService.open('DELETE_SUBJECT');
    this.showDeleteSubjectModal = true;
  }

  closeDeleteSubjectModal() {
    this.modalService.close();
    this.showDeleteSubjectModal = false;
    this.subjectToDelete = null;
    this.isDeletingSubject = false;
  }

  executeDeleteSubject() {
    if (!this.subjectToDelete) return;
    const { subject, classItem } = this.subjectToDelete;
    this.isDeletingSubject = true;

    this.api.delete(`academics/subjects/${subject.id}`).subscribe({
      next: () => {
        this.isDeletingSubject = false;
        this.subjects = this.subjects.filter((s) => s.id !== subject.id);
        const className = classItem ? ` from ${classItem.name}` : '';
        this.toast.success(`Subject "${subject.name}" (${subject.code}) removed successfully${className}.`);
        this.closeDeleteSubjectModal();
        this.loadClassesAndSubjects();
      },
      error: (err: any) => {
        this.isDeletingSubject = false;
        this.toast.error(this.formatErrorMessage(err, 'Failed to delete subject.'));
      },
    });
  }
}
