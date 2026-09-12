import type { Feature, FeatureCollection, Point } from 'geojson'
import desplazadosData from '../data/desplazados.json'
import reforestadosData from '../data/reforestados.json'
import riesgoData from '../data/riesgo.json'
import timelineData from '../data/timeline.json'

export type LayerId = 'desplazados' | 'reforestados' | 'riesgo'

export interface MapPointProperties {
  id: string
  departamento: string
  municipio: string
  year: number
  value: number
}

export type MapFeature = Feature<Point, MapPointProperties>
export type MapDataset = FeatureCollection<Point, MapPointProperties>

export interface TimelineEntry {
  year: number
  label: string
}

export interface LayerStats {
  total: number
  average: number
  maximum: number
  locations: number
}

const datasets: Record<LayerId, MapDataset> = {
  desplazados: desplazadosData as unknown as MapDataset,
  reforestados: reforestadosData as unknown as MapDataset,
  riesgo: riesgoData as unknown as MapDataset,
}

/** Returns the local GeoJSON collections. No network request is required. */
export function getAllDatasets(): Record<LayerId, MapDataset> {
  return datasets
}

/** Returns a new collection containing only the selected annual snapshot. */
export function filterDatasetByYear(
  dataset: MapDataset,
  year: number,
): MapDataset {
  return {
    ...dataset,
    features: dataset.features.filter(
      (feature) => feature.properties.year === year,
    ),
  }
}

export function getTimeline(): TimelineEntry[] {
  return timelineData as TimelineEntry[]
}

/** Produces the summary values consumed by the statistics cards. */
export function calculateLayerStats(dataset: MapDataset): LayerStats {
  const values = dataset.features.map((feature) => feature.properties.value)
  const total = values.reduce((sum, value) => sum + value, 0)

  return {
    total,
    average: values.length > 0 ? total / values.length : 0,
    maximum: values.length > 0 ? Math.max(...values) : 0,
    locations: values.length,
  }
}
