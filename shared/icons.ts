// The icons shell data may name, drawn on a 24-unit grid with round 2-unit strokes.
// Inline and self-hosted: no icon font or third-party request.

export interface IconShape {
  paths: string[]
  circles?: Array<[cx: number, cy: number, r: number]>
}

export const icons = {
  'home': { paths: ['M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z'] },
  'info': { paths: ['M12 16v-4', 'M12 8h.01'], circles: [[12, 12, 9]] },
  'policy': { paths: ['M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z', 'm9 12 2 2 4-4'] },
  'mail': { paths: ['M3 5h18v14H3z', 'm3 7 9 6 9-6'] },
  'article': { paths: ['M4 4h13v16H6a2 2 0 0 1-2-2z', 'M17 8h3v10a2 2 0 0 1-2 2', 'M8 8h5', 'M8 12h5', 'M8 16h5'] },
  'blog': { paths: ['M4 20h4L19 9l-4-4L4 16z', 'm14 6 4 4'] },
  'calendar': { paths: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'] },
  'workshop': { paths: ['M14.7 6.3a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.7-7.7z', 'M5 3 3 5l4 4 2-2z'] },
  'trail': { paths: ['M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z'], circles: [[12, 9, 2.5]] },
  'users': { paths: ['M2 20c0-3.5 3-6 7-6s7 2.5 7 6', 'M16 4.5a3.5 3.5 0 0 1 0 7', 'M18 14c2.5.5 4 2.8 4 6'], circles: [[9, 8, 3.5]] },
  'committee': { paths: ['M3 10h18L12 4z', 'M6 10v10', 'M10 10v10', 'M14 10v10', 'M18 10v10', 'M3 20h18'] },
  'organisation': { paths: ['M4 21V5h10v16', 'M14 9h6v12', 'M7 9h1', 'M10 9h1', 'M7 13h1', 'M10 13h1', 'M7 17h1', 'M10 17h1', 'M2 21h20'] },
  'business': { paths: ['M3 8h18v12H3z', 'M8 8V5h8v3', 'M3 13h18'] },
  'market': { paths: ['M3 9 4.5 4h15L21 9z', 'M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0', 'M5 12v9h14v-9', 'M10 21v-5h4v5'] },
  'shop': { paths: ['M5 8h14l-1 13H6z', 'M9 8V6a3 3 0 0 1 6 0v2'] },
  'account': { paths: ['M4 21c0-4 3.6-7 8-7s8 3 8 7'], circles: [[12, 8, 4]] },
  'profile': { paths: ['M3 5h18v14H3z', 'M6 16c.5-1.5 1.7-2.5 3-2.5s2.5 1 3 2.5', 'M14 10h4', 'M14 14h4'], circles: [[9, 10.5, 2]] },
  'security': { paths: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'] },
  'share': { paths: ['m8.2 13.3 7.6 4.4', 'M15.8 6.3 8.2 10.7'], circles: [[18, 5, 2.5], [6, 12, 2.5], [18, 19, 2.5]] },
  'coffee': { paths: ['M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z', 'M16 11h2a2 2 0 0 1 0 4h-2', 'M8 3v3', 'M12 3v3'] },
  'github': { paths: ['M9 19c-4 1.5-4-2-6-2.5', 'M15 22v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6.2 0C6.6 2.8 5.6 3.1 5.6 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V22'] },
  'noticeboard': { paths: ['M4 4h16v13H4z', 'M8 21l4-4 4 4', 'M8 8h5', 'M8 12h8'] },
  'camera': { paths: ['M4 8h3l2-3h6l2 3h3v11H4z'], circles: [[12, 13, 3.5]] },
  'poll': { paths: ['M4 20h16', 'M7 16V10', 'M12 16V5', 'M17 16v-4'] },
  'menu': { paths: ['M3 6h18', 'M3 12h18', 'M3 18h18'] },
  'close': { paths: ['M6 6l12 12', 'M18 6 6 18'] },
  'chevron-down': { paths: ['m6 9 6 6 6-6'] },
  'sun': { paths: ['M12 2v2', 'M12 20v2', 'm4.9 4.9 1.4 1.4', 'm17.7 17.7 1.4 1.4', 'M2 12h2', 'M20 12h2', 'm4.9 19.1 1.4-1.4', 'm17.7 6.3 1.4-1.4'], circles: [[12, 12, 4]] },
  'moon': { paths: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'] },
  'monitor': { paths: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'] },
  'palette': { paths: ['M12 3a9 9 0 0 0 0 18c.8 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1a1.5 1.5 0 0 1 1.1-2.5H16a5 5 0 0 0 5-5c0-4.4-4-7.9-9-7.9z'], circles: [[7.5, 10.5, 1], [10.5, 7, 1], [15, 7.5, 1]] },
  'sign-in': { paths: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'm10 17 5-5-5-5', 'M15 12H3'] },
} satisfies Record<string, IconShape>

export type IconName = keyof typeof icons
export const iconNames = Object.keys(icons) as [IconName, ...IconName[]]
