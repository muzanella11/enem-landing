require('dotenv').config()

const VERSION = require('./package.json').version || '0.0.1'
const ENVIRONMENT = process.env.ENVIRONMENT || 'local'
const CONFIGENVIRONMENT = require(`./config/${ENVIRONMENT.toLowerCase()}.json`)
const PORT = process.env.NUXT_PORT || 4000
const {
  copywrite,
  hostname
} = CONFIGENVIRONMENT.env

export default {
  // Port Config
  server: {
    port: PORT
  },

  // Environment config
  env: Object.assign({}, CONFIGENVIRONMENT.env, {
    version: VERSION
  }),

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: copywrite.title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'index, follow' },
      { hid: 'http-equiv', 'http-equiv': 'X-UA-Compatible', content: 'IE=edge,chrome=1' },
      { hid: 'description', name: 'description', content: copywrite.description },
      { hid: 'keywords', name: 'keywords', content: copywrite.keywords },
      { hid: 'og:type', property: 'og:type', content: 'website' },
      { hid: 'og:title', property: 'og:title', content: copywrite.title },
      { hid: 'og:site_name', property: 'og:site_name', content: copywrite.sitename },
      { hid: 'og:url', property: 'og:url', content: hostname },
      { hid: 'og:description', property: 'og:description', content: copywrite.description },
      { hid: 'og:keywords', property: 'og:keywords', content: copywrite.keywords },
      { hid: 'og:image', property: 'og:image', content: `${hostname}/enem.png` },
      { hid: 'og:image:type', property: 'og:image:type', content: 'image/png' },
      { hid: 'og:image:width', property: 'og:image:width', content: '1200' },
      { hid: 'og:image:height', property: 'og:image:height', content: '1200' },
      { hid: 'og:image:alt', property: 'og:image:alt', content: copywrite.description },
      { hid: 'twitter:card', name: 'twitter:card', content: 'summary' },
      { hid: 'twitter:title', name: 'twitter:title', content: copywrite.title },
      { hid: 'twitter:site', name: 'twitter:site', content: copywrite.sitename },
      { hid: 'twitter:url', name: 'twitter:url', content: hostname },
      { hid: 'twitter:description', name: 'twitter:description', content: copywrite.description },
      { hid: 'twitter:keywords', name: 'twitter:keywords', content: copywrite.keywords },
      { hid: 'twitter:image', name: 'twitter:image', content: `${hostname}/enem.png` },
      { hid: 'twitter:image:src', name: 'twitter:image:src', content: `${hostname}/enem.png` },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'canonical', href: hostname }
    ],
    script: [
      {
        src: 'https://use.fontawesome.com/releases/v5.15.3/js/all.js'
      }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/scss/main.scss'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    '@nuxtjs/google-analytics'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://github.com/nuxt-community/robots-module
    '@nuxtjs/robots',
    // https://sitemap.nuxtjs.org
    '@nuxtjs/sitemap',
    // https://www.npmjs.com/package/nuxt-lazy-load
    [
      'nuxt-lazy-load',
      {
        directiveOnly: true,
        defaultImage: '/img/image-not-available.svg'
      }
    ]
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // Robots module: https://github.com/nuxt-community/robots-module
  robots: {
    //
  },

  // Sitemap module: https://sitemap.nuxtjs.org
  sitemap: {
    // options
  },

  // Google analytic
  googleAnalytics: {
    id: process.env.GOOGLE_ANALYTICS_ID, // Use as fallback if no runtime config is provided
  },

  publicRuntimeConfig: {
    googleAnalytics: {
      id: process.env.GOOGLE_ANALYTICS_ID
    }
  },

  /*
   ** Customize the progress-bar color
   */
   loading: {
    color: '#1074bf',
    height: '3px',
    throttle: 0
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extractCSS: ENVIRONMENT !== 'local'
  }
}
