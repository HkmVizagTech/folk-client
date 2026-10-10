import React from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../../components/ui'
import { chartColors } from '../../staff-common/lib/chartTheme'

const ROW = 40

/** Horizontal bar chart in a card. `colors` cycles per bar; defaults to maroon. */
const BarChartCard = ({ title, description, data, colors = [chartColors.maroon], emptyText, unit = '' }) => (
  <Card data-reveal padded={false}>
    <Card.Header><div><Card.Title>{title}</Card.Title>{description && <Card.Description>{description}</Card.Description>}</div></Card.Header>
    <Card.Body>
      {data.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-ink-muted">{emptyText}</p>
      ) : (
        <>
          <div role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`} style={{ height: data.length * ROW + 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={10}>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={104}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.ink, fontSize: 13 }}
                  tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 14)}…` : v)}
                />
                <Tooltip
                  cursor={{ fill: chartColors.paper }}
                  formatter={(v) => [`${v}${unit}`, '']}
                  separator=""
                  contentStyle={{ borderRadius: 12, border: `1px solid ${chartColors.line}`, boxShadow: 'none', fontSize: 13 }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} label={{ position: 'right', fill: chartColors.muted, fontSize: 13 }} isAnimationActive>
                  {data.map((d, i) => <Cell key={d.label} fill={colors[i % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card.Body>
  </Card>
)

export default BarChartCard
