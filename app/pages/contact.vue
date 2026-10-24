<script setup lang="ts">
import { CONTACT_ROLES } from '~/composables/useSite'

// The Contact page: Publisher's page at /contact for its words, then the organisation
// and its contacts by role, from Configuration. A contact form waits for the enquiry
// capability.
const shell = useShell()
const site = useSite()
const { data, error } = await useContentPage('/contact')
if (error.value && error.value.statusCode !== 404) {
  throw createError({ statusCode: 503, statusMessage: 'Content unavailable', fatal: true })
}
const page = computed(() => (data.value?.kind === 'document' ? data.value.page : null))
const contacts = computed(() => CONTACT_ROLES
  .map(role => ({ role, label: shell.value.contact.roles[role], point: site.value.contacts[role] }))
  .filter(entry => entry.point))
const LINK = 'bg-fill-link-default text-pen-link-default underline hover:bg-fill-link-hover hover:text-pen-link-hover'

// Publisher's page names it; without one, the footer's link does.
const title = computed(() => page.value?.title ?? shell.value.footer.links.find(link => link.to === '/contact')?.label ?? '')
useHead({ title })
</script>

<template>
  <PageCard :title="title">
    <RichText v-for="field in page?.richText ?? []" :key="field.path" :nodes="field.nodes" :links="page!.links" class="mb-6" />

    <p v-if="site.organisation" class="mb-4">
      {{ shell.contact.organisation }} <strong>{{ site.organisation }}</strong>.
    </p>
    <dl class="mb-6 grid gap-4 sm:grid-cols-3">
      <div v-for="entry in contacts" :key="entry.role" class="rounded-card border border-edge-muted-default p-4">
        <dt class="mb-1 font-bold">{{ entry.label }}</dt>
        <dd v-if="entry.point!.email">
          <span class="sr-only">{{ shell.contact.email }}: </span>
          <a :href="`mailto:${entry.point!.email}`" :class="LINK" class="break-all">{{ entry.point!.email }}</a>
        </dd>
        <dd v-if="entry.point!.phone">
          {{ shell.contact.phone }}: <a :href="`tel:${entry.point!.phone}`" :class="LINK">{{ entry.point!.phone }}</a>
        </dd>
        <dd v-if="entry.point!.url">
          {{ shell.contact.web }}: <a :href="entry.point!.url" :class="LINK" class="break-all">{{ entry.point!.url }}</a>
        </dd>
      </div>
    </dl>
    <p v-if="site.contacts.security" class="text-sm">
      <a href="/.well-known/security.txt" :class="LINK">{{ shell.contact.securityTxt }}</a>
    </p>
  </PageCard>
</template>
