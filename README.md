<div align="center">

# 💼 WorkTrackify

**Tự động theo dõi giờ làm & tính lương từ Google Calendar**

[![Deploy to GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-blue?logo=github)](https://pages.github.com/)

</div>

---

## ✨ Tính năng

- 🔐 **Đăng nhập Google** — Chọn tài khoản Google bất kỳ (client-side OAuth)
- 📅 **Sync Google Calendar** — Tự động lấy sự kiện từ Calendar theo tháng
- 💰 **Tính lương thông minh** — Trừ giờ nghỉ tự động (30 phút nếu 6-8h, 1h nếu >8h)
- 📊 **Thống kê theo tuần** — Bảng breakdown lương theo từng tuần
- 🎯 **Mục tiêu thu nhập** — Theo dõi tiến độ đạt mục tiêu lương tháng
- ⚡ **Auto-sync** — Tự động sync lại mỗi X phút (tuỳ chỉnh)
- 🔍 **Lọc sự kiện** — Filter theo từ khoá (💼, work, timezone pac, ...)
- ⚙️ **Settings** — Tuỳ chỉnh lương/giờ, mục tiêu, từ khoá lọc
- 📱 **Responsive** — Tối ưu cho cả desktop & mobile

## 🚀 Deploy lên GitHub Pages

### Bước 1: Tạo Google OAuth Client ID

1. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật **Google Calendar API** tại [API Library](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
4. Vào **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Chọn **Web application**
6. Thêm **Authorized JavaScript origins**:
   - `https://<username>.github.io` (cho GitHub Pages)
   - `http://localhost:5173` (cho development)
7. Copy **Client ID** (dạng `xxxxxx.apps.googleusercontent.com`)

### Bước 2: Deploy

1. Push code lên GitHub repository
2. Vào **Settings** → **Pages** → chọn Source: **GitHub Actions**
3. Push code, GitHub Actions sẽ tự động build & deploy
4. Truy cập `https://<username>.github.io/<repo-name>/`
5. Nhập Google Client ID ở màn hình login và kết nối!

## 🛠️ Chạy Local

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## 📁 Cấu trúc

```
├── src/
│   ├── App.tsx              # Main app (auth state, routing)
│   ├── google-api.ts        # Google OAuth & Calendar API (client-side)
│   ├── components/
│   │   ├── LoginScreen.tsx   # Trang đăng nhập + setup Client ID
│   │   ├── Dashboard.tsx     # Dashboard chính (bento grid)
│   │   └── SettingsPanel.tsx  # Panel cài đặt
│   ├── main.tsx
│   └── index.css            # Design system (TailwindCSS v4)
├── .github/workflows/
│   └── deploy.yml           # Auto deploy to GitHub Pages
├── index.html
├── vite.config.ts
└── package.json
```

## 🔒 Bảo mật

- **100% client-side** — Không có server, không lưu token trên server
- Tokens lưu trong `localStorage` của trình duyệt
- Sử dụng Google Identity Services (GIS) — OAuth 2.0 implicit flow
- Chỉ yêu cầu quyền `calendar.readonly` và `userinfo`
