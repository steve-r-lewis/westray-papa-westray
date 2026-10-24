// Delivers the IAM members' outbox events to one another (server/utils/iam.ts), every
// minute (nuxt.config.ts). Access never waits for it: each member reads standing and
// memberships at every decision.
export default defineTask({
  meta: { name: 'iam:relay', description: 'Deliver the IAM members\' waiting events' },
  async run() {
    return { result: await relayIam() }
  },
})
