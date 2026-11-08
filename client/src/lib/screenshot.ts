import html2canvas from 'html2canvas';

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
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#0b1329', // match brand navy
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to capture screenshot:', err);
    // Fallback: trigger print
    window.print();
    return false;
  }
}
