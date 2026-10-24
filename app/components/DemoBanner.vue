<script setup lang="ts">
// On every page of the pre-launch demonstration: says that everything is invented,
// when the real site launches, and that it starts empty.
const shell = useShell()
const site = useSite()
const date = computed(() => site.value.demo.launchDate
  ? formatDate(`${site.value.demo.launchDate}T12:00:00Z`, site.value.locale)
  : shell.value.labels.demoDateToBeAnnounced)
</script>

<template>
  <p
    role="note"
    class="m-0 border border-edge-warning-default bg-fill-warning-default px-4 py-3 text-center font-semibold text-pen-warning-default sm:rounded-card"
  >
    {{ shell.labels.demoBanner.replace('{date}', date) }}
  </p>
</template>
