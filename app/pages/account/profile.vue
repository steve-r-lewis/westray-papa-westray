<script setup lang="ts">
import type { DisclosureAudience, DisclosureSettings, DisplayNameSource, ProfileChanges, ProfileOwnView } from '@nuxt4-layers/profile/contracts'
import { PROFILE_FIELDS, type AccountErrorCode, type ProfileField } from '#shared/account'

// The member's own record in Profile: what they say about themselves and who may see
// each part. Profile encrypts it with the member's own key; nothing here is shown to
// anyone else.
definePageMeta({ middleware: 'authenticated' })

const shell = useShell()
const words = computed(() => shell.value.account)
const profile = useProfile()
useHead({ title: () => words.value.profile.title })

const AUDIENCES = ['nobody', 'group', 'tenant'] as const satisfies readonly DisclosureAudience[]
const DISPLAY_NAMES = ['name', 'preferred_username', 'given_name'] as const satisfies readonly DisplayNameSource[]
const INPUT: Record<ProfileField, { type: 'text' | 'email' | 'tel', autocomplete: string }> = {
  name: { type: 'text', autocomplete: 'name' },
  given_name: { type: 'text', autocomplete: 'given-name' },
  family_name: { type: 'text', autocomplete: 'family-name' },
  preferred_username: { type: 'text', autocomplete: 'nickname' },
  email: { type: 'email', autocomplete: 'email' },
  phone_number: { type: 'tel', autocomplete: 'tel' },
}

const { data: own, error: loadError } = await useAsyncData('account:profile', () => profile.me())

const values = reactive(Object.fromEntries(PROFILE_FIELDS.map(field => [field, ''])) as Record<ProfileField, string>)
const audiences = reactive(Object.fromEntries(PROFILE_FIELDS.map(field => [field, 'nobody'])) as Record<ProfileField, DisclosureAudience>)
const displayName = ref<DisplayNameSource>('name')
const anonymiseOnDeparture = ref(false)

function load(view: ProfileOwnView | null | undefined) {
  if (!view) return
  for (const field of PROFILE_FIELDS) {
    values[field] = view.attributes[field] ?? ''
    audiences[field] = view.settings.audiences[field]
  }
  displayName.value = view.settings.displayName
  anonymiseOnDeparture.value = view.settings.anonymiseOnDeparture
}
load(own.value)

const busy = ref(false)
const saved = ref(false)
const error = ref<AccountErrorCode | null>(null)
const pending = shallowRef<(() => Promise<void>) | null>(null)

async function run(action: () => Promise<void>) {
  busy.value = true
  error.value = null
  saved.value = false
  try {
    await action()
  }
  catch (failure) {
    const code = accountErrorCode(failure)
    // Profile asks for a recent sign-in before contact details change or leave.
    if (code === 'insufficient-assurance') pending.value = action
    else error.value = code
  }
  finally {
    busy.value = false
  }
}

async function reauthenticated() {
  const action = pending.value
  pending.value = null
  if (action) await run(action)
}

function save() {
  return run(async () => {
    let view = own.value!
    const changes: Record<string, string | null> = {}
    for (const field of PROFILE_FIELDS) {
      const value = values[field].trim()
      if (value !== (view.attributes[field] ?? '')) changes[field] = value === '' ? null : value
    }
    if (Object.keys(changes).length > 0) view = await profile.update(view.version, changes as ProfileChanges)
    const settings: DisclosureSettings = {
      audiences: { ...view.settings.audiences, ...audiences },
      displayName: displayName.value,
      anonymiseOnDeparture: anonymiseOnDeparture.value,
    }
    if (JSON.stringify(settings) !== JSON.stringify(view.settings)) view = await profile.setDisclosure(view.version, settings)
    own.value = view
    load(view)
    saved.value = true
  })
}

function download() {
  return run(async () => {
    const data = await profile.exportData()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    link.download = 'profile.json'
    link.click()
    URL.revokeObjectURL(link.href)
  })
}

const audienceOptions = computed(() => AUDIENCES.map(value => ({ value, label: words.value.profile.audiences[value] })))
const displayNameOptions = computed(() => DISPLAY_NAMES.map(value => ({ value, label: words.value.profile.displayNames[value] })))
const unconfirmed = (field: ProfileField) =>
  (field === 'email' && own.value?.attributes.email && !own.value.attributes.email_verified)
  || (field === 'phone_number' && own.value?.attributes.phone_number && !own.value.attributes.phone_number_verified)
</script>

<template>
  <PageCard :title="words.profile.title">
    <div class="flex flex-col gap-4">
      <p>{{ words.profile.intro }}</p>
      <AccountError :code="loadError ? accountErrorCode(loadError) : error" />
      <AppNotice v-if="saved" tone="success">{{ words.profile.saved }}</AppNotice>
      <ReauthenticateForm v-if="pending" @confirmed="reauthenticated" @cancel="pending = null" />

      <form v-if="own" class="flex flex-col gap-4" @submit.prevent="save">
        <AccountSection :title="words.profile.details">
          <div
            v-for="field in PROFILE_FIELDS"
            :key="field"
            class="grid gap-3 border-b border-edge-base-default pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[2fr_1fr] sm:items-start"
          >
            <AppField
              v-model="values[field]"
              :label="words.profile.attributes[field]"
              :type="INPUT[field].type"
              :autocomplete="INPUT[field].autocomplete"
              :hint="unconfirmed(field) ? words.profile.unconfirmed : undefined"
              :maxlength="field === 'email' ? 254 : 100"
            />
            <AppSelect v-model="audiences[field]" :label="`${words.profile.audience}: ${words.profile.attributes[field]}`" :options="audienceOptions" />
          </div>
        </AccountSection>

        <AccountSection :title="words.profile.displayName">
          <AppSelect v-model="displayName" :label="words.profile.displayName" :options="displayNameOptions" />
          <label class="flex items-center gap-2">
            <input v-model="anonymiseOnDeparture" type="checkbox" class="size-5 accent-current">
            {{ words.profile.anonymiseOnDeparture }}
          </label>
        </AccountSection>

        <div class="flex flex-wrap gap-2">
          <AppButton :busy="busy">{{ words.profile.save }}</AppButton>
          <AppButton variant="plain" type="button" :busy="busy" @click="download">{{ words.profile.download }}</AppButton>
        </div>
      </form>
    </div>
  </PageCard>
</template>
