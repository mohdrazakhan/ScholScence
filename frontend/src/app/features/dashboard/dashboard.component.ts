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
      <!-- 1. ADMIN & SUPER DEVELOPER DASHBOARD VIEW                      -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isAdmin() || auth.currentUser()?.role === 'SUPER_ADMIN'">
        <!-- Top Summary Banner -->
        <div class="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Admin Console
              </span>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-xs font-semibold text-slate-600">{{ auth.currentUser()?.school?.name }}</span>
            </div>
            <h1 class="text-xl font-extrabold text-slate-900 mt-1">Institutional Overview</h1>
            <p class="text-xs text-slate-500 mt-0.5">Real-time attendance, active academic sessions, and operational logs.</p>
          </div>

          <div class="flex items-center gap-2">
            <a routerLink="/attendance" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
              📋 Open Attendance
            </a>
            <a routerLink="/academics" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
              👥 View Roster
            </a>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ stats?.stats?.totalStudents || 105 }}</div>
            <div class="text-xs text-emerald-600 font-semibold mt-1">Enrolled & Active</div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today Attendance</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ stats?.stats?.attendanceTodayPercentage || '98.5' }}%</div>
            <div class="text-xs text-indigo-600 font-semibold mt-1">Multi-Section Average</div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Teaching Faculty</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ stats?.stats?.totalTeachers || 10 }} Staff</div>
            <div class="text-xs text-slate-500 mt-1">Subject & Class Teachers</div>
          </div>

          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Grievances</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ stats?.stats?.pendingComplaints || 1 }}</div>
            <div class="text-xs text-amber-600 font-semibold mt-1">Parent tickets pending</div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- 2. TEACHER DASHBOARD VIEW                                      -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isTeacher() && !auth.isAdmin()">
        <div class="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Teacher Workspace
              </span>
              <h1 class="text-xl font-extrabold text-slate-900 mt-1.5">Welcome, {{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</h1>
              <p class="text-xs text-slate-500 mt-0.5">Assigned Class: <span class="font-bold text-slate-800">Class 8 - Section A (Mathematics)</span></p>
            </div>
            <a routerLink="/attendance" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
              ✓ Mark Today's Attendance
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class 8-A Strength</span>
            <div class="text-2xl font-black text-slate-900 mt-1">9 Students</div>
            <div class="text-xs text-slate-500 mt-1">Roll #1 to #9</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Subject</span>
            <div class="text-2xl font-black text-slate-900 mt-1">Mathematics</div>
            <div class="text-xs text-indigo-600 font-semibold mt-1">Code: MATH</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Homework</span>
            <div class="text-2xl font-black text-slate-900 mt-1">1 Published</div>
            <div class="text-xs text-rose-600 font-semibold mt-1">Due in 2 days</div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- 3. PARENT / GUARDIAN DASHBOARD VIEW                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isParent()">
        <div class="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                Parent & Student Portal
              </span>
              <h1 class="text-xl font-extrabold text-slate-900 mt-1.5">Child: Aarav Sharma</h1>
              <p class="text-xs text-slate-500 mt-0.5">
                Class 8 • Section A • Roll No: <span class="font-bold text-slate-800">#1</span> • Admission: <span class="font-bold text-slate-800">DIS001-2026-001</span>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <a routerLink="/homework" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
                📚 Homework Diary
              </a>
              <a routerLink="/complaints" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                💬 Message School
              </a>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Percentage</span>
            <div class="text-2xl font-black text-emerald-600 mt-1">100.0%</div>
            <div class="text-xs text-slate-500 mt-1">Present 5 of 5 days</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Homework</span>
            <div class="text-2xl font-black text-slate-900 mt-1">1 Assignment</div>
            <div class="text-xs text-rose-600 font-semibold mt-1">Linear Equations (Math)</div>
          </div>
          <div class="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Latest Exam Result</span>
            <div class="text-2xl font-black text-indigo-600 mt-1">Grade A1 (92%)</div>
            <div class="text-xs text-slate-500 mt-1">Term 1 Assessment</div>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================== -->
      <!-- COMMON CIRCULARS & NOTICES LIST                                -->
      <!-- ============================================================== -->
      <div class="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">School Notices & Announcements</h3>
          <a routerLink="/communication" class="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View all &rarr;</a>
        </div>
        <div class="p-6 divide-y divide-slate-100">
          <div *ngFor="let notice of stats?.recentNotices" class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="text-xs font-bold text-slate-900">{{ notice.title }}</h4>
                <p class="text-xs text-slate-600 mt-1">{{ notice.content }}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 flex-shrink-0">
                {{ notice.target_audience }}
              </span>
            </div>
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

  ngOnInit() {
    this.api.get<DashboardStats>('dashboard/overview').subscribe({
      next: (res) => (this.stats = res),
    });
  }
}
