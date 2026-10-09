// Hàm dùng chung cho các trang
import { getCollection } from 'astro:content';

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
