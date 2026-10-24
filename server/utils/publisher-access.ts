import type { PublisherAccessDecision, PublisherEventSink } from '@nuxt4-layers/publisher/contracts'

// Publisher's access decisions until Authorisation is composed in slice 1c: nobody
// holds any permission, so every change (create, save, publish, moderate) and every
// draft preview is refused. Published documents need no permission to read.
export const publisherAccessPolicy: PublisherAccessDecision = {
  allows: async () => false,
}

// Nothing consumes Publisher's events yet (search, caches and notifications come
// later), so the relay is never run and events wait in Publisher's outbox.
export const publisherEventsUnconsumed: PublisherEventSink = {
  publish: async () => {},
}
