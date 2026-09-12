import {
  calculateLayerStats,
  type LayerId,
  type MapDataset,
} from '../utils/dataLoader'
import { ALL_LAYER_IDS, LAYER_CONFIG } from '../utils/mapConfig'

interface StatsPanelProps {
  activeLayers: Set<LayerId>
  datasets: Record<LayerId, MapDataset>
  selectedYear: number
}

const numberFormatter = new Intl.NumberFormat('es-NI', {
  maximumFractionDigits: 0,
})

function getRiskLabel(value: number) {
  if (value >= 75) return 'Muy alto'
  if (value >= 60) return 'Alto'
  if (value >= 40) return 'Moderado'
  return 'Bajo'
}

function StatsPanel({
  activeLayers,
  datasets,
  selectedYear,
}: StatsPanelProps) {
  const visibleLayers = ALL_LAYER_IDS.filter((layerId) =>
    activeLayers.has(layerId),
  )

  return (
    <section className="panel-section stats-section" aria-live="polite">
      <div className="section-heading">
        <h3>Resumen {selectedYear}</h3>
        <span>Anual</span>
      </div>

      {visibleLayers.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">○</span>
          <p>Activa una capa para consultar sus indicadores.</p>
        </div>
      ) : (
        <div className="stats-list">
          {visibleLayers.map((layerId) => {
            const config = LAYER_CONFIG[layerId]
            const stats = calculateLayerStats(datasets[layerId])
            const primaryValue =
              layerId === 'riesgo' ? stats.average : stats.total

            return (
              <article className="stat-card" key={layerId}>
                <div className="stat-card__topline">
                  <span
                    className="stat-dot"
                    style={{ backgroundColor: config.color }}
                  />
                  <span>{config.shortLabel}</span>
                  {layerId === 'riesgo' && (
                    <em>{getRiskLabel(stats.average)}</em>
                  )}
                </div>
                <strong className="stat-card__value">
                  {numberFormatter.format(primaryValue)}
                  <small>{config.unit}</small>
                </strong>
                <p>
                  {stats.locations} ubicaciones
                  <span>·</span>
                  Máx. {numberFormatter.format(stats.maximum)}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default StatsPanel
