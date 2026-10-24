<script setup lang="ts">
const shell = useShell()
useHead({ title: () => shell.value.home.title })
</script>

<template>
  <!-- Sits against the header, as on the mock-up. -->
  <section
    class="-mx-4 -mt-6 border-b border-edge-primary-default bg-fill-primary-default px-4 py-10 text-center text-pen-primary-default sm:mx-0 lg:-mt-8 lg:py-12"
    aria-labelledby="home-heading"
  >
    <h1 id="home-heading" class="mx-auto mb-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{{ shell.home.heading }}</h1>
    <p class="mx-auto mb-6 max-w-2xl text-lg">{{ shell.home.intro }}</p>
    <div v-if="shell.home.actions.length" class="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <NuxtLink
        v-for="(action, index) in shell.home.actions"
        :key="action.to"
        :to="action.to"
        class="w-full rounded-control border px-6 py-2.5 font-medium no-underline sm:w-auto"
        :class="index === 0
          ? 'border-edge-accent-default bg-fill-accent-default text-pen-accent-default hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover'
          : 'border-edge-secondary-default bg-fill-secondary-default text-pen-secondary-default hover:border-edge-secondary-hover hover:bg-fill-secondary-hover hover:text-pen-secondary-hover'"
      >
        {{ action.label }}
      </NuxtLink>
    </div>
  </section>
</template>
