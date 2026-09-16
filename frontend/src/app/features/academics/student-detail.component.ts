import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ToastService } from '../../core/services/toast.service';

interface ActivityLog {
  id: string;
  type: 'ENROLLMENT' | 'STATUS_CHANGE' | 'ACADEMIC_EXAM' | 'DISCIPLINARY_COMPLAINT' | string;
  badge_color: 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue' | 'purple' | string;
  title: string;
  timestamp: string;
  summary: string;
  author: string;
}

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6 animate-fadeIn pb-24">
      
      <!-- Top Navigation & Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <nav class="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-400 mb-1">
            <a routerLink="/dashboard" class="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </a>
            <span>/</span>
            <a routerLink="/academics" [queryParams]="{ tab: 'students' }" class="hover:text-indigo-600 transition-colors">Academics</a>
            <span>/</span>
            <span class="text-slate-700 font-bold">Student Profile</span>
          </nav>
          
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button (click)="goBack()"
                    class="p-2 sm:p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    title="Back to Students">
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <!-- Student Profile Switcher (Prev / Next Arrow Controls in Same Class & Section) -->
            <div *ngIf="(profileData?.navigation?.totalStudents || 0) > 1"
                 class="flex items-center bg-white border border-slate-200/80 rounded-2xl p-0.5 sm:p-1 shadow-xs">
              <!-- Prev Student Arrow Button -->
              <button (click)="goToPreviousStudent()"
                      [disabled]="!hasPrevStudent"
                      class="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
                      [title]="prevStudentItem ? 'Previous: ' + prevStudentItem.fullName : 'Previous Student'">
                <svg class="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span class="text-[11px] sm:text-xs font-bold text-slate-700 px-1.5 sm:px-2 select-none font-mono">
                {{ navStudents.length > 0 ? (currentNavIndex + 1) : 1 }}/{{ navStudents.length || 1 }}
              </span>

              <!-- Next Student Arrow Button -->
              <button (click)="goToNextStudent()"
                      [disabled]="!hasNextStudent"
                      class="p-1.5 sm:p-2 rounded-xl text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
                      [title]="nextStudentItem ? 'Next: ' + nextStudentItem.fullName : 'Next Student'">
                <svg class="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div>
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Student Details & Logs</h1>
            </div>
          </div>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          <!-- Direct Next Student Quick Switch Button -->
          <button *ngIf="hasNextStudent" (click)="goToNextStudent()"
                  class="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-2xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                  [title]="'Next Student: ' + (nextStudentItem?.fullName || '') + ' (' + (nextStudentItem?.className || '') + ' - ' + (nextStudentItem?.sectionName || '') + ')'">
            <span>Next: <strong class="text-indigo-600">{{ nextStudentItem?.fullName }}</strong></span>
            <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button *ngIf="canManageStatus" (click)="openStatusModal()"
                  class="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Update Status</span>
          </button>
          
          <button (click)="refreshData()" [disabled]="isLoading"
                  class="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
                  title="Refresh Student Profile">
            <svg class="w-4 h-4" [class.animate-spin]="isLoading" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200/70 shadow-xs">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 animate-pulse">
          <svg class="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h3 class="text-sm sm:text-base font-bold text-slate-800">Loading Student Profile & Activity Logs...</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Retrieving enrollment history, examination scores, attendance milestones, and administrative history.</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && errorMessage" class="bg-rose-50/80 border border-rose-200 rounded-3xl p-6 sm:p-8 text-center">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-rose-800">{{ errorMessage }}</h3>
        <button (click)="goBack()" class="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
          Return to Academics List
        </button>
      </div>

      <div *ngIf="!isLoading && !errorMessage && profileData" class="space-y-5 sm:space-y-6">
        
        <!-- Student Hero Banner Card (Light Minimalist & Claymorphic) -->
        <div class="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <!-- Left Info Block -->
            <div class="flex items-start sm:items-center gap-3.5 sm:gap-5">
              <!-- Avatar with in-place photo upload -->
              <div class="relative group shrink-0">
                <div class="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-black shadow-md shadow-indigo-200 shrink-0 border border-white overflow-hidden">
                  <img *ngIf="profileData.student.photo_url || profileData.student.photoUrl"
                       [src]="profileData.student.photo_url || profileData.student.photoUrl"
                       [alt]="profileData.student.fullName"
                       class="w-full h-full object-cover">
                  <span *ngIf="!(profileData.student.photo_url || profileData.student.photoUrl)">
                    {{ getInitials(profileData.student.fullName) }}
                  </span>
                </div>

                <!-- Hover Change Photo Button -->
                <label *ngIf="canManageStatus"
                       class="absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-xs shadow-inner"
                       title="Change Student Photo">
                  <svg *ngIf="!isUploadingPhoto" class="w-4 h-4 sm:w-5 sm:h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg *ngIf="isUploadingPhoto" class="w-4 h-4 sm:w-5 sm:h-5 animate-spin mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span class="text-[9px] sm:text-[10px] font-bold tracking-tight">{{ isUploadingPhoto ? 'Saving...' : 'Change' }}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/jpg" (change)="onStudentPhotoSelected($event)" class="hidden" [disabled]="isUploadingPhoto">
                </label>
              </div>

              <!-- Name, Class, Adm & Status -->
              <div class="space-y-1.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">{{ profileData.student.fullName }}</h2>
                  
                  <span [ngClass]="getStatusBadgeClass(profileData.student.status)"
                        class="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shadow-2xs">
                    {{ profileData.student.status }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 sm:gap-2.5 flex-wrap text-xs text-slate-500">
                  <span class="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-100 shadow-2xs">
                    <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {{ profileData.student.className }} - {{ profileData.student.sectionName }}
                  </span>
                  <span class="text-slate-300">•</span>
                  <span>Roll No: <strong class="text-slate-900 font-bold">#{{ profileData.student.rollNumber }}</strong></span>
                  <span class="text-slate-300">•</span>
                  <span>Adm No: <strong class="text-slate-900 font-bold font-mono">{{ profileData.student.admission_number || 'N/A' }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Right Quick Metrics Box (Claymorphic Light) -->
            <div class="grid grid-cols-3 gap-2 sm:gap-3 bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-2.5 sm:p-3.5 shadow-2xs shrink-0">
              <div class="text-center px-1.5 sm:px-3">
                <div class="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance</div>
                <div class="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{{ profileData.attendanceStats.percentage }}%</div>
                <div class="text-[9px] sm:text-[10px] text-slate-400">{{ profileData.attendanceStats.present_days }}/{{ profileData.attendanceStats.total_days }} Days</div>
              </div>
              
              <div class="text-center px-1.5 sm:px-3 border-x border-slate-200">
                <div class="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">Exams</div>
                <div class="text-base sm:text-lg font-black text-indigo-600 mt-0.5">{{ profileData.examMarks.length }}</div>
                <div class="text-[9px] sm:text-[10px] text-slate-400">Tests Recorded</div>
              </div>

              <div class="text-center px-1.5 sm:px-3">
                <div class="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">Complaints</div>
                <div class="text-base sm:text-lg font-black mt-0.5" [ngClass]="profileData.complaints.length > 0 ? 'text-rose-600' : 'text-slate-700'">
                  {{ profileData.complaints.length }}
                </div>
                <div class="text-[9px] sm:text-[10px] text-slate-400">Total Notes</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs Bar (Scrollable on Mobile with Crisp SVG Icons) -->
        <div class="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner">
          <button *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  [ngClass]="activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm border-slate-200/80 font-bold' : 'text-slate-600 hover:text-slate-900 border-transparent font-medium hover:bg-white/50'"
                  class="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0">
            <!-- Dynamic SVG Tab Icons -->
            <svg *ngIf="tab.id === 'logs'" class="w-4 h-4" [class.text-indigo-600]="activeTab === 'logs'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg *ngIf="tab.id === 'profile'" class="w-4 h-4" [class.text-indigo-600]="activeTab === 'profile'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <svg *ngIf="tab.id === 'exams'" class="w-4 h-4" [class.text-indigo-600]="activeTab === 'exams'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <svg *ngIf="tab.id === 'attendance'" class="w-4 h-4" [class.text-indigo-600]="activeTab === 'attendance'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg *ngIf="tab.id === 'complaints'" class="w-4 h-4" [class.text-indigo-600]="activeTab === 'complaints'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>

            <span>{{ tab.label }}</span>
            
            <span *ngIf="tab.count !== undefined"
                  [ngClass]="activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'"
                  class="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full transition-colors">
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Tab 1: Activity & Audit Timeline Logs -->
        <div *ngIf="activeTab === 'logs'" class="space-y-4">
          <div class="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-5 border-b border-slate-100">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Comprehensive Activity & Audit History
                </h3>
                <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Chronological record of admissions, status changes, examinations, and disciplinary notes.</p>
              </div>

              <!-- Filter Pills (SVG Icons & Clean Labels) -->
              <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <button *ngFor="let f of logFilters"
                        (click)="activeLogFilter = f.value"
                        [ngClass]="activeLogFilter === f.value ? 'bg-slate-900 text-white font-bold shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium'"
                        class="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95">
                  {{ f.label }}
                </button>
              </div>
            </div>

            <!-- Timeline Entries List -->
            <div class="mt-6 relative pl-5 sm:pl-8 space-y-6 sm:space-y-7 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div *ngFor="let log of filteredActivityLogs" class="relative group">
                <!-- Timeline Dot Indicator with crisp SVG Icon -->
                <div [ngClass]="getTimelineDotClass(log.badge_color)"
                     class="absolute -left-5 sm:-left-8 top-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                  <!-- Dynamic small SVG icon based on log type -->
                  <svg *ngIf="log.type === 'ENROLLMENT'" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <svg *ngIf="log.type === 'STATUS_CHANGE'" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <svg *ngIf="log.type === 'ACADEMIC_EXAM'" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <svg *ngIf="log.type === 'DISCIPLINARY_COMPLAINT'" class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>

                <!-- Claymorphic Log Box -->
                <div class="bg-[#f8fafc] hover:bg-slate-50 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs transition-all hover:shadow-md">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span [ngClass]="getLogBadgeClass(log.badge_color)"
                            class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border">
                        {{ log.type.replace('_', ' ') }}
                      </span>
                      <h4 class="text-xs sm:text-sm font-bold text-slate-900">{{ log.title }}</h4>
                    </div>
                    <time class="text-[11px] sm:text-xs font-semibold text-slate-400">{{ log.timestamp | date:'medium' }}</time>
                  </div>

                  <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">{{ log.summary }}</p>

                  <div class="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Logged By: <strong class="text-slate-700 font-semibold">{{ log.author }}</strong>
                    </span>
                    <span class="text-slate-400 font-mono text-[9px] sm:text-[10px]">ID: {{ log.id }}</span>
                  </div>
                </div>
              </div>

              <!-- Empty Filtered Logs State -->
              <div *ngIf="filteredActivityLogs.length === 0" class="py-10 text-center text-slate-400">
                <div class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p class="text-xs font-semibold">No activity logs recorded under this category.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Personal Profile Details (Claymorphic Responsive Grid) -->
        <div *ngIf="activeTab === 'profile'" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Left 2 Cols: Personal & Guardian Info -->
          <div class="lg:col-span-2 space-y-5">
            <!-- Basic Personal Details -->
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Personal Information
                </h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Full Legal Name</span>
                  <span class="text-slate-800 font-bold text-sm">{{ profileData.student.fullName }}</span>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Gender</span>
                  <span class="text-slate-800 font-bold text-sm uppercase">{{ profileData.student.gender || 'Not Specified' }}</span>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Date of Birth</span>
                  <span class="text-slate-800 font-bold text-sm">{{ (profileData.student.date_of_birth | date:'longDate') || 'N/A' }}</span>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Blood Group</span>
                  <span class="text-slate-800 font-bold text-sm">{{ profileData.student.blood_group || 'Not recorded' }}</span>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">National ID / Aadhaar</span>
                  <span class="text-slate-800 font-bold text-sm font-mono">{{ profileData.student.national_id || profileData.student.aadhaar_number || 'N/A' }}</span>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Category / Caste</span>
                  <span class="text-slate-800 font-bold text-sm">{{ profileData.student.category || 'General' }}</span>
                </div>
              </div>
            </div>

            <!-- Guardian & Emergency Contact -->
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Parent / Guardian & Emergency Contact
                </h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60 flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300 overflow-hidden shadow-2xs">
                    <img *ngIf="profileData.student.guardian_photo_url || profileData.student.guardianPhotoUrl"
                         [src]="profileData.student.guardian_photo_url || profileData.student.guardianPhotoUrl"
                         alt="Guardian Photo" class="w-full h-full object-cover">
                    <svg *ngIf="!(profileData.student.guardian_photo_url || profileData.student.guardianPhotoUrl)" class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <span class="text-slate-400 font-medium block text-[11px]">Primary Guardian Name</span>
                    <span class="text-slate-800 font-bold text-sm truncate block">{{ profileData.student.emergency_contact_name || profileData.student.guardian_name || 'Primary Guardian' }}</span>
                  </div>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60 flex flex-col justify-center">
                  <span class="text-slate-400 font-medium block text-[11px]">Relationship</span>
                  <span class="text-slate-800 font-bold text-sm">{{ profileData.student.emergency_contact_relation || 'Parent' }}</span>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Contact Phone</span>
                  <a [href]="'tel:' + (profileData.student.emergency_contact_phone || profileData.student.phone)" class="text-indigo-600 hover:underline font-bold text-sm block">
                    {{ profileData.student.emergency_contact_phone || profileData.student.phone || 'N/A' }}
                  </a>
                </div>
                <div class="bg-[#f8fafc] p-3.5 rounded-2xl border border-slate-200/60">
                  <span class="text-slate-400 font-medium block text-[11px]">Guardian Email</span>
                  <a [href]="'mailto:' + (profileData.student.guardian_email || profileData.student.email)" class="text-slate-800 hover:text-indigo-600 hover:underline font-bold text-sm block truncate">
                    {{ profileData.student.guardian_email || profileData.student.email || 'N/A' }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Address Information -->
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Residential Address
                </h3>
              </div>
              <p class="text-xs sm:text-sm text-slate-700 bg-[#f8fafc] p-4 rounded-2xl border border-slate-200/60 leading-relaxed">
                {{ profileData.student.address || profileData.student.permanent_address || 'No registered residential address on record.' }}
                <span *ngIf="profileData.student.city">, {{ profileData.student.city }}</span>
                <span *ngIf="profileData.student.state">, {{ profileData.student.state }}</span>
                <span *ngIf="profileData.student.pincode"> - {{ profileData.student.pincode }}</span>
              </p>
            </div>
          </div>

          <!-- Right Column: Academic Class & Medical -->
          <div class="space-y-5">
            <!-- Academic Enrolment Details -->
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Academic Class
                </h3>
              </div>

              <div class="space-y-2.5 text-xs">
                <div class="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-slate-200/60">
                  <span class="text-slate-500 font-medium">Enrolled Class</span>
                  <span class="font-bold text-slate-800">{{ profileData.student.className }}</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-slate-200/60">
                  <span class="text-slate-500 font-medium">Assigned Section</span>
                  <span class="font-bold text-slate-800">{{ profileData.student.sectionName }}</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-slate-200/60">
                  <span class="text-slate-500 font-medium">Roll Number</span>
                  <span class="font-bold text-indigo-600 font-mono">#{{ profileData.student.rollNumber }}</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-slate-200/60">
                  <span class="text-slate-500 font-medium">Academic Session</span>
                  <span class="font-bold text-slate-800">{{ profileData.student.academicSession }}</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-slate-200/60">
                  <span class="text-slate-500 font-medium">Admission Date</span>
                  <span class="font-bold text-slate-800">{{ (profileData.student.created_at | date:'mediumDate') || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Health & Special Notes -->
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Health & Medical
                </h3>
              </div>
              <p class="text-xs text-slate-600 bg-rose-50/40 border border-rose-100 p-3.5 rounded-2xl leading-relaxed">
                {{ profileData.student.medical_notes || 'No special medical conditions, allergies, or physical accommodations reported.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tab 3: Exams & Academic Performance -->
        <div *ngIf="activeTab === 'exams'" class="space-y-4">
          <div class="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900">Exams & Academic Test Records</h3>
                <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Transcript of graded evaluations, periodic tests, and assessments.</p>
              </div>
              <span class="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-auto">
                Total Assessments: <strong class="text-slate-900">{{ profileData.examMarks.length }}</strong>
              </span>
            </div>

            <!-- Desktop Table View (Hidden on mobile) -->
            <div *ngIf="profileData.examMarks.length > 0" class="hidden md:block mt-5 overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th class="p-3.5 rounded-l-xl">Assessment / Exam</th>
                    <th class="p-3.5">Subject</th>
                    <th class="p-3.5">Score</th>
                    <th class="p-3.5">Percentage</th>
                    <th class="p-3.5">Grade</th>
                    <th class="p-3.5">Remarks</th>
                    <th class="p-3.5 rounded-r-xl">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr *ngFor="let mark of profileData.examMarks" class="hover:bg-slate-50/60 transition-colors">
                    <td class="p-3.5 font-bold text-slate-900">{{ mark.exam_name }}</td>
                    <td class="p-3.5">{{ mark.subject_name }}</td>
                    <td class="p-3.5 font-mono font-bold text-indigo-600">{{ mark.marks_obtained }} / {{ mark.max_marks }}</td>
                    <td class="p-3.5 font-bold">{{ mark.percentage }}%</td>
                    <td class="p-3.5">
                      <span [ngClass]="getGradeBadgeClass(mark.grade)" class="px-2.5 py-0.5 rounded-full font-black text-[11px] border">
                        Grade {{ mark.grade }}
                      </span>
                    </td>
                    <td class="p-3.5 text-slate-500 italic max-w-xs truncate">{{ mark.remarks }}</td>
                    <td class="p-3.5 text-slate-400 whitespace-nowrap">{{ mark.date | date:'mediumDate' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Mobile Clay Cards View (md:hidden) -->
            <div *ngIf="profileData.examMarks.length > 0" class="block md:hidden mt-4 space-y-3">
              <div *ngFor="let mark of profileData.examMarks" class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/80 space-y-2.5 shadow-xs">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h4 class="text-xs font-bold text-slate-900">{{ mark.exam_name }}</h4>
                    <span class="text-[11px] font-semibold text-slate-500">{{ mark.subject_name }}</span>
                  </div>
                  <span [ngClass]="getGradeBadgeClass(mark.grade)" class="px-2.5 py-0.5 rounded-full font-black text-[10px] border">
                    Grade {{ mark.grade }}
                  </span>
                </div>

                <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span class="text-slate-500">Score: <strong class="text-indigo-600 font-mono">{{ mark.marks_obtained }} / {{ mark.max_marks }}</strong></span>
                  <span class="text-slate-500">Percentage: <strong class="text-slate-900">{{ mark.percentage }}%</strong></span>
                </div>

                <div *ngIf="mark.remarks" class="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-100">
                  {{ mark.remarks }}
                </div>
              </div>
            </div>

            <!-- Empty Exams State -->
            <div *ngIf="profileData.examMarks.length === 0" class="py-10 text-center text-slate-400">
              <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p class="text-xs font-bold text-slate-600">No examination scores logged yet</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Assessment records will appear here as tests are completed and grades are entered.</p>
            </div>
          </div>
        </div>

        <!-- Tab 4: Attendance History -->
        <div *ngIf="activeTab === 'attendance'" class="space-y-4">
          <div class="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <!-- Attendance Metric Clay Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
              <div class="bg-[#f8fafc] p-3 sm:p-3.5 rounded-2xl border border-slate-200/60 text-center shadow-2xs">
                <span class="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Total Days</span>
                <span class="text-base sm:text-lg font-black text-slate-800 mt-0.5">{{ profileData.attendanceStats.total_days }}</span>
              </div>
              <div class="bg-emerald-50/50 p-3 sm:p-3.5 rounded-2xl border border-emerald-100 text-center shadow-2xs">
                <span class="text-emerald-600 font-semibold uppercase tracking-wider block text-[10px]">Present</span>
                <span class="text-base sm:text-lg font-black text-emerald-700 mt-0.5">{{ profileData.attendanceStats.present_days }}</span>
              </div>
              <div class="bg-rose-50/50 p-3 sm:p-3.5 rounded-2xl border border-rose-100 text-center shadow-2xs">
                <span class="text-rose-600 font-semibold uppercase tracking-wider block text-[10px]">Absent</span>
                <span class="text-base sm:text-lg font-black text-rose-700 mt-0.5">{{ profileData.attendanceStats.absent_days }}</span>
              </div>
              <div class="bg-amber-50/50 p-3 sm:p-3.5 rounded-2xl border border-amber-100 text-center shadow-2xs">
                <span class="text-amber-600 font-semibold uppercase tracking-wider block text-[10px]">Late</span>
                <span class="text-base sm:text-lg font-black text-amber-700 mt-0.5">{{ profileData.attendanceStats.late_days }}</span>
              </div>
              <div class="bg-blue-50/50 p-3 sm:p-3.5 rounded-2xl border border-blue-100 text-center col-span-2 sm:col-span-1 shadow-2xs">
                <span class="text-blue-600 font-semibold uppercase tracking-wider block text-[10px]">Attendance %</span>
                <span class="text-base sm:text-lg font-black text-blue-700 mt-0.5">{{ profileData.attendanceStats.percentage }}%</span>
              </div>
            </div>

            <!-- Attendance Records Table (Desktop) -->
            <div *ngIf="profileData.attendanceRecords.length > 0" class="hidden md:block overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th class="p-3.5 rounded-l-xl">Date</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5">Session / Timing</th>
                    <th class="p-3.5 rounded-r-xl">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr *ngFor="let att of profileData.attendanceRecords" class="hover:bg-slate-50/60 transition-colors">
                    <td class="p-3.5 font-bold text-slate-900">{{ att.date | date:'mediumDate' }}</td>
                    <td class="p-3.5">
                      <span [ngClass]="getAttendanceBadgeClass(att.status)" class="px-2.5 py-0.5 rounded-full font-bold text-[11px] border uppercase">
                        {{ att.status }}
                      </span>
                    </td>
                    <td class="p-3.5 text-slate-500">{{ att.session || 'Full Day' }}</td>
                    <td class="p-3.5 text-slate-500 italic">{{ att.remarks || 'Standard roll-call record' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Attendance Mobile Cards (md:hidden) -->
            <div *ngIf="profileData.attendanceRecords.length > 0" class="block md:hidden space-y-2.5">
              <div *ngFor="let att of profileData.attendanceRecords" class="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 flex items-center justify-between gap-2 shadow-xs">
                <div>
                  <div class="text-xs font-bold text-slate-900">{{ att.date | date:'mediumDate' }}</div>
                  <div class="text-[10px] text-slate-500">{{ att.session || 'Full Day' }} • {{ att.remarks || 'Recorded' }}</div>
                </div>
                <span [ngClass]="getAttendanceBadgeClass(att.status)" class="px-2.5 py-0.5 rounded-full font-bold text-[10px] border uppercase shrink-0">
                  {{ att.status }}
                </span>
              </div>
            </div>

            <!-- Empty Attendance State -->
            <div *ngIf="profileData.attendanceRecords.length === 0" class="py-10 text-center text-slate-400">
              <p class="text-xs font-semibold">No attendance entries recorded yet for this session.</p>
            </div>
          </div>
        </div>

        <!-- Tab 5: Complaints & Discipline -->
        <div *ngIf="activeTab === 'complaints'" class="space-y-4">
          <div class="bg-white rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/80 shadow-xs">
            <div class="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900">Complaints & Disciplinary Logs</h3>
                <p class="text-[11px] sm:text-xs text-slate-500 mt-0.5">Concerns raised by parents, teachers, or administrators.</p>
              </div>
              <span class="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                {{ profileData.complaints.length }} Recorded
              </span>
            </div>

            <!-- Complaints List -->
            <div *ngIf="profileData.complaints.length > 0" class="mt-5 space-y-3">
              <div *ngFor="let comp of profileData.complaints" class="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-slate-200/80 space-y-3 shadow-xs">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span [ngClass]="comp.priority === 'HIGH' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'"
                          class="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider border">
                      {{ comp.priority || 'NORMAL' }} PRIORITY
                    </span>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900">{{ comp.title }}</h4>
                  </div>
                  <span class="text-[11px] sm:text-xs text-slate-400 font-semibold">{{ comp.created_at | date:'medium' }}</span>
                </div>

                <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">{{ comp.description || 'No detailed description provided.' }}</p>

                <div class="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Category: <strong class="text-slate-700">{{ comp.category || 'General' }}</strong></span>
                  <span>Status: <strong class="text-indigo-600 uppercase">{{ comp.status || 'PENDING' }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Clean Empty Discipline Record State -->
            <div *ngIf="profileData.complaints.length === 0" class="py-12 text-center text-slate-400">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-xs sm:text-sm font-bold text-emerald-800">Clean Discipline Record</p>
              <p class="text-[11px] text-slate-400 mt-0.5">No disciplinary notices or parent concerns have been logged for this student.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Status Modal (Mobile Bottom-Sheet / Desktop Centered) -->
      <div *ngIf="showStatusModal" class="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Update Student Status
            </h3>
            <button (click)="showStatusModal = false" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Select New Status</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button"
                        (click)="targetStatus = 'ACTIVE'"
                        [ngClass]="targetStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20 font-bold' : 'bg-[#f8fafc] text-slate-700 border-slate-200'"
                        class="p-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95">
                  <div class="text-xs sm:text-sm font-black">ACTIVE</div>
                  <div class="text-[10px] text-slate-400">Regular Attendance</div>
                </button>
                <button type="button"
                        (click)="targetStatus = 'INACTIVE'"
                        [ngClass]="targetStatus === 'INACTIVE' ? 'bg-rose-50 text-rose-700 border-rose-500 ring-2 ring-rose-500/20 font-bold' : 'bg-[#f8fafc] text-slate-700 border-slate-200'"
                        class="p-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95">
                  <div class="text-xs sm:text-sm font-black">INACTIVE</div>
                  <div class="text-[10px] text-slate-400">Temporary Inactive</div>
                </button>
                <button type="button"
                        (click)="targetStatus = 'SUSPENDED'"
                        [ngClass]="targetStatus === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 border-amber-500 ring-2 ring-amber-500/20 font-bold' : 'bg-[#f8fafc] text-slate-700 border-slate-200'"
                        class="p-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95">
                  <div class="text-xs sm:text-sm font-black">SUSPENDED</div>
                  <div class="text-[10px] text-slate-400">Disciplinary Hold</div>
                </button>
                <button type="button"
                        (click)="targetStatus = 'LEFTOUT'"
                        [ngClass]="targetStatus === 'LEFTOUT' ? 'bg-purple-50 text-purple-700 border-purple-500 ring-2 ring-purple-500/20 font-bold' : 'bg-[#f8fafc] text-slate-700 border-slate-200'"
                        class="p-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95">
                  <div class="text-xs sm:text-sm font-black">LEFT OUT / TC</div>
                  <div class="text-[10px] text-slate-400">Transferred / Left</div>
                </button>
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1.5">Reason / Administrative Note</label>
              <textarea [(ngModel)]="statusChangeReason"
                        rows="3"
                        placeholder="Enter reason for this status change (e.g. Parent request, disciplinary hold, fee resolution, transfer certificate issued, etc.)"
                        class="w-full p-3 rounded-xl border border-slate-200 bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-800 placeholder:text-slate-400 transition-all">
              </textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button (click)="showStatusModal = false" class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95">
              Cancel
            </button>
            <button (click)="submitStatusUpdate()" [disabled]="isSubmittingStatus" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-2 active:scale-95">
              <svg *ngIf="isSubmittingStatus" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Confirm Status Change</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-scaleUp {
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private imageUpload = inject(ImageUploadService);
  private toast = inject(ToastService);

  studentId: string = '';
  isLoading: boolean = true;
  isUploadingPhoto: boolean = false;
  errorMessage: string = '';
  profileData: any = null;

  activeTab: 'logs' | 'profile' | 'exams' | 'attendance' | 'complaints' = 'logs';
  activeLogFilter: string = 'ALL';

  showStatusModal: boolean = false;
  targetStatus: string = 'ACTIVE';
  statusChangeReason: string = '';
  isSubmittingStatus: boolean = false;

  tabs = [
    { id: 'logs' as const, label: 'Activity & Timeline Logs' },
    { id: 'profile' as const, label: 'Profile Details' },
    { id: 'exams' as const, label: 'Exams & Marks', count: 0 },
    { id: 'attendance' as const, label: 'Attendance Records' },
    { id: 'complaints' as const, label: 'Complaints & Discipline', count: 0 },
  ];

  logFilters = [
    { label: 'All History', value: 'ALL' },
    { label: 'Status & Enrollment', value: 'STATUS' },
    { label: 'Academic Exams', value: 'EXAMS' },
    { label: 'Complaints', value: 'COMPLAINTS' },
  ];

  get canManageStatus(): boolean {
    const role = this.auth.userRole();
    return ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'DIRECTOR', 'CORRESPONDENT', 'MANAGEMENT', 'ACCOUNTANT', 'SCHOOL_ADMIN'].includes(role);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.studentId = params['id'];
      if (this.studentId) {
        this.loadProfile();
      } else {
        this.errorMessage = 'Invalid Student Identifier';
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/academics'], { queryParams: { tab: 'students' } });
  }

  get navStudents(): any[] {
    return this.profileData?.navigation?.allStudents || [];
  }

  get currentNavIndex(): number {
    const list = this.navStudents;
    const currentId = this.profileData?.student?.id || this.studentId;
    const idx = list.findIndex((s: any) => s.id === currentId || s.studentId === currentId);
    return idx !== -1 ? idx : 0;
  }

  get hasPrevStudent(): boolean {
    return this.currentNavIndex > 0;
  }

  get hasNextStudent(): boolean {
    return this.currentNavIndex < this.navStudents.length - 1;
  }

  get prevStudentItem(): any {
    return this.hasPrevStudent ? this.navStudents[this.currentNavIndex - 1] : null;
  }

  get nextStudentItem(): any {
    return this.hasNextStudent ? this.navStudents[this.currentNavIndex + 1] : null;
  }

  goToPreviousStudent() {
    const prev = this.prevStudentItem;
    if (prev) {
      this.router.navigate(['/academics/student', prev.id || prev.studentId]);
    }
  }

  goToNextStudent() {
    const next = this.nextStudentItem;
    if (next) {
      this.router.navigate(['/academics/student', next.id || next.studentId]);
    }
  }

  async loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const data = await this.api.getStudentFullProfile(this.studentId);
      this.profileData = data;
      this.targetStatus = data.student.status || 'ACTIVE';

      // Update tab counts
      const examTab = this.tabs.find(t => t.id === 'exams');
      if (examTab) examTab.count = data.examMarks?.length || 0;

      const compTab = this.tabs.find(t => t.id === 'complaints');
      if (compTab) compTab.count = data.complaints?.length || 0;
    } catch (err: any) {
      console.error('Failed to load student profile:', err);
      this.errorMessage = err.message || 'Unable to retrieve student profile';
    } finally {
      this.isLoading = false;
    }
  }

  refreshData() {
    this.loadProfile();
  }

  get filteredActivityLogs(): ActivityLog[] {
    if (!this.profileData?.activityLogs) return [];
    const logs: ActivityLog[] = this.profileData.activityLogs;

    if (this.activeLogFilter === 'STATUS') {
      return logs.filter(l => l.type === 'STATUS_CHANGE' || l.type === 'ENROLLMENT');
    }
    if (this.activeLogFilter === 'EXAMS') {
      return logs.filter(l => l.type === 'ACADEMIC_EXAM');
    }
    if (this.activeLogFilter === 'COMPLAINTS') {
      return logs.filter(l => l.type === 'DISCIPLINARY_COMPLAINT');
    }
    return logs;
  }

  getInitials(name: string): string {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'SUSPENDED') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (s === 'LEFTOUT') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }

  getLogBadgeClass(color: string): string {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'blue':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }

  getTimelineDotClass(color: string): string {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500 border-emerald-200 text-white';
      case 'rose':
        return 'bg-rose-500 border-rose-200 text-white';
      case 'amber':
        return 'bg-amber-500 border-amber-200 text-white';
      case 'indigo':
        return 'bg-indigo-500 border-indigo-200 text-white';
      case 'purple':
        return 'bg-purple-500 border-purple-200 text-white';
      case 'blue':
      default:
        return 'bg-blue-500 border-blue-200 text-white';
    }
  }

  getGradeBadgeClass(grade: string): string {
    const g = (grade || 'B').toUpperCase();
    if (g.startsWith('A')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (g.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (g.startsWith('C')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  }

  getAttendanceBadgeClass(status: string): string {
    const s = (status || 'PRESENT').toUpperCase();
    if (s === 'PRESENT') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'ABSENT') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (s === 'LATE') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }

  openStatusModal() {
    this.targetStatus = this.profileData?.student?.status || 'ACTIVE';
    this.statusChangeReason = '';
    this.showStatusModal = true;
  }

  async submitStatusUpdate() {
    if (!this.studentId) return;
    this.isSubmittingStatus = true;
    try {
      await this.api.updateStudentStatus(this.profileData.student.id, this.targetStatus, this.statusChangeReason);
      this.showStatusModal = false;
      await this.loadProfile();
    } catch (err: any) {
      alert('Error updating status: ' + (err.message || 'Unknown error'));
    } finally {
      this.isSubmittingStatus = false;
    }
  }

  async onStudentPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploadingPhoto = true;

    try {
      const photoUrl = await this.imageUpload.processAndUploadImage(file, 'students', 600, 600, 0.85);
      if (this.profileData?.student) {
        this.profileData.student.photo_url = photoUrl;
        this.profileData.student.photoUrl = photoUrl;
      }
      // Save directly to backend
      const targetId = this.profileData?.student?.id || this.studentId;
      await this.api.put('academics/students/' + targetId, { photoUrl }).toPromise();
      this.toast.success('Student profile picture updated successfully.');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to update student photo.');
    } finally {
      this.isUploadingPhoto = false;
      input.value = '';
    }
  }
}
