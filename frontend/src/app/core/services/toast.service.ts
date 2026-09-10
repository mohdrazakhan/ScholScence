import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
  message: string;
  title?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastItem[]>([]);

  show(type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING', message: string, title?: string, durationMs = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = {
      id,
      type,
      message,
      title,
      timestamp: new Date(),
    };

    this.toasts.update((curr) => [...curr, toast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(message: string, title = 'Success', durationMs = 4000) {
    this.show('SUCCESS', message, title, durationMs);
  }

  error(message: string, title = 'Error', durationMs = 5000) {
    this.show('ERROR', message, title, durationMs);
  }

  info(message: string, title = 'Info', durationMs = 4000) {
    this.show('INFO', message, title, durationMs);
  }

  warning(message: string, title = 'Warning', durationMs = 4500) {
    this.show('WARNING', message, title, durationMs);
  }

  dismiss(id: string) {
    this.toasts.update((curr) => curr.filter((t) => t.id !== id));
  }
}
