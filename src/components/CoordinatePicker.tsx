import { useEffect, useRef } from 'react'
import { Map, Marker, NavigationControl, type MapMouseEvent } from 'maplibre-gl'
import { MAP_STYLE_URL, NICARAGUA_VIEW } from '../utils/mapConfig'

export interface Coordinates {
  longitude: number
  latitude: number
}

interface CoordinatePickerProps {
  value: Coordinates
  onChange: (coordinates: Coordinates) => void
}

function roundCoordinate(value: number) {
  return Number(value.toFixed(5))
}

function CoordinatePicker({ value, onChange }: CoordinatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const initialValueRef = useRef(value)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [initialValueRef.current.longitude, initialValueRef.current.latitude],
      zoom: 6.5,
      minZoom: NICARAGUA_VIEW.minZoom,
      maxZoom: NICARAGUA_VIEW.maxZoom,
      maxBounds: NICARAGUA_VIEW.maxBounds,
      attributionControl: {},
    })
    const marker = new Marker({ color: '#174d3c', draggable: true })
      .setLngLat([
        initialValueRef.current.longitude,
        initialValueRef.current.latitude,
      ])
      .addTo(map)

    const emitCoordinates = (longitude: number, latitude: number) => {
      onChangeRef.current({
        longitude: roundCoordinate(longitude),
        latitude: roundCoordinate(latitude),
      })
    }
    const handleMapClick = (event: MapMouseEvent) => {
      marker.setLngLat(event.lngLat)
      emitCoordinates(event.lngLat.lng, event.lngLat.lat)
    }

    marker.on('dragend', () => {
      const position = marker.getLngLat()
      emitCoordinates(position.lng, position.lat)
    })
    map.on('click', handleMapClick)
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    mapRef.current = map
    markerRef.current = marker

    return () => {
      markerRef.current = null
      mapRef.current = null
      marker.remove()
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const nextPosition: [number, number] = [value.longitude, value.latitude]
    marker.setLngLat(nextPosition)
    if (!map.getBounds().contains(nextPosition)) {
      map.easeTo({ center: nextPosition, duration: 500 })
    }
  }, [value.latitude, value.longitude])

  return (
    <div className="coordinate-picker">
      <div ref={containerRef} className="coordinate-map" />
      <div className="coordinate-help">
        <span aria-hidden="true">＋</span>
        Haz clic en el mapa o arrastra el marcador
      </div>
    </div>
  )
}

export default CoordinatePicker
