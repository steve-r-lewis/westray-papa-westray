// Colour arithmetic for generating theme palettes: hex <-> OKLCH, and WCAG 2.2 contrast.
// OKLCH keeps perceived lightness when a hue changes, so a palette's state progression
// survives being moved to a new hue.

export interface Rgba { r: number, g: number, b: number, a: number }
export interface Oklch { l: number, c: number, h: number, a: number }

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i

export function parseHex(value: string): Rgba {
  const match = value.trim().match(HEX)
  if (!match) throw new TypeError(`Not a #rrggbb(aa) colour: ${value}`)
  const [r, g, b, a] = match.slice(1).map(part => (part === undefined ? 255 : Number.parseInt(part, 16)))
  return { r: r!, g: g!, b: b!, a: a! / 255 }
}

export function toHex({ r, g, b, a }: Rgba): string {
  const byte = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}${byte(a * 255)}`
}

const toLinear = (value: number) => {
  const v = value / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const fromLinear = (value: number) => 255 * (value <= 0.0031308 ? 12.92 * value : (1.055 * value ** (1 / 2.4)) - 0.055)

export function toOklch(colour: Rgba): Oklch {
  const [r, g, b] = [toLinear(colour.r), toLinear(colour.g), toLinear(colour.b)]
  const l = Math.cbrt((0.4122214708 * r) + (0.5363325363 * g) + (0.0514459929 * b))
  const m = Math.cbrt((0.2119034982 * r) + (0.6806995451 * g) + (0.1073969566 * b))
  const s = Math.cbrt((0.0883024619 * r) + (0.2817188376 * g) + (0.6299787005 * b))
  const L = (0.2104542553 * l) + (0.7936177850 * m) - (0.0040720468 * s)
  const A = (1.9779984951 * l) - (2.4285922050 * m) + (0.4505937099 * s)
  const B = (0.0259040371 * l) + (0.7827717662 * m) - (0.8086757660 * s)
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180 / Math.PI) + 360) % 360, a: colour.a }
}

function oklchToLinear({ l: L, c, h }: Oklch): [number, number, number] {
  const A = c * Math.cos(h * Math.PI / 180)
  const B = c * Math.sin(h * Math.PI / 180)
  const l = (L + (0.3963377774 * A) + (0.2158037573 * B)) ** 3
  const m = (L - (0.1055613458 * A) - (0.0638541728 * B)) ** 3
  const s = (L - (0.0894841775 * A) - (1.2914855480 * B)) ** 3
  return [
    (4.0767416621 * l) - (3.3077115913 * m) + (0.2309699292 * s),
    (-1.2684380046 * l) + (2.6097574011 * m) - (0.3413193965 * s),
    (-0.0041960863 * l) - (0.7034186147 * m) + (1.7076147010 * s),
  ]
}

const inGamut = (rgb: number[]) => rgb.every(v => v >= -0.0001 && v <= 1.0001)

/** Converts back to sRGB, reducing chroma until the colour fits the gamut. */
export function fromOklch(colour: Oklch): Rgba {
  let c = colour.c
  let rgb = oklchToLinear({ ...colour, c })
  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.002)
    rgb = oklchToLinear({ ...colour, c })
  }
  const [r, g, b] = rgb.map(v => fromLinear(Math.min(1, Math.max(0, v))))
  return { r: r!, g: g!, b: b!, a: colour.a }
}

function luminance({ r, g, b }: Rgba): number {
  return (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b))
}

/** WCAG 2.2 contrast; a translucent foreground is painted over the opaque background first. */
export function contrast(foreground: string, background: string): number {
  const top = parseHex(foreground)
  const bottom = parseHex(background)
  if (bottom.a !== 1) throw new TypeError(`Background must be opaque: ${background}`)
  const mix = (f: number, b: number) => Math.round((f * top.a) + (b * (1 - top.a)))
  const painted = { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 }
  const [first, second] = [luminance(painted), luminance(bottom)]
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}
