const fit = (nbr: number) => {
    if (nbr > 100) return 100
    if (nbr < 0) return 0
    return Math.trunc(nbr)
}

export type ColorDefinition = {baseColor: string; offsetColor: string}

// TODO allow user to choose these parameters
export const generateColors = ({
    nOfColors,
    baseHue = 0,

    baseSat = 58,
    baseLight = 72,
    
    offsetSat = 65,
    offsetLight = 50,
}: {
    nOfColors: number
    baseHue?: number
    baseSat?: number
    offsetSat?: number
    baseLight?: number
    offsetLight?: number
}): ColorDefinition[] => {
    let bHue = Math.trunc(baseHue) % 360
    bHue = bHue < 0 ? 360 + bHue : bHue
    const hueDistance = 360 / nOfColors

    return Array.from(Array(nOfColors)).map((_, i) => {
        const hue = Math.trunc((hueDistance * i + bHue) % 360)
        return {
            baseColor: `hsl(${hue}, ${fit(baseSat)}%, ${fit(baseLight)}%)`,
            offsetColor: `hsl(${hue}, ${fit(offsetSat)}%, ${fit(offsetLight)}%)`,
        }
    })
}
