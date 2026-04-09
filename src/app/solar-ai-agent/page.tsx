"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ================================================================
   Types
   ================================================================ */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  csvFile?: { name: string; summary: string };
  forecastTrigger?: boolean;
  forecastResults?: ForecastResults | null;
}

interface ForecastParams {
  region: string;
  environment: string;
  latitude: number;
  longitude: number;
  penaltyThreshold: number;
  penaltyRate: number;
  guaranteedSTC: number;
  contractDuration: number;
  power: number;
  panelCount: number;
  solarHours: number;
  electricityPrice: number;
  cleaningCost: number;
  cleaningDuration: number;
  cleaningEfficiency: number;
  triggerThreshold: number;
  pm10: number;
  dust: number;
  humidity: number;
  windSpeed: number;
  dryDays: number;
}

interface MonthlyRow {
  month: string;
  dryDays: number;
  pm10: number;
  y2Avg: number;
  y2Max: number;
  lossKwh: number;
  lossPercent: number;
  penalty: number;
  missions: number;
  status: string;
}

interface ForecastResults {
  kalmanResults: {
    monthlyData: MonthlyRow[];
    summary: {
      totalMissions: number;
      frequencyStatus: string;
      maxSoilingY2: number;
      cumulativeKalman: number;
      annualLossKwh: number;
      annualLossPercent: number;
      netBalance: number;
      isCleaningProfitable: boolean;
      totalCleaningCost: number;
      totalPenaltiesAvoided: number;
      revenueLost: number;
    };
    kalmanModel: {
      phi: number;
      theta: number;
      r2: number;
      rmse: number;
      mae: number;
      observations: number;
      productionEquation: string;
      soilingEquation: string;
    };
  };
  timeGPTForecast: unknown;
  aiInsights: string;
  params: ForecastParams;
}

/* ================================================================
   Defaults
   ================================================================ */
const defaultParams: ForecastParams = {
  region: "Sfax",
  environment: "Urbain / Industriel",
  latitude: 34.74,
  longitude: 10.76,
  penaltyThreshold: 5.0,
  penaltyRate: 120.0,
  guaranteedSTC: 95,
  contractDuration: 5,
  power: 100,
  panelCount: 250,
  solarHours: 7.2,
  electricityPrice: 0.19,
  cleaningCost: 850,
  cleaningDuration: 4,
  cleaningEfficiency: 90,
  triggerThreshold: 4.0,
  pm10: 20.1,
  dust: 7.9,
  humidity: 67.0,
  windSpeed: 2.3,
  dryDays: 25.2,
};

const REGIONS = ["Sfax", "Tunis", "Sousse", "Gabes", "Tozeur", "Tataouine", "Bizerte", "Kairouan"];
const ENVIRONMENTS = ["Urbain / Industriel", "Rural / Agricole", "Cotier", "Desertique / Saharien"];

/* ================================================================
   SVG Soiling Chart (D3-style, pure SVG)
   ================================================================ */
function SoilingChart({ data }: { data: MonthlyRow[] }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || !data.length) return;
    const W = 700, H = 280;
    const m = { t: 24, r: 24, b: 36, l: 48 };
    const iW = W - m.l - m.r, iH = H - m.t - m.b;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${m.l},${m.t})`);
    svg.appendChild(g);

    const maxV = Math.max(...data.map(d => d.y2Max), 0.5);
    const xS = (i: number) => (i / (data.length - 1 || 1)) * iW;
    const yS = (v: number) => iH - (v / maxV) * iH;

    // grid
    for (let i = 0; i <= 4; i++) {
      const y = (iH / 4) * i;
      const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
      Object.entries({ x1: "0", y1: `${y}`, x2: `${iW}`, y2: `${y}`, stroke: "rgba(255,255,255,0.06)" }).forEach(([k, v]) => l.setAttribute(k, v));
      g.appendChild(l);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      Object.entries({ x: "-6", y: `${y + 3}`, "text-anchor": "end", fill: "rgba(255,255,255,0.35)", "font-size": "9" }).forEach(([k, v]) => t.setAttribute(k, v));
      t.textContent = (maxV - (maxV / 4) * i).toFixed(1) + "%";
      g.appendChild(t);
    }

    // area
    const aP = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(i)},${yS(d.y2Max)}`).join(" ");
    const bP = [...data].reverse().map((d, i) => `L${xS(data.length - 1 - i)},${yS(d.y2Avg)}`).join(" ");
    const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
    area.setAttribute("d", aP + " " + bP + " Z");
    area.setAttribute("fill", "rgba(47,93,80,0.18)");
    g.appendChild(area);

    // avg line
    const avgP = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(i)},${yS(d.y2Avg)}`).join(" ");
    const avgL = document.createElementNS("http://www.w3.org/2000/svg", "path");
    Object.entries({ d: avgP, stroke: "#2F5D50", "stroke-width": "2.5", fill: "none" }).forEach(([k, v]) => avgL.setAttribute(k, v));
    g.appendChild(avgL);

    // max line
    const maxP = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(i)},${yS(d.y2Max)}`).join(" ");
    const maxL = document.createElementNS("http://www.w3.org/2000/svg", "path");
    Object.entries({ d: maxP, stroke: "#C48C56", "stroke-width": "1.5", "stroke-dasharray": "4,3", fill: "none" }).forEach(([k, v]) => maxL.setAttribute(k, v));
    g.appendChild(maxL);

    data.forEach((d, i) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const col = d.status === "NORMAL" ? "#2F5D50" : d.status === "ATTENTION" ? "#C48C56" : "#e74c3c";
      Object.entries({ cx: `${xS(i)}`, cy: `${yS(d.y2Avg)}`, r: d.status === "NORMAL" ? "3" : "5", fill: col, stroke: "rgba(0,0,0,0.3)", "stroke-width": "1" }).forEach(([k, v]) => c.setAttribute(k, v));
      g.appendChild(c);

      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      Object.entries({ x: `${xS(i)}`, y: `${iH + 18}`, "text-anchor": "middle", fill: "rgba(255,255,255,0.5)", "font-size": "9" }).forEach(([k, v]) => t.setAttribute(k, v));
      t.textContent = d.month;
      g.appendChild(t);
    });
  }, [data]);

  return <svg ref={ref} className="w-full" style={{ height: 280 }} preserveAspectRatio="xMidYMid meet" />;
}

/* ================================================================
   Production Loss Bar Chart
   ================================================================ */
function LossBarChart({ data }: { data: MonthlyRow[] }) {
  const maxLoss = Math.max(...data.map(d => d.lossKwh), 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(d.lossKwh / maxLoss) * 120}px`,
              backgroundColor: d.status === "NORMAL" ? "#2F5D50" : d.status === "ATTENTION" ? "#C48C56" : "#e74c3c",
              opacity: 0.8,
            }}
          />
          <span className="text-[8px] text-white/40">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   Forecast Form (inline in chat)
   ================================================================ */
function ForecastForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: ForecastParams) => void;
  loading: boolean;
}) {
  const [params, setParams] = useState<ForecastParams>({ ...defaultParams });

  const update = (key: keyof ForecastParams, value: string | number) => {
    setParams((p) => ({ ...p, [key]: value }));
  };

  const numField = (label: string, key: keyof ForecastParams, unit?: string) => (
    <div className="space-y-1">
      <label className="text-[11px] text-white/50 uppercase tracking-wider">{label}</label>
      <input
        type="number"
        step="any"
        value={params[key] as number}
        onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#2F5D50] focus:outline-none transition-colors"
      />
      {unit && <span className="text-[9px] text-white/30">{unit}</span>}
    </div>
  );

  return (
    <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 space-y-6 animate-fadeIn">
      {/* LOCALISATION */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#C48C56] uppercase tracking-widest flex items-center gap-2">
          <span className="text-red-400">&#128205;</span> Localisation
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] text-white/50 uppercase tracking-wider">Region</label>
            <select
              value={params.region}
              onChange={(e) => update("region", e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C48C56] focus:outline-none"
            >
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/50 uppercase tracking-wider">Environnement</label>
            <select
              value={params.environment}
              onChange={(e) => update("environment", e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#C48C56] focus:outline-none"
            >
              {ENVIRONMENTS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {numField("Latitude", "latitude")}
          {numField("Longitude", "longitude")}
        </div>
      </div>

      {/* CONTRAT & PENALITES */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#C48C56] uppercase tracking-widest flex items-center gap-2">
          <span className="text-yellow-500">&#9888;</span> Contrat &amp; Penalites
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {numField("Seuil penalite (% perte rendement)", "penaltyThreshold")}
          {numField("Penalite (DT/kWc/an)", "penaltyRate")}
          {numField("Rendement garanti STC (%)", "guaranteedSTC")}
          {numField("Duree contrat (ans)", "contractDuration")}
        </div>
      </div>

      {/* PARAMETRES TECHNIQUES */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#C48C56] uppercase tracking-widest flex items-center gap-2">
          <span className="text-yellow-400">&#9889;</span> Parametres Techniques
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {numField("Puissance (kWc)", "power")}
          {numField("Nb panneaux", "panelCount")}
          {numField("Heures solaires / jour", "solarHours")}
          {numField("Prix electricite (DT/kWh)", "electricityPrice")}
        </div>
      </div>

      {/* PARAMETRES DE NETTOYAGE */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#C48C56] uppercase tracking-widest flex items-center gap-2">
          <span className="text-orange-400">&#128295;</span> Parametres de Nettoyage
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {numField("Cout / mission (DT)", "cleaningCost")}
          {numField("Duree mission (h)", "cleaningDuration")}
          {numField("Efficacite nettoyage (%)", "cleaningEfficiency")}
          {numField("Seuil declenchement (%)", "triggerThreshold")}
        </div>
      </div>

      {/* CONDITIONS ENVIRONNEMENTALES */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-[#C48C56] uppercase tracking-widest flex items-center gap-2">
          <span className="text-green-400">&#127807;</span> Conditions Environnementales
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {numField("PM10 moyen (ug/m3)", "pm10")}
          {numField("Poussiere dust (ug/m3)", "dust")}
          {numField("Humidite moyenne (%)", "humidity")}
          {numField("Vitesse vent (m/s)", "windSpeed")}
        </div>
        <div className="grid grid-cols-1">
          {numField("Jours secs consecutifs (moy. annuelle)", "dryDays")}
        </div>
      </div>

      <button
        onClick={() => onSubmit(params)}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#2F5D50] text-white font-medium hover:bg-[#264a40] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Generating Forecast...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Generate Forecast Analysis
          </>
        )}
      </button>
    </div>
  );
}

/* ================================================================
   Forecast Results Display
   ================================================================ */
function ForecastResultsView({ results }: { results: ForecastResults }) {
  const { kalmanResults, aiInsights } = results;
  const { summary, monthlyData, kalmanModel } = kalmanResults;
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Missions / An</p>
          <p className="text-2xl font-light text-white">{summary.totalMissions}</p>
          <p className="text-[10px] text-green-400 mt-1">{summary.frequencyStatus}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Encrassement Max Y2</p>
          <p className="text-2xl font-light text-[#C48C56]">{summary.maxSoilingY2}</p>
          <p className="text-[10px] text-white/30 mt-1">Indice Kalman cumule</p>
        </div>
        <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Perte Production / An</p>
          <p className="text-2xl font-light text-white">{summary.annualLossKwh.toLocaleString()}</p>
          <p className="text-[10px] text-white/30 mt-1">kWh/an - {summary.annualLossPercent}% perdu</p>
        </div>
        <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Bilan Net Annuel</p>
          <p className={`text-2xl font-light ${summary.netBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
            {summary.netBalance >= 0 ? "+" : ""}{summary.netBalance} DT
          </p>
          <p className="text-[10px] text-green-400 mt-1">{summary.isCleaningProfitable ? "Nettoyage rentable" : "Non rentable"}</p>
        </div>
      </div>

      {/* Soiling Evolution Chart */}
      <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="text-lg">&#128200;</span> Evolution Encrassement Y2(t) &mdash; 12 mois
        </h4>
        <SoilingChart data={monthlyData} />
      </div>

      {/* Financial Analysis */}
      <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="text-lg">&#128176;</span> Analyse Financiere Annuelle
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Cout nettoyages ({summary.totalMissions} missions)</span>
            <span className="text-white">{summary.totalCleaningCost} DT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Penalites evitees estimees</span>
            <span className="text-green-400">+{summary.totalPenaltiesAvoided} DT</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Revenus perdus (encrassement)</span>
            <span className="text-red-400">-{summary.revenueLost} DT</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-medium">
            <span className="text-white/70">Bilan net annuel</span>
            <span className={summary.netBalance >= 0 ? "text-green-400" : "text-red-400"}>
              {summary.netBalance >= 0 ? "+" : ""}{summary.netBalance} DT
            </span>
          </div>
        </div>
      </div>

      {/* Production Loss Chart */}
      <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
          Perte Production Mensuelle (kWh)
        </h4>
        <LossBarChart data={monthlyData} />
      </div>

      {/* Cleaning Schedule */}
      <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="text-lg">&#128197;</span> Planning Missions de Nettoyage
        </h4>
        {summary.totalMissions === 0 ? (
          <p className="text-sm text-green-400">Aucune mission critique &mdash; la pluie naturelle maintient l&apos;encrassement sous le seuil.</p>
        ) : (
          <div className="space-y-2">
            {monthlyData.filter(m => m.missions > 0).map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">{m.month}</span>
                <span className="text-white/60">Mission de nettoyage requise &mdash; Y2 = {m.y2Avg}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts & Recommendations */}
      {aiInsights && (
        <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="text-lg">&#128276;</span> Alertes &amp; Recommandations
          </h4>
          <div className="text-sm text-white/70 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsights}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Monthly Detail Table */}
      <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
            <span className="text-lg">&#128203;</span> Tableau Mensuel Detaille
          </h4>
          <button onClick={() => setShowTable(!showTable)} className="text-xs text-[#2F5D50] hover:text-white transition-colors">
            {showTable ? "Masquer" : "Afficher"}
          </button>
        </div>
        {showTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="py-2 px-2 text-left">Mois</th>
                  <th className="py-2 px-2 text-right">Jours secs</th>
                  <th className="py-2 px-2 text-right">PM10</th>
                  <th className="py-2 px-2 text-right">Y2 moy</th>
                  <th className="py-2 px-2 text-right">Y2 max</th>
                  <th className="py-2 px-2 text-right">Perte (kWh)</th>
                  <th className="py-2 px-2 text-right">Perte (%)</th>
                  <th className="py-2 px-2 text-right">Penalite</th>
                  <th className="py-2 px-2 text-right">Missions</th>
                  <th className="py-2 px-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-2 text-white/70">{m.month}</td>
                    <td className="py-2 px-2 text-right text-white/50">{m.dryDays}j</td>
                    <td className="py-2 px-2 text-right text-white/50">{m.pm10} ug/m3</td>
                    <td className="py-2 px-2 text-right text-white/70">{m.y2Avg}%</td>
                    <td className="py-2 px-2 text-right text-white/70">{m.y2Max}%</td>
                    <td className="py-2 px-2 text-right text-white/70">{m.lossKwh.toLocaleString()} kWh</td>
                    <td className="py-2 px-2 text-right text-white/70">{m.lossPercent}%</td>
                    <td className="py-2 px-2 text-right text-white/50">{m.penalty > 0 ? `${m.penalty} DT` : "\u2014"}</td>
                    <td className="py-2 px-2 text-right text-white/50">{m.missions > 0 ? m.missions : "\u2014"}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        m.status === "NORMAL" ? "bg-green-500/15 text-green-400"
                          : m.status === "ATTENTION" ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kalman Model */}
      <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="text-lg">&#129518;</span> Modele Kalman Applique
        </h4>
        <div className="space-y-4 text-sm font-mono">
          <div>
            <p className="text-white/40 text-xs mb-1">Equation d&apos;observation (Production Y1t) :</p>
            <pre className="text-[#2F5D50] text-xs leading-relaxed whitespace-pre-wrap">{kalmanModel.productionEquation}</pre>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Equation d&apos;etat (Encrassement Y2t) :</p>
            <pre className="text-[#C48C56] text-xs leading-relaxed whitespace-pre-wrap">{kalmanModel.soilingEquation}</pre>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/10">
            <div><span className="text-white/40">R2 = </span><span className="text-white">{kalmanModel.r2}</span></div>
            <div><span className="text-white/40">RMSE = </span><span className="text-white">{kalmanModel.rmse} kW</span></div>
            <div><span className="text-white/40">MAE = </span><span className="text-white">{kalmanModel.mae} kW</span></div>
            <div><span className="text-white/40">n = </span><span className="text-white">{kalmanModel.observations} obs.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Main Page Component
   ================================================================ */
export default function SolarAIAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome! I'm your Solar PV AI specialist. I can help you with:\n\n- **Analyzing solar installation data** from CSV files\n- **Forecasting production losses** due to soiling and environmental factors\n- **Optimizing cleaning schedules** based on Kalman filter modeling\n- **Financial impact analysis** for your PV installations\n\nUpload a CSV file with your solar data to get started, or ask me anything about photovoltaic systems.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState<{ summary: string; timeSeriesData: { ds: string; y: number }[] | null; headers: string[]; firstRows: Record<string, string>[] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [forecastLoading, setForecastLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`, timestamp: new Date() },
    ]);
  }, []);

  // Send chat message
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    addMessage({ role: "user", content: userText });
    setLoading(true);

    try {
      const apiMessages = [
        ...messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userText },
      ];

      const res = await fetch("/api/solar-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          csvData: csvData ? csvData.summary.substring(0, 2000) : null,
          csvSummary: csvData?.summary || null,
          sessionId,
        }),
      });

      const data = await res.json();
      if (data.error) {
        addMessage({ role: "assistant", content: "I encountered an error processing your request. Please try again." });
      } else {
        // Check if response contains forecast trigger
        const hasForecastTrigger = data.message?.includes("```forecast-trigger");
        const cleanedMessage = data.message?.replace(/```forecast-trigger[\s\S]*?```/g, "").trim();

        addMessage({
          role: "assistant",
          content: cleanedMessage || data.message,
          forecastTrigger: hasForecastTrigger || data.isForecastRequest,
        });
      }
    } catch {
      addMessage({ role: "assistant", content: "Connection error. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      addMessage({ role: "assistant", content: "Please upload a CSV file (.csv extension required)." });
      return;
    }

    setUploading(true);
    addMessage({ role: "user", content: `Uploading file: ${file.name}`, csvFile: { name: file.name, summary: "" } });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const res = await fetch("/api/solar-agent/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        addMessage({ role: "assistant", content: `Error processing file: ${data.error}` });
      } else {
        setCsvData({
          summary: data.summary,
          timeSeriesData: data.timeSeriesData,
          headers: data.headers,
          firstRows: data.firstRows,
        });

        addMessage({
          role: "assistant",
          content: `I've successfully loaded and analyzed **${file.name}**.\n\n**Summary:**\n- ${data.rowCount} rows of data\n- Columns: ${data.headers.join(", ")}\n\n${data.summary.split("\n").slice(3, 12).join("\n")}\n\nThe data is now stored in my memory. I can:\n- **Analyze patterns** in your solar data\n- **Generate forecasts** based on this data\n- **Answer questions** about any column or metric\n\nWhat would you like to explore?`,
          csvFile: { name: file.name, summary: data.summary },
        });
      }
    } catch {
      addMessage({ role: "assistant", content: "Failed to upload the file. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  // Handle forecast form submission
  const handleForecastSubmit = async (params: ForecastParams) => {
    setForecastLoading(true);
    addMessage({ role: "user", content: `Generating forecast for ${params.power} kWc installation in ${params.region} (${params.environment})...` });

    try {
      const res = await fetch("/api/solar-agent/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          params,
          timeSeriesData: csvData?.timeSeriesData || null,
        }),
      });

      const data = await res.json();
      if (data.error) {
        addMessage({ role: "assistant", content: "Forecast generation failed. Please try again." });
      } else {
        addMessage({
          role: "assistant",
          content: "Here are your forecast results based on the Kalman soiling model and your parameters:",
          forecastResults: data,
        });
      }
    } catch {
      addMessage({ role: "assistant", content: "Failed to generate the forecast. Please check your connection." });
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080812] text-white flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a16]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2F5D50]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2F5D50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-medium text-white">Solar PV AI Agent</h1>
                <p className="text-[10px] text-white/30">Photovoltaic Specialist</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {csvData && (
              <span className="text-[10px] bg-[#2F5D50]/20 text-[#2F5D50] px-2 py-1 rounded-full">
                CSV Loaded
              </span>
            )}
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/30">Online</span>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "order-1" : ""}`}>
                {/* Avatar */}
                <div className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    msg.role === "user" ? "bg-[#C48C56]/20" : "bg-[#2F5D50]/20"
                  }`}>
                    {msg.role === "user" ? (
                      <svg className="w-3.5 h-3.5 text-[#C48C56]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-[#2F5D50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
                      </svg>
                    )}
                  </div>

                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#1a1a2e] border border-white/10"
                      : "bg-[#0f0f1a] border border-white/5"
                  }`}>
                    {/* CSV file badge */}
                    {msg.csvFile && (
                      <div className="flex items-center gap-2 mb-2 text-xs bg-[#2F5D50]/10 text-[#2F5D50] px-2 py-1 rounded-lg w-fit">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {msg.csvFile.name}
                      </div>
                    )}

                    {/* Message content */}
                    <div className="text-sm text-white/80 leading-relaxed prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>

                    {/* Forecast trigger -> show form */}
                    {msg.forecastTrigger && !msg.forecastResults && (
                      <div className="mt-4">
                        <ForecastForm onSubmit={handleForecastSubmit} loading={forecastLoading} />
                      </div>
                    )}

                    {/* Forecast results */}
                    {msg.forecastResults && (
                      <div className="mt-4">
                        <ForecastResultsView results={msg.forecastResults} />
                      </div>
                    )}
                  </div>
                </div>

                <p className={`text-[9px] text-white/20 mt-1 ${msg.role === "user" ? "text-right mr-10" : "ml-10"}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {(loading || uploading) && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#2F5D50]/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#2F5D50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2" />
                  </svg>
                </div>
                <div className="bg-[#0f0f1a] border border-white/5 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2F5D50] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2F5D50] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2F5D50] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Bar */}
      <footer className="border-t border-white/10 bg-[#0a0a16]/80 backdrop-blur-xl sticky bottom-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 bg-[#0f0f1a] border border-white/10 rounded-2xl px-4 py-3">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-[#2F5D50] disabled:opacity-30"
              title="Upload CSV"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Text input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about solar PV systems, upload CSV data, or request a forecast..."
              disabled={loading}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
            />

            {/* Send */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-[#2F5D50] text-white hover:bg-[#264a40] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-white/15 mt-2">Solar PV AI Agent powered by advanced forecasting models</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
