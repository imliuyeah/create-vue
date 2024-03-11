<template>
  <svg :class="svgClass" aria-hidden="true">
    <use :xlink:href="name"></use>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconTypes } from '@type/icon'

const { className, iconName } = defineProps<IconTypes>()

const name = computed(() => `#icon-${iconName}`)

const svgClass = computed(() => {
  if (className) {
    return `svg-icon ${className}`
  }
  return 'svg-icon'
})
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 20px;
  height: 20px;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover !important;
  display: inline-block;
}
</style>
