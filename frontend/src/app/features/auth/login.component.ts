import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface SchoolItem {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  address_line1?: string;
  phone?: string;
  email?: string;
  motto?: string;
  affiliation?: string;
}

const DEFAULT_SCHOOLS: SchoolItem[] = [
  {
    id: 'dis-001',
    code: 'DIS001',
    name: 'Demo International School',
    city: 'New Delhi',
    state: 'Delhi',
    address_line1: 'Sector 14, Dwarka, New Delhi - 110075',
    email: 'contact@dis-delhi.edu.in',
    phone: '011-28765432',
    motto: 'Excellence in Academics & Moral Leadership',
    affiliation: 'Affiliated to CBSE • New Delhi (Affiliation # 2130045)',
  },
  {
    id: 'sxw-002',
    code: 'SXW002',
    name: "St. Xavier's World School",
    city: 'Mumbai',
    state: 'Maharashtra',
    address_line1: 'Bandra West, Mumbai, Maharashtra - 400050',
    email: 'info@stxaviersmumbai.org',
    phone: '022-26549870',
    motto: 'Fortitude, Character & Enlightenment',
    affiliation: 'Affiliated to ICSE / ISC Board • Mumbai',
  },
  {
    id: 'gha-003',
    code: 'GHA003',
    name: 'Greenwood High Academy',
    city: 'Bengaluru',
    state: 'Karnataka',
    address_line1: 'Sarjapur Road, Bengaluru, Karnataka - 560087',
    email: 'admissions@greenwoodhigh.edu.in',
    phone: '080-45678901',
    motto: 'Rooted in Values, Ready for the Global Future',
    affiliation: 'IB World School & CBSE Affiliation',
  },
  {
    id: 'nps-004',
    code: 'NPS004',
    name: 'National Public Model School',
    city: 'Hyderabad',
    state: 'Telangana',
    address_line1: 'Hitec City, Madhapur, Hyderabad, Telangana - 500081',
    email: 'office@npms-hyd.ac.in',
    phone: '040-23456789',
    motto: 'Inspiring Inquisitive Minds & Integrity',
    affiliation: 'CBSE Affiliated Senior Secondary Institution',
  },
  {
    id: 'ois-005',
    code: 'OIS005',
    name: 'Oakridge International School',
    city: 'Kolkata',
    state: 'West Bengal',
    address_line1: 'Salt Lake Sector V, Kolkata, West Bengal - 700091',
    email: 'desk@oakridge-kol.edu.in',
    phone: '033-22894560',
    motto: 'Tradition of Academic Distinction & Innovation',
    affiliation: 'WBBSE & CBSE Recognized Campus',
  },
  {
    id: 'sys-000',
    code: 'SYS000',
    name: 'SchoolSense Central Console (Platform / Developer)',
    city: 'National Operations',
    state: 'Haryana',
    address_line1: 'Cyber City, Gurugram, Haryana - 122002',
    email: 'dev@schoolsense.in',
    phone: '1800-889-7246',
    motto: 'Unified Multi-Tenant Institutional Governance',
    affiliation: 'Direct Multi-Campus Root Console',
  },
];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen w-full bg-[#edf2f7] flex flex-col lg:flex-row items-stretch font-sans text-slate-800">
      
      <!-- ================================================================================== -->
      <!-- LEFT COLUMN (50% Split Screen - Centered Content) -->
      <!-- In mobile view: placed below right card (order-2). In desktop: left half (lg:order-1) -->
      <!-- ================================================================================== -->
      <div class="w-full lg:w-1/2 bg-[#f4f7fb] border-t lg:border-t-0 lg:border-r border-slate-200/80 flex flex-col justify-between items-center p-8 sm:p-12 lg:p-16 order-2 lg:order-1">
        
        <div class="w-full max-w-lg my-auto space-y-7">
          
          <!-- STEP 1 LEFT: SchoolSense Branding -->
          <div *ngIf="step === 'SELECT_SCHOOL' || isRootLogin" class="space-y-7 animate-fadeIn">
            <!-- Logo & Brand Header -->
            <div class="space-y-3">
              <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-2xl shadow-[5px_5px_12px_#cbd5e1,-5px_-5px_12px_#ffffff]">
                S
              </div>
              <div>
                <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">SchoolSense</h1>
                <p class="text-sm font-semibold text-slate-500 mt-1">The Operating System for India's Leading Campuses</p>
              </div>
            </div>

            <!-- Description -->
            <p class="text-sm text-slate-600 leading-relaxed">
              Empowering schools, educators, administrators, and parents with seamless academic management, live attendance sync, unified fee ledgers, and secure stakeholder communication.
            </p>

            <!-- Claymorphism Feature Highlights with Clean SVG Icons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div class="p-4 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] space-y-2 transition-all hover:translate-y-[-1px]">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Academics & Curriculums</h3>
                <p class="text-[11px] text-slate-500 leading-tight">Classrooms, subject allocations, timetables & daily homework diaries.</p>
              </div>

              <div class="p-4 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] space-y-2 transition-all hover:translate-y-[-1px]">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Live Attendance Sync</h3>
                <p class="text-[11px] text-slate-500 leading-tight">One-tap classroom rolls with yesterday & retroactive audit logs.</p>
              </div>

              <div class="p-4 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] space-y-2 transition-all hover:translate-y-[-1px]">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Exams & Marksheets</h3>
                <p class="text-[11px] text-slate-500 leading-tight">Automated grading (A1–F), term analytics & printable report cards.</p>
              </div>

              <div class="p-4 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] space-y-2 transition-all hover:translate-y-[-1px]">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff]">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Multi-Tenant Governance</h3>
                <p class="text-[11px] text-slate-500 leading-tight">Isolated school databases, granular role controls & audit logs.</p>
              </div>
            </div>

            <!-- Footer indicator -->
            <div class="pt-2 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Official Campus Portal • Encrypted & Secure</span>
            </div>
          </div>

          <!-- STEP 2 LEFT: Selected School Specific Branding (NO SchoolSense name or branding) -->
          <div *ngIf="step === 'LOGIN' && selectedSchool && !isRootLogin" class="space-y-7 animate-fadeIn">
            <!-- School Monogram & Identity -->
            <div class="space-y-3">
              <div class="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-sm tracking-wider shadow-[5px_5px_12px_#cbd5e1,-5px_-5px_12px_#ffffff]">
                {{ selectedSchool.code || 'CAMPUS' }}
              </div>
              <div>
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {{ selectedSchool.name }}
                </h1>
                <p class="text-xs font-semibold text-slate-600 mt-1">
                  {{ selectedSchool.affiliation || (selectedSchool.city + ' Campus • Academic Session 2025-2026') }}
                </p>
              </div>
            </div>

            <!-- Campus Motto / Location Banner -->
            <div class="p-5 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[4px_4px_10px_#d9e2ec,-4px_-4px_10px_#ffffff] space-y-2.5">
              <div class="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span>{{ selectedSchool.motto || 'Excellence in Education, Discipline & Character' }}</span>
              </div>
              <div class="text-[12px] text-slate-500 space-y-1.5 border-t border-slate-100 pt-2.5 font-medium">
                <div class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ selectedSchool.address_line1 || (selectedSchool.city + ', ' + selectedSchool.state) }}</span>
                </div>
                <div *ngIf="selectedSchool.phone || selectedSchool.email" class="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                  <span *ngIf="selectedSchool.phone" class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {{ selectedSchool.phone }}
                  </span>
                  <span *ngIf="selectedSchool.email" class="flex items-center gap-1.5">
                    <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {{ selectedSchool.email }}
                  </span>
                </div>
              </div>
            </div>

            <!-- School Specific Access Pillars with Clean Icons -->
            <div class="space-y-2.5 pt-0.5">
              <div class="p-3.5 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff] shrink-0">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-900">Faculty & Administrative Desk</p>
                  <p class="text-[11px] text-slate-500">Curriculum planning, student grading & section attendance.</p>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-[#ffffff] border border-slate-200/80 shadow-[3px_3px_8px_#d9e2ec,-3px_-3px_8px_#ffffff] flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-[inset_1px_1px_3px_#cbd5e1,inset_-1px_-1px_3px_#ffffff] shrink-0">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-900">Parent & Guardian Portal</p>
                  <p class="text-[11px] text-slate-500">Student performance, circular notices & fee payment receipts.</p>
                </div>
              </div>
            </div>

            <!-- Footer indicator -->
            <div class="pt-2 text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Official Campus Portal • Encrypted & Secure</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================================== -->
      <!-- RIGHT COLUMN (50% Split Screen - Centered Card) -->
      <!-- In mobile view: placed first at top (order-1). In desktop: right half (lg:order-2) -->
      <!-- ================================================================================== -->
      <div class="w-full lg:w-1/2 bg-[#edf2f7] flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 order-1 lg:order-2">
        
        <!-- STEP 1 RIGHT: School Selection Dropdown -->
        <div *ngIf="step === 'SELECT_SCHOOL'" class="w-full max-w-md bg-[#ffffff] rounded-3xl border border-slate-200/80 shadow-[10px_10px_25px_#d1d9e6,-10px_-10px_25px_#ffffff] p-7 sm:p-9 space-y-6">
            
            <div>
              <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60 mb-2">
                Step 1 of 2
              </span>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">Select Your Institution</h2>
              <p class="text-xs text-slate-500 mt-1">Choose your school or campus to access its dedicated portal.</p>
            </div>

            <div class="space-y-4">
              <!-- Unified Searchable Combobox (Input IS the search bar) -->
              <div class="relative">
                <label class="block text-xs font-bold text-slate-700 mb-1.5">School / Campus</label>
                
                <div class="relative flex items-center">
                  <input type="text"
                         [(ngModel)]="searchQuery"
                         (focus)="onInputFocus()"
                         (input)="onInputChange()"
                         (click)="$event.stopPropagation()"
                         placeholder="Search or select your school from the directory..."
                         class="w-full px-4 py-3.5 bg-[#f8fafc] border border-slate-300 rounded-2xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-800 transition-all shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] pr-16 cursor-text placeholder:text-slate-400 placeholder:font-normal" />
                  
                  <div class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <!-- Clear Selection Button -->
                    <button *ngIf="searchQuery || selectedSchool" type="button" (click)="clearSelection($event)"
                            title="Clear selection"
                            class="text-slate-400 hover:text-slate-700 p-1 text-xs font-bold rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <!-- Chevron Toggle Button -->
                    <button type="button" (click)="toggleDropdown($event)"
                            class="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                      <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="dropdownOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Dropdown Popover Menu (Direct School List, No Duplicate Search Bar) -->
                <div *ngIf="dropdownOpen" (click)="$event.stopPropagation()"
                     class="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.04)] overflow-hidden animate-fadeIn">
                  
                  <!-- Options List -->
                  <div class="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    <div *ngIf="filteredSchools.length === 0" class="p-3 text-center text-xs text-slate-400 font-medium">
                      No schools found matching "{{ searchQuery }}"
                    </div>

                    <button *ngFor="let s of filteredSchools" type="button" (click)="selectSchool(s)"
                            class="w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer"
                            [ngClass]="selectedSchoolId === s.id ? 'bg-slate-100 font-bold text-slate-900 shadow-sm' : 'hover:bg-slate-50 text-slate-700 font-medium'">
                      <div class="truncate">
                        <div class="text-xs text-slate-900 leading-snug">{{ s.name }}</div>
                        <div class="text-[10px] text-slate-400 leading-tight">{{ s.city ? s.city + ' • ' : '' }}{{ s.code }}</div>
                      </div>
                      <svg *ngIf="selectedSchoolId === s.id" class="w-4 h-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Selected School Preview Card -->
              <div *ngIf="selectedSchool" class="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200/90 shadow-[3px_3px_8px_#e2e8f0,-3px_-3px_8px_#ffffff] space-y-1.5 animate-fadeIn">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Campus</span>
                  <span class="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">{{ selectedSchool.code }}</span>
                </div>
                <p class="text-xs font-bold text-slate-900">{{ selectedSchool.name }}</p>
                <p class="text-[11px] text-slate-500">{{ selectedSchool.address_line1 || selectedSchool.city }}</p>
              </div>

              <!-- Continue Button -->
              <button type="button" (click)="proceedToLogin()" [disabled]="!selectedSchoolId"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-[5px_5px_14px_#cbd5e1,-5px_-5px_14px_#ffffff] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span>Continue to Campus Login</span>
                <span>→</span>
              </button>

              <!-- Direct Platform / Root Login Icon Button (Hidden when a school is selected) -->
              <div *ngIf="!selectedSchoolId" class="pt-4 border-t border-slate-100 flex items-center justify-center">
                <button type="button" (click)="openRootLogin()"
                        title="School Sense Login"
                        class="w-10 h-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-all shadow-xs hover:shadow-sm cursor-pointer hover:scale-105 active:scale-95">
                  <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5v-2a7 7 0 1 1 14 0v2h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9zM6 14h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2v-3a1 1 0 0 1 1-1h1zm12 5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1v4a2 2 0 0 1-2 2h-1a1 1 0 0 1 1-1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 2 RIGHT: Login Form -->
          <div *ngIf="step === 'LOGIN'" class="w-full bg-[#ffffff] rounded-3xl border border-slate-200/80 shadow-[10px_10px_25px_#d1d9e6,-10px_-10px_25px_#ffffff] p-7 sm:p-9 space-y-6 animate-fadeIn">
            
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60">
                  {{ isRootLogin ? 'Platform Console' : 'Step 2 of 2' }}
                </span>
                <button type="button" (click)="backToSchoolSelect()"
                        class="text-[11px] font-bold text-slate-500 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer">
                  <span>← {{ isRootLogin ? 'Back to School Directory' : 'Change School' }}</span>
                </button>
              </div>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">
                {{ isRootLogin ? 'School Sense Login' : 'Sign In to Campus' }}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ isRootLogin ? 'Enter your ID and password to access the platform.' : 'Enter your email or phone number and password.' }}
              </p>
            </div>

            <!-- Error Alert -->
            <div *ngIf="errorMessage" class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Login Form -->
            <form (ngSubmit)="onLogin()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">
                  {{ isRootLogin ? 'User ID / Email' : 'Email Address or Mobile Number' }}
                </label>
                <input type="text" [(ngModel)]="identifier" name="identifier" required
                       [placeholder]="isRootLogin ? '' : emailPlaceholder"
                       class="w-full px-4 py-3 bg-[#f8fafc] border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-slate-800 transition-all shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] placeholder:text-slate-400" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-700">Password</label>
                </div>
                <div class="relative">
                  <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                         [placeholder]="isRootLogin ? '' : '••••••••'"
                         class="w-full px-4 py-3 bg-[#f8fafc] border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-slate-800 transition-all shadow-[inset_2px_2px_5px_#e2e8f0,inset_-2px_-2px_5px_#ffffff] pr-12" />
                  <button type="button" (click)="showPassword = !showPassword"
                          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold focus:outline-none cursor-pointer">
                    {{ showPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>

              <button type="submit" [disabled]="loading || !identifier || !password"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-[5px_5px_14px_#cbd5e1,-5px_-5px_14px_#ffffff] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span *ngIf="!loading">Sign In</span>
                <span *ngIf="loading">Authenticating...</span>
              </button>
            </form>
          </div>

      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  step: 'SELECT_SCHOOL' | 'LOGIN' = 'SELECT_SCHOOL';
  isRootLogin = false;
  schools: SchoolItem[] = DEFAULT_SCHOOLS;
  selectedSchoolId = '';
  selectedSchool: SchoolItem | null = null;
  dropdownOpen = false;
  searchQuery = '';

  identifier = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  get emailPlaceholder(): string {
    if (this.selectedSchool?.email) {
      const domain = this.selectedSchool.email.split('@')[1] || 'school.edu.in';
      return `e.g. name@${domain} or 9876543210`;
    }
    return 'e.g. name@school.edu.in or 9876543210';
  }

  isSearching = false;

  get filteredSchools(): SchoolItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    // If not actively typing a query or if query matches the current selected school name, show ALL schools
    if (!this.isSearching || !q || (this.selectedSchool && q === this.selectedSchool.name.toLowerCase())) {
      return this.schools;
    }
    return this.schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)),
    );
  }

  ngOnInit() {
    // Attempt to load live schools from API, fallback to default seed list if offline
    this.auth.getPublicSchools().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Merge API schools with existing list metadata
          this.schools = data.map((s) => {
            const match = DEFAULT_SCHOOLS.find((d) => d.code === s.code || d.name.toLowerCase() === s.name.toLowerCase());
            return {
              ...s,
              motto: match?.motto || 'Excellence in Academics & Innovation',
              affiliation: match?.affiliation || `${s.city || 'Campus'} • Affiliated to Recognized Board`,
            };
          });
        }
      },
      error: () => {
        // Fallback to DEFAULT_SCHOOLS is already set
      },
    });

    // If a school was previously selected, restore it
    const storedSchoolId = localStorage.getItem('schoolsense_selected_school_id');
    if (storedSchoolId) {
      this.selectedSchoolId = storedSchoolId;
      this.selectedSchool = this.schools.find((s) => s.id === storedSchoolId) || null;
      if (this.selectedSchool) {
        this.searchQuery = this.selectedSchool.name;
      }
    }
  }

  onInputFocus() {
    this.searchQuery = '';
    this.isSearching = false;
    this.dropdownOpen = true;
  }

  onInputChange() {
    this.dropdownOpen = true;
    this.isSearching = true;
    const exact = this.schools.find(
      (s) => s.name.toLowerCase() === this.searchQuery.trim().toLowerCase(),
    );
    if (exact) {
      this.selectedSchoolId = exact.id;
      this.selectedSchool = exact;
      localStorage.setItem('schoolsense_selected_school_id', exact.id);
    }
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.selectedSchoolId = '';
    this.selectedSchool = null;
    this.searchQuery = '';
    this.isSearching = false;
    this.dropdownOpen = true;
    localStorage.removeItem('schoolsense_selected_school_id');
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.dropdownOpen = false;
    this.isSearching = false;
    if (this.selectedSchool) {
      this.searchQuery = this.selectedSchool.name;
    } else {
      this.searchQuery = '';
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    this.isSearching = false;
    if (this.dropdownOpen && !this.searchQuery && this.selectedSchool) {
      this.searchQuery = this.selectedSchool.name;
    }
  }

  selectSchool(school: SchoolItem) {
    this.selectedSchoolId = school.id;
    this.selectedSchool = school;
    this.searchQuery = school.name;
    this.isSearching = false;
    this.dropdownOpen = false;
    localStorage.setItem('schoolsense_selected_school_id', school.id);
  }

  openRootLogin() {
    this.isRootLogin = true;
    this.selectedSchool = null;
    this.selectedSchoolId = '';
    this.identifier = '';
    this.password = '';
    this.errorMessage = '';
    this.step = 'LOGIN';
  }

  proceedToLogin() {
    if (!this.selectedSchoolId) return;
    this.selectedSchool = this.schools.find((s) => s.id === this.selectedSchoolId) || null;
    if (this.selectedSchool) {
      this.isRootLogin = false;
      this.step = 'LOGIN';
      this.errorMessage = '';
    }
  }

  backToSchoolSelect() {
    this.isRootLogin = false;
    this.step = 'SELECT_SCHOOL';
    this.errorMessage = '';
  }

  onLogin() {
    if (!this.identifier.trim() || !this.password) return;
    this.loading = true;
    this.errorMessage = '';

    const schoolCode = this.isRootLogin ? undefined : this.selectedSchool?.code;
    this.auth.login(this.identifier.trim(), this.password, schoolCode).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user?.role === 'SUPER_ADMIN' || res.user?.role === 'PLATFORM_ADMIN') {
          this.router.navigate(['/super-admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || (this.isRootLogin ? 'Invalid ID or password.' : 'Invalid email/phone or password for this school.');
      },
    });
  }

  quickSuperAdminLogin() {
    this.loading = true;
    this.errorMessage = '';
    this.auth.login('dev@schoolsense.in', 'password123', 'DIS001').subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/super-admin']);
      },
      error: () => {
        this.auth.login('dev@schoolsense.in', 'password123').subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/super-admin']);
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = err.error?.message || 'Failed to login as Super Admin';
          },
        });
      },
    });
  }
}

