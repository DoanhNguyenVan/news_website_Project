---
name: NewsPortal SaaS Design System
description: Modern Blue SaaS & Editorial News System with clean typography and authentic data
colors:
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  primary-light: "#EFF6FF"
  primary-subtle: "#DBEAFE"
  neutral-bg: "#F8FAFC"
  surface: "#FFFFFF"
  surface-card: "#FFFFFF"
  border: "#E2E8F0"
  border-subtle: "#CBD5E1"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  text-muted: "#94A3B8"
  text-dim: "#64748B"
  success: "#10B981"
  success-bg: "#ECFDF5"
  warning: "#F59E0B"
  warning-bg: "#FFFBEB"
  danger: "#EF4444"
  danger-bg: "#FEF2F2"
typography:
  display:
    fontFamily: "Merriweather, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading-editorial:
    fontFamily: "Merriweather, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.3
  heading-1:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  heading-2:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.35
  heading-3:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  small:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
  admin-ui:
    fontFamily: "Plus Jakarta Sans, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  mono:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
rounded:
  xs: "4px"
  sm: "8px"
  sm-card: "0.5rem"
  md: "10px"
  lg: "16px"
  card: "1.25rem"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System

## Overview
Hệ thống thiết kế NewsPortal kết hợp giữa chuẩn mực báo chí hiện đại (Editorial Clarity) và không gian làm việc quản trị SaaS tinh tế (Modern Blue SaaS). Toàn bộ bề mặt ưu tiên tông nền sáng, chữ tương phản cao, loại bỏ hoàn toàn các yếu tố trang trí rườm rà (AI slop, gradient tím tím, vệt sáng dạ quang, chấm nhấp nháy vô cớ).

## Colors
- **Màu chủ đạo (Primary Blue):** `#2563EB` được sử dụng có chủ đích cho các hành động chính (Primary CTA), trạng thái menu đang kích hoạt, liên kết quan trọng và chuỗi dữ liệu nổi bật trên biểu đồ.
- **Màu nền bề mặt (Surfaces):**
  - Nền trang chính: `#F8FAFC`
  - Thẻ card, bảng biểu: `#FFFFFF`
  - Viền phân cách (Borders): `#E2E8F0` (tối giản, sắc nét, không viền dày thô)
- **Màu văn bản (Typography Colors):**
  - Tiêu đề chính: `#0F172A` (Slate 900)
  - Đoạn văn mô tả: `#475569` (Slate 600)
  - Nhãn phụ, thời gian: `#94A3B8` (Slate 400)
- **Màu trạng thái ngữ nghĩa:**
  - Thành công / Đã duyệt: `#10B981` (Nền `#ECFDF5`)
  - Chờ xử lý: `#F59E0B` (Nền `#FFFBEB`)
  - Từ chối / Lỗi: `#EF4444` (Nền `#FEF2F2`)

## Typography
- Phông chữ chủ đạo: Hệ font không chân chuẩn quốc tế `Inter, system-ui, sans-serif`.
- Phân cấp kích thước nghiêm ngặt theo tỷ lệ vàng (modular scale tối thiểu 1.25x giữa các cấp tiêu đề):
  - Tiêu đề trang (H1): 24px - 30px, `font-bold` hoặc `font-extrabold`.
  - Tiêu đề khối/phần (H2): 18px - 22px, `font-bold`.
  - Tiêu đề thẻ con (H3): 14px - 16px, `font-semibold`.
  - Văn bản nội dung (Body): 15px, `line-height: 1.6` đảm bảo đọc lâu không mỏi mắt.

## Layout
- Hệ thống lưới (Grid): 12 cột linh hoạt với khoảng đệm `gap-4` đến `gap-6`.
- Khoảng cách lề (Spacing): Tuân thủ bội số của 4px (8px, 12px, 16px, 24px, 32px).
- Bố cục responsive:
  - Mobile (<768px): Cột đơn (single column), thanh bên sidebar ẩn vào menu drawer gọn gàng.
  - Tablet (768px - 1024px): 2 cột cân đối.
  - Desktop (>1024px): Bố cục thanh điều hướng bên trái cố định 240px, vùng làm việc chính rộng rãi.

## Elevation & Depth
- Tránh xa bóng đổ màu dạ quang (neon colored glow) hoặc bóng đen gắt.
- Sử dụng hiệu ứng đổ bóng trung tính nhiều tầng cực nhẹ (Ambient Shadow):
  - Mặc định: `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);`
  - Thẻ nổi bật / Hover: `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);`

## Shapes
- Bo góc có kiểm soát:
  - Thẻ card và bảng điều khiển: `rounded-xl` (12px) hoặc `rounded-2xl` (16px).
  - Nút bấm và ô nhập liệu: `rounded-lg` (8px).
  - Huy hiệu (Badges), Avatar, Nút chức năng tròn: `rounded-full`.
  - Không bo góc quá đà trên các thành phần diện tích lớn.

## Components
- **Buttons:**
  - Nút chính: Nền `#2563EB`, chữ trắng, bo góc 8px, hover nền `#1D4ED8`, hiệu ứng chuyển đổi mượt mà `transition-colors duration-150`.
  - Nút phụ: Nền trắng, viền `#E2E8F0`, chữ `#475569`, hover nền `#F8FAFC`.
- **KPI Cards:** Nền trắng, viền `#E2E8F0`, số liệu lớn in đậm màu `#0F172A`, biểu tượng đơn sắc trong khối nền mềm `#EFF6FF`.
- **Badges:** Bo tròn con nhộng (`rounded-full`), chữ in đậm cỡ nhỏ (11px), viền mảnh cùng tone màu trạng thái.
- **Empty States:** Biểu tượng tối giản, thông điệp rõ ràng, nút kêu gọi hành động nếu cần thiết, không để khoảng trống vô nghĩa.

## Do's and Don'ts
- **DO:** Sử dụng số liệu thực 100% từ API/Database.
- **DO:** Đảm bảo thứ tự tiêu đề đúng ngữ nghĩa (H1 -> H2 -> H3).
- **DO:** Luôn có thẻ ảnh dự phòng (`onerror`) hoặc ẩn thẻ `<img>` nếu không có URL hợp lệ.
- **DON'T:** Không sử dụng `animate-pulse` / `animate-ping` để trang trí giả vờ dữ liệu đang chạy nếu dữ liệu không phải stream thời gian thực.
- **DON'T:** Không sử dụng bóng đổ phát sáng neon (colored glow shadow).
- **DON'T:** Không lồng thẻ bên trong thẻ (nested cards) gây rối loạn thị giác và độ sâu giả tạo.
- **DON'T:** Không tự ý chèn màu tím, hồng, neon nếu không thuộc bảng màu chính.
