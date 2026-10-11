// Hàm dùng chung của giao diện mới (chuyển từ prototype VET-002). Không sửa dữ liệu nguồn: chỉ đọc src/data/*.json qua site.ts.
import { dsDichVu, neo, gia as giaChu } from './site';
import type { NhomDV } from './site';
import xacMinh from './xac-minh.json';

export type DV = NhomDV & { id: string };

/** Nhóm dịch vụ kèm mã neo (dùng cho tab, hash #nhom-<id>) */
export const dichVuLS = (): DV[] => dsDichVu().map((d) => ({ ...d, id: neo(d.ten) }));

/** Nội dung chưa được bệnh viện xác nhận: trả về mục nếu còn "chờ", trả null khi đã xác nhận */
export const choXn = (ma: string) => {
  const m = (xacMinh as any).muc.find((x: any) => x.ma === ma);
  return m && m.trang_thai !== 'da-xac-nhan' ? m : null;
};

const so = (g: string) => { const m = String(g || '').match(/\d{1,3}(?:\.\d{3})+|\d+/); return m ? parseInt(m[0].replace(/\./g, ''), 10) : 0; };
const tien = (n: number) => n.toLocaleString('vi-VN').replace(/,/g, '.') + 'đ';
/** Giá thấp nhất của nhóm, dạng "Từ 85.000đ" (rỗng nếu chưa có giá) */
export const giaTuHoa = (d: DV) => {
  const ds = [...d.bang.dong.flatMap((r) => r.gia), ...d.hang_muc.map((h) => h.gia)].map(so).filter((n) => n > 0);
  return ds.length ? `Từ ${tien(Math.min(...ds))}` : '';
};
/** Câu đầu của mô tả (không cắt giữa câu) */
export const cauDau = (s: string) => { const t = String(s || '').trim(); const i = t.search(/\.\s/); return i > 0 ? t.slice(0, i + 1) : t; };
/** Tên ngắn cho tab (bỏ phần trong ngoặc) */
export const tenNgan = (t: string) => t.replace(/ \(.*\)$/, '');

/** Bảng có cột tính phụ phí khác nhau (tắm / cắt tỉa) thì tách thành từng bảng nhỏ */
const TEN_PP: Record<string, string> = { spa_tam: 'Tắm', spa_cat: 'Cắt tỉa, cạo lông (trọn gói)' };
export function tachBang(d: DV) {
  const nhom: { tieu_de: string; cot: number[] }[] = [];
  d.bang.cot.forEach((_, j) => {
    const t = TEN_PP[d.phu_phi_cot[j]] ?? '';
    const g = nhom.find((x) => x.tieu_de === t);
    if (g) g.cot.push(j); else nhom.push({ tieu_de: t, cot: [j] });
  });
  return nhom.length > 1 ? nhom : nhom.map((x) => ({ ...x, tieu_de: '' }));
}

/** Giá hiển thị: tách chữ "từ" để số tiền nổi bật. Trả { tu, so } (không đổi dữ liệu) */
export const giaHien = (g: string) => {
  const t = giaChu(g);
  const m = /^từ /i.exec(t);
  return { tu: !!m, so: m ? t.slice(m[0].length) : t };
};
/** Nhãn cho hạng mục chưa có giá */
export const nhanGiaMuc = (h: { gia: string; phu_phi?: string; ten: string; ghi_chu: string }) =>
  h.gia ? '' : h.phu_phi ? 'Theo giờ hẹn' : /báo giá|báo phí/i.test(h.ten + h.ghi_chu) ? 'Báo sau khi khám' : 'Đang cập nhật';

/** Chọn dịch vụ cho khu "Dịch vụ nổi bật" và "Bảng giá tham khảo" ở trang chủ, lấy theo trường icon / tên trong dữ liệu */
export function chonTrangChu(dv: DV[]) {
  const theoIcon = (i: string) => dv.find((d) => d.icon === i);
  const theoTen = (t: string) => dv.find((d) => d.ten.startsWith(t));
  const kham = theoIcon('stethoscope') ?? dv.find((d) => !d.cap_cuu);
  const nho = ['flask', 'syringe', 'scissors', 'bed'].map(theoIcon).filter(Boolean) as DV[];
  const conLai = dv.filter((d) => d !== kham && !nho.includes(d) && !d.cap_cuu);
  // Giá trên thẻ nhỏ chỉ hiện khi rõ ràng là giá của chính dịch vụ đó; còn lại dùng lời dẫn, không tự đặt giá
  const giaThe = (d: DV) => ({
    flask: () => giaTuHoa(d),
    bed: () => (giaTuHoa(d) ? `${giaTuHoa(d)} / ngày` : ''),
    scissors: () => 'Giá theo cân nặng, loại lông',
    syringe: () => 'Liên hệ để được báo giá',
  } as Record<string, () => string>)[d.icon]?.() ?? giaTuHoa(d);
  const xetNghiem = theoTen('Xét nghiệm'), grooming = theoTen('Grooming'), noiTru = theoTen('Gửi nội trú'), phauThuat = theoTen('Phẫu thuật'), triet = theoTen('Triệt sản');
  // Tóm tắt theo 5 nhóm: chỉ ghi giá khi lấy thẳng từ dữ liệu; Điều trị / Grooming / Phẫu thuật không tự đặt giá chung
  const giaGon = [
    kham && { icon: 'stethoscope', ten: 'Điều trị', nhom: kham, gia: '', dk: 'Khám, chẩn đoán, điều trị; phí báo sau khám', cta: 'Xem giá khám' },
    xetNghiem && { icon: 'flask', ten: 'Xét nghiệm', nhom: xetNghiem, gia: giaTuHoa(xetNghiem), dk: 'Tuỳ loại xét nghiệm', cta: 'Xem giá' },
    grooming && { icon: 'scissors', ten: 'Grooming', nhom: grooming, gia: '', dk: 'Giá theo cân nặng, loại lông', cta: 'Xem giá' },
    noiTru && { icon: 'bed', ten: 'Nội trú', nhom: noiTru, gia: giaTuHoa(noiTru) ? `${giaTuHoa(noiTru)} / ngày` : '', dk: 'Theo cân nặng; tính theo giờ thực tế', cta: 'Xem giá' },
    // Mô tả khớp đúng panel đích; combo triệt sản có nhóm riêng nên có link phụ
    phauThuat && { icon: 'scalpel', ten: 'Phẫu thuật', nhom: phauThuat, gia: '', dk: 'Phẫu thuật khác; báo giá sau khi khám', cta: 'Xem giá', phu: triet ? { nhom: triet, chu: 'Triệt sản combo (theo loài, giới tính, cân nặng): xem giá' } : null },
  ].filter(Boolean) as { icon: string; ten: string; nhom: DV; gia: string; dk: string; cta: string; phu?: { nhom: DV; chu: string } | null }[];
  return { kham, nho, conLai, giaThe, giaGon };
}
