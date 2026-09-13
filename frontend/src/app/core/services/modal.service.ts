import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  activeModal = signal<string | null>(null);
  modalData = signal<any>(null);

  open(modalId: string, data?: any) {
    this.activeModal.set(modalId);
    this.modalData.set(data || null);
  }

  close() {
    this.activeModal.set(null);
    this.modalData.set(null);
  }

  isOpen(modalId?: string): boolean {
    if (!modalId) return this.activeModal() !== null;
    return this.activeModal() === modalId;
  }
}
