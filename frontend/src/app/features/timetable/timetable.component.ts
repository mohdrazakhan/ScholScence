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

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- ============================================================== -->
      <!-- TOP PRIMARY MODE TABS (For Admins / Principals)                 -->
      <!-- ============================================================== -->
      <div *ngIf="canSwitchModes" class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
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
            {{ teachersList.length }} Teachers
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
              {{ auth.isParent() ? 'Parent & Student Portal' : (timetableMode === 'FACULTY' ? 'Faculty Schedule' : 'Institutional Schedule') }}
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
          <div *ngIf="auth.isParent() && childrenList.length > 1" class="flex items-center gap-2">
            <label class="text-xs font-bold text-slate-600">Select Child:</label>
            <select [ngModel]="selectedChildId" (ngModelChange)="onChildChange($event)"
                    class="px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
              <option *ngFor="let child of childrenList" [value]="child.studentId">
                {{ child.name }} ({{ child.className }} - {{ child.sectionName }})
              </option>
            </select>
          </div>

          <!-- Section Switcher for Admin / Principal (Student Timetable Mode) -->
          <div *ngIf="canSwitchModes && timetableMode === 'STUDENT'" class="flex items-center gap-2 flex-wrap">
            <label class="text-xs font-bold text-slate-600">Class Section:</label>
            <select [ngModel]="selectedSectionId" (ngModelChange)="onSectionChange($event)"
                    class="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
              <option *ngFor="let sec of flatSections" [value]="sec.sectionId">
                {{ sec.className }} - {{ sec.sectionName }}
              </option>
            </select>

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
            <label class="text-xs font-bold text-slate-600">Teacher / Faculty:</label>
            <select [ngModel]="selectedTeacherId" (ngModelChange)="onTeacherChange($event)"
                    class="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none shadow-sm cursor-pointer">
              <option *ngFor="let t of teachersList" [value]="t.id">
                {{ t.name }} ({{ t.email }})
              </option>
            </select>
          </div>

          <!-- Teacher Mode Toggle (Personal Routine vs Class Teacher Timetable) -->
          <div *ngIf="auth.isTeacher() && !auth.isAdmin()" class="flex items-center gap-2">
            <button *ngIf="auth.isClassTeacher()" (click)="toggleTeacherViewMode()"
                    class="px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer"
                    [ngClass]="teacherViewMode === 'CLASS' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-300'">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{{ teacherViewMode === 'CLASS' ? 'Viewing Class Timetable' : 'Switch to My Class Timetable' }}</span>
            </button>

            <button *ngIf="teacherViewMode === 'CLASS' && canEditCurrentTimetable" (click)="openAddPeriodModal()"
                    class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Period</span>
            </button>
          </div>

          <!-- View Mode Toggle (Matrix Grid vs Daily Timeline) -->
          <div class="flex items-center p-1 bg-[#edf2f7] rounded-2xl border border-slate-200 shadow-inner">
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
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- DAY SELECTOR TABS (Active when Day View is active)             -->
      <!-- ============================================================== -->
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

      <!-- ============================================================== -->
      <!-- VIEW 1: WEEKLY MATRIX GRID VIEW                                -->
      <!-- ============================================================== -->
      <div *ngIf="viewLayout === 'GRID'" class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-[#f8fafc]">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-inner">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-extrabold text-slate-900">
                {{ timetableMode === 'FACULTY' ? 'Faculty Weekly Teaching Schedule' : 'Weekly Class Timetable Schedule' }}
              </h3>
              <p class="text-[11px] text-slate-500">
                {{ timetableMode === 'FACULTY' ? 'Weekly periods and room allocations for the selected faculty member' : 'Periods 1 through 8 with standard Recess and Lunch intervals' }}
              </p>
            </div>
          </div>

          <!-- Quick legend -->
          <div class="hidden sm:flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-md bg-blue-100 border border-blue-300 inline-block"></span>
              <span class="text-slate-600 font-medium">Academic</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-md bg-amber-100 border border-amber-300 inline-block"></span>
              <span class="text-slate-600 font-medium">Recess Break</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300 inline-block"></span>
              <span class="text-slate-600 font-medium">Lunch Interval</span>
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th class="p-4 w-32 sticky left-0 bg-slate-50 border-r border-slate-200/80 z-10">Day / Period</th>
                <th *ngFor="let pNum of periodSlots" class="p-4 text-center min-w-[140px] border-r border-slate-200/60 last:border-r-0">
                  <div class="text-slate-900 font-black">Period {{ pNum.number }}</div>
                  <div class="text-[10px] text-slate-500 font-semibold mt-0.5">{{ pNum.time }}</div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr *ngFor="let day of days" class="hover:bg-slate-50/40 transition-colors">
                <!-- Day Column (Sticky) -->
                <td class="p-4 font-bold text-slate-900 bg-white sticky left-0 border-r border-slate-200/80 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <div class="text-sm font-black">{{ day.name }}</div>
                  <div class="text-[10px] text-slate-400 font-semibold">{{ day.short }}</div>
                </td>

                <!-- Periods 1 to 8 -->
                <td *ngFor="let pNum of periodSlots" class="p-2.5 border-r border-slate-100 last:border-r-0 align-top">
                  <ng-container *ngIf="getPeriod(day.name, pNum.number) as slot; else emptySlot">
                    
                    <!-- RECESSS / BREAK SLOT -->
                    <div *ngIf="slot.slotType === 'BREAK'"
                         class="h-full min-h-[90px] p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 text-amber-900 flex flex-col justify-between shadow-xs">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300/50">
                          Recess
                        </span>
                        <span class="text-[10px] font-bold text-amber-600">{{ slot.startTime }} - {{ slot.endTime }}</span>
                      </div>
                      <div class="font-black text-xs text-amber-950 mt-1.5">{{ slot.title || 'Morning Break' }}</div>
                      <div class="text-[10px] text-amber-700/80 font-medium">15 Mins Interval</div>
                    </div>

                    <!-- LUNCH INTERVAL SLOT -->
                    <div *ngIf="slot.slotType === 'LUNCH'"
                         class="h-full min-h-[90px] p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/90 text-emerald-900 flex flex-col justify-between shadow-xs">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300/50">
                          Lunch
                        </span>
                        <span class="text-[10px] font-bold text-emerald-600">{{ slot.startTime }} - {{ slot.endTime }}</span>
                      </div>
                      <div class="font-black text-xs text-emerald-950 mt-1.5">{{ slot.title || 'Lunch Interval' }}</div>
                      <div class="text-[10px] text-emerald-700/80 font-medium">Refuel & Recreation</div>
                    </div>

                    <!-- ACADEMIC / SUBJECT SLOT -->
                    <div *ngIf="slot.slotType === 'ACADEMIC' || slot.slotType === 'SPORTS' || slot.slotType === 'LIBRARY' || slot.slotType === 'ACTIVITY'"
                         class="group relative h-full min-h-[90px] p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-[2px_2px_8px_#edf2f7] hover:shadow-[4px_4px_12px_#d9e2ec] transition-all flex flex-col justify-between">
                      <div>
                        <div class="flex items-center justify-between gap-1">
                          <span class="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            {{ slot.subjectCode || 'SUB' }}
                          </span>
                          <span class="text-[10px] font-bold text-slate-500">{{ slot.startTime }} - {{ slot.endTime }}</span>
                        </div>
                        <div class="font-extrabold text-xs text-slate-900 mt-1.5 leading-snug">
                          {{ slot.subjectName || slot.title }}
                        </div>
                      </div>

                      <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                        <span class="truncate font-medium text-slate-700" title="{{ slot.className ? slot.className + ' - ' + slot.sectionName : (slot.teacherName || 'Faculty') }}">
                          {{ slot.className ? (slot.className + ' Sec ' + slot.sectionName) : (slot.teacherName || 'Assigned Teacher') }}
                        </span>
                        <span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {{ slot.roomNumber || 'Room' }}
                        </span>
                      </div>

                      <!-- Edit/Delete Action for Teachers/Admins on Hover -->
                      <div *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" class="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/95 p-1 rounded-xl shadow-md border border-slate-200">
                        <button (click)="deletePeriod(slot.id)" title="Remove Period"
                                class="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                  </ng-container>

                  <!-- EMPTY SLOT TEMPLATE -->
                  <ng-template #emptySlot>
                    <div class="h-full min-h-[90px] p-3 rounded-2xl border-2 border-dashed border-slate-200/70 flex flex-col items-center justify-center text-center text-slate-400">
                      <span class="text-[10px] font-medium">Free Slot</span>
                      <button *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" (click)="openAddPeriodModal(day.id, pNum.number, pNum.start, pNum.end)"
                              class="mt-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                        + Assign
                      </button>
                    </div>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- VIEW 2: DAILY TIMELINE CARDS VIEW                              -->
      <!-- ============================================================== -->
      <div *ngIf="viewLayout === 'DAY'" class="space-y-3">
        <div *ngFor="let slot of getPeriodsForDay(getSelectedDayName())"
             class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div class="flex items-center gap-4">
            <!-- Period Circle Indicator -->
            <div class="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border"
                 [ngClass]="{
                   'bg-amber-50 text-amber-700 border-amber-200': slot.slotType === 'BREAK',
                   'bg-emerald-50 text-emerald-700 border-emerald-200': slot.slotType === 'LUNCH',
                   'bg-slate-900 text-white border-slate-900 shadow-md': slot.slotType === 'ACADEMIC'
                 }">
              <span class="text-[9px] font-bold uppercase tracking-wider">Slot</span>
              <span class="text-base font-black leading-none mt-0.5">{{ slot.periodNumber }}</span>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  {{ slot.startTime }} - {{ slot.endTime }}
                </span>
                <span *ngIf="slot.roomNumber" class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                  {{ slot.roomNumber }}
                </span>
              </div>
              <h3 class="text-base font-black text-slate-900 mt-1">
                {{ slot.subjectName || slot.title }}
              </h3>
              <p *ngIf="slot.teacherName || slot.className" class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{{ slot.className ? ('Class: ' + slot.className + ' - ' + slot.sectionName) : ('Faculty: ' + slot.teacherName) }}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-3 py-1.5 rounded-xl text-xs font-bold border"
                  [ngClass]="{
                    'bg-amber-50 text-amber-800 border-amber-200': slot.slotType === 'BREAK',
                    'bg-emerald-50 text-emerald-800 border-emerald-200': slot.slotType === 'LUNCH',
                    'bg-blue-50 text-blue-800 border-blue-200': slot.slotType === 'ACADEMIC'
                  }">
              {{ slot.slotType }}
            </span>

            <button *ngIf="canEditCurrentTimetable && timetableMode === 'STUDENT'" (click)="deletePeriod(slot.id)"
                    class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer">
              Remove
            </button>
          </div>
        </div>

        <div *ngIf="getPeriodsForDay(getSelectedDayName()).length === 0"
             class="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 class="text-sm font-bold text-slate-800">No scheduled periods for {{ getSelectedDayName() }}</h4>
          <p class="text-xs text-slate-500 mt-1">Free day or schedule not yet configured for this day.</p>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- ADD / EDIT TIMETABLE PERIOD MODAL                              -->
      <!-- ============================================================== -->
      <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
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
                <select [(ngModel)]="modalForm.periodNumber"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option *ngFor="let p of periodSlots" [value]="p.number">Period {{ p.number }}</option>
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

            <!-- If Academic: Subject & Teacher -->
            <div *ngIf="modalForm.slotType === 'ACADEMIC' || modalForm.slotType === 'SPORTS' || modalForm.slotType === 'LIBRARY' || modalForm.slotType === 'ACTIVITY'" class="space-y-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Subject</label>
                <select [(ngModel)]="modalForm.classSubjectId"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option value="">-- Select Subject --</option>
                  <option *ngFor="let sub of availableSubjects" [value]="sub.classSubjectId">
                    {{ sub.name }} ({{ sub.code }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Assigned Teacher</label>
                <select [(ngModel)]="modalForm.teacherId"
                        class="w-full px-3 py-2 bg-[#f8fafc] border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none shadow-inner">
                  <option value="">-- Select Teacher --</option>
                  <option *ngFor="let t of teachersList" [value]="t.id">
                    {{ t.name }} ({{ t.email }})
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
              <input type="text" [(ngModel)]="modalForm.roomNumber" placeholder="e.g. Room 204, Chemistry Lab"
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

    </div>
  `,
})
export class TimetableComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  timetableMode: 'STUDENT' | 'FACULTY' = 'STUDENT';
  viewLayout: 'GRID' | 'DAY' = 'GRID';
  activeDayTab = 1;
  teacherViewMode: 'TEACHER' | 'CLASS' = 'TEACHER';

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

  // Flat sections list for Admin/Principal dropdown
  flatSections: { sectionId: string; className: string; sectionName: string }[] = [];
  selectedSectionId = '';
  selectedTeacherId = '';
  currentSectionTitle = 'Campus Schedule';

  // Parent child list
  childrenList: ChildItem[] = [];
  selectedChildId = '';

  // Modal form
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

  get headerTitle(): string {
    if (this.auth.isParent()) {
      const child = this.childrenList.find((c) => c.studentId === this.selectedChildId);
      return child ? `${child.name}'s Weekly Timetable` : 'Child Weekly Schedule';
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
    if (this.timetableMode === 'FACULTY' || (this.auth.isTeacher() && !this.auth.isAdmin() && this.teacherViewMode === 'TEACHER')) {
      return 'Weekly periods, assigned class sections, and classroom allocations.';
    }
    return 'Manage weekly schedules, subject allocations, and recess intervals.';
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['type'] === 'faculty') {
        this.timetableMode = 'FACULTY';
      } else if (params['type'] === 'student') {
        this.timetableMode = 'STUDENT';
      }
    });

    this.initData();
  }

  setMode(mode: 'STUDENT' | 'FACULTY') {
    this.timetableMode = mode;
    if (mode === 'FACULTY') {
      if (this.selectedTeacherId) {
        this.loadFacultyTimetable(this.selectedTeacherId);
      } else if (this.teachersList.length > 0) {
        this.selectedTeacherId = this.teachersList[0].id;
        this.loadFacultyTimetable(this.selectedTeacherId);
      }
    } else {
      if (this.selectedSectionId) {
        this.loadSectionTimetable(this.selectedSectionId);
      }
    }
  }

  initData() {
    if (this.auth.isParent()) {
      this.loadParentTimetable();
    } else if (this.auth.isTeacher() && !this.auth.isAdmin()) {
      this.loadTeacherTimetable();
      this.loadClassesAndTeachers();
    } else {
      this.loadClassesAndTeachers();
    }
  }

  loadClassesAndTeachers() {
    this.api.get<ClassItem[]>('academics/classes').subscribe({
      next: (classes) => {
        this.flatSections = [];
        for (const cls of classes) {
          for (const sec of cls.sections) {
            this.flatSections.push({
              sectionId: sec.id,
              className: cls.name,
              sectionName: sec.name,
            });
          }
        }
        if (this.flatSections.length > 0 && !this.selectedSectionId) {
          const classTeacherSec = this.auth.currentUser()?.teachingScope?.classTeacherSections?.[0];
          if (classTeacherSec) {
            this.selectedSectionId = classTeacherSec.sectionId;
          } else {
            this.selectedSectionId = this.flatSections[0].sectionId;
          }

          if (this.timetableMode === 'STUDENT') {
            this.loadSectionTimetable(this.selectedSectionId);
          }
        }
      },
    });

    // Load staff & teachers
    this.api.get<any[]>('academics/staff').subscribe({
      next: (staff) => {
        this.teachersList = staff
          .filter((u) => u.role === 'TEACHER' || u.role === 'CLASS_TEACHER' || u.role === 'PRINCIPAL')
          .map((u) => ({
            id: u.id,
            name: u.fullName || `${u.firstName} ${u.lastName || ''}`.trim(),
            email: u.email,
            role: u.role,
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

  loadParentTimetable(studentId?: string) {
    const url = studentId ? `timetable/my-child?studentId=${studentId}` : 'timetable/my-child';
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.childrenList = res.childrenList || [];
        if (res.selectedChild) {
          this.selectedChildId = res.selectedChild.studentId;
          this.currentSectionTitle = `${res.selectedChild.className} - ${res.selectedChild.sectionName}`;
        }
        if (res.timetable) {
          this.periods = res.timetable.periods || [];
          this.availableSubjects = res.timetable.availableSubjects || [];
        }
      },
      error: () => {
        this.toast.error('Unable to load child timetable');
      },
    });
  }

  loadTeacherTimetable() {
    this.teacherViewMode = 'TEACHER';
    this.api.get<any>('timetable/teacher').subscribe({
      next: (res) => {
        this.periods = res.periods || [];
        this.currentSectionTitle = 'Faculty Routine';
      },
    });
  }

  loadFacultyTimetable(teacherId: string) {
    const teacher = this.teachersList.find((t) => t.id === teacherId);
    this.api.get<any>(`timetable/teacher?teacherId=${teacherId}`).subscribe({
      next: (res) => {
        this.periods = res.periods || [];
        this.currentSectionTitle = teacher ? `${teacher.name} (${teacher.role || 'Faculty'})` : 'Faculty Routine';
      },
      error: () => {
        this.periods = [];
      },
    });
  }

  loadSectionTimetable(sectionId: string) {
    this.api.get<any>(`timetable/section/${sectionId}`).subscribe({
      next: (res) => {
        this.periods = res.periods || [];
        this.availableSubjects = res.availableSubjects || [];
        if (res.section) {
          this.currentSectionTitle = `${res.section.className} - ${res.section.name}`;
        }
      },
    });
  }

  onSectionChange(sectionId: string) {
    this.selectedSectionId = sectionId;
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
      (p) => (p.dayName === dayName || this.getDayNameFromNumber(p.dayOfWeek) === dayName) && p.periodNumber === periodNumber,
    );
  }

  getPeriodsForDay(dayName: string): TimetablePeriodItem[] {
    return this.periods
      .filter((p) => p.dayName === dayName || this.getDayNameFromNumber(p.dayOfWeek) === dayName)
      .sort((a, b) => a.periodNumber - b.periodNumber);
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

  openAddPeriodModal(dayOfWeek = 1, periodNumber = 1, startTime = '08:30', endTime = '09:15') {
    this.modalForm = {
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      slotType: 'ACADEMIC',
      title: '',
      classSubjectId: this.availableSubjects[0]?.classSubjectId || '',
      teacherId: this.teachersList[0]?.id || '',
      roomNumber: 'Room 101',
    };
    this.showAddModal = true;
  }

  savePeriodSlot() {
    if (!this.selectedSectionId) {
      this.toast.error('Please select a class section first');
      return;
    }

    this.savingPeriod = true;
    const payload = {
      sectionId: this.selectedSectionId,
      dayOfWeek: Number(this.modalForm.dayOfWeek),
      periodNumber: Number(this.modalForm.periodNumber),
      startTime: this.modalForm.startTime,
      endTime: this.modalForm.endTime,
      slotType: this.modalForm.slotType,
      title: this.modalForm.title || undefined,
      classSubjectId: this.modalForm.slotType === 'ACADEMIC' ? this.modalForm.classSubjectId || undefined : undefined,
      teacherId: this.modalForm.teacherId || undefined,
      roomNumber: this.modalForm.roomNumber || undefined,
    };

    this.api.post('timetable/periods', payload).subscribe({
      next: () => {
        this.toast.success('Period slot saved successfully');
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
