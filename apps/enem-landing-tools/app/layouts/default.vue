<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-bold text-teal-800"
        >
          <span
            class="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-sm text-white"
            aria-hidden="true"
            >T</span
          >
          Tools muzanella
        </NuxtLink>
        <nav class="flex items-center gap-4 text-sm text-slate-600">
          <a href="https://muzanella.com" class="hover:text-teal-700"
            >muzanella.com</a
          >
          <a href="https://muzanella.com/blog" class="hover:text-teal-700"
            >Blog</a
          >
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl space-y-3 px-4 py-6 text-sm text-slate-600">
        <p>
          Hasil kalkulator adalah estimasi, bukan nasihat pajak, keuangan, atau
          keagamaan resmi. Cek kembali ke instansi atau ahli terkait sebelum
          mengambil keputusan.
        </p>
        <p>
          Semua hitungan dan pemrosesan file berjalan di perangkatmu. Angka dan
          file yang kamu isi tidak dikirim ke server kami.
        </p>
        <DonationCta placement="footer" variant="footer" />
        <p class="flex flex-wrap gap-x-4 gap-y-1">
          <NuxtLink to="/privasi" class="btn-link">Privasi dan cookie</NuxtLink>
          <a href="https://muzanella.com" class="btn-link">Tentang pembuat</a>
        </p>
      </div>
    </footer>

    <ClientOnly>
      <ConsentBanner />
    </ClientOnly>
  </div>
</template>
