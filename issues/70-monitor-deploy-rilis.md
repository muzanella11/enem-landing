# Story 70: Riwayat Deploy dan Versi Rilis di Monitor

**Status:** Done (2026-11-23)

**Apps touched:** `enem-landing-log-reader`, `enem-landing-monitor-api`,
`enem-landing-monitor`, `.github/workflows/build-push.yml`

**Depends on:** Story 64 (pemindaian container), Story 10 (CI/CD)

## Background

Hasil brainstorm 2026-11-23. Saat ada masalah, pertanyaan pertama biasanya
"apa yang baru dideploy?". Sekarang jawabannya harus dicari manual di
GitHub Actions, `docker service ps`, dan tag GHCR. Tidak ada cara cepat
untuk tahu versi mana yang jalan di prod dan dev, kapan terakhir dideploy,
dan apakah dev sudah jauh di depan prod.

## Goal

SuperAdmin bisa melihat versi yang sedang jalan untuk setiap service di
prod dan dev, riwayat deploy, dan perbedaan antara prod dan dev, dengan
tautan ke commit dan release GitHub.

## Keputusan awal

1. **Label image OCI** ditambahkan di `build-push.yml` (lewat
   `docker/metadata-action` atau `labels:` langsung):
   `org.opencontainers.image.revision` (SHA commit),
   `org.opencontainers.image.version` (tag rilis untuk prod, `dev-<sha>`
   untuk dev), `org.opencontainers.image.created`, dan
   `org.opencontainers.image.source`.
2. **Data dari `config.v2.json`** yang sudah dibaca log-reader:
   `Config.Image` (nama dan tag), image id, `Config.Labels` (label OCI di
   atas ikut tersalin ke container), dan `Created`. Tidak perlu Docker
   socket atau akses registry.
3. **Riwayat deploy** = urutan container per service (termasuk yang sudah
   berhenti, sampai 72 jam sesuai Story 62) dengan versi masing-masing.
   Untuk riwayat lebih panjang, monitor-api mencatat setiap perubahan
   versi yang terdeteksi ke Redis list (maksimal 200 entri, TTL 90 hari).
4. **Monitor**: menu baru **Deploy**:
   - tabel service x environment: versi, commit pendek (tautan ke GitHub),
     waktu deploy, umur container;
   - penanda **prod dan dev beda versi** per service, dengan tautan
     compare GitHub (`/compare/<prod-sha>...<dev-sha>`);
   - riwayat deploy terbaru di atas, termasuk rollback (versi turun)
     dengan tanda khusus;
   - dashboard: card **Deploy** berisi versi prod, waktu deploy terakhir
     prod dan dev, dan jumlah service yang beda versi.
5. Tautan GitHub dibangun dari label `source`, bukan input user. Tidak ada
   panggilan ke GitHub API (tanpa token).

## Di luar scope

- Memicu deploy atau rollback dari monitor.
- Changelog lengkap (sudah ada di GitHub Release).
- Riwayat deploy sebelum label OCI ditambahkan.

## Acceptance criteria

- [ ] Image baru dari CI membawa label OCI (`docker inspect` di VPS).
- [ ] Versi dan commit per service cocok dengan `docker service ps` dan
      tag GHCR.
- [ ] Rilis prod baru tercatat di riwayat dengan waktu dan versinya.
- [ ] Penanda beda versi prod dan dev muncul dengan tautan compare yang
      benar.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Tunggu satu build dev dan satu rilis prod agar label OCI ada di semua
   image.
2. Cocokkan menu Deploy dengan `docker service ps` di VPS.

## Referensi

- OCI image annotations:
  https://github.com/opencontainers/image-spec/blob/main/annotations.md
- `docker/metadata-action`: https://github.com/docker/metadata-action
