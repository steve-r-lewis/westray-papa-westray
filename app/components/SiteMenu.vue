<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const shell = useShell()
const route = useRoute()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const shared = ref(false)

// A native modal dialog gives focus trapping, Escape to close and an inert page behind it.
watch(open, (isOpen) => {
  if (!dialog.value) return
  if (isOpen && !dialog.value.open) dialog.value.showModal()
  if (!isOpen && dialog.value.open) dialog.value.close()
})

watch(() => route.fullPath, () => {
  open.value = false
})

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false
}

function containsCurrentPage(items: Array<{ to: string }>) {
  return items.some(item => item.to === route.path)
}

async function share() {
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: document.title, url }).catch(() => {})
    return
  }
  await navigator.clipboard?.writeText(url)
  shared.value = true
  setTimeout(() => (shared.value = false), 2000)
}
</script>

<template>
  <dialog
    id="site-menu"
    ref="dialog"
    class="site-menu"
    :aria-label="shell.labels.siteMenu"
    @close="open = false"
    @click="onBackdropClick"
  >
    <div class="menu-panel">
      <div class="menu-head">
        <NuxtLink to="/" class="menu-brand">
          <img :src="shell.site.logo.src" :alt="shell.site.logo.alt" width="48" height="48">
          <span>
            <span v-for="line in shell.site.nameLines" :key="line" class="menu-brand-line">{{ line }}</span>
          </span>
        </NuxtLink>
        <button type="button" class="menu-close" @click="open = false">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
          <span class="visually-hidden">{{ shell.labels.closeMenu }}</span>
        </button>
      </div>

      <nav class="menu-groups" :aria-label="shell.labels.siteMenu">
        <details
          v-for="group in shell.menu.groups"
          :key="group.label"
          class="menu-group"
          :open="containsCurrentPage(group.items)"
        >
          <summary>{{ group.label }}</summary>
          <ul>
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink :to="item.to">{{ item.label }}</NuxtLink>
            </li>
          </ul>
        </details>
      </nav>

      <div class="menu-foot">
        <button type="button" class="menu-share" @click="share">
          {{ shared ? shell.labels.linkCopied : shell.labels.share }}
        </button>
        <NuxtLink
          v-for="link in shell.menu.footer"
          :key="link.to"
          :to="link.to"
          class="menu-support"
          target="_blank"
        >
          <strong>{{ link.label }}</strong>
          <span v-if="link.description">{{ link.description }}</span>
        </NuxtLink>
      </div>
    </div>
  </dialog>
</template>
