import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ExportService } from '../../core/services/export.service';
import { Notice, SchoolEventItem } from '../../core/models';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Action Buttons -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Communication & Events</h1>
          <p class="text-xs text-slate-500 mt-0.5">Publish circulars, broadcast notices, and manage the official school calendar.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <button *ngIf="canManageTemplates" (click)="openOnboardingTemplates()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Onboarding Email Templates</span>
          </button>
          <button (click)="exportNoticesCsv()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Circulars</span>
          </button>
          <button (click)="printBulletin()"
                  class="px-3.5 py-2 bg-[#f8fafc] hover:bg-white text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold shadow-[2px_2px_6px_#d9e2ec,-2px_-2px_6px_#ffffff] flex items-center gap-1.5 transition-all cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Bulletin</span>
          </button>
          <button (click)="showEventModal = true"
                  class="px-4 py-2.5 bg-[#f8fafc] hover:bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-2xl shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Event</span>
          </button>
          <button (click)="showNoticeModal = true"
                  class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.99]">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span>Broadcast Notice</span>
          </button>
        </div>
      </div>

      <!-- Onboarding Welcome Email Templates Quick Banner (Admin only) -->
      <div *ngIf="canManageTemplates" class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shrink-0">
            <svg class="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-black tracking-tight">Automated Onboarding Welcome Emails</h3>
              <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wide border border-emerald-500/30">Active</span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">Welcome emails with login credentials and school details are automatically sent when adding students or teachers.</p>
          </div>
        </div>

        <button (click)="openOnboardingTemplates()"
                class="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0">
          <span>Edit Email Templates</span>
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Filter Audience Bar -->
      <div class="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Audience:</span>
          <select [(ngModel)]="audienceFilter"
                  class="px-3.5 py-2 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff] focus:outline-none focus:border-slate-800 cursor-pointer">
            <option value="ALL">All Audiences</option>
            <option value="GUARDIANS">Parents / Guardians</option>
            <option value="TEACHERS">Teachers</option>
            <option value="CLASS">Class Specific</option>
          </select>
        </div>

        <div class="text-xs text-slate-500 font-medium">
          <span class="font-bold text-slate-900">{{ filteredNotices.length }}</span> circulars • 
          <span class="font-bold text-slate-900">{{ events.length }}</span> scheduled events
        </div>
      </div>

      <!-- Two-Column Notices and Events Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Notices Feed -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <span>Official School Circulars</span>
            </h3>
            <span class="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-xl border border-slate-200">{{ filteredNotices.length }} active</span>
          </div>

          <div class="space-y-3">
            <div *ngFor="let n of filteredNotices" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] hover:border-slate-400 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <h4 class="text-sm font-bold text-slate-900">{{ n.title }}</h4>
                <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#f8fafc] text-slate-700 border border-slate-200 shadow-xs flex-shrink-0">
                  {{ n.target_audience }}
                </span>
              </div>
              <p class="text-xs text-slate-600 mt-2.5 leading-relaxed bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 shadow-[inset_1px_1px_2px_#e2e8f0]">
                {{ n.content }}
              </p>
              <div class="text-[11px] text-slate-400 mt-3.5 flex items-center justify-between">
                <span>Published on {{ n.published_at | date:'mediumDate' }}</span>
                <span *ngIf="n.publisher">by {{ n.publisher.first_name }} {{ n.publisher.last_name || '' }}</span>
              </div>
            </div>

            <div *ngIf="filteredNotices.length === 0" class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] text-center text-xs text-slate-400">
              No circulars found for this audience.
            </div>
          </div>
        </div>

        <!-- Events Calendar -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>School Calendar & Holidays</span>
            </h3>
            <button (click)="exportEventsCsv()" class="text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer">
              Export CSV →
            </button>
          </div>

          <div class="space-y-3">
            <div *ngFor="let ev of events" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff]">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-bold text-slate-900">{{ ev.title }}</h4>
                <span *ngIf="ev.is_holiday" class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                  School Holiday
                </span>
              </div>
              <p *ngIf="ev.description" class="text-xs text-slate-600 mt-2 leading-relaxed">{{ ev.description }}</p>
              <div class="text-xs text-slate-500 mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ ev.start_time | date:'medium' }}</span>
                </span>
                <span *ngIf="ev.location" class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ ev.location }}</span>
                </span>
              </div>
            </div>

            <div *ngIf="events.length === 0" class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[6px_6px_16px_#d9e2ec,-6px_-6px_16px_#ffffff] text-center text-xs text-slate-400">
              No upcoming events scheduled.
            </div>
          </div>
        </div>
      </div>

      <!-- Create Notice Modal -->
      <div *ngIf="showNoticeModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-black text-slate-900 tracking-tight">Broadcast Circular Notice</h3>
            <button (click)="showNoticeModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Notice Title *</label>
              <input type="text" [(ngModel)]="newNotice.title" placeholder="e.g. Annual Sports Day Registration & Schedule"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Notice Content *</label>
              <textarea [(ngModel)]="newNotice.content" rows="4" placeholder="Enter notice details and instructions..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]"></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
              <select [(ngModel)]="newNotice.targetAudience"
                      class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]">
                <option value="ALL">All School (Students, Parents & Teachers)</option>
                <option value="GUARDIANS">Parents / Guardians Only</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="CLASS">Class Specific</option>
              </select>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showNoticeModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="createNotice()" [disabled]="creatingNotice || !newNotice.title || !newNotice.content"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!creatingNotice">Publish Notice</span>
              <span *ngIf="creatingNotice">Publishing...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add Event Modal -->
      <div *ngIf="showEventModal" class="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[10px_10px_30px_rgba(0,0,0,0.15)] border border-slate-200/90 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-black text-slate-900 tracking-tight">Schedule School Event</h3>
            <button (click)="showEventModal = false" class="text-slate-400 hover:text-slate-700 font-bold text-xl p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">&times;</button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
              <input type="text" [(ngModel)]="newEvent.title" placeholder="e.g. Science Exhibition & Project Fair"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea [(ngModel)]="newEvent.description" rows="3" placeholder="Event details..."
                        class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Start Date & Time</label>
                <input type="datetime-local" [(ngModel)]="newEvent.startTime"
                       class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">End Date & Time</label>
                <input type="datetime-local" [(ngModel)]="newEvent.endTime"
                       class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Location / Venue</label>
              <input type="text" [(ngModel)]="newEvent.location" placeholder="e.g. Main Auditorium & Quadrangle"
                     class="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 shadow-[inset_1px_1px_3px_#e2e8f0,inset_-1px_-1px_3px_#ffffff]" />
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="holidayCheck" [(ngModel)]="newEvent.isHoliday" class="rounded-lg border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer" />
              <label for="holidayCheck" class="text-xs font-bold text-slate-700 cursor-pointer">Declare as Official School Holiday</label>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button (click)="showEventModal = false" class="px-4 py-2.5 bg-[#f8fafc] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-300 transition-colors cursor-pointer">
              Cancel
            </button>
            <button (click)="createEvent()" [disabled]="creatingEvent || !newEvent.title"
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-[4px_4px_10px_#cbd5e1,-4px_-4px_10px_#ffffff] transition-all disabled:opacity-50 cursor-pointer">
              <span *ngIf="!creatingEvent">Save Event</span>
              <span *ngIf="creatingEvent">Saving...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CommunicationComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  toast = inject(ToastService);
  exporter = inject(ExportService);

  notices: Notice[] = [];
  events: SchoolEventItem[] = [];
  audienceFilter = 'ALL';

  showNoticeModal = false;
  creatingNotice = false;
  newNotice = {
    title: '',
    content: '',
    targetAudience: 'ALL',
  };

  showEventModal = false;
  creatingEvent = false;
  newEvent = {
    title: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    isHoliday: false,
    targetAudience: 'ALL',
  };

  ngOnInit() {
    if (!this.auth.isServiceEnabled('COMMUNICATION')) return;
    this.loadData();
  }

  loadData() {
    this.api.get<Notice[]>('communication/notices').subscribe({
      next: (res) => (this.notices = res),
      error: () => this.toast.error('Failed to load notices'),
    });
    this.api.get<SchoolEventItem[]>('communication/events').subscribe({
      next: (res) => (this.events = res),
      error: () => this.toast.error('Failed to load calendar events'),
    });
  }

  get filteredNotices(): Notice[] {
    if (this.audienceFilter === 'ALL') return this.notices;
    return this.notices.filter((n) => n.target_audience === this.audienceFilter);
  }

  createNotice() {
    if (!this.newNotice.title || !this.newNotice.content) return;
    this.creatingNotice = true;

    this.api.post('communication/notices', this.newNotice).subscribe({
      next: () => {
        this.creatingNotice = false;
        this.showNoticeModal = false;
        this.toast.success(`Published notice "${this.newNotice.title}"`);
        this.newNotice = { title: '', content: '', targetAudience: 'ALL' };
        this.loadData();
      },
      error: () => {
        this.creatingNotice = false;
        this.toast.error('Failed to publish notice');
      },
    });
  }

  createEvent() {
    if (!this.newEvent.title) return;
    this.creatingEvent = true;

    this.api.post('communication/events', this.newEvent).subscribe({
      next: () => {
        this.creatingEvent = false;
        this.showEventModal = false;
        this.toast.success(`Event "${this.newEvent.title}" scheduled`);
        this.newEvent = {
          title: '',
          description: '',
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
          location: '',
          isHoliday: false,
          targetAudience: 'ALL',
        };
        this.loadData();
      },
      error: () => {
        this.creatingEvent = false;
        this.toast.error('Failed to create calendar event');
      },
    });
  }

  exportNoticesCsv() {
    if (!this.notices.length) return;
    this.exporter.exportToCsv(
      'School_Circulars_Bulletin.csv',
      this.notices,
      [
        { header: 'Title', key: 'title' },
        { header: 'Audience', key: 'target_audience' },
        { header: 'Content', key: 'content' },
        { header: 'Published Date', key: 'published_at', formatter: (d) => new Date(d).toLocaleDateString() },
        { header: 'Published By', key: 'publisher', formatter: (p) => `${p?.first_name || ''} ${p?.last_name || ''}`.trim() },
      ],
    );
    this.toast.success('Exported School_Circulars_Bulletin.csv');
  }

  exportEventsCsv() {
    if (!this.events.length) return;
    this.exporter.exportToCsv(
      'School_Calendar_Events.csv',
      this.events,
      [
        { header: 'Event Title', key: 'title' },
        { header: 'Holiday', key: 'is_holiday', formatter: (h) => (h ? 'Yes' : 'No') },
        { header: 'Start Time', key: 'start_time', formatter: (t) => new Date(t).toLocaleString() },
        { header: 'Location', key: 'location' },
        { header: 'Description', key: 'description' },
      ],
    );
    this.toast.success('Exported School_Calendar_Events.csv');
  }

  printBulletin() {
    this.exporter.printReport(
      'Official School Circular & Notice Bulletin',
      `Active Circulars: ${this.filteredNotices.length} | Upcoming Events: ${this.events.length}`,
      this.filteredNotices,
      [
        { header: 'Title', key: 'title' },
        { header: 'Target Audience', key: 'target_audience' },
        { header: 'Circular Message', key: 'content' },
        { header: 'Date', key: 'published_at', formatter: (d) => new Date(d).toLocaleDateString() },
      ],
    );
  }

  get canManageTemplates(): boolean {
    const role = this.auth.currentUser()?.role;
    return role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN' || role === 'PRINCIPAL';
  }

  openOnboardingTemplates() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schoolsense:open-email-templates'));
    }
  }
}

