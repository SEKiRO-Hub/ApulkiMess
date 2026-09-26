import { addMonths, parseISO, isAfter, isBefore, startOfDay, format } from 'date-fns';
import { Student, PaymentRecord } from '../types';

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
   * Calculate new subscription start and expiry dates based on renewal logic
   */
  calculateSubscriptionDates(
    student: Student,
    paymentDateInput: Date = new Date()
  ): { subscriptionStart: Date; subscriptionExpiry: Date } {
    const paymentDate = startOfDay(paymentDateInput);

    let subscriptionStart: Date;
    let subscriptionExpiry: Date;

    if (student.subscriptionExpiry) {
      const currentExpiry = startOfDay(parseISO(student.subscriptionExpiry));
      const now = startOfDay(new Date());

      // If existing subscription is STILL active (current expiry is in the future)
      if (isAfter(currentExpiry, now)) {
        // Extend existing expiry date by exactly 1 month
        subscriptionStart = student.subscriptionStart ? parseISO(student.subscriptionStart) : paymentDate;
        subscriptionExpiry = addMonths(currentExpiry, 1);
      } else {
        // Subscription is already expired: start new 1-month period from payment date
        subscriptionStart = paymentDate;
        subscriptionExpiry = addMonths(paymentDate, 1);
      }
    } else {
      // First payment ever for unpaid student
      subscriptionStart = paymentDate;
      subscriptionExpiry = addMonths(paymentDate, 1);
    }

    return { subscriptionStart, subscriptionExpiry };
  },

  /**
   * Process and record a new monthly payment for a student
   */
  processPayment(
    student: Student,
    paymentDateInput: Date = new Date(),
    amount?: number,
    note?: string
  ): Student {
    const paymentDateIso = paymentDateInput.toISOString();
    const { subscriptionStart, subscriptionExpiry } = this.calculateSubscriptionDates(
      student,
      paymentDateInput
    );

    const subscriptionStartIso = subscriptionStart.toISOString();
    const subscriptionExpiryIso = subscriptionExpiry.toISOString();

    const newPaymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      paymentDate: paymentDateIso,
      subscriptionStart: subscriptionStartIso,
      subscriptionExpiry: subscriptionExpiryIso,
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
