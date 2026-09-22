type BrandPalette = {
  primary_color: string
  accent_color: string
}

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
}

function colorDistance(first: [number, number, number], second: [number, number, number]) {
  return Math.sqrt(
    (first[0] - second[0]) ** 2 +
    (first[1] - second[1]) ** 2 +
    (first[2] - second[2]) ** 2,
  )
}

export async function extractBrandColors(file: File): Promise<BrandPalette | null> {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null

    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const colors: Array<{ rgb: [number, number, number]; weight: number }> = []

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3] / 255
      if (alpha < 0.35) continue

      const red = Math.round(pixels[index] / 32) * 32
      const green = Math.round(pixels[index + 1] / 32) * 32
      const blue = Math.round(pixels[index + 2] / 32) * 32
      const brightness = (red + green + blue) / 3
      const saturation = Math.max(red, green, blue) - Math.min(red, green, blue)
      if (brightness > 246 || (brightness < 18 && saturation < 20)) continue

      const rgb: [number, number, number] = [red, green, blue]
      const existing = colors.find((item) => colorDistance(item.rgb, rgb) < 40)
      if (existing) existing.weight += alpha
      else colors.push({ rgb, weight: alpha })
    }

    if (!colors.length) return null
    colors.sort((first, second) => second.weight - first.weight)
    const primary = colors[0].rgb
    const accent = colors
      .slice(1)
      .sort((first, second) => colorDistance(second.rgb, primary) - colorDistance(first.rgb, primary))[0]?.rgb || primary

    return {
      primary_color: `#${toHex(primary[0])}${toHex(primary[1])}${toHex(primary[2])}`,
      accent_color: `#${toHex(accent[0])}${toHex(accent[1])}${toHex(accent[2])}`,
    }
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
