// The IAM members' maintenance (server/utils/iam.ts): expiries, delays, holds and
// retention, every ten minutes (nuxt.config.ts).
export default defineTask({
  meta: { name: 'iam:maintenance', description: 'Run the IAM members\' maintenance' },
  async run() {
    return { result: await maintainIam() }
  },
})
