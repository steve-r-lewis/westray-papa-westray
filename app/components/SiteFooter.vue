<script setup lang="ts">
const shell = useShell()
</script>

<template>
  <footer class="site-footer">
    <p class="copyright">{{ shell.footer.copyright }}</p>
    <nav v-if="shell.footer.links.length" :aria-label="shell.labels.footerNavigation">
      <ul>
        <li v-for="link in shell.footer.links" :key="link.to">
          <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
        </li>
      </ul>
    </nav>
  </footer>
</template>
