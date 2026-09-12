import type { FeatureCollection, Point } from 'geojson'
import {
  getAllDatasets,
  type LayerId,
  type MapDataset,
  type MapFeature,
} from './dataLoader'

export type DatasetState = Record<LayerId, MapDataset>

export interface PointDraft {
  id?: string
  layerId: LayerId
  departamento: string
  municipio: string
  year: number
  value: number
  longitude: number
  latitude: number
}

interface StoredDatasets {
  version: 2
  datasets: DatasetState
}

const STORAGE_KEY = 'nicaragua-map-datasets-v2'
const VALID_LAYERS: LayerId[] = ['desplazados', 'reforestados', 'riesgo']

function cloneDataset(dataset: MapDataset): MapDataset {
  return structuredClone(dataset)
}

export function getInitialDatasets(): DatasetState {
  const initial = getAllDatasets()

  return {
    desplazados: cloneDataset(initial.desplazados),
    reforestados: cloneDataset(initial.reforestados),
    riesgo: cloneDataset(initial.riesgo),
  }
}

function isValidFeature(value: unknown): value is MapFeature {
  if (!value || typeof value !== 'object') return false

  const feature = value as Partial<MapFeature>
  const coordinates = feature.geometry?.coordinates
  const properties = feature.properties

  return Boolean(
    feature.type === 'Feature' &&
      feature.geometry?.type === 'Point' &&
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      coordinates.every(Number.isFinite) &&
      coordinates[0] >= -88.2 &&
      coordinates[0] <= -81.2 &&
      coordinates[1] >= 10.4 &&
      coordinates[1] <= 15.4 &&
      properties &&
      typeof properties.id === 'string' &&
      typeof properties.departamento === 'string' &&
      typeof properties.municipio === 'string' &&
      Number.isInteger(properties.year) &&
      properties.year >= 2019 &&
      properties.year <= 2024 &&
      Number.isFinite(properties.value) &&
      properties.value > 0,
  )
}

export function parseGeoJson(value: unknown): MapDataset {
  if (!value || typeof value !== 'object') {
    throw new Error('El archivo no contiene un objeto JSON válido.')
  }

  const collection = value as Partial<FeatureCollection<Point>>
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw new Error('Se esperaba un FeatureCollection de GeoJSON.')
  }

  if (!collection.features.every(isValidFeature)) {
    throw new Error('Uno o más puntos tienen propiedades o coordenadas inválidas.')
  }

  const identifiers = collection.features.map(
    (feature) => (feature as MapFeature).properties.id,
  )
  if (new Set(identifiers).size !== identifiers.length) {
    throw new Error('El archivo contiene identificadores duplicados.')
  }

  return collection as MapDataset
}

function isDatasetState(value: unknown): value is DatasetState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DatasetState>

  try {
    return VALID_LAYERS.every((layerId) => {
      parseGeoJson(candidate[layerId])
      return true
    })
  } catch {
    return false
  }
}

export function loadStoredDatasets(): DatasetState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return getInitialDatasets()

    const stored = JSON.parse(serialized) as Partial<StoredDatasets>
    return stored.version === 2 && isDatasetState(stored.datasets)
      ? stored.datasets
      : getInitialDatasets()
  } catch {
    return getInitialDatasets()
  }
}

export function persistDatasets(datasets: DatasetState): boolean {
  try {
    const stored: StoredDatasets = { version: 2, datasets }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    return true
  } catch {
    return false
  }
}

export function upsertPoint(
  datasets: DatasetState,
  draft: PointDraft,
): DatasetState {
  const id = draft.id ?? crypto.randomUUID()
  const feature: MapFeature = {
    type: 'Feature',
    properties: {
      id,
      departamento: draft.departamento.trim(),
      municipio: draft.municipio.trim(),
      year: draft.year,
      value: draft.value,
    },
    geometry: {
      type: 'Point',
      coordinates: [draft.longitude, draft.latitude],
    },
  }
  const currentFeatures = datasets[draft.layerId].features
  const existingIndex = currentFeatures.findIndex(
    (item) => item.properties.id === id,
  )
  const features = [...currentFeatures]

  if (existingIndex >= 0) features[existingIndex] = feature
  else features.push(feature)

  return {
    ...datasets,
    [draft.layerId]: { ...datasets[draft.layerId], features },
  }
}

export function removePoint(
  datasets: DatasetState,
  layerId: LayerId,
  id: string,
): DatasetState {
  return {
    ...datasets,
    [layerId]: {
      ...datasets[layerId],
      features: datasets[layerId].features.filter(
        (feature) => feature.properties.id !== id,
      ),
    },
  }
}

export function replaceDataset(
  datasets: DatasetState,
  layerId: LayerId,
  dataset: MapDataset,
): DatasetState {
  return { ...datasets, [layerId]: cloneDataset(dataset) }
}

export function downloadDataset(layerId: LayerId, dataset: MapDataset) {
  const blob = new Blob([JSON.stringify(dataset, null, 2)], {
    type: 'application/geo+json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${layerId}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
