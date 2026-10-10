/** Downscale to a 640px-wide JPEG data URL so thumbnails stay small in storage. */
export function toThumbnail(file: File, maxW = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable")); };
    img.src = url;
  });
}

/** Best-effort duration read; resolves 0 if the browser can't decode it. */
export function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (n: number) => { URL.revokeObjectURL(url); resolve(n); };
    const t = setTimeout(() => done(0), 4000);
    v.preload = "metadata";
    v.onloadedmetadata = () => { clearTimeout(t); done(Number.isFinite(v.duration) ? Math.round(v.duration) : 0); };
    v.onerror = () => { clearTimeout(t); done(0); };
    v.src = url;
  });
}
