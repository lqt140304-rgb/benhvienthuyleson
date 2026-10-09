// Hai loại nội dung soạn trong trang quản trị /admin: bài tư vấn và nhật ký ca bệnh
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const chuoi = z.string().nullish().transform((v) => v ?? '');

const tuVan = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tu-van' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    chuyen_muc: z.enum(['Chó', 'Mèo']),
    description: chuoi,
    image: chuoi,
    tac_gia: chuoi,
    noi_bat: z.boolean().nullish().transform((v) => !!v),
    dau_hieu_nguy_hiem: z.array(z.string()).nullish().transform((v) => (v ?? []).filter(Boolean)),
    nhap: z.boolean().nullish().transform((v) => !!v),
  }),
});

const caBenh = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ca-benh' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    loai: z.enum(['Chó', 'Mèo']),
    image: chuoi,
    anh: z.array(z.object({ src: chuoi, chu_thich: chuoi })).nullish().transform((v) => (v ?? []).filter((a) => a.src)),
    tom_tat: chuoi,
    bac_si: chuoi,
    nhay_cam: z.boolean().nullish().transform((v) => !!v),
    nhap: z.boolean().nullish().transform((v) => !!v),
  }),
});

export const collections = { tuVan, caBenh };
