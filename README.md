# LockIn Fitness App

## Giới thiệu

**LockIn Fitness App** là ứng dụng desktop hỗ trợ quản lý sức khỏe và thay đổi vóc dáng, giúp người dùng:

* Tính toán các chỉ số cơ thể (BMI, BMR, TDEE)
* Thiết lập mục tiêu (giảm mỡ, tăng cơ, duy trì cân nặng)
* Theo dõi dinh dưỡng (Meal Log)
* Theo dõi luyện tập (Workout Log)
* Theo dõi thư giãn (Relaxation Log)
* Quản lý kế hoạch cá nhân (Paid Plan)
* Nhận thông báo và bài viết từ Admin

Ứng dụng được phát triển theo hướng **offline-first**, lưu trữ dữ liệu cục bộ bằng JSON.

---

## Kiến trúc hệ thống

Ứng dụng được triển khai dưới dạng **Electron Desktop Application** với kiến trúc phân tầng:

* **Frontend:** React + Vite
* **Backend nội bộ:** Node.js + Express (chạy in-process)
* **Lưu trữ:** Local JSON files (`jsonStore.ts`)
* **Electron:** Main Process – Preload – Renderer (IPC Bridge)

Các module chính:

* Auth
* Profile
* Stats
* Logs (Meal / Workout / Relaxation)
* Foods
* Exercises
* Admin (Blog, Notification, User Management)

---

## Vai trò người dùng

* **User:** Theo dõi sức khỏe, ghi log, xem thống kê
* **Admin:** Quản lý dữ liệu dinh dưỡng, bài tập, blog, notification
* **Paid User:** Sử dụng kế hoạch cá nhân hóa

---

## Tính năng chính

* Đăng ký / Đăng nhập (có thể tích hợp Google OAuth)
* Tính toán chỉ số cơ thể
* Ghi nhận bữa ăn và tính calories
* Ghi nhận hoạt động luyện tập
* Ghi nhận hoạt động thư giãn
* Dashboard thống kê tổng hợp
* Phân quyền người dùng
* Quản lý nội dung và thông báo

---

## Công nghệ sử dụng

* Electron
* React
* Vite
* Node.js
* Express
* JSON-based storage
* Figma (thiết kế UI)

---

### Clone repository

```bash
git clone <repository-url>
cd lockin
```

###  Cài đặt dependencies

```bash
npm install
```

###  Chạy ứng dụng ở môi trường development (Desktop)

```bash
npm run dev:desktop
```

Ứng dụng sẽ được mở dưới dạng Electron Desktop App.

---

## Cấu trúc dữ liệu

Dữ liệu được lưu trong các file JSON riêng biệt cho:

* users
* foods
* exercises
* logs
* notifications
* blogs
* transactions
* plans

---

## Hướng phát triển tương lai

* Đồng bộ cloud thay vì chỉ local
* Mobile version
* AI gợi ý thực đơn chính xác hơn
* Coach cá nhân hóa
* Hệ thống thanh toán online hoàn chỉnh

---

