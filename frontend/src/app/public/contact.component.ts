import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../core/services/supabase.service';
import { ToastService } from '../core/services/toast.service';
import { SeoService } from '../core/services/seo.service';

interface LeadForm {
  fullName: string;
  phone: string;
  email: string;
  schoolName: string;
  role: string;
  studentCount: string;
  city: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, FormsModule],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50/70 to-white py-14 sm:py-16">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Contact</p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Book your free demo
        </h1>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          Tell us about your school and we'll call you back within 24 hours (Mon–Sat) to set up
          your free 30-minute demo. No pressure, no technical words — promise.
        </p>
      </div>
    </section>

    <section class="bg-white pb-16 sm:pb-24">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-14 lg:px-8">

        <!-- ================= FORM ================= -->
        <div class="lg:col-span-3">
          <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <!-- Success state -->
            <div *ngIf="submitted" class="py-10 text-center">
              <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <h2 class="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">Thank you, {{ leadForm.fullName || 'friend' }}! 🎉</h2>
              <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                Your demo request has reached our team. We'll call you on
                <strong class="font-semibold text-slate-900">{{ leadForm.phone }}</strong>
                within 24 hours (Mon–Sat) to schedule your free demo.
              </p>
              <button type="button" (click)="resetForm()"
                      class="mt-6 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Submit another request
              </button>
            </div>

            <!-- Form state -->
            <form *ngIf="!submitted" (ngSubmit)="submitLead()" class="space-y-5" novalidate>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="lead-name" class="mb-1.5 block text-sm font-semibold text-slate-800">Your full name <span class="text-rose-500">*</span></label>
                  <input id="lead-name" type="text" [(ngModel)]="leadForm.fullName" name="fullName" required
                         placeholder="e.g. Suresh Gupta"
                         class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label for="lead-phone" class="mb-1.5 block text-sm font-semibold text-slate-800">Mobile number <span class="text-rose-500">*</span></label>
                  <div class="flex items-stretch overflow-hidden rounded-xl border border-slate-300 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <span class="flex items-center border-r border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-600">+91</span>
                    <input id="lead-phone" type="tel" [(ngModel)]="leadForm.phone" name="phone" required
                           placeholder="98765 43210" maxlength="12" inputmode="numeric"
                           class="w-full border-0 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none" />
                  </div>
                </div>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="lead-school" class="mb-1.5 block text-sm font-semibold text-slate-800">School name</label>
                  <input id="lead-school" type="text" [(ngModel)]="leadForm.schoolName" name="schoolName"
                         placeholder="e.g. Sunrise Public School"
                         class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label for="lead-role" class="mb-1.5 block text-sm font-semibold text-slate-800">You are a…</label>
                  <select id="lead-role" [(ngModel)]="leadForm.role" name="role"
                          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Select your role</option>
                    <option>School Owner / Correspondent</option>
                    <option>Principal / Director</option>
                    <option>Admin / Office staff</option>
                    <option>Teacher</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="lead-students" class="mb-1.5 block text-sm font-semibold text-slate-800">Number of students</label>
                  <select id="lead-students" [(ngModel)]="leadForm.studentCount" name="studentCount"
                          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Select a range</option>
                    <option>Under 100</option>
                    <option>100 – 300</option>
                    <option>300 – 700</option>
                    <option>700 – 1,500</option>
                    <option>1,500+</option>
                  </select>
                </div>
                <div>
                  <label for="lead-city" class="mb-1.5 block text-sm font-semibold text-slate-800">City</label>
                  <input id="lead-city" type="text" [(ngModel)]="leadForm.city" name="city"
                         placeholder="e.g. Jaipur"
                         class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div>
                <label for="lead-email" class="mb-1.5 block text-sm font-semibold text-slate-800">Email <span class="font-normal text-slate-400">(optional)</span></label>
                <input id="lead-email" type="email" [(ngModel)]="leadForm.email" name="email"
                       placeholder="you@example.com"
                       class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div>
                <label for="lead-message" class="mb-1.5 block text-sm font-semibold text-slate-800">
                  Anything you'd like us to know?
                  <span *ngIf="interestNote" class="ml-1 font-medium text-blue-600">{{ interestNote }}</span>
                </label>
                <textarea id="lead-message" rows="3" [(ngModel)]="leadForm.message" name="message"
                          placeholder="e.g. We currently manage everything on paper. We want attendance + fee management first."
                          class="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"></textarea>
              </div>

              <p *ngIf="errorMessage" class="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
                {{ errorMessage }}
              </p>

              <button type="submit" [disabled]="submitting"
                      class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                <svg *ngIf="submitting" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {{ submitting ? 'Sending…' : (isFeatureRequest ? 'Request This Feature' : 'Book My Free Demo') }}
              </button>
              <p class="text-center text-xs text-slate-400">
                By submitting, you agree to be contacted about SchoolSense. We never share your details.
              </p>
            </form>
          </div>
        </div>

        <!-- ================= SIDE INFO ================= -->
        <aside class="lg:col-span-2">
          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              </span>
              <h3 class="mt-4 text-base font-bold text-slate-900">A free 30-minute demo</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-600">
                We walk you through a full school running on SchoolSense — attendance, homework,
                marks, fees, certificates and the parent view.
              </p>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              <h3 class="mt-4 text-base font-bold text-slate-900">Reply within 24 hours</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-600">
                Our team calls you Monday to Saturday. No call centres — you'll talk to people
                who actually run the product.
              </p>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </span>
              <h3 class="mt-4 text-base font-bold text-slate-900">Free setup &amp; training</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-600">
                If you join, we enter your school's data, train your staff and stay with you
                through go-live — at no extra cost.
              </p>
            </div>

            <div class="rounded-2xl bg-slate-900 p-6 text-center">
              <p class="text-sm font-semibold text-white">Launch offer — ₹10/student/month</p>
              <p class="mt-1 text-xs text-slate-400">Regular ₹49 · every feature included · no setup fee</p>
              <a routerLink="/pricing" class="mt-3 inline-block text-xs font-bold text-blue-400 hover:text-blue-300">See pricing details →</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class ContactComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  private seo = inject(SeoService);

  leadForm: LeadForm = {
    fullName: '',
    phone: '',
    email: '',
    schoolName: '',
    role: '',
    studentCount: '',
    city: '',
    message: '',
  };

  submitting = false;
  submitted = false;
  errorMessage = '';
  isFeatureRequest = false;
  interestNote = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const type = params.get('type') || '';
      const plan = params.get('plan') || '';
      this.isFeatureRequest = type === 'feature';
      if (type === 'demo') {
        this.interestNote = plan
          ? `(Re: the ${plan} plan on the pricing page)`
          : '(Re: booking a demo)';
      } else if (type === 'feature') {
        this.interestNote = '(Re: requesting an on-demand feature)';
      }
    });

    this.seo.setPage({
      title: 'Book a Free Demo — See SchoolSense Live',
      description:
        'Book a free 30-minute demo of SchoolSense, India\'s simple school management system with live Parent Connect. We call you back within 24 hours. Launch offer: ₹10 per student/month, all features included.',
      path: '/contact',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.schoolsense.in/' },
            { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://www.schoolsense.in/contact' },
          ],
        },
      ],
    });
  }

  async submitLead(): Promise<void> {
    this.errorMessage = '';

    // Client-side sanity checks (the RPC re-validates server-side)
    if (!this.leadForm.fullName || this.leadForm.fullName.trim().length < 2) {
      this.errorMessage = 'Please enter your full name.';
      return;
    }
    const digits = this.leadForm.phone.replace(/\D/g, '');
    if (!/^(91)?[0-9]{10}$|^0[0-9]{10}$/.test(digits)) {
      this.errorMessage = 'Please enter a valid 10-digit Indian mobile number.';
      return;
    }

    this.submitting = true;
    try {
      const { data, error } = await this.supabase.client.rpc('create_demo_lead', {
        p_full_name: this.leadForm.fullName.trim(),
        p_phone: this.leadForm.phone.trim(),
        p_email: this.leadForm.email.trim(),
        p_school_name: this.leadForm.schoolName.trim(),
        p_role: this.leadForm.role,
        p_student_count: this.leadForm.studentCount,
        p_city: this.leadForm.city.trim(),
        p_message: this.leadForm.message.trim(),
        p_source: this.isFeatureRequest ? 'feature_request' : 'website',
        p_page_url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/contact',
      });

      if (error) {
        console.error('create_demo_lead error:', error);
        this.errorMessage = 'Something went wrong while sending your request. Please try again in a moment.';
        this.toast.error('Could not send your request — please try again.');
        return;
      }

      const res = (data ?? {}) as { success?: boolean; error?: string; message?: string };
      if (res.success) {
        this.submitted = true;
        this.toast.success(res.message || 'Demo request received — we will call you within 24 hours.');
      } else {
        this.errorMessage = res.error || 'Please check your details and try again.';
      }
    } catch (err) {
      console.error('Lead submission failed:', err);
      this.errorMessage = 'Something went wrong while sending your request. Please try again in a moment.';
    } finally {
      this.submitting = false;
    }
  }

  resetForm(): void {
    this.leadForm = { fullName: '', phone: '', email: '', schoolName: '', role: '', studentCount: '', city: '', message: '' };
    this.submitted = false;
    this.errorMessage = '';
  }
}
