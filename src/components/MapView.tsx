import { useEffect, useRef, useState } from 'react'
import { HeatmapLayer } from '@deck.gl/aggregation-layers'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { Map, NavigationControl } from 'maplibre-gl'
import type { LayerId, MapDataset, MapFeature } from '../utils/dataLoader'
import {
  ALL_LAYER_IDS,
  LAYER_CONFIG,
  MAP_STYLE_URL,
  NICARAGUA_VIEW,
} from '../utils/mapConfig'

interface MapViewProps {
  activeLayers: Set<LayerId>
  datasets: Record<LayerId, MapDataset>
  selectedYear: number
}

function MapView({ activeLayers, datasets, selectedYear }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let hasLoaded = false
    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: NICARAGUA_VIEW.center,
      zoom: NICARAGUA_VIEW.zoom,
      minZoom: NICARAGUA_VIEW.minZoom,
      maxZoom: NICARAGUA_VIEW.maxZoom,
      maxBounds: NICARAGUA_VIEW.maxBounds,
      attributionControl: {},
    })
    const overlay = new MapboxOverlay({ interleaved: false, layers: [] })

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(overlay)

    map.on('load', () => {
      hasLoaded = true
      setIsReady(true)
      setMapError(false)
    })
    map.on('error', () => {
      if (!hasLoaded) setMapError(true)
    })

    overlayRef.current = overlay

    return () => {
      overlayRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    const heatmaps = ALL_LAYER_IDS.filter((layerId) =>
      activeLayers.has(layerId),
    ).map((layerId) => {
      const config = LAYER_CONFIG[layerId]

      return new HeatmapLayer<MapFeature>({
        id: `${layerId}-${selectedYear}`,
        data: datasets[layerId].features,
        getPosition: (feature) =>
          feature.geometry.coordinates as [number, number],
        getWeight: (feature) => feature.properties.value,
        radiusPixels: layerId === 'riesgo' ? 52 : 44,
        intensity: 1.2,
        threshold: 0.035,
        colorRange: config.colorRange,
      })
    })

    overlay.setProps({ layers: heatmaps })
  }, [activeLayers, datasets, selectedYear])

  return (
    <div className="map-card">
      <div className="map-overlay-heading">
        <div>
          <span className="map-kicker">Vista nacional</span>
          <strong>Nicaragua · {selectedYear}</strong>
        </div>
        <span className="map-status">
          <i /> {isReady ? 'Mapa activo' : 'Cargando mapa'}
        </span>
      </div>

      <div ref={containerRef} className="map-container" />

      {!isReady && !mapError && (
        <div className="map-message" role="status">
          <span className="loader" />
          Preparando visualización…
        </div>
      )}
      {mapError && !isReady && (
        <div className="map-message map-message--error" role="alert">
          <strong>No fue posible cargar el mapa base.</strong>
          <span>Comprueba la conexión e inténtalo de nuevo.</span>
        </div>
      )}

      <div className="map-legend" aria-label="Leyenda del mapa">
        <span>Baja concentración</span>
        <i />
        <span>Alta</span>
      </div>
    </div>
  )
}

export default MapView
