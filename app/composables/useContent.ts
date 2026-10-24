import type { ContentListing, ContentPage } from '#shared/content'

export type ContentResolution =
  | { kind: 'document', page: ContentPage }
  | { kind: 'redirect', to: string }

// What an address holds, from Publisher through server/api/content/resolve. Anything
// a reader may not see fails with 404, exactly as a missing page does.
export function useContentPage(path: string) {
  return useAsyncData(`content:${path}`, () => useRequestFetch()<ContentResolution>('/api/content/resolve', { query: { path } }))
}

// A section's published documents, as cards.
export function useSectionListing(section: string, limit?: number) {
  return useAsyncData(`listing:${section}:${limit ?? 'all'}`, () =>
    useRequestFetch()<ContentListing>('/api/content/listing', { query: { section, limit } }))
}
