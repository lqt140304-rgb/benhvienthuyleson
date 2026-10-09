// Hàm dùng chung cho các trang
import { getCollection } from 'astro:content';
import dvRaw from '../data/dich_vu.json';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ghép đường dẫn nội bộ với base của web (vd "/dat-lich/" → "/benhvienthuyleson/dat-lich/"). Link ngoài giữ nguyên. */
export function u(path: string = '/'): string {
  if (!path) return '';
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return BASE + (path.startsWith('/') ? path : '/' + path);
}

/** Bài tư vấn đã đăng (bỏ bài nháp), mới nhất trước */
export async function baiTuVan() {
  const ds = await getCollection('tuVan', ({ data }) => !data.nhap);
  return ds.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Ca bệnh đã đăng, mới nhất trước */
export async function caBenh() {
  const ds = await getCollection('caBenh', ({ data }) => !data.nhap);
  return ds.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function ngay(d: Date): string {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Thời gian đọc ước tính (khoảng 220 tiếng/phút) */
export function phutDoc(body: string = ''): number {
  const chu = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(chu / 220));
}

/** Hiển thị giá nhập trong trang quản trị: "120.000" → "120.000đ", trống → "Đang cập nhật" */
export function gia(s: string = ''): string {
  const t = (s || '').trim();
  if (!t) return 'Đang cập nhật';
  return /\d$/.test(t) ? t + 'đ' : t;
}

/** Mã neo cho tiêu đề dịch vụ: "Tắm" → "tam" */
export function neo(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}


type HangMuc = { ten: string; gia: string; ghi_chu: string; phu_phi: string };
export type NhomDV = {
  ten: string; icon: string; mo_ta: string; ghi_chu: string; cap_cuu: boolean; dat_lich: boolean; spa: boolean;
  phu_phi_gio: string; ngay_le: boolean; theo_ngay: boolean;
  bang: { tieu_de_dong: string; cot: string[]; dong: { nhan: string; gia: string[] }[] };
  hang_muc: HangMuc[];
};

/** Danh sách dịch vụ đã chuẩn hoá (ô bị bỏ trống trong trang quản trị vẫn chạy được) */
export function dsDichVu(): NhomDV[] {
  return ((dvRaw as any).danh_sach ?? []).filter((d: any) => d && d.ten).map((d: any) => {
    const cot: string[] = (d.bang?.cot ?? []).map((c: any) => String(c ?? ''));
    return {
      ten: d.ten, icon: d.icon || 'stethoscope', mo_ta: d.mo_ta || '', ghi_chu: d.ghi_chu || '',
      cap_cuu: !!d.cap_cuu, dat_lich: d.dat_lich !== false && !d.cap_cuu, spa: !!d.spa,
      phu_phi_gio: d.phu_phi_gio || '', ngay_le: !!d.ngay_le, theo_ngay: !!d.theo_ngay,
      bang: {
        tieu_de_dong: d.bang?.tieu_de_dong || 'Cân nặng', cot,
        dong: (d.bang?.dong ?? []).filter((r: any) => r && r.nhan).map((r: any) => ({ nhan: r.nhan, gia: cot.map((_, j) => String(r.gia?.[j] ?? '')) })),
      },
      hang_muc: (d.hang_muc ?? []).filter((h: any) => h && h.ten).map((h: any) => ({ ten: h.ten, gia: h.gia || '', ghi_chu: h.ghi_chu || '', phu_phi: h.phu_phi || '' })),
    };
  });
}
