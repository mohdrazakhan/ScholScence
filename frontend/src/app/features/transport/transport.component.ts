import { Component, OnInit, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalService } from '../../core/services/modal.service';
import { ExportService } from '../../core/services/export.service';
import {
  TransportVehicle,
  TransportRoute,
  TransportStop,
  StudentTransportAssignment,
  ClassItem,
  SectionItem,
  StudentItem,
} from '../../core/models';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      
      <!-- ============================================================== -->
      <!-- TOP HEADER & TITLE                                             -->
      <!-- ============================================================== -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff]">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8m-8 4h8m-4 8v-4m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM5 17h14M7 17a2 2 0 11-4 0 2 2 0 014 0zm14 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Transport Department & Fleet Logistics</h1>
              <p class="text-xs text-slate-500 mt-0.5">School fleet vehicles, route schedules, bus stops, driver details & student transport passes</p>
            </div>
          </div>
        </div>

        <!-- Header Action Buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Active Session Badge -->
          <div class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Session: <strong class="text-slate-900">{{ auth.activeSessionName() }}</strong></span>
          </div>

          <!-- Add Vehicle Button -->
          <button *ngIf="canManage && activeTab === 'FLEET'"
                  (click)="openAddVehicleModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Vehicle</span>
          </button>

          <!-- Create Route Button -->
          <button *ngIf="canManage && activeTab === 'ROUTES'"
                  (click)="openAddRouteModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Route</span>
          </button>

          <!-- Issue Bus Pass Button -->
          <button *ngIf="canManage && activeTab === 'PASSES'"
                  (click)="openIssuePassModal()"
                  class="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Issue Bus Pass</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- SUMMARY METRICS CARDS                                          -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric 1: Fleet Vehicles -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
            <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8m-8 4h8m-4 8v-4m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fleet Vehicles</div>
            <div class="text-xl font-black text-slate-900 mt-0.5">{{ loadingOverview ? '—' : (overview?.totalVehicles || vehicles.length) }} Buses</div>
            <div class="text-[10px] text-emerald-600 font-bold">{{ overview?.activeVehiclesCount || vehicles.length }} Active on Road</div>
          </div>
        </div>

        <!-- Metric 2: Active Routes -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
            <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Routes</div>
            <div class="text-xl font-black text-indigo-700 mt-0.5">{{ loadingOverview ? '—' : (overview?.totalRoutes || routes.length) }} Routes</div>
            <div class="text-[10px] text-slate-500">{{ overview?.totalStopsCount || 9 }} Pick-up Stops</div>
          </div>
        </div>

        <!-- Metric 3: Subscribed Students -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
            <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bus Subscriptions</div>
            <div class="text-xl font-black text-emerald-700 mt-0.5">{{ loadingOverview ? '—' : (overview?.subscribedStudentsCount || assignments.length) }} Students</div>
            <div class="text-[10px] text-slate-500">Fleet Occupancy: {{ overview?.fleetOccupancyRate || 65 }}%</div>
          </div>
        </div>

        <!-- Metric 4: Monthly Transport Revenue -->
        <div class="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
            <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Monthly Collection</div>
            <div class="text-xl font-black text-purple-700 mt-0.5">₹{{ (overview?.estimatedMonthlyTransportRevenue || 38400) | number:'1.0-0' }}</div>
            <div class="text-[10px] text-slate-500">Transport Bus Subscriptions</div>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- WORKSPACE NAVIGATION TABS                                      -->
      <!-- ============================================================== -->
      <div class="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button (click)="setTab('FLEET')"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                [ngClass]="activeTab === 'FLEET' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8m-8 4h8m-4 8v-4m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Fleet & Vehicles ({{ vehicles.length }})</span>
        </button>

        <button (click)="setTab('ROUTES')"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                [ngClass]="activeTab === 'ROUTES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>Routes & Stops ({{ routes.length }})</span>
        </button>

        <button (click)="setTab('PASSES')"
                class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                [ngClass]="activeTab === 'PASSES' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
          <span>Student Bus Passes & Roster ({{ assignments.length }})</span>
        </button>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 1: FLEET & VEHICLES                                        -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'FLEET'" class="space-y-4 animate-fadeIn">
        <div *ngIf="loadingVehicles" class="p-12 text-center text-slate-400 text-xs">
          <div class="w-6 h-6 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-2"></div>
          <span>Loading vehicle fleet records...</span>
        </div>

        <div *ngIf="!loadingVehicles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div *ngFor="let veh of vehicles"
               class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] flex flex-col justify-between hover:border-slate-300 transition-all group">
            
            <div>
              <!-- Vehicle Header & Type Badge -->
              <div class="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-xl bg-amber-100/90 border border-white text-amber-900 flex items-center justify-center shadow-[inset_1px_1px_2px_#ffffff,0_2px_5px_rgba(245,158,11,0.1)]">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="13" rx="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                      <path d="M4 11h16M7.5 17v2.5M16.5 17v2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      <circle cx="8" cy="14" r="1" fill="currentColor" />
                      <circle cx="16" cy="14" r="1" fill="currentColor" />
                    </svg>
                  </span>
                  <div>
                    <h3 class="font-black text-slate-900 text-sm tracking-tight">{{ veh.bus_number || veh.vehicle_number }}</h3>
                    <p class="text-[10px] text-slate-400 font-mono">{{ veh.vehicle_number }}</p>
                  </div>
                </div>

                <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border"
                      [ngClass]="veh.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                  {{ veh.status }}
                </span>
              </div>

              <!-- Vehicle Details Body -->
              <div class="py-3 space-y-2 text-xs">
                <div class="flex items-center justify-between text-slate-600">
                  <span class="text-slate-400 font-medium">Model / Make:</span>
                  <span class="font-bold text-slate-800">{{ veh.model || 'Standard School Bus' }}</span>
                </div>
                <div class="flex items-center justify-between text-slate-600">
                  <span class="text-slate-400 font-medium">Seating Capacity:</span>
                  <span class="font-black text-indigo-700">{{ veh.seating_capacity }} Seats</span>
                </div>
                <div class="flex items-center justify-between text-slate-600">
                  <span class="text-slate-400 font-medium">Driver In-Charge:</span>
                  <span class="font-bold text-slate-900">{{ veh.driver_name }}</span>
                </div>
                <div class="flex items-center justify-between text-slate-600">
                  <span class="text-slate-400 font-medium">Driver Contact:</span>
                  <a [href]="'tel:' + veh.driver_phone" class="font-bold text-indigo-600 hover:underline">{{ veh.driver_phone }}</a>
                </div>
                <div *ngIf="veh.conductor_name" class="flex items-center justify-between text-slate-600">
                  <span class="text-slate-400 font-medium">Conductor / Matron:</span>
                  <span class="font-medium text-slate-700">{{ veh.conductor_name }}</span>
                </div>
              </div>

              <!-- Compliance Expiry Badges -->
              <div class="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-[10px]">
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium inline-flex items-center gap-1" title="Insurance Expiry">
                  <svg class="w-3 h-3 text-slate-500" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l7 3v5c0 5-3.5 9.2-7 10-3.5-.8-7-5-7-10V6l7-3z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                  </svg>
                  <span>Ins: {{ veh.insurance_expiry ? (veh.insurance_expiry | date:'MMM yyyy') : 'Valid' }}</span>
                </span>
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium inline-flex items-center gap-1" title="Fitness Expiry">
                  <svg class="w-3 h-3 text-slate-500" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                    <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36l-1.41-1.41M7.05 7.05L5.64 5.64m12.72 0l-1.41 1.41M7.05 16.95l-1.41 1.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                  <span>Fitness: {{ veh.fitness_expiry ? (veh.fitness_expiry | date:'MMM yyyy') : 'Valid' }}</span>
                </span>
              </div>
            </div>

            <!-- Card Bottom Actions -->
            <div *ngIf="canManage" class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button (click)="openEditVehicleModal(veh)"
                      class="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                Edit
              </button>
              <button (click)="promptDeleteVehicle(veh)"
                      class="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                Delete
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 2: ROUTES & STOPS                                          -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'ROUTES'" class="space-y-4 animate-fadeIn">
        <div *ngIf="loadingRoutes" class="p-12 text-center text-slate-400 text-xs">
          <div class="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
          <span>Loading route itineraries...</span>
        </div>

        <div *ngIf="!loadingRoutes" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div *ngFor="let r of routes"
               class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] space-y-4">
            
            <!-- Route Header -->
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-mono font-black">{{ r.code }}</span>
                  <span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">{{ r.bus_number }}</span>
                </div>
                <h3 class="font-black text-slate-900 text-base mt-1">{{ r.name }}</h3>
                <p class="text-xs text-slate-500 mt-0.5">{{ r.description || 'Campus transport transit route' }}</p>
              </div>

              <div class="text-right">
                <span class="text-xs font-black text-slate-900">{{ r.assigned_students_count || 0 }}</span>
                <span class="text-[10px] text-slate-400 block font-medium">Students Enrolled</span>
              </div>
            </div>

            <!-- Route Timings & Assigned Driver -->
            <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Morning Pickup</span>
                <span class="font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                    <path d="M12 7.5v4.5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>{{ r.morning_start_time || '07:00 AM' }}</span>
                </span>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evening Drop</span>
                <span class="font-black text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8" />
                    <circle cx="12" cy="11" r="2" fill="currentColor" />
                  </svg>
                  <span>{{ r.evening_start_time || '02:30 PM' }}</span>
                </span>
              </div>
            </div>

            <!-- Sequential Stops Itinerary -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Itinerary & Bus Stops ({{ r.stops.length }})</span>
                <span class="text-[10px] text-slate-400 font-medium">Sequential pickup order</span>
              </div>

              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div *ngFor="let st of r.stops; let idx = index"
                     class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 bg-white hover:bg-slate-50 transition-colors text-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {{ idx + 1 }}
                    </span>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-900 truncate">{{ st.stop_name }}</p>
                      <p *ngIf="st.landmark" class="text-[10px] text-slate-400 truncate">{{ st.landmark }}</p>
                    </div>
                  </div>

                  <div class="text-right shrink-0 flex items-center gap-3">
                    <span class="font-mono text-slate-600 font-bold text-[11px]">{{ st.pickup_time }}</span>
                    <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                      {{ st.monthly_fare > 0 ? ('₹' + st.monthly_fare) : 'Campus Gate' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Route Actions -->
            <div *ngIf="canManage" class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button (click)="openEditRouteModal(r)"
                      class="px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                Edit Route
              </button>
              <button (click)="promptDeleteRoute(r)"
                      class="px-3 py-1.5 font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer">
                Delete Route
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- TAB 3: STUDENT BUS PASSES & ROSTER                             -->
      <!-- ============================================================== -->
      <div *ngIf="activeTab === 'PASSES'" class="space-y-4 animate-fadeIn">
        
        <!-- Filter & Search Bar -->
        <div class="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3 flex-wrap flex-1">
            <!-- Search -->
            <div class="relative min-w-[240px] flex-1">
              <input type="text"
                     [(ngModel)]="passSearchQuery"
                     placeholder="Search student, pass no, or admission no..."
                     class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all" />
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Route Filter -->
            <select [(ngModel)]="selectedRouteFilter"
                    class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none">
              <option value="ALL">All Routes</option>
              <option *ngFor="let r of routes" [value]="r.id">{{ r.name }}</option>
            </select>
          </div>

          <!-- Export CSV -->
          <button (click)="exportTransportRosterCsv()"
                  class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Roster CSV</span>
          </button>
        </div>

        <!-- Student Transport Roster Table -->
        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-[4px_4px_12px_#d9e2ec,-4px_-4px_12px_#ffffff] overflow-hidden">
          <div *ngIf="loadingAssignments" class="p-12 text-center text-slate-400 text-xs">
            <div class="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading student transport rosters...</span>
          </div>

          <div *ngIf="!loadingAssignments" class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-3.5 px-4">Pass No / Student</th>
                  <th class="py-3.5 px-4">Class & Section</th>
                  <th class="py-3.5 px-4">Route & Vehicle</th>
                  <th class="py-3.5 px-4">Stop & Pickup Time</th>
                  <th class="py-3.5 px-4">Monthly Fare</th>
                  <th class="py-3.5 px-4">Emergency Contact</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let a of filteredAssignments" class="hover:bg-slate-50/70 transition-colors group">
                  
                  <!-- Student Info -->
                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                        {{ a.student_name.slice(0, 1) }}
                      </div>
                      <div>
                        <span class="font-bold text-slate-900 block">{{ a.student_name }}</span>
                        <span class="text-[10px] font-mono text-slate-400">Pass: {{ a.pass_number }} | Adm: {{ a.admission_number }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Class -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-800">{{ a.class_name }}</span>
                    <span class="text-slate-500 block text-[10px]">{{ a.section_name }}</span>
                  </td>

                  <!-- Route -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-indigo-700 block">{{ a.route_name }}</span>
                    <span class="text-[10px] text-slate-500 font-medium">{{ a.bus_number }} (Seat: {{ a.seat_number || 'S-01' }})</span>
                  </td>

                  <!-- Stop & Time -->
                  <td class="py-3.5 px-4">
                    <span class="font-bold text-slate-900 block">{{ a.stop_name }}</span>
                    <span class="text-[10px] font-mono text-emerald-700 font-bold">Pickup: {{ a.pickup_time }}</span>
                  </td>

                  <!-- Fare -->
                  <td class="py-3.5 px-4">
                    <span class="font-black text-slate-900">₹{{ a.monthly_fare || 1200 }}</span>
                    <span class="text-[9px] text-slate-400 block font-medium">/ month</span>
                  </td>

                  <!-- Contact -->
                  <td class="py-3.5 px-4">
                    <span class="text-slate-800 font-bold block">{{ a.guardian_name || 'Guardian' }}</span>
                    <a [href]="'tel:' + (a.emergency_contact || a.guardian_phone)" class="text-[10px] text-indigo-600 hover:underline">
                      {{ a.emergency_contact || a.guardian_phone || '—' }}
                    </a>
                  </td>

                  <!-- Actions -->
                  <td class="py-3.5 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="printStudentBusPass(a)"
                              title="Print Physical Bus Pass Card"
                              class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Print Pass</span>
                      </button>

                      <button *ngIf="canManage"
                              (click)="promptDeleteAssignment(a)"
                              title="Cancel Transport Subscription"
                              class="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredAssignments.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-400 text-xs">
                    No student bus pass subscriptions found matching criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ADD / EDIT VEHICLE                                      -->
      <!-- ============================================================== -->
      <div *ngIf="showVehicleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeVehicleModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-black text-slate-900 text-base">{{ isEditingVehicle ? 'Edit Fleet Vehicle' : 'Add New Fleet Vehicle' }}</h3>
            <button (click)="closeVehicleModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"><svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Registration No *</label>
                <input type="text" [(ngModel)]="vehicleForm.vehicle_number" placeholder="DL-01-AB-1234" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Bus / Van Label</label>
                <input type="text" [(ngModel)]="vehicleForm.bus_number" placeholder="Bus #04" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                <select [(ngModel)]="vehicleForm.vehicle_type" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="BUS">School Bus (40S)</option>
                  <option value="MINI_BUS">Mini Bus (25S)</option>
                  <option value="VAN">School Van (18S)</option>
                  <option value="CAB">Staff Cab</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Seating Capacity</label>
                <input type="number" [(ngModel)]="vehicleForm.seating_capacity" placeholder="40" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Driver Name *</label>
                <input type="text" [(ngModel)]="vehicleForm.driver_name" placeholder="Driver Full Name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Driver Phone *</label>
                <input type="text" [(ngModel)]="vehicleForm.driver_phone" placeholder="+91 98765 43210" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Conductor / Matron</label>
                <input type="text" [(ngModel)]="vehicleForm.conductor_name" placeholder="Conductor Name" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">GPS Device ID</label>
                <input type="text" [(ngModel)]="vehicleForm.gps_device_id" placeholder="GPS-LIVE-01" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>
            </div>
          </div>

          <div *ngIf="vehicleModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ vehicleModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeVehicleModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="saveVehicle()" [disabled]="savingVehicle" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ savingVehicle ? 'Saving...' : 'Save Vehicle' }}
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: CREATE / EDIT ROUTE                                     -->
      <!-- ============================================================== -->
      <div *ngIf="showRouteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeRouteModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-black text-slate-900 text-base">{{ isEditingRoute ? 'Edit Route & Stops' : 'Create Transport Route' }}</h3>
            <button (click)="closeRouteModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"><svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Route Name *</label>
                <input type="text" [(ngModel)]="routeForm.name" placeholder="Route 1: City Center to School" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Route Code *</label>
                <input type="text" [(ngModel)]="routeForm.code" placeholder="RT-01" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Assigned Vehicle</label>
                <select [(ngModel)]="routeForm.vehicle_id" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option *ngFor="let v of vehicles" [value]="v.id">{{ v.bus_number || v.vehicle_number }} ({{ v.driver_name }})</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Morning Pickup</label>
                <input type="text" [(ngModel)]="routeForm.morning_start_time" placeholder="07:00 AM" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Evening Drop</label>
                <input type="text" [(ngModel)]="routeForm.evening_start_time" placeholder="02:30 PM" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>
            </div>

            <!-- Route Stops Builder -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900">Sequential Stops & Monthly Fares</span>
                <button type="button" (click)="addRouteStopRow()" class="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-1">
                  + Add Stop
                </button>
              </div>

              <div class="space-y-2">
                <div *ngFor="let st of routeForm.stops; let i = index" class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-12 gap-2 items-center">
                  <div class="col-span-1 text-center font-bold text-slate-400">#{{ i + 1 }}</div>
                  <div class="col-span-4">
                    <input type="text" [(ngModel)]="st.stop_name" placeholder="Stop Name / Landmark" class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div class="col-span-3">
                    <input type="text" [(ngModel)]="st.pickup_time" placeholder="07:15 AM" class="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium" />
                  </div>
                  <div class="col-span-3">
                    <input type="number" [(ngModel)]="st.monthly_fare" placeholder="₹1200" class="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                  </div>
                  <div class="col-span-1 text-right">
                    <button *ngIf="routeForm.stops.length > 1" (click)="removeRouteStopRow(i)" class="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"><svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="routeModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ routeModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeRouteModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="saveRoute()" [disabled]="savingRoute" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ savingRoute ? 'Saving...' : 'Save Route' }}
            </button>
          </div>

        </div>
      </div>

      <!-- ============================================================== -->
      <!-- MODAL: ISSUE STUDENT BUS PASS                                  -->
      <!-- ============================================================== -->
      <div *ngIf="showIssuePassModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" (click)="closeIssuePassModal()"></div>
        <div class="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 z-10 animate-scaleUp space-y-4">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="font-black text-slate-900 text-base">Issue Student Bus Pass</h3>
            <button (click)="closeIssuePassModal()" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"><svg class="w-3.5 h-3.5 inline-block" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Class & Section</label>
              <select [(ngModel)]="passSelectedClassId" (change)="onPassClassChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Choose Class --</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Student *</label>
              <select [(ngModel)]="passSelectedStudentId" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Choose Student --</option>
                <option *ngFor="let st of availableStudentsForPass" [value]="st.id || st.studentId">
                  {{ st.fullName }} (Adm: {{ st.admissionNumber }})
                </option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Transport Route *</label>
              <select [(ngModel)]="passSelectedRouteId" (change)="onPassRouteChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Choose Route --</option>
                <option *ngFor="let r of routes" [value]="r.id">{{ r.name }} ({{ r.bus_number }})</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Pick-up / Drop Stop *</label>
              <select [(ngModel)]="passSelectedStopId" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Choose Stop --</option>
                <option *ngFor="let st of availableStopsForSelectedRoute" [value]="st.id">
                  {{ st.stop_name }} ({{ st.pickup_time }}) - ₹{{ st.monthly_fare }}/mo
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Seat Number</label>
                <input type="text" [(ngModel)]="passSeatNumber" placeholder="S-14" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Emergency Phone</label>
                <input type="text" [(ngModel)]="passEmergencyPhone" placeholder="+91 98765 43210" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>
          </div>

          <div *ngIf="issuePassModalError" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ issuePassModalError }}
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button (click)="closeIssuePassModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
            <button (click)="saveIssuePass()" [disabled]="savingPass" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50">
              {{ savingPass ? 'Issuing...' : 'Issue Bus Pass' }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class TransportComponent implements OnInit {
  activeTab: 'FLEET' | 'ROUTES' | 'PASSES' = 'FLEET';

  vehicles: TransportVehicle[] = [];
  routes: TransportRoute[] = [];
  assignments: StudentTransportAssignment[] = [];
  classes: ClassItem[] = [];
  overview: any = null;

  loadingVehicles = false;
  loadingRoutes = false;
  loadingAssignments = false;
  loadingOverview = false;

  passSearchQuery = '';
  selectedRouteFilter = 'ALL';

  // Vehicle Modal
  showVehicleModal = false;
  isEditingVehicle = false;
  savingVehicle = false;
  vehicleModalError = '';
  vehicleForm: any = {
    id: '',
    vehicle_number: '',
    bus_number: '',
    vehicle_type: 'BUS',
    model: 'Tata Starbus',
    seating_capacity: 40,
    driver_name: '',
    driver_phone: '',
    conductor_name: '',
    gps_device_id: '',
  };

  // Route Modal
  showRouteModal = false;
  isEditingRoute = false;
  savingRoute = false;
  routeModalError = '';
  routeForm: any = {
    id: '',
    name: '',
    code: '',
    vehicle_id: '',
    morning_start_time: '07:00 AM',
    evening_start_time: '02:30 PM',
    description: '',
    stops: [
      { stop_name: 'Metro Station Gate 1', pickup_time: '07:15 AM', drop_time: '03:00 PM', sequence_order: 1, monthly_fare: 1400 },
      { stop_name: 'Main Market Circle', pickup_time: '07:25 AM', drop_time: '02:50 PM', sequence_order: 2, monthly_fare: 1200 },
      { stop_name: 'Campus Gate 1', pickup_time: '07:45 AM', drop_time: '02:30 PM', sequence_order: 3, monthly_fare: 0 },
    ],
  };

  // Issue Pass Modal
  showIssuePassModal = false;
  savingPass = false;
  issuePassModalError = '';
  passSelectedClassId = '';
  passSelectedStudentId = '';
  passSelectedRouteId = '';
  passSelectedStopId = '';
  passSeatNumber = 'S-01';
  passEmergencyPhone = '';
  availableStudentsForPass: StudentItem[] = [];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private toast: ToastService,
    private modalService: ModalService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    effect(() => {
      // Re-load transport data whenever active academic session changes
      this.auth.activeAcademicSession();
      this.loadAllData();
    });
  }

  get canManage(): boolean {
    return this.auth.isAdmin() || this.auth.isSuperAdmin() || this.auth.isPrincipal();
  }

  get filteredAssignments(): StudentTransportAssignment[] {
    let list = this.assignments;
    if (this.selectedRouteFilter !== 'ALL') {
      list = list.filter((a) => a.route_id === this.selectedRouteFilter);
    }
    if (!this.passSearchQuery.trim()) return list;
    const q = this.passSearchQuery.toLowerCase().trim();
    return list.filter(
      (a) =>
        a.student_name.toLowerCase().includes(q) ||
        a.admission_number.toLowerCase().includes(q) ||
        a.pass_number.toLowerCase().includes(q) ||
        (a.class_name && a.class_name.toLowerCase().includes(q)) ||
        (a.stop_name && a.stop_name.toLowerCase().includes(q))
    );
  }

  get availableStopsForSelectedRoute(): TransportStop[] {
    if (!this.passSelectedRouteId) return [];
    const r = this.routes.find((item) => item.id === this.passSelectedRouteId);
    return r?.stops || [];
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = (params['tab'] || '').toUpperCase();
      if (tab === 'FLEET' || tab === 'ROUTES' || tab === 'PASSES') {
        this.activeTab = tab;
      }
    });
  }

  setTab(tab: 'FLEET' | 'ROUTES' | 'PASSES') {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.toLowerCase() },
      queryParamsHandling: 'merge',
    });
  }

  loadAllData() {
    const sessionId = this.auth.activeAcademicSession()?.id;
    this.loadingOverview = true;
    this.loadingVehicles = true;
    this.loadingRoutes = true;
    this.loadingAssignments = true;

    this.api.get<any>('transport/overview-full', sessionId ? { academicYearId: sessionId } : undefined).subscribe({
      next: (res) => {
        if (res) {
          this.overview = res.overview || null;
          this.vehicles = res.vehicles || [];
          this.routes = res.routes || [];
          this.assignments = res.passes || [];
          this.classes = res.classes || [];
        }
        this.loadingOverview = false;
        this.loadingVehicles = false;
        this.loadingRoutes = false;
        this.loadingAssignments = false;
      },
      error: () => {
        this.loadingOverview = false;
        this.loadingVehicles = false;
        this.loadingRoutes = false;
        this.loadingAssignments = false;
      },
    });
  }

  // Vehicle Modal Handlers
  openAddVehicleModal() {
    this.isEditingVehicle = false;
    this.vehicleForm = {
      id: '',
      vehicle_number: '',
      bus_number: `Bus #${this.vehicles.length + 1}`,
      vehicle_type: 'BUS',
      model: 'Tata Starbus Ultra',
      seating_capacity: 40,
      driver_name: '',
      driver_phone: '',
      conductor_name: '',
      gps_device_id: `GPS-BUS-0${this.vehicles.length + 1}`,
    };
    this.vehicleModalError = '';
    this.showVehicleModal = true;
  }

  openEditVehicleModal(veh: TransportVehicle) {
    this.isEditingVehicle = true;
    this.vehicleForm = { ...veh };
    this.vehicleModalError = '';
    this.showVehicleModal = true;
  }

  closeVehicleModal() {
    this.showVehicleModal = false;
  }

  saveVehicle() {
    if (!this.vehicleForm.vehicle_number?.trim() || !this.vehicleForm.driver_name?.trim()) {
      this.vehicleModalError = 'Registration Number and Driver Name are required.';
      return;
    }
    this.savingVehicle = true;
    this.vehicleModalError = '';

    const req = this.isEditingVehicle
      ? this.api.put(`transport/vehicles/${this.vehicleForm.id}`, this.vehicleForm)
      : this.api.post('transport/vehicles', this.vehicleForm);

    req.subscribe({
      next: () => {
        this.savingVehicle = false;
        this.closeVehicleModal();
        this.toast.success('Fleet vehicle saved successfully.');
        this.loadAllData();
      },
      error: (err: any) => {
        this.savingVehicle = false;
        this.vehicleModalError = err.message || 'Failed to save vehicle.';
      },
    });
  }

  promptDeleteVehicle(veh: TransportVehicle) {
    if (!confirm(`Are you sure you want to remove ${veh.bus_number || veh.vehicle_number} from the fleet?`)) {
      return;
    }
    this.api.delete(`transport/vehicles/${veh.id}`).subscribe({
      next: () => {
        this.toast.success('Vehicle removed from fleet.');
        this.loadAllData();
      },
    });
  }

  // Route Modal Handlers
  openAddRouteModal() {
    this.isEditingRoute = false;
    this.routeForm = {
      id: '',
      name: `Route ${this.routes.length + 1}: Transit Route`,
      code: `RT-0${this.routes.length + 1}`,
      vehicle_id: this.vehicles[0]?.id || '',
      morning_start_time: '07:00 AM',
      evening_start_time: '02:30 PM',
      description: 'Daily morning and afternoon student commute',
      stops: [
        { stop_name: 'Main Metro Point', pickup_time: '07:15 AM', drop_time: '03:00 PM', sequence_order: 1, monthly_fare: 1300 },
        { stop_name: 'School Campus Gate 1', pickup_time: '07:45 AM', drop_time: '02:30 PM', sequence_order: 2, monthly_fare: 0 },
      ],
    };
    this.routeModalError = '';
    this.showRouteModal = true;
  }

  openEditRouteModal(r: TransportRoute) {
    this.isEditingRoute = true;
    this.routeForm = {
      ...r,
      stops: r.stops && r.stops.length > 0 ? [...r.stops] : [
        { stop_name: 'Main Stop', pickup_time: '07:15 AM', drop_time: '03:00 PM', sequence_order: 1, monthly_fare: 1200 },
      ],
    };
    this.routeModalError = '';
    this.showRouteModal = true;
  }

  closeRouteModal() {
    this.showRouteModal = false;
  }

  addRouteStopRow() {
    this.routeForm.stops.push({
      stop_name: '',
      pickup_time: '07:20 AM',
      drop_time: '02:50 PM',
      sequence_order: this.routeForm.stops.length + 1,
      monthly_fare: 1200,
    });
  }

  removeRouteStopRow(index: number) {
    this.routeForm.stops.splice(index, 1);
  }

  saveRoute() {
    if (!this.routeForm.name?.trim() || !this.routeForm.code?.trim()) {
      this.routeModalError = 'Route Name and Route Code are required.';
      return;
    }
    this.savingRoute = true;
    this.routeModalError = '';
    const sessionId = this.auth.activeAcademicSession()?.id;

    const payload = {
      ...this.routeForm,
      academic_year_id: sessionId,
    };

    const req = this.isEditingRoute
      ? this.api.put(`transport/routes/${this.routeForm.id}`, payload)
      : this.api.post('transport/routes', payload);

    req.subscribe({
      next: () => {
        this.savingRoute = false;
        this.closeRouteModal();
        this.toast.success('Route itinerary and stops saved.');
        this.loadAllData();
      },
      error: (err: any) => {
        this.savingRoute = false;
        this.routeModalError = err.message || 'Failed to save route.';
      },
    });
  }

  promptDeleteRoute(r: TransportRoute) {
    if (!confirm(`Are you sure you want to delete route "${r.name}"?`)) return;
    this.api.delete(`transport/routes/${r.id}`).subscribe({
      next: () => {
        this.toast.success('Route deleted successfully.');
        this.loadAllData();
      },
    });
  }

  // Issue Pass Modal Handlers
  openIssuePassModal() {
    this.passSelectedClassId = this.classes[0]?.id || '';
    this.passSelectedRouteId = this.routes[0]?.id || '';
    this.passSeatNumber = `S-${Math.floor(1 + Math.random() * 30)}`;
    this.passEmergencyPhone = '+91 98765 43210';
    this.issuePassModalError = '';
    this.onPassClassChange();
    this.onPassRouteChange();
    this.showIssuePassModal = true;
  }

  closeIssuePassModal() {
    this.showIssuePassModal = false;
  }

  onPassClassChange() {
    if (!this.passSelectedClassId) {
      this.availableStudentsForPass = [];
      return;
    }
    const cls = this.classes.find((c) => c.id === this.passSelectedClassId);
    const secId = cls?.sections?.[0]?.id;
    if (secId) {
      this.api.get<StudentItem[]>(`academics/sections/${secId}/students`).subscribe({
        next: (res) => {
          this.availableStudentsForPass = res || [];
          if (this.availableStudentsForPass.length > 0) {
            this.passSelectedStudentId = this.availableStudentsForPass[0].id || this.availableStudentsForPass[0].studentId || '';
          }
        },
      });
    }
  }

  onPassRouteChange() {
    const r = this.routes.find((item) => item.id === this.passSelectedRouteId);
    if (r && r.stops && r.stops.length > 0) {
      this.passSelectedStopId = r.stops[0].id;
    } else {
      this.passSelectedStopId = '';
    }
  }

  saveIssuePass() {
    if (!this.passSelectedStudentId || !this.passSelectedRouteId || !this.passSelectedStopId) {
      this.issuePassModalError = 'Student, Route, and Stop selection are required.';
      return;
    }
    this.savingPass = true;
    this.issuePassModalError = '';

    const st = this.availableStudentsForPass.find((s) => (s.id || s.studentId) === this.passSelectedStudentId);
    const r = this.routes.find((item) => item.id === this.passSelectedRouteId);
    const stop = r?.stops?.find((s) => s.id === this.passSelectedStopId);

    const sessionId = this.auth.activeAcademicSession()?.id;
    const payload = {
      academic_year_id: sessionId,
      student_id: this.passSelectedStudentId,
      student_name: st?.fullName,
      admission_number: st?.admissionNumber,
      class_name: st?.className || 'Class',
      section_name: st?.sectionName || 'Section A',
      route_id: this.passSelectedRouteId,
      route_name: r?.name,
      route_code: r?.code,
      stop_id: this.passSelectedStopId,
      stop_name: stop?.stop_name,
      pickup_time: stop?.pickup_time,
      drop_time: stop?.drop_time,
      monthly_fare: stop?.monthly_fare || 1200,
      seat_number: this.passSeatNumber,
      emergency_contact: this.passEmergencyPhone,
    };

    this.api.post('transport/assignments', payload).subscribe({
      next: () => {
        this.savingPass = false;
        this.closeIssuePassModal();
        this.toast.success(`Bus Pass issued for ${st?.fullName || 'Student'}!`);
        this.loadAllData();
      },
      error: (err: any) => {
        this.savingPass = false;
        this.issuePassModalError = err.message || 'Failed to issue bus pass.';
      },
    });
  }

  promptDeleteAssignment(a: StudentTransportAssignment) {
    if (!confirm(`Cancel transport pass for "${a.student_name}"?`)) return;
    this.api.delete(`transport/assignments/${a.id}`).subscribe({
      next: () => {
        this.toast.success('Transport subscription removed.');
        this.loadAllData();
      },
    });
  }

  exportTransportRosterCsv() {
    const rows = this.filteredAssignments.map((a) => ({
      passNumber: a.pass_number,
      studentName: a.student_name,
      admissionNumber: a.admission_number,
      classSection: `${a.class_name} - ${a.section_name}`,
      routeName: a.route_name,
      busNumber: a.bus_number,
      stopName: a.stop_name,
      pickupTime: a.pickup_time,
      seatNumber: a.seat_number,
      monthlyFare: a.monthly_fare,
      emergencyContact: a.emergency_contact || a.guardian_phone,
    }));

    this.exportService.exportToCsv(
      `Transport_Roster_${this.selectedRouteFilter}`,
      rows,
      [
        { key: 'passNumber', label: 'Pass Number' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'admissionNumber', label: 'Admission No' },
        { key: 'classSection', label: 'Class & Section' },
        { key: 'routeName', label: 'Bus Route' },
        { key: 'busNumber', label: 'Bus Label' },
        { key: 'stopName', label: 'Assigned Stop' },
        { key: 'pickupTime', label: 'Morning Pickup' },
        { key: 'seatNumber', label: 'Seat No' },
        { key: 'monthlyFare', label: 'Monthly Fare (INR)' },
        { key: 'emergencyContact', label: 'Emergency Contact' },
      ]
    );
    this.toast.success('Transport Roster CSV downloaded!');
  }

  // Print Formatted Student Bus Pass Card
  printStudentBusPass(a: StudentTransportAssignment) {
    const schoolName = this.auth.currentUser()?.school?.name || 'SchoolSense Academy';
    const schoolLogo = this.auth.currentUser()?.school?.logoUrl || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Bus Pass - ${a.student_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; display: flex; justify-content: center; background: #f1f5f9; }
          .pass-card { width: 380px; background: #ffffff; border: 2px solid #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .pass-header { background: #0f172a; color: white; padding: 16px 20px; text-align: center; }
          .school-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .pass-tag { display: inline-block; background: #f59e0b; color: #000; font-size: 10px; font-weight: 900; padding: 2px 10px; border-radius: 12px; margin-top: 6px; letter-spacing: 0.5px; }
          .pass-body { padding: 20px; }
          .student-row { display: flex; gap: 14px; align-items: center; margin-bottom: 16px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 14px; }
          .photo-box { width: 65px; height: 75px; background: #e2e8f0; border-radius: 8px; border: 1px solid #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #64748b; }
          .student-info h4 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
          .student-info p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
          .route-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 14px; font-size: 11px; line-height: 1.6; }
          .route-box strong { color: #0f172a; }
          .route-box span { color: #475569; }
          .barcode-box { text-align: center; font-family: monospace; font-size: 13px; font-weight: 900; letter-spacing: 3px; color: #0f172a; border-top: 1px solid #f1f5f9; padding-top: 10px; }
          .pass-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px 16px; font-size: 9px; color: #64748b; text-align: center; }
          @media print { body { padding: 0; background: none; } .pass-card { box-shadow: none; border: 1px solid #000; } }
        </style>
      </head>
      <body>
        <div class="pass-card">
          <div class="pass-header">
            <div class="school-title">${schoolName}</div>
            <div class="pass-tag">OFFICIAL STUDENT BUS PASS</div>
          </div>
          <div class="pass-body">
            <div class="student-row">
              <div class="photo-box">PHOTO</div>
              <div class="student-info">
                <h4>${a.student_name}</h4>
                <p>Class: <strong>${a.class_name} (${a.section_name})</strong></p>
                <p>Adm No: <strong>${a.admission_number}</strong></p>
                <p>Seat: <strong style="color: #4f46e5;">${a.seat_number || 'S-12'}</strong></p>
              </div>
            </div>
            <div class="route-box">
              <div><strong>Route:</strong> <span>${a.route_name}</span></div>
              <div><strong>Bus:</strong> <span>${a.bus_number}</span></div>
              <div><strong>Pickup Stop:</strong> <span>${a.stop_name}</span></div>
              <div><strong>Pickup Time:</strong> <span>${a.pickup_time}</span></div>
              <div><strong>Emergency Phone:</strong> <span>${a.emergency_contact || a.guardian_phone || '—'}</span></div>
            </div>
            <div class="barcode-box">
              ||||| | |||| ||| ||||||| |<br>
              ${a.pass_number}
            </div>
          </div>
          <div class="pass-footer">
            Institutional Fleet Card • Non-Transferable • Valid for Academic Year
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
