import { differenceInDays, parseISO, startOfDay, subDays, addDays } from 'date-fns';
import { Student, SubscriptionStatus, FilterStatus, SortOption, PlanType } from '../types';
import { storage } from './storage';
import { paymentService } from './paymentService';
import { ref, set, get, remove, update, runTransaction, onValue } from 'firebase/database';
import { db } from '../../firebase';

const STUDENTS_KEY = '@apulki_mess_students_v1';

export const studentService = {
  /**
   * Calculate dynamic subscription status based on current date
   */
  calculateStatus(student: Student, warningDays: number = 3): SubscriptionStatus {
    if (student.isPaused) {
      return 'paused';
    }

    if (!student.subscriptionExpiry || !student.paymentDate) {
      return 'unpaid';
    }

    const now = startOfDay(new Date());
    const expiry = startOfDay(parseISO(student.subscriptionExpiry));

    const daysRemaining = differenceInDays(expiry, now);

    if (daysRemaining <= 0) {
      return 'expired';
    } else if (daysRemaining <= warningDays) {
      return 'expiring';
    } else {
      return 'active';
    }
  },

  /**
   * Calculate remaining days
   */
  calculateRemainingDays(student: Student): number | undefined {
    if (!student.subscriptionExpiry) return undefined;
    return differenceInDays(
      startOfDay(parseISO(student.subscriptionExpiry)),
      startOfDay(new Date())
    );
  },

  /**
   * Check if subscription can be paused
   */
  canPauseSubscription(student: Student): { canPause: boolean; reason?: string } {
    if (student.status === 'paused') return { canPause: false, reason: 'Already paused' };
    if (student.status === 'expired' || student.status === 'unpaid') return { canPause: false, reason: 'No active subscription' };
    
    const daysRemaining = this.calculateRemainingDays(student);
    if (daysRemaining === undefined || daysRemaining <= 3) {
      return { canPause: false, reason: 'Cannot pause subscription with 3 or fewer days remaining.' };
    }
    
    return { canPause: true };
  },

  /**
   * Get all students from storage with status computed
   */
  async getStudents(warningDays: number = 3): Promise<Student[]> {
    const dbRef = ref(db, 'students');
    const snapshot = await get(dbRef);
    const rawList: Student[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((key) => {
        // Ensure paymentHistory is an array, as Firebase drops empty arrays
        const studentData = data[key];
        studentData.paymentHistory = studentData.paymentHistory || [];
        rawList.push(studentData);
      });
    }

    return rawList.map((student) => ({
      ...student,
      status: this.calculateStatus(student, warningDays),
    }));
  },

  subscribeToStudents(
    warningDays: number,
    onUpdate: (students: Student[]) => void
  ): () => void {
    const dbRef = ref(db, 'students');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const rawList: Student[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          const studentData = data[key];
          studentData.paymentHistory = studentData.paymentHistory || [];
          rawList.push(studentData);
        });
      }

      const processedList = rawList.map((student) => ({
        ...student,
        status: this.calculateStatus(student, warningDays),
      }));
      onUpdate(processedList);
    });

    return unsubscribe;
  },

  /**
   * Get single student by ID
   */
  async getStudentById(id: string, warningDays: number = 3): Promise<Student | null> {
    const students = await this.getStudents(warningDays);
    return students.find((s) => s.id === id) || null;
  },

  /**
   * Add a new student (unpaid by default)
   */
  async addStudent(name: string, phone: string): Promise<{ success: boolean; student?: Student; error?: string }> {
    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    // Validation
    if (!trimmedName) {
      return { success: false, error: 'Student name cannot be empty.' };
    }
    if (!cleanPhone) {
      return { success: false, error: 'Phone number cannot be empty.' };
    }
    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number.' };
    }

    const students = await this.getStudents();
    const existing = students.find((s) => s.phone.replace(/\D/g, '') === cleanPhone);

    if (existing) {
      return { success: false, error: `Student with phone ${phone} already exists (${existing.name}).` };
    }

    const newStudent: Student = {
      id: `stud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      phone: cleanPhone,
      paymentDate: null,
      subscriptionStart: null,
      subscriptionExpiry: null,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      status: 'unpaid',
    };

    try {
      await set(ref(db, `students/${newStudent.id}`), newStudent);
    } catch (e) {
      console.error('Failed to save to Firebase:', e);
      return { success: false, error: 'Failed to save to cloud.' };
    }

    return { success: true, student: newStudent };
  },

  /**
   * Update student details
   */
  async updateStudent(
    id: string,
    name: string,
    phone: string
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!trimmedName) {
      return { success: false, error: 'Student name cannot be empty.' };
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit phone number.' };
    }

    const students = await this.getStudents();
    const targetIndex = students.findIndex((s) => s.id === id);

    if (targetIndex === -1) {
      return { success: false, error: 'Student not found.' };
    }

    // Check duplicate phone excluding self
    const duplicate = students.find(
      (s) => s.id !== id && s.phone.replace(/\D/g, '') === cleanPhone
    );
    if (duplicate) {
      return { success: false, error: `Phone number is already used by ${duplicate.name}.` };
    }

    const updates = {
      name: trimmedName,
      phone: cleanPhone,
    };

    try {
      await update(ref(db, `students/${id}`), updates);
    } catch (e) {
      console.error('Failed to update student in Firebase:', e);
      return { success: false, error: 'Failed to update cloud database.' };
    }

    return { success: true, student: { ...students[targetIndex], ...updates } };
  },

  /**
   * Delete student by ID
   */
  async deleteStudent(id: string): Promise<boolean> {
    try {
      await remove(ref(db, `students/${id}`));
      return true;
    } catch (e) {
      console.error('Failed to delete student from Firebase:', e);
      return false;
    }
  },

  /**
   * Record payment for a student
   */
  async recordPayment(
    id: string,
    paymentDateInput: Date = new Date(),
    amount?: number,
    note?: string,
    planType: PlanType = 'monthly',
    durationDays: number = 30,
    meals?: any
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    try {
      const dbRef = ref(db, `students/${id}`);
      let transactionSuccess = false;
      let finalStudent: Student | undefined = undefined;
      let transactionError: string | undefined = undefined;

      await runTransaction(dbRef, (currentData: Student | null) => {
        if (!currentData) {
          transactionError = 'Student not found.';
          return;
        }

        const updatedStudent = paymentService.processPayment(currentData, paymentDateInput, amount, note, planType, durationDays, meals);
        updatedStudent.status = this.calculateStatus(updatedStudent);

        finalStudent = updatedStudent;
        transactionSuccess = true;
        return updatedStudent; // Commit the entire updated student via transaction
      });

      if (!transactionSuccess) {
        return { success: false, error: transactionError || 'Failed to record payment.' };
      }

      return { success: true, student: finalStudent };
    } catch (e) {
      console.error('Failed to record payment in Firebase:', e);
      return { success: false, error: 'Failed to record payment in cloud database.' };
    }
  },

  /**
   * Pause Subscription
   */
  async pauseSubscription(id: string, pauseDateInput: Date): Promise<{ success: boolean; student?: Student; error?: string }> {
    try {
      const dbRef = ref(db, `students/${id}`);
      let transactionSuccess = false;
      let finalStudent: Student | undefined = undefined;
      let transactionError: string | undefined = undefined;

      await runTransaction(dbRef, (currentData: Student | null) => {
        if (!currentData) {
          transactionError = 'Student not found.';
          return; // Abort
        }
        if (!currentData.subscriptionExpiry) {
          transactionError = 'No active subscription.';
          return;
        }

        const expiry = startOfDay(parseISO(currentData.subscriptionExpiry));
        const pauseStart = startOfDay(pauseDateInput);
        const nowStart = startOfDay(new Date());

        if (pauseStart < nowStart) {
          transactionError = 'Pause date cannot be in the past.';
          return;
        }

        const daysRemaining = differenceInDays(expiry, pauseStart);

        if (daysRemaining <= 3) {
          transactionError = 'Cannot pause subscription with 3 or fewer days remaining.';
          return;
        }

        currentData.isPaused = true;
        currentData.pauseDate = pauseStart.toISOString();
        currentData.status = 'paused';
        
        finalStudent = currentData;
        transactionSuccess = true;
        return currentData; // Commit
      });

      if (!transactionSuccess) {
        return { success: false, error: transactionError || 'Failed to pause.' };
      }
      return { success: true, student: finalStudent };
    } catch (e) {
      return { success: false, error: 'Failed to pause in cloud database.' };
    }
  },

  /**
   * Resume Subscription
   */
  async resumeSubscription(id: string, resumeDateInput: Date = new Date()): Promise<{ success: boolean; student?: Student; error?: string }> {
    try {
      const dbRef = ref(db, `students/${id}`);
      let transactionSuccess = false;
      let finalStudent: Student | undefined = undefined;
      let transactionError: string | undefined = undefined;

      await runTransaction(dbRef, (currentData: Student | null) => {
        if (!currentData) {
          transactionError = 'Student not found.';
          return;
        }
        if (!currentData.isPaused || !currentData.pauseDate) {
          transactionError = 'Subscription is not paused.';
          return; // This blocks duplicate rapid resumes
        }

        const pauseStart = parseISO(currentData.pauseDate);
        const resumeDate = startOfDay(resumeDateInput);
        
        if (resumeDate < startOfDay(pauseStart)) {
          transactionError = 'Resume date cannot be before pause date.';
          return;
        }

        const pauseDuration = differenceInDays(resumeDate, pauseStart);

        let actualExtension = 0;
        if (pauseDuration > 3) {
          actualExtension = pauseDuration - 3;
        }

        let newExpiryIso = currentData.subscriptionExpiry;
        if (actualExtension > 0 && currentData.subscriptionExpiry) {
          const currentExpiry = parseISO(currentData.subscriptionExpiry);
          const newExpiry = addDays(currentExpiry, actualExtension);
          newExpiryIso = newExpiry.toISOString();
        }

        const newHistoryEntry = {
          pauseDate: currentData.pauseDate,
          resumeDate: resumeDate.toISOString(),
          requestedDays: pauseDuration,
          deductedDays: Math.min(3, pauseDuration),
          actualExtension: actualExtension,
        };

        currentData.isPaused = false;
        currentData.pauseDate = null;
        currentData.subscriptionExpiry = newExpiryIso;
        currentData.pauseHistory = [newHistoryEntry, ...(currentData.pauseHistory || [])];
        
        finalStudent = currentData;
        transactionSuccess = true;
        return currentData; // Commit
      });

      if (!transactionSuccess) {
        return { success: false, error: transactionError || 'Failed to resume.' };
      }
      
      if (finalStudent) {
        finalStudent.status = this.calculateStatus(finalStudent);
        await update(ref(db, `students/${id}`), { status: finalStudent.status });
      }

      return { success: true, student: finalStudent };
    } catch (e) {
      return { success: false, error: 'Failed to resume in cloud database.' };
    }
  },

  /**
   * Search, Filter and Sort student list
   */
  filterAndSortStudents(
    students: Student[],
    query: string,
    filter: FilterStatus = 'all',
    sort: SortOption = 'name_asc'
  ): Student[] {
    let result = [...students];

    // Search query filter (matches name or phone)
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q)
      );
    }

    // Status filter
    if (filter !== 'all') {
      result = result.filter((s) => s.status === filter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sort === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sort === 'expiry_asc') {
        if (!a.subscriptionExpiry) return 1;
        if (!b.subscriptionExpiry) return -1;
        return parseISO(a.subscriptionExpiry).getTime() - parseISO(b.subscriptionExpiry).getTime();
      }
      if (sort === 'recently_paid') {
        if (!a.paymentDate) return 1;
        if (!b.paymentDate) return -1;
        return parseISO(b.paymentDate).getTime() - parseISO(a.paymentDate).getTime();
      }
      return 0;
    });

    return result;
  },

  /**
   * Get Dashboard Summary Statistics
   */
  getDashboardStats(students: Student[]) {
    let total = students.length;
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let unpaid = 0;
    let paused = 0;

    students.forEach((s) => {
      if (s.status === 'active') active++;
      else if (s.status === 'expiring') expiring++;
      else if (s.status === 'expired') expired++;
      else if (s.status === 'unpaid') unpaid++;
      else if (s.status === 'paused') paused++;
    });

    return { total, active, expiring, expired, unpaid, paused };
  },

  /**
   * Clear all student records
   */
  async clearAllData(): Promise<boolean> {
    try {
      await remove(ref(db, 'students'));
      return true;
    } catch (e) {
      console.error('Failed to clear Firebase data:', e);
      return false;
    }
  },
};
