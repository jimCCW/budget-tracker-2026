import dayjs from 'dayjs';

export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD');
}
