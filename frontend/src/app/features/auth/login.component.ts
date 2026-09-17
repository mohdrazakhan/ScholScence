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
  tagline?: string;
  affiliation?: string;
  affiliation_board?: string;
  affiliationBoard?: string;
  affiliation_number?: string;
  affiliationNumber?: string;
  custom_board_name?: string;
  customBoardName?: string;
  logo_url?: string;
  logoUrl?: string;
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
    <div class="min-h-screen w-full bg-gradient-to-br from-slate-100 via-[#eef2f8] to-[#e2e8f0] flex flex-col lg:flex-row items-stretch font-sans text-slate-800 selection:bg-blue-500 selection:text-white">
      
      <!-- ================================================================================== -->
      <!-- LEFT COLUMN (50% Split Screen - Centered Content & SchoolSense Showcase) -->
      <!-- ================================================================================== -->
      <div class="w-full lg:w-1/2 bg-white/70 backdrop-blur-md border-t lg:border-t-0 lg:border-r border-slate-200/90 flex flex-col justify-between items-center p-8 sm:p-12 lg:p-16 order-2 lg:order-1 relative overflow-hidden">
        
        <!-- Subtle Ambient Background Glows -->
        <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="w-full max-w-lg my-auto space-y-7 relative z-10">
          
          <!-- STEP 1 LEFT: SchoolSense Branding (Desktop Showcase) -->
          <div *ngIf="step === 'SELECT_SCHOOL' || isRootLogin" class="space-y-6 animate-fadeIn flex flex-col items-center text-center">
            
            <!-- SchoolSense Master Brand Hero Centered in Left Portion (Desktop Only) -->
            <div class="hidden lg:flex w-full justify-center py-2">
              <div (click)="onLogoClick()"
                   class="inline-flex items-center justify-center py-2 select-none cursor-default">
                <img src="/brand/top_icon_logo.png"
                     alt="SchoolSense - Building Smarter Schools for Tomorrow."
                     class="h-32 sm:h-36 w-auto object-contain drop-shadow-sm pointer-events-none mx-auto select-none" />
              </div>
            </div>

            <!-- Value Proposition Statement Centered (Desktop Only) -->
            <p class="hidden lg:block text-sm text-slate-600 leading-relaxed font-normal max-w-md mx-auto text-center">
              Empowering institutions, principals, educators, and parents with automated academic tracking, live attendance sync, unified fee ledgers, and secure campus governance.
            </p>

            <!-- 4 Pillar Feature Cards with Brand Color Highlights -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 w-full text-left">
              
              <!-- Card 1: Academics (Teal - Left Figure Accent) -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-2 transition-all hover:translate-y-[-2px] hover:shadow-md hover:border-teal-200">
                <div class="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-xs">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 14v6" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Academics & Curriculums</h3>
                <p class="text-[11px] text-slate-500 leading-snug">Classrooms, dynamic timetables & daily homework diaries.</p>
              </div>

              <!-- Card 2: Attendance (Blue - Central Figure Accent) -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-2 transition-all hover:translate-y-[-2px] hover:shadow-md hover:border-blue-200">
                <div class="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <circle cx="16" cy="16" r="2" fill="currentColor" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Live Attendance Sync</h3>
                <p class="text-[11px] text-slate-500 leading-snug">One-tap classroom rolls with instant guardian notifications.</p>
              </div>

              <!-- Card 3: Exams (Amber - Right Figure Accent) -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-2 transition-all hover:translate-y-[-2px] hover:shadow-md hover:border-amber-200">
                <div class="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Exams & Marksheets</h3>
                <p class="text-[11px] text-slate-500 leading-snug">Automated grading (A1–F), term analytics & report cards.</p>
              </div>

              <!-- Card 4: Governance (Indigo Accent) -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-2 transition-all hover:translate-y-[-2px] hover:shadow-md hover:border-indigo-200">
                <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 class="text-xs font-bold text-slate-900">Multi-Tenant Governance</h3>
                <p class="text-[11px] text-slate-500 leading-snug">Tenant isolation, role-based controls & audit logs.</p>
              </div>
            </div>

            <!-- Footer indicator Centered -->
            <div class="pt-2 text-[11px] font-medium text-slate-400 flex items-center justify-center gap-2">
              <span>Official Institutional Portal • 256-bit SSL Encrypted</span>
            </div>
          </div>

          <!-- STEP 2 LEFT: Selected School Specific Branding -->
          <div *ngIf="(step === 'LOGIN' || step === 'FORGOT_PASSWORD') && selectedSchool && !isRootLogin" class="space-y-6 animate-fadeIn flex flex-col items-center text-center">
            
            <!-- School Monogram & Identity Centered (Desktop Only) -->
            <div class="hidden lg:flex space-y-3 flex-col items-center">
              <div class="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-md">
                <img *ngIf="selectedSchool.logoUrl || selectedSchool.logo_url"
                     [src]="selectedSchool.logoUrl || selectedSchool.logo_url"
                     class="w-full h-full object-contain p-1 bg-white"
                     alt="School Logo" />
                <span *ngIf="!(selectedSchool.logoUrl || selectedSchool.logo_url)">{{ (selectedSchool.name.charAt(0) || 'S').toUpperCase() }}</span>
              </div>
              <div class="space-y-1 text-center">
                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {{ selectedSchool.name }}
                </h1>
                <!-- Line 1: School Affiliation Board Name & Affiliation Number -->
                <p *ngIf="getSchoolAffiliationLine(selectedSchool)" class="text-xs font-semibold text-slate-600">
                  {{ getSchoolAffiliationLine(selectedSchool) }}
                </p>
                <!-- Line 2: School Tagline -->
                <p *ngIf="getSchoolTagline(selectedSchool)" class="text-xs font-medium italic text-slate-500">
                  “{{ getSchoolTagline(selectedSchool) }}”
                </p>
              </div>
            </div>

            <!-- Campus Location & Contact Details -->
            <div *ngIf="selectedSchool.address_line1 || selectedSchool.city || selectedSchool.phone || selectedSchool.email"
                 class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2.5 w-full text-left">
              <div *ngIf="selectedSchool.address_line1 || selectedSchool.city" class="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ selectedSchool.address_line1 || (selectedSchool.city + (selectedSchool.state ? ', ' + selectedSchool.state : '')) }}</span>
              </div>
              <div *ngIf="selectedSchool.phone || selectedSchool.email" class="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
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

            <!-- Access Pillars -->
            <div class="space-y-2.5 pt-0.5 w-full text-left">
              <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-900">Faculty & Administrative Desk</p>
                  <p class="text-[11px] text-slate-500">Curriculum planning, student grading & section attendance.</p>
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-900">Parent & Guardian Portal</p>
                  <p class="text-[11px] text-slate-500">Student performance, circular notices & fee payments.</p>
                </div>
              </div>
            </div>

            <!-- Powered By SchoolSense Footer Centered -->
            <div class="pt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-200/60 w-full">
              <span>Powered by</span>
              <img src="/brand/left_icon_logo.png" alt="SchoolSense" class="h-6 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          </div>

        </div>
      </div>

      <!-- ================================================================================== -->
      <!-- RIGHT COLUMN (50% Split Screen on Desktop, Primary Section on Mobile) -->
      <!-- ================================================================================== -->
      <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 order-1 lg:order-2">
        
        <!-- MOBILE ONLY TOP HEADER (Visible only on < lg screens) -->
        <div class="w-full max-w-md mb-6 text-center flex flex-col items-center lg:hidden animate-fadeIn">
          
          <!-- Step 1 / Platform Mobile Header -->
          <div *ngIf="step === 'SELECT_SCHOOL' || isRootLogin" class="space-y-3 flex flex-col items-center w-full">
            <div (click)="onLogoClick()"
                 class="inline-flex items-center justify-center py-1 select-none cursor-default">
              <img src="/brand/top_icon_logo.png"
                   alt="SchoolSense - Building Smarter Schools for Tomorrow."
                   class="h-28 sm:h-32 w-auto object-contain drop-shadow-sm pointer-events-none mx-auto select-none" />
            </div>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-sm mx-auto text-center">
              Empowering institutions, principals, educators, and parents with automated academic tracking, live attendance sync, unified fee ledgers, and secure campus governance.
            </p>
          </div>

          <!-- Step 2 School Mobile Header -->
          <div *ngIf="(step === 'LOGIN' || step === 'FORGOT_PASSWORD') && selectedSchool && !isRootLogin" class="space-y-2.5 flex flex-col items-center w-full">
            <div class="w-16 h-16 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-md mx-auto">
              <img *ngIf="selectedSchool.logoUrl || selectedSchool.logo_url"
                   [src]="selectedSchool.logoUrl || selectedSchool.logo_url"
                   class="w-full h-full object-contain p-1 bg-white"
                   alt="School Logo" />
              <span *ngIf="!(selectedSchool.logoUrl || selectedSchool.logo_url)">{{ (selectedSchool.name.charAt(0) || 'S').toUpperCase() }}</span>
            </div>
            <div class="space-y-1 text-center">
              <h1 class="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {{ selectedSchool.name }}
              </h1>
              <!-- Line 1: School Affiliation Board Name & Affiliation Number -->
              <p *ngIf="getSchoolAffiliationLine(selectedSchool)" class="text-xs font-semibold text-slate-600">
                {{ getSchoolAffiliationLine(selectedSchool) }}
              </p>
              <!-- Line 2: School Tagline -->
              <p *ngIf="getSchoolTagline(selectedSchool)" class="text-xs font-medium italic text-slate-500">
                “{{ getSchoolTagline(selectedSchool) }}”
              </p>
            </div>
          </div>

        </div>

        <!-- STEP 1 RIGHT: School Selection Dropdown -->
        <div *ngIf="step === 'SELECT_SCHOOL'" class="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.05)] p-7 sm:p-9 space-y-6">
            
            <div class="space-y-2 text-center flex flex-col items-center">
              <img src="/brand/icon.png" alt="SchoolSense Emblem" class="w-10 h-10 object-contain mx-auto" />
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight">Select Your Institution</h2>
                <p class="text-xs text-slate-500 mt-0.5">Choose your school or campus to access its dedicated portal.</p>
              </div>
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
                         placeholder="Type at least 3 letters of your school name..."
                         class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all pr-16 cursor-text placeholder:text-slate-400 placeholder:font-normal" />
                  
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

                 <!-- Dropdown Popover Menu (Direct Search Results, Zero Directory Leakage) -->
                 <div *ngIf="dropdownOpen" (click)="$event.stopPropagation()"
                      class="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-[0_16px_36px_rgba(15,23,42,0.12),0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden animate-fadeIn">
                   
                    <!-- Options List -->
                    <div class="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                      <!-- Min 3 characters prompt -->
                      <div *ngIf="searchQuery.trim().length < 3" class="p-3.5 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                        <svg class="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Type at least 3 characters of the school name...
                      </div>

                      <!-- Loading state -->
                      <div *ngIf="schoolsLoading" class="p-3.5 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                        <svg class="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Searching matching campus...
                      </div>

                      <!-- No search match -->
                      <div *ngIf="!schoolsLoading && searchQuery.trim().length >= 3 && schools.length === 0" class="p-3.5 text-center text-xs text-slate-400 font-medium">
                        No school found matching "{{ searchQuery }}"
                      </div>

                      <button *ngFor="let s of schools" type="button" (click)="selectSchool(s)"
                              class="w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer"
                              [ngClass]="selectedSchoolId === s.id ? 'bg-blue-50/80 font-bold text-blue-950 shadow-xs border border-blue-100' : 'hover:bg-slate-50 text-slate-700 font-medium'">
                        <div class="truncate">
                          <div class="text-xs text-slate-900 leading-snug">{{ s.name }}</div>
                          <div class="text-[10px] text-slate-400 leading-tight">{{ s.city ? s.city + ' • ' : '' }}{{ s.code }}</div>
                        </div>
                        <svg *ngIf="selectedSchoolId === s.id" class="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                 </div>
              </div>

              <!-- Selected School Preview Card -->
              <div *ngIf="selectedSchool" class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-1.5 animate-fadeIn">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                    SELECTED CAMPUS
                  </span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[10px] font-bold shadow-2xs">{{ selectedSchool.code }}</span>
                </div>
                <p class="text-xs font-bold text-slate-900">{{ selectedSchool.name }}</p>
                <p class="text-[11px] text-slate-500">{{ selectedSchool.address_line1 || selectedSchool.city }}</p>
              </div>

              <!-- Continue Button -->
              <button type="button" (click)="proceedToLogin()" [disabled]="!selectedSchoolId"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span>Continue to Campus Login</span>
                <span>→</span>
              </button>
            </div>
          </div>

        <!-- STEP 2 RIGHT: Login Form -->
        <div *ngIf="step === 'LOGIN'" class="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.05)] p-7 sm:p-9 space-y-6 animate-fadeIn">
            
            <div class="space-y-3">
              <div class="flex items-center justify-end">
                <button type="button" (click)="backToSchoolSelect()"
                        class="text-xs font-bold text-slate-500 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer">
                  <span>← {{ isRootLogin ? 'Back to School Directory' : 'Change School' }}</span>
                </button>
              </div>

              <!-- Centered Platform / School Header inside Login Card -->
              <div *ngIf="isRootLogin" class="flex flex-col items-center text-center space-y-2 pt-1 pb-1">
                <img src="/brand/top_icon_logo.png" alt="SchoolSense Platform" class="h-20 w-auto object-contain mx-auto select-none" />
                <div>
                  <h2 class="text-xl font-black text-slate-900 tracking-tight">Platform Administrator Login</h2>
                  <p class="text-xs text-slate-500 mt-0.5">Enter your platform administrator credentials.</p>
                </div>
              </div>

              <div *ngIf="!isRootLogin && selectedSchool" class="flex flex-col items-center text-center space-y-2 pt-1 pb-1">
                <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm mx-auto">
                  <img *ngIf="selectedSchool.logoUrl || selectedSchool.logo_url"
                       [src]="selectedSchool.logoUrl || selectedSchool.logo_url"
                       class="w-full h-full object-contain p-1 bg-white"
                       alt="School Logo" />
                  <span *ngIf="!(selectedSchool.logoUrl || selectedSchool.logo_url)">{{ (selectedSchool.name.charAt(0) || 'S').toUpperCase() }}</span>
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-900 tracking-tight">{{ selectedSchool.name }}</h2>
                  <p class="text-xs text-slate-500 mt-0.5">Enter your email or phone number and password.</p>
                </div>
              </div>
            </div>

            <!-- Success Alert (e.g. after password reset) -->
            <div *ngIf="loginSuccessMessage" class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ loginSuccessMessage }}</span>
            </div>

            <!-- Error Alert -->
            <div *ngIf="errorMessage" class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Login Form -->
            <form (ngSubmit)="onLogin()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">
                  {{ isRootLogin ? 'Platform User ID / Email' : 'Email Address or Mobile Number' }}
                </label>
                <input type="text" [(ngModel)]="identifier" name="identifier" required
                       [placeholder]="isRootLogin ? 'e.g. dev@schoolsense.in' : emailPlaceholder"
                       class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-700">Password</label>
                  <button *ngIf="!isRootLogin" type="button" (click)="openForgotPassword()"
                          class="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                    Forgot Password?
                  </button>
                </div>
                <div class="relative">
                  <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                         placeholder="••••••••"
                         class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all pr-14" />
                  <button type="button" (click)="showPassword = !showPassword"
                          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold focus:outline-none cursor-pointer">
                    {{ showPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>

              <button type="submit" [disabled]="loading || !identifier || !password"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span *ngIf="!loading">{{ isRootLogin ? 'Access Platform Console' : 'Sign In to Campus' }}</span>
                <span *ngIf="loading" class="flex items-center gap-2">
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Authenticating...
                </span>
              </button>
            </form>
        </div>

        <!-- STEP 3 RIGHT: Forgot Password Card (Strictly for School Login) -->
        <div *ngIf="step === 'FORGOT_PASSWORD' && selectedSchool && !isRootLogin" class="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.05)] p-7 sm:p-9 space-y-6 animate-fadeIn">
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold tracking-wider uppercase border border-blue-100">
                  Password Recovery
                </span>
                <button type="button" (click)="backToLoginFromForgot()"
                        class="text-xs font-bold text-slate-500 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer">
                  <span>← Back to Sign In</span>
                </button>
              </div>

              <!-- School Monogram & Sub-header -->
              <div class="flex flex-col items-center text-center space-y-2 pt-1 pb-1">
                <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm mx-auto">
                  <img *ngIf="selectedSchool.logoUrl || selectedSchool.logo_url"
                       [src]="selectedSchool.logoUrl || selectedSchool.logo_url"
                       class="w-full h-full object-contain p-1 bg-white"
                       alt="School Logo" />
                  <span *ngIf="!(selectedSchool.logoUrl || selectedSchool.logo_url)">{{ (selectedSchool.name.charAt(0) || 'S').toUpperCase() }}</span>
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-900 tracking-tight">
                    {{ forgotStep === 'EMAIL' ? 'Forgot Password?' : (forgotStep === 'OTP' ? 'Verify Security OTP' : 'Create New Password') }}
                  </h2>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ forgotStep === 'EMAIL' ? 'Enter your school-registered email address to receive a verification code.' : (forgotStep === 'OTP' ? 'Enter the verification code sent to ' + maskedEmail : 'Enter your new secure password below.') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Error Alert -->
            <div *ngIf="forgotErrorMessage" class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ forgotErrorMessage }}</span>
            </div>

            <!-- Success Alert -->
            <div *ngIf="forgotSuccessMessage" class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ forgotSuccessMessage }}</span>
            </div>

            <!-- SUB-STEP 1: Request OTP by Email -->
            <form *ngIf="forgotStep === 'EMAIL'" (ngSubmit)="submitForgotEmail()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Registered Email Address</label>
                <input type="email" [(ngModel)]="forgotEmail" name="forgotEmail" required
                       placeholder="e.g. name@school.edu.in"
                       class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400" />
                <p class="text-[11px] text-slate-400 mt-1.5">We will check if this email is associated with {{ selectedSchool.name }}.</p>
              </div>

              <button type="submit" [disabled]="forgotLoading || !forgotEmail"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span *ngIf="!forgotLoading">Send Verification Code</span>
                <span *ngIf="forgotLoading" class="flex items-center gap-2">
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Verifying Account...
                </span>
              </button>
            </form>

            <!-- SUB-STEP 2: Enter & Verify 6 to 8 digit OTP -->
            <form *ngIf="forgotStep === 'OTP'" (ngSubmit)="submitVerifyOtp()" class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold text-slate-700">Security Verification Code (6–8 digits)</label>
                  <button type="button" (click)="forgotStep = 'EMAIL'"
                          class="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                    Change Email
                  </button>
                </div>
                <input type="text" [(ngModel)]="forgotOtp" name="forgotOtp" required maxlength="8"
                       placeholder="••••••••"
                       class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-center text-lg font-mono font-bold tracking-[0.25em] focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
                
                <!-- Resend Timer / Button -->
                <div class="flex items-center justify-between pt-2 text-[11px]">
                  <span *ngIf="resendCountdown > 0" class="text-slate-400 font-medium">
                    Resend code in <strong class="text-slate-700">{{ resendCountdown }}s</strong>
                  </span>
                  <button *ngIf="resendCountdown === 0" type="button" (click)="resendForgotOtp()" [disabled]="forgotLoading"
                          class="text-blue-600 font-bold hover:text-blue-800 hover:underline cursor-pointer">
                    Didn't receive code? Resend OTP
                  </button>
                </div>
              </div>

              <button type="submit" [disabled]="forgotLoading || forgotOtp.trim().length < 6 || forgotOtp.trim().length > 8"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span *ngIf="!forgotLoading">Verify Code & Proceed</span>
                <span *ngIf="forgotLoading" class="flex items-center gap-2">
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Verifying OTP...
                </span>
              </button>
            </form>

            <!-- SUB-STEP 3: Set New Password -->
            <form *ngIf="forgotStep === 'NEW_PASSWORD'" (ngSubmit)="submitNewPassword()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                <div class="relative">
                  <input [type]="showNewPassword ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPassword" required minlength="6"
                         placeholder="Minimum 6 characters"
                         class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all pr-14" />
                  <button type="button" (click)="showNewPassword = !showNewPassword"
                          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold focus:outline-none cursor-pointer">
                    {{ showNewPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <div class="relative">
                  <input [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" required minlength="6"
                         placeholder="Re-type new password"
                         class="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-300 rounded-2xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all pr-14" />
                  <button type="button" (click)="showConfirmPassword = !showConfirmPassword"
                          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold focus:outline-none cursor-pointer">
                    {{ showConfirmPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
              </div>

              <button type="submit" [disabled]="forgotLoading || !newPassword || !confirmPassword"
                      class="w-full mt-2 py-3.5 px-6 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
                <span *ngIf="!forgotLoading">Update Password & Sign In</span>
                <span *ngIf="forgotLoading" class="flex items-center gap-2">
                  <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Updating Password...
                </span>
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

  step: 'SELECT_SCHOOL' | 'LOGIN' | 'FORGOT_PASSWORD' = 'SELECT_SCHOOL';
  isRootLogin = false;
  schools: SchoolItem[] = [];
  schoolsLoading = true;
  schoolsError = false;
  selectedSchoolId = '';
  selectedSchool: SchoolItem | null = null;
  dropdownOpen = false;
  searchQuery = '';

  identifier = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  loginSuccessMessage = '';

  // Forgot Password State
  forgotStep: 'EMAIL' | 'OTP' | 'NEW_PASSWORD' = 'EMAIL';
  forgotEmail = '';
  forgotOtp = '';
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  maskedEmail = '';
  forgotLoading = false;
  forgotErrorMessage = '';
  forgotSuccessMessage = '';
  resendCountdown = 0;
  private resendTimer: any = null;

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
    if (!this.isSearching || !q || (this.selectedSchool && q === this.selectedSchool.name.toLowerCase())) {
      return this.schools;
    }
    return this.schools.filter(
      (s) => (s.name || '').toLowerCase().includes(q)
    );
  }

  private searchDebounceTimer: any = null;
  private logoClickCount = 0;
  private logoClickTimer: any = null;

  onLogoClick() {
    this.logoClickCount++;
    if (this.logoClickTimer) {
      clearTimeout(this.logoClickTimer);
    }
    if (this.logoClickCount >= 3) {
      this.logoClickCount = 0;
      this.openRootLogin();
    } else {
      this.logoClickTimer = setTimeout(() => {
        this.logoClickCount = 0;
      }, 1000);
    }
  }

  getSchoolAffiliationLine(school: SchoolItem | null): string {
    if (!school) return '';
    const board = school.affiliationBoard || school.affiliation_board || '';
    const customBoard = school.customBoardName || school.custom_board_name || '';
    const affilNo = (school.affiliationNumber || school.affiliation_number || '').replace(/^[#\s]+/, '').trim();

    let resolvedBoard = board;
    if (board === 'Other' || board === 'State Board') {
      resolvedBoard = customBoard || board;
    }

    if (resolvedBoard && affilNo) {
      return `Affiliated to ${resolvedBoard} (Affiliation No. ${affilNo})`;
    }
    if (resolvedBoard) {
      return `Affiliated to ${resolvedBoard}`;
    }
    if (school.affiliation) {
      let affilStr = school.affiliation.replace(/#\s*/g, 'No. ').replace(/Affiliation #/gi, 'Affiliation No.');
      if (affilNo && !affilStr.includes(affilNo)) {
        return `${affilStr} (Affiliation No. ${affilNo})`;
      }
      return affilStr;
    }
    if (affilNo) {
      return `Affiliation No. ${affilNo}`;
    }
    return '';
  }

  getSchoolTagline(school: SchoolItem | null): string {
    if (!school) return '';
    return (school.motto || school.tagline || '').trim();
  }

  async ngOnInit() {
    this.schools = [];
    this.schoolsLoading = false;
    this.schoolsError = false;

    // Restore previously selected school code if any
    const storedSchoolId = localStorage.getItem('schoolsense_selected_school_id');
    const storedSchoolName = localStorage.getItem('schoolsense_selected_school_name');
    const storedSchoolCode = localStorage.getItem('schoolsense_selected_school_code');
    if (storedSchoolId && storedSchoolName) {
      this.selectedSchoolId = storedSchoolId;
      this.selectedSchool = {
        id: storedSchoolId,
        name: storedSchoolName,
        code: storedSchoolCode || '',
        city: '',
      };
      this.searchQuery = storedSchoolName;

      try {
        const fullProfile = await this.auth.getSchoolProfileById(storedSchoolId);
        if (fullProfile) {
          this.selectedSchool = { ...this.selectedSchool, ...fullProfile };
        }
      } catch (e) {}
    }
  }

  onInputFocus() {
    this.dropdownOpen = true;
    if (this.searchQuery.trim().length >= 3 && this.schools.length === 0) {
      this.onInputChange();
    }
  }

  onInputChange() {
    this.dropdownOpen = true;
    const q = this.searchQuery.trim();

    if (q.length < 3) {
      this.schools = [];
      this.schoolsLoading = false;
      return;
    }

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.schoolsLoading = true;
    this.searchDebounceTimer = setTimeout(() => {
      this.auth.searchSchools(q).subscribe({
        next: (results) => {
          this.schoolsLoading = false;
          this.schools = results || [];
          this.dropdownOpen = true;
        },
        error: () => {
          this.schoolsLoading = false;
          this.schools = [];
        },
      });
    }, 200);
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.selectedSchoolId = '';
    this.selectedSchool = null;
    this.searchQuery = '';
    this.schools = [];
    this.dropdownOpen = true;
    localStorage.removeItem('schoolsense_selected_school_id');
    localStorage.removeItem('schoolsense_selected_school_name');
    localStorage.removeItem('schoolsense_selected_school_code');
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

  async selectSchool(school: SchoolItem) {
    this.selectedSchoolId = school.id;
    this.selectedSchool = school;
    this.searchQuery = school.name;
    this.isSearching = false;
    this.dropdownOpen = false;
    localStorage.setItem('schoolsense_selected_school_id', school.id);
    localStorage.setItem('schoolsense_selected_school_name', school.name);
    localStorage.setItem('schoolsense_selected_school_code', school.code);

    try {
      const fullProfile = await this.auth.getSchoolProfileById(school.id);
      if (fullProfile && this.selectedSchoolId === school.id) {
        this.selectedSchool = { ...this.selectedSchool, ...fullProfile };
      }
    } catch (e) {}
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

  async proceedToLogin() {
    if (!this.selectedSchoolId) return;
    if (!this.selectedSchool || this.selectedSchool.id !== this.selectedSchoolId) {
      this.selectedSchool = this.schools.find((s) => s.id === this.selectedSchoolId) || this.selectedSchool;
    }
    if (this.selectedSchool) {
      this.isRootLogin = false;
      this.step = 'LOGIN';
      this.errorMessage = '';

      try {
        const fullProfile = await this.auth.getSchoolProfileById(this.selectedSchool.id);
        if (fullProfile) {
          this.selectedSchool = { ...this.selectedSchool, ...fullProfile };
        }
      } catch (e) {}
    }
  }

  backToSchoolSelect() {
    this.isRootLogin = false;
    this.step = 'SELECT_SCHOOL';
    this.errorMessage = '';
  }

  openForgotPassword() {
    if (this.isRootLogin) return;
    this.step = 'FORGOT_PASSWORD';
    this.forgotStep = 'EMAIL';
    this.forgotEmail = this.identifier && this.identifier.includes('@') ? this.identifier.trim() : '';
    this.forgotOtp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';
    this.loginSuccessMessage = '';
  }

  backToLoginFromForgot() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.step = 'LOGIN';
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';
  }

  async submitForgotEmail() {
    if (!this.forgotEmail.trim() || !this.forgotEmail.includes('@')) {
      this.forgotErrorMessage = 'Please enter a valid email address.';
      return;
    }
    if (!this.selectedSchool) {
      this.forgotErrorMessage = 'No school selected. Please select your school first.';
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';

    try {
      const res = await this.auth.requestPasswordResetOtp(this.forgotEmail.trim(), this.selectedSchool.id);
      this.forgotLoading = false;
      this.maskedEmail = res.maskedEmail || this.forgotEmail.trim();
      this.forgotSuccessMessage = res.message || `Verification code sent to ${this.maskedEmail}`;
      this.forgotStep = 'OTP';
      this.forgotOtp = '';
      this.startResendTimer(60);
    } catch (err: any) {
      this.forgotLoading = false;
      this.forgotErrorMessage = err.message || 'Failed to request verification code. Please verify your email.';
    }
  }

  startResendTimer(seconds: number = 60) {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
    this.resendCountdown = seconds;
    this.resendTimer = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
    }, 1000);
  }

  async resendForgotOtp() {
    if (this.resendCountdown > 0 || !this.forgotEmail.trim() || !this.selectedSchool) return;

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';

    try {
      await this.auth.requestPasswordResetOtp(this.forgotEmail.trim(), this.selectedSchool.id);
      this.forgotLoading = false;
      this.forgotSuccessMessage = `New verification code sent!`;
      this.startResendTimer(60);
    } catch (err: any) {
      this.forgotLoading = false;
      this.forgotErrorMessage = err.message || 'Failed to resend code. Please try again.';
    }
  }

  async submitVerifyOtp() {
    const cleanOtp = (this.forgotOtp || '').trim();
    if (cleanOtp.length < 6 || cleanOtp.length > 8) {
      this.forgotErrorMessage = 'Please enter a valid verification code (6 to 8 digits).';
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';

    try {
      await this.auth.verifyPasswordResetOtp(this.forgotEmail.trim(), cleanOtp);
      this.forgotLoading = false;
      this.forgotStep = 'NEW_PASSWORD';
      this.newPassword = '';
      this.confirmPassword = '';
      this.forgotSuccessMessage = 'Code verified successfully! Please choose a new password.';
    } catch (err: any) {
      this.forgotLoading = false;
      this.forgotErrorMessage = err.message || 'Invalid or expired verification code.';
    }
  }

  async submitNewPassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.forgotErrorMessage = 'New password must be at least 6 characters long.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.forgotErrorMessage = 'Passwords do not match. Please ensure both passwords match.';
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMessage = '';
    this.forgotSuccessMessage = '';

    try {
      const res = await this.auth.completePasswordReset(this.forgotEmail.trim(), this.forgotOtp.trim(), this.newPassword);
      this.forgotLoading = false;
      
      if (this.resendTimer) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }

      // Pre-fill login identifier and return to login screen
      this.identifier = this.forgotEmail.trim();
      this.password = '';
      this.loginSuccessMessage = res.message || 'Password reset successfully! Please sign in with your new password.';
      this.errorMessage = '';
      this.step = 'LOGIN';
    } catch (err: any) {
      this.forgotLoading = false;
      this.forgotErrorMessage = err.message || 'Failed to update password. Please try again.';
    }
  }

  onLogin() {
    if (!this.identifier.trim() || !this.password) return;
    this.loading = true;
    this.errorMessage = '';

    const schoolCode = this.isRootLogin ? 'PLATFORM' : this.selectedSchool?.code;
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
        this.errorMessage = err.message || err.error?.message || (this.isRootLogin ? 'Invalid ID or password.' : 'Invalid email/phone or password for this school.');
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

