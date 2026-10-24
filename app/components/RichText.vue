<script lang="ts">
import type { RichTextNode } from '@nuxt4-layers/rich-text'
import type { PropType, VNode, VNodeChild } from 'vue'
import { NuxtLink } from '#components'

// Draws a rich-text safe tree from Publisher. The tree holds no markup and no link
// but the format's, so nothing here ever writes HTML from content: every node
// becomes an element with Theme Manager's semantic classes, and text stays text.
// `doc:` links go to the address Publisher resolved for this answer, or are plain
// text while their document is not published; images appear only when the asset
// store knows them.

interface Links {
  documents: Record<string, string | null>
  assets: Record<string, { url: string, width?: number, height?: number } | null>
}

const LINK = 'bg-fill-link-default text-pen-link-default underline hover:bg-fill-link-hover hover:text-pen-link-hover'
const HEADING = ['', 'text-2xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base']
const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

export default defineComponent({
  name: 'RichText',
  props: {
    nodes: { type: Array as PropType<RichTextNode[]>, required: true },
    links: { type: Object as PropType<Links>, default: () => ({ documents: {}, assets: {} }) },
  },
  setup(props) {
    const link = (to: string, children: VNodeChild[]) =>
      /^\/(?!\/)/.test(to)
        ? h(NuxtLink, { to, class: LINK }, () => children)
        : h('a', { href: to, class: LINK, rel: 'noopener' }, children)

    function draw(node: RichTextNode, key: number): VNodeChild {
      const inner = () => ('children' in node ? node.children.map(draw) : [])
      switch (node.kind) {
        case 'text': return node.value
        case 'paragraph': return h('p', { key, class: 'mb-4 last:mb-0' }, inner())
        case 'heading': {
          // The page title is the h1, so content headings start at h2.
          const depth = Math.max(2, node.depth)
          return h(`h${depth}`, { key, class: `${HEADING[depth]} mb-3 mt-6 font-bold leading-tight first:mt-0` }, inner())
        }
        case 'strong': return h('strong', { key }, inner())
        case 'emphasis': return h('em', { key }, inner())
        case 'delete': return h('del', { key }, inner())
        case 'blockquote': return h('blockquote', { key, class: 'mb-4 border-l-4 border-edge-muted-default pl-4 italic' }, inner())
        case 'list': return h(node.ordered ? 'ol' : 'ul', {
          key,
          class: `mb-4 space-y-1 pl-6 ${node.ordered ? 'list-decimal' : 'list-disc'}`,
          start: node.ordered && node.start !== null && node.start !== 1 ? node.start : undefined,
        }, inner())
        case 'list-item': return h('li', { key }, inner())
        case 'code': return node.inline
          ? h('code', { key, class: 'rounded-control bg-fill-muted-default px-1 font-mono text-pen-muted-default' }, node.value)
          : h('pre', { key, class: 'mb-4 overflow-x-auto rounded-control bg-fill-muted-default p-3 text-pen-muted-default' }, [h('code', { class: 'font-mono' }, node.value)])
        case 'link': return link(node.href, inner())
        case 'document-link': {
          const to = props.links.documents[node.documentId]
          return to ? link(to, inner()) : h('span', { key }, inner())
        }
        case 'image': {
          const asset = props.links.assets[node.assetId]
          return asset ? h('img', { key, src: asset.url, alt: node.alt, width: asset.width, height: asset.height, class: 'mb-4 h-auto max-w-full rounded-control' }) : null
        }
        case 'table': return table(node, key)
        case 'break': return h('br', { key })
        case 'rule': return h('hr', { key, class: 'my-6 border-edge-muted-default' })
      }
    }

    // GitHub tables always have a header row: the first.
    function table(node: Extract<RichTextNode, { kind: 'table' }>, key: number): VNode {
      const cell = (tag: 'th' | 'td', nodes: RichTextNode[], index: number) => h(tag, {
        key: index,
        class: `border border-edge-muted-default px-3 py-1.5 ${ALIGN[node.align[index] ?? 'left']}`,
        scope: tag === 'th' ? 'col' : undefined,
      }, nodes.map(draw))
      const [head, ...body] = node.rows
      return h('div', { key, class: 'mb-4 overflow-x-auto' }, [h('table', { class: 'w-full border-collapse' }, [
        head ? h('thead', [h('tr', head.map((nodes, index) => cell('th', nodes, index)))]) : null,
        h('tbody', body.map((row, rowIndex) => h('tr', { key: rowIndex }, row.map((nodes, index) => cell('td', nodes, index))))),
      ])])
    }

    return () => h('div', { class: 'rich-text' }, props.nodes.map(draw))
  },
})
</script>
