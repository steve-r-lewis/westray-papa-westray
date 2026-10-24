<script setup lang="ts">
// A labelled text field for the account pages, in the theme's input role. Its hint is
// read with it by screen readers.
const model = defineModel<string>({ required: true })
defineProps<{
  label: string
  type?: 'text' | 'email' | 'password' | 'tel'
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'email' | 'tel'
  hint?: string
  required?: boolean
  minlength?: number
  maxlength?: number
}>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="font-semibold">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :required="required"
      :minlength="minlength"
      :maxlength="maxlength"
      :aria-describedby="hint ? `${id}-hint` : undefined"
      class="w-full rounded-control border border-edge-input-default bg-fill-input-default px-3 py-2 text-pen-input-default hover:border-edge-input-hover hover:bg-fill-input-hover hover:text-pen-input-hover"
    >
    <p v-if="hint" :id="`${id}-hint`" class="text-sm">{{ hint }}</p>
  </div>
</template>
