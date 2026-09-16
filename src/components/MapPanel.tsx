import { geoMercator, geoPath, geoProjection } from 'd3-geo'
import { scaleQuantize } from 'd3-scale'
import { useMemo, useState } from 'react'
import type { FeatureCollection } from 'geojson'

type MapPanelProps = {
  title: string
  subtitle: string
  geography: FeatureCollection
  valueByCode: Map<string, { name: string; value: number }>
  codeKeys: string[]
  onSelect: (code: string) => void
  selectedCode?: string
  formatValue?: (value: number) => string
  direction?: 'higher-better' | 'higher-worse'
  projectionKind?: 'mercator' | 'peters'
  width?: number
  height?: number
}

const COLORS = ['#dbeafe', '#93c5fd', '#60a5fa', '#2563eb', '#1d4ed8']
const PETERS_STANDARD_PARALLEL = Math.PI / 4

// Cylindrical equal-area projection with the Peters standard parallel (45 degrees).
function petersRaw(lambda: number, phi: number): [number, number] {
  const scale = Math.cos(PETERS_STANDARD_PARALLEL)
  return [lambda * scale, Math.sin(phi) / scale]
}

function resolveCode(properties: Record<string, unknown>, codeKeys: string[]) {
  for (const key of codeKeys) {
    const value = properties[key]
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }
  return null
}

export function MapPanel({
  title,
  subtitle,
  geography,
  valueByCode,
  codeKeys,
  onSelect,
  selectedCode,
  formatValue = (value) => value.toFixed(1),
  direction = 'higher-better',
  projectionKind = 'mercator',
  width = 760,
  height = 420,
}: MapPanelProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const mapProjection = useMemo(() => {
    const next = projectionKind === 'peters' ? geoProjection(petersRaw) : geoMercator()
    next.fitSize([width, height], geography)
    return next
  }, [geography, height, projectionKind, width])

  const path = useMemo(() => geoPath(mapProjection), [mapProjection])
  const values = Array.from(valueByCode.values()).map((item) => item.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const scaleMin = Number.isFinite(minValue) ? minValue : 0
  const scaleMax = Number.isFinite(maxValue) ? maxValue : 1
  const colorScale = useMemo(() => {
    return scaleQuantize<string>()
      .domain([scaleMin, scaleMax])
      .range(COLORS)
  }, [scaleMax, scaleMin])
  const legendValues = [0, 0.25, 0.5, 0.75, 1].map(
    (step) => scaleMin + (scaleMax - scaleMin) * step,
  )
  const hoveredMetric = hoveredCode ? valueByCode.get(hoveredCode) : undefined

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
          {projectionKind === 'peters' && <p className="map__projection">Projeção Peters: áreas proporcionais.</p>}
        </div>
      </div>
      <svg className="map" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {geography.features.map((feature, index) => {
          const properties = (feature.properties ?? {}) as Record<string, unknown>
          const code = resolveCode(properties, codeKeys)
          const pathData = path(feature)

          if (!code || !pathData) {
            return null
          }

          const metric = valueByCode.get(code)
          const name =
            metric?.name ??
            (typeof properties.name === 'string' ? properties.name : `Área ${index + 1}`)

          return (
            <path
              key={`${code}-${index}`}
              d={pathData}
              className="map__feature"
              fill={metric ? colorScale(metric.value) : '#e2e8f0'}
              stroke={code === selectedCode ? '#fbbf24' : '#64748b'}
              strokeWidth={code === selectedCode ? 2 : 0.5}
              onClick={() => onSelect(code)}
              onMouseEnter={() => setHoveredCode(code)}
              onMouseLeave={() => setHoveredCode(null)}
              onFocus={() => setHoveredCode(code)}
              onBlur={() => setHoveredCode(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelect(code)
              }}
              role="button"
              tabIndex={0}
            >
              <title>{metric ? `${name}: ${metric.value.toFixed(1)}` : `${name}: sem dado`}</title>
            </path>
          )
        })}
      </svg>
      <p className="map__hover" aria-live="polite">
        {hoveredCode
          ? `${hoveredMetric?.name ?? 'Área sem identificação'}: ${hoveredMetric ? formatValue(hoveredMetric.value) : 'sem dado disponível'}`
          : 'Passe o cursor pelo mapa para consultar um território.'}
      </p>
      <div className="map__legend" aria-label="Escala de valores no mapa">
        <span>Sem dado</span>
        <div className="map__legend-scale">
          {COLORS.map((color) => <i key={color} style={{ background: color }} />)}
        </div>
        <span>{formatValue(legendValues[0])}</span>
        <span>{formatValue(legendValues[legendValues.length - 1])}</span>
      </div>
      <p className="map__legend-caption">
        Valores maiores indicam {direction === 'higher-worse' ? 'maior pressão ou vulnerabilidade' : 'maior acesso, proteção ou capacidade'}.
      </p>
    </section>
  )
}
