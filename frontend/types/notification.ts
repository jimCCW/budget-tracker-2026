export interface Notification {
  id: string;
  recurringRuleId: string | null;
  type: 'INCOME_CREDITED' | 'EXPENSE_DEBITED';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  recurringRule?: {
    category?: {
      icon: string | null;
      color: string | null;
    } | null;
  } | null;
}

export interface NotificationsPage {
  notifications: Notification[];
  nextCursor: string | null;
}
