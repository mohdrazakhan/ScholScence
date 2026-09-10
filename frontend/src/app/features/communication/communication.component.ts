import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
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
          <h1 class="text-xl font-bold text-slate-900">Communication & Events</h1>
          <p class="text-xs text-slate-500 mt-0.5">Publish circulars, broadcast notices, and manage the official school calendar.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <button (click)="exportNoticesCsv()"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>📥 Export Circulars</span>
          </button>
          <button (click)="printBulletin()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>🖨 Print Bulletin</span>
          </button>
          <button (click)="showEventModal = true"
                  class="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5">
            <span>+ Add Event</span>
          </button>
          <button (click)="showNoticeModal = true"
                  class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors flex items-center gap-1.5">
            <span>+ Broadcast Notice</span>
          </button>
        </div>
      </div>

      <!-- Filter Audience Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-500">Audience:</span>
          <select [(ngModel)]="audienceFilter"
                  class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500">
            <option value="ALL">All Audiences</option>
            <option value="GUARDIANS">Parents / Guardians</option>
            <option value="TEACHERS">Teachers</option>
            <option value="CLASS">Class Specific</option>
          </select>
        </div>

        <div class="text-xs text-slate-500">
          <span class="font-bold text-slate-800">{{ filteredNotices.length }}</span> circulars • 
          <span class="font-bold text-slate-800">{{ events.length }}</span> scheduled events
        </div>
      </div>

      <!-- Two-Column Notices and Events Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Notices Feed -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>📢 Official School Circulars</span>
            </h3>
            <span class="text-[11px] font-bold text-indigo-600">{{ filteredNotices.length }} active</span>
          </div>

          <div class="space-y-3">
            <div *ngFor="let n of filteredNotices" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
              <div class="flex items-start justify-between gap-3">
                <h4 class="text-sm font-bold text-slate-900">{{ n.title }}</h4>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                  {{ n.target_audience }}
                </span>
              </div>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {{ n.content }}
              </p>
              <div class="text-[11px] text-slate-400 mt-3 flex items-center justify-between">
                <span>Published on {{ n.published_at | date:'mediumDate' }}</span>
                <span *ngIf="n.publisher">by {{ n.publisher.first_name }} {{ n.publisher.last_name || '' }}</span>
              </div>
            </div>

            <div *ngIf="filteredNotices.length === 0" class="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              No circulars found for this audience.
            </div>
          </div>
        </div>

        <!-- Events Calendar -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>📅 School Calendar & Holidays</span>
            </h3>
            <button (click)="exportEventsCsv()" class="text-[11px] font-bold text-emerald-600 hover:underline">
              Export CSV →
            </button>
          </div>

          <div class="space-y-3">
            <div *ngFor="let ev of events" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-bold text-slate-900">{{ ev.title }}</h4>
                <span *ngIf="ev.is_holiday" class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                  School Holiday
                </span>
              </div>
              <p *ngIf="ev.description" class="text-xs text-slate-600 mt-2">{{ ev.description }}</p>
              <div class="text-xs text-slate-500 mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                <span>🕒 {{ ev.start_time | date:'medium' }}</span>
                <span *ngIf="ev.location">📍 {{ ev.location }}</span>
              </div>
            </div>

            <div *ngIf="events.length === 0" class="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              No upcoming events scheduled.
            </div>
          </div>
        </div>
      </div>

      <!-- Create Notice Modal -->
      <div *ngIf="showNoticeModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Broadcast Circular Notice</h3>
            <button (click)="showNoticeModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Notice Title *</label>
              <input type="text" [(ngModel)]="newNotice.title" placeholder="e.g. Annual Sports Day Registration & Schedule"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Notice Content *</label>
              <textarea [(ngModel)]="newNotice.content" rows="4" placeholder="Enter notice details and instructions..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select [(ngModel)]="newNotice.targetAudience"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500">
                <option value="ALL">All School (Students, Parents & Teachers)</option>
                <option value="GUARDIANS">Parents / Guardians Only</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="CLASS">Class Specific</option>
              </select>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="showNoticeModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button (click)="createNotice()" [disabled]="creatingNotice || !newNotice.title || !newNotice.content"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
              <span *ngIf="!creatingNotice">Publish to PostgreSQL</span>
              <span *ngIf="creatingNotice">Publishing...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Add Event Modal -->
      <div *ngIf="showEventModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Schedule School Event</h3>
            <button (click)="showEventModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
              <input type="text" [(ngModel)]="newEvent.title" placeholder="e.g. Science Exhibition & Project Fair"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea [(ngModel)]="newEvent.description" rows="3" placeholder="Event details..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Start Date & Time</label>
                <input type="datetime-local" [(ngModel)]="newEvent.startTime"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">End Date & Time</label>
                <input type="datetime-local" [(ngModel)]="newEvent.endTime"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Location / Venue</label>
              <input type="text" [(ngModel)]="newEvent.location" placeholder="e.g. Main Auditorium & Quadrangle"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="holidayCheck" [(ngModel)]="newEvent.isHoliday" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <label for="holidayCheck" class="text-xs font-semibold text-slate-700">Declare as Official School Holiday</label>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="showEventModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button (click)="createEvent()" [disabled]="creatingEvent || !newEvent.title"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
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
}

