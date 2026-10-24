<script setup lang="ts">
// The members' side menu. It is drawn only for a signed-in member (see the layout)
// and grows as members' features arrive; its groups and links are shell data.
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
    class="site-menu m-0 h-full max-h-none w-[min(20rem,85vw)] max-w-none bg-fill-base-default p-0 text-pen-base-default shadow-xl"
    :aria-label="shell.labels.siteMenu"
    @close="open = false"
    @click="onBackdropClick"
  >
    <div class="flex h-full flex-col">
      <div class="flex items-center justify-between gap-3 border-b border-edge-base-default p-4">
        <NuxtLink to="/" class="flex items-center gap-3 font-semibold no-underline">
          <img :src="shell.site.logo.src" :alt="shell.site.logo.alt" width="48" height="48">
          <span>
            <span v-for="line in shell.site.nameLines" :key="line" class="block">{{ line }}</span>
          </span>
        </NuxtLink>
        <button
          type="button"
          class="rounded-control p-1 hover:bg-fill-base-hover hover:text-pen-base-hover"
          @click="open = false"
        >
          <AppIcon name="close" :size="24" />
          <span class="sr-only">{{ shell.labels.closeMenu }}</span>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-2" :aria-label="shell.labels.siteMenu">
        <details
          v-for="group in shell.menu.groups"
          :key="group.label"
          class="group"
          :open="containsCurrentPage(group.items) || shell.menu.groups.length === 1"
        >
          <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-fill-base-hover hover:text-pen-base-hover [&::-webkit-details-marker]:hidden">
            {{ group.label }}
            <AppIcon name="chevron-down" :size="18" class="transition-transform group-open:rotate-180" />
          </summary>
          <ul class="flex flex-col gap-0.5 px-2 pb-2">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-3 rounded-control bg-fill-link-default px-3 py-2 font-medium text-pen-link-default no-underline hover:bg-fill-link-hover hover:text-pen-link-hover aria-[current=page]:bg-fill-link-selected aria-[current=page]:text-pen-link-selected aria-[current=page]:font-semibold"
              >
                <AppIcon v-if="item.icon" :name="item.icon" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </details>
      </nav>

      <div class="flex flex-col gap-2 border-t border-edge-base-default p-3">
        <button
          type="button"
          class="flex items-center gap-3 rounded-control border border-edge-accent-default bg-fill-accent-default px-3 py-2 text-left font-medium text-pen-accent-default hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover"
          @click="share"
        >
          <AppIcon name="share" />
          <span aria-live="polite">{{ shared ? shell.labels.linkCopied : shell.labels.share }}</span>
        </button>
        <NuxtLink
          v-for="link in shell.menu.footer"
          :key="link.to"
          :to="link.to"
          target="_blank"
          class="flex items-center gap-3 rounded-control border border-edge-secondary-default bg-fill-secondary-default px-3 py-2 text-pen-secondary-default no-underline hover:border-edge-secondary-hover hover:bg-fill-secondary-hover hover:text-pen-secondary-hover"
        >
          <AppIcon v-if="link.icon" :name="link.icon" />
          <span class="flex flex-col">
            <strong>{{ link.label }}</strong>
            <span v-if="link.description" class="text-sm">{{ link.description }}</span>
          </span>
        </NuxtLink>
      </div>
    </div>
  </dialog>
</template>
