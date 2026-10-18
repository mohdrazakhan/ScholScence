import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DepartmentalStaffUser } from '../../core/models';

interface FeatureSectionDef {
  id: string;
  name: string;
  category: string;
  description: string;
  isParent?: boolean;
  parentId?: string;
}

@Component({
  selector: 'app-staff-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Unauthorized Access State -->
    <div *ngIf="!canAccess" class="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div class="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-md mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3.5a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
      <p class="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
        Only Institution Administrators, Principals, and Super Admins have permission to manage departmental staff accounts and configure feature-level access.
      </p>
      <a routerLink="/dashboard" class="mt-5 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all">
        Return to Dashboard
      </a>
    </div>

    <!-- Main Content (Authorized Admins Only) -->
    <div *ngIf="canAccess" class="space-y-6 animate-fadeIn pb-12">
      
      <!-- Top Title Bar & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              ADMIN ACCESS CONTROL
            </span>
            <span class="text-xs font-semibold text-slate-500">Campus Identity & Permissions</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <span>Departmental Users & Feature Access</span>
          </h1>
          <p class="text-xs text-slate-500 mt-1">
            Provision dedicated administrative logins for Fee Accountants, Transport Supervisors, Librarians, Sports In-Charges & Sub-Admins with granular feature switches.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button type="button" (click)="openAddModal()"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-98">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Departmental User</span>
          </button>
        </div>
      </div>

      <!-- Campus Metrics Ribbon (Unified Minimalist Theme) -->
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff Accounts</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-2xs">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3.2" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                <path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M15.5 7.5a2.8 2.8 0 010 5.2M17 14.5c2 .5 3.5 2 3.5 4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl font-black text-slate-900">{{ usersList.length }}</div>
          <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Across all departments</span>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Logins</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-2xs">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                <path d="M8.5 12.5l2.2 2.2 4.8-4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl font-black text-slate-900">{{ activeUsersCount }}</div>
          <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Can authenticate live</span>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fee & Accounts</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-2xs">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                <path d="M3 10h18M7 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl font-black text-slate-900">{{ feeDeptCount }}</div>
          <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Invoicing & Ledger</span>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transport & Fleet</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-2xs">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="13" rx="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                <path d="M4 11h16M7.5 17v2.5M16.5 17v2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <circle cx="8" cy="14" r="1" fill="currentColor" />
                <circle cx="16" cy="14" r="1" fill="currentColor" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl font-black text-slate-900">{{ transportDeptCount }}</div>
          <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Routes & Bus Passes</span>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Specialized Depts</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-2xs">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 8h16L12 3z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M6 8v9M10 8v9M14 8v9M18 8v9M4 17h16M3 20h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
          </div>
          <div class="mt-2 text-2xl font-black text-slate-900">{{ specializedDeptCount }}</div>
          <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Library, Sports, Security</span>
        </div>
      </div>

      <!-- Filters, Search & Department Pills -->
      <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Search input -->
          <div class="relative flex-1">
            <input type="text" [(ngModel)]="searchQuery"
                   placeholder="Search staff by name, email, phone, designation or role..."
                   class="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 transition-colors" />
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button *ngIf="searchQuery" (click)="searchQuery = ''"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5 cursor-pointer">&times;</button>
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" (click)="statusFilter = 'ALL'"
                    class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                    [ngClass]="statusFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'">
              All ({{ usersList.length }})
            </button>
            <button type="button" (click)="statusFilter = 'ACTIVE'"
                    class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                    [ngClass]="statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'">
              Active ({{ activeUsersCount }})
            </button>
            <button type="button" (click)="statusFilter = 'INACTIVE'"
                    class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                    [ngClass]="statusFilter === 'INACTIVE' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'">
              Inactive ({{ usersList.length - activeUsersCount }})
            </button>
          </div>
        </div>

        <!-- Department Filter Pills (Only show departments that have staff added) -->
        <div *ngIf="departmentsList.length > 1" class="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar border-t border-slate-100 pt-3">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Department:</span>
          <button *ngFor="let dept of departmentsList"
                  type="button"
                  (click)="activeDepartment = dept"
                  class="px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer"
                  [ngClass]="activeDepartment === dept 
                              ? 'bg-indigo-600 text-white shadow-2xs' 
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
            {{ dept }}
          </button>
        </div>
      </div>

      <!-- Users Grid / List -->
      <div *ngIf="loading" class="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 animate-pulse">
        Loading departmental users and permission matrices...
      </div>

      <div *ngIf="!loading && filteredUsers.length === 0" class="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div class="w-12 h-12 rounded-2xl bg-slate-100/90 border border-white text-slate-600 flex items-center justify-center mx-auto mb-3 shadow-[inset_2px_2px_4px_#ffffff,0_4px_10px_rgba(15,23,42,0.06)]">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3.5" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8" />
            <path d="M3 19.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <path d="M16 7a3 3 0 010 5.6M17.5 14.5c2.2.6 3.5 2.2 3.5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-slate-800">No departmental users found</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {{ searchQuery ? 'Try adjusting your search query or department filter.' : 'Click "Add Departmental User" to create your first departmental accounts.' }}
        </p>
        <div class="mt-4 flex items-center justify-center gap-2">
          <button *ngIf="searchQuery" (click)="searchQuery = ''; activeDepartment = 'All'"
                  class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer">
            Clear Filters
          </button>
          <button (click)="openAddModal()"
                  class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer">
            Add User Now
          </button>
        </div>
      </div>

      <div *ngIf="!loading && filteredUsers.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div *ngFor="let u of filteredUsers" 
             class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-4 relative overflow-hidden group">
          
          <!-- Top Accent Stripe for Root Administrator -->
          <div *ngIf="isPrimaryAdmin(u)" class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-400"></div>

          <div>
            <!-- Card Header: Avatar, Name, Designation & Status Switch -->
            <div class="flex items-start justify-between gap-2.5">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <!-- Avatar with Live Status Dot -->
                <div class="relative shrink-0">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs"
                       [ngClass]="isPrimaryAdmin(u) ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'">
                    {{ u.first_name ? u.first_name.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                        [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'">
                  </span>
                </div>

                <!-- Name & Department Subtitle -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <h3 class="text-sm font-bold text-slate-900 leading-tight truncate">
                      {{ u.name || (u.first_name + ' ' + (u.last_name || '')) }}
                    </h3>
                    <span *ngIf="isPrimaryAdmin(u)" 
                          class="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 leading-normal">
                      Root Admin
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5 truncate" title="{{ (u.designation || u.role_name || u.role) }} • {{ u.department }}">
                    <span class="font-semibold text-slate-700">{{ u.designation || u.role_name || u.role }}</span>
                    <span class="text-slate-300 mx-1">•</span>
                    <span>{{ u.department }}</span>
                  </p>
                </div>
              </div>

              <!-- Status Toggle Switch (Active / Inactive) -->
              <div class="flex items-center gap-1.5 shrink-0 bg-slate-50/90 py-1 px-2 rounded-xl border border-slate-200/70 shadow-2xs">
                <button type="button"
                        (click)="toggleUserStatus(u)"
                        [disabled]="isPrimaryAdmin(u)"
                        [title]="isPrimaryAdmin(u) ? 'Primary Administrator cannot be deactivated' : (u.status === 'ACTIVE' ? 'Click to make Inactive' : 'Click to make Active')"
                        class="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
                        [ngClass]="{
                          'bg-emerald-500 hover:bg-emerald-600 cursor-pointer': u.status === 'ACTIVE' && !isPrimaryAdmin(u),
                          'bg-emerald-500/75 cursor-not-allowed': u.status === 'ACTIVE' && isPrimaryAdmin(u),
                          'bg-slate-300 hover:bg-slate-400 cursor-pointer': u.status !== 'ACTIVE'
                        }">
                  <span class="sr-only">Toggle user status</span>
                  <span class="inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition-transform duration-200 ease-in-out"
                        [ngClass]="u.status === 'ACTIVE' ? 'translate-x-3.5' : 'translate-x-0.5'">
                  </span>
                </button>
                <span class="text-[10px] font-bold select-none"
                      [ngClass]="u.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'">
                  {{ u.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
                </span>
                <svg *ngIf="isPrimaryAdmin(u)" title="Account locked from deactivation" class="w-2.5 h-2.5 text-slate-400" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" />
                </svg>
              </div>
            </div>

            <!-- Contact & Credentials Block with Quick Copy -->
            <div class="mt-3.5 space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-xs">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="font-medium text-slate-700 truncate select-all">{{ u.email }}</span>
                </div>
                <button type="button" (click)="copyText(u.email, 'Email address')" title="Copy email address"
                        class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors cursor-pointer shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <div *ngIf="u.phone" class="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                <div class="flex items-center gap-2 min-w-0">
                  <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span class="font-medium text-slate-700 truncate select-all">{{ u.phone }}</span>
                </div>
                <button type="button" (click)="copyText(u.phone, 'Phone number')" title="Copy phone number"
                        class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors cursor-pointer shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Feature Access Section (Unified 102px Container for Perfect Grid Alignment) -->
            <div>
              <!-- Primary Admin Full Access Card -->
              <div *ngIf="isPrimaryAdmin(u)" class="mt-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 h-[102px] flex flex-col justify-between">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-indigo-950 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Full Platform Access
                  </span>
                  <span class="text-[10px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200/70 shadow-2xs">
                    20/20 Enabled
                  </span>
                </div>
                <div class="w-full bg-indigo-200/60 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full w-full"></div>
                </div>
                <p class="text-[10px] text-slate-500 leading-snug">
                  Master institutional access across Academics, Fees, Fleet, Attendance & Campus Settings.
                </p>
              </div>

              <!-- Departmental Staff Permissions Box -->
              <div *ngIf="!isPrimaryAdmin(u)" class="mt-3.5 rounded-xl bg-slate-50/80 border border-slate-100 p-3 h-[102px] flex flex-col justify-between">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-800">Assigned Modules</span>
                  <span class="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                    {{ u.custom_permissions.length }}/{{ allSections.length }} Enabled
                  </span>
                </div>
                <div class="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full transition-all duration-300"
                       [style.width.%]="(u.custom_permissions.length / allSections.length) * 100"></div>
                </div>
                <div class="flex items-center gap-1.5 overflow-hidden flex-nowrap">
                  <span *ngFor="let perm of u.custom_permissions.slice(0, 2)"
                        class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-slate-700 border border-slate-200/80 shadow-2xs truncate shrink max-w-[125px]">
                    {{ getSectionDisplayName(perm) }}
                  </span>
                  <span *ngIf="u.custom_permissions.length > 2"
                        class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                    +{{ u.custom_permissions.length - 2 }} more
                  </span>
                  <span *ngIf="u.custom_permissions.length === 0"
                        class="text-[10px] font-medium text-rose-500 italic">
                    No features assigned yet
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Bar (Clean 2-Tier Layout: Never Overlaps & Equal Height) -->
          <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <!-- Row 1: Quick Utility Actions (Equal 50/50 Grid) -->
            <div class="grid grid-cols-2 gap-2">
              <button type="button" (click)="copyCredentials(u)"
                      title="Copy complete login instructions to clipboard"
                      class="h-8 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 transition-all cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span class="truncate">Copy</span>
              </button>

              <button type="button" (click)="openResetPasswordModal(u)"
                      title="Reset account password"
                      class="h-8 px-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 transition-all cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-98">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span class="truncate">Password</span>
              </button>
            </div>

            <!-- Row 2: Management CTA / Permanent Admin -->
            <!-- For Departmental Staff: Prominent Edit Access CTA + Delete Button -->
            <div *ngIf="!isPrimaryAdmin(u)" class="flex items-center gap-2">
              <button type="button" (click)="openEditModal(u)"
                      class="flex-1 h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Access</span>
              </button>

              <button type="button" (click)="deleteUser(u)"
                      title="Revoke user login"
                      class="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/90 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- For Root Administrator: Dedicated Full-Width Badge -->
            <div *ngIf="isPrimaryAdmin(u)" 
                 class="h-8 px-3 text-[11px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-center gap-1.5 select-none shadow-2xs w-full"
                 title="Root Administrator account has permanent privileges">
              <svg class="w-3.5 h-3.5 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" />
                <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" />
              </svg>
              <span>Permanent Root Administrator</span>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- ADD / EDIT USER MODAL WITH GRANULAR FEATURE ACCESS MATRIX -->
    <div *ngIf="isUserModalOpen" 
         class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        
        <!-- Modal Header -->
        <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                {{ isEditing ? 'MODIFY PERMISSIONS' : 'NEW LOGIN' }}
              </span>
              <h3 class="text-base font-black text-slate-900">
                {{ isEditing ? 'Edit Departmental User & Access' : 'Create New Departmental User' }}
              </h3>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              Specify user identity and toggle exact module permissions allowed for this person.
            </p>
          </div>

          <button type="button" (click)="closeUserModal()"
                  class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold">
            &times;
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-5 sm:p-6 overflow-y-auto custom-clay-scroll space-y-6 flex-1">
          
          <!-- Section 1: User Profile & Identity -->
          <div>
            <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>1. Profile & Login Credentials</span>
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">First Name *</label>
                <input type="text" [(ngModel)]="formData.first_name" placeholder="e.g. Ramesh"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none" />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Last Name</label>
                <input type="text" [(ngModel)]="formData.last_name" placeholder="e.g. Sharma"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none" />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Email (Login ID) *</label>
                <input type="email" [(ngModel)]="formData.email" placeholder="e.g. accounts@school.in"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none" />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input type="text" [(ngModel)]="formData.phone" placeholder="e.g. +91 98765 43210"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none" />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Department *</label>
                <select [(ngModel)]="formData.department" (change)="onDepartmentChange()"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none cursor-pointer">
                  <option value="Fee & Accounts">Fee & Accounts Department</option>
                  <option value="Transport & Fleet">Transport & Fleet Department</option>
                  <option value="Administration">School Administration (Sub-Admin)</option>
                  <option value="Library & Resources">Library & Resource Center</option>
                  <option value="Sports & Physical Education">Sports & Physical Education</option>
                  <option value="Front Desk & Reception">Front Desk / Admissions Desk</option>
                  <option value="Security & Safety">Security & Campus Safety</option>
                  <option value="General Operations">General Staff & Operations</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Designation / Title</label>
                <input type="text" [(ngModel)]="formData.designation" placeholder="e.g. Senior Bursar"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none" />
              </div>

              <!-- Password Field (Only when creating or optional on edit) -->
              <div *ngIf="!isEditing" class="sm:col-span-2">
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Login Password *</label>
                <div class="relative flex items-center">
                  <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="formData.password" placeholder="Enter secure password"
                         class="w-full pl-3 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none" />
                  <div class="absolute right-1 flex items-center gap-1">
                    <button type="button" (click)="generateStrongPassword()"
                            class="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L4.5 13.5h6L9.5 22 19.5 10.5h-6L13 2z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span>Generate</span>
                    </button>
                    <button type="button" (click)="showPassword = !showPassword"
                            class="p-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                      <svg *ngIf="!showPassword" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
                      </svg>
                      <svg *ngIf="showPassword" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-6.5 0-10-8-10-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="!isEditing">
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                <select [(ngModel)]="formData.status"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-400 outline-none cursor-pointer">
                  <option value="ACTIVE">Active (Immediate Login)</option>
                  <option value="INACTIVE">Inactive (Suspended)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Quick Permission Presets -->
          <div class="pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>2. 1-Click Permission Presets</span>
              </h4>
              <span class="text-[10px] text-slate-400">Clicking a preset autofills the exact feature switches</span>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button type="button" (click)="applyPreset('FEE')"
                      class="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                  <path d="M3 10h18M7 15h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                <span>Fee Manager Preset</span>
              </button>
              <button type="button" (click)="applyPreset('TRANSPORT')"
                      class="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-indigo-700" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="4" width="16" height="13" rx="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                  <path d="M4 11h16M7.5 17v2.5M16.5 17v2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                <span>Transport Dept Preset</span>
              </button>
              <button type="button" (click)="applyPreset('ADMIN')"
                      class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18h18M4 15l2-9 6 4 6-4 2 9H4z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Full Co-Admin Preset</span>
              </button>
              <button type="button" (click)="applyPreset('LIBRARY')"
                      class="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-purple-700" viewBox="0 0 24 24" fill="none">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Librarian Preset</span>
              </button>
              <button type="button" (click)="applyPreset('SPORTS')"
                      class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-700" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                  <path d="M12 7l3 2.2-1.1 3.5H10.1L9 9.2 12 7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                </svg>
                <span>Sports & PE Preset</span>
              </button>
              <button type="button" (click)="applyPreset('RECEPTION')"
                      class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-rose-700" viewBox="0 0 24 24" fill="none">
                  <path d="M4 17h16M6 17v-2a6 6 0 0112 0v2M12 7v2m-2-2h4" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Front Desk Preset</span>
              </button>
              <button type="button" (click)="applyPreset('SECURITY')"
                      class="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-cyan-700" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3l7 3v5c0 5-3.5 9.2-7 10-3.5-.8-7-5-7-10V6l7-3z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
                <span>Security Warden Preset</span>
              </button>
            </div>
          </div>

          <!-- Section 3: Granular Feature Access Checkboxes / Switches -->
          <div class="pt-4 border-t border-slate-100">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>3. Granular Feature Switches ({{ selectedPermissionsCount }}/{{ allSections.length }} Selected)</span>
                </h4>
                <p class="text-[11px] text-slate-500">Only enabled features will appear in this staff member's navigation sidebar upon login.</p>
              </div>

              <!-- Batch Toggles -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" (click)="selectAllPermissions()"
                        class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer">
                  Select All
                </button>
                <button type="button" (click)="deselectAllPermissions()"
                        class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg transition-colors cursor-pointer">
                  Deselect All
                </button>
              </div>
            </div>

            <!-- Categorized Feature List -->
            <div class="space-y-4">
              <div *ngFor="let cat of sectionCategories" class="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div class="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2.5">
                  <span class="text-xs font-black text-slate-900">{{ cat.name }}</span>
                  <span class="text-[10px] font-bold text-slate-500 font-mono">
                    {{ getSelectedCategoryCount(cat.name) }}/{{ cat.items.length }} Enabled
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div *ngFor="let item of cat.items"
                       (click)="togglePermission(item.id)"
                       class="p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer select-none"
                       [ngClass]="isPermissionSelected(item.id) 
                                   ? 'bg-white border-slate-900 shadow-2xs' 
                                   : 'bg-white/60 border-slate-200 hover:bg-white text-slate-500'">
                    
                    <input type="checkbox" [checked]="isPermissionSelected(item.id)"
                           (click)="$event.stopPropagation(); togglePermission(item.id)"
                           class="mt-0.5 rounded text-slate-900 focus:ring-slate-900 cursor-pointer" />

                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-xs" [ngClass]="isPermissionSelected(item.id) ? 'text-slate-900' : 'text-slate-700'">
                          {{ item.name }}
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-400 leading-tight mt-0.5">{{ item.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5h6L9.5 22 19.5 10.5h-6L13 2z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>Changes take effect immediately upon next user login.</span>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" (click)="closeUserModal()"
                    class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="button" (click)="saveUser()" [disabled]="saving"
                    class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <svg *ngIf="saving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ saving ? 'Saving Access...' : (isEditing ? 'Save Changes' : 'Create User Login') }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- RESET PASSWORD MODAL -->
    <div *ngIf="isPasswordModalOpen" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-scaleUp space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-slate-900">Reset Staff Password</h3>
          <button (click)="isPasswordModalOpen = false" class="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
        </div>
        <p class="text-xs text-slate-500">
          Resetting password for <strong>{{ targetUserForPassword?.name }}</strong> (<span class="font-mono text-slate-700">{{ targetUserForPassword?.email }}</span>).
        </p>

        <!-- Inactive Account Notice -->
        <div *ngIf="targetUserForPassword?.status === 'INACTIVE'" 
             class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
          <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>This account is currently <strong>Inactive</strong>. Toggle it to <strong>Active</strong> on their card after updating the password to allow them to log in.</span>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">New Password</label>
          <div class="relative flex items-center">
            <input [type]="showResetPass ? 'text' : 'password'" [(ngModel)]="newPasswordInput"
                   placeholder="Enter new password (min. 6 characters)"
                   autocomplete="new-password"
                   class="w-full pl-3 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-400" />
            <div class="absolute right-1 flex items-center gap-1">
              <button type="button" (click)="generateResetPassword()"
                      class="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-800 rounded-lg cursor-pointer flex items-center gap-1">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5h6L9.5 22 19.5 10.5h-6L13 2z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>Auto</span>
              </button>
              <button type="button" (click)="showResetPass = !showResetPass" class="p-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                <svg *ngIf="!showResetPass" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.8" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
                </svg>
                <svg *ngIf="showResetPass" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-6.5 0-10-8-10-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c6.5 0 10 8 10 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button type="button" (click)="isPasswordModalOpen = false"
                  class="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 cursor-pointer">
            Cancel
          </button>
          <button type="button" (click)="saveResetPassword()" [disabled]="resettingPass"
                  class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50">
            {{ resettingPass ? 'Resetting...' : 'Confirm Reset' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-clay-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-clay-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-clay-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }
    .custom-clay-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `],
})
export class StaffUsersComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  get canAccess(): boolean {
    return this.auth.canManageStaffUsers();
  }

  loading = true;
  seeding = false;
  saving = false;
  resettingPass = false;

  usersList: DepartmentalStaffUser[] = [];
  searchQuery = '';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  activeDepartment = 'All';

  get departmentsList(): string[] {
    const present = new Set<string>();
    for (const u of this.usersList) {
      if (u.department && u.department.trim()) {
        present.add(u.department.trim());
      }
    }
    return ['All', ...Array.from(present).sort()];
  }

  // Master List of all platform sections available for grant/revoke
  allSections: FeatureSectionDef[] = [
    { id: 'dashboard', name: 'Dashboard Overview', category: 'Core Operations', description: 'Metrics, widgets & campus summaries' },
    { id: 'academics', name: 'Academics Hub', category: 'Academics & Master Data', description: 'Academics core module root' },
    { id: 'academics_classes', name: 'Classes & Sections', category: 'Academics & Master Data', description: 'Manage grade divisions & room capacities' },
    { id: 'academics_students', name: 'Student Roster & Admissions', category: 'Academics & Master Data', description: 'Student register, enrollments & parent data' },
    { id: 'academics_alumni', name: 'Alumni & Transfer Certificates', category: 'Academics & Master Data', description: 'Permanent alumni directory & TC registry' },
    { id: 'academics_staff', name: 'Faculty & Staff Directory', category: 'Academics & Master Data', description: 'Teaching faculty profiles & assignments' },
    { id: 'academics_subjects', name: 'Curriculum Subjects Master', category: 'Academics & Master Data', description: 'Subjects, codes & curriculum records' },
    { id: 'timetable', name: 'Timetable Hub', category: 'Schedule & Operations', description: 'Campus routines & master timetable' },
    { id: 'timetable_student', name: 'Student Timetable', category: 'Schedule & Operations', description: 'Class period routines' },
    { id: 'timetable_faculty', name: 'Faculty Timetable', category: 'Schedule & Operations', description: 'Teacher period assignments' },
    { id: 'timetable_academic', name: 'Academic Calendar', category: 'Schedule & Operations', description: 'Term schedules & annual routines' },
    { id: 'attendance', name: 'Daily Attendance Register', category: 'Schedule & Operations', description: 'Student attendance marking & summaries' },
    { id: 'homework', name: 'Homework Center', category: 'Assessments & Learning', description: 'Assignments & student submissions' },
    { id: 'exams', name: 'Exams & Marksheets', category: 'Assessments & Learning', description: 'Exam schedules, marksheets & report cards' },
    { id: 'communication', name: 'Communication Hub', category: 'Campus Communications', description: 'Announcements & grievances root' },
    { id: 'communication_notices', name: 'Circulars & Notices', category: 'Campus Communications', description: 'Publish school circulars & alerts' },
    { id: 'communication_complaints', name: 'Grievance Desk', category: 'Campus Communications', description: 'Parent grievances & complaints' },
    { id: 'fees', name: 'Fee Management & Invoicing', category: 'Finance & Institutional', description: 'Student invoices, offline fee collections & receipts' },
    { id: 'transport', name: 'Transport Department & Fleet', category: 'Fleet & Logistics', description: 'Vehicles, routes, stops & student bus passes' },
    { id: 'subscription', name: 'Subscription & SaaS Wallet', category: 'Finance & Institutional', description: 'SaaS plan billing & SMS balance' },
  ];

  get sectionCategories(): { name: string; items: FeatureSectionDef[] }[] {
    const catsMap = new Map<string, FeatureSectionDef[]>();
    for (const sec of this.allSections) {
      if (!catsMap.has(sec.category)) {
        catsMap.set(sec.category, []);
      }
      catsMap.get(sec.category)!.push(sec);
    }
    return Array.from(catsMap.entries()).map(([name, items]) => ({ name, items }));
  }

  // Modal State
  isUserModalOpen = false;
  isEditing = false;
  showPassword = false;
  selectedUserId: string | null = null;

  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    role: string;
    password?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    custom_permissions: string[];
  } = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Fee & Accounts',
    designation: 'Accounts In-Charge',
    role: 'FEE_MANAGER',
    password: 'School@123',
    status: 'ACTIVE',
    custom_permissions: [],
  };

  // Password Reset Modal
  isPasswordModalOpen = false;
  targetUserForPassword: DepartmentalStaffUser | null = null;
  newPasswordInput = '';
  showResetPass = false;

  ngOnInit(): void {
    if (!this.canAccess) {
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.api.get<any>('departmental-users/overview').subscribe({
      next: (res) => {
        const rawList: DepartmentalStaffUser[] =
          res && Array.isArray(res.users) ? res.users : Array.isArray(res) ? res : [];
        const seen = new Set<string>();
        this.usersList = rawList.filter((u) => {
          if (!u || !u.id || seen.has(u.id)) return false;
          const r = (u.role || '').toUpperCase();
          if (r === 'SUPER_ADMIN' || r === 'PLATFORM_ADMIN' || r === 'BINARY') return false;
          if ((u.email || '').toLowerCase() === 'admin@schoolscence.in') return false;
          seen.add(u.id);
          return true;
        }).map((u) => {
          if (this.isPrimaryAdmin(u)) {
            u.custom_permissions = this.allSections.map((s) => s.id);
          }
          return u;
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filteredUsers(): DepartmentalStaffUser[] {
    if (this.activeDepartment !== 'All' && !this.departmentsList.includes(this.activeDepartment)) {
      this.activeDepartment = 'All';
    }

    return this.usersList.filter((u) => {
      // Status Filter
      if (this.statusFilter !== 'ALL' && u.status !== this.statusFilter) {
        return false;
      }

      // Department Filter
      if (this.activeDepartment !== 'All' && u.department !== this.activeDepartment) {
        return false;
      }

      // Search Query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchName = (u.name || `${u.first_name} ${u.last_name || ''}`).toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchDesig = (u.designation || '').toLowerCase().includes(q);
        const matchDept = (u.department || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchDesig && !matchDept) {
          return false;
        }
      }

      return true;
    });
  }

  get activeUsersCount(): number {
    return this.usersList.filter((u) => u.status === 'ACTIVE').length;
  }

  get feeDeptCount(): number {
    return this.usersList.filter((u) => u.department?.includes('Fee') || u.department?.includes('Account') || u.role === 'FEE_MANAGER').length;
  }

  get transportDeptCount(): number {
    return this.usersList.filter((u) => u.department?.includes('Transport') || u.role === 'TRANSPORT_MANAGER').length;
  }

  get specializedDeptCount(): number {
    return this.usersList.filter((u) => 
      u.department?.includes('Library') || 
      u.department?.includes('Sports') || 
      u.department?.includes('Security') || 
      u.department?.includes('Reception')
    ).length;
  }

  get selectedPermissionsCount(): number {
    return this.formData.custom_permissions.length;
  }

  getSelectedCategoryCount(categoryName: string): number {
    const items = this.allSections.filter((s) => s.category === categoryName);
    return items.filter((s) => this.formData.custom_permissions.includes(s.id)).length;
  }

  getSectionDisplayName(sectionId: string): string {
    const found = this.allSections.find((s) => s.id === sectionId);
    return found ? found.name : sectionId;
  }

  getDepartmentBadgeClass(dept: string): string {
    if (dept?.includes('Fee') || dept?.includes('Account')) return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (dept?.includes('Transport')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    if (dept?.includes('Admin')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
    if (dept?.includes('Library')) return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (dept?.includes('Sports')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (dept?.includes('Reception')) return 'bg-rose-100 text-rose-800 border border-rose-200';
    if (dept?.includes('Security')) return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
    return 'bg-slate-100 text-slate-800 border border-slate-200';
  }

  getDepartmentPillClass(dept: string): string {
    if (dept?.includes('Fee') || dept?.includes('Account')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (dept?.includes('Transport')) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    if (dept?.includes('Admin')) return 'bg-slate-100 text-slate-900 border-slate-300 font-bold';
    if (dept?.includes('Library')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (dept?.includes('Sports')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (dept?.includes('Reception')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (dept?.includes('Security')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  // Preset Applicator
  applyPreset(presetKey: string): void {
    if (presetKey === 'FEE') {
      this.formData.department = 'Fee & Accounts';
      this.formData.designation = 'Senior Accountant / Fee Manager';
      this.formData.role = 'FEE_MANAGER';
      this.formData.custom_permissions = [
        'dashboard',
        'fees',
        'academics',
        'academics_students',
        'academics_alumni',
        'communication',
        'communication_notices',
        'subscription',
      ];
    } else if (presetKey === 'TRANSPORT') {
      this.formData.department = 'Transport & Fleet';
      this.formData.designation = 'Transport Supervisor';
      this.formData.role = 'TRANSPORT_MANAGER';
      this.formData.custom_permissions = [
        'dashboard',
        'transport',
        'academics',
        'academics_students',
        'communication',
        'communication_notices',
      ];
    } else if (presetKey === 'ADMIN') {
      this.formData.department = 'Administration';
      this.formData.designation = 'Co-Administrator';
      this.formData.role = 'SCHOOL_ADMIN';
      this.formData.custom_permissions = this.allSections.map((s) => s.id);
    } else if (presetKey === 'LIBRARY') {
      this.formData.department = 'Library & Resources';
      this.formData.designation = 'Chief Librarian';
      this.formData.role = 'LIBRARIAN';
      this.formData.custom_permissions = [
        'dashboard',
        'academics',
        'academics_students',
        'academics_subjects',
        'communication',
        'communication_notices',
      ];
    } else if (presetKey === 'SPORTS') {
      this.formData.department = 'Sports & Physical Education';
      this.formData.designation = 'Sports & PE Director';
      this.formData.role = 'SPORTS_DIRECTOR';
      this.formData.custom_permissions = [
        'dashboard',
        'attendance',
        'academics',
        'academics_students',
        'communication',
        'communication_notices',
      ];
    } else if (presetKey === 'RECEPTION') {
      this.formData.department = 'Front Desk & Reception';
      this.formData.designation = 'Front Desk / Admissions Desk';
      this.formData.role = 'RECEPTIONIST';
      this.formData.custom_permissions = [
        'dashboard',
        'academics',
        'academics_students',
        'communication',
        'communication_notices',
        'communication_complaints',
      ];
    } else if (presetKey === 'SECURITY') {
      this.formData.department = 'Security & Safety';
      this.formData.designation = 'Chief Security Warden';
      this.formData.role = 'SECURITY_STAFF';
      this.formData.custom_permissions = [
        'dashboard',
        'transport',
        'academics',
        'academics_students',
        'communication',
        'communication_notices',
      ];
    }
    this.toast.info(`Applied ${presetKey} feature preset.`);
  }

  onDepartmentChange(): void {
    if (this.formData.department === 'Fee & Accounts') this.applyPreset('FEE');
    else if (this.formData.department === 'Transport & Fleet') this.applyPreset('TRANSPORT');
    else if (this.formData.department === 'Administration') this.applyPreset('ADMIN');
    else if (this.formData.department === 'Library & Resources') this.applyPreset('LIBRARY');
    else if (this.formData.department === 'Sports & Physical Education') this.applyPreset('SPORTS');
    else if (this.formData.department === 'Front Desk & Reception') this.applyPreset('RECEPTION');
    else if (this.formData.department === 'Security & Safety') this.applyPreset('SECURITY');
  }

  isPermissionSelected(secId: string): boolean {
    return this.formData.custom_permissions.includes(secId);
  }

  togglePermission(secId: string): void {
    const list = this.formData.custom_permissions;
    const idx = list.indexOf(secId);
    if (idx >= 0) {
      this.formData.custom_permissions = list.filter((id) => id !== secId);
    } else {
      const updated = [...list, secId];
      // If adding child section, auto-add parent if required
      const parentMap: Record<string, string> = {
        academics_classes: 'academics',
        academics_students: 'academics',
        academics_alumni: 'academics',
        academics_staff: 'academics',
        academics_subjects: 'academics',
        timetable_student: 'timetable',
        timetable_faculty: 'timetable',
        timetable_academic: 'timetable',
        communication_notices: 'communication',
        communication_complaints: 'communication',
      };
      const parentId = parentMap[secId];
      if (parentId && !updated.includes(parentId)) {
        updated.push(parentId);
      }
      this.formData.custom_permissions = updated;
    }
  }

  selectAllPermissions(): void {
    this.formData.custom_permissions = this.allSections.map((s) => s.id);
  }

  deselectAllPermissions(): void {
    this.formData.custom_permissions = [];
  }

  generateStrongPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = 'Sch@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.formData.password = pwd;
    this.showPassword = true;
  }

  generateResetPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = 'Pass@';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.newPasswordInput = pwd;
    this.showResetPass = true;
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selectedUserId = null;
    this.showPassword = false;
    this.formData = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: 'Fee & Accounts',
      designation: 'Fee Accountant',
      role: 'FEE_MANAGER',
      password: 'School@123',
      status: 'ACTIVE',
      custom_permissions: [
        'dashboard',
        'fees',
        'academics',
        'academics_students',
        'academics_alumni',
        'communication',
        'communication_notices',
        'subscription',
      ],
    };
    this.isUserModalOpen = true;
  }

  openEditModal(u: DepartmentalStaffUser): void {
    this.isEditing = true;
    this.selectedUserId = u.id;
    this.showPassword = false;
    this.formData = {
      first_name: u.first_name,
      last_name: u.last_name || '',
      email: u.email,
      phone: u.phone || '',
      department: u.department || 'Administration',
      designation: u.designation || u.role_name || u.role,
      role: u.role || 'STAFF',
      status: u.status || 'ACTIVE',
      custom_permissions: [...(u.custom_permissions || [])],
    };
    this.isUserModalOpen = true;
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
  }

  saveUser(): void {
    if (!this.formData.first_name.trim()) {
      this.toast.error('First name is required.');
      return;
    }
    if (!this.formData.email.trim() || !this.formData.email.includes('@')) {
      this.toast.error('Valid login email address is required.');
      return;
    }
    if (this.formData.custom_permissions.length === 0) {
      this.toast.error('Please grant at least one feature permission for this user.');
      return;
    }

    this.saving = true;

    if (this.isEditing && this.selectedUserId) {
      this.api.put(`departmental-users/${this.selectedUserId}`, this.formData).subscribe({
        next: () => {
          this.toast.success(`Updated feature permissions for ${this.formData.first_name}.`);
          this.saving = false;
          this.closeUserModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toast.error('Failed to update user: ' + (err.message || 'Unknown error'));
          this.saving = false;
        },
      });
    } else {
      this.api.post<DepartmentalStaffUser>('departmental-users', this.formData).subscribe({
        next: (created) => {
          this.toast.success(`Created login for ${created.name} (${this.formData.department}).`);
          this.saving = false;
          this.closeUserModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toast.error('Failed to create user: ' + (err.message || 'Unknown error'));
          this.saving = false;
        },
      });
    }
  }

  isPrimaryAdmin(u: DepartmentalStaffUser): boolean {
    if (!u) return false;
    const r = (u.role || '').toUpperCase();
    const desig = (u.designation || '').toLowerCase();
    const roleName = (u.role_name || '').toLowerCase();
    const currentUserId = this.auth.currentUser()?.id;

    if (r === 'SCHOOL_ADMIN' || r === 'PRINCIPAL') {
      return true;
    }
    if (roleName.includes('school admin') || desig.includes('school admin')) {
      return true;
    }
    if (currentUserId && u.id === currentUserId && this.auth.isAdmin()) {
      return true;
    }
    return false;
  }

  toggleUserStatus(u: DepartmentalStaffUser): void {
    if (this.isPrimaryAdmin(u)) {
      this.toast.error('The primary School Administrator cannot be made inactive.');
      return;
    }
    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api.put(`departmental-users/${u.id}`, { status: nextStatus }).subscribe({
      next: () => {
        u.status = nextStatus;
        if (nextStatus === 'ACTIVE') {
          this.toast.success(`Account for ${u.name} is now Active. Login access enabled.`);
        } else {
          this.toast.warning(`Account for ${u.name} is now Inactive. Login access is disabled.`);
        }
      },
      error: () => {
        this.toast.error('Failed to change status.');
      },
    });
  }

  openResetPasswordModal(u: DepartmentalStaffUser): void {
    this.targetUserForPassword = u;
    this.newPasswordInput = ''; // Cleared so modal never opens with a pre-filled password
    this.showResetPass = false;
    this.isPasswordModalOpen = true;
  }

  saveResetPassword(): void {
    if (!this.targetUserForPassword) return;
    const pwd = this.newPasswordInput.trim();
    if (!pwd) {
      this.toast.error('Please enter a new password or click Auto to generate one.');
      return;
    }
    if (pwd.length < 6) {
      this.toast.error('Password must be at least 6 characters long.');
      return;
    }

    this.resettingPass = true;
    this.api.post('departmental-users/reset-password', {
      userId: this.targetUserForPassword.id,
      newPassword: pwd,
    }).subscribe({
      next: (res: any) => {
        this.toast.success(`Password updated successfully for ${this.targetUserForPassword?.name}. They can now login with this new password.`);
        this.resettingPass = false;
        this.isPasswordModalOpen = false;
        this.newPasswordInput = '';
      },
      error: (err: any) => {
        this.toast.error(err?.message || 'Failed to reset password. Please check permissions.');
        this.resettingPass = false;
      },
    });
  }

  deleteUser(u: DepartmentalStaffUser): void {
    if (this.isPrimaryAdmin(u)) {
      this.toast.error('The primary School Administrator account cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to revoke and delete the login account for ${u.name}?`)) {
      return;
    }
    this.api.delete(`departmental-users/${u.id}`).subscribe({
      next: () => {
        this.toast.success(`Login revoked for ${u.name}.`);
        this.usersList = this.usersList.filter((x) => x.id !== u.id);
      },
      error: () => {
        this.toast.error('Failed to delete user.');
      },
    });
  }

  copyCredentials(u: DepartmentalStaffUser): void {
    const text = `SchoolSense Portal Login Details:\n• Name: ${u.name}\n• Department: ${u.department}\n• Role: ${u.designation || u.role_name}\n• Login Email: ${u.email}\n• Portal URL: ${window.location.origin}/login\n• Assigned Features: ${u.custom_permissions.join(', ')}`;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success(`Login details for ${u.name} copied to clipboard!`);
    }).catch(() => {
      this.toast.info(`Login Email: ${u.email}`);
    });
  }

  copyText(val: string, label: string): void {
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      this.toast.success(`Copied ${label} to clipboard!`);
    }).catch(() => {
      this.toast.info(val);
    });
  }

  seedSampleUsers(): void {
    this.seeding = true;
    this.api.post<any>('departmental-users/seed-samples', {}).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Seeded departmental user accounts.');
        this.seeding = false;
        this.loadUsers();
      },
      error: () => {
        this.toast.error('Failed to seed departmental users.');
        this.seeding = false;
      },
    });
  }
}
