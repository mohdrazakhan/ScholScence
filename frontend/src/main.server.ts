// Storage shims must be in place before any Angular service touches localStorage.
import './prerender-polyfills';

import { ApplicationRef, PlatformRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/**
 * Server bootstrap for prerendering/SSR.
 * The build pipeline calls this per route and passes the server platform
 * context — it MUST be forwarded to bootstrapApplication so the app runs
 * on the server platform (domino document) instead of the browser one.
 */
export default function bootstrap(context: { platformRef: PlatformRef }): Promise<ApplicationRef> {
  return bootstrapApplication(AppComponent, config, context);
}
