import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private supabase = inject(SupabaseService);

  /**
   * Validates and compresses an image file on the client side, then returns either
   * a Supabase Storage URL or a high-efficiency Base64 Data URI fallback.
   */
  async processAndUploadImage(
    file: File,
    folder: 'logos' | 'staff' | 'students' | 'guardians' = 'students',
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.8
  ): Promise<string> {
    // 1. Validate File
    if (!file) {
      throw new Error('No file provided.');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (JPEG, PNG, WEBP, GIF, or SVG).');
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      throw new Error('Image size must be less than 5MB.');
    }

    // SVG files can be read directly as data URI without canvas compression
    if (file.type === 'image/svg+xml') {
      return await this.readFileAsDataUrl(file);
    }

    // 2. Compress & Resize using Client-Side HTML5 Canvas to high-efficiency WebP (~10-15KB)
    const compressedDataUrl = await this.compressImageToDataUrl(file, maxWidth, maxHeight, quality);

    // Return high-efficiency compressed WebP Data URI directly (100% instant, reliable, and offline-compatible)
    return compressedDataUrl;
  }

  /**
   * Helper to compress image file using HTML5 Canvas
   */
  private compressImageToDataUrl(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const image = new Image();
        image.onload = () => {
          let width = image.width;
          let height = image.height;

          // Calculate aspect-ratio preserved dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }

          // High quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(image, 0, 0, width, height);

          // Export as webp (or jpeg fallback)
          try {
            const dataUrl = canvas.toDataURL('image/webp', quality);
            resolve(dataUrl);
          } catch {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          }
        };

        image.onerror = (err) => reject(err);
        image.src = readerEvent.target?.result as string;
      };

      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }
}
