// utils/date.ts

// Atau Solusi 2: dengan toLocaleDateString
export function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}