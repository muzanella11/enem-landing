require('dotenv').config()

const VERSION = require('./package.json').version || '0.0.1'
const ENVIRONMENT = process.env.ENVIRONMENT || 'local'
const CONFIGENVIRONMENT = require(`./config/${ENVIRONMENT.toLowerCase()}.json`)
const PORT = process.env.NUXT_PORT || 4000

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
    title: 'Nurfirliana Muzanella',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
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
    '@nuxtjs/stylelint-module'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios'
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

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
