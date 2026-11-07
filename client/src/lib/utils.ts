import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPeso(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₱0.00';
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string | Date, withTime = true): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMED':
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'ONGOING':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'DRAFT':
    case 'PENDING_PAYMENT':
    case 'PAYMENT_VERIFICATION':
    case 'PENDING_REQUIREMENTS':
    case 'REQUIREMENTS_REVIEW':
    case 'SUBMITTED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'REUPLOAD_REQUESTED':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

