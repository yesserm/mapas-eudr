import type { LngLatBoundsLike } from 'maplibre-gl'
import type { LayerId } from './dataLoader'

export const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json'

export const NICARAGUA_VIEW = {
  center: [-85.05, 12.84] as [number, number],
  zoom: 6.35,
  minZoom: 5,
  maxZoom: 14,
  maxBounds: [
    [-88.2, 10.4],
    [-81.2, 15.4],
  ] as LngLatBoundsLike,
}

export interface LayerVisualConfig {
  label: string
  shortLabel: string
  description: string
  unit: string
  color: string
  radiusPixels: number
  intensity: number
  colorRange: [number, number, number, number][]
}

export const ALL_LAYER_IDS: LayerId[] = [
  'desplazados',
  'reforestados',
  'riesgo',
]

export const LAYER_CONFIG: Record<LayerId, LayerVisualConfig> = {
  desplazados: {
    label: 'Población desplazada',
    shortLabel: 'Desplazados',
    description: 'Movilidad humana asociada a eventos climáticos.',
    unit: 'personas',
    color: '#ef6a5b',
    radiusPixels: 95,
    intensity: 1.7,
    colorRange: [
      [255, 238, 220, 0],
      [253, 190, 143, 110],
      [244, 109, 93, 180],
      [190, 43, 59, 230],
      [105, 20, 45, 255],
    ],
  },
  reforestados: {
    label: 'Territorio reforestado',
    shortLabel: 'Reforestación',
    description: 'Hectáreas recuperadas mediante iniciativas locales.',
    unit: 'ha',
    color: '#34a878',
    radiusPixels: 88,
    intensity: 1.55,
    colorRange: [
      [230, 248, 227, 0],
      [163, 222, 176, 110],
      [70, 177, 126, 180],
      [22, 125, 91, 230],
      [8, 74, 66, 255],
    ],
  },
  riesgo: {
    label: 'Riesgo climático',
    shortLabel: 'Riesgo',
    description: 'Índice compuesto de exposición y vulnerabilidad.',
    unit: 'índice',
    color: '#7c68d6',
    radiusPixels: 105,
    intensity: 1.45,
    colorRange: [
      [239, 237, 255, 0],
      [194, 184, 241, 110],
      [126, 104, 214, 180],
      [82, 61, 164, 230],
      [42, 30, 98, 255],
    ],
  },
}
