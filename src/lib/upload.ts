export const PART_BYTES = 8 * 1024 * 1024;

export class UploadFailed extends Error {
  constructor(public resumeAt: number) {
    super("Connection lost during upload.");
  }
}

export interface UploadProgress {
  pct: number;
  part: number;
  parts: number;
}

/**
 * Simulates a resumable multipart upload. In production each part would be a presigned
 * PUT directly to object storage (see docs/ARCHITECTURE.md); the file never touches our app server.
 * `startAt` lets a retry continue from the last completed part.
 */
export function simulateUpload(size: number, o: { startAt?: number; failAt?: number; signal: AbortSignal; onProgress: (p: UploadProgress) => void }): Promise<void> {
  const parts = Math.max(1, Math.ceil(size / PART_BYTES));
  const steps = Math.min(parts, 40);
  const startStep = Math.floor((o.startAt ?? 0) * steps);
  return new Promise((resolve, reject) => {
    let step = startStep;
    const emit = () => o.onProgress({ pct: (step / steps) * 100, part: Math.min(parts, Math.ceil((step / steps) * parts) || 0), parts });
    emit();
    const t = setInterval(() => {
      if (o.signal.aborted) { clearInterval(t); return reject(new DOMException("Cancelled", "AbortError")); }
      step++;
      emit();
      if (o.failAt !== undefined && step / steps >= o.failAt && (o.startAt ?? 0) < o.failAt) {
        clearInterval(t);
        return reject(new UploadFailed((step - 1) / steps));
      }
      if (step >= steps) { clearInterval(t); resolve(); }
    }, Math.max(60, 3200 / steps));
  });
}
