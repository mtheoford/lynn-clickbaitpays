"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { SIGNUP_METRICS, type SignupMetricKey, type SignupTrendPoint } from "@/lib/signup-analytics-report";
import "./signup-trends.css";

export type { SignupTrendPoint } from "@/lib/signup-analytics-report";

type SignupTrendsProps = {
  points: SignupTrendPoint[];
  interval: "day" | "month";
};

type Metric = (typeof SIGNUP_METRICS)[number];
const groups = [
  { key: "traffic", title: "Visitors and interest", description: "Browser visits, form opens and demo clicks." },
  { key: "checkout", title: "Signup and payment", description: "Follow progress from starting the form to an activated site." },
  { key: "issues", title: "Errors and unfinished checkouts", description: "Find validation problems, payment failures and sessions that expire unpaid." },
] as const;
const number = new Intl.NumberFormat("en-US");
const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const lineStyles = [undefined, "8 4", "2 4", "10 3 2 3", "5 3"];
const chartHeight = 238;
const padding = { top: 16, right: 20, bottom: 38, left: 52 };

function isCount(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function countLabel(value: number | null | undefined) {
  return isCount(value) ? number.format(value) : "Not tracked";
}

function SeriesChart({ points, interval, group, selectedIndex, onSelect }: SignupTrendsProps & {
  group: (typeof groups)[number];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hidden, setHidden] = useState<SignupMetricKey[]>([]);
  const metrics = SIGNUP_METRICS.filter((metric) => metric.group === group.key);
  const visible = metrics.filter((metric) => !hidden.includes(metric.key));
  const selectedPoint = points[selectedIndex];

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const updateWidth = () => setWidth(Math.max(280, Math.round(element.getBoundingClientRect().width)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  let maximum = 0;
  let observed = false;
  for (const point of points) {
    for (const metric of visible) {
      const value = point.values[metric.key];
      if (!isCount(value)) continue;
      observed = true;
      maximum = Math.max(maximum, value);
    }
  }
  const step = Math.max(1, Math.ceil(maximum / 4));
  const axisMaximum = step * 4;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const x = (index: number) => padding.left + (points.length > 1 ? index / (points.length - 1) : 0.5) * plotWidth;
  const y = (value: number) => padding.top + plotHeight - (value / axisMaximum) * plotHeight;
  const labelCount = Math.min(points.length, width < 520 ? 3 : 6);
  const labelIndices = Array.from(new Set(Array.from({ length: labelCount }, (_, index) =>
    labelCount === 1 ? 0 : Math.round(index * (points.length - 1) / (labelCount - 1)),
  )));

  function linePath(metric: Metric) {
    let path = "";
    let previousIsKnown = false;
    for (let index = 0; index < points.length; index++) {
      const value = points[index].values[metric.key];
      if (!isCount(value)) {
        previousIsKnown = false;
        continue;
      }
      path += `${previousIsKnown ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)} `;
      previousIsKnown = true;
    }
    return path;
  }

  function toggle(key: SignupMetricKey) {
    setHidden((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  return (
    <section className="signup-trend-card" aria-labelledby={`${id}-heading`}>
      <header className="signup-trend-heading">
        <div><h3 id={`${id}-heading`}>{group.title}</h3><p>{group.description}</p></div>
        <span>{interval === "month" ? "Monthly" : "Daily"} counts</span>
      </header>
      <div className="signup-trend-legend" role="group" aria-label={`${group.title}: visible series`}>
        {metrics.map((metric, index) => (
          <button key={metric.key} type="button" aria-pressed={!hidden.includes(metric.key)}
            onClick={() => toggle(metric.key)} title={metric.description}
            style={{ "--series-color": metric.color } as CSSProperties}>
            <svg width="23" height="10" viewBox="0 0 23 10" aria-hidden="true">
              <line x1="1" x2="22" y1="5" y2="5" stroke="currentColor" strokeWidth="2.5" strokeDasharray={lineStyles[index % lineStyles.length]} />
            </svg>
            {metric.label}
          </button>
        ))}
      </div>
      <div className="signup-trend-plot" ref={container}>
        {observed ? (
          <svg className="signup-trend-svg" viewBox={`0 0 ${width} ${chartHeight}`} role="img"
            aria-labelledby={`${id}-heading ${id}-chart-description`}>
            <desc id={`${id}-chart-description`}>
              {group.title}, {interval === "month" ? "monthly" : "daily"} counts. The vertical axis starts at zero.
              Missing observations are gaps. Use the date control or data table below for exact values.
            </desc>
            {Array.from({ length: 5 }, (_, index) => index * step).map((tick) => (
              <g key={tick}>
                <line className="signup-trend-grid" x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} />
                <text className="signup-trend-axis" x={padding.left - 10} y={y(tick) + 4} textAnchor="end">
                  {tick >= 10000 ? compactNumber.format(tick) : number.format(tick)}
                </text>
              </g>
            ))}
            {labelIndices.map((index) => (
              <text className="signup-trend-axis" key={points[index].key} x={x(index)} y={chartHeight - 10}
                textAnchor={index === 0 && points.length > 1 ? "start" : index === points.length - 1 && points.length > 1 ? "end" : "middle"}>
                {points[index].label}
              </text>
            ))}
            {selectedPoint ? <line className="signup-trend-selection" x1={x(selectedIndex)} x2={x(selectedIndex)}
              y1={padding.top} y2={padding.top + plotHeight} /> : null}
            {visible.map((metric) => {
              const styleIndex = metrics.findIndex((item) => item.key === metric.key);
              return (
                <g key={metric.key}>
                  <path d={linePath(metric)} fill="none" stroke={metric.color} strokeWidth="2.5"
                    strokeDasharray={lineStyles[styleIndex % lineStyles.length]} strokeLinejoin="round" />
                  {points.map((point, index) => {
                    const value = point.values[metric.key];
                    if (!isCount(value)) return null;
                    // Retain single observations, which have no connecting line.
                    const isolated = !isCount(points[index - 1]?.values[metric.key]) && !isCount(points[index + 1]?.values[metric.key]);
                    if (index !== selectedIndex && !isolated && points.length > 31) return null;
                    return <circle key={point.key} cx={x(index)} cy={y(value)} r={index === selectedIndex ? 4.5 : 2.5}
                      fill={metric.color} stroke="#0b1022" strokeWidth="1.5"><title>{point.label}: {metric.label}, {number.format(value)}</title></circle>;
                  })}
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="signup-trend-empty">{visible.length === 0 ? "Choose a series above to show it on the chart." : "No tracked observations in this period yet."}</p>
        )}
      </div>
      {selectedPoint ? (
        <div className="signup-trend-inspector">
          <div className="signup-trend-date-controls">
            <button type="button" onClick={() => onSelect(Math.max(0, selectedIndex - 1))} disabled={selectedIndex === 0}
              aria-label={`${group.title}: previous ${interval}`}>←</button>
            <label htmlFor={`${id}-date`}>Inspect {interval}<strong>{selectedPoint.label}</strong></label>
            <button type="button" onClick={() => onSelect(Math.min(points.length - 1, selectedIndex + 1))} disabled={selectedIndex === points.length - 1}
              aria-label={`${group.title}: next ${interval}`}>→</button>
          </div>
          <input id={`${id}-date`} type="range" min={0} max={Math.max(0, points.length - 1)} value={selectedIndex} step={1}
            disabled={points.length < 2} onChange={(event) => onSelect(Number(event.target.value))}
            aria-label={`${group.title}: inspect ${interval}`} aria-valuetext={selectedPoint.label} />
          <dl className="signup-trend-values" aria-live="polite" aria-atomic="true">
            {visible.map((metric) => <div key={metric.key}>
              <dt><span style={{ backgroundColor: metric.color }} aria-hidden="true" />{metric.label}</dt>
              <dd>{countLabel(selectedPoint.values[metric.key])}</dd>
            </div>)}
          </dl>
        </div>
      ) : null}
      <details className="signup-trend-data">
        <summary>View {group.title.toLowerCase()} data</summary>
        <div className="signup-trend-table-scroll" tabIndex={0} role="region" aria-label={`${group.title} data table`}>
          <table>
            <caption>{interval === "month" ? "Monthly" : "Daily"} counts. “Not tracked” means no reliable observation; it is not zero.</caption>
            <thead><tr><th scope="col">{interval === "month" ? "Month" : "Date"}</th>{metrics.map((metric) => <th key={metric.key} scope="col">{metric.label}</th>)}</tr></thead>
            <tbody>{points.map((point) => <tr key={point.key}>
              <th scope="row">{point.label}</th>{metrics.map((metric) => <td key={metric.key}>{countLabel(point.values[metric.key])}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
        <dl className="signup-trend-definitions">{metrics.map((metric) => <div key={metric.key}><dt>{metric.label}</dt><dd>{metric.description}</dd></div>)}</dl>
      </details>
    </section>
  );
}

export default function SignupTrends({ points, interval }: SignupTrendsProps) {
  const [selection, setSelection] = useState<{ window: string; index: number } | null>(null);
  const windowKey = `${interval}:${points[0]?.key ?? ""}:${points.at(-1)?.key ?? ""}`;
  const selectedIndex = selection?.window === windowKey
    ? Math.min(selection.index, Math.max(0, points.length - 1))
    : Math.max(0, points.length - 1);

  if (points.length === 0) {
    return <p className="signup-trend-empty">No signup activity is available for this period yet.</p>;
  }

  return (
    <div className="signup-trends">
      <p className="signup-trends-help">Select a legend item to hide or show it. Use the date controls to inspect the same period across charts. Gaps mean not tracked; zero means tracked with no events.</p>
      {groups.map((group) => <SeriesChart key={group.key} points={points} interval={interval} group={group}
        selectedIndex={selectedIndex} onSelect={(index) => setSelection({ window: windowKey, index })} />)}
    </div>
  );
}
