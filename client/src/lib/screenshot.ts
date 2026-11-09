import html2canvas from 'html2canvas';

/**
 * Downloads or shares a DOM element as an image.
 * On mobile devices (iOS / Android), triggers the native share sheet with 'Save Image'
 * option which saves directly into the phone's Photos / Gallery.
 */
export async function downloadElementAsImage(
  elementId: string,
  filename: string = 'Custoworks-Reservation.png'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not found for screenshot.`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp text & QR code
      useCORS: true,
      logging: false,
      backgroundColor: '#0b1329', // match brand navy
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );

    if (!blob) {
      throw new Error('Could not convert canvas to image blob');
    }

    const file = new File([blob], filename, { type: 'image/png' });

    // 1. Try Mobile Web Share API (Saves directly to iOS Camera Roll / Android Gallery via 'Save Image')
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: 'Custoworks Reservation Slip',
          text: 'Official Custoworks car rental confirmation slip. Tap "Save Image" to store in Photos / Gallery.',
        });
        return true;
      } catch (shareErr: any) {
        // If user cancelled the share sheet, return true as it was opened
        if (shareErr.name === 'AbortError') {
          return true;
        }
        console.warn('Share API failed, falling back to direct download:', shareErr);
      }
    }

    // 2. Fallback: Browser download via Object URL
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    return true;
  } catch (err) {
    console.error('Failed to capture screenshot:', err);
    // Fallback: trigger print dialog
    window.print();
    return false;
  }
}

/**
 * Helper to save/share any captured camera file (receipt, ID, license) to the phone's gallery.
 */
export async function saveFileToGallery(file: File | Blob, defaultName: string = 'captured-photo.jpg'): Promise<boolean> {
  try {
    const actualFile = file instanceof File ? file : new File([file], defaultName, { type: file.type || 'image/jpeg' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [actualFile] })
    ) {
      try {
        await navigator.share({
          files: [actualFile],
          title: 'Save to Gallery',
          text: 'Tap "Save Image" to keep this photo in your phone\'s Photos / Gallery.',
        });
        return true;
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') return true;
      }
    }

    // Fallback to direct download
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.download = actualFile.name || defaultName;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    return true;
  } catch (e) {
    console.error('Failed to save file to gallery:', e);
    return false;
  }
}
