import type { CSSProperties } from 'react'
import type { LayerId } from '../utils/dataLoader'
import { ALL_LAYER_IDS, LAYER_CONFIG } from '../utils/mapConfig'

interface LayerMenuProps {
  activeLayers: Set<LayerId>
  onToggleLayer: (layerId: LayerId) => void
}

function LayerMenu({ activeLayers, onToggleLayer }: LayerMenuProps) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h3>Capas visibles</h3>
        <span>{activeLayers.size}/3</span>
      </div>

      <div className="layer-list">
        {ALL_LAYER_IDS.map((layerId) => {
          const config = LAYER_CONFIG[layerId]
          const isActive = activeLayers.has(layerId)

          return (
            <label className="layer-option" key={layerId}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => onToggleLayer(layerId)}
              />
              <span
                className="layer-swatch"
                style={{ '--layer-color': config.color } as CSSProperties}
                aria-hidden="true"
              />
              <span className="layer-copy">
                <strong>{config.shortLabel}</strong>
                <small>{config.description}</small>
              </span>
              <span className="toggle" aria-hidden="true">
                <span />
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

export default LayerMenu
