import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
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
          <h1 class="text-xl font-bold text-slate-900">Grievance & Support Desk</h1>
          <p class="text-xs text-slate-500 mt-0.5">Track and resolve parent tickets, inquiries, fee queries, and support requests.</p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <button (click)="exportTicketsCsv()"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>📥 Export Excel</span>
          </button>
          <button (click)="printTicketRegistry()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5">
            <span>🖨 Print Registry</span>
          </button>
          <button (click)="showNewTicketModal = true"
                  class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-600/20 transition-colors flex items-center gap-1.5">
            <span>+ Raise Ticket</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-slate-400">Total Grievances</div>
          <div class="text-xl font-bold text-slate-900 mt-1">{{ complaints.length }}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-amber-500">Open Tickets</div>
          <div class="text-xl font-bold text-amber-600 mt-1">{{ countStatus('OPEN') }}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-emerald-500">Resolved</div>
          <div class="text-xl font-bold text-emerald-600 mt-1">{{ countStatus('RESOLVED') }}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] uppercase font-bold text-indigo-500">Resolution Rate</div>
          <div class="text-xl font-bold text-indigo-600 mt-1">{{ resolutionRate }}%</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center flex-wrap gap-2">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search ticket #, parent, subject..."
                 class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 w-64" />

          <select [(ngModel)]="statusFilter"
                  class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700">
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          <select [(ngModel)]="categoryFilter"
                  class="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700">
            <option value="ALL">All Categories</option>
            <option value="ACADEMIC">Academic</option>
            <option value="TRANSPORT">Transport</option>
            <option value="FEE_ACCOUNTS">Fee / Accounts</option>
            <option value="FACILITY">Facility</option>
            <option value="DISCIPLINE">Discipline</option>
          </select>
        </div>

        <span class="text-xs text-slate-500">
          Showing <strong class="text-slate-800">{{ filteredComplaints.length }}</strong> tickets
        </span>
      </div>

      <!-- Tickets & Chat Thread Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Ticket List Sidebar -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Ticket Registry</h3>
            <span class="text-[10px] font-bold text-slate-400 font-mono">{{ filteredComplaints.length }} records</span>
          </div>

          <div class="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            <div *ngFor="let t of filteredComplaints" (click)="selectTicket(t)"
                 [class.bg-indigo-50/70]="selectedTicket?.id === t.id"
                 [class.border-l-4]="selectedTicket?.id === t.id"
                 [class.border-l-indigo-600]="selectedTicket?.id === t.id"
                 class="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold font-mono text-indigo-600">{{ t.ticket_number }}</span>
                <span [class.bg-amber-50]="t.status === 'OPEN'"
                      [class.text-amber-700]="t.status === 'OPEN'"
                      [class.border-amber-200]="t.status === 'OPEN'"
                      [class.bg-emerald-50]="t.status === 'RESOLVED'"
                      [class.text-emerald-700]="t.status === 'RESOLVED'"
                      [class.border-emerald-200]="t.status === 'RESOLVED'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold border">
                  {{ t.status }}
                </span>
              </div>
              <h4 class="text-xs font-bold text-slate-800 mt-1.5 truncate">{{ t.subject }}</h4>
              <div class="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                <span>👤 {{ t.guardian?.first_name }} {{ t.guardian?.last_name || '' }}</span>
                <span>📅 {{ t.created_at | date:'shortDate' }}</span>
              </div>
            </div>

            <div *ngIf="filteredComplaints.length === 0" class="p-8 text-center text-xs text-slate-400">
              No matching tickets found.
            </div>
          </div>
        </div>

        <!-- Ticket Discussion Thread -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          <ng-container *ngIf="selectedTicket; else noSelected">
            <!-- Ticket Header -->
            <div class="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-indigo-600">{{ selectedTicket.ticket_number }}</span>
                  <span class="text-xs font-bold text-slate-900">• {{ selectedTicket.subject }}</span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">
                  Category: <span class="font-semibold text-slate-700">{{ selectedTicket.category }}</span> • 
                  Priority: <span class="font-bold text-amber-600">{{ selectedTicket.priority || 'NORMAL' }}</span> • 
                  Parent: <span class="font-semibold text-slate-700">{{ selectedTicket.guardian?.first_name }} {{ selectedTicket.guardian?.last_name || '' }}</span>
                </div>
              </div>

              <!-- Status Transition -->
              <div class="flex items-center gap-2">
                <button (click)="toggleStatus()"
                        [class.bg-emerald-600]="selectedTicket.status === 'OPEN'"
                        [class.hover:bg-emerald-500]="selectedTicket.status === 'OPEN'"
                        [class.bg-amber-600]="selectedTicket.status !== 'OPEN'"
                        [class.hover:bg-amber-500]="selectedTicket.status !== 'OPEN'"
                        class="px-3.5 py-1.5 text-white text-xs font-bold rounded-lg transition-colors shadow-xs">
                  Mark as {{ selectedTicket.status === 'OPEN' ? 'Resolved' : 'Open' }}
                </button>
              </div>
            </div>

            <!-- Messages Thread -->
            <div class="flex-1 p-6 overflow-y-auto space-y-4">
              <div *ngFor="let msg of selectedTicket.messages"
                   class="flex flex-col max-w-lg p-3.5 rounded-2xl text-xs shadow-xs"
                   [ngClass]="msg.is_internal_note ? 'bg-amber-50 border border-amber-200 ml-auto' : 'bg-slate-100 mr-auto'">
                <div class="flex items-center justify-between gap-4 mb-1">
                  <span class="font-bold text-slate-800">
                    {{ msg.sender?.first_name }} {{ msg.sender?.last_name || '' }}
                  </span>
                  <span class="text-[10px] text-slate-400">{{ msg.created_at | date:'shortTime' }}</span>
                </div>
                <p class="text-slate-700 leading-relaxed">{{ msg.message }}</p>
              </div>
            </div>

            <!-- Reply Box -->
            <div class="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <input type="text" [(ngModel)]="replyText" (keyup.enter)="sendReply()" placeholder="Type an official response to parent..."
                     class="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500" />
              <button (click)="sendReply()" [disabled]="!replyText || sendingReply"
                      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50">
                <span *ngIf="!sendingReply">Send Reply</span>
                <span *ngIf="sendingReply">Sending...</span>
              </button>
            </div>
          </ng-container>

          <ng-template #noSelected>
            <div class="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a ticket on the left to view the thread and respond.
            </div>
          </ng-template>
        </div>
      </div>

      <!-- New Ticket Modal -->
      <div *ngIf="showNewTicketModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-900">Raise New Grievance Ticket</h3>
            <button (click)="showNewTicketModal = false" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Ticket Category</label>
              <select [(ngModel)]="newTicket.category"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500">
                <option value="ACADEMIC">Academic / Curriculum</option>
                <option value="TRANSPORT">School Bus / Transport</option>
                <option value="FEE_ACCOUNTS">Fee & Accounts Billing</option>
                <option value="FACILITY">Campus Facility & Hygiene</option>
                <option value="DISCIPLINE">Student Discipline & Safety</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select [(ngModel)]="newTicket.priority"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High / Urgent</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
              <input type="text" [(ngModel)]="newTicket.subject" placeholder="e.g. Bus route 4 timing delay inquiry"
                     class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Message Details *</label>
              <textarea [(ngModel)]="newTicket.message" rows="4" placeholder="Describe the grievance in detail..."
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"></textarea>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="showNewTicketModal = false" class="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button (click)="createTicket()" [disabled]="creatingTicket || !newTicket.subject || !newTicket.message"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50">
              <span *ngIf="!creatingTicket">Submit Ticket</span>
              <span *ngIf="creatingTicket">Submitting...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ComplaintsComponent implements OnInit {
  api = inject(ApiService);
  toast = inject(ToastService);
  exporter = inject(ExportService);

  complaints: ComplaintItem[] = [];
  selectedTicket: ComplaintItem | null = null;
  replyText = '';
  sendingReply = false;

  // Search & Filters
  searchQuery = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';

  // Modal
  showNewTicketModal = false;
  creatingTicket = false;
  newTicket = {
    category: 'ACADEMIC',
    priority: 'MEDIUM',
    subject: '',
    message: '',
  };

  ngOnInit() {
    this.loadComplaints();
  }

  loadComplaints() {
    this.api.get<ComplaintItem[]>('complaints').subscribe({
      next: (res) => {
        this.complaints = res;
        if (res.length > 0 && !this.selectedTicket) {
          this.selectTicket(res[0]);
        }
      },
      error: () => this.toast.error('Could not load grievance tickets'),
    });
  }

  get filteredComplaints(): ComplaintItem[] {
    return this.complaints.filter((c) => {
      if (this.statusFilter !== 'ALL' && c.status !== this.statusFilter) return false;
      if (this.categoryFilter !== 'ALL' && c.category !== this.categoryFilter) return false;
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const num = (c.ticket_number || '').toLowerCase();
        const sub = (c.subject || '').toLowerCase();
        const parent = `${c.guardian?.first_name || ''} ${c.guardian?.last_name || ''}`.toLowerCase();
        if (!num.includes(q) && !sub.includes(q) && !parent.includes(q)) return false;
      }
      return true;
    });
  }

  countStatus(status: string): number {
    return this.complaints.filter((c) => c.status === status).length;
  }

  get resolutionRate(): string {
    if (!this.complaints.length) return '100.0';
    const res = this.countStatus('RESOLVED');
    return ((res / this.complaints.length) * 100).toFixed(1);
  }

  selectTicket(t: ComplaintItem) {
    this.selectedTicket = t;
  }

  sendReply() {
    if (!this.replyText || !this.selectedTicket) return;
    this.sendingReply = true;

    this.api.post(`complaints/${this.selectedTicket.id}/messages`, { message: this.replyText }).subscribe({
      next: (newMsg: any) => {
        this.sendingReply = false;
        this.selectedTicket?.messages?.push(newMsg);
        this.replyText = '';
        this.toast.success('Response dispatched successfully');
      },
      error: () => {
        this.sendingReply = false;
        this.toast.error('Failed to send message');
      },
    });
  }

  toggleStatus() {
    if (!this.selectedTicket) return;
    const newStatus = this.selectedTicket.status === 'OPEN' ? 'RESOLVED' : 'OPEN';

    this.api.patch(`complaints/${this.selectedTicket.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        if (this.selectedTicket) {
          this.selectedTicket.status = newStatus;
        }
        this.toast.success(`Ticket ${this.selectedTicket?.ticket_number} marked as ${newStatus}`);
      },
      error: () => this.toast.error('Failed to update ticket status'),
    });
  }

  createTicket() {
    if (!this.newTicket.subject || !this.newTicket.message) return;
    this.creatingTicket = true;

    this.api.post('complaints', this.newTicket).subscribe({
      next: (res: any) => {
        this.creatingTicket = false;
        this.showNewTicketModal = false;
        this.newTicket = { category: 'ACADEMIC', priority: 'MEDIUM', subject: '', message: '' };
        this.complaints.unshift(res);
        this.selectedTicket = res;
        this.toast.success(`Created ticket ${res.ticket_number}`);
      },
      error: () => {
        this.creatingTicket = false;
        this.toast.error('Failed to submit ticket');
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
        { header: 'Parent Name', key: 'guardian', formatter: (g) => `${g?.first_name || ''} ${g?.last_name || ''}`.trim() },
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
        { header: 'Parent', key: 'guardian', formatter: (g) => `${g?.first_name || ''} ${g?.last_name || ''}`.trim() },
        { header: 'Priority', key: 'priority' },
        { header: 'Status', key: 'status' },
        { header: 'Date', key: 'created_at', formatter: (d) => new Date(d).toLocaleDateString() },
      ],
    );
  }
}

