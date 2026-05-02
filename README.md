# Adena Payroll Dashboard

MVP quản lý công cày Adena dành cho admin và Thành viên, sẵn sàng deploy lên Vercel.

## Chức năng

- Admin thêm tài khoản, thêm ca cày, nhập số Adena đầu/cuối, rate, lương giờ và ghi nhận thanh toán.
- Thành viên xem được tổng Adena đã kiếm, tổng tiền công, số tiền đã thanh toán và số còn lại.
- Toàn bộ người dùng xem được biểu đồ Adena theo ngày, so sánh tuần và bảng xếp hạng Thành viên.
- Seed dữ liệu mẫu đã khớp bộ số bạn gửi.

## Công nghệ

- Next.js 15
- React 19
- TypeScript
- Không dùng thư viện chart ngoài, biểu đồ dựng bằng SVG/CSS để deploy gọn trên Vercel

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Tài khoản mẫu

- `admin / 1234`
- `nv01 / 1111`
- `nv02 / 2222`
- `nv03 / 3333`

## Công thức tính tiền

```text
Tiền công = (Adena kiếm được / đơn vị Adena) x rate Adena + (tổng giờ x lương giờ)
```

Seed mẫu đang dùng:

- `rate Adena = 25.000`
- `đơn vị Adena = 16.666,67`

Thiết lập này giúp dữ liệu mẫu khớp với bảng tiền công bạn đã cung cấp.

## Lưu ý triển khai

- Phiên bản hiện tại lưu dữ liệu bằng `localStorage`, phù hợp cho bản demo hoặc giai đoạn chốt giao diện/nghiệp vụ.
- Nếu muốn dùng thực tế nhiều người cùng truy cập trên Vercel, bước tiếp theo nên chuyển sang `PostgreSQL + NextAuth/Auth.js` hoặc Supabase để có đăng nhập thực và dữ liệu tập trung.

## Deploy Vercel

1. Đẩy source lên GitHub.
2. Import project vào Vercel.
3. Framework preset chọn `Next.js`.
4. Deploy.
