// R3.5 · Bộ icon dịch vụ dùng chung (trang chính + trang mẫu): lưới 48, hiển thị 36–40px trong ô đỡ 60–64px, nét 2.2.
// Mỗi phần chuyển động là một <g class="cd-…"> riêng: chuyển động gắn vào phần con, không gắn vào thẻ hay cả icon.
export const I = {
  'ong-nghe': `<path d="M15 6h-2.5A2.5 2.5 0 0 0 10 8.5V17a8 8 0 0 0 16 0V8.5A2.5 2.5 0 0 0 23.5 6H21"/><path d="M18 25v5.5a8.5 8.5 0 0 0 17 0V27"/>
    <g class="cd-dau"><circle class="ic-to-n" cx="35" cy="21.5" r="5.5"/><circle cx="35" cy="21.5" r="5.5"/><path class="cd-tim ic-to" d="M35 24.2l-2.3-2.2a1.5 1.5 0 0 1 2.3-1.9 1.5 1.5 0 0 1 2.3 1.9Z"/></g>`,
  'binh': `<defs><clipPath id="kep-binh"><path d="M20.5 5v12L10 36.5A4 4 0 0 0 13.5 42h21a4 4 0 0 0 3.5-5.5L27.5 17V5Z"/></clipPath></defs>
    <g clip-path="url(#kep-binh)"><g class="cd-long"><path class="ic-to-n" d="M2 28h44v20H2Z"/><path d="M2 28c5-2 9 2 14 0s9-2 14 0 9 2 16 0" fill="none"/></g>
    <g class="cd-bot"><circle class="ic-to" cx="21" cy="37" r="1.6"/><circle class="ic-to" cx="26.5" cy="34" r="1.2"/><circle class="ic-to" cx="24" cy="39.5" r="1"/></g></g>
    <path d="M18.5 5h11M20.5 5v12L10 36.5A4 4 0 0 0 13.5 42h21a4 4 0 0 0 3.5-5.5L27.5 17V5"/>`,
  'vaccine': `<g transform="rotate(-40 24 24)"><rect class="ic-to-t" x="13" y="19" width="19" height="10" rx="2"/><g class="cd-thuoc"><rect class="ic-to" x="13" y="20.5" width="11" height="7" rx="1"/></g>
    <rect x="13" y="19" width="19" height="10" rx="2"/><path d="M13 24H6M18 19v2.5M23 19v2.5M28 19v2.5"/>
    <g class="cd-pit"><path d="M32 24h7M39 19.5v9"/></g></g>`,
  'keo': `<g class="cd-luoi-a"><circle class="ic-to" cx="10.5" cy="14" r="5.5"/><circle cx="10.5" cy="14" r="5.5"/><path d="M15.3 16.8 41 33"/></g>
    <g class="cd-luoi-b"><circle class="ic-to" cx="10.5" cy="34" r="5.5"/><circle cx="10.5" cy="34" r="5.5"/><path d="M15.3 31.2 41 15"/></g>
    <circle cx="23.5" cy="24" r="1.4" fill="currentColor" stroke="none"/><g class="cd-lap"><path class="ic-to-n" d="M40 4.5l1.2 2.8 2.8 1.2-2.8 1.2L40 12.5l-1.2-2.8L36 8.5l2.8-1.2Z"/></g>`,
  'giuong': `<path d="M5 11v29M5 33h38M43 40V28a5 5 0 0 0-5-5H18v10"/><rect class="ic-to-t" x="8" y="25" width="9" height="6" rx="3"/><rect x="8" y="25" width="9" height="6" rx="3"/>
    <g class="cd-tho"><path class="ic-to" d="M20 33c0-5.5 4.5-8.5 10-8.5s10 3 10 8.5Z"/><path d="M20 33c0-5.5 4.5-8.5 10-8.5s10 3 10 8.5"/><path d="M23.5 26.5l-.8-3.5 3 1.8M29.5 25l1.6-3.2 1.4 3.4"/></g>
    <g class="cd-zz"><path d="M33 9h4l-4 4.5h4M39 4h3l-3 3.5h3"/></g>`,
  'hop-y-te': `<path d="M18 9V6.5A2.5 2.5 0 0 1 20.5 4h7A2.5 2.5 0 0 1 30 6.5V9"/><rect x="5" y="9" width="38" height="31" rx="7"/>
    <g class="cd-sang"><path class="ic-to-t" d="M20.5 17h7v5.5H33v7h-5.5V35h-7v-5.5H15v-7h5.5Z"/><path d="M20.5 17h7v5.5H33v7h-5.5V35h-7v-5.5H15v-7h5.5Z"/></g>
    <g class="cd-lap"><circle cx="38.5" cy="12" r="8.4" fill="#fff" stroke="none"/><g class="ic-pad"><ellipse class="ic-to" cx="38.5" cy="14.8" rx="3.5" ry="2.9" stroke-width="1.8"/><ellipse cx="34.2" cy="10.4" rx="1.3" ry="1.8" fill="currentColor" stroke="none"/><ellipse cx="37" cy="7.6" rx="1.3" ry="1.8" fill="currentColor" stroke="none"/><ellipse cx="40.4" cy="7.6" rx="1.3" ry="1.8" fill="currentColor" stroke="none"/><ellipse cx="43" cy="10.4" rx="1.3" ry="1.8" fill="currentColor" stroke="none"/></g></g>`,
};
let n = 0;
export const icDv = (k, s = 40) => `<svg class="ic ic48 ic-${k}" viewBox="0 0 48 48" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${I[k].replace(/kep-binh/g, 'kep-binh-' + ++n)}</svg>`;
// khóa icon trong dữ liệu dịch vụ → icon mới (Triệt sản = bandage và Cấp cứu giữ icon cũ để không trùng Phẫu thuật)
export const ICON_DV = { stethoscope: 'ong-nghe', flask: 'binh', syringe: 'vaccine', scissors: 'keo', bed: 'giuong', scalpel: 'hop-y-te' };
