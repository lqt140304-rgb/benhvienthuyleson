// Cấu hình và dữ liệu cho biểu mẫu đặt lịch mới. KHÔNG sửa dữ liệu nguồn: danh sách dịch vụ lấy từ src/data/dich_vu.json qua site.ts.

/**
 * Chế độ của biểu mẫu đặt lịch (đổi hằng số `modeDatLich` bên dưới, dựng lại web):
 *  - 'gia-lap' (MẶC ĐỊNH): biểu mẫu mới chạy thử, KHÔNG gửi dữ liệu đi đâu. Có dòng "chưa gửi dữ liệu thật" và lối gọi điện / Zalo.
 *  - 'that'   : gửi tới địa chỉ nhận (`dia_chi_nhan_dat_lich` trong thong_tin.json). Chỉ dùng sau khi đã triển khai apps-script/Code.v2.gs
 *               và thử nhận thật (xem HUONG-DAN-NHAN-LICH.md). Chỉ báo "Đã nhận yêu cầu" khi máy chủ trả { ok: true, ma } đọc được.
 *  - 'cu'     : biểu mẫu CŨ đang chạy thật trên website (gửi no-cors, có hoá đơn tham khảo). Dùng để quay lại nếu cần.
 *
 * CẢNH BÁO: website đang chạy thật đang dùng biểu mẫu cũ. Gộp nhánh này vào `main` mà để 'gia-lap' thì web ngừng nhận lịch qua biểu mẫu
 * (khách chỉ còn gọi điện / Zalo). Chủ dự án cần chốt nơi nhận lịch (email, trang quản lý hay cả hai) trước khi gộp.
 */
export type ModeDatLich = 'gia-lap' | 'that' | 'cu';
// MỘT cách duy nhất để đổi chế độ: sửa dòng dưới đây, dựng lại web, kiểm tra bằng `npm run kiem-tra-che-do -- --mong=<chế độ>`, rồi commit.
// (Không có biến môi trường nào đổi được chế độ; workflow triển khai không đặt biến nào.)
export const modeDatLich: ModeDatLich = 'gia-lap';
console.info(`[dat-lich] modeDatLich = ${modeDatLich}`); // hiện trong nhật ký dựng web (npm run build)

/** Khung giờ nhận lịch (giờ mở cửa 8:00 – 21:00), cách 30 phút */
export const khungGio = Array.from({ length: 26 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

/** Thời gian chờ phản hồi của máy chủ (mili giây) trước khi báo "chưa nhận được xác nhận" */
export const thoiGianCho = 15000;
