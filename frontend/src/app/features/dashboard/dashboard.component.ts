import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- ============================================================== -->
      <!-- 1. ADMIN & PRINCIPAL DASHBOARD VIEW                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isAdmin()">
        <!-- 4 Primary Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <!-- Card 1: Total Students -->
          <a routerLink="/academics" [queryParams]="{tab: 'students'}"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400/80 transition-all flex flex-col justify-between group cursor-pointer">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
              <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-xs group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalStudents ?? 0 }}</div>
            <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span class="text-emerald-600 font-bold">Enrolled & Active</span>
              <span class="text-slate-400 group-hover:text-slate-900 font-bold text-[11px] transition-colors">View Roster &rarr;</span>
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

                <!-- Empty State for Circulars -->
                <div *ngIf="!stats?.recentNotices || stats?.recentNotices?.length === 0" class="py-12 text-center text-xs text-slate-400 space-y-2">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xl shadow-inner">
                    📢
                  </div>
                  <div class="font-bold text-slate-700">No active circulars posted yet</div>
                  <p class="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Publish circulars or important notices for students, parents, and teachers using the Communication module.
                  </p>
                  <div class="pt-2">
                    <a *ngIf="auth.isServiceEnabled('COMMUNICATION')" routerLink="/communication"
                       class="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors">
                      <span>Go to Communication Center &rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right 1 Col: Modules List One by One, then Campus Information at Last -->
          <div class="space-y-4">
            
            <div class="flex items-center justify-between px-1">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-700">Campus Modules</h3>
              <span class="text-[11px] font-bold text-slate-400">Quick Access</span>
            </div>

            <!-- Modules stacked list one by one -->
            <div class="space-y-2.5">
              
              <!-- Module 1: Academics & Directory -->
              <a routerLink="/academics"
                 class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">Academics & Directory</h4>
                  <p class="text-[10px] text-slate-500 truncate">Classes, Roster, Faculty & Subjects</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <!-- Module 2: Attendance Register -->
              <a routerLink="/attendance"
                 class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-emerald-600 transition-colors">Attendance Register</h4>
                  <p class="text-[10px] text-slate-500 truncate">Daily roll calls & attendance reports</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <!-- Module 3: Timetable & Schedule -->
              <a routerLink="/timetable"
                 class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">Timetable & Schedule</h4>
                  <p class="text-[10px] text-slate-500 truncate">Weekly class periods & teacher slots</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <!-- Module 4: Homework Center -->
              <a routerLink="/homework"
                 class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-amber-600 transition-colors">Homework Center</h4>
                  <p class="text-[10px] text-slate-500 truncate">Post assignments & tracking</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <!-- Module 5: Exams & Marksheets -->
              <a routerLink="/exams"
                 class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-rose-600 transition-colors">Exams & Marksheets</h4>
                  <p class="text-[10px] text-slate-500 truncate">Schedules, grading & report cards</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

              <!-- Module 6: Notices & Communication -->
              <a routerLink="/communication"
                 class="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] hover:border-slate-400 transition-all flex items-center gap-3 group cursor-pointer">
                <div class="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-black text-slate-900 group-hover:text-teal-600 transition-colors">Notices & Communication</h4>
                  <p class="text-[10px] text-slate-500 truncate">Broadcast circulars & grievances</p>
                </div>
                <span class="text-slate-300 group-hover:text-slate-900 font-bold text-xs transition-colors">&rarr;</span>
              </a>

            </div>

            <!-- At Last: Campus Information Card -->
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
                  <span class="text-slate-400 font-medium">Academic Term</span>
                  <span class="font-bold text-slate-800">2026–2027</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Portal Role</span>
                  <span class="font-bold text-slate-800">{{ auth.currentUser()?.roleName || 'School Admin' }}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </ng-container>

      <!-- ============================================================== -->
      <!-- 2. TEACHER DASHBOARD VIEW                                      -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {{ classTeacherSection ? classTeacherSection.className + ' - ' + classTeacherSection.sectionName : 'Assigned Class' }} Strength
            </span>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalStudents ?? 0 }} Students</div>
            <div class="text-xs text-slate-500 mt-1">Class Roll Roster</div>
          </div>
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Subject</span>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ primarySubject?.subjectName || 'All Subjects' }}</div>
            <div class="text-xs text-indigo-600 font-semibold mt-1">Code: {{ primarySubject?.subjectCode || '—' }}</div>
          </div>
          <div *ngIf="auth.isServiceEnabled('HOMEWORK')" class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Homework Center</span>
            <div class="text-2xl font-black text-slate-900 mt-2">Active</div>
            <div class="text-xs text-emerald-600 font-semibold mt-1">Assign & review tasks</div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- 3. PARENT / GUARDIAN DASHBOARD VIEW                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isParent()">

        <!-- Render Each Child's Profile Card -->
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

  get formattedToday(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  }

  get classTeacherSection() {
    return this.auth.currentUser()?.teachingScope?.classTeacherSections?.[0] || null;
  }

  get primarySubject() {
    return this.auth.currentUser()?.teachingScope?.subjectAssignments?.[0] || null;
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
    this.auth.fetchProfile().subscribe();
    this.api.get<DashboardStats>('dashboard/overview').subscribe({
      next: (res) => (this.stats = res),
    });
  }
}


