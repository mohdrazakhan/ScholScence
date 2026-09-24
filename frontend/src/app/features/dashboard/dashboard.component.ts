import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, TeacherTimetablePeriod, TeacherSubjectAssignment, TeacherStudentItem } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- ============================================================== -->
      <!-- 1. ADMIN & PRINCIPAL DASHBOARD VIEW                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isAdmin()">
        <!-- 4 Primary Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <!-- Card 1: Active Students (Active | Inactive | Total) -->
          <a routerLink="/academics" [queryParams]="{tab: 'students'}"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</span>
              <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ stats?.stats?.activeStudents ?? 0 }}</div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 flex-wrap gap-1">
              <div class="flex items-center gap-1.5 text-[11px] font-bold">
                <span class="text-emerald-600 inline-flex items-center gap-1" title="Active Students">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {{ stats?.stats?.activeStudents ?? 0 }} Active
                </span>
                <span class="text-slate-300 font-normal">|</span>
                <span class="text-rose-600 inline-flex items-center gap-1" title="Inactive Students">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {{ stats?.stats?.inactiveStudents ?? 0 }} Inactive
                </span>
                <span class="text-slate-300 font-normal">|</span>
                <span class="text-slate-700" title="Total Enrolled Students">
                  {{ stats?.stats?.totalStudents ?? 0 }} Total
                </span>
              </div>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors ml-auto">&rarr;</span>
            </div>
          </a>

          <!-- Card 2: Faculty & Staff -->
          <a routerLink="/academics" [queryParams]="{tab: 'staff'}"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faculty & Staff</span>
              <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalTeachers ?? 0 }} Staff</div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-slate-500 font-semibold">Teachers & Admins</span>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors">Directory &rarr;</span>
            </div>
          </a>

          <!-- Card 3: Classes & Sections -->
          <a routerLink="/academics"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classes Configured</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalClasses ?? 0 }} Classes</div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-blue-600 font-semibold">Grade Levels</span>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors">Manage &rarr;</span>
            </div>
          </a>

          <!-- Card 4: Today Attendance -->
          <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ (stats?.stats?.totalStudents || 0) > 0 ? (stats?.stats?.attendanceTodayPercentage || '0.0') + '%' : 'Ready' }}
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-slate-500 font-semibold">Daily Register</span>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors">Record Now &rarr;</span>
            </div>
          </a>

        </div>

        <!-- Main Dashboard 2-Column Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Campus Circulars & Announcements -->
          <div class="lg:col-span-2 space-y-4">
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
              <div class="p-5 sm:px-6 sm:py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shadow-xs">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Campus Circulars & Notices</h3>
                    <p class="text-[11px] text-slate-400 font-medium">Broadcast announcements, official circulars & student notices</p>
                  </div>
                </div>

                <a *ngIf="auth.isServiceEnabled('COMMUNICATION')" routerLink="/communication"
                   class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                  <span>+ New Notice</span>
                </a>
              </div>

              <!-- Circulars Content List -->
              <div class="p-5 divide-y divide-slate-100">
                <div *ngFor="let notice of stats?.recentNotices" class="py-4 first:pt-0 last:pb-0">
                  <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {{ notice.target_audience }}
                        </span>
                        <span class="text-[11px] text-slate-400">• {{ notice.published_at | date:'mediumDate' }}</span>
                      </div>
                      <h4 class="text-xs sm:text-sm font-black text-slate-900 leading-snug">{{ notice.title }}</h4>
                      <p class="text-xs text-slate-600 leading-relaxed">{{ notice.content }}</p>
                    </div>
                  </div>
                </div>

                <div *ngIf="!stats?.recentNotices || stats?.recentNotices?.length === 0" class="py-12 text-center text-xs text-slate-400 space-y-2">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl shadow-inner">
                    📢
                  </div>
                  <div class="font-bold text-slate-700">No active circulars posted yet</div>
                  <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Publish circulars or important notices for students, parents, and teachers using the Communication module.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right 1 Col: Quick Access -->
          <div class="space-y-4">
            <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">Campus Modules</h3>
              <span class="text-[11px] font-bold text-slate-400">Quick Access</span>
            </div>

            <div class="space-y-2.5">
              <a routerLink="/academics" class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Academics & Directory</h4>
                  <p class="text-[10px] text-slate-500 truncate">Classes, Roster, Faculty & Subjects</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <a routerLink="/attendance" class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">Attendance Register</h4>
                  <p class="text-[10px] text-slate-500 truncate">Daily roll calls & attendance reports</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <a routerLink="/timetable" class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">Timetable & Schedule</h4>
                  <p class="text-[10px] text-slate-500 truncate">Periods, faculty load & intervals</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>
            </div>

            <!-- Campus Info -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <span class="text-xs font-black text-slate-900 uppercase tracking-wider">Campus Information</span>
                <span class="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">ONLINE</span>
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Institution Code</span>
                  <span class="font-mono font-bold text-slate-800">{{ auth.currentUser()?.school?.code || 'DELHI01' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Academic Session</span>
                  <span class="font-bold text-slate-800">{{ auth.activeSessionName() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- 2. REDESIGNED DEDICATED TEACHER DASHBOARD VIEW                -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">
        
        <!-- Top Teacher KPI Deck -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <!-- Card 1: Homeroom / Designated Class Strength -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {{ isTeacherClassTeacher ? (teacherClassTeacherSection?.className + ' - ' + teacherClassTeacherSection?.sectionName) : 'Assigned Class' }} Strength
              </span>
              <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-xs">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ teacherClassStrength.activeStudents }} <span class="text-sm font-bold text-slate-400">Students</span>
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-emerald-600 font-bold">{{ teacherClassStrength.activeStudents }} Active</span>
              <span class="text-slate-300">|</span>
              <span class="text-rose-600 font-bold">{{ teacherClassStrength.inactiveStudents }} Inactive</span>
              <span class="text-slate-300">|</span>
              <span class="text-slate-700 font-bold">{{ teacherClassStrength.totalStudents }} Total</span>
            </div>
          </div>

          <!-- Card 2: Today's Class Attendance Status -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Daily Attendance</span>
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="flex items-baseline gap-2 mt-2">
              <div class="text-2xl sm:text-3xl font-black text-slate-900">
                {{ teacherAttendance.percentage }}%
              </div>
              <span *ngIf="teacherAttendance.isMarked" class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Marked
              </span>
              <span *ngIf="!teacherAttendance.isMarked" class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                Pending Roll Call
              </span>
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-emerald-600 font-semibold">{{ teacherAttendance.presentCount }} Present</span>
              <span class="text-slate-300">|</span>
              <span class="text-rose-600 font-semibold">{{ teacherAttendance.absentCount }} Absent</span>
              <span class="text-slate-300">|</span>
              <span class="text-amber-600 font-semibold">{{ teacherAttendance.lateCount }} Late</span>
            </div>
          </div>

          <!-- Card 3: Today's Teaching Schedule -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Lectures</span>
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ teacherTimetable.length }} <span class="text-sm font-bold text-slate-400">Periods</span>
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-blue-600 font-semibold truncate" [title]="nextUpcomingPeriod ? ('Next: ' + nextUpcomingPeriod.subjectName + ' (' + nextUpcomingPeriod.className + ')') : 'Schedule Active'">
                {{ nextUpcomingPeriod ? ('Next: ' + nextUpcomingPeriod.subjectName) : 'Routine Free' }}
              </span>
              <a routerLink="/timetable" class="text-slate-400 hover:text-slate-900 font-bold text-[11px] shrink-0">View &rarr;</a>
            </div>
          </div>

          <!-- Card 4: Assigned Subject Portfolios -->
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Subjects</span>
              <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shadow-xs">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {{ teacherSubjects.length }} <span class="text-sm font-bold text-slate-400">Allocations</span>
            </div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-purple-600 font-semibold truncate" [title]="teacherSubjectsSummary">
                {{ teacherSubjectsSummary }}
              </span>
              <span class="text-slate-400 font-bold text-[11px]">Mapped</span>
            </div>
          </div>

        </div>

        <!-- Main Teacher Workspace (2 Columns) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Timetable Schedule & Class Roster -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- SECTION 1: TODAY'S TEACHING TIMETABLE / LECTURES -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
              <div class="p-5 sm:px-6 sm:py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-xs">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">Today's Teaching Schedule</h3>
                    <p class="text-[11px] text-slate-400 font-medium">Your scheduled lectures and period allocations for today</p>
                  </div>
                </div>

                <a routerLink="/timetable" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-200">
                  <span>Full Week Routine &rarr;</span>
                </a>
              </div>

              <div class="p-5">
                <div *ngIf="teacherTimetable.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div *ngFor="let period of teacherTimetable"
                       class="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:bg-white transition-all space-y-2 shadow-xs group">
                    <div class="flex items-center justify-between">
                      <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                        Period {{ period.periodNumber }}
                      </span>
                      <span class="text-xs font-mono font-bold text-slate-600">
                        {{ period.startTime }} - {{ period.endTime }}
                      </span>
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                        {{ period.subjectName }}
                      </h4>
                      <p class="text-xs font-semibold text-slate-600 mt-0.5">
                        {{ period.className }} • {{ period.sectionName }}
                      </p>
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-400 font-medium">
                      <span>{{ period.roomNumber ? ('📍 ' + period.roomNumber) : '📍 Standard Classroom' }}</span>
                      <span *ngIf="period.subjectCode" class="font-mono text-slate-500 font-bold">{{ period.subjectCode }}</span>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="teacherTimetable.length === 0" class="py-10 text-center text-xs text-slate-400 space-y-2">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl shadow-inner">
                    ☕
                  </div>
                  <div class="font-bold text-slate-700">No scheduled periods for today</div>
                  <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
                    You have no active teaching timetable periods mapped for today. Check your full timetable routine.
                  </p>
                </div>
              </div>
            </div>

            <!-- SECTION 2: HOMEROOM CLASS ROSTER & PARENT/EMERGENCY CONTACTS (Class Teacher Scope) -->
            <div *ngIf="isTeacherClassTeacher" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
              <div class="p-5 sm:px-6 sm:py-4 border-b border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                        {{ teacherClassTeacherSection?.className }} - {{ teacherClassTeacherSection?.sectionName }} Homeroom Directory
                      </h3>
                      <span class="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-black">
                        {{ classStudents.length }} Students
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-400 font-medium">Students, today's roll call status & primary guardian emergency phones</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a routerLink="/attendance"
                     class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Mark Daily Roll Call</span>
                  </a>
                </div>
              </div>

              <!-- Search Bar for Class Roster -->
              <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                <input type="text" [(ngModel)]="teacherStudentSearch"
                       placeholder="Filter by student name, roll number or parent phone..."
                       class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400" />
              </div>

              <!-- Student Roster List -->
              <div class="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                <div *ngFor="let student of classStudents" class="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm overflow-hidden">
                      <img *ngIf="student.photoUrl" [src]="student.photoUrl" class="w-full h-full object-cover" />
                      <span *ngIf="!student.photoUrl">{{ student.firstName.charAt(0) }}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <h4 class="text-xs sm:text-sm font-black text-slate-900 truncate">{{ student.fullName }}</h4>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                          Roll #{{ student.rollNumber || '—' }}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-400">Adm: <strong class="font-mono text-slate-600">{{ student.admissionNumber }}</strong></p>
                    </div>
                  </div>

                  <!-- Today's Attendance Pill & Parent Emergency Contact -->
                  <div class="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                    
                    <!-- Attendance Status Pill -->
                    <span [ngClass]="{
                      'bg-emerald-50 text-emerald-700 border-emerald-200': student.todayAttendance === 'PRESENT',
                      'bg-rose-50 text-rose-700 border-rose-200': student.todayAttendance === 'ABSENT',
                      'bg-amber-50 text-amber-700 border-amber-200': student.todayAttendance === 'LATE' || student.todayAttendance === 'HALF_DAY',
                      'bg-slate-100 text-slate-500 border-slate-200': !student.todayAttendance || student.todayAttendance === 'UNMARKED'
                    }" class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border">
                      {{ student.todayAttendance || 'UNMARKED' }}
                    </span>

                    <!-- Primary Parent / Guardian Contact -->
                    <div *ngIf="student.guardians && student.guardians.length > 0" class="flex items-center gap-2">
                      <div class="text-right hidden sm:block">
                        <div class="text-[11px] font-bold text-slate-800">{{ student.guardians[0].name }}</div>
                        <div class="text-[9px] text-slate-400">{{ student.guardians[0].relationship || 'Parent' }}</div>
                      </div>
                      <a *ngIf="student.guardians[0].phone" [href]="'tel:' + student.guardians[0].phone"
                         class="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-xs"
                         [title]="'Call ' + student.guardians[0].name + ' (' + student.guardians[0].phone + ')'">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                <div *ngIf="classStudents.length === 0" class="py-8 text-center text-xs text-slate-400">
                  No students found matching "{{ teacherStudentSearch }}".
                </div>
              </div>
            </div>

          </div>

          <!-- Right 1 Col: Quick Actions & Faculty Notices -->
          <div class="space-y-6">
            
            <!-- Quick Action Deck -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <span class="text-xs font-black text-slate-900 uppercase tracking-wider">Teacher Actions</span>
                <span class="text-[10px] font-bold text-slate-400">Quick Portal</span>
              </div>

              <div class="space-y-2.5">
                <a *ngIf="isTeacherClassTeacher" routerLink="/attendance" class="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-all flex items-center justify-between group cursor-pointer">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      ✓
                    </div>
                    <div>
                      <h4 class="text-xs font-black text-emerald-950">Daily Class Roll Call</h4>
                      <p class="text-[10px] text-emerald-700">Mark {{ teacherClassTeacherSection?.className }} attendance</p>
                    </div>
                  </div>
                  <span class="text-emerald-700 font-bold text-xs">&rarr;</span>
                </a>

                <a routerLink="/homework" class="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 transition-all flex items-center justify-between group cursor-pointer">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      📝
                    </div>
                    <div>
                      <h4 class="text-xs font-black text-amber-950">Homework Center</h4>
                      <p class="text-[10px] text-amber-700">Post & evaluate assignments</p>
                    </div>
                  </div>
                  <span class="text-amber-700 font-bold text-xs">&rarr;</span>
                </a>

                <a routerLink="/exams" class="p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 transition-all flex items-center justify-between group cursor-pointer">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      📊
                    </div>
                    <div>
                      <h4 class="text-xs font-black text-rose-950">Marksheets & Grading</h4>
                      <p class="text-[10px] text-rose-700">Enter exam marks for subjects</p>
                    </div>
                  </div>
                  <span class="text-rose-700 font-bold text-xs">&rarr;</span>
                </a>
              </div>
            </div>

            <!-- Faculty Circulars & Teacher Announcements -->
            <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
              <div class="p-4 sm:px-5 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-800">Faculty Notices</h3>
                <span class="text-[10px] font-bold text-slate-400">Staff Alerts</span>
              </div>

              <div class="p-4 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                <div *ngFor="let notice of stats?.recentNotices" class="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {{ notice.priority || 'NORMAL' }}
                    </span>
                    <span class="text-[10px] text-slate-400">{{ notice.published_at | date:'shortDate' }}</span>
                  </div>
                  <h4 class="text-xs font-bold text-slate-900 leading-snug">{{ notice.title }}</h4>
                  <p class="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{{ notice.content }}</p>
                </div>

                <div *ngIf="!stats?.recentNotices || stats?.recentNotices?.length === 0" class="py-8 text-center text-xs text-slate-400">
                  No announcements published for faculty.
                </div>
              </div>
            </div>

            <!-- My Subject Allocations Portfolio -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <span class="text-xs font-black text-slate-900 uppercase tracking-wider">My Teaching Classes</span>
                <span class="text-[10px] font-bold text-indigo-600 font-mono">{{ teacherSubjects.length }} Assigned</span>
              </div>

              <div class="space-y-2">
                <div *ngFor="let sub of teacherSubjects" class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span class="font-bold text-slate-900">{{ sub.subjectName }}</span>
                    <div class="text-[10px] text-slate-500">{{ sub.className }} • {{ sub.sectionName }}</div>
                  </div>
                  <span *ngIf="sub.subjectCode" class="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                    {{ sub.subjectCode }}
                  </span>
                </div>

                <div *ngIf="teacherSubjects.length === 0" class="text-center py-4 text-xs text-slate-400">
                  No subject allocations assigned.
                </div>
              </div>
            </div>

          </div>
        </div>

      </ng-container>

      <!-- ============================================================== -->
      <!-- 3. PARENT / GUARDIAN DASHBOARD VIEW                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isParent()">
        <div *ngFor="let child of displayedChildren" class="space-y-4 bg-white/60 p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700 font-black text-lg shadow-sm">
                {{ child.name.charAt(0) || 'C' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-black text-slate-900 tracking-tight">{{ child.name }}</h2>
                  <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {{ child.className || 'Class' }} - {{ child.sectionName || 'A' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Roll No: <strong class="text-slate-800">#{{ child.rollNumber || 1 }}</strong> • Admission: <strong class="text-slate-800 font-mono">{{ child.admissionNumber || 'N/A' }}</strong>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <a *ngIf="auth.isServiceEnabled('TIMETABLE')" routerLink="/timetable" class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>Timetable</span>
              </a>
              <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance" class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>Attendance</span>
              </a>
              <a *ngIf="auth.isServiceEnabled('HOMEWORK')" routerLink="/homework" class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                <span>Homework</span>
              </a>
            </div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  stats: DashboardStats | null = null;
  selectedChildId = '';
  teacherStudentSearch = '';

  constructor() {
    effect(() => {
      const activeSession = this.auth.activeAcademicSession();
      this.loadDashboardStats(activeSession?.id);
    });
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

  get parentChildren(): any[] {
    return (this.stats as any)?.parentData?.children || [];
  }

  get displayedChildren(): any[] {
    const list = this.parentChildren;
    if (this.selectedChildId === 'ALL' || !this.selectedChildId) {
      return list;
    }
    return list.filter((c) => c.studentId === this.selectedChildId);
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
