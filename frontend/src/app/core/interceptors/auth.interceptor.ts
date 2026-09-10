import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  console.log(`📡 [API Call OUT] ${authReq.method} ${authReq.urlWithParams}`);

  return next(authReq).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(`✅ [API Response ${event.status}] ${authReq.method} ${authReq.urlWithParams}`, event.body);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error(`❌ [API Error ${err.status}] ${authReq.method} ${authReq.urlWithParams}`, err);
        if (err.status === 403) {
          const msg = err.error?.message || '';
          if (typeof msg === 'string' && msg.includes('disabled for this institution')) {
            toast.error(msg);
            authService.fetchProfile().subscribe();
            router.navigate(['/dashboard']);
          }
        }
      },
    })
  );
};

