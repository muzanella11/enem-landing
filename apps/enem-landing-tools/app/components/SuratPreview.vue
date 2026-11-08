<script setup lang="ts">
import type { SuratJadi } from '~/utils/surat';

/** HTML rendering of a filled letter (Story 33), same order as the PDF. */
defineProps<{ surat: SuratJadi }>();
</script>

<template>
  <article
    class="surat mx-auto max-w-[42rem] space-y-4 bg-white p-6 font-serif text-[15px] leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10"
  >
    <p v-if="surat.tanggalDi === 'atas'" class="text-right">
      {{ surat.tempatTanggal }}
    </p>
    <div v-if="surat.kepada.length">
      <p v-for="line in surat.kepada" :key="line">{{ line }}</p>
    </div>
    <p v-if="surat.perihal">
      Perihal : <strong>{{ surat.perihal }}</strong>
    </p>
    <!-- A title inside the previewed letter, not a page section: a <p>
         keeps the page's heading outline valid (PageSpeed heading-order). -->
    <p v-if="surat.judul" class="text-center font-bold underline">
      {{ surat.judul }}
    </p>
    <template v-for="(blok, index) in surat.blok" :key="index">
      <p
        v-if="blok.jenis === 'p'"
        :class="blok.rataTengah ? 'text-center' : 'text-justify'"
      >
        {{ blok.teks }}
      </p>
      <table v-else-if="blok.jenis === 'tabel'" class="ml-6">
        <tbody>
          <tr v-for="[label, value] in blok.baris" :key="label">
            <td class="pr-2 align-top whitespace-nowrap">{{ label }}</td>
            <td class="pr-2 align-top">:</td>
            <td class="align-top">{{ value }}</td>
          </tr>
        </tbody>
      </table>
      <ol v-else class="ml-12 list-decimal space-y-1 text-justify">
        <li v-for="item in blok.item" :key="item">{{ item }}</li>
      </ol>
    </template>
    <div class="grid grid-cols-2 gap-6 pt-2">
      <div
        v-for="(signer, index) in surat.ttd"
        :key="index"
        :class="surat.ttd.length === 1 ? 'col-start-2' : ''"
      >
        <template v-if="index === surat.ttd.length - 1">
          <p v-if="surat.tanggalDi === 'ttd'">{{ surat.tempatTanggal }}</p>
          <p v-if="surat.salam">{{ surat.salam }}</p>
        </template>
        <p
          v-else-if="surat.tanggalDi === 'ttd' || surat.salam"
          aria-hidden="true"
        >
          &nbsp;
        </p>
        <p>{{ signer.label ?? '\u00a0' }}</p>
        <div class="flex h-20 items-center">
          <span
            v-if="signer.meterai"
            class="rounded border border-dashed border-slate-400 px-2 py-1 text-center text-[10px] leading-tight text-slate-500"
            >Meterai<br />10.000</span
          >
        </div>
        <p class="font-bold underline">{{ signer.nama }}</p>
      </div>
    </div>
  </article>
</template>
