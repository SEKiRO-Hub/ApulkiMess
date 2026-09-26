import { addMonths, addDays, parseISO, isAfter, startOfDay, format } from 'date-fns';
import { Student, PaymentRecord, PlanType } from '../types';

export const paymentService = {
  /**
   * Format ISO date string into Indian friendly display format: "26 Sep 2026"
   */
  formatDisplayDate(isoString: string | null | undefined, fallback: string = 'N/A'): string {
    if (!isoString) return fallback;
    try {
      const date = parseISO(isoString);
      return format(date, 'dd MMM yyyy');
    } catch {
      return fallback;
    }
  },

  /**
   * Format ISO date string into verbose format: "26 September 2026"
   */
  formatVerboseDate(isoString: string | null | undefined, fallback: string = 'N/A'): string {
    if (!isoString) return fallback;
    try {
      const date = parseISO(isoString);
      return format(date, 'dd MMMM yyyy');
    } catch {
      return fallback;
    }
  },

  /**
   * Calculate new subscription start and expiry dates based on plan type and start date
   */
  calculateSubscriptionDates(
    student: Student,
    paymentDateInput: Date = new Date(),
    planType: PlanType = 'monthly'
  ): { subscriptionStart: Date; subscriptionExpiry: Date } {
    const subscriptionStart = startOfDay(paymentDateInput);

    let subscriptionExpiry: Date;
    if (planType === '15days') {
      subscriptionExpiry = addDays(subscriptionStart, 15);
    } else {
      subscriptionExpiry = addMonths(subscriptionStart, 1);
    }

    return { subscriptionStart, subscriptionExpiry };
  },

  /**
   * Process and record a new payment for a student
   */
  processPayment(
    student: Student,
    paymentDateInput: Date = new Date(),
    amount?: number,
    note?: string,
    planType: PlanType = 'monthly'
  ): Student {
    const paymentDateIso = paymentDateInput.toISOString();
    const { subscriptionStart, subscriptionExpiry } = this.calculateSubscriptionDates(
      student,
      paymentDateInput,
      planType
    );

    const subscriptionStartIso = subscriptionStart.toISOString();
    const subscriptionExpiryIso = subscriptionExpiry.toISOString();

    const newPaymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      paymentDate: paymentDateIso,
      subscriptionStart: subscriptionStartIso,
      subscriptionExpiry: subscriptionExpiryIso,
      planType,
      amount,
      note,
    };

    const updatedPaymentHistory = [newPaymentRecord, ...(student.paymentHistory || [])];

    return {
      ...student,
      paymentDate: paymentDateIso,
      subscriptionStart: subscriptionStartIso,
      subscriptionExpiry: subscriptionExpiryIso,
      paymentHistory: updatedPaymentHistory,
    };
  },
};
