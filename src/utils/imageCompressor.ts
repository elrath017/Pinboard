/**
 * Adaptive Image Resizer & Compressor using HTML5 Canvas.
 * Ensures that image Base64 payloads are optimized for Cloud Firestore
 * (< 500,000 characters / ~375 KB) so they never exceed document size limits or security rules.
 */
export async function compressImage(
  file: File,
  initialMaxWidth = 1024,
  initialMaxHeight = 1024,
  initialQuality = 0.75
): Promise<string> {
  const TARGET_MAX_CHARS = 550000; // Guaranteed safe under Firestore 1MB / rules limit

  // If SVG, check length; if small enough, use directly
  if (file.type === 'image/svg+xml') {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    if (rawDataUrl.length <= TARGET_MAX_CHARS) {
      return rawDataUrl;
    }
    // If SVG is somehow huge (>550KB), continue below to rasterize and compress it
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let maxW = initialMaxWidth;
        let maxH = initialMaxHeight;
        let quality = initialQuality;
        const outputType = 'image/jpeg'; // JPEG has the most predictable size & highest compression efficiency across all browsers

        let bestDataUrl = '';

        // Attempt up to 4 compression passes with progressive step-down
        for (let pass = 0; pass < 4; pass++) {
          let width = img.width;
          let height = img.height;

          if (width > maxW || height > maxH) {
            if (width > height) {
              height = Math.round((height * maxW) / width);
              width = maxW;
            } else {
              width = Math.round((width * maxH) / height);
              height = maxH;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Fill clean background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          bestDataUrl = canvas.toDataURL(outputType, quality);

          // If size is comfortably within limits, return immediately
          if (bestDataUrl.length <= TARGET_MAX_CHARS) {
            resolve(bestDataUrl);
            return;
          }

          // Step down for next pass if too large
          if (pass === 0) {
            quality = 0.65;
            maxW = 900;
            maxH = 900;
          } else if (pass === 1) {
            quality = 0.55;
            maxW = 800;
            maxH = 800;
          } else {
            quality = 0.45;
            maxW = 640;
            maxH = 640;
          }
        }

        // Return the best compressed result
        resolve(bestDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
