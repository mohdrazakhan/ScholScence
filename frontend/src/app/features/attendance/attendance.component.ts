import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { AttendanceConfig, AttendanceRegisterResponse, AttendanceStudent, ClassItem } from '../../core/models';
import { RouterModule } from '@angular/router';

interface FlatSection {
  id: string;
  name: string;
  className: string;
  displayName: string;
  isClassTeacher?: boolean;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">

      <!-- SERVICE RESTRICTED BANNER -->
      <div *ngIf="!auth.isServiceEnabled('ATTENDANCE')" class="p-8 bg-white rounded-3xl border border-rose-100 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] text-center max-w-lg mx-auto my-12 space-y-4 animate-fadeIn">
        <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 class="text-xl font-black text-slate-900">Attendance Service Restricted</h2>
        <p class="text-xs text-slate-600 leading-relaxed">
          The <strong>Attendance Register</strong> service has been temporarily restricted for this institution by platform governance.
        </p>
        <a routerLink="/dashboard" class="inline-block mt-3 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer">
          Return to Dashboard
        </a>
      </div>

      <ng-container *ngIf="auth.isServiceEnabled('ATTENDANCE')">

        <!-- ============================================================== -->
        <!-- ADMIN ATTENDANCE POLICY SETUP BANNER / DIALOG (IF UNCONFIGURED)-->
        <!-- ============================================================== -->
        <div *ngIf="isAdmin && !attendanceConfig.isConfigured"
             class="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-[6px_6px_20px_#cbd5e1,-6px_-6px_20px_#ffffff] border border-indigo-700/50 space-y-4 animate-fadeIn">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <span class="text-2xl">📋</span>
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-400/30">
                  Initial Setup Required
                </span>
                <h3 class="text-lg font-black mt-1 tracking-tight">How does your school record daily attendance?</h3>
                <p class="text-xs text-indigo-200 mt-0.5 max-w-xl">
                  Configure whether class teachers take attendance <strong>Once a Day</strong> (standard morning homeroom) or <strong>Twice a Day</strong> (morning & post-lunch afternoon sessions).
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button (click)="openPolicyModal()"
                      class="px-5 py-2.5 bg-white hover:bg-slate-100 text-indigo-950 text-xs font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer">
                <span>Configure School Policy</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- ============================================================== -->
        <!-- TEACHER & ADMIN DAILY HOMEROOM ATTENDANCE REGISTER             -->
        <!-- ============================================================== -->
        <ng-container *ngIf="!auth.isParent()">
          
          <!-- Top Controls: Class/Section Selector + Policy Indicator + Date Presets -->
          <div class="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-5">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              <!-- Section Selector & Class Teacher Badge -->
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Class & Homeroom Section
                  </label>
                  <div class="relative min-w-[260px]">
                    <select [(ngModel)]="selectedSectionId" (change)="loadAttendance()"
                            class="w-full appearance-none px-4 py-2.5 pr-10 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] cursor-pointer transition-all">
                      <option *ngFor="let sec of availableSections" [value]="sec.id">
                        {{ sec.displayName }} {{ sec.isClassTeacher ? '★ (Your Homeroom)' : '' }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- Class Teacher In-Charge Indicator -->
                <div class="sm:pt-5">
                  <span *ngIf="isCurrentClassTeacher"
                        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                    <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span>Class In-Charge: <strong>You</strong></span>
                  </span>
                  <span *ngIf="!isCurrentClassTeacher && registerData?.classTeacherName"
                        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                    <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Class Teacher: <strong>{{ registerData?.classTeacherName }}</strong></span>
                  </span>
                  <span *ngIf="!isCurrentClassTeacher && !registerData?.classTeacherName"
                        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                    <span>No Class Teacher Assigned</span>
                  </span>
                </div>
              </div>

              <!-- Date Selectors & Presets -->
              <div class="flex flex-wrap items-center gap-2">
                <div class="flex items-center bg-[#f8fafc] p-1 rounded-2xl border border-slate-200 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                  <button type="button" (click)="setToday()"
                          [class.bg-white]="isToday()"
                          [class.text-slate-900]="isToday()"
                          [class.shadow-xs]="isToday()"
                          [class.text-slate-500]="!isToday()"
                          class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Today
                  </button>
                  <button type="button" (click)="setYesterday()"
                          [class.bg-white]="isYesterday()"
                          [class.text-slate-900]="isYesterday()"
                          [class.shadow-xs]="isYesterday()"
                          [class.text-slate-500]="!isYesterday()"
                          class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Yesterday
                  </button>
                  <button type="button" (click)="setDaysAgo(2)"
                          [class.bg-white]="isDaysAgo(2)"
                          [class.text-slate-900]="isDaysAgo(2)"
                          [class.shadow-xs]="isDaysAgo(2)"
                          [class.text-slate-500]="!isDaysAgo(2)"
                          class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    2 Days Ago
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <input type="date" [(ngModel)]="selectedDate" (change)="loadAttendance()"
                         class="px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] focus:outline-none focus:border-slate-800" />
                  
                  <button (click)="saveAttendance()" [disabled]="saving || students.length === 0"
                          class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span *ngIf="!saving">Save Register</span>
                    <span *ngIf="saving">Saving...</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Indian School Session Segmented Switcher & Live DB Sync Bar -->
            <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              
              <!-- Session Switcher (if TWICE_DAILY) or Single Register Tag (if ONCE_DAILY) -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- If Twice Daily -->
                <ng-container *ngIf="attendanceConfig.frequency === 'TWICE_DAILY'">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Session:</span>
                  <div class="inline-flex bg-[#f8fafc] p-1 rounded-2xl border border-slate-200 shadow-inner">
                    <button type="button" (click)="setSession('MORNING')"
                            [class.bg-white]="selectedSession === 'MORNING'"
                            [class.text-indigo-900]="selectedSession === 'MORNING'"
                            [class.shadow-xs]="selectedSession === 'MORNING'"
                            [class.text-slate-500]="selectedSession !== 'MORNING'"
                            class="px-3.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <span>🌅 Morning Homeroom (1st Half)</span>
                    </button>
                    <button type="button" (click)="setSession('AFTERNOON')"
                            [class.bg-white]="selectedSession === 'AFTERNOON'"
                            [class.text-indigo-900]="selectedSession === 'AFTERNOON'"
                            [class.shadow-xs]="selectedSession === 'AFTERNOON'"
                            [class.text-slate-500]="selectedSession !== 'AFTERNOON'"
                            class="px-3.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <span>☀️ Afternoon Session (2nd Half)</span>
                    </button>
                  </div>
                </ng-container>

                <!-- If Once Daily -->
                <ng-container *ngIf="attendanceConfig.frequency !== 'TWICE_DAILY'">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-800 text-xs font-bold">
                    <span>🌅 Daily Homeroom Roll Call (Once Daily)</span>
                  </div>
                </ng-container>

                <!-- Admin Policy Edit Trigger -->
                <button *ngIf="isAdmin" (click)="openPolicyModal()"
                        class="px-3 py-1.5 rounded-2xl bg-[#f8fafc] hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer">
                  <span>⚙️ Policy: <strong>{{ attendanceConfig.frequency === 'TWICE_DAILY' ? '2 Times/Day' : '1 Time/Day' }}</strong></span>
                </button>
              </div>

              <!-- Sync status indicator & Export Actions -->
              <div class="flex items-center gap-2">
                <span *ngIf="syncStatus === 'SAVED'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Synced ({{ lastSyncTime }})
                </span>
                <span *ngIf="syncStatus === 'SAVING'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span class="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span>
                  Saving...
                </span>

                <button (click)="exportToExcel()" [disabled]="students.length === 0"
                        class="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Excel</span>
                </button>
                <button (click)="printAttendanceRoster()" [disabled]="students.length === 0"
                        class="px-3.5 py-1.5 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40">
                  <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Roster</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Summary Cards (Including Half Day) -->
          <div *ngIf="registerData" class="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Strength</div>
              <div class="text-2xl font-black text-slate-900 mt-1">{{ students.length }}</div>
            </div>
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Present</div>
              <div class="text-2xl font-black text-emerald-600 mt-1">{{ countStatus('PRESENT') }}</div>
            </div>
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Absent</div>
              <div class="text-2xl font-black text-rose-600 mt-1">{{ countStatus('ABSENT') }}</div>
            </div>
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Half Day</div>
              <div class="text-2xl font-black text-sky-600 mt-1">{{ countStatus('HALF_DAY') }}</div>
            </div>
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Late</div>
              <div class="text-2xl font-black text-amber-600 mt-1">{{ countStatus('LATE') }}</div>
            </div>
          </div>

          <!-- Quick Actions & Search Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="w-full sm:w-64">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Filter student or roll..."
                     class="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button (click)="markAll('PRESENT')"
                      class="px-3.5 py-2 bg-[#f8fafc] hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Mark All Present</span>
              </button>
              <button (click)="markAll('ABSENT')"
                      class="px-3.5 py-2 bg-[#f8fafc] hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Mark All Absent</span>
              </button>
            </div>
          </div>

          <!-- Register Table with Pagination -->
          <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead class="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th class="px-5 py-3.5">Roll No</th>
                    <th class="px-5 py-3.5">Admission No</th>
                    <th class="px-5 py-3.5">Student Name</th>
                    <th class="px-5 py-3.5">
                      {{ attendanceConfig.frequency === 'TWICE_DAILY' ? (selectedSession === 'MORNING' ? 'Morning Roll Status' : 'Afternoon Roll Status') : 'Daily Status' }}
                    </th>
                    <th class="px-5 py-3.5">Teacher Remark / Leave Reason</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  <tr *ngFor="let student of paginatedStudents" class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3 font-bold text-slate-900">#{{ student.rollNumber }}</td>
                    <td class="px-5 py-3 text-slate-500 font-mono">{{ student.admissionNumber }}</td>
                    <td class="px-5 py-3 font-bold text-slate-800">{{ student.name }}</td>
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-1.5">
                        <button type="button" (click)="updateStudentStatus(student, 'PRESENT')"
                                [class.bg-emerald-600]="student.status === 'PRESENT'"
                                [class.text-white]="student.status === 'PRESENT'"
                                [class.shadow-[inset_1px_1px_3px_#065f46]]="student.status === 'PRESENT'"
                                [class.bg-slate-100]="student.status !== 'PRESENT'"
                                [class.text-slate-600]="student.status !== 'PRESENT'"
                                class="px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer">
                          Present
                        </button>
                        <button type="button" (click)="updateStudentStatus(student, 'ABSENT')"
                                [class.bg-rose-600]="student.status === 'ABSENT'"
                                [class.text-white]="student.status === 'ABSENT'"
                                [class.shadow-[inset_1px_1px_3px_#881337]]="student.status === 'ABSENT'"
                                [class.bg-slate-100]="student.status !== 'ABSENT'"
                                [class.text-slate-600]="student.status !== 'ABSENT'"
                                class="px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer">
                          Absent
                        </button>
                        <button type="button" (click)="updateStudentStatus(student, 'HALF_DAY')"
                                [class.bg-sky-600]="student.status === 'HALF_DAY'"
                                [class.text-white]="student.status === 'HALF_DAY'"
                                [class.shadow-[inset_1px_1px_3px_#0369a1]]="student.status === 'HALF_DAY'"
                                [class.bg-slate-100]="student.status !== 'HALF_DAY'"
                                [class.text-slate-600]="student.status !== 'HALF_DAY'"
                                class="px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer">
                          Half Day
                        </button>
                        <button type="button" (click)="updateStudentStatus(student, 'LATE')"
                                [class.bg-amber-500]="student.status === 'LATE'"
                                [class.text-white]="student.status === 'LATE'"
                                [class.shadow-[inset_1px_1px_3px_#78350f]]="student.status === 'LATE'"
                                [class.bg-slate-100]="student.status !== 'LATE'"
                                [class.text-slate-600]="student.status !== 'LATE'"
                                class="px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer">
                          Late
                        </button>
                      </div>
                    </td>
                    <td class="px-5 py-3">
                      <input type="text" [(ngModel)]="student.reason" (blur)="saveChanges()" placeholder="Medical leave, family function, etc..."
                             class="w-full max-w-xs px-3 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_2px_#e2e8f0]" />
                    </td>
                  </tr>
                  <tr *ngIf="paginatedStudents.length === 0">
                    <td colspan="5" class="px-6 py-8 text-center text-slate-400 text-xs">
                      No students found in this section.
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
        </ng-container>

        <!-- ============================================================== -->
        <!-- PARENT VIEW: INTERACTIVE CALENDAR & ATTENDANCE REGISTER       -->
        <!-- ============================================================== -->
        <ng-container *ngIf="auth.isParent()">
          
          <!-- Header Banner with Child Selector, View Switcher & Actions -->
          <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-xs">
                  Parent Portal • Attendance Center
                </span>
                <span class="text-xs text-slate-300">•</span>
                <span class="text-xs font-semibold text-slate-600">{{ parentData?.selectedChild?.className }} - {{ parentData?.selectedChild?.sectionName }}</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                Student Attendance Register
              </h1>
              <p class="text-xs text-slate-500 mt-0.5">
                Pupil: <strong class="text-slate-800">{{ parentData?.selectedChild?.name || 'Your Child' }}</strong> • Roll No: <strong class="text-slate-800">#{{ parentData?.selectedChild?.rollNumber || 1 }}</strong> • Adm: <strong class="text-slate-800">{{ parentData?.selectedChild?.admissionNumber }}</strong>
              </p>
            </div>
            
            <div class="flex items-center gap-3 flex-wrap">
              <!-- Child Switcher (if multiple children) -->
              <div *ngIf="parentData?.childrenList?.length > 1" class="flex items-center gap-2">
                <label class="text-xs font-bold text-slate-600">Child:</label>
                <select [ngModel]="parentSelectedChildId" (ngModelChange)="onParentChildSelect($event)"
                        class="px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-xs cursor-pointer">
                  <option *ngFor="let c of parentData?.childrenList" [value]="c.studentId">
                    {{ c.name }} ({{ c.className }})
                  </option>
                </select>
              </div>

              <!-- Overall Percentage KPI -->
              <div class="px-5 py-2.5 rounded-2xl bg-[#f8fafc] border border-slate-200 shadow-inner flex items-center gap-3">
                <div class="text-right">
                  <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Overall Session</span>
                  <div class="text-xl font-black"
                       [ngClass]="{
                         'text-emerald-600': (parentAttendancePct >= 90),
                         'text-amber-600': (parentAttendancePct >= 75 && parentAttendancePct < 90),
                         'text-rose-600': (parentAttendancePct < 75)
                       }">
                    {{ parentData?.overallSummary?.percentage || '100.0' }}%
                  </div>
                </div>
              </div>
              
              <button (click)="exportParentAttendance()"
                      class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Report</span>
              </button>
            </div>
          </div>

          <!-- Overall Summary KPI Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Working Days</span>
              <div class="text-xl sm:text-2xl font-black text-slate-900 mt-1">{{ parentData?.overallSummary?.totalDays || 0 }} Days</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Academic Session</div>
            </div>

            <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Present</span>
              <div class="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{{ parentData?.overallSummary?.presentDays || 0 }} Days</div>
              <div class="text-[11px] text-emerald-600 font-semibold mt-0.5">Regular Full Day</div>
            </div>

            <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Absent</span>
              <div class="text-xl sm:text-2xl font-black"
                   [ngClass]="(parentData?.overallSummary?.absentDays || 0) > 0 ? 'text-rose-600 font-black' : 'text-slate-900'">
                {{ parentData?.overallSummary?.absentDays || 0 }} Days
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">Leave / Unexcused</div>
            </div>

            <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Timetable</span>
              <a routerLink="/timetable" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 mt-2">
                <span>View Timetable</span>
                <span>&rarr;</span>
              </a>
              <div class="text-[11px] text-slate-500 mt-0.5">Periods & schedule</div>
            </div>
          </div>

          <!-- View Mode Switcher Toolbar (Calendar vs Yearly vs List) -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="flex items-center gap-1 bg-[#f8fafc] p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button type="button" (click)="parentViewMode = 'MONTHLY'"
                      [ngClass]="parentViewMode === 'MONTHLY' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                      class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2">
                <span>📅 Monthly Calendar</span>
              </button>
              <button type="button" (click)="parentViewMode = 'YEARLY'"
                      [ngClass]="parentViewMode === 'YEARLY' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                      class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2">
                <span>📊 Yearly Overview</span>
              </button>
              <button type="button" (click)="parentViewMode = 'LIST'"
                      [ngClass]="parentViewMode === 'LIST' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                      class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2">
                <span>📜 Daily History Log</span>
              </button>
            </div>

            <!-- Calendar Color Legend -->
            <div class="flex items-center gap-3 text-[11px] font-bold text-slate-600 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-emerald-500 shadow-xs"></span>
                <span>Present</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-rose-500 shadow-xs"></span>
                <span>Absent</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-sky-500 shadow-xs"></span>
                <span>Half Day</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-amber-400 shadow-xs"></span>
                <span>Late</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-md bg-slate-200"></span>
                <span>Weekend / Off</span>
              </div>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- 1. MONTHLY CALENDAR VIEW                                       -->
          <!-- ============================================================== -->
          <div *ngIf="parentViewMode === 'MONTHLY'" class="space-y-4 animate-fadeIn">
            
            <!-- Month Navigator Header & Monthly Performance Bar -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <!-- Month Navigator -->
              <div class="flex items-center gap-3">
                <button (click)="prevMonth()"
                        class="p-2.5 rounded-2xl bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-200 shadow-xs transition-all cursor-pointer">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div class="text-center min-w-[190px]">
                  <h2 class="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {{ currentMonthName }} {{ calendarYear }}
                  </h2>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {{ monthlyStats.total }} Recorded Days
                  </span>
                </div>

                <button (click)="nextMonth()"
                        class="p-2.5 rounded-2xl bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-200 shadow-xs transition-all cursor-pointer">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button (click)="goToTodayMonth()"
                        class="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer">
                  This Month
                </button>
              </div>

              <!-- Month Performance KPI Pills -->
              <div class="flex items-center gap-2.5 flex-wrap">
                <div class="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Present: <strong>{{ monthlyStats.present }}</strong></span>
                </div>
                <div class="px-3 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Absent: <strong>{{ monthlyStats.absent }}</strong></span>
                </div>
                <div *ngIf="monthlyStats.halfDay > 0" class="px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>Half Day: <strong>{{ monthlyStats.halfDay }}</strong></span>
                </div>
                <div class="px-4 py-1.5 rounded-2xl bg-slate-900 text-white text-xs font-black">
                  Month Rate: {{ monthlyStats.percentage }}%
                </div>
              </div>
            </div>

            <!-- Calendar Grid (7 Days) -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
              
              <!-- Day Header Row -->
              <div class="grid grid-cols-7 gap-2 text-center text-[11px] font-black uppercase tracking-wider pb-3 border-b border-slate-100">
                <div class="text-rose-500">Sun</div>
                <div class="text-slate-600">Mon</div>
                <div class="text-slate-600">Tue</div>
                <div class="text-slate-600">Wed</div>
                <div class="text-slate-600">Thu</div>
                <div class="text-slate-600">Fri</div>
                <div class="text-slate-400">Sat</div>
              </div>

              <!-- Day Cells -->
              <div class="grid grid-cols-7 gap-2 sm:gap-3 mt-3">
                <div *ngFor="let cell of calendarDays"
                     class="min-h-[90px] sm:min-h-[105px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between"
                     [ngClass]="{
                       'bg-slate-50/50 border-slate-100 opacity-30 pointer-events-none': !cell.isCurrentMonth,
                       'bg-[#f8fafc] border-slate-200': cell.isCurrentMonth && !cell.status && cell.isWeekend,
                       'bg-white border-slate-200 hover:border-slate-300 shadow-xs': cell.isCurrentMonth && !cell.status && !cell.isWeekend,
                       'bg-emerald-50/70 border-emerald-300 shadow-xs': cell.isCurrentMonth && cell.status === 'PRESENT',
                       'bg-rose-50/80 border-rose-300 shadow-xs': cell.isCurrentMonth && cell.status === 'ABSENT',
                       'bg-sky-50/80 border-sky-300 shadow-xs': cell.isCurrentMonth && cell.status === 'HALF_DAY',
                       'bg-amber-50/80 border-amber-300 shadow-xs': cell.isCurrentMonth && cell.status === 'LATE'
                     }">
                  
                  <!-- Cell Top: Day number & 'Today' pill -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs sm:text-sm font-black"
                          [ngClass]="{
                            'text-slate-900': cell.isCurrentMonth && !cell.isWeekend,
                            'text-rose-500': cell.isCurrentMonth && cell.isWeekend,
                            'text-slate-300': !cell.isCurrentMonth
                          }">
                      {{ cell.dayNumber || '' }}
                    </span>
                    <span *ngIf="cell.isToday"
                          class="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-900 text-white shadow-xs">
                      Today
                    </span>
                  </div>

                  <!-- Cell Middle/Bottom: Status Badge & Reason -->
                  <div *ngIf="cell.isCurrentMonth" class="space-y-1 mt-1">
                    
                    <!-- Status Badge (Once Daily) -->
                    <div *ngIf="attendanceConfig.frequency !== 'TWICE_DAILY' && cell.status">
                      <span *ngIf="cell.status === 'PRESENT'"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                        <span>✓</span> <span>Present</span>
                      </span>
                      <span *ngIf="cell.status === 'ABSENT'"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
                        <span>✕</span> <span>Absent</span>
                      </span>
                      <span *ngIf="cell.status === 'HALF_DAY'"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-sky-600 text-white shadow-xs">
                        <span>½</span> <span>Half Day</span>
                      </span>
                      <span *ngIf="cell.status === 'LATE'"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-white shadow-xs">
                        <span>⏱</span> <span>Late</span>
                      </span>
                    </div>

                    <!-- Status Badge (Twice Daily) -->
                    <div *ngIf="attendanceConfig.frequency === 'TWICE_DAILY' && cell.status" class="space-y-0.5">
                      <div class="text-[9px] font-black px-1.5 py-0.5 rounded"
                           [ngClass]="cell.morningStatus === 'PRESENT' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'">
                        🌅 {{ cell.morningStatus === 'PRESENT' ? 'Pres' : (cell.morningStatus === 'LATE' ? 'Late' : 'Abs') }}
                      </div>
                      <div class="text-[9px] font-black px-1.5 py-0.5 rounded"
                           [ngClass]="cell.afternoonStatus === 'PRESENT' ? 'bg-emerald-200 text-emerald-900' : (cell.afternoonStatus ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-700')">
                        ☀️ {{ cell.afternoonStatus === 'PRESENT' ? 'Pres' : (cell.afternoonStatus ? 'Abs' : '—') }}
                      </div>
                    </div>

                    <!-- Non-recorded / Weekend Tag -->
                    <div *ngIf="!cell.status && cell.isWeekend" class="text-[10px] text-slate-400 font-semibold italic">
                      Weekend
                    </div>

                    <!-- Remark snippet if available -->
                    <div *ngIf="cell.reason" class="text-[9px] text-slate-600 italic truncate" [title]="cell.reason">
                      📝 {{ cell.reason }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- 2. YEARLY OVERVIEW GRID VIEW                                   -->
          <!-- ============================================================== -->
          <div *ngIf="parentViewMode === 'YEARLY'" class="space-y-4 animate-fadeIn">
            
            <!-- Year Selector Bar -->
            <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <button (click)="yearlySelectedYear = yearlySelectedYear - 1"
                        class="p-2.5 rounded-2xl bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-200 shadow-xs transition-all cursor-pointer">
                  ‹ Prev Year
                </button>
                <div class="text-center min-w-[160px]">
                  <h2 class="text-lg font-black text-slate-900 tracking-tight">Academic Year {{ yearlySelectedYear }}</h2>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">12-Month Overview</span>
                </div>
                <button (click)="yearlySelectedYear = yearlySelectedYear + 1"
                        class="p-2.5 rounded-2xl bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-200 shadow-xs transition-all cursor-pointer">
                  Next Year ›
                </button>
              </div>

              <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-2xl border border-indigo-200">
                Click any month to open calendar
              </span>
            </div>

            <!-- 12 Month Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div *ngFor="let m of yearlyMonths"
                   (click)="jumpToMonth(m.year, m.monthIndex)"
                   class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4 group">
                
                <div>
                  <div class="flex items-center justify-between">
                    <h3 class="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {{ m.monthName }}
                    </h3>
                    <span class="text-xs font-black px-2.5 py-0.5 rounded-xl border"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border-emerald-200': m.percentage !== '—' && +m.percentage >= 90,
                            'bg-amber-50 text-amber-700 border-amber-200': m.percentage !== '—' && +m.percentage >= 75 && +m.percentage < 90,
                            'bg-rose-50 text-rose-700 border-rose-200': m.percentage !== '—' && +m.percentage < 75,
                            'bg-slate-50 text-slate-400 border-slate-200': m.percentage === '—'
                          }">
                      {{ m.percentage !== '—' ? m.percentage + '%' : 'No Data' }}
                    </span>
                  </div>

                  <!-- Month counts -->
                  <div class="flex items-center gap-2 text-[11px] font-bold mt-2 text-slate-600">
                    <span class="text-emerald-600">● {{ m.present }} Present</span>
                    <span class="text-rose-600">● {{ m.absent }} Absent</span>
                    <span *ngIf="m.halfDay > 0" class="text-sky-600">● {{ m.halfDay }} Half</span>
                  </div>
                </div>

                <!-- Mini Day Dots Heatmap -->
                <div class="pt-2 border-t border-slate-100">
                  <div class="grid grid-cols-7 gap-1">
                    <div *ngFor="let dot of m.dayDots"
                         class="w-full h-3.5 rounded-sm flex items-center justify-center text-[7px] font-bold"
                         [ngClass]="{
                           'bg-emerald-400 text-white': dot.status === 'PRESENT',
                           'bg-rose-400 text-white': dot.status === 'ABSENT',
                           'bg-sky-400 text-white': dot.status === 'HALF_DAY',
                           'bg-amber-300 text-slate-900': dot.status === 'LATE',
                           'bg-slate-200 text-slate-400': !dot.status && dot.isWeekend,
                           'bg-slate-100 text-slate-400': !dot.status && !dot.isWeekend
                         }"
                         [title]="'Day ' + dot.day + ': ' + (dot.status || (dot.isWeekend ? 'Weekend' : 'No Record'))">
                      {{ dot.day }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>View Full Month</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================================== -->
          <!-- 3. LOG HISTORY / LIST VIEW                                     -->
          <!-- ============================================================== -->
          <div *ngIf="parentViewMode === 'LIST'" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden animate-fadeIn">
            <div class="px-6 py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Chronological Roll Call Entries</h3>
                <p class="text-[11px] text-slate-500">Official class attendance marked by the homeroom teacher</p>
              </div>
              <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                {{ parentData?.dailyHistory?.length || 0 }} Logged Days
              </span>
            </div>

            <div class="divide-y divide-slate-100">
              <div *ngFor="let record of parentData?.dailyHistory" class="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                <div>
                  <span class="font-bold text-slate-800">{{ formatDailyDate(record.date) }}</span>
                  <span *ngIf="isDateToday(record.date)" class="ml-2 text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-900 text-white">Today</span>
                  <span *ngIf="attendanceConfig.frequency === 'TWICE_DAILY' && record.session"
                        class="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md"
                        [ngClass]="record.session === 'MORNING' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'">
                    {{ record.session === 'MORNING' ? '🌅 Morning 1st Half' : '☀️ Afternoon 2nd Half' }}
                  </span>
                  <span *ngIf="record.reason" class="ml-2 text-[11px] text-slate-500 italic">({{ record.reason }})</span>
                </div>

                <div>
                  <span *ngIf="record.status === 'PRESENT'"
                        class="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Present
                  </span>
                  <span *ngIf="record.status === 'ABSENT'"
                        class="px-3 py-1 rounded-xl text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-xs animate-pulse">
                    Absent
                  </span>
                  <span *ngIf="record.status === 'HALF_DAY'"
                        class="px-3 py-1 rounded-xl text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    Half Day
                  </span>
                  <span *ngIf="record.status === 'LATE'"
                        class="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Late Arrival
                  </span>
                  <span *ngIf="record.status === 'NOT_MARKED'"
                        class="px-3 py-1 rounded-xl text-[11px] font-medium bg-slate-100 text-slate-500">
                    Not Marked
                  </span>
                </div>
              </div>

              <div *ngIf="!parentData?.dailyHistory || parentData?.dailyHistory?.length === 0" class="p-8 text-center text-xs text-slate-400">
                No daily attendance logs recorded yet for this session.
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>

      <!-- ============================================================== -->
      <!-- ADMIN POLICY CONFIGURATION MODAL (1x vs 2x Daily Attendance)  -->
      <!-- ============================================================== -->
      <div *ngIf="showPolicyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-scaleUp">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <span class="text-lg">⚙️</span>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900">Attendance Policy Configuration</h3>
                <p class="text-[11px] text-slate-500">Select how attendance will be recorded across your school</p>
              </div>
            </div>
            <button (click)="showPolicyModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-xs font-bold text-slate-700">
            How many times per day does your school take attendance?
          </p>

          <div class="space-y-3">
            <!-- Option 1: Once a day -->
            <div (click)="selectFrequency('ONCE_DAILY')"
                 [ngClass]="modalSelectedFrequency === 'ONCE_DAILY' ? 'border-indigo-600 bg-indigo-50/40 shadow-md' : 'border-slate-200'"
                 class="p-4 rounded-2xl border-2 hover:border-slate-300 transition-all cursor-pointer flex items-start gap-3.5">
              <input type="radio" name="freqOption" [checked]="modalSelectedFrequency === 'ONCE_DAILY'" class="mt-1 accent-indigo-600" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-slate-900">Once a Day (Standard Indian School Model)</span>
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">Recommended</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  The designated class teacher takes attendance once per day during the morning homeroom period. Statuses include <strong>Present</strong>, <strong>Absent</strong>, <strong>Half Day</strong>, and <strong>Late</strong>.
                </p>
              </div>
            </div>

            <!-- Option 2: Twice a day -->
            <div (click)="selectFrequency('TWICE_DAILY')"
                 [ngClass]="modalSelectedFrequency === 'TWICE_DAILY' ? 'border-indigo-600 bg-indigo-50/40 shadow-md' : 'border-slate-200'"
                 class="p-4 rounded-2xl border-2 hover:border-slate-300 transition-all cursor-pointer flex items-start gap-3.5">
              <input type="radio" name="freqOption" [checked]="modalSelectedFrequency === 'TWICE_DAILY'" class="mt-1 accent-indigo-600" />
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-slate-900">Twice a Day (Morning & Afternoon Sessions)</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Attendance is taken twice per day: <strong>Session 1 (Morning Roll Call / 1st Half)</strong> and <strong>Session 2 (Post-Lunch Afternoon Roll Call / 2nd Half)</strong>.
                </p>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button type="button" (click)="showPolicyModal = false"
                    class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="savePolicyConfig()" [disabled]="savingPolicy"
                    class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
              <span *ngIf="!savingPolicy">Confirm Policy</span>
              <span *ngIf="savingPolicy">Saving...</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class AttendanceComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exportService = inject(ExportService);
  
  selectedDate = new Date().toISOString().split('T')[0];
  selectedSession: 'MORNING' | 'AFTERNOON' = 'MORNING';
  selectedSectionId = '';
  availableSections: FlatSection[] = [];
  
  attendanceConfig: AttendanceConfig = { frequency: 'ONCE_DAILY', isConfigured: false };
  showPolicyModal = false;
  modalSelectedFrequency: 'ONCE_DAILY' | 'TWICE_DAILY' = 'ONCE_DAILY';
  savingPolicy = false;

  registerData: AttendanceRegisterResponse | null = null;
  students: AttendanceStudent[] = [];
  saving = false;
  syncStatus: 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR' = 'IDLE';
  lastSyncTime = '';
  
  searchQuery = '';
  currentPage = 1;
  pageSize = 25;

  // Parent specific state
  parentData: any = null;
  parentSelectedChildId = '';
  parentViewMode: 'MONTHLY' | 'YEARLY' | 'LIST' = 'MONTHLY';
  
  calendarYear: number = new Date().getFullYear();
  calendarMonth: number = new Date().getMonth(); // 0-11
  yearlySelectedYear: number = new Date().getFullYear();

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  get currentMonthName(): string {
    return this.monthNames[this.calendarMonth];
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin();
  }

  get parentAttendancePct(): number {
    return parseFloat(this.parentData?.overallSummary?.percentage || '100');
  }

  get isCurrentClassTeacher(): boolean {
    const teachingScope = this.auth.currentUser()?.teachingScope;
    if (!teachingScope?.classTeacherSections) return false;
    return teachingScope.classTeacherSections.some((cts) => cts.sectionId === this.selectedSectionId);
  }

  ngOnInit() {
    if (!this.auth.isServiceEnabled('ATTENDANCE')) {
      return;
    }
    this.loadAttendanceConfig();
    if (this.auth.isParent()) {
      this.loadParentAttendance();
    } else {
      this.loadSections();
    }
  }

  loadAttendanceConfig() {
    this.api.get<AttendanceConfig>('attendance/config').subscribe({
      next: (config) => {
        if (config) {
          this.attendanceConfig = config;
          this.modalSelectedFrequency = config.frequency || 'ONCE_DAILY';
          if (this.isAdmin && !config.isConfigured) {
            this.showPolicyModal = true;
          }
        }
      },
    });
  }

  selectFrequency(freq: 'ONCE_DAILY' | 'TWICE_DAILY') {
    this.modalSelectedFrequency = freq;
  }

  openPolicyModal() {
    this.modalSelectedFrequency = this.attendanceConfig.frequency || 'ONCE_DAILY';
    this.showPolicyModal = true;
  }

  savePolicyConfig() {
    this.savingPolicy = true;
    this.api.post<{ success: boolean; config: AttendanceConfig }>('attendance/config', { frequency: this.modalSelectedFrequency }).subscribe({
      next: (res) => {
        this.savingPolicy = false;
        this.showPolicyModal = false;
        this.attendanceConfig = res.config || { frequency: this.modalSelectedFrequency, isConfigured: true };
        this.toast.success(
          `Attendance policy updated: School will record attendance ${this.modalSelectedFrequency === 'TWICE_DAILY' ? 'Twice a Day (Morning & Afternoon)' : 'Once a Day (Daily Homeroom)'}!`
        );
        if (!this.auth.isParent()) {
          this.loadAttendance();
        } else {
          this.loadParentAttendance(this.parentSelectedChildId);
        }
      },
      error: () => {
        this.savingPolicy = false;
        this.toast.error('Could not save attendance policy configuration.');
      },
    });
  }

  setSession(session: 'MORNING' | 'AFTERNOON') {
    this.selectedSession = session;
    this.loadAttendance();
  }

  // ==========================================
  // Calendar Navigation Helpers
  // ==========================================
  prevMonth() {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else {
      this.calendarMonth--;
    }
  }

  nextMonth() {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else {
      this.calendarMonth++;
    }
  }

  goToTodayMonth() {
    const now = new Date();
    this.calendarMonth = now.getMonth();
    this.calendarYear = now.getFullYear();
  }

  jumpToMonth(year: number, monthIndex: number) {
    this.calendarYear = year;
    this.calendarMonth = monthIndex;
    this.parentViewMode = 'MONTHLY';
  }

  private getDateRecordMap(): Map<string, any[]> {
    const map = new Map<string, any[]>();
    const recs = this.parentData?.records || this.parentData?.dailyHistory || [];
    for (const r of recs) {
      const d = r.date?.split('T')?.[0] || r.date;
      if (!d) continue;
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(r);
    }
    return map;
  }

  get calendarDays(): {
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    status?: string;
    morningStatus?: string;
    afternoonStatus?: string;
    reason?: string;
  }[] {
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const todayStr = new Date().toISOString().split('T')[0];
    const recMap = this.getDateRecordMap();

    const days = [];

    // Empty leading padding days
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        dateStr: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayRecs = recMap.get(dateStr) || [];
      let status: string | undefined = undefined;
      let morningStatus: string | undefined = undefined;
      let afternoonStatus: string | undefined = undefined;
      let reason: string | undefined = undefined;

      if (dayRecs.length > 0) {
        const morning = dayRecs.find((r) => r.session === 'MORNING') || dayRecs[0];
        const afternoon = dayRecs.find((r) => r.session === 'AFTERNOON');
        morningStatus = morning?.status;
        afternoonStatus = afternoon?.status;
        status = morning?.status;
        reason = morning?.reason || morning?.remarks || afternoon?.reason;

        // If twice daily, compute joint day status
        if (afternoon) {
          if (morningStatus === 'PRESENT' && afternoonStatus === 'PRESENT') {
            status = 'PRESENT';
          } else if (morningStatus === 'ABSENT' && afternoonStatus === 'ABSENT') {
            status = 'ABSENT';
          } else if ((morningStatus === 'PRESENT' && afternoonStatus === 'ABSENT') || (morningStatus === 'ABSENT' && afternoonStatus === 'PRESENT')) {
            status = 'HALF_DAY';
          }
        }
      }

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend,
        status,
        morningStatus,
        afternoonStatus,
        reason,
      });
    }

    return days;
  }

  get monthlyStats() {
    const days = this.calendarDays.filter((d) => d.isCurrentMonth && d.status);
    const present = days.filter((d) => d.status === 'PRESENT').length;
    const absent = days.filter((d) => d.status === 'ABSENT').length;
    const halfDay = days.filter((d) => d.status === 'HALF_DAY').length;
    const late = days.filter((d) => d.status === 'LATE').length;
    const total = days.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '100.0';
    return { total, present, absent, halfDay, late, percentage };
  }

  get yearlyMonths() {
    const recMap = this.getDateRecordMap();
    const months = [];
    const year = this.yearlySelectedYear;

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      let present = 0;
      let absent = 0;
      let halfDay = 0;
      let late = 0;
      let total = 0;
      const dayDots: { day: number; status?: string; isWeekend: boolean }[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const monthStr = String(m + 1).padStart(2, '0');
        const dayStr = String(d).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const dayOfWeek = new Date(year, m, d).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const dayRecs = recMap.get(dateStr) || [];
        let status: string | undefined = undefined;
        if (dayRecs.length > 0) {
          status = dayRecs[0].status;
          total++;
          if (status === 'PRESENT') present++;
          else if (status === 'ABSENT') absent++;
          else if (status === 'HALF_DAY') halfDay++;
          else if (status === 'LATE') late++;
        }
        dayDots.push({ day: d, status, isWeekend });
      }

      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '—';
      months.push({
        monthIndex: m,
        monthName: this.monthNames[m],
        year,
        total,
        present,
        absent,
        halfDay,
        late,
        percentage,
        dayDots,
      });
    }

    return months;
  }

  loadParentAttendance(studentId?: string) {
    const url = studentId ? `attendance/my-children?studentId=${studentId}` : 'attendance/my-children';
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.parentData = res;
        if (res.selectedChild) {
          this.parentSelectedChildId = res.selectedChild.studentId;
        }
      },
      error: () => {
        this.toast.error('Unable to fetch child attendance data.');
      },
    });
  }

  onParentChildSelect(childId: string) {
    this.parentSelectedChildId = childId;
    this.loadParentAttendance(childId);
  }

  formatDailyDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  isDateToday(dateStr: string): boolean {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    const itemDate = new Date(dateStr).toISOString().split('T')[0];
    return today === itemDate;
  }

  loadSections() {
    this.api.get<ClassItem[]>('academics/classes').subscribe({
      next: (classes) => {
        const flat: FlatSection[] = [];
        const classTeacherSectionIds = new Set<string>();
        const teachingScope = this.auth.currentUser()?.teachingScope;
        if (teachingScope?.classTeacherSections) {
          teachingScope.classTeacherSections.forEach((cts) => classTeacherSectionIds.add(cts.sectionId));
        }

        for (const c of classes) {
          if (c.sections && c.sections.length > 0) {
            for (const s of c.sections) {
              const secName = s.name.startsWith('Section') ? s.name : `Section ${s.name}`;
              flat.push({
                id: s.id,
                name: s.name,
                className: c.name,
                displayName: `${c.name} - ${secName}`,
                isClassTeacher: classTeacherSectionIds.has(s.id),
              });
            }
          }
        }

        if (this.auth.isTeacher()) {
          const teacherSectionIds = new Set<string>();
          teachingScope?.classTeacherSections?.forEach((cts) => teacherSectionIds.add(cts.sectionId));
          teachingScope?.subjectAssignments?.forEach((sa) => teacherSectionIds.add(sa.sectionId));
          
          if (teacherSectionIds.size > 0) {
            this.availableSections = flat.filter((sec) => teacherSectionIds.has(sec.id));
          } else {
            this.availableSections = flat;
          }
        } else {
          this.availableSections = flat;
        }

        if (this.availableSections.length > 0) {
          const defaultHomeroom = this.availableSections.find((s) => s.isClassTeacher);
          this.selectedSectionId = defaultHomeroom ? defaultHomeroom.id : this.availableSections[0].id;
          this.loadAttendance();
        }
      },
    });
  }

  loadAttendance() {
    if (!this.auth.isServiceEnabled('ATTENDANCE')) return;
    if (!this.selectedSectionId) return;

    const params: any = { date: this.selectedDate };
    if (this.attendanceConfig.frequency === 'TWICE_DAILY') {
      params.session = this.selectedSession;
    }

    this.api
      .get<AttendanceRegisterResponse>(`attendance/section/${this.selectedSectionId}`, params)
      .subscribe({
        next: (res) => {
          this.registerData = res;
          this.students = res.register;
          this.syncStatus = 'IDLE';
          this.currentPage = 1;
        },
      });
  }

  get filteredStudents(): AttendanceStudent[] {
    if (!this.searchQuery.trim()) return this.students;
    const q = this.searchQuery.toLowerCase().trim();
    return this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        String(s.rollNumber).includes(q)
    );
  }

  get paginatedStudents(): AttendanceStudent[] {
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

  updateStudentStatus(student: AttendanceStudent, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') {
    student.status = status;
    this.saveChanges();
  }

  markAll(status: 'PRESENT' | 'ABSENT' | 'HALF_DAY') {
    this.students.forEach((s) => (s.status = status));
    this.saveChanges();
  }

  setToday() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.loadAttendance();
  }

  setYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    this.selectedDate = d.toISOString().split('T')[0];
    this.loadAttendance();
  }

  setDaysAgo(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    this.selectedDate = d.toISOString().split('T')[0];
    this.loadAttendance();
  }

  isToday(): boolean {
    return this.selectedDate === new Date().toISOString().split('T')[0];
  }

  isYesterday(): boolean {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.selectedDate === d.toISOString().split('T')[0];
  }

  isDaysAgo(days: number): boolean {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return this.selectedDate === d.toISOString().split('T')[0];
  }

  getSelectedSectionName(): string {
    const sec = this.availableSections.find((s) => s.id === this.selectedSectionId);
    return sec ? sec.displayName : 'Selected Section';
  }

  countStatus(status: string): number {
    return this.students.filter((s) => s.status === status).length;
  }

  private autoSaveTimer: any = null;

  saveChanges() {
    if (!this.selectedSectionId || this.students.length === 0) return;
    this.syncStatus = 'SAVING';

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      const body: any = {
        sectionId: this.selectedSectionId,
        date: this.selectedDate,
        session: this.attendanceConfig.frequency === 'TWICE_DAILY' ? this.selectedSession : 'MORNING',
        records: this.students.map((s) => ({
          studentId: s.studentId,
          status: s.status === 'NOT_MARKED' ? 'PRESENT' : s.status,
          reason: s.reason || undefined,
        })),
      };

      this.api.post('attendance/bulk', body).subscribe({
        next: () => {
          this.syncStatus = 'SAVED';
          this.lastSyncTime = new Date().toLocaleTimeString();
        },
        error: (err) => {
          console.error('Auto-save attendance error:', err);
          this.syncStatus = 'ERROR';
        },
      });
    }, 350);
  }

  saveAttendance() {
    if (!this.selectedSectionId || this.students.length === 0) return;
    this.saving = true;

    const body: any = {
      sectionId: this.selectedSectionId,
      date: this.selectedDate,
      session: this.attendanceConfig.frequency === 'TWICE_DAILY' ? this.selectedSession : 'MORNING',
      records: this.students.map((s) => ({
        studentId: s.studentId,
        status: s.status === 'NOT_MARKED' ? 'PRESENT' : s.status,
        reason: s.reason || undefined,
      })),
    };

    this.api.post('attendance/bulk', body).subscribe({
      next: () => {
        this.saving = false;
        this.syncStatus = 'SAVED';
        this.lastSyncTime = new Date().toLocaleTimeString();
        const dateStr = this.isYesterday() ? 'Yesterday' : this.selectedDate;
        const sessionLabel = this.attendanceConfig.frequency === 'TWICE_DAILY' ? ` (${this.selectedSession === 'MORNING' ? 'Morning' : 'Afternoon'})` : '';
        this.toast.success(`Attendance register for ${this.getSelectedSectionName()}${sessionLabel} on ${dateStr} successfully saved!`);
      },
      error: () => {
        this.saving = false;
        this.syncStatus = 'ERROR';
        this.toast.error('Could not save attendance register. Please try again.');
      },
    });
  }

  exportToExcel() {
    const rows = this.students.map((s) => ({
      rollNumber: s.rollNumber,
      admissionNumber: s.admissionNumber,
      name: s.name,
      status: s.status,
      session: this.attendanceConfig.frequency === 'TWICE_DAILY' ? this.selectedSession : 'DAILY',
      reason: s.reason || '',
      date: this.selectedDate,
      section: this.getSelectedSectionName(),
    }));

    this.exportService.exportToCsv(
      `Attendance_${this.getSelectedSectionName()}_${this.selectedDate}`,
      rows,
      [
        { key: 'rollNumber', label: 'Roll No' },
        { key: 'admissionNumber', label: 'Admission Number' },
        { key: 'name', label: 'Student Name' },
        { key: 'status', label: 'Attendance Status' },
        { key: 'session', label: 'Session' },
        { key: 'reason', label: 'Remarks / Reason' },
        { key: 'date', label: 'Date' },
        { key: 'section', label: 'Section' },
      ]
    );
    this.toast.success('Attendance Excel (CSV) file downloaded!');
  }

  printAttendanceRoster() {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Campus';
    const rowsHtml = this.students
      .map(
        (s) => `
        <tr>
          <td>#${s.rollNumber}</td>
          <td>${s.admissionNumber}</td>
          <td><strong>${s.name}</strong></td>
          <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
          <td>${s.reason || '—'}</td>
        </tr>`
      )
      .join('');

    const sessionInfo = this.attendanceConfig.frequency === 'TWICE_DAILY' ? ` | <strong>Session:</strong> ${this.selectedSession}` : '';

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        <strong>Section:</strong> ${this.getSelectedSectionName()} | <strong>Date:</strong> ${this.selectedDate}${sessionInfo} | <strong>Total Strength:</strong> ${this.students.length}
      </div>
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Admission No</th>
            <th>Student Name</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    this.exportService.printReport(`Attendance Register (${this.selectedDate})`, schoolName, tableHtml);
  }

  exportParentAttendance() {
    const childName = this.parentData?.selectedChild?.name || 'Child';
    const className = `${this.parentData?.selectedChild?.className || ''} ${this.parentData?.selectedChild?.sectionName || ''}`.trim();
    const records = this.parentData?.dailyHistory || [];

    const rows = records.map((r: any) => ({
      date: r.date?.split('T')?.[0] || r.date,
      session: r.session || 'DAILY',
      status: r.status,
      reason: r.reason || '',
      child: childName,
      class: className,
    }));

    this.exportService.exportToCsv(
      `${childName.replace(/\s+/g, '_')}_Daily_Attendance_Report`,
      rows,
      [
        { key: 'date', label: 'Date' },
        { key: 'session', label: 'Session' },
        { key: 'status', label: 'Daily Status' },
        { key: 'reason', label: 'Reason / Remarks' },
        { key: 'child', label: 'Student Name' },
        { key: 'class', label: 'Class & Section' },
      ]
    );
    this.toast.success('Child daily attendance statement downloaded!');
  }
}



