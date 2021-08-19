export default {
  data () {
    return {
      //
    }
  },

  computed: {
    //
  },

  methods: {
    init () {
      this.nuxtBugsFavicon()
    },

    nuxtBugsFavicon () {
      // nuxt bugs adding favicon from unknown
      const iconOldEl = document.querySelectorAll('link[rel="shortcut icon"]') || []

      iconOldEl.forEach((item) => {
        item.remove()
      })
    }
  }
}
