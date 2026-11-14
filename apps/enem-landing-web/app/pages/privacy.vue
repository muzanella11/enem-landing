<script lang="ts" setup>
definePageMeta({ layout: 'blog' });

const SITE_URL = 'https://muzanella.com';
const title = 'Privacy and cookies';
const description =
  'How muzanella.com handles visit statistics, cookies, and advertising.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: `${SITE_URL}/privacy`,
});
useHead({ link: [{ rel: 'canonical', href: `${SITE_URL}/privacy` }] });
</script>

<template>
  <article
    class="c-privacy max-w-3xl mx-auto px-4 pb-24 text-lg leading-relaxed"
  >
    <h1 class="text-3xl lg:text-5xl font-bold text-[#2C3E50] text-center py-12">
      Privacy and cookies
    </h1>

    <p>
      This page explains what muzanella.com (this portfolio and its blog)
      records about visits, which cookies are set, and how ads work. The
      calculators on
      <a href="https://tools.muzanella.com/privasi">tools.muzanella.com</a>
      have their own privacy page.
    </p>

    <h2>What we record ourselves</h2>
    <ul>
      <li>
        Anonymous visit statistics: pages opened, time on page, device type,
        approximate location from the IP address, and where the visit came from.
      </li>
      <li>
        Click positions on a page (for heatmaps) and general events such as a
        share button being pressed.
      </li>
      <li>
        A sample of visits may be recorded as a session replay (page layout,
        scrolling, clicks) to find usability problems. Text typed into forms is
        masked and never stored.
      </li>
    </ul>
    <p>
      This data stays on our own server, is only used to improve the site, and
      is never sold or shared.
    </p>

    <h2>Contact form</h2>
    <p>
      When you send a message through the contact form, we store what you wrote
      (name, email, phone number, message). To keep the form free of spam and
      abuse we also record, with each message: your IP address and its
      approximate location and network provider, your browser and device details
      (browser, language, timezone, screen size), how the form was filled in
      (time taken, whether text was typed or pasted), and the anonymous visit ID
      from the statistics above. These details are only visible to the site
      owner, are never emailed or shared, and are deleted after 90 days. The
      form also asks you to solve a small slider puzzle; it is served from our
      own server and sets no cookies.
    </p>

    <h2>Google Analytics</h2>
    <p>
      We use Google Analytics to understand which pages and search queries bring
      readers here and which pages earn ad revenue. Google Analytics sets
      cookies. Besides page views it only receives which article a reader came
      from when following a link to the tools site. You can opt out with the
      <a
        href="https://tools.google.com/dlpage/gaoptout"
        target="_blank"
        rel="noopener"
        >Google Analytics opt-out add-on</a
      >.
    </p>

    <h2>Advertising</h2>
    <p>
      Blog articles may show Google AdSense ads. Google, as a third-party
      vendor, uses cookies to serve ads based on your visits to this and other
      websites. You can turn off personalized ads in
      <a href="https://adssettings.google.com" target="_blank" rel="noopener"
        >Google Ad Settings</a
      >, and read how Google uses this data in
      <a
        href="https://policies.google.com/technologies/partner-sites"
        target="_blank"
        rel="noopener"
        >How Google uses information from sites that use its services</a
      >.
    </p>
    <p>
      Visitors from the European Economic Area, the UK, and Switzerland see a
      consent message from Google before any ad or analytics cookie is set, and
      can change that choice at any time through the link the message provides.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about your data, or a request to delete it: email
      <a href="mailto:muzanella11@gmail.com">muzanella11@gmail.com</a>.
    </p>
  </article>
</template>

<style scoped>
.c-privacy h2 {
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.5rem;
  margin: 1.5em 0 0.6em;
}

.c-privacy p {
  margin: 0 0 1.2em;
}

.c-privacy ul {
  list-style: disc;
  margin: 0 0 1.2em;
  padding-left: 1.5em;
}

.c-privacy li {
  margin-bottom: 0.4em;
}

.c-privacy a {
  color: #0e7c6b;
  text-decoration: underline;
}
</style>
