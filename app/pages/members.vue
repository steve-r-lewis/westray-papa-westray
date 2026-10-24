<script setup lang="ts">
import type { ContentPage } from '#shared/content'

// The members' area: the published members' notices, for signed-in members only.
// The server answers nobody else (server/api/members/notices.get.ts).
definePageMeta({ middleware: 'authenticated' })

const shell = useShell()
const site = useSite()
useHead({ title: () => shell.value.members.title })
const { data, error } = await useAsyncData('members:notices', () => useRequestFetch()<{ notices: ContentPage[] }>('/api/members/notices'))
</script>

<template>
  <PageCard :title="shell.members.title">
    <div class="flex flex-col gap-4">
      <p>{{ shell.members.intro }}</p>
      <AccountError :code="error ? accountErrorCode(error) : null" />
      <p v-if="data && data.notices.length === 0">{{ shell.members.empty }}</p>
      <AccountSection v-for="notice in data?.notices ?? []" :key="notice.id" :title="notice.title">
        <p v-if="notice.publishedAt" class="text-sm">
          {{ shell.labels.published }} <time :datetime="notice.publishedAt">{{ formatDate(notice.publishedAt, site.locale) }}</time>
        </p>
        <RichText v-for="field in notice.richText" :key="field.path" :nodes="field.nodes" :links="notice.links" />
      </AccountSection>
    </div>
  </PageCard>
</template>
