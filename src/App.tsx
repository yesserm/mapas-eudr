import { useMemo, useState } from 'react'
import LayerMenu from './components/LayerMenu'
import MapView from './components/MapView'
import StatsPanel from './components/StatsPanel'
import Timeline from './components/Timeline'
import {
  filterDatasetByYear,
  getAllDatasets,
  getTimeline,
  type LayerId,
} from './utils/dataLoader'
import { ALL_LAYER_IDS } from './utils/mapConfig'
import './App.css'

function App() {
  const timeline = getTimeline()
  const [selectedYear, setSelectedYear] = useState(
    timeline.at(-1)?.year ?? new Date().getFullYear(),
  )
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(
    () => new Set(ALL_LAYER_IDS),
  )

  const filteredDatasets = useMemo(() => {
    const datasets = getAllDatasets()

    return Object.fromEntries(
      ALL_LAYER_IDS.map((layerId) => [
        layerId,
        filterDatasetByYear(datasets[layerId], selectedYear),
      ]),
    ) as ReturnType<typeof getAllDatasets>
  }, [selectedYear])

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
        <div className="data-badge">
          <span className="data-badge__dot" />
          Datos simulados
        </div>
      </header>

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
    </div>
  )
}

export default App
