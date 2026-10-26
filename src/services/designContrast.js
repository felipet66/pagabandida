// WCAG 2 relative luminance (sRGB). Shared by the review page and contrast checks.
export function rgb(value) {
  if (/^#[\da-f]{6}$/i.test(value)) return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
  const match = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!match) throw new Error("Cor inválida para medir contraste");
  return match[1].split(",").map(Number);
}

export function composite(foreground, background) {
  const color = Array.isArray(foreground) ? foreground : rgb(foreground);
  const base = Array.isArray(background) ? background : rgb(background);
  const alpha = color[3] ?? 1;
  return color.slice(0, 3).map((channel, index) => channel * alpha + base[index] * (1 - alpha));
}

export function luminance(value) {
  const channels = (Array.isArray(value) ? value : rgb(value)).slice(0, 3).map(channel => {
    const normalized = channel / 255;
    return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}

export function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (values[1] + .05) / (values[0] + .05);
}
