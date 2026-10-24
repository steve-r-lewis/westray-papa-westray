<script setup lang="ts">
// A labelled choice for the account pages, in the theme's input role.
const model = defineModel<string>({ required: true })
defineProps<{ label: string, options: Array<{ value: string, label: string }> }>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="text-sm font-semibold">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      class="w-full rounded-control border border-edge-input-default bg-fill-input-default px-3 py-2 text-pen-input-default hover:border-edge-input-hover hover:bg-fill-input-hover hover:text-pen-input-hover"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </div>
</template>
