// Cách TRÌNH BÀY bảng giá ở giao diện mới (chủ dự án 13/10/2026). Chỉ đổi cách hiện trên trang; dữ liệu giá (src/data/dich_vu.json) KHÔNG đổi, bản R3.6 vẫn hiện đủ.
/** Hạng mục ẨN khỏi trang Bảng giá giao diện mới (theo tên đúng trong dữ liệu). Muốn hiện lại: xoá tên khỏi danh sách. */
export const HANG_MUC_AN: string[] = ['Gói khám sức khoẻ tổng quát'];
/** Các hạng mục có giá riêng, tên bắt đầu bằng tiền tố này (từ 2 mục trở lên) được GỘP thành một accordion, mở ra thấy từng mục và giá (giống Grooming / Nội trú). */
export const TIEN_TO_GOP: string[] = ['Siêu âm'];
