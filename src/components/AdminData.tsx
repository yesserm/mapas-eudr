import { useMemo, useRef, useState, type FormEvent } from 'react'
import CoordinatePicker from './CoordinatePicker'
import type {
  LayerId,
  MapDataset,
  MapFeature,
  TimelineEntry,
} from '../utils/dataLoader'
import {
  downloadDataset,
  parseGeoJson,
  type DatasetState,
  type PointDraft,
} from '../utils/dataStore'
import { ALL_LAYER_IDS, LAYER_CONFIG, NICARAGUA_VIEW } from '../utils/mapConfig'

interface AdminDataProps {
  datasets: DatasetState
  timeline: TimelineEntry[]
  storageError: boolean
  onSavePoint: (draft: PointDraft) => void
  onDeletePoint: (layerId: LayerId, id: string) => void
  onImportDataset: (layerId: LayerId, dataset: MapDataset) => void
  onResetDatasets: () => void
}

interface PointForm {
  id?: string
  layerId: LayerId
  departamento: string
  municipio: string
  year: number
  value: string
  longitude: string
  latitude: string
}

const DEFAULT_COORDINATES = { longitude: -85.05, latitude: 12.84 }

function createEmptyForm(layerId: LayerId, year: number): PointForm {
  return {
    layerId,
    departamento: '',
    municipio: '',
    year,
    value: '',
    longitude: String(DEFAULT_COORDINATES.longitude),
    latitude: String(DEFAULT_COORDINATES.latitude),
  }
}

function AdminData({
  datasets,
  timeline,
  storageError,
  onSavePoint,
  onDeletePoint,
  onImportDataset,
  onResetDatasets,
}: AdminDataProps) {
  const initialYear = timeline.at(-1)?.year ?? 2024
  const [selectedLayer, setSelectedLayer] = useState<LayerId>('desplazados')
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<PointForm>(() =>
    createEmptyForm('desplazados', initialYear),
  )
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visibleFeatures = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es')

    return datasets[selectedLayer].features.filter((feature) => {
      const matchesYear = feature.properties.year === selectedYear
      const matchesSearch =
        normalizedSearch.length === 0 ||
        feature.properties.municipio
          .toLocaleLowerCase('es')
          .includes(normalizedSearch) ||
        feature.properties.departamento
          .toLocaleLowerCase('es')
          .includes(normalizedSearch)

      return matchesYear && matchesSearch
    })
  }, [datasets, search, selectedLayer, selectedYear])

  const updateForm = <Key extends keyof PointForm>(
    key: Key,
    value: PointForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFormError('')
  }

  const resetForm = (layerId = selectedLayer, year = selectedYear) => {
    setForm(createEmptyForm(layerId, year))
    setFormError('')
  }

  const validateForm = (): PointDraft | null => {
    const value = Number(form.value)
    const longitude = Number(form.longitude)
    const latitude = Number(form.latitude)
    const years = timeline.map((entry) => entry.year)

    if (!form.departamento.trim() || !form.municipio.trim()) {
      setFormError('Departamento y municipio son obligatorios.')
      return null
    }
    if (!years.includes(form.year)) {
      setFormError('Selecciona un año disponible en la línea de tiempo.')
      return null
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('El valor debe ser un número mayor que cero.')
      return null
    }
    if (form.layerId === 'riesgo' && value > 100) {
      setFormError('El índice de riesgo debe estar entre 1 y 100.')
      return null
    }
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -88.2 ||
      longitude > -81.2 ||
      latitude < 10.4 ||
      latitude > 15.4
    ) {
      setFormError('Las coordenadas deben ubicarse dentro del área de Nicaragua.')
      return null
    }

    return {
      id: form.id,
      layerId: form.layerId,
      departamento: form.departamento,
      municipio: form.municipio,
      year: form.year,
      value,
      longitude,
      latitude,
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const draft = validateForm()
    if (!draft) return

    onSavePoint(draft)
    setSelectedLayer(draft.layerId)
    setSelectedYear(draft.year)
    setNotice(draft.id ? 'Punto actualizado correctamente.' : 'Punto añadido correctamente.')
    resetForm(draft.layerId, draft.year)
  }

  const editFeature = (feature: MapFeature) => {
    setForm({
      id: feature.properties.id,
      layerId: selectedLayer,
      departamento: feature.properties.departamento,
      municipio: feature.properties.municipio,
      year: feature.properties.year,
      value: String(feature.properties.value),
      longitude: String(feature.geometry.coordinates[0]),
      latitude: String(feature.geometry.coordinates[1]),
    })
    setFormError('')
    setNotice('Editando el punto seleccionado.')
  }

  const deleteFeature = (feature: MapFeature) => {
    if (!window.confirm(`¿Eliminar el punto de ${feature.properties.municipio}?`)) {
      return
    }

    onDeletePoint(selectedLayer, feature.properties.id)
    if (form.id === feature.properties.id) resetForm()
    setNotice('Punto eliminado.')
  }

  const handleImport = async (file: File) => {
    try {
      const dataset = parseGeoJson(JSON.parse(await file.text()))
      if (
        selectedLayer === 'riesgo' &&
        dataset.features.some((feature) => feature.properties.value > 100)
      ) {
        throw new Error('Los índices de riesgo importados no pueden superar 100.')
      }
      if (
        !window.confirm(
          `La importación reemplazará los ${datasets[selectedLayer].features.length} puntos de ${LAYER_CONFIG[selectedLayer].shortLabel}. ¿Continuar?`,
        )
      ) {
        return
      }

      onImportDataset(selectedLayer, dataset)
      resetForm()
      setNotice(`${dataset.features.length} puntos importados correctamente.`)
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'No fue posible importar el archivo.',
      )
    }
  }

  const handleReset = () => {
    if (!window.confirm('¿Restaurar todos los datos simulados originales?')) return
    onResetDatasets()
    resetForm()
    setNotice('Datos de ejemplo restaurados.')
  }

  const mapCoordinates = {
    longitude: Number(form.longitude) || NICARAGUA_VIEW.center[0],
    latitude: Number(form.latitude) || NICARAGUA_VIEW.center[1],
  }

  return (
    <main className="admin-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Gestión local</p>
          <h2>Administración de puntos</h2>
          <p>Edita la simulación y observa los cambios inmediatamente en Explorar.</p>
        </div>
        <div className="admin-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json,.geojson"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImport(file)
              event.target.value = ''
            }}
          />
          <button type="button" className="button-secondary" onClick={() => fileInputRef.current?.click()}>
            Importar JSON
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => downloadDataset(selectedLayer, datasets[selectedLayer])}
          >
            Exportar capa
          </button>
          <button type="button" className="button-danger" onClick={handleReset}>
            Restaurar ejemplos
          </button>
        </div>
      </div>

      {(notice || storageError) && (
        <div className={storageError ? 'admin-notice admin-notice--error' : 'admin-notice'} role="status">
          {storageError
            ? 'El navegador no permitió guardar los cambios localmente.'
            : notice}
        </div>
      )}

      <div className="admin-grid">
        <section className="admin-card records-card">
          <div className="admin-card__header">
            <div>
              <p className="eyebrow">Inventario</p>
              <h3>Puntos registrados</h3>
            </div>
            <strong>{visibleFeatures.length}</strong>
          </div>

          <div className="record-filters">
            <select
              aria-label="Filtrar por capa"
              value={selectedLayer}
              onChange={(event) => {
                const layerId = event.target.value as LayerId
                setSelectedLayer(layerId)
                resetForm(layerId, selectedYear)
              }}
            >
              {ALL_LAYER_IDS.map((layerId) => (
                <option key={layerId} value={layerId}>{LAYER_CONFIG[layerId].shortLabel}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar por año"
              value={selectedYear}
              onChange={(event) => {
                const year = Number(event.target.value)
                setSelectedYear(year)
                resetForm(selectedLayer, year)
              }}
            >
              {timeline.map((entry) => (
                <option key={entry.year} value={entry.year}>{entry.label}</option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              placeholder="Buscar municipio…"
              aria-label="Buscar municipio o departamento"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="record-list">
            {visibleFeatures.length === 0 ? (
              <div className="record-empty">No hay puntos para este filtro.</div>
            ) : (
              visibleFeatures.map((feature) => (
                <article className={form.id === feature.properties.id ? 'record-row is-editing' : 'record-row'} key={feature.properties.id}>
                  <span className="record-color" style={{ backgroundColor: LAYER_CONFIG[selectedLayer].color }} />
                  <div>
                    <strong>{feature.properties.municipio}</strong>
                    <span>{feature.properties.departamento}</span>
                  </div>
                  <b>{feature.properties.value.toLocaleString('es-NI')}</b>
                  <div className="record-buttons">
                    <button type="button" onClick={() => editFeature(feature)}>Editar</button>
                    <button type="button" onClick={() => deleteFeature(feature)}>Eliminar</button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="admin-card editor-card">
          <div className="admin-card__header">
            <div>
              <p className="eyebrow">{form.id ? 'Edición' : 'Nuevo registro'}</p>
              <h3>{form.id ? 'Actualizar punto' : 'Añadir punto de calor'}</h3>
            </div>
            {form.id && <span className="editing-badge">Editando</span>}
          </div>

          <form className="point-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Capa</span>
                <select
                  value={form.layerId}
                  disabled={Boolean(form.id)}
                  onChange={(event) => updateForm('layerId', event.target.value as LayerId)}
                >
                  {ALL_LAYER_IDS.map((layerId) => (
                    <option key={layerId} value={layerId}>{LAYER_CONFIG[layerId].label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Año</span>
                <select value={form.year} onChange={(event) => updateForm('year', Number(event.target.value))}>
                  {timeline.map((entry) => (
                    <option key={entry.year} value={entry.year}>{entry.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Departamento</span>
                <input required value={form.departamento} placeholder="Ej. Matagalpa" onChange={(event) => updateForm('departamento', event.target.value)} />
              </label>
              <label>
                <span>Municipio</span>
                <input required value={form.municipio} placeholder="Ej. San Ramón" onChange={(event) => updateForm('municipio', event.target.value)} />
              </label>
              <label className="form-value">
                <span>Valor ({LAYER_CONFIG[form.layerId].unit})</span>
                <input type="number" min="1" max={form.layerId === 'riesgo' ? 100 : undefined} step="1" required value={form.value} placeholder="0" onChange={(event) => updateForm('value', event.target.value)} />
              </label>
              <label>
                <span>Longitud</span>
                <input type="number" min="-88.2" max="-81.2" step="0.00001" required value={form.longitude} onChange={(event) => updateForm('longitude', event.target.value)} />
              </label>
              <label>
                <span>Latitud</span>
                <input type="number" min="10.4" max="15.4" step="0.00001" required value={form.latitude} onChange={(event) => updateForm('latitude', event.target.value)} />
              </label>
            </div>

            <CoordinatePicker
              value={mapCoordinates}
              onChange={({ longitude, latitude }) => {
                setForm((current) => ({
                  ...current,
                  longitude: String(longitude),
                  latitude: String(latitude),
                }))
                setFormError('')
              }}
            />

            {formError && <p className="form-error" role="alert">{formError}</p>}

            <div className="form-actions">
              {form.id && (
                <button type="button" className="button-secondary" onClick={() => resetForm()}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="button-primary">
                {form.id ? 'Guardar cambios' : 'Añadir punto'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default AdminData
