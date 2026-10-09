// Hình vẽ của bộ biểu tượng màu (dùng trong IconMau.astro). Mỗi hình vẽ trên khung 48×48;
// KHUNG là phép dời + phóng đã đo sẵn để hình nằm giữa và vừa khung, không lệch, không tràn.
// Thêm hoặc sửa hình xong thì đo lại KHUNG (chạy thử trên trình duyệt, lấy getBBox của từng hình).
const V = '#2B0D2E';
const W = `stroke="${V}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;

export const HINH: Record<string, string> = {
  // Khám: ống nghe tím, đầu nghe cam
  stethoscope: `<g class="im-lac">
    <path d="M14 6v12a10 10 0 0 0 20 0V6" fill="none" stroke="#8E5BAD" stroke-width="5" stroke-linecap="round"/>
    <circle cx="14" cy="6" r="3" fill="#B98AD3" ${W}/><circle cx="34" cy="6" r="3" fill="#B98AD3" ${W}/>
    <path d="M24 28v6a8 8 0 0 0 16 0v-4" fill="none" stroke="#8E5BAD" stroke-width="5" stroke-linecap="round"/></g>
    <circle class="im-dap" cx="40" cy="27" r="6" fill="#F79A3E" ${W}/><circle cx="40" cy="27" r="2.4" fill="#FFE6C7"/>`,
  // Xét nghiệm: bình thí nghiệm xanh ngọc, bọt khí
  flask: `<path d="M18 5h12M20 5v12L9 37a5 5 0 0 0 4.5 7h21a5 5 0 0 0 4.5-7L28 17V5" fill="#fff" ${W}/>
    <path d="M13.5 30h21l4.3 7.6A4 4 0 0 1 35.3 43H12.7a4 4 0 0 1-3.5-5.4z" fill="#5CC4C9"/>
    <path d="M20 5v12L9 37a5 5 0 0 0 4.5 7h21a5 5 0 0 0 4.5-7L28 17V5" fill="none" ${W}/>
    <circle class="im-bot" cx="20" cy="36" r="2.2" fill="#fff"/><circle class="im-bot im-bot2" cx="27" cy="38" r="1.6" fill="#fff"/><circle class="im-bot im-bot3" cx="24" cy="33" r="1.3" fill="#fff"/>`,
  // Tiêm phòng: ống tiêm thuốc hồng
  syringe: `<g transform="rotate(-45 24 26)">
    <rect x="17" y="14" width="14" height="24" rx="3" fill="#fff" ${W}/>
    <rect class="im-thuoc" x="19.5" y="23" width="9" height="12.5" rx="1.5" fill="#F28BA8"/>
    <path d="M24 38v8M20.5 38h7" fill="none" ${W}/>
    <g class="im-pittong"><path d="M24 14V7M18 7h12" fill="none" ${W}/></g>
    <path d="M17 20h4M17 25h4M17 30h4" ${W} stroke-width="1.6"/></g>`,
  // Tắm: bồn tắm xanh, bong bóng
  bath: `<circle class="im-bot" cx="15" cy="13" r="4" fill="#BFE6F2" ${W} stroke-width="1.8"/><circle class="im-bot im-bot2" cx="25" cy="9" r="3" fill="#BFE6F2" ${W} stroke-width="1.8"/><circle class="im-bot im-bot3" cx="33" cy="14" r="2.4" fill="#BFE6F2" ${W} stroke-width="1.8"/>
    <path d="M5 23h38v5a12 12 0 0 1-12 12H17A12 12 0 0 1 5 28z" fill="#5CB7E0" ${W}/>
    <path d="M9 23c2-4 6-4 8 0 2-4 6-4 8 0 2-4 6-4 8 0 2-4 6-4 6 0" fill="#fff" ${W} stroke-width="1.8"/>
    <path d="M12 40l-2 4M36 40l2 4" ${W}/>`,
  // Cắt tỉa lông: kéo
  scissors: `<g class="im-keo-tren"><path d="M22 24 42 8" ${W} stroke-width="3.2"/><path d="M22 24 42 8" stroke="#C9D3DD" stroke-width="1.4" stroke-linecap="round"/><circle cx="13" cy="33" r="7" fill="#F79A3E" ${W}/><circle cx="13" cy="33" r="3" fill="#FFF7EE"/><path d="M18 28l4-4" ${W}/></g>
    <g class="im-keo-duoi"><path d="M22 24 42 40" ${W} stroke-width="3.2"/><path d="M22 24 42 40" stroke="#C9D3DD" stroke-width="1.4" stroke-linecap="round"/><circle cx="13" cy="15" r="7" fill="#B98AD3" ${W}/><circle cx="13" cy="15" r="3" fill="#FFF7EE"/><path d="M18 20l4 4" ${W}/></g>
    <circle cx="22" cy="24" r="2" fill="${V}"/>`,
  // Lược chải lông, lấp lánh (để dành cho dịch vụ chăm sóc lông)
  comb: `<g class="im-chai"><path d="M6 20h36a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3z" fill="#F7B5C9" ${W}/>
    <path d="M9 29v11M14 29v11M19 29v11M24 29v11M29 29v11M34 29v11M39 29v11" ${W} stroke-width="2.6"/></g>
    <path class="im-sao" d="M33 5l1.6 4.4L39 11l-4.4 1.6L33 17l-1.6-4.4L27 11l4.4-1.6z" fill="#FFC94D" ${W} stroke-width="1.6"/>
    <path class="im-sao im-sao2" d="M14 6l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#FFC94D" ${W} stroke-width="1.4"/>`,
  // Triệt sản: băng cá nhân (vết mổ nhỏ)
  bandage: `<g class="im-lac-nhe"><g transform="rotate(-35 24 24)">
    <rect x="3" y="15" width="42" height="18" rx="9" fill="#F2C49B" ${W}/>
    <rect x="16" y="15" width="16" height="18" fill="#FFE6C7" ${W}/>
    <circle cx="21" cy="21" r="1.3" fill="#C99550"/><circle cx="27" cy="21" r="1.3" fill="#C99550"/><circle cx="21" cy="27" r="1.3" fill="#C99550"/><circle cx="27" cy="27" r="1.3" fill="#C99550"/>
    <circle cx="9" cy="24" r="1.2" fill="#C99550"/><circle cx="39" cy="24" r="1.2" fill="#C99550"/></g></g>
    <path class="im-dap" d="M38 4.5c2-3 6.5-1 4.5 2.5L38 11l-4.5-4c-2-3.5 2.5-5.5 4.5-2.5z" fill="#F36F7F" ${W} stroke-width="1.6"/>`,
  // Phẫu thuật: dao mổ
  scalpel: `<g class="im-lac-nhe"><g transform="rotate(-40 24 24)">
    <path d="M21 4h6v23h-6z" fill="#B98AD3" ${W}/>
    <path d="M22.5 9h3M22.5 14h3M22.5 19h3" ${W} stroke-width="1.6"/>
    <path d="M21 27h6v4c0 6-1.5 11-4.5 15-.6-5-1.5-10-1.5-14z" fill="#DDE5EC" ${W}/>
    <path d="M24.5 30v8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g></g>
    <path class="im-sao" d="M38 30l1.4 3.6L43 35l-3.6 1.4L38 40l-1.4-3.6L33 35l3.6-1.4z" fill="#FFC94D" ${W} stroke-width="1.5"/>`,
  // Dự phòng cho dữ liệu cũ: chữ thập y tế
  cross: `<g class="im-dap"><path d="M18 6h12a2 2 0 0 1 2 2v8h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8v8a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2v-8H8a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2h8V8a2 2 0 0 1 2-2z" fill="#F36F7F" ${W}/>
    <path d="M20 12h4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/></g>`,
  // Nội trú: ổ nệm có bé đang ngủ
  bed: `<ellipse cx="24" cy="34" rx="20" ry="10" fill="#F79A3E" ${W}/>
    <ellipse cx="24" cy="31" rx="15" ry="6.5" fill="#FFE6C7" ${W} stroke-width="1.8"/>
    <g class="im-tho"><path d="M15 30c0-6 4-10 9-10s9 4 9 10" fill="#fff" ${W} stroke-width="1.8"/><path d="M19 25l-1-4 3 2M29 25l1-4-3 2" fill="#fff" ${W} stroke-width="1.6"/><path d="M21 28q1 1 2 0M25 28q1 1 2 0" fill="none" ${W} stroke-width="1.4"/></g>
    <text class="im-z" x="35" y="17" font-family="Baloo 2, sans-serif" font-weight="800" font-size="11" fill="#8E5BAD">z</text><text class="im-z im-z2" x="40" y="11" font-family="Baloo 2, sans-serif" font-weight="800" font-size="8" fill="#8E5BAD">z</text>`,
  // Cấp cứu: tim đỏ, nhịp tim
  'heart-pulse': `<path class="im-dap" d="M24 42S5 30 5 17a9.5 9.5 0 0 1 19-3 9.5 9.5 0 0 1 19 3c0 13-19 25-19 25z" fill="#F36F7F" ${W}/>
    <path class="im-ecg" d="M8 23h8l3-6 4 12 4-9 2 3h11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Mặt cún: tai vẫy, thè lưỡi
  dog: `<g class="im-tai"><path d="M28 22c-16 4-20 30-12 44 4 6 12 4 14-4l6-30z" fill="#8A5A33" ${W} stroke-width="5"/></g>
    <g class="im-tai im-tai-p"><path d="M102 22c16 4 20 30 12 44-4 6-12 4-14-4l-6-30z" fill="#8A5A33" ${W} stroke-width="5"/></g>
    <ellipse cx="65" cy="52" rx="40" ry="38" fill="#E9B872" ${W} stroke-width="5"/>
    <ellipse cx="65" cy="70" rx="22" ry="16" fill="#FFF3E0"/>
    <g class="im-mat"><ellipse cx="48" cy="50" rx="6.5" ry="7.5" fill="${V}"/><ellipse cx="82" cy="50" rx="6.5" ry="7.5" fill="${V}"/></g>
    <ellipse cx="65" cy="62" rx="8" ry="6" fill="${V}"/>
    <path class="im-luoi" d="M59 74h12v7a6 6 0 0 1-12 0z" fill="#F28BA8" ${W} stroke-width="3"/>`,
  // Mặt mèo cam: chớp mắt, rung râu
  cat: `<path d="M30 40 34 6l24 22Z" fill="#F79A3E" ${W} stroke-width="5"/><path d="M100 40 96 6 72 28Z" fill="#F79A3E" ${W} stroke-width="5"/>
    <ellipse cx="65" cy="56" rx="42" ry="34" fill="#F79A3E" ${W} stroke-width="5"/>
    <path d="M65 24v10M53 26l3 9M77 26l-3 9" stroke="#C9661F" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="65" cy="70" rx="16" ry="11" fill="#FFE6C7"/>
    <g class="im-mat"><ellipse cx="50" cy="55" rx="6.5" ry="7.5" fill="${V}"/><ellipse cx="80" cy="55" rx="6.5" ry="7.5" fill="${V}"/></g>
    <path d="M61 64h8l-4 4Z" fill="#E5688A"/>
    <path class="im-rau" d="M20 62l18 3M20 72l18-2M110 62l-18 3M110 72l-18-2" stroke="${V}" stroke-width="2.5" stroke-linecap="round"/>`,
};

// Đo bằng getBBox (kèm nửa nét viền): dời + phóng để hình vừa ô 40×40 ở giữa khung 48×48
export const KHUNG: Record<string, string> = {
  'stethoscope': 'translate(-3.40 2.37) scale(0.9615)',
  'flask': 'translate(0.92 0.44) scale(0.9615)',
  'syringe': 'translate(-0.31 -2.30) scale(0.9981)',
  'bath': 'translate(0.35 -0.63) scale(0.9852)',
  'scissors': 'translate(-0.87 -0.87) scale(1.0363)',
  'comb': 'translate(2.48 3.82) scale(0.8969)',
  'bandage': 'translate(3.72 4.37) scale(0.8452)',
  'scalpel': 'translate(-2.84 -1.64) scale(1.0354)',
  'cross': 'translate(-0.87 -0.87) scale(1.0363)',
  'bed': 'translate(1.46 1.46) scale(0.9390)',
  'heart-pulse': 'translate(0.49 0.55) scale(0.9796)',
  'dog': 'translate(0.58 5.26) scale(0.3604)',
  'cat': 'translate(-3.37 3.79) scale(0.4211)',
};
