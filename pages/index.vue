<template>
  <div class="l-landing">
    <!-- Experience Section-->
    <section id="experience" class="page-section experience">
      <div class="container">
        <!-- Experience Section Heading-->
        <h2 class="page-section-heading text-center text-uppercase text-secondary mb-0">Experience</h2>
        <!-- Icon Divider-->
        <div class="divider-custom">
            <div class="divider-custom-line"></div>
            <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
            <div class="divider-custom-line"></div>
        </div>

        <div class="row">
          <div class="col-md-12">
            <div id="contentTimeline">
              <ul class="timeline">
                <li
                  v-for="(itemExperience, indexExperience) in experiences"
                  :key="indexExperience"
                  class="event"
                  :data-date="itemExperience.workingPeriode"
                >
                  <h3>{{ itemExperience.company }} // {{ itemExperience.position }}</h3>
                  <p>
                    {{ itemExperience.description }}
                  </p>

                  <br>

                  <p>
                    Role Summary: <br>
                    {{ itemExperience.roleSummary }} <br>
                  </p>

                  <br>

                  <p>
                    Experiences gained: <br>
                  </p>
                  <ul>
                    <li
                      v-for="(itemExperienceGained, indexExperienceGained) in itemExperience.experienceGained"
                      :key="indexExperienceGained"
                    >
                      - {{ itemExperienceGained }}
                    </li>
                  </ul>

                  <br>

                  <p>
                    Selected Projects: <br>
                  </p>
                  <ul>
                    <li
                      v-for="(itemProject, indexProject) in itemExperience.projects"
                      :key="indexProject"
                    >
                      - {{ itemProject.title }} //
                        <template v-if="itemProject.url">
                          (Link to app: <a class="btn-link" :href="itemProject.url">{{itemProject.url}}</a>)
                        </template>
                        <template v-if="!itemProject.url">
                          (Internal app, no preview link available)
                        </template>
                      // {{ itemProject.year }} <br>
                      {{ itemProject.description }} Using technologies:
                      <ul class="ml-4">
                        <li
                          v-for="(itemTechnology, indexTechnology) in itemProject.technologies"
                          :key="indexTechnology"
                        >
                          - {{ itemTechnology }}
                        </li>
                      </ul>

                      <hr v-if="itemExperience.projects.length !== indexProject + 1" />
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Portfolio Section-->
    <section id="portfolio" class="page-section portfolio">
      <div class="container">
        <!-- Portfolio Section Heading-->
        <h2 class="page-section-heading text-center text-uppercase text-secondary mb-0">Portfolio</h2>
        <!-- Icon Divider-->
        <div class="divider-custom">
          <div class="divider-custom-line"></div>
          <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
          <div class="divider-custom-line"></div>
        </div>
        <!-- Portfolio Grid Items-->
        <div class="row justify-content-center">
          <!-- Portfolio Item 1-->
          <div
            v-for="(itemPortfolio, indexPortfolio) in portfolioEntries"
            :key="indexPortfolio"
            class="col-md-6 col-lg-4 mb-5"
          >
            <div v-b-modal.portfolioModal class="portfolio-item mx-auto" @click="togglePortfolioModal(itemPortfolio)">
              <div class="portfolio-item-caption d-flex align-items-center justify-content-center h-100 w-100">
                <div class="portfolio-item-caption-content text-center text-white"><i class="fas fa-plus fa-3x"></i></div>
              </div>
              <img class="img-fluid" :src="itemPortfolio.image[0] ? itemPortfolio.image[0] : imageNotAvailable" alt="..." />
            </div>

            <h3 class="mb-3 mt-3">
              {{ itemPortfolio.title }}
            </h3>
          </div>
        </div>
      </div>
    </section>
    <!-- About Section-->
    <section id="about" class="page-section bg-primary text-white mb-0">
      <div class="container">
          <!-- About Section Heading-->
          <h2 class="page-section-heading text-center text-uppercase text-white">About</h2>
          <!-- Icon Divider-->
          <div class="divider-custom divider-light">
            <div class="divider-custom-line"></div>
            <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
            <div class="divider-custom-line"></div>
          </div>
          <!-- About Section Content-->
          <div class="row">
            <div class="col-lg-12 ms-auto">
              <p class="lead">
                Hello, my name is Nurfirliana Muzanella. I'm Frontend Engineer. Combine the art of design with the art of programming. Have good experience on layouting html and play with css and javascript for more attractive layouting. Make the layout fit with all screen device. So if you interesting with me, you can send me a message or call me. Let's talk :)
              </p>
            </div>
          </div>
          <!-- About Section Button-->
          <!-- <div class="text-center mt-4">
            <a class="btn btn-xl btn-outline-light" href="javascript:;">
              <i class="fas fa-download me-2"></i>
              Free Download!
            </a>
          </div> -->
      </div>
    </section>
    <!-- Contact Section-->
    <section id="contact" class="page-section">
      <div class="container">
        <!-- Contact Section Heading-->
        <h2 class="page-section-heading text-center text-uppercase text-secondary mb-0">Contact Me</h2>
        <!-- Icon Divider-->
        <div class="divider-custom">
          <div class="divider-custom-line"></div>
          <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
          <div class="divider-custom-line"></div>
        </div>
        <!-- Contact Section Form-->
        <div class="row justify-content-center">
          <div class="col-lg-8 col-xl-7">
            <!-- * * * * * * * * * * * * * * *-->
            <!-- * * SB Forms Contact Form * *-->
            <!-- * * * * * * * * * * * * * * *-->
            <!-- This form is pre-integrated with SB Forms.-->
            <!-- To make this form functional, sign up at-->
            <!-- https://startbootstrap.com/solution/contact-forms-->
            <!-- to get an API token!-->
            <form v-if="!businessCardShown" id="contactForm" data-sb-form-api-token="API_TOKEN">
              <!-- Name input-->
              <div class="form-floating mb-3">
                <input id="name" class="form-control" type="text" placeholder="Enter your name..." data-sb-validations="required" />
                <label for="name">Full name</label>
                <div class="invalid-feedback" data-sb-feedback="name:required">A name is required.</div>
              </div>
              <!-- Email address input-->
              <div class="form-floating mb-3">
                <input id="email" class="form-control" type="email" placeholder="name@example.com" data-sb-validations="required,email" />
                <label for="email">Email address</label>
                <div class="invalid-feedback" data-sb-feedback="email:required">An email is required.</div>
                <div class="invalid-feedback" data-sb-feedback="email:email">Email is not valid.</div>
              </div>
              <!-- Phone number input-->
              <div class="form-floating mb-3">
                <input id="phone" class="form-control" type="tel" placeholder="(123) 456-7890" data-sb-validations="required" />
                <label for="phone">Phone number</label>
                <div class="invalid-feedback" data-sb-feedback="phone:required">A phone number is required.</div>
              </div>
              <!-- Message input-->
              <div class="form-floating mb-3">
                <textarea id="message" class="form-control" type="text" placeholder="Enter your message here..." style="height: 10rem;" data-sb-validations="required"></textarea>
                <label for="message">Message</label>
                <div class="invalid-feedback" data-sb-feedback="message:required">A message is required.</div>
              </div>
              <!-- Submit success message-->
              <!---->
              <!-- This is what your users will see when the form-->
              <!-- has successfully submitted-->
              <div id="submitSuccessMessage" class="d-none">
                <div class="text-center mb-3">
                  <div class="fw-bolder">Form submission successful!</div>
                </div>
              </div>
              <!-- Submit error message-->
              <!---->
              <!-- This is what your users will see when there is-->
              <!-- an error submitting the form-->
              <div id="submitErrorMessage" class="d-none"><div class="text-center text-danger mb-3">Error sending message!</div></div>
              <!-- Submit Button-->

              <div class="row">
                <div class="col-lg-12 text-center">
                  <button id="submitButton" class="btn btn-primary btn-xl disabled" type="submit">Send</button>
                  <button class="btn btn-secondary btn-xl ml-2" @click="toggleBusinessCard">Get Business Card</button>
                </div>
              </div>
            </form>

            <div v-if="businessCardShown" class="row">
              <div class="col-lg-12">
                <div class="row mb-4">
                  <div class="col-lg-12">
                    <b-card>
                      <b-card-body>
                        <h3>
                          Nurfirliana Muzanella
                        </h3>
                        <p class="lead">
                          Frontend Engineer
                        </p>

                        <hr />

                        <p class="lead">
                          <i class="fa fa-envelope" />
                          <span class="ml-2">
                            muzanella11@gmail.com
                          </span>
                        </p>

                        <p class="lead">
                          <i class="fa fa-phone" />
                          <span class="ml-2">
                            087867701092
                          </span>
                        </p>

                        <p class="lead">
                          <i class="fa fa-map-marker-alt" />
                          <span class="ml-2">
                            Griya Bukit Jaya. Blok M 11/27. Gunung Putri, Bogor
                          </span>
                        </p>
                      </b-card-body>
                    </b-card>
                  </div>
                </div>

                <div class="row">
                  <div class="col-lg-12 text-center">
                    <button class="btn btn-secondary btn-xl ml-2" @click="toggleBusinessCard">Send Message</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Portfolio Detail Modal -->
    <b-modal id="portfolioModal" class="portfolio-modal" size="xl" header-class="border-0" body-class="text-center pb-5" hide-footer>
      <template #modal-header="{ close }">
        <button class="btn-close" type="button" @click="close"></button>
      </template>

      <template #default>
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-8">
              <!-- Portfolio Modal - Title-->
              <h2 class="portfolio-modal-title text-secondary text-uppercase mb-0">
                {{ activePortfolio.title }}
              </h2>
              <!-- Icon Divider-->
              <div class="divider-custom">
                <div class="divider-custom-line"></div>
                <div class="divider-custom-icon"><i class="fas fa-star"></i></div>
                <div class="divider-custom-line"></div>
              </div>
              <!-- Portfolio Modal - Image-->
              <div
                v-for="(itemImage, indexImage) in activePortfolio.image"
                :key="indexImage"
                :style="{
                  background: `url(${itemImage ? itemImage : imageNotAvailable})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  width: '100%',
                  height: '400px'
                }"
                class="rounded mb-5" />

              <p class="mb-2">
                Year : {{ activePortfolio.year }}
              </p>

              <p class="mb-2">
                <template v-if="activePortfolio.url">
                  Link to app: <a class="btn-link" target="_blank" :href="activePortfolio.url">{{ activePortfolio.url }}</a>
                </template>

                <template v-else>
                  Internal app, no preview link available
                </template>
              </p>

              <p>
                Technologies :
                <b-badge
                  v-for="(itemTechnology, indexTechnology) in activePortfolio.technologies"
                  :key="indexTechnology"
                  variant="primary"
                  class="mr-2 mb-2"
                >
                  {{ itemTechnology }}
                </b-badge>
              </p>
              <!-- Portfolio Modal - Text-->
              <p class="mb-4">
                {{ activePortfolio.description }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
export default {
  data () {
    return {
      businessCardShown: false,
      activePortfolio: {},
      experiences: []
    }
  },

  computed: {
    imageNotAvailable () {
      return 'img/image-not-available.svg'
    },

    portfolioEntries () {
      const result = []
      this.experiences.forEach(item => {
        item.projects.forEach(itemProject => {
          result.push(itemProject)
        })
      })
      return result
    }
  },

  beforeMount () {
    this.fetchExperiences()
  },

  methods: {
    async fetchExperiences () {
      try {
        const experience = await this.$axios.$get(`${window.origin}/experience.json`)

        this.experiences = experience
      } catch (error) {
        console.error(error)
      }
    },

    toggleBusinessCard () {
      this.businessCardShown = !this.businessCardShown
    },

    togglePortfolioModal (value) {
      this.activePortfolio = value
    }
  }
}
</script>
