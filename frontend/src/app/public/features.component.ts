import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { SeoService } from '../core/services/seo.service';

interface Detail {
  text: string;
}

interface FeatureSection {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  items: { icon: string; name: string; tagline: string; points: Detail[] }[];
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50/70 to-white py-14 sm:py-20">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Features</p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Every tool your school needs — explained in plain words
        </h1>
        <p class="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
          No confusing modules or hidden add-ons. SchoolSense gives you nine connected tools,
          plus live Parent Connect — and every one of them is included in your plan.
        </p>
      </div>
    </section>

    <!-- Parent Connect spotlight -->
    <section class="bg-white pb-4" aria-labelledby="pc-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-8 rounded-3xl border border-blue-100 bg-blue-50/50 p-8 sm:p-10 lg:grid-cols-2 lg:p-12">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Parent Connect</p>
            <h2 id="pc-heading" class="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              The feature that makes parents love your school
            </h2>
            <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Parents get a simple live view of their child — attendance, homework, marks,
              fees, notices and complaints — the moment things happen. Happy parents means
              fewer phone calls to your office and more admissions by word of mouth.
            </p>
          </div>
          <ul class="grid gap-3 sm:grid-cols-2">
            <li *ngFor="let p of parentPoints" class="flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-blue-100/70">
              <svg class="h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" [attr.d]="p.icon" /></svg>
              <span>{{ p.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Feature groups -->
    <section *ngFor="let group of groups" class="py-14 sm:py-16" [ngClass]="group.id === 'office' ? 'bg-slate-50' : 'bg-white'"
             [attr.aria-labelledby]="group.id + '-heading'">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">{{ group.eyebrow }}</p>
          <h2 [id]="group.id + '-heading'" class="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{{ group.title }}</h2>
          <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{{ group.intro }}</p>
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          <article *ngFor="let item of group.items"
                   class="rounded-2xl border border-slate-200 bg-white p-7 transition-shadow hover:shadow-lg hover:shadow-slate-900/5">
            <div class="flex items-start gap-4">
              <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon" />
                </svg>
              </span>
              <div>
                <h3 class="text-lg font-bold text-slate-900">{{ item.name }}</h3>
                <p class="mt-1 text-sm font-medium text-blue-700">{{ item.tagline }}</p>
              </div>
            </div>
            <ul class="mt-5 space-y-2.5">
              <li *ngFor="let point of item.points" class="flex items-start gap-2.5 text-sm text-slate-600">
                <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {{ point.text }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Mobile apps -->
    <section id="mobile-apps" class="bg-slate-50 py-14 sm:py-16" aria-labelledby="apps-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Mobile apps</p>
          <h2 id="apps-heading" class="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Two dedicated mobile apps — included free
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Alongside the web panel, every school gets two purpose-built apps: one for parents,
            one for teachers. No extra charge, no per-user fee.
          </p>
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          <div class="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Parent app</p>
            <h3 class="mt-2 text-xl font-extrabold text-slate-900">Your child's school day, live</h3>
            <ul class="mt-5 space-y-3">
              <li *ngFor="let f of parentAppFeatures" class="flex items-start gap-2.5">
                <svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span class="text-sm leading-relaxed text-slate-700">{{ f }}</span>
              </li>
            </ul>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Teacher app</p>
            <h3 class="mt-2 text-xl font-extrabold text-slate-900">Classroom work in minutes</h3>
            <ul class="mt-5 space-y-3">
              <li *ngFor="let f of teacherAppFeatures" class="flex items-start gap-2.5">
                <svg class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span class="text-sm leading-relaxed text-slate-700">{{ f }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Non-tech reassurance -->
    <section class="bg-white py-14 sm:py-16" aria-labelledby="simple-heading">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl bg-slate-900 px-6 py-12 sm:px-12">
          <div class="mx-auto max-w-2xl text-center">
            <h2 id="simple-heading" class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Built for non-technical staff
            </h2>
            <p class="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Your teachers and office staff don't need training certificates. SchoolSense uses
              big buttons, simple words and one obvious way to do each task — the same ease as
              the apps they already use daily.
            </p>
          </div>
          <div class="mt-9 grid gap-4 sm:grid-cols-3">
            <div class="rounded-2xl bg-slate-800/60 p-6 text-center ring-1 ring-slate-700">
              <p class="text-3xl">👆</p>
              <p class="mt-2 text-sm font-bold text-white">One obvious way</p>
              <p class="mt-1 text-xs leading-relaxed text-slate-400">Each task has one clear flow — mark, save, done.</p>
            </div>
            <div class="rounded-2xl bg-slate-800/60 p-6 text-center ring-1 ring-slate-700">
              <p class="text-3xl">📱</p>
              <p class="mt-2 text-sm font-bold text-white">Any device</p>
              <p class="mt-1 text-xs leading-relaxed text-slate-400">Works on phones, tablets and computers — nothing to install.</p>
            </div>
            <div class="rounded-2xl bg-slate-800/60 p-6 text-center ring-1 ring-slate-700">
              <p class="text-3xl">🤝</p>
              <p class="mt-2 text-sm font-bold text-white">Free training</p>
              <p class="mt-1 text-xs leading-relaxed text-slate-400">We train your staff step by step during onboarding.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-white pb-16 sm:pb-24">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">See all of this working together</h2>
        <p class="mx-auto mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
          Book a free demo and we'll show you a full school running on SchoolSense — attendance to certificates.
        </p>
        <div class="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a routerLink="/contact" [queryParams]="{ type: 'demo' }"
             class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 sm:w-auto">
            Book a Free Demo
          </a>
          <a routerLink="/pricing"
             class="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-50 sm:w-auto">
            See Pricing
          </a>
        </div>
      </div>
    </section>
  `,
})
export class FeaturesComponent {
  private seo = inject(SeoService);

  parentPoints: { icon: string; label: string }[] = [
    { icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z', label: 'Live attendance updates' },
    { icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Homework & marks instantly' },
    { icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z', label: 'Fee invoices & receipts' },
    { icon: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46', label: 'Notices & event reminders' },
    { icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155', label: 'Complaint tracking end-to-end' },
    { icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', label: "Today's timetable" },
  ];

  parentAppFeatures = [
    'Push notification for every activity — attendance, homework, marks, fees, fines, events',
    'Live daily attendance the moment roll call happens',
    'Exam marks, results and report cards as soon as they are published',
    'Fee invoices, receipts and fines always available on the phone',
    'Raise complaints, follow every reply and see the status until resolved',
    'Notices, school events and holiday updates instantly',
    "Today's timetable — no morning confusion about books",
  ];

  teacherAppFeatures = [
    'Mark the whole class\u2019s attendance in seconds',
    'Post homework with due dates — parents notified instantly',
    'Enter marks once — results and report cards calculate automatically',
    'Receive parent complaints, reply and change status until resolved',
    'Publish circulars and notices to one class or the whole school',
    'Today\u2019s timetable and class strength at a glance',
  ];

  groups: FeatureSection[] = [
    {
      id: 'academics',
      eyebrow: 'For teaching',
      title: 'Academics — run every class smoothly',
      intro:
        'The daily work of teachers — timetable, roll call, homework and marks — becomes a few taps instead of paperwork.',
      items: [
        {
          icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
          name: 'Timetable & Scheduling',
          tagline: 'One timetable everyone can trust',
          points: [
            { text: 'Create class-wise and teacher-wise timetables in minutes.' },
            { text: 'Changes reflect instantly for teachers and parents.' },
            { text: 'Academic calendar with holidays and school events.' },
            { text: 'India-style April–March academic sessions built in.' },
          ],
        },
        {
          icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          name: 'Attendance Register',
          tagline: 'The whole class in seconds',
          points: [
            { text: 'Mark present, absent, late or half-day with one tap each.' },
            { text: 'Parents are informed the moment their child is marked absent.' },
            { text: 'Monthly attendance view for every student.' },
            { text: 'Class-teacher dashboard shows today\'s strength at a glance.' },
          ],
        },
        {
          icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18.75c1.955 0 3.684.672 5 1.808V7.542a6.984 6.984 0 00-1-1.5zM12 6.042A8.967 8.967 0 0118 3.75c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18.75c-1.955 0-3.684.672-5 1.808V7.542a6.984 6.984 0 011-1.5z',
          name: 'Homework & Assignments',
          tagline: 'No more lost diaries',
          points: [
            { text: 'Teachers post homework with subject, details and due date.' },
            { text: 'Parents see it the same evening on their phone.' },
            { text: 'Submissions and feedback stay on record.' },
            { text: 'Printable homework diary for classrooms without phones.' },
          ],
        },
        {
          icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
          name: 'Exams & Marksheets',
          tagline: 'Report cards without the maths',
          points: [
            { text: 'Schedule exams with dates, max marks and passing marks.' },
            { text: 'Enter marks once — totals, percentages and grades calculate automatically.' },
            { text: 'Printable report cards in your school\'s format.' },
            { text: 'Results appear on parents\' phones as soon as you publish.' },
          ],
        },
      ],
    },
    {
      id: 'office',
      eyebrow: 'For the school office',
      title: 'Administration — keep the office in order',
      intro:
        'Fees, notices, grievances, alumni and official documents — the work that keeps your office busy, made calm and organised.',
      items: [
        {
          icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z',
          name: 'Fee Management & Invoicing',
          tagline: 'Every rupee accounted for',
          points: [
            { text: 'Define fee categories and class-wise fee structures.' },
            { text: 'Generate student fee invoices and share receipts.' },
            { text: 'A clear payment record per student — no register needed.' },
            { text: 'Parents keep their receipts on their phone, forever.' },
          ],
        },
        {
          icon: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
          name: 'Circulars & Notices',
          tagline: 'Reach every parent instantly',
          points: [
            { text: 'Send notices to everyone or to selected classes only.' },
            { text: 'School events and holidays on a shared calendar.' },
            { text: 'No printing, no folding, no "my child never got the circular".' },
            { text: 'Printable bulletin if you still want a notice board copy.' },
          ],
        },
        {
          icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
          name: 'Grievance Desk / Complaints',
          tagline: 'Issues get resolved, not ignored',
          points: [
            { text: 'Parents raise concerns as tickets with full details.' },
            { text: 'Assign to the right teacher or staff member.' },
            { text: 'Threaded replies — the whole conversation stays on record.' },
            { text: 'Status tracking from "open" to "resolved" for everyone to see.' },
          ],
        },
        {
          icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
          name: 'Alumni Management',
          tagline: 'Your school community, for life',
          points: [
            { text: 'Graduating students become alumni with one click at year end.' },
            { text: 'Complete academic history stays with every alumnus.' },
            { text: 'Keep your alumni network ready for events and outreach.' },
          ],
        },
        {
          icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
          name: 'Auto-Generated Certificates',
          tagline: 'TC & CC in one click',
          points: [
            { text: 'Transfer Certificates with proper numbering and format.' },
            { text: 'Character Certificates, Bonafide and other school documents.' },
            { text: 'Uses the student\'s full academic record automatically.' },
            { text: 'Ready to print, sign and hand over.' },
          ],
        },
        {
          icon: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
          name: 'Academic Sessions & Promotion',
          tagline: 'Year-end in one click',
          points: [
            { text: 'Create the new academic session with all classes and sections.' },
            { text: 'Promote students class-wise automatically by school rules.' },
            { text: 'Graduating class moves to alumni — nothing lost.' },
          ],
        },
      ],
    },
  ];

  constructor() {
    this.seo.setPage({
      title: 'Features — Attendance, Homework, Exams, Fees, Certificates & Parent Connect',
      description:
        'All SchoolSense features explained simply: timetable & scheduling, attendance register, homework & assignments, exams & marksheets, circulars & notices, grievance desk, fee management & invoicing, alumni management, auto-generated TC/CC certificates and live Parent Connect — all included in one plan.',
      path: '/features',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.schoolsense.in/' },
            { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://www.schoolsense.in/features' },
          ],
        },
      ],
    });
  }
}
