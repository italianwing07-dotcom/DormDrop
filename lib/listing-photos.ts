export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const PHOTO_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";
const types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];

export function validatePhoto(file: File) {
  if (!/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name) || (file.type && !types.includes(file.type))) {
    throw new Error("Choose a JPG, PNG, WEBP, GIF, or HEIC photo.");
  }
  if (!file.size) throw new Error("This photo is empty. Please choose another photo.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Each original photo must be 20 MB or smaller.");
}

function decodePhoto(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("We couldn't read this photo. Try another photo or export it as JPG.")); };
    image.src = url;
  });
}

export async function prepareListingPhoto(file: File): Promise<File> {
  validatePhoto(file);
  let source: Blob = file;
  if (/\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]/.test(file.type)) {
    try {
      // Load the decoder only when an iPhone photo needs conversion.
      const { heicTo } = await import("heic-to/csp");
      source = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
    } catch {
      throw new Error("We couldn't convert this iPhone photo. Export it as JPG or choose another photo.");
    }
  }
  const image = await decodePhoto(source);
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 60000000) {
    throw new Error("This photo is too large to process. Choose a smaller version.");
  }
  // Keep small animated GIFs intact, but still decode them to reject invalid files.
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("GIF photos must be 5 MB or smaller.");
    return new File([file], file.name, { type: "image/gif" });
  }
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser couldn't prepare this photo. Please try another browser.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Photo compression failed. Please try another photo.")),
    "image/jpeg", 0.82
  ));
  canvas.width = canvas.height = 0;
  if (result.size > MAX_UPLOAD_BYTES) throw new Error("This photo is still too large. Choose a smaller version.");
  return new File([result], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
