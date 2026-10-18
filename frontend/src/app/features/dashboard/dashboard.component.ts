import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardStats,
  TeacherTimetablePeriod,
  TeacherSubjectAssignment,
  TeacherStudentItem,
  ParentChildDashboardItem,
} from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- ============================================================== -->
      <!-- 1. ADMIN & PRINCIPAL EXECUTIVE COMMAND CENTER                  -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isAdmin()">

        <!-- 4 Primary Executive KPI Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <!-- Card 1: Active Students -->
          <a *ngIf="auth.isServiceEnabled('ACADEMICS')" routerLink="/academics" [queryParams]="{tab: 'students'}"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Students</span>
              <div class="w-9 h-9 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0] group-hover:scale-105 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="3.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M3.5 19.5C3.5 16.4624 5.96243 14 9 14C12.0376 14 14.5 16.4624 14.5 19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <circle cx="16.5" cy="8.5" r="2.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.6"/>
                  <path d="M16 14.5C18.4853 14.5 20.5 16.5147 20.5 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ stats?.stats?.activeStudents ?? 0 }}</div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 flex-wrap gap-1">
              <div class="flex items-center gap-1.5 text-[11px] font-bold">
                <span class="text-emerald-600 inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {{ stats?.stats?.activeStudents ?? 0 }} Active
                </span>
                <span class="text-slate-300 font-normal">|</span>
                <span class="text-rose-600 inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {{ stats?.stats?.inactiveStudents ?? 0 }} Inactive
                </span>
                <span class="text-slate-300 font-normal">|</span>
                <span class="text-slate-700">{{ stats?.stats?.totalStudents ?? 0 }} Total</span>
              </div>
              <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </div>
          </a>

          <!-- Card 2: Faculty & Departmental Staff -->
          <a routerLink="/departmental-users"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faculty & Staff</span>
              <div class="w-9 h-9 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0] group-hover:scale-105 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L2 8L12 13L22 8L12 3Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  <path d="M6 10.5V16.5C6 18.433 8.68629 20 12 20C15.3137 20 18 18.433 18 16.5V10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 9V15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ (stats?.stats?.totalTeachers || 0) + (modules?.departmental?.totalUsers || 0) }} Staff
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-slate-500 font-semibold">
                {{ stats?.stats?.totalTeachers ?? 0 }} Faculty • {{ modules?.departmental?.totalUsers ?? 0 }} Dept
              </span>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors inline-flex items-center gap-1">
                Manage
                <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
              </span>
            </div>
          </a>

          <!-- Card 3: Today's Attendance -->
          <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
              <div class="w-9 h-9 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0] group-hover:scale-105 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8.5 12.5L10.8 14.8L15.5 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ (stats?.stats?.attendanceMarkedCount || 0) > 0 ? (stats?.stats?.attendanceTodayPercentage || '0.0') + '%' : 'Pending' }}
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-emerald-600 font-semibold">
                {{ stats?.stats?.attendanceMarkedCount ?? 0 }} Marked Today
              </span>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors inline-flex items-center gap-1">
                Registers
                <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
              </span>
            </div>
          </a>

          <!-- Card 4: Fee Collection or Classes Fallback -->
          <a *ngIf="auth.isServiceEnabled('FEES'); else adminClassesCard" routerLink="/fees"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Collection</span>
              <div class="w-9 h-9 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0] group-hover:scale-105 transition-all">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M2 10h20M7 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              ₹{{ (modules?.fees?.totalCollected ?? 0) | number:'1.0-0' }}
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-amber-700 font-semibold">
                {{ modules?.fees?.collectionRate ?? 0 }}% Collected • ₹{{ (modules?.fees?.totalOutstanding ?? 0) | number:'1.0-0' }} Due
              </span>
              <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/>
              </svg>
            </div>
          </a>
          <ng-template #adminClassesCard>
            <a *ngIf="auth.isServiceEnabled('ACADEMICS')" routerLink="/academics"
               class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classes Configured</span>
                <div class="w-9 h-9 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0] group-hover:scale-105 transition-all">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="10" width="18" height="10" rx="2.5" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M5 10V7.5C5 6.11929 6.11929 5 7.5 5H16.5C17.8807 5 19 6.11929 19 7.5V10" stroke="currentColor" stroke-width="1.8"/>
                  </svg>
                </div>
              </div>
              <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalClasses ?? 0 }} Classes</div>
              <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
                <span class="text-blue-600 font-semibold">{{ modules?.academics?.totalSections ?? 0 }} Sections Active</span>
                <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors inline-flex items-center gap-1">
                  Manage
                  <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                </span>
              </div>
            </a>
          </ng-template>
        </div>

        <!-- ============================================================== -->
        <!-- INTERACTIVE MODULE SPOTLIGHT (CENTER) + FEATURE LIST (RIGHT)   -->
        <!-- Automatically hides any module disabled for this school        -->
        <!-- ============================================================== -->
        <div *ngIf="enabledMatrixModules.length > 0">
          <!-- Spotlight Header Template (Rendered inside the active module card) -->
          <ng-template #matrixSpotlightHeader>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h2 class="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Department &amp; Service Analytics Matrix
                  </h2>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Select any module from the right list to inspect its live analytics in the center spotlight
                </p>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span class="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-black text-slate-600 shadow-2xs">
                  Module {{ activeMatrixModuleIndex + 1 }} of {{ enabledMatrixModules.length }}
                </span>
                <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                  <button type="button" (click)="stepMatrixModule(-1)"
                          title="Previous Module"
                          class="w-7 h-7 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <button type="button" (click)="stepMatrixModule(1)"
                          title="Next Module"
                          class="w-7 h-7 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <button type="button" (click)="closeMatrixModule()"
                        title="Close Spotlight"
                        class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  <span>Close</span>
                </button>
              </div>
            </div>
          </ng-template>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            <!-- ========================================================== -->
            <!-- CENTER / LEFT: SPOTLIGHT STAGE / LANDING CIRCULARS FEED     -->
            <!-- ========================================================== -->
            <div class="lg:col-span-7 xl:col-span-8 flex flex-col">

              <!-- LANDING STATE: ALL MODULES CLOSED -> RECENT CAMPUS CIRCULARS ON TOP -->
              <div *ngIf="!activeMatrixModuleId" class="flex-1 flex flex-col space-y-6">
                <!-- Recent Campus Circulars Card -->
                <div *ngIf="auth.isServiceEnabled('COMMUNICATION')" class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex-1 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                          <h2 class="text-base font-bold text-slate-900">Recent Campus Circulars</h2>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">Official announcements broadcast to teachers, parents & staff</p>
                      </div>
                      <a routerLink="/communication" class="text-xs font-bold text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/60 hover:bg-blue-100 transition-colors">
                        View All →
                      </a>
                    </div>
                    <div class="divide-y divide-slate-100 mt-2">
                      <div *ngFor="let notice of stats?.recentNotices" class="py-3.5 first:pt-2 last:pb-0 flex items-start justify-between gap-4">
                        <div class="space-y-1">
                          <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                            <h3 class="text-sm font-bold text-slate-900">{{ notice.title }}</h3>
                          </div>
                          <p class="text-xs text-slate-600 line-clamp-2 pl-4">{{ notice.content }}</p>
                        </div>
                        <div class="text-right shrink-0">
                          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {{ notice.target_audience || 'ALL' }}
                          </span>
                          <div class="text-[11px] text-slate-400 mt-1">{{ notice.published_at | date:'mediumDate' }}</div>
                        </div>
                      </div>
                      <div *ngIf="!stats?.recentNotices?.length" class="py-12 text-center text-slate-400 text-xs">
                        No recent notices published.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Upcoming Exams Card (when exams service enabled) -->
                <div *ngIf="auth.isServiceEnabled('EXAMS')" class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
                  <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        <h2 class="text-base font-bold text-slate-900">Upcoming Exams</h2>
                      </div>
                      <p class="text-xs text-slate-500 mt-0.5">Scheduled assessments and term examinations</p>
                    </div>
                    <a routerLink="/exams" class="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-200/60 hover:bg-indigo-100 transition-colors">
                      Manage →
                    </a>
                  </div>
                  <div class="space-y-3 mt-4">
                    <div *ngFor="let exam of stats?.upcomingExams" class="p-3.5 rounded-2xl border border-slate-200/80 bg-[#f8fafc] flex items-center justify-between">
                      <div>
                        <div class="text-xs font-bold text-slate-900">{{ exam.name }}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Starts: {{ exam.start_date | date:'mediumDate' }}</div>
                      </div>
                      <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white text-slate-700 border border-slate-200 shadow-2xs">
                        {{ exam.status }}
                      </span>
                    </div>
                    <div *ngIf="!stats?.upcomingExams?.length" class="py-8 text-center text-slate-400 text-xs">
                      No upcoming exams scheduled.
                    </div>
                  </div>
                </div>
              </div>

              <!-- MODULE 1: ACADEMICS (Classes, Sections, Subjects, Students) -->
              <div *ngIf="activeMatrixModuleId === 'ACADEMICS'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <path d="M12 3L2 8L12 13L22 8L12 3Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                          <path d="M6 10.5V16.5C6 18.43 8.69 20 12 20C15.31 20 18 18.43 18 16.5V10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-indigo-600">Academic Core Module</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Academics & Enrollment</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Classes, sections, curriculum subjects & enrolled student directory</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                      {{ stats?.stats?.totalClasses ?? 0 }} Grades Active
                    </span>
                  </div>

                  <!-- Spotlight Metrics Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
                    <div class="matrix-tile-1 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-[inset_1px_1px_2px_#ffffff]">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Students</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ stats?.stats?.activeStudents ?? 0 }}</div>
                      <div class="text-xs text-emerald-600 font-bold mt-1">Active in Session</div>
                    </div>
                    <div class="matrix-tile-2 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-[inset_1px_1px_2px_#ffffff]">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Sections</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.academics?.totalSections ?? 0 }}</div>
                      <div class="text-xs text-slate-500 font-bold mt-1">Configured Classrooms</div>
                    </div>
                    <div class="matrix-tile-3 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 shadow-[inset_1px_1px_2px_#ffffff]">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Curriculum Subjects</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.academics?.totalSubjects ?? 0 }}</div>
                      <div class="text-xs text-indigo-600 font-bold mt-1">Mapped Subjects</div>
                    </div>
                  </div>

                  <!-- Additional Breakdown Strip -->
                  <div class="matrix-tile-3 mt-4 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-4 text-xs font-bold text-slate-700">
                      <span class="inline-flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {{ stats?.stats?.activeStudents ?? 0 }} Active Students
                      </span>
                      <span class="inline-flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                        {{ stats?.stats?.inactiveStudents ?? 0 }} Inactive
                      </span>
                      <span class="inline-flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {{ stats?.stats?.totalTeachers ?? 0 }} Teaching Faculty
                      </span>
                    </div>
                    <span class="text-[11px] font-bold text-indigo-700">Total Strength: {{ stats?.stats?.totalStudents ?? 0 }}</span>
                  </div>
                </div>

                <!-- Shortcuts Footer -->
                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-2 flex-wrap">
                    <a routerLink="/academics" [queryParams]="{tab: 'classes'}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold transition-all">Classes & Sections</a>
                    <a routerLink="/academics" [queryParams]="{tab: 'students'}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold transition-all">Student Directory</a>
                    <a routerLink="/academics" [queryParams]="{tab: 'staff'}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold transition-all">Faculty Roster</a>
                  </div>
                  <a routerLink="/academics" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Open Academics</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 2: DEPARTMENTAL STAFF & ACCESS CONTROL -->
              <div *ngIf="activeMatrixModuleId === 'DEPARTMENTAL'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-purple-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-purple-50/90 border border-purple-100 text-purple-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                          <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                          <path d="M8.5 16.5C8.5 14.6 10.1 13.5 12 13.5C13.9 13.5 15.5 14.6 15.5 16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-purple-600">Administration & RBAC</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Departmental Staff</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Fee desk officers, transport coordinators & granular role permissions</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                      {{ modules?.departmental?.activeUsers ?? 0 }} Active Staff
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
                    <div class="matrix-tile-1 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dept Staff</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.departmental?.totalUsers ?? 0 }}</div>
                      <div class="text-xs text-purple-600 font-bold mt-1">Configured Accounts</div>
                    </div>
                    <div class="matrix-tile-2 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Desk Officers</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.departmental?.feeUsers ?? 0 }}</div>
                      <div class="text-xs text-amber-600 font-bold mt-1">Finance & Billing</div>
                    </div>
                    <div class="matrix-tile-3 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transport Officers</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.departmental?.transportUsers ?? 0 }}</div>
                      <div class="text-xs text-cyan-600 font-bold mt-1">Fleet Operations</div>
                    </div>
                  </div>

                  <div class="matrix-tile-3 mt-4 p-4 rounded-2xl bg-purple-50/40 border border-purple-100/80 flex items-center justify-between gap-3 flex-wrap">
                    <span class="text-xs font-bold text-slate-700">
                      Manage module-by-module access permissions for teachers, fee managers, and staff roles.
                    </span>
                    <span class="text-[11px] font-black text-purple-700 uppercase">Role-Based Security</span>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <a routerLink="/role-permissions" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-800 text-slate-700 text-xs font-bold transition-all">
                    Role Access Matrix
                  </a>
                  <a routerLink="/departmental-users" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Manage Staff</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 3: FEE MANAGEMENT & INVOICING -->
              <div *ngIf="activeMatrixModuleId === 'FEES'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-amber-50/90 border border-amber-100 text-amber-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                          <path d="M2 10h20M7 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-amber-600">Finance & Billing</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Fee Management</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Student fee invoices, receipts, structures & outstanding dues collection</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      {{ modules?.fees?.collectionRate ?? 0 }}% Collected
                    </span>
                  </div>

                  <!-- Visual Collection Progress Bar -->
                  <div class="matrix-tile-1 mt-6 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                    <div class="flex items-center justify-between text-xs font-bold mb-2">
                      <span class="text-emerald-700">Collected: ₹{{ (modules?.fees?.totalCollected ?? 0) | number:'1.0-0' }}</span>
                      <span class="text-rose-600">Due: ₹{{ (modules?.fees?.totalOutstanding ?? 0) | number:'1.0-0' }}</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-slate-200/70 overflow-hidden">
                      <div class="matrix-bar-grow h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                           [style.width.%]="modules?.fees?.collectionRate || 0"></div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                    <div class="matrix-tile-1 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 text-center">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</div>
                      <div class="text-2xl font-black text-slate-900 mt-1">{{ modules?.fees?.totalInvoicesCount ?? 0 }}</div>
                    </div>
                    <div class="matrix-tile-2 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                      <div class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Paid Invoices</div>
                      <div class="text-2xl font-black text-emerald-800 mt-1">{{ modules?.fees?.paidCount ?? 0 }}</div>
                    </div>
                    <div class="matrix-tile-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                      <div class="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Pending / Partial</div>
                      <div class="text-2xl font-black text-rose-800 mt-1">{{ (modules?.fees?.unpaidCount || 0) + (modules?.fees?.partialCount || 0) }}</div>
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span class="text-xs font-semibold text-slate-500">
                    Total Billed: <strong class="text-slate-900 font-black">₹{{ (modules?.fees?.totalBilled ?? 0) | number:'1.0-0' }}</strong>
                  </span>
                  <a routerLink="/fees" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Open Fee Ledger</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 4: TRANSPORT & FLEET DEPARTMENT -->
              <div *ngIf="activeMatrixModuleId === 'TRANSPORT'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-cyan-50/90 border border-cyan-100 text-cyan-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="5" width="18" height="12" rx="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                          <path d="M3 11h18" stroke="currentColor" stroke-width="1.6"/>
                          <circle cx="7.5" cy="18.5" r="2" stroke="currentColor" stroke-width="1.8"/>
                          <circle cx="16.5" cy="18.5" r="2" stroke="currentColor" stroke-width="1.8"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-cyan-600">Transit & Fleet</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Transport Department</h3>
                        <p class="text-xs text-slate-500 mt-0.5">School buses, transit routes, pickup stops & student bus passes</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-2xs">
                      {{ modules?.transport?.fleetOccupancyRate ?? 0 }}% Occupancy
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
                    <div class="matrix-tile-1 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fleet Buses</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.transport?.totalVehicles ?? 0 }}</div>
                      <div class="text-xs text-emerald-600 font-bold mt-1">{{ modules?.transport?.activeVehiclesCount ?? 0 }} Active</div>
                    </div>
                    <div class="matrix-tile-2 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transit Routes</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.transport?.totalRoutes ?? 0 }}</div>
                      <div class="text-xs text-slate-500 font-bold mt-1">{{ modules?.transport?.totalStopsCount ?? 0 }} Pickup Stops</div>
                    </div>
                    <div class="matrix-tile-3 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student Passes</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.transport?.subscribedStudentsCount ?? 0 }}</div>
                      <div class="text-xs text-cyan-600 font-bold mt-1">Subscribed Riders</div>
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span class="text-xs font-semibold text-slate-500">
                    Total Fleet Capacity: <strong class="text-slate-900 font-black">{{ modules?.transport?.totalFleetCapacity ?? 0 }} Seats</strong>
                  </span>
                  <a routerLink="/transport" class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Manage Fleet</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 5: TIMETABLE & ROUTINE -->
              <div *ngIf="activeMatrixModuleId === 'TIMETABLE'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-blue-50/90 border border-blue-100 text-blue-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="17" rx="2.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                          <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-blue-600">Routine & Scheduling</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Class Timetables</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Weekly period grids, classroom allocations & faculty schedules</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                      {{ modules?.timetable?.totalPeriods ?? 0 }} Periods
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                    <div class="matrix-tile-1 p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sections Scheduled</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                        {{ modules?.timetable?.configuredSectionsCount ?? 0 }} / {{ modules?.academics?.totalSections ?? 0 }}
                      </div>
                      <div class="text-xs text-blue-600 font-bold mt-1">Active Class Routines</div>
                    </div>
                    <div class="matrix-tile-2 p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faculty Assigned</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.timetable?.activeTeachersInRoutine ?? 0 }}</div>
                      <div class="text-xs text-slate-500 font-bold mt-1">In Weekly Period Grid</div>
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span class="text-xs font-semibold text-slate-500">Conflict-checked period matrix across all grades</span>
                  <a routerLink="/timetable" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>View Schedule</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 6: DAILY ATTENDANCE -->
              <div *ngIf="activeMatrixModuleId === 'ATTENDANCE'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-emerald-50/90 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                          <path d="M8.5 12.5L10.8 14.8L15.5 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600">Daily Register</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Daily Attendance</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Roll call registers, daily presence rate & absentee tracking</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black border shadow-2xs"
                          [ngClass]="modules?.attendance?.isMarkedToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                      {{ modules?.attendance?.isMarkedToday ? (modules?.attendance?.todayPercentage + '% Present') : 'Awaiting Roll Call' }}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
                    <div class="matrix-tile-1 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <div class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Present Today</div>
                      <div class="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{{ modules?.attendance?.presentCount ?? 0 }}</div>
                      <div class="text-xs text-emerald-600 font-bold mt-1">Verified Present</div>
                    </div>
                    <div class="matrix-tile-2 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                      <div class="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Absent Today</div>
                      <div class="text-2xl sm:text-3xl font-black text-rose-900 mt-1">{{ modules?.attendance?.absentCount ?? 0 }}</div>
                      <div class="text-xs text-rose-600 font-bold mt-1">Absentee Alerts</div>
                    </div>
                    <div class="matrix-tile-3 p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Marked</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.attendance?.markedCount ?? 0 }}</div>
                      <div class="text-xs text-slate-500 font-bold mt-1">of {{ stats?.stats?.activeStudents ?? 0 }} Students</div>
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span class="text-xs font-semibold text-slate-500">
                    Target Pool: <strong class="text-slate-900 font-black">{{ stats?.stats?.activeStudents ?? 0 }} Enrolled Students</strong>
                  </span>
                  <a routerLink="/attendance" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Mark / Audit Register</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 7: HOMEWORK & ASSIGNMENTS -->
              <div *ngIf="activeMatrixModuleId === 'HOMEWORK'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-sky-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-sky-50/90 border border-sky-100 text-sky-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-sky-600">Classwork & Diaries</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Homework & Diaries</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Daily classwork dispatches, subject assignments & submission tracking</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                      {{ modules?.homework?.activeHomework ?? 0 }} Active
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                    <div class="matrix-tile-1 p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Posted</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.homework?.totalHomework ?? 0 }}</div>
                      <div class="text-xs text-sky-600 font-bold mt-1">Published Assignments</div>
                    </div>
                    <div class="matrix-tile-2 p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Due Today</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.homework?.dueTodayCount ?? 0 }}</div>
                      <div class="text-xs text-amber-600 font-bold mt-1">Expected Submissions</div>
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <span class="text-xs font-semibold text-slate-500">Instantly synced with parent & student feeds</span>
                  <a routerLink="/homework" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Open Homework Diary</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 8: EXAMS & MARKS -->
              <div *ngIf="activeMatrixModuleId === 'EXAMS'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-violet-50/90 border border-violet-100 text-violet-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="3" width="16" height="18" rx="2.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-violet-600">Assessments & Grading</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Exams & Report Cards</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Term exam schedules, student marksheets & performance evaluation</p>
                      </div>
                    </div>
                    <span class="px-3 py-1 rounded-xl text-xs font-black bg-violet-50 text-violet-700 border border-violet-200 shadow-2xs">
                      {{ (stats?.upcomingExams || []).length }} Scheduled
                    </span>
                  </div>

                  <div class="mt-6 space-y-2.5">
                    <div *ngFor="let ex of (stats?.upcomingExams || []).slice(0, 3); let idx = index"
                         [ngClass]="idx === 0 ? 'matrix-tile-1' : (idx === 1 ? 'matrix-tile-2' : 'matrix-tile-3')"
                         class="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-xs sm:text-sm font-black text-slate-900 truncate">{{ ex.name }}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">Starts: {{ ex.start_date | date:'mediumDate' }}</div>
                      </div>
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white text-violet-700 border border-violet-200 shrink-0">
                        {{ ex.status || 'UPCOMING' }}
                      </span>
                    </div>
                    <div *ngIf="!stats?.upcomingExams?.length"
                         class="matrix-tile-1 p-6 rounded-2xl bg-[#f8fafc] border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No upcoming exams scheduled yet. Click Exam Center to create a term schedule.
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <a routerLink="/exams" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-violet-50 hover:text-violet-800 text-slate-700 text-xs font-bold transition-all">
                    Enter Student Marks
                  </a>
                  <a routerLink="/exams" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <span>Open Exam Center</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

              <!-- MODULE 9: COMMUNICATION & PARENT COMPLAINTS -->
              <div *ngIf="activeMatrixModuleId === 'COMMUNICATION'"
                   class="matrix-spotlight-enter relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[8px_8px_24px_#d9e2ec,-8px_-8px_24px_#ffffff] flex-1 flex flex-col justify-between space-y-6">
                <div class="matrix-glow pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rose-400/10 blur-3xl"></div>

                <div class="relative z-10">
                  <ng-container *ngTemplateOutlet="matrixSpotlightHeader"></ng-container>
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div class="flex items-center gap-4">
                      <div class="matrix-icon-float w-14 h-14 rounded-2xl bg-rose-50/90 border border-rose-100 text-rose-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,3px_3px_8px_#dbe4f0] shrink-0">
                        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-rose-600">Broadcasts & Helpdesk</span>
                        <h3 class="text-lg sm:text-xl font-black text-slate-900 mt-0.5">Communication & Support</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Official circulars, notices & parent grievance support tickets</p>
                      </div>
                    </div>
                    <span *ngIf="auth.isServiceEnabled('COMPLAINTS')"
                          class="px-3 py-1 rounded-xl text-xs font-black border shadow-2xs"
                          [ngClass]="(stats?.stats?.pendingComplaints || 0) > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                      {{ stats?.stats?.pendingComplaints ?? 0 }} Open Tickets
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                    <div *ngIf="auth.isServiceEnabled('COMMUNICATION')" class="matrix-tile-1 p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recent Circulars</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ (stats?.recentNotices || []).length }}</div>
                      <div class="text-xs text-indigo-600 font-bold mt-1">Campus Broadcasts</div>
                    </div>
                    <div *ngIf="auth.isServiceEnabled('COMPLAINTS')" class="matrix-tile-2 p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                      <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved Tickets</div>
                      <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{{ modules?.communication?.resolvedComplaints ?? 0 }}</div>
                      <div class="text-xs text-emerald-600 font-bold mt-1">Closed Grievances</div>
                    </div>
                  </div>
                </div>

                <div class="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <a *ngIf="auth.isServiceEnabled('COMPLAINTS')" routerLink="/communication" [queryParams]="{tab: 'complaints'}"
                     class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors">
                    Open Grievance Desk
                  </a>
                  <a routerLink="/communication" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all ml-auto">
                    <span>Notice Board</span>
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>
                  </a>
                </div>
              </div>

            </div>

            <!-- ========================================================== -->
            <!-- RIGHT SIDE: ALL ENABLED FEATURES IN VERTICAL LIST FORMAT   -->
            <!-- ========================================================== -->
            <div class="lg:col-span-5 xl:col-span-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col">
              <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 px-1">
                <div>
                  <h3 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Campus Features</h3>
                  <p class="text-[11px] text-slate-400">Click any feature to preview in center</p>
                </div>
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700">
                  {{ enabledMatrixModules.length }} Active
                </span>
              </div>

              <div class="space-y-2 overflow-y-auto max-h-[420px] pr-0.5">
                <button type="button"
                        *ngFor="let mod of enabledMatrixModules"
                        (click)="selectMatrixModule(mod.id)"
                        class="w-full text-left p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 cursor-pointer group"
                        [ngClass]="activeMatrixModuleId === mod.id
                          ? 'bg-blue-50/90 text-blue-950 border-blue-300 shadow-xs ring-1 ring-blue-500/20 translate-x-1'
                          : 'bg-[#f8fafc] hover:bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:shadow-xs'">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-105"
                         [ngClass]="activeMatrixModuleId === mod.id ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : mod.iconClass">
                      <!-- Module Icons -->
                      <svg *ngIf="mod.id === 'ACADEMICS'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L2 8L12 13L22 8L12 3Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                        <path d="M6 10.5V16.5C6 18.43 8.69 20 12 20C15.31 20 18 18.43 18 16.5V10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                      <svg *ngIf="mod.id === 'DEPARTMENTAL'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 5.5V11.5C4 16.8 7.4 21.6 12 23C16.6 21.6 20 16.8 20 11.5V5.5L12 2Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                        <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6"/>
                      </svg>
                      <svg *ngIf="mod.id === 'FEES'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M2 10h20M7 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                      <svg *ngIf="mod.id === 'TRANSPORT'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="12" rx="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                        <circle cx="7.5" cy="18.5" r="2" stroke="currentColor" stroke-width="1.8"/>
                        <circle cx="16.5" cy="18.5" r="2" stroke="currentColor" stroke-width="1.8"/>
                      </svg>
                      <svg *ngIf="mod.id === 'TIMETABLE'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="17" rx="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                      <svg *ngIf="mod.id === 'ATTENDANCE'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M8.5 12.5L10.8 14.8L15.5 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <svg *ngIf="mod.id === 'HOMEWORK'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                      </svg>
                      <svg *ngIf="mod.id === 'EXAMS'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="3" width="16" height="18" rx="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                      <svg *ngIf="mod.id === 'COMMUNICATION'" class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>

                    <div class="min-w-0">
                      <div class="text-xs font-black truncate"
                           [ngClass]="activeMatrixModuleId === mod.id ? 'text-blue-950' : 'text-slate-900'">
                        {{ mod.title }}
                      </div>
                      <div class="text-[10px] truncate mt-0.5"
                           [ngClass]="activeMatrixModuleId === mod.id ? 'text-blue-700/80' : 'text-slate-500'">
                        {{ mod.subtitle }}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-black border"
                          [ngClass]="activeMatrixModuleId === mod.id ? 'bg-blue-100 text-blue-800 border-blue-200' : mod.badgeClass">
                      {{ mod.badge }}
                    </span>
                    <svg class="w-3.5 h-3.5 transition-transform duration-300"
                         [ngClass]="activeMatrixModuleId === mod.id ? 'text-blue-600 translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Bottom Feed: Recent Campus Circulars & Upcoming Exams (Only shown when activeMatrixModuleId is active) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" *ngIf="activeMatrixModuleId && (auth.isServiceEnabled('COMMUNICATION') || auth.isServiceEnabled('EXAMS'))">
          <div *ngIf="auth.isServiceEnabled('COMMUNICATION')" class="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-base font-bold text-slate-900">Recent Campus Circulars</h2>
                <p class="text-xs text-slate-500">Official announcements broadcast to teachers, parents & staff</p>
              </div>
              <a routerLink="/communication" class="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-[#f8fafc] border border-slate-200/80">
                View All →
              </a>
            </div>
            <div class="divide-y divide-slate-100 mt-2">
              <div *ngFor="let notice of stats?.recentNotices" class="py-3.5 first:pt-2 last:pb-0 flex items-start justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <h3 class="text-sm font-bold text-slate-900">{{ notice.title }}</h3>
                  </div>
                  <p class="text-xs text-slate-600 line-clamp-2 pl-4">{{ notice.content }}</p>
                </div>
                <div class="text-right shrink-0">
                  <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                    {{ notice.target_audience || 'ALL' }}
                  </span>
                  <div class="text-[11px] text-slate-400 mt-1">{{ notice.published_at | date:'mediumDate' }}</div>
                </div>
              </div>
              <div *ngIf="!stats?.recentNotices?.length" class="py-8 text-center text-slate-400 text-xs">
                No recent notices published.
              </div>
            </div>
          </div>

          <div *ngIf="auth.isServiceEnabled('EXAMS')" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 class="text-base font-bold text-slate-900">Upcoming Exams</h2>
                <p class="text-xs text-slate-500">Scheduled assessments</p>
              </div>
              <a routerLink="/exams" class="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-[#f8fafc] border border-slate-200/80">
                Manage →
              </a>
            </div>
            <div class="space-y-3 mt-4">
              <div *ngFor="let exam of stats?.upcomingExams" class="p-3.5 rounded-2xl border border-slate-200/80 bg-[#f8fafc] flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-slate-900">{{ exam.name }}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">Starts: {{ exam.start_date | date:'mediumDate' }}</div>
                </div>
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {{ exam.status }}
                </span>
              </div>
              <div *ngIf="!stats?.upcomingExams?.length" class="py-8 text-center text-slate-400 text-xs">
                No upcoming exams scheduled.
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- ============================================================== -->
      <!-- 2. TEACHER / CLASS TEACHER DASHBOARD VIEW                      -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">

        <!-- Top Teacher Identity & 1-Click Shortcuts Banner -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {{ (auth.currentUser()?.firstName || 'T').charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Welcome, {{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}
                </h1>
                <span *ngIf="isTeacherClassTeacher && teacherClassTeacherSection"
                      class="px-2.5 py-0.5 rounded-xl text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Class Teacher • {{ teacherClassTeacherSection.className }} - {{ teacherClassTeacherSection.sectionName }}
                </span>
                <span *ngIf="!isTeacherClassTeacher"
                      class="px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Subject Faculty
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ formattedToday }} • Active Session:
                <strong class="text-slate-700">{{ auth.activeAcademicSession()?.name || 'Current Session' }}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance"
               class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mark Attendance</span>
            </a>
            <a *ngIf="auth.isServiceEnabled('HOMEWORK')" routerLink="/homework"
               class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
              <span>Post Homework</span>
            </a>
            <a *ngIf="auth.isServiceEnabled('EXAMS')" routerLink="/exams"
               class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
              <span>Enter Marks</span>
            </a>
            <a *ngIf="auth.isServiceEnabled('TIMETABLE')" routerLink="/timetable"
               class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
              <span>My Timetable</span>
            </a>
            <a *ngIf="auth.isServiceEnabled('COMPLAINTS')" routerLink="/communication" [queryParams]="{tab: 'complaints'}"
               class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-2xl border border-rose-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
              <span>Parent Tickets ({{ stats?.teacherData?.openComplaintsCount ?? 0 }})</span>
            </a>
          </div>
        </div>

        <!-- 4 Teacher Scoped Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <!-- Card 1: Assigned Class Strength -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {{ isTeacherClassTeacher ? 'My Class Strength' : 'Assigned Students' }}
              </span>
              <div class="w-9 h-9 rounded-2xl bg-indigo-50/90 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0]">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="7" r="3.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M3.5 19.5C3.5 16.4624 5.96243 14 9 14C12.0376 14 14.5 16.4624 14.5 19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ teacherClassStrength.activeStudents }} Students
            </div>
            <div class="flex items-center justify-between text-[11px] font-bold mt-2 pt-2 border-t border-slate-100">
              <span class="text-indigo-600" *ngIf="teacherClassTeacherSection">
                {{ teacherClassTeacherSection.className }} - {{ teacherClassTeacherSection.sectionName }}
              </span>
              <span class="text-slate-500" *ngIf="!teacherClassTeacherSection">Across Assigned Sections</span>
              <span class="text-slate-600">{{ teacherClassStrength.totalStudents }} Total</span>
            </div>
          </div>

          <!-- Card 2: Today's Roll Call Status -->
          <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Roll Call</span>
              <div class="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0]"
                   [ngClass]="teacherAttendance.isMarked ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M8.5 12.5L10.8 14.8L15.5 9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black mt-2"
                 [ngClass]="teacherAttendance.isMarked ? 'text-slate-900' : 'text-amber-600'">
              {{ teacherAttendance.isMarked ? teacherAttendance.percentage + '%' : 'Not Marked' }}
            </div>
            <div class="flex items-center justify-between text-[11px] font-bold mt-2 pt-2 border-t border-slate-100">
              <div class="flex items-center gap-2" *ngIf="teacherAttendance.isMarked">
                <span class="text-emerald-600">{{ teacherAttendance.presentCount }} Present</span>
                <span class="text-slate-300">•</span>
                <span class="text-rose-600">{{ teacherAttendance.absentCount }} Absent</span>
              </div>
              <span class="text-amber-700" *ngIf="!teacherAttendance.isMarked">Tap to mark register →</span>
            </div>
          </a>

          <!-- Card 3: Today's Teaching Periods -->
          <a *ngIf="auth.isServiceEnabled('TIMETABLE')" routerLink="/timetable"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Classes</span>
              <div class="w-9 h-9 rounded-2xl bg-blue-50/90 border border-blue-100/80 text-blue-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0]">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M12 7.5V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ teacherTimetable.length }} Periods
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-blue-600 font-semibold truncate">
                {{ nextUpcomingPeriod ? ('Next: P' + nextUpcomingPeriod.periodNumber + ' ' + nextUpcomingPeriod.subjectName) : 'Scheduled Today' }}
              </span>
            </div>
          </a>

          <!-- Card 4: Homework & Assessments Summary -->
          <a *ngIf="auth.isServiceEnabled('HOMEWORK')" routerLink="/homework"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Homework & Exams</span>
              <div class="w-9 h-9 rounded-2xl bg-purple-50/90 border border-purple-100/80 text-purple-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0]">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5.5C4 4.67 4.67 4 5.5 4H11C11.55 4 12 4.45 12 5V19C12 18.45 11.55 18 11 18H5.5C4.67 18 4 17.33 4 16.5V5.5Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.7"/>
                  <path d="M20 5.5C20 4.67 19.33 4 18.5 4H13C12.45 4 12 4.45 12 5V19C12 18.45 12.45 18 13 18H18.5C19.33 18 20 17.33 20 16.5V5.5Z" stroke="currentColor" stroke-width="1.7"/>
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ stats?.teacherData?.teacherHomeworkCount ?? 0 }} Diaries
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-purple-600 font-semibold truncate">
                {{ (stats?.upcomingExams || []).length }} Upcoming Exams • {{ teacherSubjects.length }} Subjects
              </span>
            </div>
          </a>
        </div>

        <!-- Teacher Main Workspace: Left (Today's Timetable + Class Students) | Right (Homework + Exams + Notices) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">

            <!-- 1. Today's Teaching Schedule -->
            <div *ngIf="auth.isServiceEnabled('TIMETABLE')"
                 class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 class="text-base font-black text-slate-900">Today's Teaching Timetable</h2>
                  <p class="text-xs text-slate-500">Your scheduled periods & classrooms for {{ formattedToday }}</p>
                </div>
                <a routerLink="/timetable" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  Full Routine →
                </a>
              </div>

              <div *ngIf="teacherTimetable.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                <div *ngFor="let period of teacherTimetable"
                     class="p-4 rounded-2xl border border-slate-200/90 bg-[#f8fafc] hover:bg-white hover:shadow-sm transition-all flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span class="text-[9px] font-bold uppercase opacity-80 leading-none">Period</span>
                      <span class="text-sm font-black leading-tight">{{ period.periodNumber }}</span>
                    </div>
                    <div>
                      <div class="text-xs font-black text-slate-900">{{ period.subjectName }}</div>
                      <div class="text-[11px] font-bold text-indigo-600 mt-0.5">
                        {{ period.className }} - {{ period.sectionName }}
                      </div>
                      <div class="text-[10px] text-slate-400 mt-0.5">
                        {{ period.startTime | slice:0:5 }} – {{ period.endTime | slice:0:5 }}
                        <span *ngIf="period.roomNumber"> • Room {{ period.roomNumber }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="teacherTimetable.length === 0" class="py-8 text-center">
                <p class="text-xs font-bold text-slate-500">No teaching periods scheduled for you today.</p>
                <p class="text-[11px] text-slate-400 mt-0.5">Check the full weekly timetable for other days.</p>
              </div>
            </div>

            <!-- 2. Class Roster & Parent Quick-Contact Directory -->
            <div *ngIf="isTeacherClassTeacher && teacherClassTeacherSection"
                 class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-base font-black text-slate-900">
                      My Class Students & Parent Contacts
                    </h2>
                    <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {{ teacherClassTeacherSection.className }} - {{ teacherClassTeacherSection.sectionName }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Direct parent phone directory & today's attendance status for your homeroom students
                  </p>
                </div>

                <div class="relative w-full sm:w-56">
                  <input type="text" [(ngModel)]="teacherStudentSearch"
                         placeholder="Search student or parent..."
                         class="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8fafc] border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500" />
                  <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div *ngIf="classStudents.length > 0" class="overflow-x-auto mt-3 max-h-96 overflow-y-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th class="py-2.5 px-2">Roll</th>
                      <th class="py-2.5 px-2">Student</th>
                      <th class="py-2.5 px-2">Today</th>
                      <th class="py-2.5 px-2">Parent / Guardian</th>
                      <th class="py-2.5 px-2 text-right">Contact</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-xs">
                    <tr *ngFor="let stu of classStudents" class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-2.5 px-2 font-black text-slate-700">#{{ stu.rollNumber || '-' }}</td>
                      <td class="py-2.5 px-2">
                        <div class="font-bold text-slate-900">{{ stu.fullName }}</div>
                        <div class="text-[10px] font-mono text-slate-400">{{ stu.admissionNumber }}</div>
                      </td>
                      <td class="py-2.5 px-2">
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-black border"
                              [ngClass]="{
                                'bg-emerald-50 text-emerald-700 border-emerald-200': stu.todayAttendance === 'PRESENT',
                                'bg-rose-50 text-rose-700 border-rose-200': stu.todayAttendance === 'ABSENT',
                                'bg-amber-50 text-amber-700 border-amber-200': stu.todayAttendance === 'LATE' || stu.todayAttendance === 'HALF_DAY',
                                'bg-slate-100 text-slate-500 border-slate-200': !stu.todayAttendance || stu.todayAttendance === 'UNMARKED'
                              }">
                          {{ stu.todayAttendance || 'UNMARKED' }}
                        </span>
                      </td>
                      <td class="py-2.5 px-2">
                        <ng-container *ngIf="stu.guardians && stu.guardians.length > 0; else noGuardian">
                          <div class="font-semibold text-slate-800">{{ stu.guardians[0].name }}</div>
                          <div class="text-[10px] text-slate-400 uppercase">{{ stu.guardians[0].relationship || 'Parent' }}</div>
                        </ng-container>
                        <ng-template #noGuardian>
                          <span class="text-slate-400 text-[11px]">Not linked</span>
                        </ng-template>
                      </td>
                      <td class="py-2.5 px-2 text-right">
                        <a *ngIf="stu.guardians?.[0]?.phone"
                           [href]="'tel:' + stu.guardians[0].phone"
                           class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition-colors">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{{ stu.guardians[0].phone }}</span>
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- Right Column: Recent Homework, Upcoming Exams & Campus Circulars -->
          <div class="space-y-6">

            <!-- Recent Homework Posted -->
            <div *ngIf="auth.isServiceEnabled('HOMEWORK')"
                 class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 class="text-sm font-black text-slate-900">Recent Homework</h2>
                  <p class="text-[11px] text-slate-500">Assignments posted for your classes</p>
                </div>
                <a routerLink="/homework" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">Post New →</a>
              </div>
              <div class="space-y-2.5 mt-3">
                <div *ngFor="let hw of (stats?.teacherData?.recentHomework || []).slice(0, 3)"
                     class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/80">
                  <div class="text-xs font-bold text-slate-900 truncate">{{ hw.title }}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">
                    Due: {{ hw.due_date ? (hw.due_date | date:'mediumDate') : 'No due date' }}
                  </div>
                </div>
                <div *ngIf="!stats?.teacherData?.recentHomework?.length" class="py-5 text-center text-xs text-slate-400">
                  No recent homework dispatches.
                </div>
              </div>
            </div>

            <!-- Teacher Notices -->
            <div *ngIf="auth.isServiceEnabled('COMMUNICATION')"
                 class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 class="text-sm font-black text-slate-900">Faculty Notices</h2>
                  <p class="text-[11px] text-slate-500">Circulars for teachers & staff</p>
                </div>
                <a routerLink="/communication" class="text-xs font-bold text-slate-600 hover:text-slate-900">View All →</a>
              </div>
              <div class="divide-y divide-slate-100 mt-2">
                <div *ngFor="let notice of stats?.recentNotices" class="py-3 first:pt-2 last:pb-0">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="text-xs font-bold text-slate-900">{{ notice.title }}</h3>
                    <span class="text-[10px] text-slate-400 shrink-0">{{ notice.published_at | date:'shortDate' }}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 line-clamp-2 mt-1">{{ notice.content }}</p>
                </div>
                <div *ngIf="!stats?.recentNotices?.length" class="py-6 text-center text-slate-400 text-xs">
                  No recent circulars published.
                </div>
              </div>
            </div>

          </div>
        </div>

      </ng-container>

      <!-- ============================================================== -->
      <!-- 3. PARENT / GUARDIAN MULTI-CHILD DASHBOARD VIEW                -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isParent()">

        <!-- Top Family Overview Banner & Multi-Child Switcher -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,2px_2px_5px_#dbe4f0] shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle cx="8.5" cy="7" r="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                  <circle cx="16" cy="8" r="2.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.7"/>
                  <path d="M3 19C3 16.2 5.4 14 8.5 14C11.6 14 14 16.2 14 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M14.5 19C14.5 16.8 16.3 15 18.5 15C20.4 15 22 16.5 22 18.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Parent & Family Portal
                  </span>
                  <span class="text-xs font-semibold text-slate-500">{{ formattedToday }}</span>
                </div>
                <h1 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                  Hello, {{ auth.currentUser()?.firstName || 'Parent' }}
                  <span *ngIf="parentChildren.length > 1" class="text-sm font-bold text-indigo-600 ml-1">
                    ({{ parentChildren.length }} Children Enrolled)
                  </span>
                </h1>
                <p class="text-xs text-slate-500">
                  Track daily attendance, class timetable, homework, exam marks, fee dues, and school bus routes for all your children in one place.
                </p>
              </div>
            </div>

            <!-- Parent Quick Shortcuts -->
            <div class="flex items-center gap-2 flex-wrap">
              <a *ngIf="auth.isServiceEnabled('FEES')" routerLink="/fees"
                 class="px-3.5 py-2 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
                <span>Fee Invoices</span>
              </a>
              <a *ngIf="auth.isServiceEnabled('COMPLAINTS')" routerLink="/communication" [queryParams]="{tab: 'complaints'}"
                 class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5">
                <span>Raise / Track Complaint</span>
              </a>
            </div>
          </div>

          <!-- Multi-Child Switcher Pills (Shows when 1 or more children exist) -->
          <div *ngIf="parentChildren.length > 0" class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <button *ngIf="parentChildren.length > 1"
                      (click)="selectChild('ALL')"
                      class="px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border"
                      [ngClass]="selectedChildId === 'ALL' || !selectedChildId
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-[#f8fafc] text-slate-700 border-slate-200 hover:bg-slate-100'">
                <span>All Children ({{ parentChildren.length }})</span>
              </button>

              <button *ngFor="let c of parentChildren"
                      (click)="selectChild(c.studentId || c.id)"
                      class="px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border"
                      [ngClass]="selectedChildId === (c.studentId || c.id)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-[#f8fafc] text-slate-700 border-slate-200 hover:bg-slate-100'">
                <span class="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center font-black text-[10px]">
                  {{ (c.name || 'S').charAt(0) }}
                </span>
                <span>{{ c.name }}</span>
                <span class="text-[10px] opacity-80">({{ c.className }}-{{ c.sectionName }})</span>
              </button>
            </div>

            <!-- Family Summary Strip -->
            <div class="flex items-center gap-3 text-xs font-bold text-slate-600 flex-wrap" *ngIf="stats?.parentData?.familySummary as fam">
              <span *ngIf="auth.isServiceEnabled('ATTENDANCE')" class="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                Present Today: {{ fam.presentTodayCount }}/{{ fam.totalChildren }}
              </span>
              <span *ngIf="auth.isServiceEnabled('HOMEWORK')" class="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                Active Homework: {{ fam.totalPendingHomework }}
              </span>
              <span *ngIf="auth.isServiceEnabled('FEES')" class="px-2.5 py-1 rounded-xl border"
                    [ngClass]="fam.totalPendingFees > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                Fee Dues: ₹{{ fam.totalPendingFees | number:'1.0-0' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Per-Child Comprehensive Activity & Service Overview Cards -->
        <div *ngFor="let child of displayedChildren"
             class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-5">

          <!-- Child Identity Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                {{ (child.name || 'S').charAt(0) }}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-base sm:text-lg font-black text-slate-900 tracking-tight">{{ child.name }}</h2>
                  <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {{ child.className || 'Class' }} - {{ child.sectionName || 'A' }}
                  </span>
                  <span *ngIf="auth.isServiceEnabled('ATTENDANCE')"
                        class="px-2.5 py-0.5 rounded-lg text-[10px] font-black border"
                        [ngClass]="{
                          'bg-emerald-50 text-emerald-700 border-emerald-200': child.attendance?.todayStatus === 'PRESENT',
                          'bg-rose-50 text-rose-700 border-rose-200': child.attendance?.todayStatus === 'ABSENT',
                          'bg-amber-50 text-amber-700 border-amber-200': child.attendance?.todayStatus === 'LATE',
                          'bg-slate-100 text-slate-600 border-slate-200': !child.attendance?.todayStatus || child.attendance?.todayStatus === 'UNMARKED'
                        }">
                    Today: {{ child.attendance?.todayStatus || 'UNMARKED' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Roll No: <strong class="text-slate-800">#{{ child.rollNumber || 1 }}</strong> •
                  Admission ID: <strong class="text-slate-800 font-mono">{{ child.admissionNumber || 'N/A' }}</strong>
                </p>
              </div>
            </div>

            <!-- Child Module Action Shortcuts -->
            <div class="flex items-center gap-2 flex-wrap">
              <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance"
                 class="px-3 py-1.5 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all">
                Attendance
              </a>
              <a *ngIf="auth.isServiceEnabled('TIMETABLE')" routerLink="/timetable"
                 class="px-3 py-1.5 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all">
                Timetable
              </a>
              <a *ngIf="auth.isServiceEnabled('HOMEWORK')" routerLink="/homework"
                 class="px-3 py-1.5 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all">
                Homework
              </a>
              <a *ngIf="auth.isServiceEnabled('EXAMS')" routerLink="/exams"
                 class="px-3 py-1.5 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all">
                Report Card
              </a>
              <a *ngIf="auth.isServiceEnabled('FEES')" routerLink="/fees"
                 class="px-3 py-1.5 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all">
                Fees
              </a>
              <a *ngIf="auth.isServiceEnabled('TRANSPORT')" routerLink="/transport"
                 class="px-3 py-1.5 bg-[#f8fafc] hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all">
                Transport
              </a>
            </div>
          </div>

          <!-- Child 6-Module Visual Summary Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            <!-- 1. Child Attendance Summary -->
            <div *ngIf="auth.isServiceEnabled('ATTENDANCE')"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">Attendance Summary</span>
                <span class="text-xs font-black text-emerald-600">{{ child.attendance?.percentage || '100.0' }}%</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="p-2 rounded-xl bg-white border border-slate-200/70">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Present</div>
                  <div class="text-sm font-black text-emerald-700">{{ child.attendance?.presentDays ?? 0 }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white border border-slate-200/70">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Absent</div>
                  <div class="text-sm font-black text-rose-700">{{ child.attendance?.absentDays ?? 0 }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white border border-slate-200/70">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Working</div>
                  <div class="text-sm font-black text-slate-800">{{ child.attendance?.totalDays ?? 0 }}</div>
                </div>
              </div>
              <a routerLink="/attendance" class="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center justify-between">
                <span>View monthly attendance log</span>
                <span>→</span>
              </a>
            </div>

            <!-- 2. Child Today's Timetable -->
            <div *ngIf="auth.isServiceEnabled('TIMETABLE')"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">Today's Class Schedule</span>
                <span class="text-[11px] font-bold text-blue-600">{{ (child.todayTimetable || []).length }} Periods</span>
              </div>
              <div class="space-y-1.5" *ngIf="(child.todayTimetable || []).length > 0; else noChildPeriods">
                <div *ngFor="let p of (child.todayTimetable || []).slice(0, 3)"
                     class="px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">P{{ p.periodNumber }} • {{ p.subjectName }}</span>
                  <span class="text-[10px] text-slate-500">{{ p.startTime }} - {{ p.endTime }}</span>
                </div>
              </div>
              <ng-template #noChildPeriods>
                <div class="py-3 text-center text-[11px] text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  View full weekly class timetable
                </div>
              </ng-template>
              <a routerLink="/timetable" class="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center justify-between">
                <span>Open class timetable</span>
                <span>→</span>
              </a>
            </div>

            <!-- 3. Child Homework & Diary -->
            <div *ngIf="auth.isServiceEnabled('HOMEWORK')"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">Homework & Diary</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                  {{ child.homework?.pendingCount ?? 0 }} Active
                </span>
              </div>
              <div class="space-y-1.5" *ngIf="(child.homework?.recentItems || []).length > 0; else noChildHw">
                <div *ngFor="let hw of (child.homework?.recentItems || []).slice(0, 2)"
                     class="px-3 py-2 rounded-xl bg-white border border-slate-200/70">
                  <div class="text-xs font-bold text-slate-800 truncate">{{ hw.title }}</div>
                  <div class="text-[10px] text-slate-500">{{ hw.subjectName }} • Due: {{ hw.dueDate | date:'shortDate' }}</div>
                </div>
              </div>
              <ng-template #noChildHw>
                <div class="py-3 text-center text-[11px] text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  No pending homework assigned
                </div>
              </ng-template>
              <a routerLink="/homework" class="text-[11px] font-bold text-sky-600 hover:underline inline-flex items-center justify-between">
                <span>Check homework diary</span>
                <span>→</span>
              </a>
            </div>

            <!-- 4. Child Fee Status & Invoices -->
            <div *ngIf="auth.isServiceEnabled('FEES')"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">Fee Dues & Receipts</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black border"
                      [ngClass]="(child.fees?.pendingAmount || 0) > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                  {{ (child.fees?.pendingAmount || 0) > 0 ? ('₹' + (child.fees?.pendingAmount | number:'1.0-0') + ' Due') : 'No Dues' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-2 rounded-xl bg-white border border-slate-200/70">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Paid</div>
                  <div class="text-xs font-black text-emerald-700">₹{{ (child.fees?.totalPaid ?? 0) | number:'1.0-0' }}</div>
                </div>
                <div class="p-2 rounded-xl bg-white border border-slate-200/70">
                  <div class="text-[10px] text-slate-400 font-bold uppercase">Balance</div>
                  <div class="text-xs font-black text-rose-700">₹{{ (child.fees?.pendingAmount ?? 0) | number:'1.0-0' }}</div>
                </div>
              </div>
              <a routerLink="/fees" class="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center justify-between">
                <span>View fee invoices & receipts</span>
                <span>→</span>
              </a>
            </div>

            <!-- 5. Child School Bus / Transport Pass -->
            <div *ngIf="auth.isServiceEnabled('TRANSPORT')"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">School Bus & Transit</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black border"
                      [ngClass]="child.transport?.isSubscribed ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-500 border-slate-200'">
                  {{ child.transport?.isSubscribed ? child.transport?.busNumber : 'Own Transport' }}
                </span>
              </div>
              <div *ngIf="child.transport?.isSubscribed; else noTransportPass" class="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
                <div class="text-xs font-bold text-slate-800">{{ child.transport?.routeName }}</div>
                <div class="text-[10px] text-slate-500">
                  Stop: <strong class="text-slate-700">{{ child.transport?.stopName }}</strong> • Pickup: {{ child.transport?.pickupTime }}
                </div>
              </div>
              <ng-template #noTransportPass>
                <div class="py-3 text-center text-[11px] text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  No active bus pass assigned
                </div>
              </ng-template>
              <a routerLink="/transport" class="text-[11px] font-bold text-cyan-700 hover:underline inline-flex items-center justify-between">
                <span>Transport route & stop details</span>
                <span>→</span>
              </a>
            </div>

            <!-- 6. Child Exams & Results -->
            <div *ngIf="auth.isServiceEnabled('EXAMS')"
                 class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex flex-col justify-between space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">Exams & Report Cards</span>
                <span class="text-[11px] font-bold text-violet-600">{{ (stats?.upcomingExams || []).length }} Scheduled</span>
              </div>
              <div class="space-y-1.5" *ngIf="(stats?.upcomingExams || []).length > 0; else noChildExams">
                <div *ngFor="let ex of (stats?.upcomingExams || []).slice(0, 2)"
                     class="px-3 py-2 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800 truncate">{{ ex.name }}</span>
                  <span class="text-[10px] text-slate-500 shrink-0">{{ ex.start_date | date:'shortDate' }}</span>
                </div>
              </div>
              <ng-template #noChildExams>
                <div class="py-3 text-center text-[11px] text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  Check published term results
                </div>
              </ng-template>
              <a routerLink="/exams" class="text-[11px] font-bold text-violet-600 hover:underline inline-flex items-center justify-between">
                <span>View marks & report card</span>
                <span>→</span>
              </a>
            </div>

          </div>
        </div>

        <!-- Parent Bottom Section: School Circulars & My Support Tickets -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div *ngIf="auth.isServiceEnabled('COMMUNICATION')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-sm font-black text-slate-900">School Circulars & Notices</h3>
                <p class="text-[11px] text-slate-500">Announcements for parents & guardians</p>
              </div>
              <a routerLink="/communication" class="text-xs font-bold text-indigo-600 hover:underline">All Notices →</a>
            </div>
            <div class="divide-y divide-slate-100 mt-2">
              <div *ngFor="let n of stats?.recentNotices" class="py-3 first:pt-2 last:pb-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-900">{{ n.title }}</span>
                  <span class="text-[10px] text-slate-400">{{ n.published_at | date:'mediumDate' }}</span>
                </div>
                <p class="text-[11px] text-slate-600 line-clamp-2 mt-1">{{ n.content }}</p>
              </div>
              <div *ngIf="!stats?.recentNotices?.length" class="py-6 text-center text-xs text-slate-400">
                No recent notices published.
              </div>
            </div>
          </div>

          <div *ngIf="auth.isServiceEnabled('COMPLAINTS')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-sm font-black text-slate-900">Parent Helpdesk & Complaints</h3>
                <p class="text-[11px] text-slate-500">Directly communicate with class teacher or principal</p>
              </div>
              <a routerLink="/communication" [queryParams]="{tab: 'complaints'}"
                 class="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold">
                + New Request
              </a>
            </div>
            <div class="space-y-2.5 mt-3">
              <div *ngFor="let c of (stats?.parentData?.complaints || []).slice(0, 3)"
                   class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <div class="text-xs font-bold text-slate-900">{{ c.subject }}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">#{{ c.ticket_number }} • {{ c.category }}</div>
                </div>
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black border"
                      [ngClass]="c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'">
                  {{ c.status }}
                </span>
              </div>
              <div *ngIf="!stats?.parentData?.complaints?.length" class="py-6 text-center text-xs text-slate-400">
                No support tickets raised yet.
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <!-- ============================================================== -->
      <!-- 4. DEPARTMENTAL STAFF & STUDENT DEDICATED DASHBOARD VIEW       -->
      <!-- (Fee Dept, Transport Dept, Custom Staff Roles, Student)        -->
      <!-- ============================================================== -->
      <ng-container *ngIf="!auth.isAdmin() && !auth.isTeacher() && !auth.isParent()">

        <!-- Departmental / Role Header Banner -->
        <div class="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
              {{ (auth.currentUser()?.firstName || 'U').charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ auth.currentUser()?.department || auth.currentUser()?.roleName || auth.currentUser()?.role || 'Department Desk' }}
                </span>
                <span class="text-xs font-semibold text-slate-500">{{ formattedToday }}</span>
              </div>
              <h1 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                Welcome, {{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}
              </h1>
              <p class="text-xs text-slate-500">
                Your departmental operations dashboard, live analytics, and quick-action shortcuts.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <a *ngIf="auth.isSectionAllowedForUser('fees') && auth.isServiceEnabled('FEES')" routerLink="/fees"
               class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all">
              Open Fee Management
            </a>
            <a *ngIf="auth.isSectionAllowedForUser('transport') && auth.isServiceEnabled('TRANSPORT')" routerLink="/transport"
               class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all">
              Open Transport Fleet
            </a>
            <a *ngIf="auth.isSectionAllowedForUser('communication') && auth.isServiceEnabled('COMMUNICATION')" routerLink="/communication"
               class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all">
              Campus Notices
            </a>
          </div>
        </div>

        <!-- Departmental Modules Grid (Dynamically renders all modules allowed for this staff role) -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          <!-- Fee Department Workspace Card -->
          <div *ngIf="auth.isSectionAllowedForUser('fees') && auth.isServiceEnabled('FEES')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-slate-900">Fee Collection & Invoicing</h3>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {{ modules?.fees?.collectionRate ?? 0 }}% Collected
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 mt-4">
                <div class="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div class="text-[10px] font-bold text-emerald-700 uppercase">Collected</div>
                  <div class="text-lg font-black text-emerald-900 mt-0.5">₹{{ (modules?.fees?.totalCollected ?? 0) | number:'1.0-0' }}</div>
                </div>
                <div class="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <div class="text-[10px] font-bold text-rose-700 uppercase">Outstanding Dues</div>
                  <div class="text-lg font-black text-rose-900 mt-0.5">₹{{ (modules?.fees?.totalOutstanding ?? 0) | number:'1.0-0' }}</div>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-500 mt-3">
                <span>Total Invoices: <strong class="text-slate-800">{{ modules?.fees?.totalInvoicesCount ?? 0 }}</strong></span>
                <span>Pending: <strong class="text-rose-700">{{ modules?.fees?.unpaidCount ?? 0 }}</strong></span>
              </div>
            </div>
            <a routerLink="/fees" class="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-colors">
              Manage Fee Invoices & Receipts →
            </a>
          </div>

          <!-- Transport Department Workspace Card -->
          <div *ngIf="auth.isSectionAllowedForUser('transport') && auth.isServiceEnabled('TRANSPORT')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-slate-900">Transport & Fleet Desk</h3>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {{ modules?.transport?.fleetOccupancyRate ?? 0 }}% Occupancy
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2.5 mt-4">
                <div class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/70">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Vehicles</div>
                  <div class="text-base font-black text-slate-900 mt-0.5">{{ modules?.transport?.totalVehicles ?? 0 }}</div>
                </div>
                <div class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/70">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Routes</div>
                  <div class="text-base font-black text-slate-900 mt-0.5">{{ modules?.transport?.totalRoutes ?? 0 }}</div>
                </div>
                <div class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/70">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Passes</div>
                  <div class="text-base font-black text-cyan-700 mt-0.5">{{ modules?.transport?.subscribedStudentsCount ?? 0 }}</div>
                </div>
              </div>
            </div>
            <a routerLink="/transport" class="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-colors">
              Manage Buses, Routes & Passes →
            </a>
          </div>

          <!-- Student / Academics Directory Card -->
          <div *ngIf="auth.isSectionAllowedForUser('academics') && auth.isServiceEnabled('ACADEMICS')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-slate-900">Campus Directory</h3>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {{ stats?.stats?.totalClasses ?? 0 }} Classes
                </span>
              </div>
              <div class="grid grid-cols-2 gap-3 mt-4">
                <div class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/70">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Active Students</div>
                  <div class="text-lg font-black text-slate-900 mt-0.5">{{ stats?.stats?.activeStudents ?? 0 }}</div>
                </div>
                <div class="p-3 rounded-2xl bg-[#f8fafc] border border-slate-200/70">
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Sections</div>
                  <div class="text-lg font-black text-slate-900 mt-0.5">{{ modules?.academics?.totalSections ?? 0 }}</div>
                </div>
              </div>
            </div>
            <a routerLink="/academics" class="w-full py-2.5 rounded-2xl bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold text-center transition-colors">
              View Student & Class Directory →
            </a>
          </div>

          <!-- Attendance Overview Card (if permitted) -->
          <div *ngIf="auth.isSectionAllowedForUser('attendance') && auth.isServiceEnabled('ATTENDANCE')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-slate-900">Attendance Register</h3>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {{ stats?.stats?.attendanceTodayPercentage || '0.0' }}% Today
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                {{ stats?.stats?.attendanceMarkedCount ?? 0 }} students marked today.
              </p>
            </div>
            <a routerLink="/attendance" class="w-full py-2.5 rounded-2xl bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold text-center transition-colors">
              Open Attendance →
            </a>
          </div>

          <!-- Timetable Overview Card (if permitted) -->
          <div *ngIf="auth.isSectionAllowedForUser('timetable') && auth.isServiceEnabled('TIMETABLE')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-slate-900">Class Timetables</h3>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                  {{ modules?.timetable?.totalPeriods ?? 0 }} Periods
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                Weekly schedule across {{ modules?.timetable?.configuredSectionsCount ?? 0 }} sections.
              </p>
            </div>
            <a routerLink="/timetable" class="w-full py-2.5 rounded-2xl bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold text-center transition-colors">
              Open Timetable →
            </a>
          </div>

          <!-- Campus Circulars & Support Card -->
          <div *ngIf="auth.isServiceEnabled('COMMUNICATION')"
               class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-base font-black text-slate-900">Campus Circulars</h3>
                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                  {{ (stats?.recentNotices || []).length }} Notices
                </span>
              </div>
              <div class="space-y-2 mt-3">
                <div *ngFor="let n of (stats?.recentNotices || []).slice(0, 2)" class="p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200/70">
                  <div class="text-xs font-bold text-slate-900 truncate">{{ n.title }}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">{{ n.published_at | date:'mediumDate' }}</div>
                </div>
                <div *ngIf="!stats?.recentNotices?.length" class="text-xs text-slate-400 py-3 text-center">
                  No recent notices.
                </div>
              </div>
            </div>
            <a routerLink="/communication" class="w-full py-2.5 rounded-2xl bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold text-center transition-colors">
              Open Communication Hub →
            </a>
          </div>

        </div>

      </ng-container>

    </div>
  `,
  styles: [`
    @keyframes matrixSpotlightIn {
      0% {
        opacity: 0;
        transform: perspective(1000px) translateY(18px) scale(0.95) rotateX(4deg);
        filter: blur(4px);
      }
      65% {
        opacity: 1;
        transform: perspective(1000px) translateY(-3px) scale(1.008) rotateX(0deg);
        filter: blur(0px);
      }
      100% {
        opacity: 1;
        transform: perspective(1000px) translateY(0) scale(1) rotateX(0deg);
        filter: blur(0px);
      }
    }

    @keyframes matrixTilePop {
      0% {
        opacity: 0;
        transform: translateY(14px) scale(0.94);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes matrixIconBounce {
      0% {
        transform: scale(0.75) rotate(-8deg);
      }
      60% {
        transform: scale(1.08) rotate(3deg);
      }
      100% {
        transform: scale(1) rotate(0deg);
      }
    }

    @keyframes matrixBarGrow {
      0% {
        transform: scaleX(0);
      }
      100% {
        transform: scaleX(1);
      }
    }

    .matrix-spotlight-enter {
      animation: matrixSpotlightIn 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      transform-origin: center top;
    }

    .matrix-icon-float {
      animation: matrixIconBounce 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .matrix-tile-1 {
      opacity: 0;
      animation: matrixTilePop 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards;
    }

    .matrix-tile-2 {
      opacity: 0;
      animation: matrixTilePop 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.16s forwards;
    }

    .matrix-tile-3 {
      opacity: 0;
      animation: matrixTilePop 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.24s forwards;
    }

    .matrix-bar-grow {
      transform-origin: left center;
      animation: matrixBarGrow 0.65s cubic-bezier(0.22, 1, 0.36, 1) 0.18s backwards;
    }
  `],
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  stats: DashboardStats | null = null;
  selectedChildId = 'ALL';
  teacherStudentSearch = '';
  selectedMatrixModuleId: string | null = null;

  constructor() {
    effect(() => {
      const activeSession = this.auth.activeAcademicSession();
      this.loadDashboardStats(activeSession?.id);
    });
  }

  get modules() {
    return this.stats?.modulesOverview || null;
  }

  get enabledMatrixModules(): Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    iconClass: string;
    badgeClass: string;
  }> {
    const UNIFIED_ICON = 'bg-indigo-50/90 border-indigo-100/80 text-indigo-600';
    const UNIFIED_BADGE = 'bg-indigo-50/80 text-indigo-700 border-indigo-200/70';

    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      iconClass: string;
      badgeClass: string;
    }> = [];

    if (this.auth.isServiceEnabled('ACADEMICS')) {
      list.push({
        id: 'ACADEMICS',
        title: 'Academics & Enrollment',
        subtitle: 'Classes, sections, subjects & students',
        badge: `${this.stats?.stats?.totalClasses ?? 0} Grades`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isSectionAllowedForUser('departmental-users')) {
      list.push({
        id: 'DEPARTMENTAL',
        title: 'Departmental Staff',
        subtitle: 'Fee desk, transport officers & roles',
        badge: `${this.modules?.departmental?.activeUsers ?? 0} Active`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('FEES')) {
      list.push({
        id: 'FEES',
        title: 'Fee Management',
        subtitle: 'Invoices, receipts & dues collection',
        badge: `${this.modules?.fees?.collectionRate ?? 0}% Collected`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('TRANSPORT')) {
      list.push({
        id: 'TRANSPORT',
        title: 'Transport Department',
        subtitle: 'Buses, transit routes, stops & passes',
        badge: `${this.modules?.transport?.fleetOccupancyRate ?? 0}% Occupancy`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('TIMETABLE')) {
      list.push({
        id: 'TIMETABLE',
        title: 'Class Timetables',
        subtitle: 'Weekly period grids & teacher schedules',
        badge: `${this.modules?.timetable?.totalPeriods ?? 0} Periods`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('ATTENDANCE')) {
      const isMarked = this.modules?.attendance?.isMarkedToday;
      list.push({
        id: 'ATTENDANCE',
        title: 'Daily Attendance',
        subtitle: 'Roll call registers & absentee tracking',
        badge: isMarked ? `${this.modules?.attendance?.todayPercentage}% Present` : 'Awaiting Roll Call',
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('HOMEWORK')) {
      list.push({
        id: 'HOMEWORK',
        title: 'Homework & Diaries',
        subtitle: 'Daily classwork & homework dispatches',
        badge: `${this.modules?.homework?.activeHomework ?? 0} Active`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('EXAMS')) {
      list.push({
        id: 'EXAMS',
        title: 'Exams & Report Cards',
        subtitle: 'Term schedules, marksheets & grading',
        badge: `${(this.stats?.upcomingExams || []).length} Scheduled`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    if (this.auth.isServiceEnabled('COMMUNICATION') || this.auth.isServiceEnabled('COMPLAINTS')) {
      const openTickets = this.stats?.stats?.pendingComplaints ?? 0;
      list.push({
        id: 'COMMUNICATION',
        title: 'Communication & Support',
        subtitle: 'Circulars, notices & parent tickets',
        badge: `${openTickets} Open`,
        iconClass: UNIFIED_ICON,
        badgeClass: UNIFIED_BADGE,
      });
    }

    return list;
  }

  get activeMatrixModuleId(): string | null {
    if (!this.selectedMatrixModuleId) return null;
    const enabled = this.enabledMatrixModules;
    if (enabled.some((m) => m.id === this.selectedMatrixModuleId)) {
      return this.selectedMatrixModuleId;
    }
    return null;
  }

  get activeMatrixModuleIndex(): number {
    const activeId = this.activeMatrixModuleId;
    if (!activeId) return 0;
    const idx = this.enabledMatrixModules.findIndex((m) => m.id === activeId);
    return idx >= 0 ? idx : 0;
  }

  selectMatrixModule(id: string) {
    if (this.selectedMatrixModuleId === id) {
      this.selectedMatrixModuleId = null;
    } else {
      this.selectedMatrixModuleId = id;
    }
  }

  closeMatrixModule() {
    this.selectedMatrixModuleId = null;
  }

  stepMatrixModule(delta: number) {
    const enabled = this.enabledMatrixModules;
    if (!enabled.length) return;
    if (!this.activeMatrixModuleId) {
      this.selectedMatrixModuleId = enabled[0].id;
      return;
    }
    const nextIdx = (this.activeMatrixModuleIndex + delta + enabled.length) % enabled.length;
    this.selectedMatrixModuleId = enabled[nextIdx].id;
  }

  get formattedToday(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  }

  get isTeacherClassTeacher(): boolean {
    return !!(this.stats?.teacherData?.isClassTeacher || this.auth.isClassTeacher());
  }

  get teacherClassTeacherSection() {
    return (
      this.stats?.teacherData?.classTeacherSection ||
      this.auth.currentUser()?.teachingScope?.classTeacherSections?.[0] ||
      null
    );
  }

  get teacherClassStrength() {
    return (
      this.stats?.teacherData?.assignedClassStrength || {
        activeStudents: this.stats?.stats?.activeStudents || 0,
        inactiveStudents: this.stats?.stats?.inactiveStudents || 0,
        totalStudents: this.stats?.stats?.totalStudents || 0,
      }
    );
  }

  get teacherAttendance() {
    return (
      this.stats?.teacherData?.todayClassAttendance || {
        isMarked: (this.stats?.stats?.attendanceMarkedCount || 0) > 0,
        percentage: this.stats?.stats?.attendanceTodayPercentage || '0.0',
        presentCount: this.stats?.stats?.attendanceMarkedCount || 0,
        absentCount: 0,
        lateCount: 0,
        totalCount: this.stats?.stats?.totalStudents || 0,
      }
    );
  }

  get teacherTimetable(): TeacherTimetablePeriod[] {
    return this.stats?.teacherData?.todayTimetable || [];
  }

  get nextUpcomingPeriod(): TeacherTimetablePeriod | null {
    const list = this.teacherTimetable;
    return list.length > 0 ? list[0] : null;
  }

  get teacherSubjects(): TeacherSubjectAssignment[] {
    return this.stats?.teacherData?.subjectAssignments || [];
  }

  get teacherSubjectsSummary(): string {
    const subs = this.teacherSubjects;
    if (!subs || subs.length === 0) return 'No subjects mapped';
    const names = Array.from(new Set(subs.map((s) => s.subjectName)));
    return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
  }

  get classStudents(): TeacherStudentItem[] {
    const list = this.stats?.teacherData?.classStudents || [];
    if (!this.teacherStudentSearch.trim()) return list;
    const q = this.teacherStudentSearch.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.admissionNumber?.toLowerCase().includes(q) ||
        String(s.rollNumber || '').includes(q) ||
        s.guardians?.some((g) => g.name?.toLowerCase().includes(q) || g.phone?.includes(q))
    );
  }

  get parentChildren(): ParentChildDashboardItem[] {
    return this.stats?.parentData?.children || [];
  }

  get displayedChildren(): ParentChildDashboardItem[] {
    const list = this.parentChildren;
    if (this.selectedChildId === 'ALL' || !this.selectedChildId) {
      return list;
    }
    return list.filter((c) => (c.studentId || c.id) === this.selectedChildId);
  }

  selectChild(id: string) {
    this.selectedChildId = id;
  }

  ngOnInit() {
    if (!this.auth.currentUser()) {
      this.auth.fetchProfile().subscribe();
    }
  }

  loadDashboardStats(academicYearId?: string) {
    const params = academicYearId ? { academicYearId } : undefined;
    this.api.get<DashboardStats>('dashboard/overview', params).subscribe({
      next: (res) => {
        this.stats = res;
        if (res?.campusInfo) {
          this.auth.updateCurrentSchool(res.campusInfo);
        }
      },
    });
  }
}
