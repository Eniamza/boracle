import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

// util for tailwind class merging
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Fallback for copying to clipboard in non-secure contexts (http) or older browsers
export async function copyToClipboard(text) {
  if (!text) return false;

  // Try using the modern Clipboard API first (requires secure context or localhost)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
  }

  // Fallback method using textarea
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure element is not visible or interfering with layout
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}
