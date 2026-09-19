import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

interface TimetablePeriodItem {
  id: string;
  dayOfWeek: number;
  dayName: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  slotType: 'ACADEMIC' | 'BREAK' | 'LUNCH' | 'ASSEMBLY' | 'SPORTS' | 'LIBRARY' | 'ACTIVITY';
  title: string;
  subjectName: string | null;
  subjectCode: string | null;
  classSubjectId?: string;
  teacherId?: string;
  teacherName?: string | null;
  roomNumber?: string;
  className?: string;
  sectionName?: string;
}

interface AvailableSubject {
  classSubjectId: string;
  subjectId: string;
  name: string;
  code: string;
  subjectType: string;
}

interface ClassItem {
  id: string;
  name: string;
  code: string;
  sections: { id: string; name: string; code: string }[];
}

interface ChildItem {
  studentId: string;
  admissionNumber: string;
  name: string;
  rollNumber: string | null;
  sectionId: string | null;
  sectionName: string | null;
  className: string | null;
}

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export type DayScheduleType = 'WORKING_DAY' | 'HOLIDAY' | 'VACATION' | 'EXAM_DAY' | 'EVENT_DAY' | 'WEEKLY_OFF';

export interface CalendarDayEntry {
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: number; // 0=Sun, 1=Mon...6=Sat
  dayName: string; // 'Sun', 'Mon'
  dayNumber: number; // 1..31
  monthNumber: number; // 1..12
  year: number; // 2026, 2027
  type: DayScheduleType;
  title?: string;
  note?: string;
  wing?: string;
  workingDayIndex?: number;
}

export interface MonthItem {
  id: string; // '2026-03'
  monthIndex: number; // 0..11
  name: string; // 'March'
  year: number; // 2026
  days: CalendarDayEntry[];
  workingDaysCount: number;
  holidaysCount: number;
  eventsCount: number;
  examsCount: number;
  vacationCount: number;
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- ============================================================== -->
      <!-- TOP PRIMARY MODE TABS (For Admins, Teachers & Parents)          -->
      <!-- ============================================================== -->
      <div *ngIf="canSwitchModes" class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        
        <!-- Student / Class Timetable Tab -->
        <button (click)="setMode('STUDENT')"
                [class.bg-slate-900]="timetableMode === 'STUDENT'"
                [class.text-white]="timetableMode === 'STUDENT'"
                [class.shadow-md]="timetableMode === 'STUDENT'"
                [class.bg-white]="timetableMode !== 'STUDENT'"
                [class.text-slate-700]="timetableMode !== 'STUDENT'"
                class="px-5 py-2.5 rounded-2xl text-xs font-bold border border-slate-200/80 transition-all flex items-center gap-2 cursor-pointer shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <span>Student / Class Timetable</span>
          <span class="text-[10px] px-2 py-0.5 rounded-lg" [ngClass]="timetableMode === 'STUDENT' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'">
            {{ flatSections.length }} Sections
          </span>
        </button>

        <!-- Faculty / Teacher Timetable Tab -->
        <button (click)="setMode('FACULTY')"
                [class.bg-slate-900]="timetableMode === 'FACULTY'"
                [class.text-white]="timetableMode === 'FACULTY'"
                [class.shadow-md]="timetableMode === 'FACULTY'"
                [class.bg-white]="timetableMode !== 'FACULTY'"
                [class.text-slate-700]="timetableMode !== 'FACULTY'"
                class="px-5 py-2.5 rounded-2xl text-xs font-bold border border-slate-200/80 transition-all flex items-center gap-2 cursor-pointer shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Faculty / Teacher Timetable</span>
          <span class="text-[10px] px-2 py-0.5 rounded-lg" [ngClass]="timetableMode === 'FACULTY' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'">
            {{ teachersList.length }} Faculty & Staff
          </span>
        </button>

        <!-- Academic Year Calendar & Schedule Tab -->
        <button (click)="setMode('ACADEMIC')"
                [class.bg-slate-900]="timetableMode === 'ACADEMIC'"
                [class.text-white]="timetableMode === 'ACADEMIC'"
                [class.shadow-md]="timetableMode === 'ACADEMIC'"
                [class.bg-white]="timetableMode !== 'ACADEMIC'"
                [class.text-slate-700]="timetableMode !== 'ACADEMIC'"
                class="px-5 py-2.5 rounded-2xl text-xs font-bold border border-slate-200/80 transition-all flex items-center gap-2 cursor-pointer shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Academic Year Calendar & Routine</span>
          <span class="text-[10px] px-2 py-0.5 rounded-lg" [ngClass]="timetableMode === 'ACADEMIC' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'">
            {{ academicSessionName }}
          </span>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- TOP HEADER BANNER (Role-Tailored)                              -->
      <!-- ============================================================== -->
      <div class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border shadow-sm"
                  [ngClass]="{
                    'bg-slate-100 text-slate-700 border-slate-200': auth.isAdmin() || auth.isSuperAdmin() || auth.isPrincipal(),
                    'bg-emerald-50 text-emerald-700 border-emerald-200': auth.isTeacher() && !auth.isAdmin(),
                    'bg-indigo-50 text-indigo-700 border-indigo-200': auth.isParent()
                  }">
              {{ auth.isParent() ? 'Parent & Student Portal' : (timetableMode === 'ACADEMIC' ? 'Institutional Academic Schedule' : (timetableMode === 'FACULTY' ? 'Faculty Schedule' : 'Class Schedule')) }}
            </span>
            <span class="text-xs text-slate-300">•</span>
            <span class="text-xs font-semibold text-slate-600">{{ currentSectionTitle }}</span>
          </div>

          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            {{ headerTitle }}
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ headerSubtitle }}
          </p>
        </div>

        <!-- Right Action Controls -->
        <div class="flex items-center gap-3 flex-wrap">
          
          <!-- Child Switcher for Parents -->
          <div *ngIf="auth.isParent() && childrenList.length > 1 && timetableMode !== 'ACADEMIC'" class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-600">Select Child:</label>
            <select [ngModel]="selectedChildId" (ngModelChange)="onChildChange($event)"
                    class="px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
              <option *ngFor="let child of childrenList" [value]="child.studentId">
                {{ child.name }} ({{ child.className }} - {{ child.sectionName }})
              </option>
            </select>
          </div>

          <!-- Class & Section 2-Dropdown Switcher for Admin / Principal (Student Timetable Mode) -->
          <div *ngIf="canSwitchModes && timetableMode === 'STUDENT'" class="flex items-center gap-2.5 flex-wrap">
            <!-- 1. Class Dropdown -->
            <div class="flex items-center gap-1.5">
              <label class="text-xs font-bold text-slate-600">Class:</label>
              <select [ngModel]="selectedClassId" (ngModelChange)="onClassChange($event)"
                      class="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
                <option *ngFor="let cls of classesList" [value]="cls.id">
                  {{ cls.name }}
                </option>
              </select>
            </div>

            <!-- 2. Section Dropdown -->
            <div class="flex items-center gap-1.5">
              <label class="text-xs font-bold text-slate-600">Section:</label>
              <select [ngModel]="selectedSectionId" (ngModelChange)="onSectionChange($event)"
                      class="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
                <option *ngFor="let sec of currentClassSections" [value]="sec.id">
                  {{ sec.name }}
                </option>
              </select>
            </div>

            <button *ngIf="canEditCurrentTimetable" (click)="openAddPeriodModal()"
                    class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Period / Break</span>
            </button>
          </div>

          <!-- Faculty Switcher for Admin / Principal (Faculty Timetable Mode) -->
          <div *ngIf="canSwitchModes && timetableMode === 'FACULTY'" class="flex items-center gap-2 flex-wrap">
            <label class="text-xs font-bold text-slate-600">Faculty / Staff Member:</label>
            <select [ngModel]="selectedTeacherId" (ngModelChange)="onTeacherChange($event)"
                    class="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
              <option *ngFor="let t of teachersList" [value]="t.id">
                {{ t.name }} ({{ formatRoleName(t.role) }} • {{ t.email }})
              </option>
            </select>
          </div>

          <!-- Academic Calendar Controls (ACADEMIC Mode) -->
          <div *ngIf="timetableMode === 'ACADEMIC'" class="flex items-center gap-2.5 flex-wrap">
            <!-- Session Switcher -->
            <div class="flex items-center gap-1.5">
              <label class="text-xs font-bold text-slate-600">Session:</label>
              <select [(ngModel)]="academicSessionName" (ngModelChange)="onAcademicSessionChange($event)"
                      class="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
                <option *ngFor="let s of availableSessions" [value]="s.name">{{ s.name }}</option>
              </select>
            </div>

            <!-- Configure Session Bounds / Date Range (For Admins) -->
            <button *ngIf="canEditCurrentTimetable" (click)="openSessionBoundsModal()"
                    class="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Session Bounds</span>
            </button>

            <!-- Add Holiday / Event Button -->
            <button *ngIf="canEditCurrentTimetable" (click)="openAddHolidayModal()"
                    class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Holiday / Event</span>
            </button>
          </div>

          <!-- View Layout Toggle (Weekly Grid vs Day View vs Calendar Views) -->
          <div *ngIf="timetableMode !== 'ACADEMIC'" class="flex items-center p-1 bg-[#edf2f7] rounded-2xl border border-slate-200 shadow-inner">
            <button (click)="viewLayout = 'GRID'"
                    [class.bg-white]="viewLayout === 'GRID'"
                    [class.shadow-xs]="viewLayout === 'GRID'"
                    [class.text-slate-900]="viewLayout === 'GRID'"
                    [class.text-slate-500]="viewLayout !== 'GRID'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Weekly Grid</span>
            </button>

            <button (click)="viewLayout = 'DAY'"
                    [class.bg-white]="viewLayout === 'DAY'"
                    [class.shadow-xs]="viewLayout === 'DAY'"
                    [class.text-slate-900]="viewLayout === 'DAY'"
                    [class.text-slate-500]="viewLayout !== 'DAY'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Day View</span>
            </button>
          </div>

          <!-- Academic Calendar View Toggle -->
          <div *ngIf="timetableMode === 'ACADEMIC'" class="flex items-center p-1 bg-[#edf2f7] rounded-2xl border border-slate-200 shadow-inner">
            <button (click)="academicCalendarView = 'MONTH_GRID'"
                    [class.bg-white]="academicCalendarView === 'MONTH_GRID'"
                    [class.shadow-xs]="academicCalendarView === 'MONTH_GRID'"
                    [class.text-slate-900]="academicCalendarView === 'MONTH_GRID'"
                    [class.text-slate-500]="academicCalendarView !== 'MONTH_GRID'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Month Grid</span>
            </button>

            <button (click)="academicCalendarView = 'AGENDA_LIST'"
                    [class.bg-white]="academicCalendarView === 'AGENDA_LIST'"
                    [class.shadow-xs]="academicCalendarView === 'AGENDA_LIST'"
                    [class.text-slate-900]="academicCalendarView === 'AGENDA_LIST'"
                    [class.text-slate-500]="academicCalendarView !== 'AGENDA_LIST'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Day Agenda</span>
            </button>

            <button (click)="academicCalendarView = 'YEAR_OVERVIEW'"
                    [class.bg-white]="academicCalendarView === 'YEAR_OVERVIEW'"
                    [class.shadow-xs]="academicCalendarView === 'YEAR_OVERVIEW'"
                    [class.text-slate-900]="academicCalendarView === 'YEAR_OVERVIEW'"
                    [class.text-slate-500]="academicCalendarView !== 'YEAR_OVERVIEW'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>12-Month Matrix</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- SECTION A: ACADEMIC CALENDAR & YEAR TIMETABLE (When ACADEMIC Mode Active) -->
      <!-- ========================================================================= -->
      <div *ngIf="timetableMode === 'ACADEMIC'" class="space-y-6">
        
        <!-- Academic Session KPI Analytics Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          <!-- Total Span -->
          <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Session Span</span>
              <span class="p-1.5 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            </div>
            <div class="mt-2">
              <div class="text-xl sm:text-2xl font-black text-slate-900">{{ calendarStats.totalDays }} <span class="text-xs font-bold text-slate-400">Days</span></div>
              <div class="text-[11px] text-slate-500 font-medium truncate mt-0.5">{{ academicCalendarData.startDate | date:'d MMM y' }} — {{ academicCalendarData.endDate | date:'d MMM y' }}</div>
            </div>
          </div>

          <!-- Working Teaching Days -->
          <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Teaching Days</span>
              <span class="p-1.5 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </span>
            </div>
            <div class="mt-2">
              <div class="text-xl sm:text-2xl font-black text-blue-900">{{ calendarStats.workingDays }} <span class="text-xs font-bold text-blue-500">Days</span></div>
              <div class="text-[11px] text-blue-600/90 font-medium mt-0.5">{{ calendarStats.workingDaysPercentage }}% Instructional Time</div>
            </div>
          </div>

          <!-- Holidays & Breaks -->
          <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Holidays & Offs</span>
              <span class="p-1.5 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
            </div>
            <div class="mt-2">
              <div class="text-xl sm:text-2xl font-black text-amber-900">{{ calendarStats.holidays + calendarStats.weeklyOffs }} <span class="text-xs font-bold text-amber-500">Days</span></div>
              <div class="text-[11px] text-amber-600/90 font-medium mt-0.5">{{ calendarStats.holidays }} Gazetted • {{ calendarStats.weeklyOffs }} Weekends</div>
            </div>
          </div>

          <!-- Examinations -->
          <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Exam Periods</span>
              <span class="p-1.5 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </span>
            </div>
            <div class="mt-2">
              <div class="text-xl sm:text-2xl font-black text-rose-900">{{ calendarStats.exams }} <span class="text-xs font-bold text-rose-500">Days</span></div>
              <div class="text-[11px] text-rose-600/90 font-medium mt-0.5">Term Tests & Annual Boards</div>
            </div>
          </div>

          <!-- Events & Functions -->
          <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col justify-between col-span-2 sm:col-span-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Events & Meets</span>
              <span class="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
            </div>
            <div class="mt-2">
              <div class="text-xl sm:text-2xl font-black text-emerald-900">{{ calendarStats.events }} <span class="text-xs font-bold text-emerald-500">Days</span></div>
              <div class="text-[11px] text-emerald-600/90 font-medium mt-0.5">Sports, PTMs & Cultural Fests</div>
            </div>
          </div>

        </div>

        <!-- Chronological Month Selector Bar (March 2026 -> February 2027) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button *ngFor="let month of sessionMonths" (click)="selectedMonthId = month.id"
                  [class.bg-slate-900]="selectedMonthId === month.id"
                  [class.text-white]="selectedMonthId === month.id"
                  [class.shadow-[3px_3px_8px_#cbd5e1,-3px_-3px_8px_#ffffff]]="selectedMonthId === month.id"
                  [class.bg-white]="selectedMonthId !== month.id"
                  [class.text-slate-700]="selectedMonthId !== month.id"
                  class="px-4 py-2.5 rounded-2xl border border-slate-200/80 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0">
            <span>{{ month.name }} {{ month.year }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-md"
                  [ngClass]="selectedMonthId === month.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'">
              {{ month.workingDaysCount }} Work Days
            </span>
          </button>
        </div>

        <!-- Sub-View 1: Monthly Calendar Grid Matrix -->
        <div *ngIf="academicCalendarView === 'MONTH_GRID' && currentSelectedMonth"
             class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
          
          <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm">
                {{ currentSelectedMonth.monthIndex + 1 }}
              </div>
              <div>
                <h3 class="text-base font-black text-slate-900">
                  {{ currentSelectedMonth.name }} {{ currentSelectedMonth.year }} Academic Schedule
                </h3>
                <p class="text-xs text-slate-500">
                  {{ currentSelectedMonth.workingDaysCount }} Teaching Days • {{ currentSelectedMonth.holidaysCount }} Holidays • {{ currentSelectedMonth.examsCount }} Exam Days
                </p>
              </div>
            </div>

            <!-- Visual Legend -->
            <div class="flex items-center gap-3 text-[11px] flex-wrap">
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span class="text-slate-600 font-semibold">Teaching Day</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span class="text-slate-600 font-semibold">Holiday</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                <span class="text-slate-600 font-semibold">Vacation</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span class="text-slate-600 font-semibold">Exam</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span class="text-slate-600 font-semibold">Event</span>
              </span>
            </div>
          </div>

          <!-- 7-Column Calendar Grid -->
          <div class="overflow-x-auto p-4 sm:p-6">
            <div class="grid grid-cols-7 gap-2 min-w-[750px]">
              
              <!-- Weekday Headers -->
              <div *ngFor="let w of ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']"
                   class="text-center text-[11px] font-black text-slate-500 uppercase tracking-wider py-2 bg-slate-50 rounded-xl">
                {{ w }}
              </div>

              <!-- Leading Empty Slots -->
              <div *ngFor="let empty of getLeadingEmptySlots(currentSelectedMonth)" class="min-h-[105px] rounded-2xl bg-slate-50/40 border border-slate-100"></div>

              <!-- Day Cells -->
              <div *ngFor="let day of currentSelectedMonth.days"
                   (click)="onDayCellClick(day)"
                   [ngClass]="{
                     'bg-white border-slate-200/90 hover:border-indigo-300': day.type === 'WORKING_DAY',
                     'bg-amber-50/70 border-amber-300 text-amber-950': day.type === 'HOLIDAY',
                     'bg-purple-50/70 border-purple-300 text-purple-950': day.type === 'VACATION',
                     'bg-rose-50/70 border-rose-300 text-rose-950': day.type === 'EXAM_DAY',
                     'bg-emerald-50/70 border-emerald-300 text-emerald-950': day.type === 'EVENT_DAY',
                     'bg-slate-100/60 border-slate-200 text-slate-500': day.type === 'WEEKLY_OFF'
                   }"
                   class="group relative min-h-[105px] p-2.5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between cursor-pointer hover:shadow-md">
                
                <!-- Day Number & Working Index -->
                <div class="flex items-center justify-between">
                  <span class="text-sm font-black" [ngClass]="day.type === 'WEEKLY_OFF' ? 'text-slate-500' : 'text-slate-900'">
                    {{ day.dayNumber }}
                  </span>
                  
                  <span *ngIf="day.type === 'WORKING_DAY' && day.workingDayIndex"
                        class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    #{{ day.workingDayIndex }}
                  </span>

                  <span *ngIf="day.type !== 'WORKING_DAY'" class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                        [ngClass]="{
                          'bg-amber-100 text-amber-800': day.type === 'HOLIDAY',
                          'bg-purple-100 text-purple-800': day.type === 'VACATION',
                          'bg-rose-100 text-rose-800': day.type === 'EXAM_DAY',
                          'bg-emerald-100 text-emerald-800': day.type === 'EVENT_DAY',
                          'bg-slate-200 text-slate-600': day.type === 'WEEKLY_OFF'
                        }">
                    {{ day.type === 'WEEKLY_OFF' ? 'Off' : (day.type === 'EXAM_DAY' ? 'Exam' : (day.type === 'EVENT_DAY' ? 'Event' : (day.type === 'VACATION' ? 'Break' : 'Holiday'))) }}
                  </span>
                </div>

                <!-- Day Title / Event description -->
                <div class="my-1">
                  <div class="text-[11px] font-extrabold line-clamp-2 leading-tight"
                       [ngClass]="{
                         'text-slate-700': day.type === 'WORKING_DAY',
                         'text-amber-900': day.type === 'HOLIDAY',
                         'text-purple-900': day.type === 'VACATION',
                         'text-rose-900': day.type === 'EXAM_DAY',
                         'text-emerald-900': day.type === 'EVENT_DAY',
                         'text-slate-400': day.type === 'WEEKLY_OFF'
                       }">
                    {{ day.title || (day.type === 'WORKING_DAY' ? 'Teaching Day' : 'Weekly Off') }}
                  </div>
                </div>

                <!-- Footer Pill / Action on Hover -->
                <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100/60">
                  <span class="capitalize">{{ day.dayName }}</span>
                  <span *ngIf="canEditCurrentTimetable" class="opacity-0 group-hover:opacity-100 text-indigo-600 font-bold underline transition-opacity">
                    Edit
                  </span>
                </div>

              </div>

            </div>
          </div>

        </div>

        <!-- Sub-View 2: Day-by-Day Agenda List -->
        <div *ngIf="academicCalendarView === 'AGENDA_LIST' && currentSelectedMonth"
             class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] p-6 space-y-4">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-black text-slate-900">{{ currentSelectedMonth.name }} {{ currentSelectedMonth.year }} Daily Agenda</h3>
              <p class="text-xs text-slate-500">Itemized schedule of classes, holidays, exams and events</p>
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let day of currentSelectedMonth.days"
                 class="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 px-3 rounded-2xl transition-colors">
              
              <div class="flex items-center gap-4">
                <!-- Date Indicator Circle -->
                <div class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border"
                     [ngClass]="{
                       'bg-blue-50 text-blue-900 border-blue-200': day.type === 'WORKING_DAY',
                       'bg-amber-50 text-amber-900 border-amber-200': day.type === 'HOLIDAY',
                       'bg-purple-50 text-purple-900 border-purple-200': day.type === 'VACATION',
                       'bg-rose-50 text-rose-900 border-rose-200': day.type === 'EXAM_DAY',
                       'bg-emerald-50 text-emerald-900 border-emerald-200': day.type === 'EVENT_DAY',
                       'bg-slate-100 text-slate-600 border-slate-200': day.type === 'WEEKLY_OFF'
                     }">
                  <span class="text-[9px] font-black uppercase">{{ day.dayName }}</span>
                  <span class="text-base font-black leading-none mt-0.5">{{ day.dayNumber }}</span>
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black" [ngClass]="day.type === 'WEEKLY_OFF' ? 'text-slate-500' : 'text-slate-900'">
                      {{ day.title || (day.type === 'WORKING_DAY' ? 'Regular Teaching & Classroom Sessions' : 'Scheduled Weekly Off') }}
                    </span>
                    <span *ngIf="day.type === 'WORKING_DAY' && day.workingDayIndex" class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800">
                      Day #{{ day.workingDayIndex }}
                    </span>
                  </div>
                  <p *ngIf="day.note" class="text-xs text-slate-500 mt-0.5">{{ day.note }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3 self-end sm:self-center">
                <span class="px-3 py-1 rounded-xl text-xs font-bold border"
                      [ngClass]="{
                        'bg-blue-50 text-blue-800 border-blue-200': day.type === 'WORKING_DAY',
                        'bg-amber-50 text-amber-800 border-amber-200': day.type === 'HOLIDAY',
                        'bg-purple-50 text-purple-800 border-purple-200': day.type === 'VACATION',
                        'bg-rose-50 text-rose-800 border-rose-200': day.type === 'EXAM_DAY',
                        'bg-emerald-50 text-emerald-800 border-emerald-200': day.type === 'EVENT_DAY',
                        'bg-slate-100 text-slate-700 border-slate-200': day.type === 'WEEKLY_OFF'
                      }">
                  {{ day.type }}
                </span>

                <button *ngIf="canEditCurrentTimetable" (click)="onDayCellClick(day)"
                        class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer">
                  Configure
                </button>
              </div>

            </div>
          </div>

        </div>

        <!-- Sub-View 3: 12-Month Year Overview Matrix -->
        <div *ngIf="academicCalendarView === 'YEAR_OVERVIEW'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let month of sessionMonths"
               class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] space-y-3 cursor-pointer hover:border-indigo-300 transition-all"
               (click)="selectedMonthId = month.id; academicCalendarView = 'MONTH_GRID'">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 class="text-sm font-black text-slate-900">{{ month.name }} {{ month.year }}</h4>
              <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                {{ month.workingDaysCount }} Work Days
              </span>
            </div>

            <!-- Mini Month stats -->
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div class="text-slate-400 text-[10px] font-bold">Total</div>
                <div class="font-black text-slate-800 mt-0.5">{{ month.days.length }}</div>
              </div>
              <div class="p-2 rounded-xl bg-amber-50 border border-amber-100">
                <div class="text-amber-700 text-[10px] font-bold">Holidays</div>
                <div class="font-black text-amber-900 mt-0.5">{{ month.holidaysCount }}</div>
              </div>
              <div class="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <div class="text-rose-700 text-[10px] font-bold">Exams</div>
                <div class="font-black text-rose-900 mt-0.5">{{ month.examsCount }}</div>
              </div>
            </div>

            <!-- Key Events in this month -->
            <div class="space-y-1 text-xs">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Highlights</div>
              <div *ngFor="let d of getMonthHighlights(month)" class="flex items-center gap-1.5 text-slate-700 truncate">
                <span class="w-1.5 h-1.5 rounded-full shrink-0"
                      [ngClass]="d.type === 'HOLIDAY' ? 'bg-amber-500' : (d.type === 'EXAM_DAY' ? 'bg-rose-500' : 'bg-emerald-500')"></span>
                <span class="font-bold text-slate-900 text-[11px] shrink-0">{{ d.dayNumber }} {{ month.name | slice:0:3 }}:</span>
                <span class="truncate text-[11px] text-slate-600">{{ d.title }}</span>
              </div>
              <div *ngIf="getMonthHighlights(month).length === 0" class="text-[11px] text-slate-400 italic">
                Standard instructional schedule
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-end">
              <span class="text-xs font-bold text-indigo-600 hover:underline">View Full Month &rarr;</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- SECTION B: CLASS / STUDENT TIMETABLE (When STUDENT or FACULTY Mode Active)-->
      <!-- ========================================================================= -->
      <div *ngIf="timetableMode !== 'ACADEMIC'" class="space-y-6">
        
        <!-- DAY SELECTOR TABS (Active when Day View is active) -->
        <div *ngIf="viewLayout === 'DAY'" class="flex items-center gap-2 overflow-x-auto pb-2">
          <button *ngFor="let day of days" (click)="activeDayTab = day.id"
                  [class.bg-slate-900]="activeDayTab === day.id"
                  [class.text-white]="activeDayTab === day.id"
                  [class.shadow-[3px_3px_8px_#cbd5e1,-3px_-3px_8px_#ffffff]]="activeDayTab === day.id"
                  [class.bg-white]="activeDayTab !== day.id"
                  [class.text-slate-700]="activeDayTab !== day.id"
                  class="px-5 py-3 rounded-2xl border border-slate-200/80 text-xs font-bold transition-all whitespace-nowrap cursor-pointer">
            {{ day.name }}
            <span class="ml-1.5 text-[10px] opacity-75 font-normal">({{ getPeriodsForDay(day.name).length }} Slots)</span>
          </button>
        </div>

        <!-- VIEW 1: WEEKLY MATRIX GRID VIEW -->
        <div *ngIf="viewLayout === 'GRID'" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_20px_#e2e8f0,-6px_-6px_20px_#ffffff] overflow-hidden">
          
          <!-- Grid Header Bar & Legend -->
          <div class="p-5 sm:p-6 border-b border-slate-100/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/90 via-white to-indigo-50/20">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-indigo-600 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 class="text-base font-black text-slate-900 tracking-tight">
                    {{ timetableMode === 'FACULTY' ? 'Faculty Weekly Routine Schedule' : 'Weekly Class Timetable Schedule' }}
                  </h3>
                  <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                    {{ timetableMode === 'FACULTY' ? 'Teaching Matrix' : 'Class Matrix' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5 font-medium">
                  {{ timetableMode === 'FACULTY' ? 'Assigned periods, room numbers, and class sections across the week.' : 'Mon to Sat schedule covering 8 periods with configured breaks & intervals.' }}
                </p>
              </div>
            </div>

            <!-- Subject Category Quick Legend -->
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-bold p-1.5 bg-white/90 rounded-2xl border border-slate-200/80 shadow-[inset_1px_1px_3px_#f1f5f9,1px_1px_3px_#ffffff]">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-blue-50/50 text-slate-700 border border-slate-200/70 transition-colors shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"></span>
                Math
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50/50 text-slate-700 border border-slate-200/70 transition-colors shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                Science & Tech
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-purple-50/50 text-slate-700 border border-slate-200/70 transition-colors shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]"></span>
                Languages
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-amber-50/50 text-slate-700 border border-slate-200/70 transition-colors shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"></span>
                Social / EVS
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-rose-50/50 text-slate-700 border border-slate-200/70 transition-colors shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"></span>
                Arts & PE
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/90 text-amber-900 border border-amber-200/90 shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"></span>
                Recess
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/90 text-emerald-900 border border-emerald-200/90 shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_6px_rgba(5,150,105,0.5)]"></span>
                Lunch
              </span>
            </div>
          </div>

          <!-- The Matrix Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[1020px]">
              <thead>
                <tr class="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th class="p-4 w-36 sticky left-0 bg-slate-50/95 border-r border-slate-200/90 z-20 shadow-[2px_0_6px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                    <div class="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Day / Slot</span>
                    </div>
                  </th>
                  <th *ngFor="let pNum of periodSlots" class="p-3.5 text-center min-w-[150px] border-r border-slate-200/60 last:border-r-0">
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200/80 shadow-[2px_2px_6px_#edf2f7,-2px_-2px_6px_#ffffff] text-slate-900 font-extrabold text-xs">
                      <span>Period {{ pNum.number }}</span>
                    </div>
                    <div class="text-[10px] text-slate-500 font-bold mt-1 tracking-tight font-mono">
                      {{ pNum.time }}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100/80 text-xs">
                <tr *ngFor="let day of days" class="hover:bg-slate-50/30 transition-colors">
                  <!-- Sticky Day Column -->
                  <td class="p-4 bg-white/95 sticky left-0 border-r border-slate-200/90 z-10 shadow-[3px_0_8px_rgba(0,0,0,0.02)] backdrop-blur-xs">
                    <div class="flex flex-col gap-1.5">
                      <div class="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                        {{ day.name }}
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                          <span class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="getPeriodsForDay(day.name).length > 0" [class.bg-slate-300]="getPeriodsForDay(day.name).length === 0"></span>
                          {{ getPeriodsForDay(day.name).length }} / {{ periodSlots.length }} slots
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Period Cells -->
                  <td *ngFor="let pNum of periodSlots" class="p-2 border-r border-slate-100/80 last:border-r-0 align-top">
                    <ng-container *ngIf="getPeriod(day.name, pNum.number) as slot; else emptySlot">
                      
                      <!-- RECESSS / BREAK SLOT -->
                      <div *ngIf="slot.slotType === 'BREAK'"
                           class="group relative h-full min-h-[96px] p-3 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 border border-amber-200 text-amber-950 flex flex-col justify-between shadow-[2px_2px_8px_#fef3c7,-2px_-2px_8px_#ffffff] hover:border-amber-300 transition-all">
                        <div>
                          <div class="flex items-center justify-between gap-1">
                            <span class="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-300/60 flex items-center gap-1">
                              <span>☕</span> Recess
                            </span>
                            <span class="text-[9px] font-bold text-amber-700/90 font-mono">{{ slot.startTime }}</span>
                          </div>
                          <div class="font-extrabold text-xs text-amber-950 mt-1.5 leading-snug">
                            {{ slot.title || 'Morning Break' }}
                          </div>
                        </div>
                        <div class="mt-2 pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-amber-800/80 font-semibold">
                          <span>15 Min Interval</span>
                          <span *ngIf="slot.roomNumber" class="text-[9px] text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">{{ slot.roomNumber }}</span>
                        </div>

                        <!-- Hover Actions for Admin/Teacher -->
                        <div *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" class="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 bg-white/95 p-0.5 rounded-xl shadow-md border border-amber-200">
                          <button (click)="openEditPeriodModal(slot, $event)" title="Edit Slot"
                                  class="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button (click)="deletePeriod(slot.id)" title="Remove Period"
                                  class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- LUNCH INTERVAL SLOT -->
                      <div *ngIf="slot.slotType === 'LUNCH'"
                           class="group relative h-full min-h-[96px] p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-emerald-100/40 border border-emerald-200 text-emerald-950 flex flex-col justify-between shadow-[2px_2px_8px_#d1fae5,-2px_-2px_8px_#ffffff] hover:border-emerald-300 transition-all">
                        <div>
                          <div class="flex items-center justify-between gap-1">
                            <span class="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300/60 flex items-center gap-1">
                              <span>🍱</span> Lunch
                            </span>
                            <span class="text-[9px] font-bold text-emerald-700/90 font-mono">{{ slot.startTime }}</span>
                          </div>
                          <div class="font-extrabold text-xs text-emerald-950 mt-1.5 leading-snug">
                            {{ slot.title || 'Lunch Break' }}
                          </div>
                        </div>
                        <div class="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-800/80 font-semibold">
                          <span>Midday Interval</span>
                          <span *ngIf="slot.roomNumber" class="text-[9px] text-emerald-900 bg-emerald-200/60 px-1.5 py-0.5 rounded">{{ slot.roomNumber }}</span>
                        </div>

                        <!-- Hover Actions for Admin/Teacher -->
                        <div *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" class="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 bg-white/95 p-0.5 rounded-xl shadow-md border border-emerald-200">
                          <button (click)="openEditPeriodModal(slot, $event)" title="Edit Slot"
                                  class="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button (click)="deletePeriod(slot.id)" title="Remove Period"
                                  class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- ACADEMIC / SUBJECT SLOT -->
                      <div *ngIf="slot.slotType !== 'BREAK' && slot.slotType !== 'LUNCH'"
                           [ngClass]="[getSubjectTheme(slot).cardBg, getSubjectTheme(slot).borderHover]"
                           class="group relative h-full min-h-[96px] p-3 rounded-2xl border shadow-[3px_3px_10px_#e2e8f0,-3px_-3px_10px_#ffffff] hover:shadow-[4px_4px_14px_#cbd5e1] transition-all flex flex-col justify-between">
                        
                        <div>
                          <!-- Top Row: Category Badge + Start Time -->
                          <div class="flex items-center justify-between gap-1">
                            <span [ngClass]="getSubjectTheme(slot).badgeBg"
                                  class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-2xs">
                              {{ getSubjectTheme(slot).badgeText }}
                            </span>
                            <span class="text-[9px] font-semibold text-slate-500 font-mono">
                              {{ slot.startTime }}
                            </span>
                          </div>

                          <!-- Middle Row: Subject Title -->
                          <div class="font-extrabold text-xs text-slate-900 mt-1.5 leading-snug break-words">
                            {{ slot.subjectName || slot.title }}
                          </div>
                        </div>

                        <!-- Bottom Row: Teacher / Class Pill + Room -->
                        <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[10px]">
                          <!-- If in Faculty Mode: Show Target Class & Section -->
                          <div *ngIf="timetableMode === 'FACULTY'" class="flex items-center gap-1 min-w-0 text-slate-700">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                            <span class="truncate font-bold" title="{{ slot.className ? (slot.className + ' - ' + slot.sectionName) : 'Class' }}">
                              {{ slot.className ? (slot.className + ' • ' + slot.sectionName) : 'Class' }}
                            </span>
                          </div>

                          <!-- If in Class / Student Mode: Show Assigned Teacher with Initial Avatar OR 'No teacher assigned' -->
                          <div *ngIf="timetableMode !== 'FACULTY'" class="flex items-center gap-1.5 min-w-0">
                            <ng-container *ngIf="getTeacherDisplayName(slot) as tName; else unassignedTeacher">
                              <div class="w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] font-black flex items-center justify-center shrink-0">
                                {{ getInitials(tName) }}
                              </div>
                              <span class="truncate font-bold text-slate-700" [title]="tName">
                                {{ tName }}
                              </span>
                            </ng-container>
                            <ng-template #unassignedTeacher>
                              <div class="flex items-center gap-1 text-[9px] font-bold text-amber-750 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/90 truncate">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                <span class="truncate">No teacher assigned</span>
                              </div>
                            </ng-template>
                          </div>

                          <!-- Room badge -->
                          <span class="text-[9px] font-bold text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                            {{ slot.roomNumber || 'Rm' }}
                          </span>
                        </div>

                        <!-- Hover Action Toolbar (Edit ✏️ & Delete 🗑️) -->
                        <div *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'"
                             class="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-0.5 bg-white/95 p-0.5 rounded-xl shadow-md border border-slate-200/80 backdrop-blur-xs">
                          <button (click)="openEditPeriodModal(slot, $event)" title="Edit Period"
                                  class="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button (click)="deletePeriod(slot.id)" title="Remove Period"
                                  class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                      </div>

                    </ng-container>

                    <!-- EMPTY SLOT TEMPLATE -->
                    <ng-template #emptySlot>
                      <div class="h-full min-h-[96px] p-2 rounded-2xl border-2 border-dashed border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/40 transition-all flex flex-col items-center justify-center text-center">
                        <ng-container *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'; else readOnlyEmpty">
                          <button (click)="openAddPeriodModal(day.id, pNum.number, pNum.start, pNum.end)"
                                  class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 shadow-[2px_2px_6px_#edf2f7] text-[10px] font-bold text-indigo-700 hover:text-indigo-800 transition-all flex items-center gap-1 cursor-pointer">
                            <span class="text-xs leading-none font-black">+</span>
                            <span>Assign</span>
                          </button>
                        </ng-container>
                        <ng-template #readOnlyEmpty>
                          <span class="text-[10px] font-medium text-slate-300">— Free —</span>
                        </ng-template>
                      </div>
                    </ng-template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- VIEW 2: DAILY TIMELINE CARDS VIEW -->
        <div *ngIf="viewLayout === 'DAY'" class="space-y-3">
          <div *ngFor="let slot of getPeriodsForDay(getSelectedDayName())"
               [ngClass]="[getSubjectTheme(slot).cardBg, getSubjectTheme(slot).borderHover]"
               class="p-5 rounded-3xl border shadow-[4px_4px_14px_#e2e8f0,-4px_-4px_14px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            
            <div class="flex items-center gap-4">
              <!-- Period Slot Indicator with Theme -->
              <div class="w-13 h-13 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-xs"
                   [ngClass]="getSubjectTheme(slot).badgeBg">
                <span class="text-[8px] font-extrabold uppercase tracking-wider">Slot</span>
                <span class="text-lg font-black leading-none mt-0.5">{{ slot.periodNumber }}</span>
              </div>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-black px-2.5 py-0.5 rounded-lg border font-mono shadow-2xs"
                        [ngClass]="getSubjectTheme(slot).badgeBg">
                    {{ slot.startTime }} - {{ slot.endTime }}
                  </span>
                  <span [ngClass]="getSubjectTheme(slot).badgeBg"
                        class="text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider">
                    {{ getSubjectTheme(slot).category }}
                  </span>
                  <span *ngIf="slot.roomNumber" class="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    📍 {{ slot.roomNumber }}
                  </span>
                </div>

                <h3 class="text-base font-black text-slate-900 mt-1.5">
                  {{ slot.subjectName || slot.title }}
                </h3>

                <div *ngIf="slot.teacherName || slot.className || !slot.teacherId" class="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                  <div *ngIf="timetableMode !== 'FACULTY'">
                    <div *ngIf="getTeacherDisplayName(slot) as tName; else dailyUnassigned" class="flex items-center gap-1.5">
                      <div class="w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] font-black flex items-center justify-center">
                        {{ getInitials(tName) }}
                      </div>
                      <span class="font-bold text-slate-800">{{ tName }}</span>
                    </div>
                    <ng-template #dailyUnassigned>
                      <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>No teacher assigned</span>
                      </div>
                    </ng-template>
                  </div>
                  <div *ngIf="slot.className" class="flex items-center gap-1 text-slate-600">
                    <span class="text-slate-400 font-normal">Class:</span>
                    <span class="font-bold text-slate-800">{{ slot.className }} - {{ slot.sectionName }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-center">
              <button *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" (click)="openEditPeriodModal(slot, $event)"
                      class="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>

              <button *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" (click)="deletePeriod(slot.id)"
                      class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div *ngIf="getPeriodsForDay(getSelectedDayName()).length === 0"
               class="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-[4px_4px_16px_#e2e8f0,-4px_-4px_16px_#ffffff]">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-inner">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 class="text-sm font-extrabold text-slate-800">No scheduled periods for {{ getSelectedDayName() }}</h4>
            <p class="text-xs text-slate-500 mt-1">Free day or schedule not yet configured for this day.</p>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- MODAL 1: ADD / EDIT CLASS TIMETABLE PERIOD MODAL               -->
      <!-- ============================================================== -->
      <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900">Add / Configure Period Slot</h3>
              <p class="text-xs text-slate-500">Configure subject, teacher, recess, or interval timings</p>
            </div>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Target Context Card -->
          <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md border border-slate-800">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">Selected Class & Section</div>
                <div class="text-sm sm:text-base font-black flex items-center gap-2 mt-0.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{{ getActiveSectionDisplay() }}</span>
                </div>
              </div>
              <div class="text-left sm:text-right">
                <div class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Scheduled Time Slot</div>
                <div class="text-xs font-bold text-amber-300 mt-0.5">
                  {{ getDayNameFromNumber(modalForm.dayOfWeek) }} • Period {{ modalForm.periodNumber }}
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- Day & Period Number -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Day of Week</label>
                <select [(ngModel)]="modalForm.dayOfWeek"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option *ngFor="let day of days" [value]="day.id">{{ day.name }}</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Period Number</label>
                <select [ngModel]="modalForm.periodNumber" (ngModelChange)="onPeriodNumberChange($event)"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option *ngFor="let p of periodSlots" [value]="p.number">Period {{ p.number }} ({{ p.time }})</option>
                </select>
              </div>
            </div>

            <!-- Start & End Time -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Start Time (HH:mm)</label>
                <input type="text" [(ngModel)]="modalForm.startTime" placeholder="08:30"
                       class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">End Time (HH:mm)</label>
                <input type="text" [(ngModel)]="modalForm.endTime" placeholder="09:15"
                       class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
              </div>
            </div>

            <!-- Slot Type -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Slot Category</label>
              <select [(ngModel)]="modalForm.slotType"
                      class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                <option value="ACADEMIC">Academic Subject Period</option>
                <option value="BREAK">Morning Recess / Short Break</option>
                <option value="LUNCH">Lunch Interval</option>
                <option value="ASSEMBLY">Morning Assembly</option>
                <option value="SPORTS">Sports / Physical Education</option>
                <option value="LIBRARY">Library Period</option>
                <option value="ACTIVITY">Club / Co-Curricular Activity</option>
              </select>
            </div>

            <!-- Subject & Teacher Selection -->
            <div *ngIf="modalForm.slotType === 'ACADEMIC' || modalForm.slotType === 'SPORTS' || modalForm.slotType === 'LIBRARY' || modalForm.slotType === 'ACTIVITY'" class="space-y-3.5">
              
              <!-- Subject Dropdown -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700">Subject (from Curriculum Master)</label>
                  <span class="text-[10px] text-indigo-600 font-semibold">{{ availableSubjects.length }} Subjects Available</span>
                </div>
                <select [(ngModel)]="modalForm.classSubjectId"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option value="">-- Select Subject --</option>
                  <option *ngFor="let sub of availableSubjects" [value]="sub.classSubjectId">
                    {{ sub.name }} ({{ sub.code }})
                  </option>
                </select>
              </div>

              <!-- Assigned Teacher with Availability Guard -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700">Assigned Teacher / Staff</label>
                  <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {{ getAvailableTeachersCount() }} of {{ teachersList.length }} Staff Free
                  </span>
                </div>
                <select [(ngModel)]="modalForm.teacherId"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option value="">-- Select Teacher / Staff --</option>
                  <option *ngFor="let t of teachersList" [value]="t.id"
                          [disabled]="!getTeacherAvailability(t.id, modalForm.dayOfWeek, modalForm.periodNumber).isAvailable">
                    {{ t.name }} ({{ formatRoleName(t.role) }}) — {{ getTeacherAvailability(t.id, modalForm.dayOfWeek, modalForm.periodNumber).conflictText }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Title for Breaks/Custom Slots -->
            <div *ngIf="modalForm.slotType !== 'ACADEMIC'">
              <label class="block font-bold text-slate-700 mb-1">Slot Label / Title</label>
              <input type="text" [(ngModel)]="modalForm.title" placeholder="e.g. Morning Recess Break, Lunch Break"
                     class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
            </div>

            <!-- Room / Venue -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Room / Lab Number</label>
              <input type="text" [(ngModel)]="modalForm.roomNumber" placeholder="e.g. Room 101, Science Lab"
                     class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showAddModal = false"
                    class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="savePeriodSlot()" [disabled]="savingPeriod"
                    class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2">
              <span *ngIf="savingPeriod">Saving...</span>
              <span *ngIf="!savingPeriod">Save Period</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 2: CONFIGURE ACADEMIC SESSION BOUNDS MODAL               -->
      <!-- ============================================================== -->
      <div *ngIf="showSessionBoundsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900">Academic Session Span</h3>
              <p class="text-xs text-slate-500">Configure start and end calendar bounds for {{ academicSessionName }}</p>
            </div>
            <button (click)="showSessionBoundsModal = false" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Quick Presets -->
          <div>
            <label class="block font-bold text-slate-700 text-xs mb-1.5">Standard Cycle Presets</label>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button (click)="applySessionPreset('MARCH_FEB')"
                      class="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 text-left flex items-center gap-2 cursor-pointer transition-colors">
                <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>March to February</span>
              </button>
              <button (click)="applySessionPreset('APRIL_MARCH')"
                      class="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 text-left flex items-center gap-2 cursor-pointer transition-colors">
                <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>April to March</span>
              </button>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Session Start Date</label>
              <input type="date" [(ngModel)]="sessionBoundsForm.startDate"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Session End Date</label>
              <input type="date" [(ngModel)]="sessionBoundsForm.endDate"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button (click)="showSessionBoundsModal = false"
                    class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="saveSessionBounds()" [disabled]="savingCalendar"
                    class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50">
              <span *ngIf="savingCalendar">Saving...</span>
              <span *ngIf="!savingCalendar">Save Session Dates</span>
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL 3: ADD / EDIT HOLIDAY OR EVENT CALENDAR DAY MODAL        -->
      <!-- ============================================================== -->
      <div *ngIf="showDayEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
        <div class="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900">Configure Academic Day / Event</h3>
              <p class="text-xs text-slate-500">Set holidays, vacations, exam milestones or teaching status</p>
            </div>
            <button (click)="showDayEditModal = false" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-3.5 text-xs">
            <!-- Date Range Mode Toggle -->
            <div class="flex items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" [(ngModel)]="dayEditForm.isRange" [value]="false" class="text-indigo-600" />
                <span class="font-bold text-slate-800">Single Date</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" [(ngModel)]="dayEditForm.isRange" [value]="true" class="text-indigo-600" />
                <span class="font-bold text-slate-800">Date Range (Vacations / Exam Block)</span>
              </label>
            </div>

            <!-- Start & End Date -->
            <div class="grid" [ngClass]="dayEditForm.isRange ? 'grid-cols-2 gap-3' : 'grid-cols-1'">
              <div>
                <label class="block font-bold text-slate-700 mb-1">{{ dayEditForm.isRange ? 'Start Date' : 'Target Date' }}</label>
                <input type="date" [(ngModel)]="dayEditForm.startDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
              </div>

              <div *ngIf="dayEditForm.isRange">
                <label class="block font-bold text-slate-700 mb-1">End Date</label>
                <input type="date" [(ngModel)]="dayEditForm.endDate"
                       class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
              </div>
            </div>

            <!-- Day Category Type -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Day Schedule Category</label>
              <select [(ngModel)]="dayEditForm.type"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                <option value="WORKING_DAY">Instructional Teaching Day</option>
                <option value="HOLIDAY">Gazetted / Official Holiday</option>
                <option value="VACATION">Term Vacation / Seasonal Break</option>
                <option value="EXAM_DAY">Examination / Assessment Period</option>
                <option value="EVENT_DAY">School Event / Sports / PTM</option>
                <option value="WEEKLY_OFF">Weekly Scheduled Off</option>
              </select>
            </div>

            <!-- Title -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Title / Event Name</label>
              <input type="text" [(ngModel)]="dayEditForm.title" placeholder="e.g. Holi Festival, Summer Vacation, Mid-Term Physics Exam"
                     class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner" />
            </div>

            <!-- Notes -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Description / Notes (Optional)</label>
              <textarea [(ngModel)]="dayEditForm.note" rows="2" placeholder="e.g. Campus closed, online work assigned, ceremonial assembly at 8:00 AM"
                        class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner"></textarea>
            </div>

            <!-- Target Wing -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Applicable Wing / Section</label>
              <select [(ngModel)]="dayEditForm.wing"
                      class="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                <option value="ALL">All School (Nursery to Grade 12)</option>
                <option value="PRIMARY">Primary Wing Only (Nursery - Grade 5)</option>
                <option value="MIDDLE">Middle Wing Only (Grade 6 - Grade 8)</option>
                <option value="SENIOR">Senior Secondary Only (Grade 9 - Grade 12)</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100">
            <button *ngIf="dayEditForm.existingKey" (click)="deleteCalendarDay(dayEditForm.existingKey)"
                    class="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer">
              Reset to Default
            </button>
            <div *ngIf="!dayEditForm.existingKey"></div>

            <div class="flex items-center gap-2">
              <button (click)="showDayEditModal = false"
                      class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
                Cancel
              </button>
              <button (click)="saveDaySchedule()" [disabled]="savingCalendar"
                      class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50">
                <span *ngIf="savingCalendar">Saving...</span>
                <span *ngIf="!savingCalendar">Save Day Schedule</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class TimetableComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  timetableMode: 'STUDENT' | 'FACULTY' | 'ACADEMIC' = 'STUDENT';
  viewLayout: 'GRID' | 'DAY' = 'GRID';
  activeDayTab = 1;
  teacherViewMode: 'TEACHER' | 'CLASS' = 'TEACHER';

  // Academic Calendar Specific State
  academicCalendarView: 'MONTH_GRID' | 'AGENDA_LIST' | 'YEAR_OVERVIEW' = 'MONTH_GRID';
  academicSessionName = '2026-2027';
  availableSessions: { id: string; name: string }[] = [];
  selectedMonthId = '2026-03';
  sessionMonths: MonthItem[] = [];
  academicCalendarData: {
    sessionId: string;
    sessionName: string;
    startDate: string;
    endDate: string;
    days: Record<string, any>;
  } = {
    sessionId: '',
    sessionName: '2026-2027',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    days: {},
  };

  calendarStats = {
    totalDays: 365,
    workingDays: 224,
    workingDaysPercentage: '61.4',
    holidays: 42,
    weeklyOffs: 52,
    exams: 12,
    events: 6,
    vacations: 29,
  };

  // Session Bounds Modal
  showSessionBoundsModal = false;
  sessionBoundsForm = {
    startDate: '2026-03-01',
    endDate: '2027-02-28',
  };

  // Day Edit Modal
  showDayEditModal = false;
  dayEditForm = {
    isRange: false,
    startDate: '',
    endDate: '',
    type: 'HOLIDAY' as DayScheduleType,
    title: '',
    note: '',
    wing: 'ALL',
    existingKey: '',
  };

  savingCalendar = false;

  days = [
    { id: 1, name: 'MONDAY', short: 'Mon' },
    { id: 2, name: 'TUESDAY', short: 'Tue' },
    { id: 3, name: 'WEDNESDAY', short: 'Wed' },
    { id: 4, name: 'THURSDAY', short: 'Thu' },
    { id: 5, name: 'FRIDAY', short: 'Fri' },
    { id: 6, name: 'SATURDAY', short: 'Sat' },
  ];

  periodSlots = [
    { number: 1, time: '08:30 - 09:15', start: '08:30', end: '09:15' },
    { number: 2, time: '09:15 - 10:00', start: '09:15', end: '10:00' },
    { number: 3, time: '10:00 - 10:20', start: '10:00', end: '10:20' },
    { number: 4, time: '10:20 - 11:05', start: '10:20', end: '11:05' },
    { number: 5, time: '11:05 - 11:50', start: '11:05', end: '11:50' },
    { number: 6, time: '11:50 - 12:35', start: '11:50', end: '12:35' },
    { number: 7, time: '12:35 - 01:20', start: '12:35', end: '01:20' },
    { number: 8, time: '01:20 - 02:05', start: '01:20', end: '02:05' },
  ];

  periods: TimetablePeriodItem[] = [];
  availableSubjects: AvailableSubject[] = [];
  teachersList: TeacherItem[] = [];
  allSchoolPeriods: any[] = [];

  classesList: ClassItem[] = [];
  selectedClassId = '';
  flatSections: { sectionId: string; className: string; sectionName: string }[] = [];
  selectedSectionId = '';
  selectedTeacherId = '';
  currentSectionTitle = 'Campus Schedule';

  childrenList: ChildItem[] = [];
  selectedChildId = '';

  showAddModal = false;
  savingPeriod = false;
  modalForm = {
    dayOfWeek: 1,
    periodNumber: 1,
    startTime: '08:30',
    endTime: '09:15',
    slotType: 'ACADEMIC' as any,
    title: '',
    classSubjectId: '',
    teacherId: '',
    roomNumber: 'Room 101',
  };

  get canSwitchModes(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal();
  }

  get canEditCurrentTimetable(): boolean {
    if (this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal()) {
      return true;
    }
    if (this.auth.isTeacher() && this.teacherViewMode === 'CLASS') {
      return true;
    }
    return false;
  }

  get currentSelectedMonth(): MonthItem | undefined {
    return this.sessionMonths.find((m) => m.id === this.selectedMonthId) || this.sessionMonths[0];
  }

  get currentClassSections(): { id: string; name: string; code: string }[] {
    const cls = this.classesList.find((c) => c.id === this.selectedClassId);
    return cls?.sections || [];
  }

  get headerTitle(): string {
    if (this.auth.isParent()) {
      const child = this.childrenList.find((c) => c.studentId === this.selectedChildId);
      return child ? `${child.name}'s Weekly Timetable` : 'Child Weekly Schedule';
    }
    if (this.timetableMode === 'ACADEMIC') {
      return `Whole-School Academic Year Calendar & Timetable`;
    }
    if (this.timetableMode === 'FACULTY') {
      const teacher = this.teachersList.find((t) => t.id === this.selectedTeacherId);
      return teacher ? `${teacher.name}'s Weekly Routine` : 'Faculty Teaching Routine';
    }
    if (this.auth.isTeacher() && !this.auth.isAdmin() && this.teacherViewMode === 'TEACHER') {
      return 'My Teaching Routine & Periods';
    }
    return 'Class Weekly Routine & Timetable';
  }

  get headerSubtitle(): string {
    if (this.auth.isParent()) {
      return 'Daily period intervals, subject teachers, and recess timings.';
    }
    if (this.timetableMode === 'ACADEMIC') {
      return `Institutional academic milestones, teaching days, examinations, and official gazetted holidays for ${this.academicSessionName}.`;
    }
    if (this.timetableMode === 'FACULTY' || (this.auth.isTeacher() && !this.auth.isAdmin() && this.teacherViewMode === 'TEACHER')) {
      return 'Weekly periods, assigned class sections, and classroom allocations.';
    }
    return 'Manage weekly schedules, subject allocations, and recess intervals.';
  }

  ngOnInit() {
    if (!this.auth.isServiceEnabled('TIMETABLE')) return;
    this.route.queryParams.subscribe((params) => {
      if (params['type'] === 'faculty') {
        this.timetableMode = 'FACULTY';
      } else if (params['type'] === 'academic') {
        this.timetableMode = 'ACADEMIC';
      } else if (params['type'] === 'student') {
        this.timetableMode = 'STUDENT';
      }
    });

    this.initData();
  }

  setMode(mode: 'STUDENT' | 'FACULTY' | 'ACADEMIC') {
    this.timetableMode = mode;
    if (mode === 'FACULTY') {
      if (this.selectedTeacherId) {
        this.loadFacultyTimetable(this.selectedTeacherId);
      } else if (this.teachersList.length > 0) {
        this.selectedTeacherId = this.teachersList[0].id;
        this.loadFacultyTimetable(this.selectedTeacherId);
      }
    } else if (mode === 'ACADEMIC') {
      this.loadAcademicCalendar();
    } else {
      if (this.selectedSectionId) {
        this.loadSectionTimetable(this.selectedSectionId);
      }
    }
  }

  initData() {
    this.loadAcademicCalendar();
    this.loadClassesAndTeachers();
    if (this.auth.isParent()) {
      this.loadParentTimetable();
    } else if (this.auth.isTeacher() && !this.auth.isAdmin()) {
      this.loadTeacherTimetable();
    }
  }

  loadClassesAndTeachers() {
    this.api.get<ClassItem[]>('academics/classes').subscribe({
      next: (classes) => {
        this.classesList = classes || [];
        this.flatSections = [];
        for (const cls of this.classesList) {
          for (const sec of (cls.sections || [])) {
            this.flatSections.push({
              sectionId: sec.id,
              className: cls.name,
              sectionName: sec.name,
            });
          }
        }

        if (this.classesList.length > 0) {
          const classTeacherSec = this.auth.currentUser()?.teachingScope?.classTeacherSections?.[0];
          if (classTeacherSec) {
            this.selectedSectionId = classTeacherSec.sectionId;
            const matchCls = this.classesList.find((c) => c.sections?.some((s) => s.id === classTeacherSec.sectionId));
            if (matchCls) this.selectedClassId = matchCls.id;
          } else if (!this.selectedSectionId) {
            this.selectedClassId = this.classesList[0].id;
            if (this.classesList[0].sections?.length > 0) {
              this.selectedSectionId = this.classesList[0].sections[0].id;
            }
          } else {
            const matchCls = this.classesList.find((c) => c.sections?.some((s) => s.id === this.selectedSectionId));
            if (matchCls) this.selectedClassId = matchCls.id;
          }

          if (this.timetableMode === 'STUDENT' && this.selectedSectionId) {
            this.loadSectionTimetable(this.selectedSectionId);
          }
        }
      },
    });

    this.api.get<any[]>('academics/staff').subscribe({
      next: (staff) => {
        this.teachersList = (staff || [])
          .filter((u) => u.role !== 'GUARDIAN' && u.role !== 'PARENT' && u.role !== 'STUDENT')
          .filter((u) => (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
          .map((u) => ({
            id: u.id,
            name: u.fullName || `${u.firstName} ${u.lastName || ''}`.trim(),
            email: u.email,
            role: u.role || 'STAFF',
          }));

        if (this.teachersList.length > 0 && !this.selectedTeacherId) {
          this.selectedTeacherId = this.teachersList[0].id;
          if (this.timetableMode === 'FACULTY') {
            this.loadFacultyTimetable(this.selectedTeacherId);
          }
        }
      },
      error: () => {
        this.teachersList = [];
      },
    });
  }

  // =========================================================================
  // ACADEMIC CALENDAR & YEAR TIMETABLE HANDLERS
  // =========================================================================

  loadAcademicCalendar() {
    this.api.get<any>(`timetable/academic-calendar?sessionName=${this.academicSessionName}`).subscribe({
      next: (res) => {
        this.academicCalendarData = res;
        this.academicSessionName = res.sessionName || this.academicSessionName;
        this.availableSessions = res.availableSessions || [{ id: '1', name: this.academicSessionName }];
        this.sessionBoundsForm.startDate = res.startDate;
        this.sessionBoundsForm.endDate = res.endDate;
        this.generateSessionMonths();
      },
      error: () => {
        this.generateSessionMonths();
      },
    });
  }

  onAcademicSessionChange(sessionName: string) {
    this.academicSessionName = sessionName;
    this.loadAcademicCalendar();
  }

  generateSessionMonths() {
    const start = new Date(this.academicCalendarData.startDate);
    const end = new Date(this.academicCalendarData.endDate);

    const months: MonthItem[] = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);

    let globalWorkingDayIndex = 1;
    let totalWorking = 0;
    let totalHolidays = 0;
    let totalWeeklyOffs = 0;
    let totalExams = 0;
    let totalEvents = 0;
    let totalVacations = 0;
    let totalDaysCount = 0;

    while (current <= last) {
      const year = current.getFullYear();
      const monthIdx = current.getMonth();
      const monthId = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const mName = monthNames[monthIdx];

      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      const monthDays: CalendarDayEntry[] = [];

      let mWorking = 0;
      let mHolidays = 0;
      let mEvents = 0;
      let mExams = 0;
      let mVacations = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const thisDate = new Date(year, monthIdx, d);
        if (thisDate < start || thisDate > end) continue;

        totalDaysCount++;
        const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = thisDate.getDay(); // 0=Sun, 1=Mon...6=Sat
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];

        const custom = this.academicCalendarData.days[dateStr];
        let type: DayScheduleType = 'WORKING_DAY';
        let title = 'Instructional Teaching Day';
        let note = '';
        let wing = 'ALL';

        if (custom) {
          type = custom.type;
          title = custom.title || '';
          note = custom.note || '';
          wing = custom.wing || 'ALL';
        } else {
          if (dayOfWeek === 0) {
            type = 'WEEKLY_OFF';
            title = 'Sunday Weekly Off';
          } else if (dayOfWeek === 6 && (d >= 8 && d <= 14 || d >= 22 && d <= 28)) {
            type = 'WEEKLY_OFF';
            title = '2nd/4th Saturday Scheduled Off';
          }
        }

        let wIndex: number | undefined = undefined;
        if (type === 'WORKING_DAY') {
          wIndex = globalWorkingDayIndex++;
          mWorking++;
          totalWorking++;
        } else if (type === 'HOLIDAY') {
          mHolidays++;
          totalHolidays++;
        } else if (type === 'VACATION') {
          mVacations++;
          totalVacations++;
        } else if (type === 'EXAM_DAY') {
          mExams++;
          totalExams++;
        } else if (type === 'EVENT_DAY') {
          mEvents++;
          totalEvents++;
        } else if (type === 'WEEKLY_OFF') {
          totalWeeklyOffs++;
        }

        monthDays.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          dayNumber: d,
          monthNumber: monthIdx + 1,
          year,
          type,
          title,
          note,
          wing,
          workingDayIndex: wIndex,
        });
      }

      months.push({
        id: monthId,
        monthIndex: monthIdx,
        name: mName,
        year,
        days: monthDays,
        workingDaysCount: mWorking,
        holidaysCount: mHolidays,
        eventsCount: mEvents,
        examsCount: mExams,
        vacationCount: mVacations,
      });

      current = new Date(year, monthIdx + 1, 1);
    }

    this.sessionMonths = months;
    if (!this.sessionMonths.some((m) => m.id === this.selectedMonthId) && this.sessionMonths.length > 0) {
      this.selectedMonthId = this.sessionMonths[0].id;
    }

    this.calendarStats = {
      totalDays: totalDaysCount,
      workingDays: totalWorking,
      workingDaysPercentage: totalDaysCount > 0 ? ((totalWorking / totalDaysCount) * 100).toFixed(1) : '0',
      holidays: totalHolidays,
      weeklyOffs: totalWeeklyOffs,
      exams: totalExams,
      events: totalEvents,
      vacations: totalVacations,
    };
  }

  getLeadingEmptySlots(month: MonthItem): number[] {
    if (!month || month.days.length === 0) return [];
    const firstDayOfWeek = month.days[0].dayOfWeek; // 0=Sun, 1=Mon...6=Sat
    // Convert so Monday is first (index 0)
    const offset = (firstDayOfWeek + 6) % 7;
    return Array.from({ length: offset });
  }

  getMonthHighlights(month: MonthItem): CalendarDayEntry[] {
    return month.days.filter((d) => d.type === 'HOLIDAY' || d.type === 'EXAM_DAY' || d.type === 'EVENT_DAY' || d.type === 'VACATION').slice(0, 3);
  }

  openSessionBoundsModal() {
    this.sessionBoundsForm = {
      startDate: this.academicCalendarData.startDate,
      endDate: this.academicCalendarData.endDate,
    };
    this.showSessionBoundsModal = true;
  }

  applySessionPreset(preset: 'MARCH_FEB' | 'APRIL_MARCH') {
    const parts = this.academicSessionName.split(/[-/]/);
    const startYear = parseInt(parts[0] || '2026', 10);
    const endYear = startYear + 1;

    if (preset === 'MARCH_FEB') {
      this.sessionBoundsForm.startDate = `${startYear}-03-01`;
      this.sessionBoundsForm.endDate = `${endYear}-02-28`;
    } else {
      this.sessionBoundsForm.startDate = `${startYear}-04-01`;
      this.sessionBoundsForm.endDate = `${endYear}-03-31`;
    }
  }

  saveSessionBounds() {
    this.savingCalendar = true;
    const payload = {
      ...this.academicCalendarData,
      sessionName: this.academicSessionName,
      startDate: this.sessionBoundsForm.startDate,
      endDate: this.sessionBoundsForm.endDate,
    };

    this.api.post('timetable/academic-calendar', payload).subscribe({
      next: () => {
        this.toast.success('Academic session date bounds updated successfully.');
        this.academicCalendarData.startDate = payload.startDate;
        this.academicCalendarData.endDate = payload.endDate;
        this.showSessionBoundsModal = false;
        this.savingCalendar = false;
        this.generateSessionMonths();
      },
      error: () => {
        this.toast.error('Failed to save session bounds.');
        this.savingCalendar = false;
      },
    });
  }

  openAddHolidayModal() {
    const todayStr = new Date().toISOString().split('T')[0];
    this.dayEditForm = {
      isRange: false,
      startDate: todayStr,
      endDate: todayStr,
      type: 'HOLIDAY',
      title: '',
      note: '',
      wing: 'ALL',
      existingKey: '',
    };
    this.showDayEditModal = true;
  }

  onDayCellClick(day: CalendarDayEntry) {
    if (!this.canEditCurrentTimetable) return;

    this.dayEditForm = {
      isRange: false,
      startDate: day.date,
      endDate: day.date,
      type: day.type,
      title: day.title || '',
      note: day.note || '',
      wing: day.wing || 'ALL',
      existingKey: day.date,
    };
    this.showDayEditModal = true;
  }

  saveDaySchedule() {
    if (!this.dayEditForm.startDate) {
      this.toast.error('Please specify a date.');
      return;
    }

    this.savingCalendar = true;
    const newDays = { ...this.academicCalendarData.days };

    if (!this.dayEditForm.isRange) {
      newDays[this.dayEditForm.startDate] = {
        type: this.dayEditForm.type,
        title: this.dayEditForm.title || this.getDefaultTitleForType(this.dayEditForm.type),
        note: this.dayEditForm.note || '',
        wing: this.dayEditForm.wing,
      };
    } else {
      const start = new Date(this.dayEditForm.startDate);
      const end = new Date(this.dayEditForm.endDate || this.dayEditForm.startDate);
      const cur = new Date(start);

      while (cur <= end) {
        const dStr = cur.toISOString().split('T')[0];
        newDays[dStr] = {
          type: this.dayEditForm.type,
          title: this.dayEditForm.title || this.getDefaultTitleForType(this.dayEditForm.type),
          note: this.dayEditForm.note || '',
          wing: this.dayEditForm.wing,
        };
        cur.setDate(cur.getDate() + 1);
      }
    }

    const payload = {
      ...this.academicCalendarData,
      sessionName: this.academicSessionName,
      days: newDays,
    };

    this.api.post('timetable/academic-calendar', payload).subscribe({
      next: () => {
        this.toast.success('Calendar schedule updated successfully.');
        this.academicCalendarData.days = newDays;
        this.showDayEditModal = false;
        this.savingCalendar = false;
        this.generateSessionMonths();
      },
      error: () => {
        this.toast.error('Failed to save day schedule.');
        this.savingCalendar = false;
      },
    });
  }

  deleteCalendarDay(dateKey: string) {
    this.savingCalendar = true;
    const newDays = { ...this.academicCalendarData.days };
    delete newDays[dateKey];

    const payload = {
      ...this.academicCalendarData,
      sessionName: this.academicSessionName,
      days: newDays,
    };

    this.api.post('timetable/academic-calendar', payload).subscribe({
      next: () => {
        this.toast.info('Day reset to official default state.');
        this.academicCalendarData.days = newDays;
        this.showDayEditModal = false;
        this.savingCalendar = false;
        this.generateSessionMonths();
      },
      error: () => {
        this.toast.error('Failed to reset day.');
        this.savingCalendar = false;
      },
    });
  }

  getDefaultTitleForType(type: DayScheduleType): string {
    const map: Record<DayScheduleType, string> = {
      WORKING_DAY: 'Instructional Teaching Day',
      HOLIDAY: 'Institutional Holiday',
      VACATION: 'Term Vacation Break',
      EXAM_DAY: 'Examination Period',
      EVENT_DAY: 'School Celebration & Event',
      WEEKLY_OFF: 'Weekly Off',
    };
    return map[type] || 'Calendar Event';
  }

  // =========================================================================
  // STUDENT / CLASS & FACULTY TIMETABLE HANDLERS
  // =========================================================================

  loadParentTimetable(studentId?: string) {
    const url = studentId ? `timetable/my-child?studentId=${studentId}` : 'timetable/my-child';
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.childrenList = res.childrenList || [];
        if (res.selectedChild) {
          this.selectedChildId = res.selectedChild.studentId;
          this.selectedClassId = res.selectedChild.classId || '';
          this.selectedSectionId = res.selectedChild.sectionId || '';
          this.currentSectionTitle = `${res.selectedChild.className} - ${res.selectedChild.sectionName}`;
        }
        if (res.timetable) {
          this.periods = res.timetable.periods || [];
          this.availableSubjects = res.timetable.availableSubjects || [];
          this.allSchoolPeriods = res.timetable.allSchoolPeriods || [];
        }
      },
      error: () => {
        this.toast.error('Unable to load child timetable');
      },
    });

    if (this.teachersList.length === 0) {
      this.api.get<any[]>('academics/staff').subscribe({
        next: (staff) => {
          this.teachersList = (staff || [])
            .filter((u) => u.role !== 'GUARDIAN' && u.role !== 'PARENT' && u.role !== 'STUDENT')
            .filter((u) => (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
            .map((u) => ({
              id: u.id,
              name: u.fullName || `${u.firstName} ${u.lastName || ''}`.trim(),
              email: u.email,
              role: u.role || 'STAFF',
            }));
        },
      });
    }
  }

  loadTeacherTimetable() {
    this.teacherViewMode = 'TEACHER';
    this.api.get<any>('timetable/teacher').subscribe({
      next: (res) => {
        this.periods = Array.isArray(res) ? res : (res.periods || []);
        this.currentSectionTitle = 'Faculty Routine';
      },
    });
  }

  loadFacultyTimetable(teacherId: string) {
    const teacher = this.teachersList.find((t) => t.id === teacherId);
    this.api.get<any>(`timetable/teacher?teacherId=${teacherId}`).subscribe({
      next: (res) => {
        this.periods = Array.isArray(res) ? res : (res.periods || []);
        this.currentSectionTitle = teacher ? `${teacher.name} (${this.formatRoleName(teacher.role)})` : 'Faculty Routine';
      },
      error: () => {
        this.periods = [];
      },
    });
  }

  loadSectionTimetable(sectionId: string) {
    this.api.get<any>(`timetable/section/${sectionId}`).subscribe({
      next: (res) => {
        this.periods = Array.isArray(res) ? res : (res.periods || []);
        this.availableSubjects = res.availableSubjects || [];
        this.allSchoolPeriods = res.allSchoolPeriods || [];
        if (res.section) {
          this.currentSectionTitle = `${res.section.className} - ${res.section.name}`;
        }

        if (this.availableSubjects.length === 0) {
          this.api.get<any[]>('academics/subjects').subscribe({
            next: (subs) => {
              if (Array.isArray(subs) && subs.length > 0) {
                this.availableSubjects = subs.map((s: any) => ({
                  classSubjectId: s.id,
                  subjectId: s.id,
                  name: s.name,
                  code: s.code,
                  subjectType: s.subject_type || s.type || 'THEORY',
                }));
              }
            },
          });
        }
      },
    });
  }

  onClassChange(classId: string) {
    this.selectedClassId = classId;
    const cls = this.classesList.find((c) => c.id === classId);
    if (cls && cls.sections && cls.sections.length > 0) {
      this.selectedSectionId = cls.sections[0].id;
      this.loadSectionTimetable(this.selectedSectionId);
    } else {
      this.selectedSectionId = '';
      this.periods = [];
    }
  }

  onSectionChange(sectionId: string) {
    this.selectedSectionId = sectionId;
    const matchCls = this.classesList.find((c) => c.sections?.some((s) => s.id === sectionId));
    if (matchCls && matchCls.id !== this.selectedClassId) {
      this.selectedClassId = matchCls.id;
    }
    this.loadSectionTimetable(sectionId);
  }

  onTeacherChange(teacherId: string) {
    this.selectedTeacherId = teacherId;
    this.loadFacultyTimetable(teacherId);
  }

  onChildChange(childId: string) {
    this.selectedChildId = childId;
    this.loadParentTimetable(childId);
  }

  toggleTeacherViewMode() {
    if (this.teacherViewMode === 'TEACHER') {
      this.teacherViewMode = 'CLASS';
      const classTeacherSec = this.auth.currentUser()?.teachingScope?.classTeacherSections?.[0];
      if (classTeacherSec) {
        this.selectedSectionId = classTeacherSec.sectionId;
        this.loadSectionTimetable(classTeacherSec.sectionId);
      }
    } else {
      this.loadTeacherTimetable();
    }
  }

  getPeriod(dayName: string, periodNumber: number): TimetablePeriodItem | undefined {
    return this.periods.find(
      (p) =>
        (p.dayName === dayName || this.getDayNameFromNumber(p.dayOfWeek) === dayName) &&
        Number(p.periodNumber) === Number(periodNumber),
    );
  }

  getPeriodsForDay(dayName: string): TimetablePeriodItem[] {
    return this.periods
      .filter((p) => p.dayName === dayName || this.getDayNameFromNumber(p.dayOfWeek) === dayName)
      .sort((a, b) => Number(a.periodNumber) - Number(b.periodNumber));
  }

  getSelectedDayName(): string {
    const day = this.days.find((d) => d.id === this.activeDayTab);
    return day ? day.name : 'MONDAY';
  }

  getDayNameFromNumber(num: number): string {
    const map: Record<number, string> = {
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };
    return map[num] || 'MONDAY';
  }

  formatRoleName(role?: string): string {
    if (!role) return 'Faculty';
    if (role === 'SCHOOL_ADMIN') return 'School Admin';
    if (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN') return 'Admin';
    if (role === 'CLASS_TEACHER') return 'Class Teacher';
    if (role === 'TEACHER') return 'Teacher';
    if (role === 'PRINCIPAL') return 'Principal';
    if (role === 'VICE_PRINCIPAL') return 'Vice Principal';
    if (role === 'ACADEMIC_COORDINATOR' || role === 'COORDINATOR') return 'Coordinator';
    const clean = role.replace(/_/g, ' ').toLowerCase();
    return clean.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getActiveSectionDisplay(): string {
    const match = this.flatSections.find((s) => s.sectionId === this.selectedSectionId);
    return match ? `${match.className} - ${match.sectionName}` : this.currentSectionTitle;
  }

  onPeriodNumberChange(periodNum: number) {
    const num = Number(periodNum);
    this.modalForm.periodNumber = num;
    const slot = this.periodSlots.find((p) => p.number === num);
    if (slot) {
      this.modalForm.startTime = slot.start;
      this.modalForm.endTime = slot.end;
    }
  }

  getTeacherAvailability(teacherId: string, dayOfWeek: number, periodNumber: number): { isAvailable: boolean; conflictText: string } {
    if (!teacherId) return { isAvailable: true, conflictText: 'Available' };

    const match = this.allSchoolPeriods.find(
      (p) =>
        (p.teacherId === teacherId || p.teacher_id === teacherId) &&
        Number(p.dayOfWeek || p.day_of_week) === Number(dayOfWeek) &&
        Number(p.periodNumber || p.period_number) === Number(periodNumber) &&
        p.sectionId !== this.selectedSectionId
    );

    if (match) {
      const classTitle = match.className && match.sectionName ? `${match.className} - ${match.sectionName}` : (match.sectionName || 'Another Class');
      return {
        isAvailable: false,
        conflictText: `Allocated to ${classTitle}`,
      };
    }
    return { isAvailable: true, conflictText: 'Available' };
  }

  getAvailableTeachersCount(): number {
    return this.teachersList.filter(
      (t) => this.getTeacherAvailability(t.id, this.modalForm.dayOfWeek, this.modalForm.periodNumber).isAvailable
    ).length;
  }

  openAddPeriodModal(dayOfWeek = 1, periodNumber = 1, startTime = '08:30', endTime = '09:15') {
    const matchingPeriodSlot = this.periodSlots.find((p) => p.number === periodNumber);
    const initialStartTime = matchingPeriodSlot?.start || startTime;
    const initialEndTime = matchingPeriodSlot?.end || endTime;

    this.modalForm = {
      dayOfWeek,
      periodNumber,
      startTime: initialStartTime,
      endTime: initialEndTime,
      slotType: 'ACADEMIC',
      title: '',
      classSubjectId: this.availableSubjects[0]?.classSubjectId || '',
      teacherId: '', // Default to unassigned / "-- Select Teacher / Staff --"
      roomNumber: 'Room 101',
    };
    this.showAddModal = true;
  }

  savePeriodSlot() {
    if (!this.selectedSectionId) {
      this.toast.error('Please select a class section first');
      return;
    }

    const isAcademicSlot = ['ACADEMIC', 'SPORTS', 'LIBRARY', 'ACTIVITY'].includes(this.modalForm.slotType);

    if (isAcademicSlot && !this.modalForm.classSubjectId) {
      this.toast.error('Please select a subject from Curriculum Subjects');
      return;
    }

    if (this.modalForm.teacherId) {
      const avail = this.getTeacherAvailability(this.modalForm.teacherId, this.modalForm.dayOfWeek, this.modalForm.periodNumber);
      if (!avail.isAvailable) {
        const teacherObj = this.teachersList.find((t) => t.id === this.modalForm.teacherId);
        this.toast.error(`Conflict Warning: ${teacherObj?.name || 'Selected Teacher'} is already ${avail.conflictText}. A teacher can only teach one class at a time.`);
        return;
      }
    }

    this.savingPeriod = true;
    const selectedSubject = this.availableSubjects.find((s) => s.classSubjectId === this.modalForm.classSubjectId);
    const selectedTeacher = this.modalForm.teacherId ? this.teachersList.find((t) => t.id === this.modalForm.teacherId) : null;
    const activeSec = this.flatSections.find((s) => s.sectionId === this.selectedSectionId);

    const payload = {
      sectionId: this.selectedSectionId,
      dayOfWeek: Number(this.modalForm.dayOfWeek),
      periodNumber: Number(this.modalForm.periodNumber),
      startTime: this.modalForm.startTime,
      endTime: this.modalForm.endTime,
      slotType: this.modalForm.slotType,
      title: this.modalForm.title || selectedSubject?.name || undefined,
      classSubjectId: isAcademicSlot ? this.modalForm.classSubjectId || undefined : undefined,
      subjectId: isAcademicSlot ? (selectedSubject?.subjectId || this.modalForm.classSubjectId) : undefined,
      subjectName: selectedSubject?.name || undefined,
      subjectCode: selectedSubject?.code || undefined,
      teacherId: isAcademicSlot && this.modalForm.teacherId ? this.modalForm.teacherId : undefined,
      teacherName: isAcademicSlot && selectedTeacher ? selectedTeacher.name : undefined,
      roomNumber: this.modalForm.roomNumber || undefined,
      className: activeSec?.className || '',
      sectionName: activeSec?.sectionName || '',
    };

    this.api.post('timetable/periods', payload).subscribe({
      next: () => {
        this.toast.success('Period slot saved & faculty timetable automatically generated!');
        this.showAddModal = false;
        this.savingPeriod = false;
        this.loadSectionTimetable(this.selectedSectionId);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to save timetable period');
        this.savingPeriod = false;
      },
    });
  }

  getSubjectTheme(slot?: TimetablePeriodItem): {
    cardBg: string;
    badgeBg: string;
    badgeText: string;
    borderHover: string;
    accentBar: string;
    category: string;
    iconBg: string;
  } {
    if (!slot) {
      return {
        cardBg: 'bg-white',
        badgeBg: 'bg-slate-100 text-slate-700',
        badgeText: 'SUB',
        borderHover: 'hover:border-indigo-300',
        accentBar: 'bg-slate-400',
        category: 'General',
        iconBg: 'bg-slate-100 text-slate-700'
      };
    }

    if (slot.slotType === 'BREAK') {
      return {
        cardBg: 'bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-200/90 text-amber-900',
        badgeBg: 'bg-amber-100/90 text-amber-800 border-amber-200',
        badgeText: 'RECESS',
        borderHover: 'hover:border-amber-400',
        accentBar: 'bg-amber-400',
        category: 'Break',
        iconBg: 'bg-amber-200/70 text-amber-900'
      };
    }

    if (slot.slotType === 'LUNCH') {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border-emerald-200/90 text-emerald-900',
        badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
        badgeText: 'LUNCH',
        borderHover: 'hover:border-emerald-400',
        accentBar: 'bg-emerald-500',
        category: 'Interval',
        iconBg: 'bg-emerald-200/70 text-emerald-900'
      };
    }

    const name = (slot.subjectName || slot.title || '').toLowerCase();
    const code = (slot.subjectCode || '').toLowerCase();

    // Mathematics
    if (name.includes('math') || name.includes('algebra') || name.includes('geom') || code.includes('mat')) {
      return {
        cardBg: 'bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 border-blue-200/80',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        badgeText: slot.subjectCode || 'MATH',
        borderHover: 'hover:border-blue-400',
        accentBar: 'bg-blue-500',
        category: 'Mathematics',
        iconBg: 'bg-blue-100 text-blue-700'
      };
    }

    // Science / Physics / Chemistry / Biology / Computer Science / IT
    if (name.includes('scien') || name.includes('phys') || name.includes('chem') || name.includes('bio') || name.includes('comp') || name.includes('tech') || name.includes('i.t') || code.includes('sci') || code.includes('cs')) {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 border-emerald-200/80',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        badgeText: slot.subjectCode || 'SCI',
        borderHover: 'hover:border-emerald-400',
        accentBar: 'bg-emerald-500',
        category: 'Science & Tech',
        iconBg: 'bg-emerald-100 text-emerald-700'
      };
    }

    // Languages / English / Hindi / French / Spanish / Sanskrit / Urdu
    if (name.includes('eng') || name.includes('hindi') || name.includes('french') || name.includes('span') || name.includes('lang') || name.includes('sans') || name.includes('urdu') || code.includes('eng')) {
      return {
        cardBg: 'bg-gradient-to-br from-purple-50/70 via-white to-violet-50/30 border-purple-200/80',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        badgeText: slot.subjectCode || 'LANG',
        borderHover: 'hover:border-purple-400',
        accentBar: 'bg-purple-500',
        category: 'Languages',
        iconBg: 'bg-purple-100 text-purple-700'
      };
    }

    // Social Studies / History / Geography / Civics / EVS
    if (name.includes('soc') || name.includes('hist') || name.includes('geo') || name.includes('civ') || name.includes('evs') || name.includes('env')) {
      return {
        cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 border-amber-200/80',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        badgeText: slot.subjectCode || 'SOC',
        borderHover: 'hover:border-amber-400',
        accentBar: 'bg-amber-500',
        category: 'Social Studies',
        iconBg: 'bg-amber-100 text-amber-700'
      };
    }

    // Arts / Music / Sports / PE / Library / Activity
    if (name.includes('art') || name.includes('music') || name.includes('sport') || name.includes('p.e') || name.includes('dance') || slot.slotType === 'SPORTS' || slot.slotType === 'LIBRARY' || slot.slotType === 'ACTIVITY') {
      return {
        cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/30 border-rose-200/80',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        badgeText: slot.subjectCode || (slot.slotType === 'LIBRARY' ? 'LIB' : slot.slotType === 'SPORTS' ? 'PE' : 'ART'),
        borderHover: 'hover:border-rose-400',
        accentBar: 'bg-rose-500',
        category: 'Arts & Sports',
        iconBg: 'bg-rose-100 text-rose-700'
      };
    }

    // Default Academic Slot
    return {
      cardBg: 'bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/20 border-slate-200/80',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badgeText: slot.subjectCode || 'ACAD',
      borderHover: 'hover:border-indigo-300',
      accentBar: 'bg-indigo-500',
      category: 'Academic',
      iconBg: 'bg-slate-100 text-slate-700'
    };
  }

  getTeacherDisplayName(slot: TimetablePeriodItem): string | null {
    if (!slot) return null;
    if (slot.teacherId && this.teachersList.length > 0) {
      const found = this.teachersList.find((t) => t.id === slot.teacherId);
      return found ? found.name : null;
    }
    if (slot.teacherName && slot.teacherName !== 'Faculty' && slot.teacherName !== 'Assigned Teacher') {
      if (this.teachersList.length > 0) {
        const found = this.teachersList.find((t) => t.name.toLowerCase() === slot.teacherName!.trim().toLowerCase());
        return found ? found.name : null;
      }
      return slot.teacherName;
    }
    return null;
  }

  getInitials(name?: string): string {
    if (!name || name === 'Faculty' || name === 'Assigned Teacher') return 'T';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  openEditPeriodModal(slot: TimetablePeriodItem, event?: Event) {
    if (event) event.stopPropagation();
    const isTeacherActive = slot.teacherId ? this.teachersList.some((t) => t.id === slot.teacherId) : false;
    this.modalForm = {
      dayOfWeek: Number(slot.dayOfWeek),
      periodNumber: Number(slot.periodNumber),
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotType: slot.slotType as any,
      title: slot.title || '',
      classSubjectId: slot.classSubjectId || '',
      teacherId: isTeacherActive ? (slot.teacherId || '') : '',
      roomNumber: slot.roomNumber || 'Room 101',
    };
    this.showAddModal = true;
  }

  deletePeriod(periodId: string) {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;

    this.api.delete(`timetable/periods/${periodId}`).subscribe({
      next: () => {
        this.toast.success('Period removed');
        if (this.selectedSectionId) {
          this.loadSectionTimetable(this.selectedSectionId);
        } else if (this.auth.isTeacher()) {
          this.loadTeacherTimetable();
        }
      },
      error: () => {
        this.toast.error('Could not remove period');
      },
    });
  }
}
