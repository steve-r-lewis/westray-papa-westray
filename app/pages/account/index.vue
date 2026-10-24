<script setup lang="ts">
import type { AccountErrorCode } from '#shared/account'

// The member's account, from Identity: its state, the groups they are in, and the
// changes only they may make (pausing and resuming it, closing it or keeping it). The
// changes that need a recent sign-in ask for the password first.
definePageMeta({ middleware: 'authenticated' })

const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const identity = useIdentity()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.overview.title })

const { data: me, refresh, error: loadError } = await useAsyncData('account:identity', () => identity.me())

const state = computed(() => me.value?.actor.identityState ?? null)
const groups = computed(() => {
  const personal = me.value?.actor.personalGroup?.groupId
  return (me.value?.groupNames ?? []).filter(group => group.groupId !== personal)
})

const busy = ref(false)
// Closing asks twice.
const closing = ref(false)
const error = ref<AccountErrorCode | null>(null)
const pending = shallowRef<(() => Promise<unknown>) | null>(null)

// Runs one of Identity's changes; a sign-in that is not recent enough asks for the
// password, then runs it again.
async function change(action: () => Promise<unknown>) {
  busy.value = true
  error.value = null
  try {
    await action()
    await refresh()
  }
  catch (failure) {
    const code = accountErrorCode(failure)
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
  if (action) await change(action)
}

async function signOut() {
  await auth.signOut()
  await navigateTo(routes.afterSignOut)
}
</script>

<template>
  <PageCard :title="words.overview.title">
    <div class="flex flex-col gap-4">
      <p>{{ words.overview.intro }}</p>
      <AccountError :code="loadError ? accountErrorCode(loadError) : error" />
      <ReauthenticateForm v-if="pending" @confirmed="reauthenticated" @cancel="pending = null" />

      <template v-if="me">
        <AccountSection :title="words.overview.status">
          <p class="font-semibold">{{ state ? words.overview.states[state] : '' }}</p>
          <p v-if="state === 'paused'">{{ words.overview.pausedIntro }}</p>
          <p v-if="state === 'closure-pending'">{{ words.overview.closing }}</p>
          <div>
            <AppButton variant="plain" type="button" @click="signOut">{{ words.overview.signOut }}</AppButton>
          </div>
        </AccountSection>

        <AccountSection :title="words.overview.groups">
          <ul v-if="groups.length > 0" class="list-disc pl-6">
            <li v-for="group in groups" :key="group.groupId">{{ group.name }}</li>
          </ul>
          <p v-else>{{ words.overview.noGroups }}</p>
        </AccountSection>

        <AccountSection v-if="state === 'active' || state === 'paused'" :title="words.overview.pauseTitle">
          <p>{{ words.overview.pauseIntro }}</p>
          <div>
            <AppButton v-if="state === 'active'" variant="plain" type="button" :busy="busy" @click="change(() => identity.pauseIdentity())">
              {{ words.overview.pause }}
            </AppButton>
            <AppButton v-else type="button" :busy="busy" @click="change(() => identity.resumeIdentity())">
              {{ words.overview.resume }}
            </AppButton>
          </div>
        </AccountSection>

        <AccountSection :title="words.overview.closeTitle">
          <p>{{ words.overview.closeIntro }}</p>
          <div>
            <AppButton v-if="state === 'closure-pending'" type="button" :busy="busy" @click="change(() => identity.cancelClosure())">
              {{ words.overview.cancelClose }}
            </AppButton>
            <AppButton v-else-if="closing" variant="error" type="button" :busy="busy" @click="change(() => identity.requestClosure())">
              {{ words.overview.closeConfirm }}
            </AppButton>
            <AppButton v-else variant="plain" type="button" @click="closing = true">
              {{ words.overview.close }}
            </AppButton>
          </div>
        </AccountSection>
      </template>
    </div>
  </PageCard>
</template>
