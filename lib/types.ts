export type Role = "admin" | "member";

export type User = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: Role;
  team: string;
  active: boolean;
};

export type WorkSession = {
  id: string;
  userId: string;
  startAt: string;
  endAt: string;
  hourlyRate: number;
  adenaRate: number;
  adenaUnit: number;
  startAdena: number;
  endAdena: number;
  note: string;
};

export type PaymentRecord = {
  id: string;
  userId: string;
  amount: number;
  paidAt: string;
  note: string;
};

export type AppSettings = {
  defaultHourlyRate: number;
  defaultAdenaRate: number;
  defaultAdenaUnit: number;
  currency: "VND";
};

export type AppState = {
  users: User[];
  sessions: WorkSession[];
  payments: PaymentRecord[];
  settings: AppSettings;
};

export type UserSummary = {
  userId: string;
  name: string;
  team: string;
  totalAdena: number;
  totalHours: number;
  grossIncome: number;
  paidAmount: number;
  remainingAmount: number;
  sessionCount: number;
};

export type DailySeriesItem = {
  day: string;
  totalAdena: number;
  totalIncome: number;
};
