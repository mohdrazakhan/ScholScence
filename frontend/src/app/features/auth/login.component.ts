import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <!-- Logo -->
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl shadow-md mb-3">
          S
        </div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">SchoolSense</h1>
        <p class="text-xs text-slate-500 mt-1 font-medium">India-First Multi-Tenant School Operating Platform</p>
      </div>

      <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div class="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          <!-- 1. School Tenant Selector -->
          <div class="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <label class="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>🏫 Select School Campus</span>
              <span class="text-[10px] text-indigo-600 font-semibold">{{ selectedSchool.city }}</span>
            </label>
            <select [ngModel]="selectedSchool.code" (ngModelChange)="onSchoolChange($event)"
                    class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
              <option *ngFor="let s of schools" [value]="s.code">
                {{ s.name }} ({{ s.city }} • {{ s.code }})
              </option>
            </select>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" class="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span> {{ errorMessage }}
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Email or Phone Number</label>
              <input type="text" [(ngModel)]="identifier" name="identifier" required
                     placeholder="e.g. admin@demo-school.com"
                     class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-slate-700">Password</label>
                <span class="text-[11px] text-slate-400">Default: password123</span>
              </div>
              <input type="password" [(ngModel)]="password" name="password" required
                     placeholder="••••••••"
                     class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400" />
            </div>

            <button type="submit" [disabled]="loading"
                    class="w-full mt-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <span *ngIf="!loading">Sign In to {{ selectedSchool.name }}</span>
              <span *ngIf="loading">Authenticating...</span>
            </button>
          </form>

          <!-- 1-Click Role Quick Sign-in Buttons -->
          <div class="mt-6 pt-5 border-t border-slate-100">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              1-Click Role Access ({{ selectedSchool.code }})
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button type="button" (click)="setCredentials('dev')"
                      [class.ring-2]="activeRole === 'dev'"
                      class="p-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold text-center hover:bg-slate-800 transition-all flex flex-col items-center">
                <span>⚡ Dev</span>
                <span class="text-[9px] font-normal text-slate-400">Super Admin</span>
              </button>

              <button type="button" (click)="setCredentials('admin')"
                      [class.ring-2]="activeRole === 'admin'"
                      class="p-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-bold text-center hover:bg-indigo-50 hover:border-indigo-200 transition-all flex flex-col items-center">
                <span>👑 Admin</span>
                <span class="text-[9px] font-normal text-slate-500">Principal / Staff</span>
              </button>

              <button type="button" (click)="setCredentials('teacher')"
                      [class.ring-2]="activeRole === 'teacher'"
                      class="p-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-bold text-center hover:bg-indigo-50 hover:border-indigo-200 transition-all flex flex-col items-center">
                <span>👨‍🏫 Teacher</span>
                <span class="text-[9px] font-normal text-slate-500">Class 8-A</span>
              </button>

              <button type="button" (click)="setCredentials('parent')"
                      [class.ring-2]="activeRole === 'parent'"
                      class="p-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-[11px] font-bold text-center hover:bg-indigo-50 hover:border-indigo-200 transition-all flex flex-col items-center">
                <span>👨‍👧 Parent</span>
                <span class="text-[9px] font-normal text-slate-500">Student Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  schools = [
    { code: 'DIS001', name: 'Demo International School', city: 'Delhi', adminEmail: 'admin@demo-school.com', teacherEmail: 'teacher@demo-school.com', parentEmail: 'parent@demo-school.com' },
    { code: 'SXW002', name: "St. Xavier's World School", city: 'Mumbai', adminEmail: 'admin@stxaviers.schoolsense.in', teacherEmail: 'teacher_sxw002_1@schoolsense.in', parentEmail: 'parent.sxw002.1@schoolsense.in' },
    { code: 'GHA003', name: 'Greenwood High Academy', city: 'Bengaluru', adminEmail: 'admin@greenwood.schoolsense.in', teacherEmail: 'teacher_gha003_1@schoolsense.in', parentEmail: 'parent.gha003.1@schoolsense.in' },
    { code: 'NPS004', name: 'National Public Model School', city: 'Hyderabad', adminEmail: 'admin@npms.schoolsense.in', teacherEmail: 'teacher_nps004_1@schoolsense.in', parentEmail: 'parent.nps004.1@schoolsense.in' },
    { code: 'OIS005', name: 'Oakridge International School', city: 'Kolkata', adminEmail: 'admin@oakridge.schoolsense.in', teacherEmail: 'teacher_ois005_1@schoolsense.in', parentEmail: 'parent.ois005.1@schoolsense.in' },
  ];

  selectedSchool = this.schools[0];
  identifier = 'admin@demo-school.com';
  password = 'password123';
  activeRole = 'admin';
  loading = false;
  errorMessage = '';

  onSchoolChange(code: string) {
    const match = this.schools.find((s) => s.code === code);
    if (match) {
      this.selectedSchool = match;
      this.setCredentials(this.activeRole);
    }
  }

  setCredentials(role: string) {
    this.activeRole = role;
    this.password = 'password123';
    if (role === 'dev') {
      this.identifier = 'dev@schoolsense.in';
    } else if (role === 'admin') {
      this.identifier = this.selectedSchool.adminEmail;
    } else if (role === 'teacher') {
      this.identifier = this.selectedSchool.teacherEmail;
    } else if (role === 'parent') {
      this.identifier = this.selectedSchool.parentEmail;
    }
  }

  onLogin() {
    this.loading = true;
    this.errorMessage = '';
    this.auth.login(this.identifier, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please verify credentials.';
      },
    });
  }
}
