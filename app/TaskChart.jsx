import React from "react";

const PALETTE = {
  light: { ink: "#241E33", slate: "#6E6580", line: "#E7E0F2", grid: "#EFE9F8", paper: "#FFFFFF", step: "#F8F5FC" },
  dark:  { ink: "#F3E9E0", slate: "#B0A096", line: "#3A2D25", grid: "#3A2D25", paper: "#241C17", step: "#191410" },
};

const font = { fontFamily: "Inter, system-ui, sans-serif", display: "block" };

function Legend({ items, p }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", margin: "2px 0 10px", fontSize: 12, color: p.slate }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: it.color, display: "inline-block" }} />{it.name}
        </span>
      ))}
    </div>
  );
}

function Title({ children, p }) {
  return <div style={{ fontSize: 14, fontWeight: 700, color: p.ink, marginBottom: 6, textAlign: "center" }}>{children}</div>;
}

function BarChart({ spec, p }) {
  const W = 640, plotTop = 60, baseY = 320, left = 55, right = 20;
  const plotW = W - left - right, plotH = baseY - plotTop;
  const groups = spec.groups.length, ns = spec.series.length;
  const gw = plotW / groups, areaW = gw * 0.72, gap = 4;
  const bw = (areaW - gap * (ns - 1)) / ns, off = (gw - areaW) / 2;
  const yMax = spec.yMax, steps = spec.ySteps || 7;
  const y = (v) => baseY - (v / yMax) * plotH;
  const grid = Array.from({ length: steps + 1 }, (_, i) => (yMax / steps) * i);
  return (
    <div>
      <Title p={p}>{spec.title}</Title>
      <Legend items={spec.series} p={p} />
      <svg viewBox={`0 0 ${W} 360`} width="100%" role="img" aria-label={spec.title} style={font}>
        {grid.map((v, i) => <line key={"g" + i} x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke={p.grid} />)}
        {grid.map((v, i) => <text key={"y" + i} x={left - 8} y={y(v) + 4} fontSize="11" fill={p.slate} textAnchor="end">{Math.round(v)}</text>)}
        {spec.groups.map((g, gi) => spec.series.map((s, si) => {
          const x = left + gi * gw + off + si * (bw + gap);
          return <rect key={gi + "-" + si} x={x} y={y(s.data[gi])} width={bw} height={baseY - y(s.data[gi])} fill={s.color} />;
        }))}
        <line x1={left} x2={W - right} y1={baseY} y2={baseY} stroke={p.ink} strokeWidth="1.5" />
        {spec.groups.map((g, gi) => <text key={"x" + gi} x={left + gi * gw + gw / 2} y={baseY + 18} fontSize="11" fill={p.ink} textAnchor="middle">{g}</text>)}
        {spec.yLabel && <text x={16} y={(plotTop + baseY) / 2} fontSize="11" fill={p.slate} transform={`rotate(-90 16 ${(plotTop + baseY) / 2})`} textAnchor="middle">{spec.yLabel}</text>}
      </svg>
    </div>
  );
}

function LineChart({ spec, p }) {
  const W = 640, plotTop = 60, baseY = 320, left = 55, right = 20;
  const plotW = W - left - right, plotH = baseY - plotTop;
  const yMax = spec.yMax, steps = spec.ySteps || 8;
  const xs = (i) => left + (i * plotW) / (spec.x.length - 1);
  const y = (v) => baseY - (v / yMax) * plotH;
  const grid = Array.from({ length: steps + 1 }, (_, i) => (yMax / steps) * i);
  return (
    <div>
      <Title p={p}>{spec.title}</Title>
      <Legend items={spec.series} p={p} />
      <svg viewBox={`0 0 ${W} 360`} width="100%" role="img" aria-label={spec.title} style={font}>
        {grid.map((v, i) => <line key={"g" + i} x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke={p.grid} />)}
        {grid.map((v, i) => <text key={"y" + i} x={left - 8} y={y(v) + 4} fontSize="11" fill={p.slate} textAnchor="end">{Math.round(v)}</text>)}
        {spec.series.map((s, si) => (
          <g key={si}>
            <polyline points={s.data.map((v, i) => `${xs(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {s.data.map((v, i) => <circle key={i} cx={xs(i)} cy={y(v)} r="3" fill={s.color} />)}
          </g>
        ))}
        <line x1={left} x2={W - right} y1={baseY} y2={baseY} stroke={p.ink} strokeWidth="1.5" />
        {spec.x.map((lb, i) => <text key={"x" + i} x={xs(i)} y={baseY + 18} fontSize="10" fill={p.ink} textAnchor="middle">{lb}</text>)}
        {spec.yLabel && <text x={16} y={(plotTop + baseY) / 2} fontSize="11" fill={p.slate} transform={`rotate(-90 16 ${(plotTop + baseY) / 2})`} textAnchor="middle">{spec.yLabel}</text>}
      </svg>
    </div>
  );
}

function arc(cx, cy, r, a0, a1) {
  const t0 = (a0 - 90) * Math.PI / 180, t1 = (a1 - 90) * Math.PI / 180;
  const x0 = cx + r * Math.cos(t0), y0 = cy + r * Math.sin(t0);
  const x1 = cx + r * Math.cos(t1), y1 = cy + r * Math.sin(t1);
  const large = (a1 - a0) > 180 ? 1 : 0;
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
}

function Pies({ spec, p }) {
  const W = 640, r = 80, cy = 150;
  const cxs = [W * 0.27, W * 0.73];
  const legend = spec.pies[0].slices.map((s) => ({ name: s.name, color: s.color }));
  return (
    <div>
      <Title p={p}>{spec.title}</Title>
      <Legend items={legend} p={p} />
      <svg viewBox={`0 0 ${W} 280`} width="100%" role="img" aria-label={spec.title} style={font}>
        {spec.pies.map((pie, pi) => {
          let acc = 0;
          return (
            <g key={pi}>
              {pie.slices.map((s, si) => {
                const a0 = acc / 100 * 360, a1 = (acc + s.v) / 100 * 360; acc += s.v;
                const mid = ((a0 + a1) / 2 - 90) * Math.PI / 180;
                return (
                  <g key={si}>
                    <path d={arc(cxs[pi], cy, r, a0, a1)} fill={s.color} stroke={p.paper} strokeWidth="1.5" />
                    {s.v >= 8 && <text x={cxs[pi] + r * 0.62 * Math.cos(mid)} y={cy + r * 0.62 * Math.sin(mid) + 4} fontSize="11" fill="#fff" fontWeight="700" textAnchor="middle">{s.v}%</text>}
                  </g>
                );
              })}
              <text x={cxs[pi]} y={cy + r + 28} fontSize="13" fontWeight="700" fill={p.ink} textAnchor="middle">{pie.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TableChart({ spec, p }) {
  return (
    <div>
      <Title p={p}>{spec.title}</Title>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, color: p.ink }}>
        <thead>
          <tr>{spec.columns.map((c, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "9px 12px", borderBottom: `2px solid ${p.ink}`, color: p.slate, fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {spec.rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ textAlign: ci === 0 ? "left" : "right", padding: "9px 12px", borderBottom: `1px solid ${p.line}`, fontWeight: ci === 0 ? 600 : 400 }}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessChart({ spec, p }) {
  return (
    <div>
      <Title p={p}>{spec.title}</Title>
      <div>
        {spec.steps.map((st, i) => (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: p.step, border: `1px solid ${p.line}`, borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: p.ink, color: p.paper, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, color: p.ink }}>{st}</span>
            </div>
            {i < spec.steps.length - 1 && <div style={{ textAlign: "center", color: p.slate, fontSize: 16, lineHeight: "20px" }}>↓</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function TaskChart({ spec, dark }) {
  if (!spec) return null;
  const p = dark ? PALETTE.dark : PALETTE.light;
  let inner = null;
  if (spec.kind === "bar") inner = <BarChart spec={spec} p={p} />;
  else if (spec.kind === "line") inner = <LineChart spec={spec} p={p} />;
  else if (spec.kind === "pies") inner = <Pies spec={spec} p={p} />;
  else if (spec.kind === "table") inner = <TableChart spec={spec} p={p} />;
  else if (spec.kind === "process") inner = <ProcessChart spec={spec} p={p} />;
  else return null;
  return (
    <div style={{ background: p.paper, border: `1px solid ${p.line}`, borderRadius: 12, padding: "14px 16px" }}>
      {inner}
    </div>
  );
}
