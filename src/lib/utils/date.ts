import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(
  date: string | Date,
  formatStr: string = 'yyyy-MM-dd'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function getYearOptions(startYear: number = 2020): { label: string; value: string }[] {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let year = currentYear; year >= startYear; year--) {
    years.push({
      label: `${year}년`,
      value: String(year),
    });
  }

  return years;
}
