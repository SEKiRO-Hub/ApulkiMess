import { differenceInDays, parseISO, startOfDay, subDays, addDays } from 'date-fns';
import { Student, SubscriptionStatus, FilterStatus, SortOption } from '../types';
import { storage } from './storage';
import { paymentService } from './paymentService';

const STUDENTS_KEY = '@apulki_mess_students_v1';

export const studentService = {
  /**
   * Calculate dynamic subscription status based on current date
   */
  calculateStatus(student: Student, warningDays: number = 3): SubscriptionStatus {
    if (!student.subscriptionExpiry || !student.paymentDate) {
      return 'unpaid';
    }

    const now = startOfDay(new Date());
    const expiry = startOfDay(parseISO(student.subscriptionExpiry));

    const daysRemaining = differenceInDays(expiry, now);

    if (daysRemaining < 0) {
      return 'expired';
    } else if (daysRemaining <= warningDays) {
      return 'expiring';
    } else {
      return 'active';
    }
  },

  /**
   * Get all students from storage with status computed
   */
  async getStudents(warningDays: number = 3): Promise<Student[]> {
    const rawList = await storage.getItem<Student[]>(STUDENTS_KEY);
    if (!rawList) return [];

    return rawList.map((student) => ({
      ...student,
      status: this.calculateStatus(student, warningDays),
    }));
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

    const updatedList = [newStudent, ...students];
    await storage.setItem(STUDENTS_KEY, updatedList);

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

    const updatedStudent: Student = {
      ...students[targetIndex],
      name: trimmedName,
      phone: cleanPhone,
    };

    students[targetIndex] = updatedStudent;
    await storage.setItem(STUDENTS_KEY, students);

    return { success: true, student: updatedStudent };
  },

  /**
   * Delete student by ID
   */
  async deleteStudent(id: string): Promise<boolean> {
    const students = await this.getStudents();
    const filtered = students.filter((s) => s.id !== id);
    return await storage.setItem(STUDENTS_KEY, filtered);
  },

  /**
   * Record monthly payment for a student
   */
  async recordPayment(
    id: string,
    paymentDateInput: Date = new Date(),
    amount?: number,
    note?: string
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    const students = await this.getStudents();
    const student = students.find((s) => s.id === id);

    if (!student) {
      return { success: false, error: 'Student not found.' };
    }

    const updatedStudent = paymentService.processPayment(student, paymentDateInput, amount, note);
    updatedStudent.status = this.calculateStatus(updatedStudent);

    const updatedList = students.map((s) => (s.id === id ? updatedStudent : s));
    await storage.setItem(STUDENTS_KEY, updatedList);

    return { success: true, student: updatedStudent };
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

    students.forEach((s) => {
      if (s.status === 'active') active++;
      else if (s.status === 'expiring') expiring++;
      else if (s.status === 'expired') expired++;
      else if (s.status === 'unpaid') unpaid++;
    });

    return { total, active, expiring, expired, unpaid };
  },

  /**
   * Load rich sample data for realistic mess management demo
   */
  async loadSampleData(): Promise<Student[]> {
    const now = new Date();
    const todayIso = now.toISOString();

    const sampleStudents: Student[] = [
      {
        id: 'stud_sample_1',
        name: 'Rahul Patil',
        phone: '9876543210',
        paymentDate: subDays(now, 5).toISOString(),
        subscriptionStart: subDays(now, 5).toISOString(),
        subscriptionExpiry: addDays(now, 25).toISOString(),
        paymentHistory: [
          {
            id: 'pay_s1_1',
            paymentDate: subDays(now, 5).toISOString(),
            subscriptionStart: subDays(now, 5).toISOString(),
            subscriptionExpiry: addDays(now, 25).toISOString(),
            amount: 3000,
          },
        ],
        createdAt: subDays(now, 60).toISOString(),
      },
      {
        id: 'stud_sample_2',
        name: 'Amit Shah',
        phone: '9876543211',
        paymentDate: subDays(now, 28).toISOString(),
        subscriptionStart: subDays(now, 28).toISOString(),
        subscriptionExpiry: addDays(now, 2).toISOString(), // Expiring in 2 days!
        paymentHistory: [
          {
            id: 'pay_s2_1',
            paymentDate: subDays(now, 28).toISOString(),
            subscriptionStart: subDays(now, 28).toISOString(),
            subscriptionExpiry: addDays(now, 2).toISOString(),
            amount: 3000,
          },
        ],
        createdAt: subDays(now, 30).toISOString(),
      },
      {
        id: 'stud_sample_3',
        name: 'Sahil Patil',
        phone: '9876543212',
        paymentDate: subDays(now, 35).toISOString(),
        subscriptionStart: subDays(now, 35).toISOString(),
        subscriptionExpiry: subDays(now, 5).toISOString(), // Expired 5 days ago!
        paymentHistory: [
          {
            id: 'pay_s3_1',
            paymentDate: subDays(now, 35).toISOString(),
            subscriptionStart: subDays(now, 35).toISOString(),
            subscriptionExpiry: subDays(now, 5).toISOString(),
            amount: 3000,
          },
        ],
        createdAt: subDays(now, 90).toISOString(),
      },
      {
        id: 'stud_sample_4',
        name: 'Priya Sharma',
        phone: '9876543213',
        paymentDate: subDays(now, 29).toISOString(),
        subscriptionStart: subDays(now, 29).toISOString(),
        subscriptionExpiry: addDays(now, 1).toISOString(), // Expiring tomorrow!
        paymentHistory: [
          {
            id: 'pay_s4_1',
            paymentDate: subDays(now, 29).toISOString(),
            subscriptionStart: subDays(now, 29).toISOString(),
            subscriptionExpiry: addDays(now, 1).toISOString(),
            amount: 3000,
          },
        ],
        createdAt: subDays(now, 45).toISOString(),
      },
      {
        id: 'stud_sample_5',
        name: 'Vikas Deshmukh',
        phone: '9876543214',
        paymentDate: null,
        subscriptionStart: null,
        subscriptionExpiry: null,
        paymentHistory: [],
        createdAt: todayIso,
      },
    ];

    await storage.setItem(STUDENTS_KEY, sampleStudents);
    return this.getStudents();
  },

  /**
   * Clear all student records
   */
  async clearAllData(): Promise<boolean> {
    return await storage.removeItem(STUDENTS_KEY);
  },
};
