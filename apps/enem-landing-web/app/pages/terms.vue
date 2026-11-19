<script lang="ts" setup>
definePageMeta({ layout: 'blog' });

const SITE_URL = 'https://muzanella.com';
const title = 'Terms of use';
const description =
  'The terms for reading and using muzanella.com, its blog, and the tools site.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: `${SITE_URL}/terms`,
});
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/terms` }] });
</script>

<template>
  <article class="c-terms max-w-3xl mx-auto px-4 pb-24 text-lg leading-relaxed">
    <h1 class="text-3xl lg:text-5xl font-bold text-[#2C3E50] text-center py-12">
      Terms of use
    </h1>

    <p>
      These terms apply to muzanella.com, its blog, and the calculators on
      <a href="https://tools.muzanella.com">tools.muzanella.com</a>. By using
      the site you agree to them. The site is run by Nurfirliana Muzanella, an
      individual based in Indonesia.
    </p>

    <h2>Information, not professional advice</h2>
    <p>
      Articles and calculators explain rules such as tax, salary, insurance, and
      religious obligations, and cite the regulation or official source they are
      based on. They are written for general information. Results are estimates
      and can differ from your actual case. Check with the relevant institution
      or a qualified professional before making a financial, legal, tax, health,
      or religious decision.
    </p>

    <h2>Accuracy and updates</h2>
    <p>
      Content is reviewed and updated when regulations change. Rules can still
      change before an article is revised. If you find a mistake, email
      <a href="mailto:muzanella11@gmail.com">muzanella11@gmail.com</a> and it
      will be corrected.
    </p>

    <h2>Using the content</h2>
    <ul>
      <li>
        You may read, share links to, and quote short parts of articles with a
        link back to the source.
      </li>
      <li>
        Copying whole articles, images, or the calculators to another site
        without permission is not allowed.
      </li>
      <li>
        Do not use the site in a way that disrupts it for others, such as
        automated bulk requests or attempts to bypass its security.
      </li>
    </ul>

    <h2>Links and advertising</h2>
    <p>
      Pages may link to other websites and may show ads from Google AdSense. We
      do not control the content of those websites or ads, and an ad is not a
      recommendation. See
      <NuxtLink to="/privacy">Privacy and cookies</NuxtLink> for how ads and
      cookies work.
    </p>

    <h2>Liability</h2>
    <p>
      The site is provided as is. We are not liable for losses that come from
      relying on an article, a calculator result, or an external link.
    </p>

    <h2>Changes</h2>
    <p>
      These terms may be updated. The current version is always on this page.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about these terms: email
      <a href="mailto:muzanella11@gmail.com">muzanella11@gmail.com</a> or use
      the <NuxtLink to="/#contact">contact form</NuxtLink>.
    </p>
  </article>
</template>

<style scoped>
.c-terms h2 {
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.5rem;
  margin: 1.5em 0 0.6em;
}

.c-terms p {
  margin: 0 0 1.2em;
}

.c-terms ul {
  list-style: disc;
  margin: 0 0 1.2em;
  padding-left: 1.5em;
}

.c-terms li {
  margin-bottom: 0.4em;
}

.c-terms a {
  color: #0e7c6b;
  text-decoration: underline;
}
</style>
