import type { Frequency } from '@/types/recurring';

export const FREQUENCIES: { value: Frequency; label: string; icon: string }[] =
  [
    { value: 'DAILY', label: 'Daily', icon: 'pi-calendar' },
    { value: 'WEEKLY', label: 'Weekly', icon: 'pi-calendar-times' },
    { value: 'MONTHLY', label: 'Monthly', icon: 'pi-calendar-plus' },
    { value: 'YEARLY', label: 'Yearly', icon: 'pi-calendar-clock' },
  ];
