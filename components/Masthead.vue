<template>
  <!-- Masthead-->
  <header class="masthead bg-primary text-white text-center">
    <div class="container d-flex align-items-center flex-column">
      <!-- Masthead Avatar Image-->
      <img class="masthead-avatar mb-5" src="img/avataaars.svg" alt="..." />
      <!-- Masthead Heading-->
      <h1 class="masthead-heading text-uppercase mb-0">{{ titlePage }}</h1>
      <!-- Icon Divider-->
      <div class="divider-custom divider-light">
        <div class="divider-custom-line"></div>
        <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
        <div class="divider-custom-line"></div>
      </div>
      <!-- Masthead Subheading-->
      <p class="masthead-subheading font-weight-light mb-2">{{ subheading }}</p>

      <div class="row">
        <div class="col-12">
          <b-badge
            v-for="(itemSkill, indexSkill) in skills"
            :key="indexSkill"
            class="mr-2 mt-2"
          >
            {{ itemSkill }}
          </b-badge>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  data () {
    return {
      skills: [
        'HTML',
        'CSS',
        'Javascript',
        'Node JS',
        'Vue JS',
        'PHP',
        'Python',
        'Docker'
      ]
    }
  },

  computed: {
    titlePage () {
      return process.env.copywrite.title
    },

    subheading () {
      return 'Frontend Engineer'
    }
  },

  methods: {
    //
  }
}
</script>
