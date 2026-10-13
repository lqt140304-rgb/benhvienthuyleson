// Menu chính (đúng thứ tự đã duyệt). Ở trang chủ, mục có khu trong trang thì cuộn tới khu; ở trang khác dẫn tới trang riêng.
import { u, GIAO_DIEN } from './site';
import { modeDatLich } from './dat-lich';
export type MucMenu = { khoa: string; ten: string; href: string; hrefChu?: string };
export const menuChinh = (): MucMenu[] => [
  { khoa: 'trang-chu', ten: 'Trang chủ', href: u('/'), hrefChu: '#top' },
  { khoa: 'dich-vu', ten: 'Dịch vụ', href: u('/dich-vu/'), hrefChu: '#dich-vu' },
  { khoa: 'bang-gia', ten: 'Bảng giá', href: u('/bang-gia/') },
  { khoa: 'dat-lich', ten: 'Đặt lịch', href: u('/dat-lich/'), // giao diện mới: "Đặt lịch" mở trang /dat-lich/ (biểu mẫu 4 bước), không cuộn tới khu biểu mẫu cũ ở trang chủ
    hrefChu: modeDatLich === 'cu' || GIAO_DIEN === 'moi' ? undefined : '#dat-lich' },
  { khoa: 'cam-nang', ten: 'Cẩm nang thú cưng', href: u('/tu-van/') },
  { khoa: 'ca-benh', ten: 'Ca bệnh', href: u('/nhat-ky-ca-benh/') },
  { khoa: 'gioi-thieu', ten: 'Giới thiệu', href: u('/gioi-thieu/') },
  { khoa: 'lien-he', ten: 'Liên hệ', href: u('/lien-he/') },
];
