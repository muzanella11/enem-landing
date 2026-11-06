const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** "2026-11-06" -> "6 November 2026" (or "Jumat, 6 November 2026"). Same on server and client. */
export const formatTanggal = (iso: string, denganHari = false): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  const teks = `${Number(d)} ${BULAN[Number(m) - 1]} ${y}`;
  if (!denganHari) return teks;
  const day = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d)),
  ).getUTCDay();
  return `${HARI[day]}, ${teks}`;
};
