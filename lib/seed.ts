import { AppState } from "@/lib/types";

export const seedState: AppState = {
  settings: {
    defaultHourlyRate: 0,
    defaultAdenaRate: 25000,
    defaultAdenaUnit: 16666.6667,
    defaultSharePercentage: 60,
    currency: "VND"
  },
  users: [
    {
      id: "admin-1",
      name: "Quản trị viên",
      username: "admin",
      pin: "1234",
      role: "admin",
      team: "Điều hành",
      active: true
    },
    {
      id: "member-1",
      name: "Thành viên 01",
      username: "nv01",
      pin: "1111",
      role: "member",
      team: "Tổ A",
      active: true
    },
    {
      id: "member-2",
      name: "Thành viên 02",
      username: "nv02",
      pin: "2222",
      role: "member",
      team: "Tổ A",
      active: true
    },
    {
      id: "member-3",
      name: "Thành viên 03",
      username: "nv03",
      pin: "3333",
      role: "member",
      team: "Tổ B",
      active: true
    }
  ],
  sessions: [
    {
      id: "session-1",
      userId: "member-1",
      startAt: "2026-04-26T08:00:00+07:00",
      endAt: "2026-04-26T14:00:00+07:00",
      hourlyRate: 0,
      adenaRate: 25000,
      adenaUnit: 16666.6667,
      startAdena: 22000,
      endAdena: 91000,
      note: "Ca sáng, dữ liệu mẫu từ bảng nhập ban đầu."
    },
    {
      id: "session-2",
      userId: "member-2",
      startAt: "2026-04-26T15:00:00+07:00",
      endAt: "2026-04-26T18:00:00+07:00",
      hourlyRate: 0,
      adenaRate: 25000,
      adenaUnit: 16666.6667,
      startAdena: 7000,
      endAdena: 26000,
      note: "Ca chiều."
    },
    {
      id: "session-3",
      userId: "member-3",
      startAt: "2026-04-28T09:00:00+07:00",
      endAt: "2026-04-28T13:00:00+07:00",
      hourlyRate: 0,
      adenaRate: 25000,
      adenaUnit: 16666.6667,
      startAdena: 0,
      endAdena: 25000,
      note: "Ca mẫu ngày 28/04."
    }
  ],
  payments: [
    {
      id: "payment-1",
      userId: "member-1",
      amount: 50000,
      paidAt: "2026-04-27T20:00:00+07:00",
      note: "Tạm ứng đợt 1"
    },
    {
      id: "payment-2",
      userId: "member-2",
      amount: 10000,
      paidAt: "2026-04-27T20:15:00+07:00",
      note: "Đã thanh toán một phần"
    }
  ]
};
