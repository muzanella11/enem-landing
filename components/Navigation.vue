<template>
  <!-- Navigation-->
  <nav id="mainNav" class="navbar navbar-expand-lg bg-secondary text-uppercase fixed-top">
    <div class="container">
      <a class="navbar-brand" href="#pageTop" @click="scrollIntoView">{{ titlePage }}</a>
      <button v-b-toggle.navbarResponsive class="navbar-toggler text-uppercase font-weight-bold bg-primary text-white rounded" type="button" data-bs-toggle="collapse" data-bs-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
        Menu
        <i class="fas fa-bars"></i>
      </button>
      <b-collapse id="navbarResponsive" class="collapse navbar-collapse">
        <ul v-b-scrollspy:pageTop pills class="navbar-nav ms-auto">
          <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#experience" @click="scrollIntoView">Experience</a></li>
          <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#portfolio" @click="scrollIntoView">Portfolio</a></li>
          <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#about" @click="scrollIntoView">About</a></li>
          <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="#contact" @click="scrollIntoView">Contact</a></li>
        </ul>
      </b-collapse>
    </div>
  </nav>
</template>

<script>
export default {
  data () {
    return {
      //
    }
  },

  computed: {
    titlePage () {
      return process.env.copywrite.title
    }
  },

  mounted () {
    this.init()
  },

  methods: {
    init () {
      // Shrink the navbar
      this.navbarShrink()

      // Shrink the navbar when page is scrolled
      document.addEventListener('scroll', this.navbarShrink)
    },

    scrollIntoView(event) {
      event.preventDefault()
      const href = event.target.getAttribute('href')
      const el = href ? document.querySelector(href) : null

      if (el) {
        window.scrollTo({
          top: el.offsetTop,
          behavior: 'smooth'
        })
      }

      this.navbarToggler()
    },

    navbarShrink () {
      const navbarCollapsible = document.body.querySelector('#mainNav')

      if (!navbarCollapsible) {
        return
      }

      if (window.scrollY === 0) {
        navbarCollapsible.classList.remove('navbar-shrink')
      } else {
        navbarCollapsible.classList.add('navbar-shrink')
      }
    },

    navbarToggler () {
      const navbarToggler = document.body.querySelector('.navbar-toggler')
      const innerWidth = window.innerWidth

      if (innerWidth >= 992) return

      navbarToggler.click()
    }
  }
}
</script>
