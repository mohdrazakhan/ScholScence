import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { ComplaintItem } from '../../core/models';

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Top Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Grievance & Support Desk</h1>
            <span *ngIf="isParent()" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Parent Portal
            </span>
            <span *ngIf="isTeacher() && !isAdmin()" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {{ isClassTeacher() ? 'Class Teacher Workspace' : 'Subject Teacher Desk' }}
            </span>
            <span *ngIf="isAdmin()" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Administration Command
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ isParent() 
                ? 'Track your inquiries, submit grievances for your children, and communicate directly with school faculty.' 
                : 'Review, delegate to subject teachers, and resolve parent tickets and academic queries.' }}
          </p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <button *ngIf="!isParent()" (click)="exportTicketsCsv()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Excel</span>
          </button>
          <button *ngIf="!isParent()" (click)="printTicketRegistry()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Registry</span>
          </button>
          <button (click)="openNewTicketModal()"
                  class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.99]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Raise Ticket</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {{ isParent() ? 'My Tickets' : 'Total Grievances' }}
          </div>
          <div class="text-2xl font-black text-slate-900 mt-1.5">{{ complaints.length }}</div>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <div class="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Pending / Open</div>
          <div class="text-2xl font-black text-amber-600 mt-1.5">{{ countStatus('OPEN') + countStatus('IN_PROGRESS') }}</div>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <div class="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Resolved</div>
          <div class="text-2xl font-black text-emerald-600 mt-1.5">{{ countStatus('RESOLVED') }}</div>
        </div>
        <div class="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
          <div class="text-[10px] uppercase font-bold text-slate-700 tracking-wider">Resolution Rate</div>
          <div class="text-2xl font-black text-slate-900 mt-1.5">{{ resolutionRate }}%</div>
        </div>
      </div>

      <!-- Role-Specific Tabs / Scopes -->
      <!-- 1. Teacher View Scopes: Class Inquiries vs Assigned/Subject Inquiries -->
      <div *ngIf="isTeacher() && !isAdmin()" class="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button *ngIf="isClassTeacher()" (click)="setTeacherScope('CLASS_TEACHER')"
                [class.bg-slate-900]="teacherScope === 'CLASS_TEACHER'"
                [class.text-white]="teacherScope === 'CLASS_TEACHER'"
                [class.bg-white]="teacherScope !== 'CLASS_TEACHER'"
                [class.text-slate-700]="teacherScope !== 'CLASS_TEACHER'"
                class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer">
          <span>🎓 My Class Inquiries</span>
          <span [class.bg-slate-700]="teacherScope === 'CLASS_TEACHER'"
                [class.text-slate-200]="teacherScope === 'CLASS_TEACHER'"
                [class.bg-slate-100]="teacherScope !== 'CLASS_TEACHER'"
                [class.text-slate-600]="teacherScope !== 'CLASS_TEACHER'"
                class="px-2 py-0.5 rounded-full text-[10px]">
            {{ classTeacherTicketsCount }}
          </span>
        </button>

        <button (click)="setTeacherScope('ASSIGNED')"
                [class.bg-slate-900]="teacherScope === 'ASSIGNED'"
                [class.text-white]="teacherScope === 'ASSIGNED'"
                [class.bg-white]="teacherScope !== 'ASSIGNED'"
                [class.text-slate-700]="teacherScope !== 'ASSIGNED'"
                class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer">
          <span>👤 Assigned Inquiries (Subject Desk)</span>
          <span [class.bg-slate-700]="teacherScope === 'ASSIGNED'"
                [class.text-slate-200]="teacherScope === 'ASSIGNED'"
                [class.bg-slate-100]="teacherScope !== 'ASSIGNED'"
                [class.text-slate-600]="teacherScope !== 'ASSIGNED'"
                class="px-2 py-0.5 rounded-full text-[10px]">
            {{ assignedTicketsCount }}
          </span>
        </button>

        <button *ngIf="isClassTeacher()" (click)="setTeacherScope('ALL')"
                [class.bg-slate-900]="teacherScope === 'ALL'"
                [class.text-white]="teacherScope === 'ALL'"
                [class.bg-white]="teacherScope !== 'ALL'"
                [class.text-slate-700]="teacherScope !== 'ALL'"
                class="px-4 py-2 rounded-2xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer">
          <span>All Accessible</span>
          <span [class.bg-slate-700]="teacherScope === 'ALL'"
                [class.text-slate-200]="teacherScope === 'ALL'"
                [class.bg-slate-100]="teacherScope !== 'ALL'"
                [class.text-slate-600]="teacherScope !== 'ALL'"
                class="px-2 py-0.5 rounded-full text-[10px]">
            {{ allAccessibleTicketsCount }}
          </span>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center flex-wrap gap-2.5">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search ticket #, parent, student, subject..."
                 class="px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] w-full sm:w-64" />

          <!-- Class-wise filter for Principal & Admin -->
          <div *ngIf="isAdmin()" class="flex items-center gap-1.5">
            <select [(ngModel)]="selectedSectionId" (change)="loadComplaints()"
                    class="px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 shadow-xs focus:outline-none cursor-pointer">
              <option value="ALL">🏫 All Classes & Sections</option>
              <option *ngFor="let s of sectionsList" [value]="s.id">
                {{ s.class?.name || 'Class' }} - {{ s.name }}
              </option>
            </select>
          </div>

          <select [(ngModel)]="statusFilter"
                  class="px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none cursor-pointer">
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="CLOSED">Closed Only</option>
          </select>

          <select [(ngModel)]="categoryFilter"
                  class="px-3.5 py-2 bg-white border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none cursor-pointer">
            <option value="ALL">All Categories</option>
            <option value="ACADEMIC">Academic / Syllabus</option>
            <option value="TRANSPORT">Transport & Bus</option>
            <option value="FEE_ACCOUNTS">Fee / Billing</option>
            <option value="FACILITY">Campus Facility</option>
            <option value="DISCIPLINE">Discipline & Safety</option>
            <option value="OTHER">Other / General</option>
          </select>
        </div>

        <span class="text-xs text-slate-500 font-medium">
          Showing <strong class="text-slate-900">{{ filteredComplaints.length }}</strong> tickets
        </span>
      </div>

      <!-- Tickets & Chat Thread Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Ticket List Sidebar -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-slate-100 bg-[#f8fafc] flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {{ isParent() ? 'My Inquiries' : 'Ticket Registry' }}
            </h3>
            <span class="text-[10px] font-bold text-slate-400 font-mono">{{ filteredComplaints.length }} records</span>
          </div>

          <div class="divide-y divide-slate-100 overflow-y-auto max-h-[640px]">
            <div *ngFor="let t of filteredComplaints" (click)="selectTicket(t)"
                 [class.bg-[#f8fafc]]="selectedTicket?.id === t.id"
                 [class.border-l-4]="selectedTicket?.id === t.id"
                 [class.border-l-slate-900]="selectedTicket?.id === t.id"
                 class="p-4 hover:bg-slate-50 cursor-pointer transition-colors space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold font-mono text-slate-900">{{ t.ticket_number }}</span>
                <div class="flex items-center gap-1.5">
                  <span *ngIf="t.priority === 'HIGH' || t.priority === 'URGENT'" 
                        class="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                    {{ t.priority }}
                  </span>
                  <span [class.bg-amber-50]="t.status === 'OPEN'"
                        [class.text-amber-700]="t.status === 'OPEN'"
                        [class.border-amber-200]="t.status === 'OPEN'"
                        [class.bg-blue-50]="t.status === 'IN_PROGRESS'"
                        [class.text-blue-700]="t.status === 'IN_PROGRESS'"
                        [class.border-blue-200]="t.status === 'IN_PROGRESS'"
                        [class.bg-emerald-50]="t.status === 'RESOLVED'"
                        [class.text-emerald-700]="t.status === 'RESOLVED'"
                        [class.border-emerald-200]="t.status === 'RESOLVED'"
                        class="px-2 py-0.5 rounded-xl text-[10px] font-bold border shadow-xs">
                    {{ t.status }}
                  </span>
                </div>
              </div>

              <h4 class="text-xs font-bold text-slate-800 line-clamp-1">{{ t.subject }}</h4>

              <!-- Student & Parent Information -->
              <div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl space-y-0.5">
                <div *ngIf="t.student" class="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Student: {{ t.student.first_name }} {{ t.student.last_name || '' }}</span>
                  <span *ngIf="getStudentClassSection(t)" class="text-[10px] text-slate-500 font-mono">
                    {{ getStudentClassSection(t) }}
                  </span>
                </div>
                <div *ngIf="!isParent() && t.guardian" class="text-[10px] text-slate-500">
                  Parent: <strong class="text-slate-700">{{ t.guardian.first_name }} {{ t.guardian.last_name || '' }}</strong>
                </div>
                <div *ngIf="t.users" class="text-[10px] text-indigo-600 font-medium pt-0.5 flex items-center gap-1">
                  <span>👨‍🏫 Assigned: {{ t.users.first_name }} {{ t.users.last_name || '' }}</span>
                </div>
              </div>

              <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span class="capitalize">{{ t.category?.toLowerCase() }}</span>
                <span>{{ t.created_at | date:'mediumDate' }}</span>
              </div>
            </div>

            <div *ngIf="filteredComplaints.length === 0" class="p-8 text-center text-xs text-slate-400">
              No matching grievance tickets found.
            </div>
          </div>
        </div>

        <!-- Ticket Discussion Thread -->
        <div class="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col h-[640px] overflow-hidden">
          <ng-container *ngIf="selectedTicket; else noSelected">
            <!-- Ticket Header Details -->
            <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8fafc]">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-slate-900">{{ selectedTicket.ticket_number }}</span>
                  <span class="text-xs font-bold text-slate-900">• {{ selectedTicket.subject }}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Category: <strong class="text-slate-700">{{ selectedTicket.category }}</strong></span>
                  <span>Priority: <strong class="text-amber-600">{{ selectedTicket.priority || 'MEDIUM' }}</strong></span>
                  <span *ngIf="selectedTicket.student">
                    Student: <strong class="text-slate-800">{{ selectedTicket.student.first_name }} {{ selectedTicket.student.last_name || '' }}</strong>
                    ({{ getStudentClassSection(selectedTicket) || 'Enrolled' }})
                  </span>
                  <span *ngIf="selectedTicket.guardian">
                    Parent: <strong class="text-slate-800">{{ selectedTicket.guardian.first_name }} {{ selectedTicket.guardian.last_name || '' }}</strong>
                  </span>
                </div>
                <div *ngIf="selectedTicket.users" class="text-[11px] text-indigo-700 font-medium mt-1">
                  👨‍🏫 Assigned Staff: <strong>{{ selectedTicket.users.first_name }} {{ selectedTicket.users.last_name || '' }}</strong> ({{ selectedTicket.users.email }})
                </div>
              </div>

              <!-- Action Controls for Faculty / Admin -->
              <div class="flex items-center gap-2">
                <!-- Delegate / Involve Subject Teacher Button -->
                <button *ngIf="!isParent()" (click)="openAssignModal()"
                        class="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Involve Subject Teacher</span>
                </button>

                <!-- Status Transition -->
                <button *ngIf="!isParent()" (click)="toggleStatus()"
                        [ngClass]="selectedTicket.status !== 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'"
                        class="px-4 py-2 text-white text-xs font-bold rounded-2xl transition-all shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] cursor-pointer">
                  Mark as {{ selectedTicket.status === 'RESOLVED' ? 'Open' : 'Resolved' }}
                </button>
              </div>
            </div>

            <!-- Messages Thread -->
            <div class="flex-1 p-6 overflow-y-auto space-y-4 bg-[#fcfdfe]">
              <div *ngFor="let msg of selectedTicket.messages"
                   class="flex flex-col max-w-lg p-4 rounded-3xl text-xs transition-all"
                   [ngClass]="msg.is_internal_note 
                      ? 'bg-amber-50 border border-amber-200 text-amber-950 ml-auto' 
                      : (isMyMessage(msg) 
                          ? 'bg-slate-900 text-white ml-auto shadow-[4px_4px_12px_#cbd5e1,-2px_-2px_6px_#ffffff]' 
                          : 'bg-white border border-slate-200/90 text-slate-800 mr-auto shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff]')">
                <div class="flex items-center justify-between gap-4 mb-1.5">
                  <span class="font-bold flex items-center gap-1.5" [ngClass]="isMyMessage(msg) && !msg.is_internal_note ? 'text-slate-200' : 'text-slate-900'">
                    <span>{{ msg.sender?.first_name }} {{ msg.sender?.last_name || '' }}</span>
                    <span *ngIf="isMyMessage(msg) && !msg.is_internal_note" class="text-[10px] font-medium text-slate-400">(You)</span>
                    <span *ngIf="msg.is_internal_note" class="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded ml-1">
                      Staff Note
                    </span>
                  </span>
                  <span class="text-[10px] font-mono" [ngClass]="isMyMessage(msg) && !msg.is_internal_note ? 'text-slate-400' : 'text-slate-400'">
                    {{ msg.created_at | date:'shortTime' }}
                  </span>
                </div>
                <p [ngClass]="isMyMessage(msg) && !msg.is_internal_note ? 'text-slate-100' : 'text-slate-700'" class="leading-relaxed whitespace-pre-wrap">
                  {{ msg.message }}
                </p>
              </div>
            </div>

            <!-- Reply Box -->
            <div class="p-4 border-t border-slate-100 bg-[#f8fafc] flex flex-col gap-2 relative">
              <!-- Mention Autocomplete Popover (Reply) -->
              <div *ngIf="showMentionSuggestions && mentionTarget === 'reply'"
                   class="absolute bottom-full left-4 mb-2 w-88 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.12),-4px_-4px_12px_#ffffff] p-2 z-30 animate-fadeIn overflow-hidden">
                <div class="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Mention Participants</span>
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
                    {{ mentionSuggestions.length }} available
                  </span>
                </div>
                <div class="max-h-52 overflow-y-auto divide-y divide-slate-50 mt-1">
                  <button *ngFor="let p of mentionSuggestions; let idx = index"
                          (click)="selectMention(p, 'reply')"
                          (mouseenter)="mentionSelectedIndex = idx"
                          [class.bg-slate-100]="mentionSelectedIndex === idx"
                          type="button"
                          class="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer hover:bg-slate-100">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0 border"
                         [ngClass]="p.avatarColor">
                      {{ p.fullName.charAt(0) || 'U' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-1.5">
                        <p class="text-xs font-bold text-slate-900 truncate">{{ p.fullName }}</p>
                        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex-shrink-0"
                              [ngClass]="p.badgeClass">
                          {{ p.role }}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate mt-0.5">
                        {{ p.subtext }}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <input type="text" [(ngModel)]="replyText" 
                       (keyup)="onInputKeyUp($event, 'reply')"
                       (keydown)="onInputKeyDown($event, 'reply')"
                       (keyup.enter)="!showMentionSuggestions && sendReply()" 
                       [placeholder]="isParent() ? 'Type message (type @ to tag your child)...' : 'Type an official response to parent...'"
                       class="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
                <button (click)="sendReply()" [disabled]="!replyText || sendingReply"
                        class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] disabled:opacity-50 cursor-pointer">
                  <span *ngIf="!sendingReply">Send</span>
                  <span *ngIf="sendingReply">Sending...</span>
                </button>
              </div>
              <div *ngIf="!isParent()" class="flex items-center gap-2 pl-1">
                <label class="text-[11px] text-slate-500 flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="isInternalNote" class="rounded text-slate-800" />
                  <span>Send as internal staff note (hidden from parent)</span>
                </label>
              </div>
            </div>
          </ng-container>

          <ng-template #noSelected>
            <div class="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <svg class="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p class="text-xs font-semibold">Select a ticket from the left to review details and discussion.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Modal: Raise New Grievance Ticket -->
      <div *ngIf="showNewTicketModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Raise Grievance Ticket</h3>
              <p class="text-xs text-slate-500 mt-0.5">Submit an official inquiry to the school administration and teachers.</p>
            </div>
            <button (click)="showNewTicketModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3.5">
            <!-- Child Selector (For Parents) -->
            <div *ngIf="isParent() && myChildren.length > 0">
              <label class="block text-xs font-bold text-slate-700 mb-1">Select Child / Student *</label>
              <select [(ngModel)]="newTicket.studentId"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option *ngFor="let child of myChildren" [value]="child.studentId">
                  {{ child.fullName }} ({{ child.className }} - {{ child.sectionName }}) - Adm: {{ child.admissionNumber }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ticket Category</label>
              <select [(ngModel)]="newTicket.category"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option value="ACADEMIC">Academic / Subject Curriculum</option>
                <option value="TRANSPORT">School Bus / Transport Route</option>
                <option value="FEE_ACCOUNTS">Fee & Accounts Billing</option>
                <option value="FACILITY">Campus Facility & Infrastructure</option>
                <option value="DISCIPLINE">Student Discipline & Safety</option>
                <option value="OTHER">Other / General Inquiry</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select [(ngModel)]="newTicket.priority"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High / Urgent</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Subject Title *</label>
              <input type="text" [(ngModel)]="newTicket.subject" placeholder="e.g. Science project clarification or bus delay"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div class="relative">
              <label class="block text-xs font-bold text-slate-700 mb-1">Message Description * <span class="font-normal text-slate-400">(type &#64; to mention)</span></label>
              
              <!-- Mention Autocomplete Popover (Modal) -->
              <div *ngIf="showMentionSuggestions && mentionTarget === 'modal'"
                   class="absolute bottom-full left-0 mb-2 w-88 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[6px_6px_20px_rgba(0,0,0,0.12),-4px_-4px_12px_#ffffff] p-2 z-30 animate-fadeIn overflow-hidden">
                <div class="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Mention / Tag</span>
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
                    {{ mentionSuggestions.length }} available
                  </span>
                </div>
                <div class="max-h-48 overflow-y-auto divide-y divide-slate-50 mt-1">
                  <button *ngFor="let p of mentionSuggestions; let idx = index"
                          (click)="selectMention(p, 'modal')"
                          (mouseenter)="mentionSelectedIndex = idx"
                          [class.bg-slate-100]="mentionSelectedIndex === idx"
                          type="button"
                          class="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer hover:bg-slate-100">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0 border"
                         [ngClass]="p.avatarColor">
                      {{ p.fullName.charAt(0) || 'U' }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-1.5">
                        <p class="text-xs font-bold text-slate-900 truncate">{{ p.fullName }}</p>
                        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border flex-shrink-0"
                              [ngClass]="p.badgeClass">
                          {{ p.role }}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-500 truncate mt-0.5">
                        {{ p.subtext }}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <textarea [(ngModel)]="newTicket.message" rows="4" 
                        (keyup)="onInputKeyUp($event, 'modal')"
                        (keydown)="onInputKeyDown($event, 'modal')"
                        placeholder="Describe your question or issue in detail (e.g. Inquiring about @...)..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]"></textarea>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showNewTicketModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="createTicket()" [disabled]="creatingTicket || !newTicket.subject || !newTicket.message"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!creatingTicket">Submit Ticket</span>
              <span *ngIf="creatingTicket">Submitting...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Delegate / Involve Subject Teacher -->
      <div *ngIf="showAssignModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-black text-slate-900 tracking-tight">Involve Subject Teacher</h3>
              <p class="text-xs text-slate-500 mt-0.5">Delegate ticket to a specific faculty member</p>
            </div>
            <button (click)="showAssignModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Select Faculty / Subject Teacher *</label>
              <select [(ngModel)]="selectedFacultyId"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option value="">-- Choose Teacher --</option>
                <option *ngFor="let f of facultyList" [value]="f.id">
                  {{ f.name }} ({{ f.role }}) - {{ f.email }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Optional Delegation Note</label>
              <textarea [(ngModel)]="assignmentNote" rows="3" placeholder="e.g. Please clarify mathematics term syllabus for Class 8-A..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]"></textarea>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showAssignModal = false" class="px-4 py-2 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="submitAssignFaculty()" [disabled]="assigningFaculty || !selectedFacultyId"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!assigningFaculty">Assign Faculty</span>
              <span *ngIf="assigningFaculty">Assigning...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ComplaintsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exporter = inject(ExportService);

  isParent = computed(() => this.auth.isParent());
  isTeacher = computed(() => this.auth.isTeacher() || this.auth.isClassTeacher());
  isClassTeacher = computed(() => this.auth.isClassTeacher());
  isAdmin = computed(() => this.auth.isAdmin());

  complaints: ComplaintItem[] = [];
  selectedTicket: ComplaintItem | null = null;
  replyText = '';
  isInternalNote = false;
  sendingReply = false;

  // Search & Filters
  searchQuery = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';

  // Admin / Principal Class Filter
  sectionsList: any[] = [];
  selectedSectionId = 'ALL';

  // Teacher Workspace Scope Tabs
  teacherScope: 'CLASS_TEACHER' | 'ASSIGNED' | 'ALL' = 'CLASS_TEACHER';

  // Parent Children for Ticket Creation
  myChildren: any[] = [];

  // Mentions Autocomplete State
  showMentionSuggestions = false;
  mentionTarget: 'reply' | 'modal' | null = null;
  mentionSuggestions: any[] = [];
  mentionSelectedIndex = 0;
  mentionStartIndex = -1;

  // Modal: Raise Ticket
  showNewTicketModal = false;
  creatingTicket = false;
  newTicket = {
    studentId: '',
    category: 'ACADEMIC',
    priority: 'MEDIUM',
    subject: '',
    message: '',
  };

  // Modal: Delegate / Assign Faculty
  showAssignModal = false;
  facultyList: any[] = [];
  selectedFacultyId = '';
  assignmentNote = '';
  assigningFaculty = false;

  ngOnInit() {
    if (this.isTeacher() && !this.isClassTeacher()) {
      this.teacherScope = 'ASSIGNED';
    }

    if (this.isAdmin()) {
      this.loadSections();
    }

    if (this.isParent()) {
      this.loadMyChildren();
    }

    this.loadComplaints();
  }

  loadSections() {
    this.api.get<any[]>('academics/sections').subscribe({
      next: (res) => {
        this.sectionsList = res;
      },
    });
  }

  loadMyChildren() {
    this.api.get<any[]>('complaints/my-children').subscribe({
      next: (res) => {
        this.myChildren = res;
        if (res.length > 0 && !this.newTicket.studentId) {
          this.newTicket.studentId = res[0].studentId;
        }
      },
    });
  }

  loadComplaints() {
    let params: any = {};

    if (this.isTeacher() && !this.isAdmin()) {
      params.scope = 'ALL';
    }

    if (this.isAdmin() && this.selectedSectionId !== 'ALL') {
      params.sectionId = this.selectedSectionId;
    }

    this.api.get<ComplaintItem[]>('complaints', params).subscribe({
      next: (res) => {
        this.complaints = res;
        this.updateSelectedTicket();
      },
      error: () => this.toast.error('Could not load grievance tickets'),
    });
  }

  setTeacherScope(scope: 'CLASS_TEACHER' | 'ASSIGNED' | 'ALL') {
    this.teacherScope = scope;
    this.updateSelectedTicket();
  }

  updateSelectedTicket() {
    const list = this.filteredComplaints;
    if (list.length > 0) {
      if (!this.selectedTicket || !list.find((t) => t.id === this.selectedTicket?.id)) {
        this.selectTicket(list[0]);
      } else {
        const found = list.find((t) => t.id === this.selectedTicket?.id);
        if (found) this.selectedTicket = found;
      }
    } else {
      this.selectedTicket = null;
    }
  }

  get classTeacherTicketsCount(): number {
    return this.complaints.filter((c) => c.isClassTeacherTicket).length;
  }

  get assignedTicketsCount(): number {
    return this.complaints.filter((c) => c.isAssignedToMe).length;
  }

  get allAccessibleTicketsCount(): number {
    return this.complaints.length;
  }

  get filteredComplaints(): ComplaintItem[] {
    return this.complaints.filter((c) => {
      // 1. Teacher scope filtering
      if (this.isTeacher() && !this.isAdmin()) {
        if (this.teacherScope === 'CLASS_TEACHER' && !c.isClassTeacherTicket) return false;
        if (this.teacherScope === 'ASSIGNED' && !c.isAssignedToMe) return false;
      }

      // 2. Status & Category filtering
      if (this.statusFilter !== 'ALL' && c.status !== this.statusFilter) return false;
      if (this.categoryFilter !== 'ALL' && c.category !== this.categoryFilter) return false;

      // 3. Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const num = (c.ticket_number || '').toLowerCase();
        const sub = (c.subject || '').toLowerCase();
        const parent = `${c.guardian?.first_name || ''} ${c.guardian?.last_name || ''}`.toLowerCase();
        const student = `${c.student?.first_name || ''} ${c.student?.last_name || ''}`.toLowerCase();
        if (!num.includes(q) && !sub.includes(q) && !parent.includes(q) && !student.includes(q)) return false;
      }
      return true;
    });
  }

  getStudentClassSection(t: ComplaintItem): string {
    const enr = t.student?.student_enrollments?.[0];
    if (enr?.section) {
      return `${enr.section.class?.name || 'Class'} - ${enr.section.name}`;
    }
    return '';
  }

  countStatus(status: string): number {
    return this.filteredComplaints.filter((c) => c.status === status).length;
  }

  get resolutionRate(): string {
    if (!this.filteredComplaints.length) return '100.0';
    const res = this.countStatus('RESOLVED');
    return ((res / this.filteredComplaints.length) * 100).toFixed(1);
  }

  selectTicket(t: ComplaintItem) {
    this.selectedTicket = t;
  }

  isMyMessage(msg: any): boolean {
    const currentUserId = this.auth.currentUser()?.id;
    if (!currentUserId || !msg) return false;
    return msg.sender?.id === currentUserId || msg.sender_id === currentUserId;
  }

  // @ Mention Autocomplete Event Handlers
  onInputKeyUp(event: KeyboardEvent, target: 'reply' | 'modal') {
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(event.key)) {
      return;
    }
    this.checkMention(event.target as HTMLInputElement | HTMLTextAreaElement, target);
  }

  onInputKeyDown(event: KeyboardEvent, target: 'reply' | 'modal') {
    if (!this.showMentionSuggestions || this.mentionSuggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionSelectedIndex = (this.mentionSelectedIndex + 1) % this.mentionSuggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionSelectedIndex =
        (this.mentionSelectedIndex - 1 + this.mentionSuggestions.length) % this.mentionSuggestions.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      const selected = this.mentionSuggestions[this.mentionSelectedIndex];
      if (selected) {
        this.selectMention(selected, target);
      }
    } else if (event.key === 'Escape') {
      this.closeMention();
    }
  }

  getMentionParticipants(target: 'reply' | 'modal'): any[] {
    const currentUserId = this.auth.currentUser()?.id;
    const currentUserName = `${this.auth.currentUser()?.firstName || ''} ${this.auth.currentUser()?.lastName || ''}`
      .trim()
      .toLowerCase();

    const participants: any[] = [];
    const seen = new Set<string>();

    const addCandidate = (c: {
      fullName: string;
      role: string;
      badgeClass: string;
      subtext: string;
      userId?: string;
      avatarColor: string;
    }) => {
      const trimmed = (c.fullName || '').trim();
      if (!trimmed) return;
      if (c.userId && currentUserId && c.userId === currentUserId) return;
      if (currentUserName && trimmed.toLowerCase() === currentUserName) return;
      if (seen.has(trimmed.toLowerCase())) return;

      seen.add(trimmed.toLowerCase());
      participants.push(c);
    };

    if (target === 'reply' && this.selectedTicket) {
      const t = this.selectedTicket;

      // 1. Linked Student
      if (t.student) {
        addCandidate({
          fullName: `${t.student.first_name} ${t.student.last_name || ''}`.trim(),
          role: 'Student',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          subtext: `${this.getStudentClassSection(t)} • Adm: ${t.student.admission_number || 'N/A'}`,
          avatarColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        });
      }

      // 2. Parent / Guardian (if not self)
      if (t.guardian) {
        addCandidate({
          fullName: `${t.guardian.first_name} ${t.guardian.last_name || ''}`.trim(),
          role: 'Parent',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
          subtext: `Parent / Guardian`,
          userId: t.guardian.user_id,
          avatarColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
        });
      }

      // 3. Assigned Faculty / Teacher (if not self)
      if (t.users) {
        addCandidate({
          fullName: `${t.users.first_name} ${t.users.last_name || ''}`.trim(),
          role: 'Assigned Staff',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
          subtext: `Assigned Faculty / Staff`,
          userId: t.users.id,
          avatarColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
        });
      }

      // 4. All teachers/faculty & participants who sent messages in this chat thread (if not self)
      if (t.messages && t.messages.length > 0) {
        for (const msg of t.messages) {
          if (msg.sender) {
            addCandidate({
              fullName: `${msg.sender.first_name} ${msg.sender.last_name || ''}`.trim(),
              role: 'Staff / Participant',
              badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
              subtext: `Chat Participant`,
              userId: msg.sender.id,
              avatarColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
            });
          }
        }
      }
    }

    // 5. For Parents: include their registered children (e.g. Shivam Dutta, Garima Dutta)
    if (this.isParent() && this.myChildren && this.myChildren.length > 0) {
      for (const child of this.myChildren) {
        const childName = child.fullName || `${child.firstName} ${child.lastName || ''}`.trim();
        addCandidate({
          fullName: childName,
          role: 'Child',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/60',
          subtext: `${child.className || ''} - ${child.sectionName || ''} • Adm: ${child.admissionNumber || 'N/A'}`,
          avatarColor: 'bg-teal-50 text-teal-700 border-teal-200/60',
        });
      }
    }

    return participants;
  }

  checkMention(inputEl: HTMLInputElement | HTMLTextAreaElement, target: 'reply' | 'modal') {
    const text = target === 'reply' ? this.replyText : this.newTicket.message;
    const cursor = inputEl?.selectionStart ?? text.length;

    // Find if there is an '@' before cursor
    const textBeforeCursor = text.slice(0, cursor);
    const match = /@([a-zA-Z0-9_\s]*)$/.exec(textBeforeCursor);

    if (match) {
      const query = match[1].toLowerCase().trim();
      this.mentionStartIndex = match.index; // position of '@'
      this.mentionTarget = target;

      const pool = this.getMentionParticipants(target);

      if (!query) {
        this.mentionSuggestions = pool;
      } else {
        this.mentionSuggestions = pool.filter(
          (c) =>
            (c.fullName && c.fullName.toLowerCase().includes(query)) ||
            (c.role && c.role.toLowerCase().includes(query)) ||
            (c.subtext && c.subtext.toLowerCase().includes(query)),
        );
      }

      this.showMentionSuggestions = this.mentionSuggestions.length > 0;
      this.mentionSelectedIndex = 0;
    } else {
      this.closeMention();
    }
  }

  selectMention(child: any, target: 'reply' | 'modal') {
    const text = target === 'reply' ? this.replyText : this.newTicket.message;
    const mentionName = `@${child.fullName} `;

    if (this.mentionStartIndex >= 0) {
      const beforeMention = text.slice(0, this.mentionStartIndex);
      const afterMentionToken = text.slice(this.mentionStartIndex).replace(/^@[a-zA-Z0-9_\s]*/, '');
      const newText =
        beforeMention + mentionName + (afterMentionToken.startsWith(' ') ? afterMentionToken.slice(1) : afterMentionToken);

      if (target === 'reply') {
        this.replyText = newText;
      } else {
        this.newTicket.message = newText;
      }
    }

    this.closeMention();
  }

  closeMention() {
    this.showMentionSuggestions = false;
    this.mentionSuggestions = [];
    this.mentionTarget = null;
    this.mentionStartIndex = -1;
    this.mentionSelectedIndex = 0;
  }

  sendReply() {
    if (!this.replyText.trim() || !this.selectedTicket) return;
    this.sendingReply = true;

    this.api
      .post(`complaints/${this.selectedTicket.id}/messages`, {
        message: this.replyText.trim(),
        isInternalNote: this.isInternalNote,
      })
      .subscribe({
        next: (newMsg: any) => {
          this.sendingReply = false;
          this.selectedTicket?.messages?.push(newMsg);
          this.replyText = '';
          this.isInternalNote = false;
          this.toast.success('Response sent successfully');
        },
        error: () => {
          this.sendingReply = false;
          this.toast.error('Failed to send message');
        },
      });
  }

  toggleStatus() {
    if (!this.selectedTicket) return;
    const newStatus = this.selectedTicket.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED';

    this.api.patch(`complaints/${this.selectedTicket.id}/status`, { status: newStatus }).subscribe({
      next: (updated: any) => {
        if (this.selectedTicket) {
          this.selectedTicket.status = newStatus;
        }
        this.loadComplaints();
        this.toast.success(`Ticket ${this.selectedTicket?.ticket_number} marked as ${newStatus}`);
      },
      error: () => this.toast.error('Failed to update ticket status'),
    });
  }

  openNewTicketModal() {
    if (this.isParent() && this.myChildren.length === 0) {
      this.loadMyChildren();
    }
    this.showNewTicketModal = true;
  }

  createTicket() {
    if (!this.newTicket.subject.trim() || !this.newTicket.message.trim()) return;
    this.creatingTicket = true;

    this.api.post('complaints', this.newTicket).subscribe({
      next: (res: any) => {
        this.creatingTicket = false;
        this.showNewTicketModal = false;
        this.newTicket = {
          studentId: this.myChildren[0]?.studentId || '',
          category: 'ACADEMIC',
          priority: 'MEDIUM',
          subject: '',
          message: '',
        };
        this.toast.success(`Created ticket ${res.ticket_number}`);
        this.loadComplaints();
      },
      error: () => {
        this.creatingTicket = false;
        this.toast.error('Failed to submit ticket');
      },
    });
  }

  openAssignModal() {
    if (!this.selectedTicket) return;
    this.selectedFacultyId = this.selectedTicket.assigned_to || '';
    this.assignmentNote = '';
    this.showAssignModal = true;

    if (this.facultyList.length === 0) {
      this.api.get<any[]>('complaints/faculty').subscribe({
        next: (res) => {
          this.facultyList = res;
        },
      });
    }
  }

  submitAssignFaculty() {
    if (!this.selectedTicket || !this.selectedFacultyId) return;
    this.assigningFaculty = true;

    this.api
      .patch(`complaints/${this.selectedTicket.id}/assign`, {
        assignedTo: this.selectedFacultyId,
        note: this.assignmentNote.trim() || undefined,
      })
      .subscribe({
        next: (updated: any) => {
          this.assigningFaculty = false;
          this.showAssignModal = false;
          this.selectedTicket = updated;
          this.toast.success('Ticket delegated to faculty member successfully');
          this.loadComplaints();
        },
        error: () => {
          this.assigningFaculty = false;
          this.toast.error('Failed to delegate ticket');
        },
      });
  }

  exportTicketsCsv() {
    if (!this.complaints.length) return;
    this.exporter.exportToCsv(
      'Grievance_Tickets_Report.csv',
      this.complaints,
      [
        { header: 'Ticket No', key: 'ticket_number' },
        { header: 'Subject', key: 'subject' },
        { header: 'Category', key: 'category' },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        {
          header: 'Parent Name',
          key: 'guardian',
          formatter: (g) => `${g?.first_name || ''} ${g?.last_name || ''}`.trim(),
        },
        {
          header: 'Student Name',
          key: 'student',
          formatter: (s) => `${s?.first_name || ''} ${s?.last_name || ''}`.trim(),
        },
        {
          header: 'Class & Section',
          key: 'student',
          formatter: (s) => {
            const enr = s?.student_enrollments?.[0];
            return enr?.section ? `${enr.section.class?.name || ''} - ${enr.section.name}` : 'N/A';
          },
        },
        {
          header: 'Assigned Staff',
          key: 'users',
          formatter: (u) => (u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Unassigned'),
        },
        { header: 'Created Date', key: 'created_at', formatter: (d) => new Date(d).toLocaleDateString() },
      ],
    );
    this.toast.success('Exported Grievance_Tickets_Report.csv');
  }

  printTicketRegistry() {
    this.exporter.printReport(
      'School Grievance & Support Desk Registry',
      `Total Tickets: ${this.complaints.length} | Open: ${this.countStatus('OPEN')} | Resolved: ${this.countStatus('RESOLVED')}`,
      this.filteredComplaints,
      [
        { header: 'Ticket #', key: 'ticket_number' },
        { header: 'Category', key: 'category' },
        { header: 'Subject', key: 'subject' },
        { header: 'Student', key: 'student', formatter: (s) => `${s?.first_name || ''} ${s?.last_name || ''}`.trim() },
        { header: 'Parent', key: 'guardian', formatter: (g) => `${g?.first_name || ''} ${g?.last_name || ''}`.trim() },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        { header: 'Date', key: 'created_at', formatter: (d) => new Date(d).toLocaleDateString() },
      ],
    );
  }
}


