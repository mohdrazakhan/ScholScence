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
      <!-- 1. ADMIN & PRINCIPAL DASHBOARD VIEW                        -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isAdmin()">
        <!-- Top Summary Clay Banner -->
        <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
                Admin Console
              </span>
              <span class="text-xs text-slate-300">•</span>
              <span class="text-xs font-semibold text-slate-600">{{ auth.currentUser()?.school?.name }}</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">Institutional Overview</h1>
            <p class="text-xs text-slate-500 mt-0.5">Real-time attendance, active academic sessions, and operational logs.</p>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance" class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all active:scale-[0.99] flex items-center gap-2">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Open Attendance</span>
            </a>
            <a *ngIf="auth.isServiceEnabled('ACADEMICS')" routerLink="/academics" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-white text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff] transition-all flex items-center gap-2">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>View Roster</span>
            </a>
          </div>
        </div>

        <!-- 4 Clay Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
              <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalStudents || 105 }}</div>
            <div class="text-xs text-emerald-600 font-semibold mt-1">Enrolled & Active</div>
          </div>

          <div *ngIf="auth.isServiceEnabled('ATTENDANCE')" class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today Attendance</span>
              <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ stats?.stats?.attendanceTodayPercentage || '98.5' }}%</div>
            <div class="text-xs text-indigo-600 font-semibold mt-1">Multi-Section Average</div>
          </div>

          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teaching Faculty</span>
              <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ stats?.stats?.totalTeachers || 10 }} Staff</div>
            <div class="text-xs text-slate-500 mt-1">Subject & Class Teachers</div>
          </div>

          <div *ngIf="auth.isServiceEnabled('COMPLAINTS')" class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Grievances</span>
              <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ stats?.stats?.pendingComplaints || 1 }}</div>
            <div class="text-xs text-amber-600 font-semibold mt-1">Parent tickets pending</div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- 2. TEACHER DASHBOARD VIEW                                      -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">
        <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm">
              Teacher Workspace
            </span>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">Welcome, {{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</h1>
            <p class="text-xs text-slate-500 mt-0.5">
              <span *ngIf="classTeacherSection">
                Class Teacher: <strong class="text-slate-800">{{ classTeacherSection.className }} - {{ classTeacherSection.sectionName }}</strong>
              </span>
              <span *ngIf="primarySubject">
                • Assigned Subject: <strong class="text-slate-800">{{ primarySubject.subjectName }} ({{ primarySubject.subjectCode }})</strong>
              </span>
            </p>
          </div>
          <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance" class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-2">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Mark Today's Attendance</span>
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {{ classTeacherSection ? classTeacherSection.className + ' - ' + classTeacherSection.sectionName : 'Assigned Class' }} Strength
            </span>
            <div class="text-2xl font-black text-slate-900 mt-2">5 Students</div>
            <div class="text-xs text-slate-500 mt-1">Roll #1 to #5</div>
          </div>
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Subject</span>
            <div class="text-2xl font-black text-slate-900 mt-2">{{ primarySubject?.subjectName || 'Social Studies' }}</div>
            <div class="text-xs text-indigo-600 font-semibold mt-1">Code: {{ primarySubject?.subjectCode || 'SST' }}</div>
          </div>
          <div *ngIf="auth.isServiceEnabled('HOMEWORK')" class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Homework</span>
            <div class="text-2xl font-black text-slate-900 mt-2">1 Published</div>
            <div class="text-xs text-rose-600 font-semibold mt-1">Due in 2 days</div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- 3. PARENT / GUARDIAN DASHBOARD VIEW                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isParent()">
        <!-- Top Parent Portal Banner -->
        <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm">
                Parent & Student Portal
              </span>
              <span *ngIf="parentChildren.length > 1" class="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200">
                {{ parentChildren.length }} Children Enrolled
              </span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
              Welcome, {{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Monitor academic attendance, homework assignments, and schedules for your children.
            </p>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance" class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Child Attendance</span>
            </a>
            <a *ngIf="auth.isServiceEnabled('TIMETABLE')" routerLink="/timetable" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-white text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff] transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Weekly Timetables</span>
            </a>
          </div>
        </div>

        <!-- Multi-Child Switcher Tabs (when parent has > 1 child) -->
        <div *ngIf="parentChildren.length > 1" class="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
          <button (click)="selectChild('ALL')"
                  [class.bg-slate-900]="selectedChildId === 'ALL' || !selectedChildId"
                  [class.text-white]="selectedChildId === 'ALL' || !selectedChildId"
                  [class.bg-white]="selectedChildId !== 'ALL' && selectedChildId !== ''"
                  [class.text-slate-700]="selectedChildId !== 'ALL' && selectedChildId !== ''"
                  class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer">
            <span>👨‍👩‍👧‍👦 All Children ({{ parentChildren.length }})</span>
          </button>
          <button *ngFor="let child of parentChildren" (click)="selectChild(child.studentId)"
                  [class.bg-slate-900]="selectedChildId === child.studentId"
                  [class.text-white]="selectedChildId === child.studentId"
                  [class.bg-white]="selectedChildId !== child.studentId"
                  [class.text-slate-700]="selectedChildId !== child.studentId"
                  class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer">
            <span class="w-2 h-2 rounded-full" [ngClass]="selectedChildId === child.studentId ? 'bg-emerald-400' : 'bg-slate-400'"></span>
            <span>{{ child.name }} ({{ child.className }} - {{ child.sectionName }})</span>
          </button>
        </div>

        <!-- Render Each Child's Profile & Real-time Metrics Card -->
        <div *ngFor="let child of displayedChildren" class="space-y-4 bg-white/60 p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <!-- Child Profile Header -->
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
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Timetable</span>
              </a>
              <a *ngIf="auth.isServiceEnabled('ATTENDANCE')" routerLink="/attendance" class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Attendance</span>
              </a>
              <a *ngIf="auth.isServiceEnabled('HOMEWORK')" routerLink="/homework" class="px-3.5 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Homework</span>
              </a>
            </div>
          </div>

          <!-- Child 3 Key Metrics Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div *ngIf="auth.isServiceEnabled('ATTENDANCE')" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attendance Percentage</span>
              <div class="text-2xl font-black mt-2" 
                   [ngClass]="(+child.stats?.attendancePercentage || 0) < 75 ? 'text-amber-600' : 'text-emerald-600'">
                {{ child.stats?.attendancePercentage || '100.0' }}%
              </div>
              <div class="text-xs text-slate-500 mt-1">
                Present {{ child.stats?.presentDays || 0 }} of {{ child.stats?.totalDays || 0 }} recorded days
              </div>
            </div>

            <div *ngIf="auth.isServiceEnabled('HOMEWORK')" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Homework</span>
              <div class="text-2xl font-black text-slate-900 mt-2">
                {{ child.stats?.pendingHomeworkCount || 0 }} Active
              </div>
              <div class="text-xs text-rose-600 font-semibold mt-1">
                {{ (child.stats?.pendingHomeworkCount || 0) > 0 ? 'Assigned in ' + child.className : 'All completed' }}
              </div>
            </div>

            <div *ngIf="auth.isServiceEnabled('EXAMS')" class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Standing</span>
              <div class="text-2xl font-black text-indigo-600 mt-2">{{ child.stats?.latestGrade || 'Grade A1 (92%)' }}</div>
              <div class="text-xs text-slate-500 mt-1">Term 1 Assessment</div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- COMMON CIRCULARS & NOTICES LIST                                -->
      <!-- ============================================================== -->
      <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">School Notices & Announcements</h3>
          </div>
          <a *ngIf="auth.isServiceEnabled('COMMUNICATION')" routerLink="/communication" class="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1">
            <span>View all</span>
            <span>&rarr;</span>
          </a>
        </div>
        <div class="p-6 divide-y divide-slate-100">
          <div *ngFor="let notice of stats?.recentNotices" class="py-3.5 first:pt-0 last:pb-0">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="text-xs font-bold text-slate-900">{{ notice.title }}</h4>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">{{ notice.content }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#f8fafc] text-slate-700 border border-slate-200 flex-shrink-0 shadow-xs">
                {{ notice.target_audience }}
              </span>
            </div>
          </div>
          <div *ngIf="!stats?.recentNotices || stats?.recentNotices?.length === 0" class="py-4 text-center text-xs text-slate-400">
            No active announcements found.
          </div>
        </div>
      </div>

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  stats: DashboardStats | null = null;
  selectedChildId = '';

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

