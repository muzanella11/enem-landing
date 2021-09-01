<template>
  <div class="l-default">
    <navigation />
    <masthead />
    <nuxt />
    <mastfooter />
    <copyright />
  </div>
</template>

<script>
import MixinsLayout from '~/mixins/mixin-layout'

export default {
  mixins: [
    MixinsLayout
  ]
}
</script>
