import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

export interface GuideWorkflow {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  requiredRoles?: string[];
  requireClassTeacher?: boolean;
  requiredService?: string;
  requiredSectionId?: string;
  deniedReason?: string;
  route: string;
  queryParams?: Record<string, any>;
  highlightTargets: string[]; // Text labels or CSS selectors of buttons on the page to spotlight
  steps: string[];
}

export interface GuideChatMessage {
  id: string;
  sender: 'BOT' | 'USER';
  text: string;
  status?: 'ALLOWED' | 'DENIED' | 'OFF_TOPIC' | 'INFO';
  workflow?: GuideWorkflow;
  timestamp: string;
}

@Component({
  selector: 'app-ai-system-guide',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Active Guided Spotlight Banner (Light White Claymorphism Theme) -->
    <div *ngIf="activeGuidedWorkflow"
         class="fixed bottom-28 right-6 z-[75] max-w-sm w-full bg-white/95 backdrop-blur-xl text-slate-900 p-4 rounded-3xl border border-indigo-200/90 shadow-[12px_18px_36px_-4px_rgba(79,70,229,0.16),-6px_-6px_18px_#ffffff,inset_0_2px_4px_#ffffff] animate-fadeIn">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <!-- Mini Sense Cartoon Avatar (No background/border box) -->
          <div class="w-10 h-10 flex items-center justify-center shrink-0">
            <svg class="w-10 h-10 drop-shadow-[0_4px_8px_rgba(79,70,229,0.18)]" viewBox="0 0 64 64" fill="none">
              <!-- Graduation Cap -->
              <path d="M32 8L50 15L32 22L14 15L32 8Z" fill="#4f46e5" stroke="#312e81" stroke-width="2" stroke-linejoin="round"/>
              <path d="M46 16.5V24" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="46" cy="25" r="2" fill="#f59e0b"/>
              <!-- Cute Bot Head -->
              <rect x="16" y="20" width="32" height="26" rx="13" fill="#ffffff" stroke="#4f46e5" stroke-width="2.2"/>
              <rect x="20" y="24" width="24" height="16" rx="8" fill="#eef2ff"/>
              <!-- Blinking Eyes -->
              <circle cx="27" cy="31" r="2.5" fill="#312e81" class="sense-eye"/>
              <circle cx="37" cy="31" r="2.5" fill="#312e81" class="sense-eye"/>
              <circle cx="28" cy="30" r="0.9" fill="#ffffff"/>
              <circle cx="38" cy="30" r="0.9" fill="#ffffff"/>
              <!-- Happy Smile -->
              <path d="M28.5 35.5C29.5 37 34.5 37 35.5 35.5" stroke="#4f46e5" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="text-[10px] font-black uppercase tracking-wider text-indigo-600">Sense Assistant</div>
            <h4 class="text-xs font-black text-slate-900">{{ activeGuidedWorkflow.title }}</h4>
          </div>
        </div>
        <button type="button" (click)="stopGuidedSpotlight()"
                class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/80 text-[10px] font-extrabold text-slate-600 transition-colors cursor-pointer">
          Done ✕
        </button>
      </div>

      <div class="mt-3 space-y-1.5 text-[11px] text-slate-700 bg-indigo-50/45 p-3 rounded-2xl border border-indigo-100/90 shadow-[inset_0_1px_2px_#ffffff]">
        <div *ngFor="let step of activeGuidedWorkflow.steps; let i = index" class="flex items-start gap-2">
          <span class="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            {{ i + 1 }}
          </span>
          <span class="font-medium">{{ step }}</span>
        </div>
      </div>

      <div class="mt-2.5 flex items-center justify-between text-[10px] text-indigo-700 font-bold">
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          <span>Look for the glowing highlighted button on screen</span>
        </span>
        <button type="button" (click)="reHighlightTargets()" class="underline hover:text-indigo-900 cursor-pointer font-extrabold">
          Highlight Again
        </button>
      </div>
    </div>

    <!-- Floating Bottom-Right Sense Assistant Drawer (Pure White & Soft Pastel Claymorphism) -->
    <div *ngIf="isOpen"
         class="fixed bottom-28 right-6 z-[80] w-[360px] sm:w-[400px] max-h-[580px] bg-white rounded-[28px] border border-slate-200/90 shadow-[14px_22px_44px_-6px_rgba(15,23,42,0.12),-8px_-8px_24px_#ffffff,inset_0_2px_4px_#ffffff] flex flex-col overflow-hidden animate-fadeIn">

      <!-- Soft White & Pastel Claymorphic Header -->
      <div class="p-4 bg-gradient-to-br from-white via-indigo-50/45 to-sky-50/35 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <!-- Animated Sense Mascot Avatar in Header (Free-standing, no box border/background) -->
          <div class="w-12 h-12 flex items-center justify-center shrink-0">
            <svg class="w-12 h-12 sense-mascot-float drop-shadow-[0_6px_10px_rgba(79,70,229,0.2)]" viewBox="0 0 64 64" fill="none">
              <!-- Scholar Graduation Cap -->
              <path d="M32 6L52 14L32 22L12 14L32 6Z" fill="#4f46e5" stroke="#312e81" stroke-width="2" stroke-linejoin="round"/>
              <path d="M20 17.5V23C20 23 25 26 32 26C39 26 44 23 44 23V17.5" fill="#6366f1"/>
              <path d="M48 15.5V25" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="48" cy="26" r="2.2" fill="#f59e0b"/>
              <!-- Side Ear Earpieces -->
              <rect x="10" y="29" width="5" height="10" rx="2.5" fill="#818cf8" stroke="#4f46e5" stroke-width="1.6"/>
              <rect x="49" y="29" width="5" height="10" rx="2.5" fill="#818cf8" stroke="#4f46e5" stroke-width="1.6"/>
              <!-- Claymorphic White Head -->
              <rect x="14" y="20" width="36" height="28" rx="14" fill="#ffffff" stroke="#4f46e5" stroke-width="2.2"/>
              <!-- Soft Pastel Visor -->
              <rect x="18" y="24" width="28" height="18" rx="9" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1.4"/>
              <!-- Rosy Cheeks -->
              <ellipse cx="22.5" cy="35.5" rx="2.5" ry="1.4" fill="#fda4af" fill-opacity="0.75"/>
              <ellipse cx="41.5" cy="35.5" rx="2.5" ry="1.4" fill="#fda4af" fill-opacity="0.75"/>
              <!-- Animated Blinking Eyes -->
              <g class="sense-eye">
                <circle cx="26" cy="31.5" r="2.8" fill="#312e81"/>
                <circle cx="27" cy="30.5" r="1" fill="#ffffff"/>
                <circle cx="38" cy="31.5" r="2.8" fill="#312e81"/>
                <circle cx="39" cy="30.5" r="1" fill="#ffffff"/>
              </g>
              <!-- Friendly Smile -->
              <path d="M28.5 36.5C30 38.5 34 38.5 35.5 36.5" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-black tracking-tight text-slate-900 truncate">Sense</h3>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/90">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>
            <p class="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
              Your interactive campus guide & helper
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <!-- Close Button -->
          <button type="button" (click)="toggleOpen()"
                  class="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shadow-[2px_3px_8px_rgba(15,23,42,0.05),inset_0_1px_2px_#ffffff]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Feed (Bright Airy Claymorphic Surface) -->
      <div class="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-[#f8fafc] to-white max-h-[350px]">
        <div *ngFor="let msg of messages"
             class="flex flex-col"
             [ngClass]="msg.sender === 'USER' ? 'items-end' : 'items-start'">

          <div class="max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed transition-all"
               [ngClass]="{
                 'bg-gradient-to-br from-indigo-50 via-indigo-50/80 to-white text-indigo-950 border border-indigo-200/90 rounded-br-xs shadow-[4px_6px_14px_rgba(79,70,229,0.1),-2px_-2px_8px_#ffffff,inset_0_1px_2px_#ffffff]': msg.sender === 'USER',
                 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-[6px_8px_18px_rgba(15,23,42,0.06),-4px_-4px_12px_#ffffff,inset_0_1px_2px_#ffffff]': msg.sender === 'BOT' && msg.status !== 'DENIED' && msg.status !== 'OFF_TOPIC',
                 'bg-gradient-to-br from-rose-50/90 to-white text-rose-950 border border-rose-200/90 rounded-bl-xs shadow-[4px_6px_14px_rgba(244,63,94,0.08),inset_0_1px_2px_#ffffff]': msg.sender === 'BOT' && msg.status === 'DENIED',
                 'bg-gradient-to-br from-amber-50/90 to-white text-amber-950 border border-amber-200/90 rounded-bl-xs shadow-[4px_6px_14px_rgba(245,158,11,0.08),inset_0_1px_2px_#ffffff]': msg.sender === 'BOT' && msg.status === 'OFF_TOPIC'
               }">

            <!-- Status Pill for Sense Replies -->
            <div *ngIf="msg.sender === 'BOT' && (msg.status === 'ALLOWED' || msg.status === 'DENIED')" class="mb-2 flex items-center gap-1.5">
              <span *ngIf="msg.status === 'ALLOWED'" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/90">
                Ready to Guide
              </span>
              <span *ngIf="msg.status === 'DENIED'" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100/80 text-rose-800 border border-rose-300/80">
                Permission Required
              </span>
            </div>

            <p class="whitespace-pre-line font-medium">{{ msg.text }}</p>

            <!-- Confirmation & Start Navigation Card (Light Claymorphic Card) -->
            <div *ngIf="msg.workflow && msg.status === 'ALLOWED'"
                 class="mt-3 p-3 rounded-2xl bg-gradient-to-br from-[#f8fafc] via-white to-indigo-50/30 border border-indigo-100/90 space-y-2.5 shadow-[inset_0_1px_2px_#ffffff,0_2px_6px_rgba(15,23,42,0.03)]">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                  {{ msg.workflow.title }}
                </span>
              </div>

              <div class="space-y-1 text-[11px] text-slate-600">
                <div *ngFor="let st of msg.workflow.steps; let idx = index" class="flex items-start gap-1.5">
                  <span class="font-black text-indigo-600">{{ idx + 1 }}.</span>
                  <span>{{ st }}</span>
                </div>
              </div>

              <div class="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                <button type="button"
                        (click)="confirmAndNavigate(msg.workflow)"
                        class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-[11px] font-black border border-indigo-400/40 shadow-[0_6px_14px_rgba(79,70,229,0.28),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98">
                  <span>Yes, Take Me There</span>
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <span class="text-[9px] font-semibold text-slate-400 mt-1 px-1">{{ msg.timestamp }}</span>
        </div>

        <!-- Thinking / Loading Indicator -->
        <div *ngIf="isThinking" class="flex items-start">
          <div class="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-white border border-slate-200/90 shadow-[4px_6px_14px_rgba(15,23,42,0.05)] flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 120ms"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce" style="animation-delay: 240ms"></span>
            </span>
            <span class="text-[11px] text-slate-500">Sense is checking steps...</span>
          </div>
        </div>
      </div>

      <!-- Suggested Quick Tasks for Current Role -->
      <div class="px-3.5 py-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button *ngFor="let sug of roleSuggestedPrompts"
                type="button"
                (click)="askSuggestion(sug)"
                [disabled]="isThinking"
                class="px-2.5 py-1 rounded-xl bg-[#f8fafc] hover:bg-indigo-50/80 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 border border-slate-200/80 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-[2px_2px_6px_rgba(15,23,42,0.03),inset_0_1px_1px_#ffffff]">
          {{ sug }}
        </button>
      </div>

      <!-- Input Box (Soft Claymorphic White Input Bar) -->
      <form (ngSubmit)="submitQuery()" class="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input type="text"
               [(ngModel)]="userQuery"
               [disabled]="isThinking"
               name="guideQuery"
               placeholder="Ask Sense how to do a task (e.g. add student)..."
               class="flex-1 px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-400 shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)]" />
        <button type="submit"
                [disabled]="!userQuery.trim() || isThinking"
                class="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 text-white text-xs font-black border border-indigo-400/40 shadow-[0_6px_14px_rgba(79,70,229,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all cursor-pointer shrink-0">
          Ask
        </button>
      </form>
    </div>

    <!-- Bottom-Right Animated Cartoon Mascot Character ("Sense") — Free-standing 3D Claymorphic Character -->
    <button type="button"
            (click)="toggleOpen()"
            title="Ask Sense — Your Campus Assistant"
            class="fixed bottom-4 right-5 z-[80] flex flex-col items-center cursor-pointer group focus:outline-none select-none">

      <!-- Floating Greeting Speech Bubble above Sense -->
      <div *ngIf="!isOpen"
           class="mb-1 px-3 py-1 rounded-2xl bg-white text-slate-800 text-[10px] font-black border border-indigo-200/90 shadow-[4px_6px_16px_rgba(79,70,229,0.16),-2px_-2px_8px_#ffffff,inset_0_1px_2px_#ffffff] flex items-center gap-1.5 transition-transform duration-300 group-hover:-translate-y-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Hi, I'm <strong class="text-indigo-600">Sense!</strong></span>
      </div>

      <!-- Animated Full-Body Cartoon Character SVG (Not a plain circle) -->
      <div class="relative w-20 h-20 flex items-center justify-center sense-mascot-float">
        <!-- Soft Ground Shadow under floating character -->
        <div class="w-11 h-2.5 bg-indigo-900/15 rounded-full blur-[2px] absolute bottom-0.5 sense-ground-shadow"></div>

        <svg class="w-20 h-20 drop-shadow-[0_10px_16px_rgba(79,70,229,0.24)] transition-transform duration-300 group-hover:scale-105"
             viewBox="0 0 96 96" fill="none">
          <!-- Floating Sparkles around Sense -->
          <path class="sense-sparkle" d="M16 24L17.4 27.6L21 29L17.4 30.4L16 34L14.6 30.4L11 29L14.6 27.6L16 24Z" fill="#f59e0b"/>
          <circle class="sense-sparkle-delayed" cx="80" cy="22" r="2.2" fill="#818cf8"/>

          <!-- Waving Left Arm -->
          <g class="sense-wave-arm">
            <path d="M24 58C17 55 13 48 15 43C16.5 39.5 21 41 22 45L26 53" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="15.5" cy="42.5" r="3.8" fill="#ffffff" stroke="#4f46e5" stroke-width="2.2"/>
          </g>

          <!-- Right Arm -->
          <path d="M72 58C77 61 79 66 76 69C74 71 70 69 69 65L67 59" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="75.5" cy="68" r="3.5" fill="#ffffff" stroke="#4f46e5" stroke-width="2.2"/>

          <!-- Cute Claymorphic Body / Torso -->
          <path d="M31 55C31 51.6863 33.6863 49 37 49H59C62.3137 49 65 51.6863 65 55V69C65 76.732 58.732 83 51 83H45C37.268 83 31 76.732 31 69V55Z"
                fill="url(#senseBodyGrad)" stroke="#4f46e5" stroke-width="2.4"/>

          <!-- Belly Badge ("S" for Sense) -->
          <rect x="38" y="56" width="20" height="16" rx="8" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1.6"/>
          <circle cx="48" cy="64" r="4.5" fill="#4f46e5" fill-opacity="0.18"/>
          <path d="M46 64.5L47.5 66L50.5 62.5" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Cute Little Hover Feet -->
          <ellipse cx="41" cy="84.5" rx="4.5" ry="2.5" fill="#6366f1"/>
          <ellipse cx="55" cy="84.5" rx="4.5" ry="2.5" fill="#6366f1"/>

          <!-- Headphone / Ear Pods -->
          <rect x="19" y="31" width="6" height="13" rx="3" fill="#818cf8" stroke="#4f46e5" stroke-width="2"/>
          <rect x="71" y="31" width="6" height="13" rx="3" fill="#818cf8" stroke="#4f46e5" stroke-width="2"/>

          <!-- Claymorphic 3D Head -->
          <rect x="23" y="19" width="50" height="36" rx="18" fill="url(#senseHeadGrad)" stroke="#4f46e5" stroke-width="2.5"/>

          <!-- Inner Face Screen / Visor -->
          <rect x="29" y="25" width="38" height="24" rx="12" fill="#eef2ff" stroke="#c7d2fe" stroke-width="1.6"/>

          <!-- Rosy Cartoon Cheeks -->
          <ellipse cx="34.5" cy="40.5" rx="3.4" ry="2" fill="#fda4af" fill-opacity="0.8"/>
          <ellipse cx="61.5" cy="40.5" rx="3.4" ry="2" fill="#fda4af" fill-opacity="0.8"/>

          <!-- Expressive Blinking Cartoon Eyes -->
          <g class="sense-eye">
            <circle cx="40" cy="35.5" r="3.8" fill="#1e1b4b"/>
            <circle cx="41.3" cy="34.2" r="1.4" fill="#ffffff"/>
            <circle cx="38.8" cy="36.8" r="0.7" fill="#ffffff"/>

            <circle cx="56" cy="35.5" r="3.8" fill="#1e1b4b"/>
            <circle cx="57.3" cy="34.2" r="1.4" fill="#ffffff"/>
            <circle cx="54.8" cy="36.8" r="0.7" fill="#ffffff"/>
          </g>

          <!-- Cheerful Cartoon Smile -->
          <path d="M43.5 41.5C45.5 44.2 50.5 44.2 52.5 41.5" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Scholar Graduation Cap on Top of Head -->
          <path d="M48 5L72 14.5L48 24L24 14.5L48 5Z" fill="#4f46e5" stroke="#312e81" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M34 18.5V23.5C34 23.5 40 26.5 48 26.5C56 26.5 62 23.5 62 23.5V18.5" fill="#6366f1" stroke="#312e81" stroke-width="1.8" stroke-linejoin="round"/>
          <!-- Golden Tassel -->
          <path d="M67 16.5V27" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="67" cy="28" r="2.8" fill="#f59e0b"/>

          <defs>
            <linearGradient id="senseHeadGrad" x1="23" y1="19" x2="73" y2="55" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#f1f5f9"/>
            </linearGradient>
            <linearGradient id="senseBodyGrad" x1="31" y1="49" x2="65" y2="83" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#ffffff"/>
              <stop offset="100%" stop-color="#e0e7ff"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </button>
  `,
  styles: [`
    :host ::ng-deep .ai-guide-spotlight-pulse {
      position: relative !important;
      z-index: 70 !important;
      outline: 3px solid #4f46e5 !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 0 8px rgba(79, 70, 229, 0.25), 0 8px 24px rgba(79, 70, 229, 0.35) !important;
      animation: aiSpotlightPulse 1.4s ease-in-out infinite !important;
      border-radius: 14px !important;
    }
    @keyframes aiSpotlightPulse {
      0%, 100% {
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.3), 0 6px 20px rgba(79, 70, 229, 0.35);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(79, 70, 229, 0.12), 0 8px 28px rgba(79, 70, 229, 0.5);
      }
    }
    .sense-mascot-float {
      animation: senseFloat 3.2s ease-in-out infinite;
    }
    @keyframes senseFloat {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-6px);
      }
    }
    .sense-ground-shadow {
      animation: senseShadowScale 3.2s ease-in-out infinite;
    }
    @keyframes senseShadowScale {
      0%, 100% {
        transform: scaleX(1);
        opacity: 0.22;
      }
      50% {
        transform: scaleX(0.75);
        opacity: 0.12;
      }
    }
    .sense-wave-arm {
      transform-origin: 25px 54px;
      animation: senseWave 2.4s ease-in-out infinite;
    }
    @keyframes senseWave {
      0%, 100% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(-16deg);
      }
      50% {
        transform: rotate(8deg);
      }
      75% {
        transform: rotate(-12deg);
      }
    }
    .sense-eye {
      transform-origin: center 35.5px;
      animation: senseBlink 4.5s infinite;
    }
    @keyframes senseBlink {
      0%, 94%, 98%, 100% {
        transform: scaleY(1);
      }
      96% {
        transform: scaleY(0.1);
      }
    }
    .sense-sparkle {
      animation: senseTwinkle 2.2s ease-in-out infinite;
    }
    .sense-sparkle-delayed {
      animation: senseTwinkle 2.2s ease-in-out 1.1s infinite;
    }
    @keyframes senseTwinkle {
      0%, 100% {
        opacity: 0.35;
        transform: scale(0.85);
      }
      50% {
        opacity: 1;
        transform: scale(1.15);
      }
    }
  `],
})
export class AiSystemGuideComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  router = inject(Router);

  isOpen = false;
  isThinking = false;
  userQuery = '';
  messages: GuideChatMessage[] = [];
  activeGuidedWorkflow: GuideWorkflow | null = null;
  private highlightTimer: any = null;

  private readonly workflows: GuideWorkflow[] = [
    {
      id: 'add-student',
      title: 'Enroll / Add a New Student',
      category: 'Academics',
      keywords: ['add student', 'new student', 'enroll student', 'student admission', 'admit student', 'create student', 'register student', 'naya student', 'admission'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL'],
      requiredService: 'ACADEMICS',
      requiredSectionId: 'academics',
      deniedReason: 'Only School Administrators and Principals are authorized to admit or add new students into the school register.',
      route: '/academics',
      queryParams: { tab: 'students' },
      highlightTargets: ['Enroll Student', 'Add Student', '+ Enroll Student', 'New Student', 'Students'],
      steps: [
        'Navigate to Academics → Students Directory tab.',
        'Click the highlighted "+ Enroll Student" button in the top-right action bar.',
        'Fill in student details, class/section, and guardian phone/email, then click Save.',
      ],
    },
    {
      id: 'add-class-section',
      title: 'Create or Manage Classes & Sections',
      category: 'Academics',
      keywords: ['add class', 'new class', 'create class', 'add section', 'create section', 'configure class', 'manage classes'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL'],
      requiredService: 'ACADEMICS',
      requiredSectionId: 'academics',
      deniedReason: 'Only School Administrators and Principals are authorized to create or modify school classes and sections.',
      route: '/academics',
      queryParams: { tab: 'classes' },
      highlightTargets: ['Add Class', '+ Add Class', 'New Class', 'Create Class', 'Classes'],
      steps: [
        'Open Academics → Classes & Sections view.',
        'Click the highlighted "+ Add Class" button to create a grade or click a class card to add sections.',
      ],
    },
    {
      id: 'add-teacher-staff',
      title: 'Add Faculty / Teacher or Departmental Staff',
      category: 'Staff',
      keywords: ['add teacher', 'new teacher', 'hire teacher', 'add faculty', 'add staff', 'departmental staff', 'create user'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL'],
      requiredService: 'ACADEMICS',
      requiredSectionId: 'academics',
      deniedReason: 'Only School Administrators and Principals can onboard faculty members or departmental staff accounts.',
      route: '/academics',
      queryParams: { tab: 'staff' },
      highlightTargets: ['Add Faculty', 'Add Staff', '+ Add', 'Faculty', 'Staff'],
      steps: [
        'Navigate to Academics → Faculty & Staff tab (or Departmental Staff page).',
        'Click the highlighted "Add Faculty / Staff" button and assign their role and credentials.',
      ],
    },
    {
      id: 'change-timetable',
      title: 'Configure or Change Class Timetable',
      category: 'Timetable',
      keywords: ['change timetable', 'edit timetable', 'update timetable', 'modify timetable', 'create timetable', 'add period', 'schedule period', 'assign period'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'CLASS_TEACHER'],
      requireClassTeacher: true,
      requiredService: 'TIMETABLE',
      requiredSectionId: 'timetable',
      deniedReason: 'You are not authorized to modify the class timetable. Only the designated Class Teacher of that class/section or a School Administrator can add or edit timetable periods.',
      route: '/timetable',
      highlightTargets: ['Add Period', '+ Add Period', 'Edit', 'Configure', 'Save Period', 'Timetable'],
      steps: [
        'Open the Class Timetable module.',
        'Select your assigned Class & Section from the top filter.',
        'Click the highlighted "+ Add Period" button to assign subject, teacher, and time slot.',
      ],
    },
    {
      id: 'view-timetable',
      title: 'View Weekly Class Timetable',
      category: 'Timetable',
      keywords: ['view timetable', 'see timetable', 'check timetable', 'my timetable', 'class schedule', 'today schedule', 'routine'],
      requiredService: 'TIMETABLE',
      requiredSectionId: 'timetable',
      route: '/timetable',
      highlightTargets: ['Timetable', 'Monday', 'Tuesday', 'Download', 'Print'],
      steps: [
        'Navigate to the Timetable page.',
        'View the day-by-day period schedule for your class or teaching routine.',
      ],
    },
    {
      id: 'mark-attendance',
      title: 'Mark Daily Student Attendance',
      category: 'Attendance',
      keywords: ['mark attendance', 'take attendance', 'roll call', 'submit attendance', 'update attendance', 'absent present'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'CLASS_TEACHER', 'TEACHER'],
      requireClassTeacher: true,
      requiredService: 'ATTENDANCE',
      requiredSectionId: 'attendance',
      deniedReason: 'Only designated Class Teachers (for their assigned homeroom section) or School Administrators can mark or modify student attendance registers.',
      route: '/attendance',
      highlightTargets: ['Submit Attendance', 'Save Attendance', 'Mark All Present', 'Attendance'],
      steps: [
        'Open the Daily Attendance Register page.',
        'Select your assigned section and date.',
        'Toggle Present / Absent / Late for students and click the highlighted "Save / Submit Attendance" button.',
      ],
    },
    {
      id: 'view-attendance',
      title: 'Check Attendance History & Percentage',
      category: 'Attendance',
      keywords: ['view attendance', 'check attendance', 'attendance report', 'my child attendance', 'attendance percentage'],
      requiredService: 'ATTENDANCE',
      requiredSectionId: 'attendance',
      route: '/attendance',
      highlightTargets: ['Attendance', 'Calendar', 'Monthly'],
      steps: [
        'Open the Attendance section.',
        'Review daily present/absent status and monthly attendance percentage.',
      ],
    },
    {
      id: 'post-homework',
      title: 'Post Homework or Class Diary Assignment',
      category: 'Homework',
      keywords: ['post homework', 'add homework', 'create homework', 'assign homework', 'new homework', 'upload homework'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'CLASS_TEACHER', 'TEACHER'],
      requiredService: 'HOMEWORK',
      requiredSectionId: 'homework',
      deniedReason: 'Only Teachers and School Administrators are authorized to post homework assignments. Parents and students have read-only access to view homework.',
      route: '/homework',
      highlightTargets: ['Post Homework', 'Add Homework', '+ New Homework', 'Create Homework', 'Assign'],
      steps: [
        'Open the Homework & Diary module.',
        'Click the highlighted "+ Post Homework" button.',
        'Select class, section, subject, due date, and description, then publish.',
      ],
    },
    {
      id: 'view-homework',
      title: 'View Homework & Class Assignments',
      category: 'Homework',
      keywords: ['view homework', 'check homework', 'see homework', 'homework diary', 'pending homework'],
      requiredService: 'HOMEWORK',
      requiredSectionId: 'homework',
      route: '/homework',
      highlightTargets: ['Homework', 'Filter'],
      steps: [
        'Open the Homework & Diary section to view active assignments and due dates.',
      ],
    },
    {
      id: 'manage-exams-marks',
      title: 'Schedule Exams or Enter Student Marks',
      category: 'Exams',
      keywords: ['enter marks', 'upload marks', 'create exam', 'schedule exam', 'add exam', 'grade students', 'marksheet'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'CLASS_TEACHER', 'TEACHER'],
      requiredService: 'EXAMS',
      requiredSectionId: 'exams',
      deniedReason: 'Only Faculty Teachers and School Administrators are authorized to schedule exams or enter student marks.',
      route: '/exams',
      highlightTargets: ['Create Exam', 'Enter Marks', 'Save Marks', '+ New Exam', 'Exams'],
      steps: [
        'Navigate to the Exams & Marks module.',
        'Select the exam and click the highlighted "Enter Marks" or "+ Create Exam" button.',
      ],
    },
    {
      id: 'view-results',
      title: 'View Exam Schedule & Report Card Marks',
      category: 'Exams',
      keywords: ['view marks', 'check result', 'report card', 'exam schedule', 'exam dates', 'child marks'],
      requiredService: 'EXAMS',
      requiredSectionId: 'exams',
      route: '/exams',
      highlightTargets: ['Report Card', 'Exams', 'Results'],
      steps: [
        'Open the Exams & Report Cards section to view upcoming exam dates and published subject marks.',
      ],
    },
    {
      id: 'manage-fees',
      title: 'Create Fee Invoices & Record Fee Collection',
      category: 'Fees',
      keywords: ['collect fee', 'generate invoice', 'create fee', 'fee structure', 'record payment', 'add fee', 'fee management'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'FEE_MANAGER'],
      requiredService: 'FEES',
      requiredSectionId: 'fees',
      deniedReason: 'Only the Fee Management Department and School Administrators are authorized to generate fee structures or record fee payments.',
      route: '/fees',
      highlightTargets: ['Generate Invoices', 'Record Payment', 'Collect Fee', '+ Create', 'Fee'],
      steps: [
        'Open the Fee Management module.',
        'Use the highlighted action button to create fee structures, generate invoices, or record student fee payments.',
      ],
    },
    {
      id: 'view-parent-fees',
      title: 'View Student Fee Invoices & Payment Receipts',
      category: 'Fees',
      keywords: ['check fee', 'view fee', 'pay fee', 'fee receipt', 'pending dues', 'fee invoice', 'my child fee'],
      requiredService: 'FEES',
      requiredSectionId: 'fees',
      route: '/fees',
      highlightTargets: ['Invoices', 'Receipt', 'Fees'],
      steps: [
        'Navigate to the Fee Invoices & Receipts page to view billed amounts, paid receipts, and pending dues.',
      ],
    },
    {
      id: 'manage-transport',
      title: 'Manage School Buses, Routes & Student Bus Passes',
      category: 'Transport',
      keywords: ['add bus', 'add vehicle', 'create route', 'transport pass', 'assign bus', 'manage transport', 'fleet'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'TRANSPORT_MANAGER'],
      requiredService: 'TRANSPORT',
      requiredSectionId: 'transport',
      deniedReason: 'Only the Transport Department Officer and School Administrators can modify buses, transit routes, or student bus pass allocations.',
      route: '/transport',
      highlightTargets: ['Add Vehicle', 'Create Route', 'Issue Pass', 'Assign Pass', 'Transport'],
      steps: [
        'Open the Transport & Fleet Department module.',
        'Click the highlighted action button to register a bus, configure route stops, or issue a student bus pass.',
      ],
    },
    {
      id: 'publish-notice',
      title: 'Publish Official School Circular / Notice',
      category: 'Communication',
      keywords: ['publish notice', 'send circular', 'post announcement', 'create notice', 'broadcast notice'],
      requiredRoles: ['SCHOOL_ADMIN', 'PRINCIPAL', 'CLASS_TEACHER', 'TEACHER'],
      requiredService: 'COMMUNICATION',
      requiredSectionId: 'communication',
      deniedReason: 'Only School Administrators and authorized Faculty can broadcast official school circulars.',
      route: '/communication',
      highlightTargets: ['Publish Notice', 'New Notice', '+ Create Notice', 'Broadcast'],
      steps: [
        'Navigate to the Communication Hub.',
        'Click the highlighted "+ Publish Notice" button, choose target audience, and broadcast.',
      ],
    },
    {
      id: 'raise-complaint',
      title: 'Raise or Track a Support / Grievance Ticket',
      category: 'Complaints',
      keywords: ['raise complaint', 'new complaint', 'submit complaint', 'helpdesk', 'grievance', 'ticket', 'complaint status'],
      requiredService: 'COMPLAINTS',
      requiredSectionId: 'communication',
      route: '/communication',
      queryParams: { tab: 'complaints' },
      highlightTargets: ['Raise Complaint', 'New Complaint', 'Complaints', '+ New Ticket', 'Support'],
      steps: [
        'Open the Communication & Grievance Desk.',
        'Switch to the highlighted "Complaints" tab to raise a new ticket or reply to an existing thread.',
      ],
    },
  ];

  ngOnInit() {
    this.resetWelcomeMessage();
  }

  ngOnDestroy() {
    this.clearHighlights();
  }

  private get activeGeminiApiKey(): string {
    return ((environment as any).geminiApiKey || '').trim();
  }

  get hasGeminiKey(): boolean {
    return this.activeGeminiApiKey.length > 10;
  }

  get userRoleBadge(): string {
    const user = this.auth.currentUser();
    if (!user) return 'Guest';
    if (this.auth.isAdmin()) return 'School Admin';
    if (this.auth.isClassTeacher()) return 'Class Teacher';
    if (this.auth.isTeacher()) return 'Subject Teacher';
    if (this.auth.isParent()) return 'Parent / Guardian';
    return user.department || user.roleName || user.role || 'Staff';
  }

  get roleSuggestedPrompts(): string[] {
    if (this.auth.isAdmin()) {
      return ['How to add a student?', 'Change timetable', 'Collect fee', 'Manage transport'];
    }
    if (this.auth.isTeacher()) {
      return ['Mark attendance', 'Post homework', 'Enter exam marks', 'Change timetable'];
    }
    if (this.auth.isParent()) {
      return ['Check child attendance', 'View homework diary', 'Check fee dues', 'Raise a complaint'];
    }
    return ['Collect fee', 'Manage transport', 'Check notices', 'View directory'];
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.resetWelcomeMessage();
    }
  }

  resetWelcomeMessage() {
    const firstName = this.auth.currentUser()?.firstName || 'there';
    this.messages = [
      {
        id: 'welcome-1',
        sender: 'BOT',
        status: 'INFO',
        text: `Hi ${firstName}! I'm Sense, your personal school portal assistant.\n\nTell me what you'd like to do (for example: "add a new student", "mark attendance", or "change timetable") and I'll guide you step by step and highlight the right button for you!`,
        timestamp: this.nowTime(),
      },
    ];
  }

  askSuggestion(promptText: string) {
    this.userQuery = promptText;
    this.submitQuery();
  }

  async submitQuery() {
    const raw = this.userQuery.trim();
    if (!raw || this.isThinking) return;

    this.messages.push({
      id: 'u-' + Date.now(),
      sender: 'USER',
      text: raw,
      timestamp: this.nowTime(),
    });
    this.userQuery = '';

    const q = raw.toLowerCase();

    // 1. Immediate local guardrail against obvious coding / general trivia / external topics
    if (this.isOffTopicQuery(q)) {
      this.messages.push({
        id: 'b-' + Date.now(),
        sender: 'BOT',
        status: 'OFF_TOPIC',
        text: `I'm Sense, your SchoolSense campus assistant! I only chat about topics related to the SchoolSense platform and your school operations.\n\nFeel free to ask me anything about Admissions, Attendance, Timetable, Homework, Exams, Fees, Transport, or how to use any feature here!`,
        timestamp: this.nowTime(),
      });
      return;
    }

    let matched: GuideWorkflow | null = null;
    let customBotNote = '';

    // 2. Use Gemini (gemini-flash-latest) for natural conversation about SchoolSense & workflow intent matching
    if (this.hasGeminiKey) {
      this.isThinking = true;
      const geminiResult = await this.classifyIntentWithGemini(raw);
      this.isThinking = false;

      if (geminiResult) {
        if (geminiResult.intentType === 'OFF_TOPIC') {
          this.messages.push({
            id: 'b-' + Date.now(),
            sender: 'BOT',
            status: 'OFF_TOPIC',
            text:
              geminiResult.friendlyMessage ||
              `I'm Sense! I can only chat about the SchoolSense platform and help you manage your school tasks here.`,
            timestamp: this.nowTime(),
          });
          return;
        }

        // Natural conversation about greetings, thanks, or general SchoolSense platform questions
        if (geminiResult.intentType === 'CONVERSATION' && (!geminiResult.workflowId || geminiResult.workflowId === 'NONE')) {
          this.messages.push({
            id: 'b-' + Date.now(),
            sender: 'BOT',
            status: 'INFO',
            text:
              geminiResult.friendlyMessage ||
              this.getNaturalConversationalReply(q),
            timestamp: this.nowTime(),
          });
          return;
        }

        if (geminiResult.workflowId && geminiResult.workflowId !== 'NONE') {
          matched = this.workflows.find((w) => w.id === geminiResult.workflowId) || null;
          customBotNote = geminiResult.friendlyMessage || '';
        }
      }
    }

    // 3. Fallback to deterministic local intent matcher if needed
    if (!matched) {
      matched = this.matchWorkflow(q);
    }

    // 4. If no specific workflow was triggered, check if it's natural conversational talk or a general SchoolSense question
    if (!matched) {
      const conversationalReply = this.getNaturalConversationalReply(q);
      this.messages.push({
        id: 'b-' + Date.now(),
        sender: 'BOT',
        status: 'INFO',
        text: conversationalReply,
        timestamp: this.nowTime(),
      });
      return;
    }

    // 5. Check if the module/service is enabled for this school
    if (matched.requiredService && !this.auth.isServiceEnabled(matched.requiredService)) {
      this.messages.push({
        id: 'b-' + Date.now(),
        sender: 'BOT',
        status: 'DENIED',
        text: `The "${matched.category}" service is currently disabled for your school campus. Please contact your School Administrator if this module needs to be activated.`,
        timestamp: this.nowTime(),
      });
      return;
    }

    // 6. Hard deterministic Role-Based & Class-Teacher Authorization Check
    const authCheck = this.verifyUserAuthorization(matched, q);
    if (!authCheck.allowed) {
      this.messages.push({
        id: 'b-' + Date.now(),
        sender: 'BOT',
        status: 'DENIED',
        text: authCheck.reason,
        timestamp: this.nowTime(),
      });
      return;
    }

    // 7. Authorized! Present step-by-step confirmation card before navigating
    this.messages.push({
      id: 'b-' + Date.now(),
      sender: 'BOT',
      status: 'ALLOWED',
      text:
        customBotNote ||
        `Sure! I can guide you to "${matched.title}".\n\nConfirm below and I'll open the page and highlight the exact button for you:`,
      workflow: matched,
      timestamp: this.nowTime(),
    });
  }

  private getNaturalConversationalReply(q: string): string {
    const firstName = this.auth.currentUser()?.firstName || 'there';
    const clean = q.replace(/[?!.,]/g, '').trim();

    // Greetings ("hello", "hi", "hey", "namaste", "good morning", "how are you")
    if (
      /^(hi|hello|hey|hii+|namaste|hola|good morning|good afternoon|good evening|kem cho|kaise ho|how are you|whats up|sup)\b/i.test(
        clean
      )
    ) {
      if (this.auth.isAdmin()) {
        return `Hello ${firstName}! Great to see you. How can I help you manage your campus on SchoolSense today?\n\nWe can enroll students, configure classes & timetables, review daily attendance, track fee collections, or manage school transport—just tell me what you'd like to do!`;
      }
      if (this.auth.isTeacher()) {
        return `Hello ${firstName}! Hope your classes are going well today. How can I help you on SchoolSense?\n\nYou can ask me to open your attendance register, post homework, enter exam marks, or check your class timetable!`;
      }
      if (this.auth.isParent()) {
        return `Hello ${firstName}! Welcome to SchoolSense. How can I help you with your child's school updates today?\n\nYou can ask me to check attendance, view the homework diary, check exam marks, download fee receipts, or raise a support ticket!`;
      }
      return `Hello ${firstName}! I'm Sense, your SchoolSense assistant. What would you like to work on today?`;
    }

    // Who are you / What is Sense / What is SchoolSense
    if (
      /\b(who are you|what is your name|your name|about yourself|what is sense|what is schoolsense|school sense|what can you do|help me|how does this work|features)\b/i.test(
        clean
      )
    ) {
      return `I'm Sense, your interactive assistant built right into the SchoolSense platform!\n\nAs a ${this.userRoleBadge}, you can chat with me naturally about anything on SchoolSense—whether you want to know how a module works, check if you have permission for a task, or have me take you directly to a page and highlight the exact button on screen.`;
    }

    // Thank you / appreciation
    if (/\b(thank|thanks|thx|shukriya|dhanyawad|awesome|great|cool|nice|good job)\b/i.test(clean)) {
      return `You're most welcome, ${firstName}! Always happy to help you around SchoolSense. Let me know whenever you need to jump to another section or have a question about the portal!`;
    }

    // Bye / closing
    if (/\b(bye|goodbye|see you|close|ok bye)\b/i.test(clean)) {
      return `See you soon, ${firstName}! I'll be right here in the corner whenever you need help on SchoolSense.`;
    }

    // Role / permission questions ("what is my role", "what can I access")
    if (/\b(my role|my permission|my access|what can i access|am i class teacher)\b/i.test(clean)) {
      const ctSections = (this.auth.currentUser()?.teachingScope?.classTeacherSections || [])
        .map((s: any) => `${s.className}-${s.sectionName}`)
        .join(', ');
      const ctNote = ctSections ? ` (Class Teacher of ${ctSections})` : '';
      return `You are currently signed in as a ${this.userRoleBadge}${ctNote}.\n\nTell me any task you want to perform on SchoolSense and I'll let you know how to do it or take you straight there!`;
    }

    // Dashboard / overview
    if (/\b(dashboard|home|overview|summary|analytics)\b/i.test(clean)) {
      return `Your SchoolSense Dashboard gives you a live visual summary and quick shortcuts for all active school modules enabled for your role. Want me to guide you to a specific module like Academics, Attendance, Timetable, Homework, Exams, Fees, or Transport?`;
    }

    // Default friendly SchoolSense-focused conversational reply
    return `Hi ${firstName}! I'm here to chat and help you with anything on the SchoolSense platform.\n\nYou can ask me questions about how SchoolSense modules work, or ask me to guide you to a task like:\n• Adding or managing students & classes\n• Marking or viewing daily attendance\n• Managing timetables, homework, or exam marks\n• Fee invoices, transport routes, or support tickets`;
  }

  private async classifyIntentWithGemini(userPrompt: string): Promise<{
    intentType: 'CONVERSATION' | 'WORKFLOW' | 'OFF_TOPIC';
    workflowId: string;
    friendlyMessage: string;
  } | null> {
    const apiKey = this.activeGeminiApiKey;
    if (!apiKey) return null;

    const model = (environment as any).geminiModel || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const user = this.auth.currentUser();
    const firstName = user?.firstName || 'there';
    const ctSections = (user?.teachingScope?.classTeacherSections || [])
      .map((s: any) => `${s.className}-${s.sectionName}`)
      .join(', ');

    const workflowCatalog = this.workflows
      .map((w) => `- "${w.id}": ${w.title} (Category: ${w.category})`)
      .join('\n');

    const promptText = `You are "Sense", the warm, friendly, conversational assistant inside the SchoolSense school management platform.
Current User: Name="${firstName}", Role="${this.userRoleBadge}", IsClassTeacher=${this.auth.isClassTeacher()}, AssignedClassTeacherSections="${ctSections || 'None'}".

RULES:
1. Never mention AI, Gemini, LLMs, or RBAC. Speak naturally and warmly as "Sense".
2. ALLOW natural conversation when the user:
   - Greets you ("hello", "hi", "good morning", "how are you", "namaste", etc.)
   - Says thanks, bye, or casual polite small talk
   - Asks about you ("who are you?", "what can you do?")
   - Asks general questions about the SchoolSense platform, school modules (Academics, Attendance, Timetable, Homework, Exams, Fees, Transport, Communication, Complaints, Dashboard, Sessions), or their role/permissions in the portal.
   For all of these, set "intentType": "CONVERSATION", "workflowId": "NONE", and write a helpful, warm, natural response in "friendlyMessage" tailored to ${firstName} (${this.userRoleBadge}) and the SchoolSense platform.
3. WORKFLOW NAVIGATION: When the user wants to perform or navigate to a specific action in SchoolSense, set "intentType": "WORKFLOW", pick the matching "workflowId" from the list below, and write a brief, friendly confirmation prompt in "friendlyMessage":
${workflowCatalog}
4. STRICT OFF-TOPIC GUARDRAIL: If the user asks about topics completely unrelated to SchoolSense or school portal usage (e.g., writing Python/JS code, general trivia like national flower/capitals/sports/movies/recipes/math problems), set "intentType": "OFF_TOPIC", "workflowId": "NONE", and politely explain in "friendlyMessage" that you are Sense and only chat about the SchoolSense platform.
5. Return ONLY valid JSON (no markdown fences) with shape:
{"intentType": "CONVERSATION" | "WORKFLOW" | "OFF_TOPIC", "workflowId": string, "friendlyMessage": string}

User message: "${userPrompt}"`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const rawText = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (!rawText) return null;

      const jsonCleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(jsonCleaned);
      const rawType = String(parsed.intentType || '').toUpperCase();
      const intentType: 'CONVERSATION' | 'WORKFLOW' | 'OFF_TOPIC' =
        rawType === 'OFF_TOPIC' || parsed.isOffTopic === true
          ? 'OFF_TOPIC'
          : rawType === 'WORKFLOW' || (parsed.workflowId && parsed.workflowId !== 'NONE')
          ? 'WORKFLOW'
          : 'CONVERSATION';

      return {
        intentType,
        workflowId: String(parsed.workflowId || 'NONE'),
        friendlyMessage: String(parsed.friendlyMessage || ''),
      };
    } catch {
      return null;
    }
  }

  private isOffTopicQuery(q: string): boolean {
    const offTopicPatterns = [
      'python', 'javascript', 'java ', 'c++', 'html code', 'write a script', 'write code',
      'national flower', 'national animal', 'prime minister', 'president of', 'capital of',
      'weather in', 'recipe', 'joke', 'poem', 'essay', 'story', 'movie', 'cricket', 'football',
      'who invented', 'what is the meaning of life', 'solve this math', 'translate', 'chatgpt',
    ];
    return offTopicPatterns.some((pat) => q.includes(pat));
  }

  private matchWorkflow(q: string): GuideWorkflow | null {
    const isMutatingIntent = /\b(add|create|new|change|edit|update|modify|delete|remove|mark|post|publish|assign|collect|issue|enroll|admit|naya|badalna|banao)\b/i.test(q);

    for (const wf of this.workflows) {
      if (wf.keywords.some((kw) => q.includes(kw))) {
        return wf;
      }
    }

    if (q.includes('student') || q.includes('admission')) {
      return this.workflows.find((w) => w.id === 'add-student') || null;
    }
    if (q.includes('timetable') || q.includes('schedule') || q.includes('period') || q.includes('routine')) {
      if (isMutatingIntent) {
        return this.workflows.find((w) => w.id === 'change-timetable') || null;
      }
      return this.workflows.find((w) => w.id === 'view-timetable') || null;
    }
    if (q.includes('attendance') || q.includes('roll call') || q.includes('hajiri')) {
      if (isMutatingIntent || this.auth.isTeacher() || this.auth.isAdmin()) {
        return this.workflows.find((w) => w.id === 'mark-attendance') || null;
      }
      return this.workflows.find((w) => w.id === 'view-attendance') || null;
    }
    if (q.includes('homework') || q.includes('diary') || q.includes('assignment')) {
      if (isMutatingIntent) {
        return this.workflows.find((w) => w.id === 'post-homework') || null;
      }
      return this.workflows.find((w) => w.id === 'view-homework') || null;
    }
    if (q.includes('exam') || q.includes('mark') || q.includes('result') || q.includes('report card')) {
      if (isMutatingIntent) {
        return this.workflows.find((w) => w.id === 'manage-exams-marks') || null;
      }
      return this.workflows.find((w) => w.id === 'view-results') || null;
    }
    if (q.includes('fee') || q.includes('invoice') || q.includes('dues') || q.includes('receipt')) {
      if (isMutatingIntent && !this.auth.isParent()) {
        return this.workflows.find((w) => w.id === 'manage-fees') || null;
      }
      return this.workflows.find((w) => w.id === (this.auth.isParent() ? 'view-parent-fees' : 'manage-fees')) || null;
    }
    if (q.includes('transport') || q.includes('bus') || q.includes('route') || q.includes('fleet')) {
      return this.workflows.find((w) => w.id === 'manage-transport') || null;
    }
    if (q.includes('complaint') || q.includes('grievance') || q.includes('ticket') || q.includes('helpdesk')) {
      return this.workflows.find((w) => w.id === 'raise-complaint') || null;
    }
    if (q.includes('notice') || q.includes('circular') || q.includes('announcement')) {
      return this.workflows.find((w) => w.id === 'publish-notice') || null;
    }
    if (q.includes('class') || q.includes('section')) {
      return this.workflows.find((w) => w.id === 'add-class-section') || null;
    }
    if (q.includes('teacher') || q.includes('staff') || q.includes('faculty')) {
      return this.workflows.find((w) => w.id === 'add-teacher-staff') || null;
    }

    return null;
  }

  private verifyUserAuthorization(wf: GuideWorkflow, rawQuery: string): { allowed: boolean; reason: string } {
    const user = this.auth.currentUser();
    const role = (user?.role || '').toUpperCase();

    if (this.auth.isAdmin()) {
      return { allowed: true, reason: '' };
    }

    if (wf.requiredRoles && wf.requiredRoles.length > 0) {
      const roleAllowed = wf.requiredRoles.includes(role) ||
        (wf.id === 'manage-fees' && this.auth.isSectionAllowedForUser('fees') && !this.auth.isParent()) ||
        (wf.id === 'manage-transport' && this.auth.isSectionAllowedForUser('transport') && !this.auth.isParent());

      if (!roleAllowed) {
        return {
          allowed: false,
          reason: wf.deniedReason || `Your current role (${this.userRoleBadge}) does not have permission to perform "${wf.title}".`,
        };
      }
    }

    if (wf.requireClassTeacher && this.auth.isTeacher()) {
      const isCT = this.auth.isClassTeacher();
      const ctSections = user?.teachingScope?.classTeacherSections || [];
      if (!isCT && ctSections.length === 0) {
        return {
          allowed: false,
          reason: `You cannot perform "${wf.title}" because you are assigned as a Subject Teacher, not the designated Class Teacher of a section. Only the Class Teacher of that class or a School Administrator can do this.`,
        };
      }

      if (ctSections.length > 0) {
        const assignedLabel = `${ctSections[0].className} ${ctSections[0].sectionName}`.toLowerCase();
        const classMatch = rawQuery.match(/class\s*(\d+|[ivx]+|nursery|lkg|ukg)/i);
        if (classMatch && !assignedLabel.includes(classMatch[1].toLowerCase())) {
          return {
            allowed: false,
            reason: `You are the Class Teacher for ${ctSections[0].className} - ${ctSections[0].sectionName}, so you cannot modify records for ${classMatch[0]}.`,
          };
        }
      }
    }

    if (wf.requiredSectionId && !this.auth.isSectionAllowedForUser(wf.requiredSectionId)) {
      return {
        allowed: false,
        reason: wf.deniedReason || `Access to the ${wf.category} section is not enabled for your account (${this.userRoleBadge}).`,
      };
    }

    return { allowed: true, reason: '' };
  }

  confirmAndNavigate(wf: GuideWorkflow) {
    this.activeGuidedWorkflow = wf;
    this.isOpen = false;

    this.router.navigate([wf.route], { queryParams: wf.queryParams || {} }).then(() => {
      setTimeout(() => this.highlightDomElements(wf.highlightTargets), 450);
      setTimeout(() => this.highlightDomElements(wf.highlightTargets), 1200);
    });
  }

  reHighlightTargets() {
    if (this.activeGuidedWorkflow) {
      this.highlightDomElements(this.activeGuidedWorkflow.highlightTargets);
    }
  }

  stopGuidedSpotlight() {
    this.activeGuidedWorkflow = null;
    this.clearHighlights();
  }

  private clearHighlights() {
    if (this.highlightTimer) {
      clearTimeout(this.highlightTimer);
      this.highlightTimer = null;
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.ai-guide-spotlight-pulse').forEach((el) => {
        el.classList.remove('ai-guide-spotlight-pulse');
      });
    }
  }

  private highlightDomElements(targets: string[]) {
    if (typeof document === 'undefined' || !targets || targets.length === 0) return;
    this.clearHighlights();

    const candidates = Array.from(
      document.querySelectorAll('button, a, [role="button"], input[type="submit"]')
    ) as HTMLElement[];

    let matchedElements: HTMLElement[] = [];

    for (const targetText of targets) {
      const needle = targetText.toLowerCase().trim();
      const found = candidates.filter((el) => {
        const text = (el.innerText || el.textContent || '').toLowerCase().trim();
        const title = (el.getAttribute('title') || '').toLowerCase().trim();
        return (text && text.includes(needle)) || (title && title.includes(needle));
      });
      if (found.length > 0) {
        matchedElements = found.slice(0, 2);
        break;
      }
    }

    matchedElements.forEach((el, idx) => {
      el.classList.add('ai-guide-spotlight-pulse');
      if (idx === 0) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {}
      }
    });

    this.highlightTimer = setTimeout(() => {
      this.clearHighlights();
    }, 12000);
  }

  private nowTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
