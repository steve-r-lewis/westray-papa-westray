export function robotsTxt(demo: boolean, origin: string): string {
  if (demo) return 'User-agent: *\nDisallow: /\n'
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
}
