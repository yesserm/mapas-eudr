import { useMemo, useState } from 'react'
import AdminData from './components/AdminData'
import LayerMenu from './components/LayerMenu'
import MapView from './components/MapView'
import StatsPanel from './components/StatsPanel'
import Timeline from './components/Timeline'
import {
  filterDatasetByYear,
  getTimeline,
  type LayerId,
  type MapDataset,
} from './utils/dataLoader'
import {
  getInitialDatasets,
  loadStoredDatasets,
  persistDatasets,
  removePoint,
  replaceDataset,
  upsertPoint,
  type DatasetState,
  type PointDraft,
} from './utils/dataStore'
import { ALL_LAYER_IDS } from './utils/mapConfig'
import './App.css'

function App() {
  const timeline = getTimeline()
  const [view, setView] = useState<'explore' | 'admin'>('explore')
  const [datasets, setDatasets] = useState<DatasetState>(loadStoredDatasets)
  const [storageError, setStorageError] = useState(false)
  const [selectedYear, setSelectedYear] = useState(
    timeline.at(-1)?.year ?? new Date().getFullYear(),
  )
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(
    () => new Set(ALL_LAYER_IDS),
  )

  const filteredDatasets = useMemo(() => {
    return Object.fromEntries(
      ALL_LAYER_IDS.map((layerId) => [
        layerId,
        filterDatasetByYear(datasets[layerId], selectedYear),
      ]),
    ) as DatasetState
  }, [datasets, selectedYear])

  const updateDatasets = (nextDatasets: DatasetState) => {
    setDatasets(nextDatasets)
    setStorageError(!persistDatasets(nextDatasets))
  }

  const savePoint = (draft: PointDraft) => {
    updateDatasets(upsertPoint(datasets, draft))
  }

  const deletePoint = (layerId: LayerId, id: string) => {
    updateDatasets(removePoint(datasets, layerId, id))
  }

  const importDataset = (layerId: LayerId, dataset: MapDataset) => {
    updateDatasets(replaceDataset(datasets, layerId, dataset))
  }

  const resetDatasets = () => {
    updateDatasets(getInitialDatasets())
  }

  const toggleLayer = (layerId: LayerId) => {
    setActiveLayers((currentLayers) => {
      const nextLayers = new Set(currentLayers)

      if (nextLayers.has(layerId)) {
        nextLayers.delete(layerId)
      } else {
        nextLayers.add(layerId)
      }

      return nextLayers
    })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="brand-copy">
          <p className="eyebrow">Observatorio territorial</p>
          <h1>Nicaragua en datos</h1>
        </div>
        <nav className="view-tabs" aria-label="Secciones principales">
          <button
            type="button"
            className={view === 'explore' ? 'is-active' : ''}
            onClick={() => setView('explore')}
          >
            Explorar
          </button>
          <button
            type="button"
            className={view === 'admin' ? 'is-active' : ''}
            onClick={() => setView('admin')}
          >
            Administrar
          </button>
        </nav>
        <div className="data-badge">
          <span className="data-badge__dot" />
          Datos simulados
        </div>
      </header>

      {view === 'explore' ? (
      <main className="dashboard">
        <aside className="control-panel" aria-label="Controles del mapa">
          <div className="panel-intro">
            <p className="eyebrow">Explorador geográfico</p>
            <h2>Dinámicas del territorio</h2>
            <p>
              Compara indicadores ambientales y sociales a través del tiempo.
            </p>
          </div>

          <LayerMenu
            activeLayers={activeLayers}
            onToggleLayer={toggleLayer}
          />
          <StatsPanel
            activeLayers={activeLayers}
            datasets={filteredDatasets}
            selectedYear={selectedYear}
          />
        </aside>

        <section className="map-workspace" aria-label="Visualización geográfica">
          <MapView
            activeLayers={activeLayers}
            datasets={filteredDatasets}
            selectedYear={selectedYear}
          />
          <Timeline
            entries={timeline}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        </section>
      </main>
      ) : (
        <AdminData
          datasets={datasets}
          timeline={timeline}
          storageError={storageError}
          onSavePoint={savePoint}
          onDeletePoint={deletePoint}
          onImportDataset={importDataset}
          onResetDatasets={resetDatasets}
        />
      )}
    </div>
  )
}

export default App
