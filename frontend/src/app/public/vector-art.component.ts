import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Decorative vector artwork for the marketing site.
 *
 * Each illustration is a self-contained inline SVG so it:
 *   - costs no extra network request,
 *   - scales crisply on any screen (retina, projector, print),
 *   - can be recoloured with a CSS class.
 *
 * Usage:  <app-vector-art name="classroom" class="h-40 w-40"></app-vector-art>
 */
export type VectorName =
  | 'classroom'
  | 'attendance'
  | 'homework'
  | 'exams'
  | 'fees'
  | 'notices'
  | 'certificate'
  | 'parent-phone'
  | 'teacher-app'
  | 'security'
  | 'cloud'
  | 'promotion'
  | 'timetable'
  | 'alumni'
  | 'complaint'
  | 'school-bus';

@Component({
  selector: 'app-vector-art',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"
         role="img" [attr.aria-label]="label || null" [attr.aria-hidden]="label ? null : 'true'">
      <ng-container [ngSwitch]="name">

        <!-- ============ CLASSROOM (Indian school scene) ============ -->
        <g *ngSwitchCase="'classroom'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <!-- blackboard -->
          <rect x="40" y="46" width="120" height="60" rx="6" class="va-board" />
          <rect x="46" y="52" width="108" height="48" rx="4" class="va-board-inner" />
          <line x1="56" y1="68" x2="112" y2="68" class="va-chalk" />
          <line x1="56" y1="80" x2="132" y2="80" class="va-chalk" />
          <line x1="56" y1="92" x2="98" y2="92" class="va-chalk" />
          <!-- desks -->
          <rect x="30" y="132" width="60" height="8" rx="3" class="va-desk" />
          <rect x="110" y="132" width="60" height="8" rx="3" class="va-desk" />
          <!-- two seated students -->
          <circle cx="54" cy="112" r="11" class="va-skin" />
          <path d="M43 132c0-7 5-12 11-12s11 5 11 12" class="va-uniform" />
          <circle cx="134" cy="112" r="11" class="va-skin" />
          <path d="M123 132c0-7 5-12 11-12s11 5 11 12" class="va-uniform" />
          <!-- teacher -->
          <circle cx="100" cy="118" r="9" class="va-skin" />
          <path d="M91 140c0-6 4-11 9-11s9 5 9 11" class="va-teacher" />
          <!-- floating book -->
          <rect x="88" y="146" width="26" height="18" rx="3" class="va-accent" />
          <line x1="101" y1="146" x2="101" y2="164" class="va-line-light" />
        </g>

        <!-- ============ ATTENDANCE ============ -->
        <g *ngSwitchCase="'attendance'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="52" y="38" width="96" height="124" rx="10" class="va-card" />
          <rect x="52" y="38" width="96" height="26" rx="10" class="va-accent" />
          <rect x="52" y="52" width="96" height="12" class="va-accent" />
          <circle cx="76" cy="84" r="9" class="va-skin" />
          <path d="M68 104c0-6 4-10 8-10s8 4 8 10" class="va-uniform" />
          <circle cx="76" cy="120" r="8" class="va-check-bg" />
          <path d="M72 120l3 3 5-6" class="va-check" />
          <line x1="96" y1="82" x2="134" y2="82" class="va-line" />
          <line x1="96" y1="94" x2="122" y2="94" class="va-line" />
          <circle cx="76" cy="146" r="9" class="va-skin" />
          <path d="M68 166c0-6 4-10 8-10s8 4 8 10" class="va-uniform" />
          <circle cx="76" cy="182" r="8" class="va-cross-bg" />
          <path d="M73 179l6 6M79 179l-6 6" class="va-cross" />
        </g>

        <!-- ============ HOMEWORK ============ -->
        <g *ngSwitchCase="'homework'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="46" y="42" width="84" height="112" rx="8" class="va-card" />
          <line x1="74" y1="42" x2="74" y2="154" class="va-line-faint" />
          <path d="M84 158V56c0-4 3-8 8-8h54c5 0 8 4 8 8v102" class="va-page" />
          <line x1="100" y1="72" x2="140" y2="72" class="va-line" />
          <line x1="100" y1="86" x2="146" y2="86" class="va-line" />
          <line x1="100" y1="100" x2="132" y2="100" class="va-line" />
          <line x1="100" y1="114" x2="142" y2="114" class="va-line" />
          <circle cx="152" cy="58" r="20" class="va-accent" />
          <path d="M145 58h14M152 51v14" class="va-plus" />
        </g>

        <!-- ============ EXAMS / MARKS ============ -->
        <g *ngSwitchCase="'exams'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="44" y="44" width="112" height="112" rx="10" class="va-card" />
          <rect x="58" y="60" width="84" height="12" rx="4" class="va-bar-1" />
          <rect x="58" y="80" width="70" height="10" rx="4" class="va-bar-2" />
          <rect x="58" y="98" width="78" height="10" rx="4" class="va-bar-1" />
          <rect x="58" y="116" width="52" height="10" rx="4" class="va-bar-3" />
          <circle cx="152" cy="60" r="24" class="va-accent" />
          <text x="152" y="68" text-anchor="middle" class="va-text">A+</text>
        </g>

        <!-- ============ FEES / RUPEES ============ -->
        <g *ngSwitchCase="'fees'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="48" y="52" width="104" height="96" rx="10" class="va-card" />
          <rect x="48" y="76" width="104" height="14" class="va-accent" />
          <rect x="62" y="100" width="30" height="30" rx="6" class="va-coin" />
          <text x="77" y="121" text-anchor="middle" class="va-text-sm">₹</text>
          <line x1="104" y1="104" x2="140" y2="104" class="va-line" />
          <line x1="104" y1="118" x2="128" y2="118" class="va-line" />
          <circle cx="150" cy="52" r="20" class="va-check-bg" />
          <path d="M143 52l5 5 10-11" class="va-check" />
        </g>

        <!-- ============ NOTICES / MEGAPHONE ============ -->
        <g *ngSwitchCase="'notices'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <path d="M56 88l64-28v80l-64-28z" class="va-accent" />
          <path d="M56 88h-14a8 8 0 00-8 8v8a8 8 0 008 8h14z" class="va-accent-dark" />
          <path d="M62 112l10 34h16l-8-34z" class="va-accent-dark" />
          <path d="M132 76c6 8 6 40 0 48" class="va-wave" />
          <path d="M146 64c11 13 11 59 0 72" class="va-wave" />
        </g>

        <!-- ============ CERTIFICATE ============ -->
        <g *ngSwitchCase="'certificate'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="48" y="42" width="104" height="118" rx="8" class="va-card" />
          <rect x="58" y="54" width="84" height="8" rx="3" class="va-line" />
          <rect x="58" y="70" width="60" height="6" rx="3" class="va-line-faint" />
          <rect x="58" y="84" width="72" height="6" rx="3" class="va-line-faint" />
          <circle cx="100" cy="122" r="18" class="va-accent" />
          <path d="M94 120l5 5 9-10" class="va-check" />
          <path d="M92 138l-6 20 14-8 14 8-6-20" class="va-seal" />
        </g>

        <!-- ============ PARENT PHONE ============ -->
        <g *ngSwitchCase="'parent-phone'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="64" y="34" width="72" height="132" rx="12" class="va-phone" />
          <rect x="70" y="46" width="60" height="108" rx="6" class="va-card" />
          <rect x="76" y="54" width="48" height="20" rx="4" class="va-accent-soft" />
          <circle cx="86" cy="64" r="5" class="va-check-bg" />
          <path d="M84 64l2 2 4-4" class="va-check" />
          <rect x="96" y="60" width="22" height="4" rx="2" class="va-line-faint" />
          <rect x="76" y="80" width="48" height="20" rx="4" class="va-accent-soft" />
          <circle cx="86" cy="90" r="5" class="va-check-bg" />
          <path d="M84 90l2 2 4-4" class="va-check" />
          <rect x="96" y="86" width="22" height="4" rx="2" class="va-line-faint" />
          <rect x="76" y="106" width="48" height="20" rx="4" class="va-accent-soft" />
          <circle cx="86" cy="116" r="5" class="va-check-bg" />
          <path d="M84 116l2 2 4-4" class="va-check" />
          <rect x="96" y="112" width="22" height="4" rx="2" class="va-line-faint" />
          <circle cx="100" cy="40" r="3" class="va-line-faint" />
        </g>

        <!-- ============ TEACHER APP ============ -->
        <g *ngSwitchCase="'teacher-app'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="64" y="34" width="72" height="132" rx="12" class="va-phone" />
          <rect x="70" y="46" width="60" height="108" rx="6" class="va-card" />
          <rect x="76" y="54" width="48" height="26" rx="5" class="va-accent-soft" />
          <circle cx="88" cy="67" r="6" class="va-accent" />
          <rect x="98" y="62" width="20" height="4" rx="2" class="va-line-faint" />
          <rect x="98" y="70" width="14" height="3" rx="1.5" class="va-line-faint" />
          <rect x="76" y="86" width="48" height="26" rx="5" class="va-accent-soft" />
          <rect x="82" y="94" width="14" height="10" rx="2" class="va-accent" />
          <rect x="100" y="94" width="18" height="4" rx="2" class="va-line-faint" />
          <rect x="100" y="102" width="12" height="3" rx="1.5" class="va-line-faint" />
          <rect x="76" y="118" width="48" height="26" rx="5" class="va-accent-soft" />
          <rect x="82" y="126" width="14" height="10" rx="2" class="va-check-bg" />
          <rect x="100" y="126" width="18" height="4" rx="2" class="va-line-faint" />
          <rect x="100" y="134" width="12" height="3" rx="1.5" class="va-line-faint" />
        </g>

        <!-- ============ SECURITY / SHIELD ============ -->
        <g *ngSwitchCase="'security'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <path d="M100 34l52 20v46c0 34-22 58-52 66-30-8-52-32-52-66V54z" class="va-accent-soft" />
          <path d="M100 46l40 15v39c0 26-17 45-40 51-23-6-40-25-40-51V61z" class="va-card" />
          <path d="M82 100l13 13 25-27" class="va-check-lg" />
        </g>

        <!-- ============ CLOUD ============ -->
        <g *ngSwitchCase="'cloud'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <path d="M62 118a26 26 0 010-52 34 34 0 0165-10 26 26 0 0111 50z" class="va-card" />
          <path d="M74 140h52M86 156h28" class="va-line" />
          <circle cx="100" cy="96" r="14" class="va-accent-soft" />
          <path d="M94 96l4 4 8-9" class="va-check" />
        </g>

        <!-- ============ PROMOTION / GROWTH ============ -->
        <g *ngSwitchCase="'promotion'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="46" y="140" width="26" height="36" rx="5" class="va-bar-3" />
          <rect x="82" y="112" width="26" height="64" rx="5" class="va-bar-1" />
          <rect x="118" y="82" width="26" height="94" rx="5" class="va-accent" />
          <path d="M52 124l36-30 30 14 30-38" class="va-wave-lg" />
          <path d="M140 70h14v14" class="va-wave-lg" />
        </g>

        <!-- ============ TIMETABLE ============ -->
        <g *ngSwitchCase="'timetable'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="44" y="48" width="112" height="104" rx="10" class="va-card" />
          <rect x="44" y="48" width="112" height="24" rx="10" class="va-accent" />
          <rect x="44" y="60" width="112" height="12" class="va-accent" />
          <line x1="44" y1="94" x2="156" y2="94" class="va-line-faint" />
          <line x1="44" y1="120" x2="156" y2="120" class="va-line-faint" />
          <line x1="82" y1="72" x2="82" y2="152" class="va-line-faint" />
          <line x1="120" y1="72" x2="120" y2="152" class="va-line-faint" />
          <rect x="50" y="100" width="26" height="14" rx="3" class="va-accent-soft" />
          <rect x="88" y="126" width="26" height="14" rx="3" class="va-accent-soft" />
          <rect x="126" y="100" width="24" height="14" rx="3" class="va-accent-soft" />
        </g>

        <!-- ============ ALUMNI / GRADUATION ============ -->
        <g *ngSwitchCase="'alumni'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <path d="M100 40l58 26-58 26-58-26z" class="va-accent" />
          <path d="M62 78v30c0 12 17 22 38 22s38-10 38-22V78" class="va-accent-soft" />
          <line x1="158" y1="66" x2="158" y2="118" class="va-line" />
          <circle cx="158" cy="124" r="7" class="va-coin" />
          <circle cx="100" cy="112" r="13" class="va-skin" />
          <path d="M87 138c0-8 6-14 13-14s13 6 13 14" class="va-uniform" />
        </g>

        <!-- ============ COMPLAINT / CHAT THREAD ============ -->
        <g *ngSwitchCase="'complaint'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <path d="M42 62a10 10 0 0110-10h96a10 10 0 0110 10v56a10 10 0 01-10 10H82l-22 22v-22H52a10 10 0 01-10-10z" class="va-card" />
          <rect x="58" y="68" width="72" height="8" rx="4" class="va-line" />
          <rect x="58" y="86" width="88" height="8" rx="4" class="va-line-faint" />
          <rect x="58" y="104" width="54" height="8" rx="4" class="va-line-faint" />
          <circle cx="152" cy="146" r="22" class="va-check-bg" />
          <path d="M144 146l6 6 11-12" class="va-check-lg" />
        </g>

        <!-- ============ SCHOOL BUS ============ -->
        <g *ngSwitchCase="'school-bus'">
          <circle cx="100" cy="100" r="92" class="va-bg-soft" />
          <rect x="34" y="76" width="132" height="60" rx="10" class="va-accent" />
          <rect x="44" y="88" width="30" height="24" rx="4" class="va-card" />
          <rect x="82" y="88" width="30" height="24" rx="4" class="va-card" />
          <rect x="120" y="88" width="34" height="24" rx="4" class="va-card" />
          <rect x="34" y="120" width="132" height="8" class="va-accent-dark" />
          <circle cx="66" cy="142" r="14" class="va-tyre" />
          <circle cx="66" cy="142" r="6" class="va-tyre-hub" />
          <circle cx="140" cy="142" r="14" class="va-tyre" />
          <circle cx="140" cy="142" r="6" class="va-tyre-hub" />
          <rect x="156" y="100" width="10" height="14" rx="3" class="va-accent-dark" />
        </g>

      </ng-container>
    </svg>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }

    /* soft circular backdrop */
    .va-bg-soft      { fill: #eff6ff; }

    /* surfaces */
    .va-card         { fill: #ffffff; stroke: #dbeafe; stroke-width: 1.5; }
    .va-page         { fill: #ffffff; stroke: #dbeafe; stroke-width: 1.5; }
    .va-board        { fill: #1e293b; }
    .va-board-inner  { fill: #334155; }
    .va-chalk        { stroke: #e2e8f0; stroke-width: 2.5; stroke-linecap: round; }
    .va-phone        { fill: #1e293b; }

    /* accents */
    .va-accent       { fill: #2563eb; }
    .va-accent-dark  { fill: #1d4ed8; }
    .va-accent-soft  { fill: #dbeafe; }
    .va-coin         { fill: #f59e0b; }
    .va-seal         { fill: #f59e0b; }
    .va-teacher      { fill: #0d9488; }
    .va-uniform      { fill: #1e40af; }
    .va-skin         { fill: #f5c9a6; }

    /* lines + bars */
    .va-line         { stroke: #93c5fd; stroke-width: 4; stroke-linecap: round; }
    .va-line-faint   { stroke: #dbeafe; stroke-width: 4; stroke-linecap: round; }
    .va-line-light   { stroke: #ffffff; stroke-width: 1.5; }
    .va-bar-1        { fill: #60a5fa; }
    .va-bar-2        { fill: #93c5fd; }
    .va-bar-3        { fill: #bfdbfe; }

    /* status marks */
    .va-check-bg     { fill: #d1fae5; }
    .va-check        { stroke: #059669; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
    .va-check-lg     { stroke: #059669; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; fill: none; }
    .va-cross-bg     { fill: #fee2e2; }
    .va-cross        { stroke: #dc2626; stroke-width: 2.2; stroke-linecap: round; fill: none; }
    .va-plus         { stroke: #ffffff; stroke-width: 3; stroke-linecap: round; }

    /* waves + growth */
    .va-wave         { stroke: #60a5fa; stroke-width: 3.5; stroke-linecap: round; fill: none; }
    .va-wave-lg      { stroke: #2563eb; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; fill: none; }

    /* vehicle */
    .va-tyre         { fill: #1e293b; }
    .va-tyre-hub     { fill: #94a3b8; }

    /* text */
    .va-text         { fill: #ffffff; font: 700 17px/1 Inter, system-ui, sans-serif; }
    .va-text-sm      { fill: #ffffff; font: 700 20px/1 Inter, system-ui, sans-serif; }
  `],
})
export class VectorArtComponent {
  @Input() name: VectorName = 'classroom';
  /** Optional accessible label. When omitted the art is decorative (aria-hidden). */
  @Input() label?: string;
}
