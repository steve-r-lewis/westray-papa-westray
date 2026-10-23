<script setup lang="ts">
const shell = useShell()
useHead({ title: () => shell.value.home.title })
</script>

<template>
  <section class="hero" aria-labelledby="home-heading">
    <h1 id="home-heading">{{ shell.home.heading }}</h1>
    <p>{{ shell.home.intro }}</p>
    <div v-if="shell.home.actions.length" class="hero-actions">
      <NuxtLink
        v-for="(action, index) in shell.home.actions"
        :key="action.to"
        :to="action.to"
        class="button"
        :class="index === 0 ? 'button-primary' : 'button-secondary'"
      >
        {{ action.label }}
      </NuxtLink>
    </div>
  </section>
</template>
