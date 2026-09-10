import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { AttendanceRegisterResponse, AttendanceStudent, ClassItem } from '../../core/models';

interface FlatSection {
  id: string;
  name: string;
  className: string;
  displayName: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- ============================================================== -->
      <!-- TEACHER & ADMIN ATTENDANCE REGISTER                            -->
      <!-- ============================================================== -->
      <ng-container *ngIf="!auth.isParent()">
        
        <!-- Top Controls: Class/Section Selector + Date Presets & Export Actions -->
        <div class="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <!-- Section Selector & Active Badge -->
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Class & Section</label>
                <div class="relative min-w-[240px]">
                  <select [(ngModel)]="selectedSectionId" (change)="loadAttendance()"
                          class="w-full appearance-none px-4 py-2.5 pr-10 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] cursor-pointer transition-all">
                    <option *ngFor="let sec of availableSections" [value]="sec.id">
                      {{ sec.displayName }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Date Info Badge -->
              <div class="sm:pt-5">
                <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-[#f8fafc] text-slate-700 border border-slate-200 shadow-xs">
                  <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{{ getDateLabel() }}</span>
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
                  <span *ngIf="!saving">Save All</span>
                  <span *ngIf="saving">Saving...</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Live DB Sync Bar & Enterprise Export Buttons -->
          <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2">
              <span *ngIf="syncStatus === 'SAVED'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Synced ({{ lastSyncTime }})
              </span>
              <span *ngIf="syncStatus === 'SAVING'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span>
                Saving changes...
              </span>
              <span *ngIf="syncStatus === 'IDLE'" class="text-slate-400 text-[11px]">
                Click any status (Present / Absent / Late) to update attendance.
              </span>
            </div>

            <!-- Export Actions -->
            <div class="flex items-center gap-2">
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

        <!-- Quick Summary Cards -->
        <div *ngIf="registerData" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Strength</div>
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
            <div class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Late</div>
            <div class="text-2xl font-black text-amber-600 mt-1">{{ countStatus('LATE') }}</div>
          </div>
        </div>

        <!-- Quick Toggles & Search Bar -->
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
                  <th class="px-5 py-3.5">Instant Status Toggle</th>
                  <th class="px-5 py-3.5">Attendance Note</th>
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
                    <input type="text" [(ngModel)]="student.reason" (blur)="saveChanges()" placeholder="Optional remark/note..."
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
      <!-- PARENT VIEW: DYNAMIC CHILD ATTENDANCE & SUBJECT BREAKDOWN      -->
      <!-- ============================================================== -->
      <ng-container *ngIf="auth.isParent()">
        <!-- Header Banner with Child Selector & Summary -->
        <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 shadow-sm">
                Parent & Student Portal
              </span>
              <span class="text-xs text-slate-300">•</span>
              <span class="text-xs font-semibold text-slate-600">{{ parentData?.selectedChild?.className }} - {{ parentData?.selectedChild?.sectionName }}</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
              Child Attendance & Subject Performance
            </h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Pupil: <strong class="text-slate-800">{{ parentData?.selectedChild?.name || 'Your Child' }}</strong> • Roll No: <strong class="text-slate-800">#{{ parentData?.selectedChild?.rollNumber || 1 }}</strong> • Adm: <strong class="text-slate-800">{{ parentData?.selectedChild?.admissionNumber }}</strong>
            </p>
          </div>
          
          <div class="flex items-center gap-4 flex-wrap">
            <!-- Child Switcher (if multiple children) -->
            <div *ngIf="parentData?.childrenList?.length > 1" class="flex items-center gap-2">
              <label class="text-xs font-bold text-slate-600">Child:</label>
              <select [ngModel]="parentSelectedChildId" (ngModelChange)="onParentChildSelect($event)"
                      class="px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
                <option *ngFor="let c of parentData?.childrenList" [value]="c.studentId">
                  {{ c.name }} ({{ c.className }})
                </option>
              </select>
            </div>

            <!-- Overall Percentage KPI -->
            <div class="px-5 py-3 rounded-2xl bg-[#f8fafc] border border-slate-200/90 shadow-inner flex items-center gap-3">
              <div class="text-right">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Term Attendance</span>
                <div class="text-2xl font-black"
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
              <span>Download Statement</span>
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Days</span>
            <div class="text-xl sm:text-2xl font-black text-slate-900 mt-1">{{ parentData?.overallSummary?.totalDays || 0 }} Days</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Academic Session</div>
          </div>

          <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Present</span>
            <div class="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{{ parentData?.overallSummary?.presentDays || 0 }} Days</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-0.5">Regular in Class</div>
          </div>

          <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Absent</span>
            <div class="text-xl sm:text-2xl font-black"
                 [ngClass]="(parentData?.overallSummary?.absentDays || 0) > 0 ? 'text-rose-600 font-black' : 'text-slate-900'">
              {{ parentData?.overallSummary?.absentDays || 0 }} Days
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5">Unexcused / Leave</div>
          </div>

          <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timetable & Schedule</span>
            <a routerLink="/timetable" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 mt-2">
              <span>View Weekly Timetable</span>
              <span>&rarr;</span>
            </a>
            <div class="text-[11px] text-slate-500 mt-0.5">Periods & Recess slots</div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- SUBJECT-WISE ATTENDANCE BREAKDOWN TABLE                        -->
        <!-- ============================================================== -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Subject-Wise Attendance Breakdown</h3>
                <p class="text-[11px] text-slate-500">Period attendance distribution across individual courses</p>
              </div>
            </div>
            <span class="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
              {{ parentData?.subjectBreakdown?.length || 0 }} Subjects Enrolled
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th class="p-4">Subject</th>
                  <th class="p-4 text-center">Subject Code</th>
                  <th class="p-4 text-center">Total Periods</th>
                  <th class="p-4 text-center">Attended</th>
                  <th class="p-4 text-center">Absent</th>
                  <th class="p-4">Attendance Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let sub of parentData?.subjectBreakdown" class="hover:bg-slate-50/60 transition-colors">
                  <td class="p-4 font-bold text-slate-900">
                    {{ sub.subjectName }}
                    <span *ngIf="sub.subjectType" class="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                      {{ sub.subjectType }}
                    </span>
                  </td>
                  <td class="p-4 text-center font-mono font-bold text-slate-600">
                    {{ sub.subjectCode }}
                  </td>
                  <td class="p-4 text-center font-bold text-slate-800">
                    {{ sub.totalPeriods }}
                  </td>
                  <td class="p-4 text-center font-bold text-emerald-600">
                    {{ sub.attendedPeriods }}
                  </td>
                  <td class="p-4 text-center font-bold"
                      [ngClass]="sub.absentPeriods > 0 ? 'text-rose-600' : 'text-slate-400'">
                    {{ sub.absentPeriods }}
                  </td>
                  <td class="p-4 w-52">
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div class="h-full rounded-full transition-all"
                             [ngClass]="{
                               'bg-emerald-500': +sub.percentage >= 90,
                               'bg-amber-500': +sub.percentage >= 75 && +sub.percentage < 90,
                               'bg-rose-500': +sub.percentage < 75
                             }"
                             [style.width.%]="+sub.percentage">
                        </div>
                      </div>
                      <span class="font-black text-xs min-w-[45px] text-right"
                            [ngClass]="{
                              'text-emerald-600': +sub.percentage >= 90,
                              'text-amber-600': +sub.percentage >= 75 && +sub.percentage < 90,
                              'text-rose-600': +sub.percentage < 75
                            }">
                        {{ sub.percentage }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- DAILY ATTENDANCE REGISTER LOGS                                 -->
        <!-- ============================================================== -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Daily Homeroom Register History</h3>
              <p class="text-[11px] text-slate-500">Real-time attendance entries marked by the class teacher</p>
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
    </div>
  `,
})
export class AttendanceComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exportService = inject(ExportService);
  
  selectedDate = new Date().toISOString().split('T')[0];
  selectedSectionId = '';
  availableSections: FlatSection[] = [];
  
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

  get parentAttendancePct(): number {
    return parseFloat(this.parentData?.overallSummary?.percentage || '100');
  }

  ngOnInit() {
    if (this.auth.isParent()) {
      this.loadParentAttendance();
    } else {
      this.loadSections();
    }
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
        for (const c of classes) {
          if (c.sections && c.sections.length > 0) {
            for (const s of c.sections) {
              const secName = s.name.startsWith('Section') ? s.name : `Section ${s.name}`;
              flat.push({
                id: s.id,
                name: s.name,
                className: c.name,
                displayName: `${c.name} - ${secName}`,
              });
            }
          }
        }

        // Scope to assigned teaching sections if Teacher
        const teacherSectionIds = new Set<string>();
        const teachingScope = this.auth.currentUser()?.teachingScope;
        if (teachingScope) {
          teachingScope.classTeacherSections?.forEach((cts) => teacherSectionIds.add(cts.sectionId));
          teachingScope.subjectAssignments?.forEach((sa) => teacherSectionIds.add(sa.sectionId));
        }

        if (this.auth.isTeacher() && teacherSectionIds.size > 0) {
          this.availableSections = flat.filter((sec) => teacherSectionIds.has(sec.id));
        } else {
          this.availableSections = flat;
        }

        if (this.availableSections.length > 0) {
          this.selectedSectionId = this.availableSections[0].id;
          this.loadAttendance();
        }
      },
    });
  }

  loadAttendance() {
    if (!this.selectedSectionId) return;

    this.api
      .get<AttendanceRegisterResponse>(`attendance/section/${this.selectedSectionId}`, { date: this.selectedDate })
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

  updateStudentStatus(student: AttendanceStudent, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    student.status = status;
    this.saveChanges();
  }

  markAll(status: 'PRESENT' | 'ABSENT') {
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

  getDateLabel(): string {
    if (this.isToday()) return `Today (${this.selectedDate})`;
    if (this.isYesterday()) return `Yesterday (${this.selectedDate})`;
    return `Selected Date: ${this.selectedDate}`;
  }

  getSelectedSectionName(): string {
    const sec = this.availableSections.find((s) => s.id === this.selectedSectionId);
    return sec ? sec.displayName : 'Selected Section';
  }

  countStatus(status: string): number {
    return this.students.filter((s) => s.status === status).length;
  }

  saveChanges() {
    if (!this.selectedSectionId || this.students.length === 0) return;
    this.syncStatus = 'SAVING';

    const body = {
      sectionId: this.selectedSectionId,
      date: this.selectedDate,
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
      error: () => {
        this.syncStatus = 'ERROR';
        this.toast.error('Failed to auto-save attendance.');
      },
    });
  }

  saveAttendance() {
    if (!this.selectedSectionId || this.students.length === 0) return;
    this.saving = true;

    const body = {
      sectionId: this.selectedSectionId,
      date: this.selectedDate,
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
        this.toast.success(`Attendance for ${this.getSelectedSectionName()} on ${dateStr} successfully saved!`);
      },
      error: () => {
        this.saving = false;
        this.syncStatus = 'ERROR';
        this.toast.error('Could not save attendance. Please try again.');
      },
    });
  }

  exportToExcel() {
    const rows = this.students.map((s) => ({
      rollNumber: s.rollNumber,
      admissionNumber: s.admissionNumber,
      name: s.name,
      status: s.status,
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
        { key: 'reason', label: 'Remarks / Notes' },
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

    const tableHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        <strong>Section:</strong> ${this.getSelectedSectionName()} | <strong>Date:</strong> ${this.selectedDate} | <strong>Total Strength:</strong> ${this.students.length}
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
      status: r.status,
      reason: r.reason || '',
      child: childName,
      class: className,
    }));

    this.exportService.exportToCsv(
      `${childName.replace(/\s+/g, '_')}_Attendance_Report`,
      rows,
      [
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'reason', label: 'Reason / Remarks' },
        { key: 'child', label: 'Student Name' },
        { key: 'class', label: 'Class & Section' },
      ]
    );
    this.toast.success('Child attendance statement downloaded!');
  }
}



