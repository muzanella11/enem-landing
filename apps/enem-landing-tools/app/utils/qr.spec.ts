import { describe, expect, it } from 'vitest';
import { linkWhatsApp, normalisasiNomor, qrKontak, qrWifi } from './qr.js';

describe('normalisasiNomor', () => {
  it.each([
    ['0812-3456-7890', '6281234567890'],
    ['+62 812 3456 7890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['81234567890', '6281234567890'],
  ])('%s -> %s', (input, expected) => {
    expect(normalisasiNomor(input)).toBe(expected);
  });

  it.each(['12345', '', 'abc', '+1 415 555 0100'])('rejects %j', (input) => {
    expect(normalisasiNomor(input)).toBeNull();
  });
});

describe('linkWhatsApp', () => {
  it('encodes the message including emoji and new lines', () => {
    expect(linkWhatsApp('0812 3456 7890', 'Halo kak,\nmau pesan 🍰')).toBe(
      'https://wa.me/6281234567890?text=Halo%20kak%2C%0Amau%20pesan%20%F0%9F%8D%B0',
    );
    expect(linkWhatsApp('0812 3456 7890', '')).toBe(
      'https://wa.me/6281234567890',
    );
    expect(linkWhatsApp('123', 'x')).toBeNull();
  });
});

describe('QR payloads', () => {
  it('WiFi escapes special characters', () => {
    expect(qrWifi('Rumah;Ku', 'pa:ss"1', 'WPA')).toBe(
      String.raw`WIFI:T:WPA;S:Rumah\;Ku;P:pa\:ss\"1;;`,
    );
    expect(qrWifi('Tamu', '', 'nopass', true)).toBe(
      'WIFI:T:nopass;S:Tamu;H:true;;',
    );
  });

  it('vCard skips empty fields', () => {
    expect(qrKontak({ nama: 'Toko Ani', telepon: '0812 3456' })).toBe(
      'BEGIN:VCARD\nVERSION:3.0\nFN:Toko Ani\nTEL;TYPE=CELL:08123456\nEND:VCARD',
    );
  });

  it('escapes backslashes too', () => {
    expect(qrWifi(String.raw`a\b`, 'x', 'WPA')).toBe(
      String.raw`WIFI:T:WPA;S:a\\b;P:x;;`,
    );
    expect(qrKontak({ nama: String.raw`A\B` })).toContain(String.raw`FN:A\\B`);
  });
});
