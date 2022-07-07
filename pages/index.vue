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
              <img v-lazy-load class="img-fluid" :src="itemPortfolio.image[0] ? itemPortfolio.image[0] : imageNotAvailable" alt="..." />
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
                v-lazy-load
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
      // portfolioEntries: [
      //   {
      //     title: 'Zonasea Ship Owner',
      //     image: 'img/portfolio/zonasea-ship-owner.png',
      //     url: 'https://ship.zonasea.com',
      //     year: '2021',
      //     description: 'Purpose of this application is to tracking vessel and find the cargo after user join as Ship Owner.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass',
      //       'Javascript',
      //       'Restful JSON API',
      //       'PHP (Laravel Framework)',
      //       'Node JS',
      //       'Vue JS',
      //       'Webpack',
      //       'Bootstrap',
      //       'MYSQL Database'
      //     ]
      //   },
      //   {
      //     title: 'Zonasea Cargo Owner',
      //     image: 'img/portfolio/zonasea-cargo-owner.png',
      //     url: 'https://cargo.zonasea.com',
      //     year: '2021',
      //     description: 'Purpose of this application is to tracking cargo and find the vessel for your cargo after user join as Cargo Owner.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass',
      //       'Javascript',
      //       'Restful JSON API',
      //       'PHP (Laravel Framework)',
      //       'Node JS',
      //       'Vue JS',
      //       'Webpack',
      //       'Bootstrap',
      //       'MYSQL Database'
      //     ]
      //   },
      //   {
      //     title: 'Zonasea Web',
      //     image: 'img/portfolio/zonasea-web.png',
      //     url: 'https://zonasea.com',
      //     year: '2021',
      //     description: 'Purpose of this application is a landing page of Zonasea.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass',
      //       'Javascript',
      //       'Restful JSON API',
      //       'PHP (Laravel Framework)',
      //       'Node JS',
      //       'Vue JS',
      //       'Webpack',
      //       'Bootstrap',
      //       'MYSQL Database'
      //     ]
      //   },
      //   {
      //     title: 'Zonasea Web Admin',
      //     image: 'img/portfolio/zonasea-web-admin.png',
      //     url: '',
      //     year: '2021',
      //     description: 'Purpose of this application is to manage all vessel data, vessel tracking, advertising, payment license.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass',
      //       'Javascript',
      //       'Restful JSON API',
      //       'PHP (Laravel Framework)',
      //       'Node JS',
      //       'Vue JS',
      //       'Webpack',
      //       'Vuesax',
      //       'MYSQL Database'
      //     ]
      //   },
      //   {
      //     title: '10Travlr',
      //     image: 'img/portfolio/10travlr.png',
      //     url: 'https://www.10travlr.com.au',
      //     year: '2018 - 2020',
      //     description: 'Purpose of this application is to create a one stop solution for travelers, starting from planning, ticketing or purchasing, and sharing.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass',
      //       'Javascript',
      //       'Restful JSON API',
      //       'PHP (Codeigniter Framework)',
      //       'Node JS',
      //       'Vue JS',
      //       'GraphQL',
      //       'Webpack',
      //       'C# (.Net Core)',
      //       'MYSQL Database',
      //       'JSON Web Token',
      //       'Kubernetes on AWS'
      //     ]
      //   },
      //   {
      //     title: 'Travlr Accounts',
      //     image: 'img/portfolio/travlr-accounts.png',
      //     url: 'https://accounts.travlr.com',
      //     year: '2018 - 2020',
      //     description: 'This is an SSO server created as single authentication server for many applications.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Node JS',
      //       'Vue JS',
      //       'GraphQL',
      //       'Webpack',
      //       'MYSQL Database',
      //       'JSON Web Token',
      //       'Kubernetes on AWS'
      //     ]
      //   },
      //   {
      //     title: 'Medigo Website',
      //     image: 'img/portfolio/medigo.png',
      //     url: 'https://medigo.id',
      //     year: '2018',
      //     description: 'Purpose of this application is to make EHR (Electronic Health Record) with sophisticated UI and UX.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Deployd',
      //       'Vue JS',
      //       'Laravel',
      //       'Webpack'
      //     ]
      //   },
      //   {
      //     title: 'Medigo Clinic Web Apps',
      //     image: '',
      //     url: '',
      //     year: '2018',
      //     description: 'Purpose of this application is to make EHR (Electronic Health Record) with sophisticated UI and UX.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Deployd',
      //       'Vue JS',
      //       'Vuetify',
      //       'MongoDB Database'
      //     ]
      //   },
      //   {
      //     title: 'Elevenia Mobile Web',
      //     image: 'img/portfolio/elevenia-mobile.png',
      //     url: 'https://m.elevenia.co.id',
      //     year: '2018',
      //     description: 'Purpose of this application is to make new and fresh layout for Elevenia Mobile Site (Ecommerce).',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Less',
      //       'JSP (Java Server Pages)',
      //       'Grunt',
      //       'Bower'
      //     ]
      //   },
      //   {
      //     title: 'Bawa Berkah Web (homepage)',
      //     image: '',
      //     url: 'https://www.bawaberkah.org',
      //     year: '2017',
      //     description: 'Purpose of this application is to make easier user see campaign donation, progress campaign donation and total campaign donation in Bawa Berkah under Dompet Dhuafa.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Laravel',
      //       'Vue JS',
      //       'Bootstrap',
      //       'Webpack'
      //     ]
      //   },
      //   {
      //     title: 'Bawa Berkah Web Admin (dashboard)',
      //     image: '',
      //     url: 'https://www.bawaberkah.org',
      //     year: '2017',
      //     description: 'Purpose of this application is to make easier user managing campaign donation in Bawa Berkah under Dompet Dhuafa.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Golang',
      //       'Vue JS',
      //       'Stylus',
      //       'Webpack'
      //     ]
      //   },
      //   {
      //     title: 'Flipbox Website',
      //     image: 'img/portfolio/flipbox.png',
      //     url: 'http://flipbox.co.id',
      //     year: '2017',
      //     description: 'Purpose of this application is to create website for Flipbox.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Wordpress',
      //       'Laravelmix'
      //     ]
      //   },
      //   {
      //     title: 'Dianta Website',
      //     image: 'img/portfolio/dianta.png',
      //     url: '',
      //     year: '2017',
      //     description: 'Purpose of this application is to create website for Dianta.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass Preprocessor',
      //       'Javascript',
      //       'Restful JSON API',
      //       'Wordpress',
      //       'Bootstrap'
      //     ]
      //   },
      //   {
      //     title: 'Adira B2B Wholesale',
      //     image: '',
      //     url: '',
      //     year: '2016',
      //     description: 'Purpose of this application is to create B2B application.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass Preprocessor',
      //       'Javascript',
      //       'Vue JS',
      //       'C# (ASP.NET Framework 4.5)',
      //       'Semantic UI'
      //     ]
      //   },
      //   {
      //     title: 'Antaran',
      //     image: 'img/portfolio/antaran.png',
      //     url: '',
      //     year: '2016',
      //     description: 'Purpose of this application is to create B2B application of Antaran.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass Preprocessor',
      //       'Javascript',
      //       'Vue JS',
      //       'Restful JSON API',
      //       'Semantic UI'
      //     ]
      //   },
      //   {
      //     title: 'Telkomsel Lentera',
      //     image: '',
      //     url: '',
      //     year: '2016',
      //     description: 'Purpose of this application is to create layout for Telkomsel Lentera.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass Preprocessor',
      //       'Javascript',
      //       'Jquery'
      //     ]
      //   },
      //   {
      //     title: 'Halonesia',
      //     image: 'img/portfolio/halonesia.png',
      //     url: '',
      //     year: '2016',
      //     description: 'Purpose of this application is to create a travel assistant using chat.',
      //     technologies: [
      //       'Laravel Framework',
      //       'Vue JS',
      //       'Pusher / Firebase',
      //       'Sass Preprocessor',
      //       'Bootstrap',
      //       'Queue and scheduler',
      //       'Mailing system',
      //       'Restful JSON API'
      //     ]
      //   },
      //   {
      //     title: 'Portal AHU',
      //     image: 'img/portfolio/portal-ahu.png',
      //     url: 'https://portal.ahu.go.id',
      //     year: '2016',
      //     description: 'Purpose of this application is to revamp the layout of Portal AHU.',
      //     technologies: [
      //       'HTML 5',
      //       'CSS 3',
      //       'Sass Preprocessor',
      //       'Yii Framework',
      //       'Javascript',
      //       'Jquery',
      //       'Bootstrap'
      //     ]
      //   },
      //   {
      //     title: 'SMARt (Sistem Monitoring Aktivitas Rutin) DJKN',
      //     image: 'img/portfolio/smart-djkn.png',
      //     url: '',
      //     year: '2015',
      //     description: 'Purpose of this application is to Permohonan Surat, Loket, SSO, and so on.',
      //     technologies: [
      //       'PHP (Yii and Codeigniter)',
      //       'Oracle DB 12c',
      //       'Elasticsearch',
      //       'Sass Preprocessor',
      //       'Bootstrap'
      //     ]
      //   },
      //   {
      //     title: 'Singgasana Hotel',
      //     image: 'img/portfolio/singgasana.png',
      //     url: 'https://www.singgasanahotels.com',
      //     year: '2015',
      //     description: 'Purpose of this application is to make easier user for checking availability of the rooms.',
      //     technologies: [
      //       'Yii Framework',
      //       'Sass Preprocessor',
      //       'Bootstrap'
      //     ]
      //   },
      //   {
      //     title: 'Famedoor',
      //     image: '',
      //     url: '',
      //     year: '2014',
      //     description: 'Purpose of this application is to make a new social media for artists and collectors to meet.',
      //     technologies: [
      //       'Codeigniter',
      //       'MYSQL Database'
      //     ]
      //   }
      // ],
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
        const experience = await this.$axios.$get('/experience.json')

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
