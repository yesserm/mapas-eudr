import type { CSSProperties } from 'react'
import type { TimelineEntry } from '../utils/dataLoader'

interface TimelineProps {
  entries: TimelineEntry[]
  selectedYear: number
  onYearChange: (year: number) => void
}

function Timeline({
  entries,
  selectedYear,
  onYearChange,
}: TimelineProps) {
  const firstYear = entries[0]?.year ?? selectedYear
  const lastYear = entries.at(-1)?.year ?? selectedYear
  const progress =
    lastYear === firstYear
      ? 0
      : ((selectedYear - firstYear) / (lastYear - firstYear)) * 100

  return (
    <div className="timeline-card">
      <div className="timeline-header">
        <div>
          <p className="eyebrow">Serie histórica</p>
          <h2>Línea de tiempo</h2>
        </div>
        <output htmlFor="year-slider">{selectedYear}</output>
      </div>

      <div className="slider-wrap">
        <input
          id="year-slider"
          type="range"
          min={firstYear}
          max={lastYear}
          step="1"
          value={selectedYear}
          aria-label="Seleccionar año"
          style={{ '--slider-progress': `${progress}%` } as CSSProperties}
          onChange={(event) => onYearChange(Number(event.target.value))}
        />
        <div className="year-labels" aria-hidden="true">
          {entries.map((entry) => (
            <span
              className={entry.year === selectedYear ? 'is-current' : ''}
              key={entry.year}
            >
              {entry.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Timeline
