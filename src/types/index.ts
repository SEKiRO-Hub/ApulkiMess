export type SubscriptionStatus = 'active' | 'expiring' | 'expired' | 'unpaid';
export type PlanType = 'monthly' | '15days';

export interface PaymentRecord {
  id: string;
  paymentDate: string; // ISO string (e.g. "2026-09-26T00:00:00.000Z")
  subscriptionStart: string; // ISO string
  subscriptionExpiry: string; // ISO string
  planType?: PlanType;
  amount?: number;
  note?: string;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  paymentDate: string | null; // ISO string of latest payment
  subscriptionStart: string | null; // ISO string
  subscriptionExpiry: string | null; // ISO string
  status?: SubscriptionStatus; // Optional, usually computed dynamically
  paymentHistory: PaymentRecord[];
  createdAt: string; // ISO string
}

export interface AppSettings {
  messName: string;
  warningDays: number; // default 3 days
  enableNotifications: boolean;
}

export type FilterStatus = 'all' | 'active' | 'expiring' | 'expired' | 'unpaid';

export type SortOption = 'name_asc' | 'name_desc' | 'expiry_asc' | 'recently_paid';
