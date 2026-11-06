/** WhatsApp links and QR payloads (Story 39). Pure string builders. */

/**
 * Indonesian phone number to the international digits WhatsApp expects:
 * "0812-3456 7890", "+62 812...", "62812..." -> "6281234567890".
 * Returns null when it can't be a valid Indonesian mobile number.
 */
export const normalisasiNomor = (input: string): string | null => {
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  if (!/^62\d{8,13}$/.test(digits)) return null;
  return digits;
};

export const linkWhatsApp = (nomor: string, pesan: string): string | null => {
  const normal = normalisasiNomor(nomor);
  if (!normal) return null;
  return pesan.trim()
    ? `https://wa.me/${normal}?text=${encodeURIComponent(pesan)}`
    : `https://wa.me/${normal}`;
};

const escapeWifi = (text: string) => text.replace(/([\\;,:"])/g, '\\$1');

export const qrWifi = (
  ssid: string,
  password: string,
  keamanan: 'WPA' | 'WEP' | 'nopass',
  tersembunyi = false,
): string =>
  `WIFI:T:${keamanan};S:${escapeWifi(ssid)};${keamanan === 'nopass' ? '' : `P:${escapeWifi(password)};`}${tersembunyi ? 'H:true;' : ''};`;

const escapeVcard = (text: string) =>
  text.replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');

export const qrKontak = (kontak: {
  nama: string;
  telepon?: string;
  email?: string;
  organisasi?: string;
}): string =>
  [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcard(kontak.nama)}`,
    kontak.organisasi ? `ORG:${escapeVcard(kontak.organisasi)}` : '',
    kontak.telepon ? `TEL;TYPE=CELL:${kontak.telepon.replace(/\s/g, '')}` : '',
    kontak.email ? `EMAIL:${kontak.email}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');
