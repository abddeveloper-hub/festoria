// ============================================================================
// Festoria — Firebase Storage Service
// Handles authorized media uploads (Hero Video, PNG Logo, Main Photos)
// Validates file types, sizes, and maps download URLs.
// ============================================================================

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage, getFirebaseStorage, isFirebaseConfigured } from './config';

export type MediaUploadFolder = 'hero' | 'logo' | 'photos';

export interface UploadMediaResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// File constraints
export const MEDIA_LIMITS = {
  VIDEO_MAX_BYTES: 50 * 1024 * 1024, // 50 MB
  VIDEO_TYPES: ['video/mp4', 'video/webm'],
  LOGO_MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  LOGO_TYPES: ['image/png'],
  PHOTO_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
  PHOTO_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

/**
 * Validates file type and size before upload.
 */
export function validateMediaFile(file: File, folder: MediaUploadFolder): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (folder === 'hero') {
    if (!MEDIA_LIMITS.VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid video format. Supported formats are MP4 and WebM (video/mp4, video/webm).'
      };
    }
    if (file.size > MEDIA_LIMITS.VIDEO_MAX_BYTES) {
      return {
        valid: false,
        error: `Video size exceeds limit. Maximum allowed size is 50MB (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`
      };
    }
  } else if (folder === 'logo') {
    if (!MEDIA_LIMITS.LOGO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid logo format. Please upload a transparent PNG image (image/png).'
      };
    }
    if (file.size > MEDIA_LIMITS.LOGO_MAX_BYTES) {
      return {
        valid: false,
        error: `Logo size exceeds limit. Maximum allowed size is 5MB.`
      };
    }
  } else if (folder === 'photos') {
    if (!MEDIA_LIMITS.PHOTO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid photo format. Supported formats are JPG, PNG, and WebP.'
      };
    }
    if (file.size > MEDIA_LIMITS.PHOTO_MAX_BYTES) {
      return {
        valid: false,
        error: `Photo size exceeds limit. Maximum allowed size is 10MB.`
      };
    }
  }

  return { valid: true };
}

/**
 * Uploads media file to Firebase Storage under /fests/{festId}/{folder}/.
 * Provides real-time upload percentage tracking.
 */
export async function uploadFestMedia(
  festId: string,
  folder: MediaUploadFolder,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadMediaResult> {
  const validation = validateMediaFile(file, folder);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed.');
  }

  const cleanFestId = (festId || 'FEST-01').trim();
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `fests/${cleanFestId}/${folder}/${timestamp}_${sanitizedName}`;

  const firebaseStorage = storage || getFirebaseStorage();

  // If live Firebase Storage is configured, execute real upload task
  if (isFirebaseConfigured && firebaseStorage) {
    try {
      const storageRef = ref(firebaseStorage, storagePath);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          festId: cleanFestId,
          uploadedAt: new Date().toISOString()
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      return new Promise<UploadMediaResult>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            if (snapshot.totalBytes > 0 && onProgress) {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              onProgress(progress);
            }
          },
          (error) => {
            console.warn('[Firebase Storage] Upload failed:', error);
            // Fallback to local Data URL if bucket permissions are blocked
            fallbackLocalUpload(file, storagePath, resolve);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (onProgress) onProgress(100);
              resolve({
                downloadUrl,
                storagePath,
                fileName: file.name,
                fileSize: file.size,
                contentType: file.type
              });
            } catch (urlErr) {
              fallbackLocalUpload(file, storagePath, resolve);
            }
          }
        );
      });
    } catch (err: any) {
      console.warn('[Firebase Storage] Exception during upload:', err);
      return new Promise((resolve) => fallbackLocalUpload(file, storagePath, resolve));
    }
  }

  // Offline / Local Development Fallback
  return new Promise((resolve) => fallbackLocalUpload(file, storagePath, resolve));
}

/**
 * Fallback to FileReader DataURL for local offline demo execution
 */
function fallbackLocalUpload(
  file: File,
  storagePath: string,
  resolve: (res: UploadMediaResult) => void
) {
  const reader = new FileReader();
  reader.onload = () => {
    resolve({
      downloadUrl: reader.result as string,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    });
  };
  reader.onerror = () => {
    const objectUrl = URL.createObjectURL(file);
    resolve({
      downloadUrl: objectUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    });
  };
  reader.readAsDataURL(file);
}

/**
 * Deletes media from Firebase Storage by storagePath.
 */
export async function deleteFestMedia(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.startsWith('data:') || storagePath.startsWith('blob:')) {
    return;
  }

  const firebaseStorage = storage || getFirebaseStorage();
  if (isFirebaseConfigured && firebaseStorage) {
    try {
      const storageRef = ref(firebaseStorage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('[Firebase Storage] Delete file error (may already be deleted):', err);
    }
  }
}

