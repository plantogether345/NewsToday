'use client';

import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { ResponsiveBump } from '@nivo/bump';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveChord } from '@nivo/chord';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';
import { ResponsiveFunnel } from '@nivo/funnel';
import { ResponsiveNetwork } from '@nivo/network';
import { ResponsiveSankey } from '@nivo/sankey';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { ResponsiveStream } from '@nivo/stream';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { ResponsiveSwarmPlot } from '@nivo/swarmplot';
import { ResponsiveVoronoi } from '@nivo/voronoi';
import { ResponsiveWaffle } from '@nivo/waffle';
import { ResponsiveMarimekko } from '@nivo/marimekko';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { darkNivoTheme, chartColors } from '@/lib/nivo-theme';

// ==================== BAR CHART ====================
export function BarChart({ data, keys, indexBy }: { data: any[]; keys: string[]; indexBy: string }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="rgba(255,255,255,0.7)"
        animate={true}
        motionConfig="gentle"
        borderRadius={4}
      />
    </div>
  );
}

// ==================== LINE CHART ====================
export function LineChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveLine
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
        curve="monotoneX"
        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        enableArea={true}
        areaOpacity={0.1}
        useMesh={true}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== PIE CHART ====================
export function PieChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsivePie
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
        innerRadius={0.6}
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="rgba(255,255,255,0.6)"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="rgba(255,255,255,0.8)"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== RADAR CHART ====================
export function RadarChart({ data, keys, indexBy }: { data: any[]; keys: string[]; indexBy: string }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveRadar
        data={data}
        keys={keys}
        indexBy={indexBy}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 40, right: 60, bottom: 40, left: 60 }}
        borderColor={{ from: 'color' }}
        gridLabelOffset={20}
        dotSize={8}
        dotColor={{ theme: 'background' }}
        dotBorderWidth={2}
        dotBorderColor={{ from: 'color' }}
        fillOpacity={0.15}
        blendMode="normal"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== HEATMAP CHART ====================
export function HeatMapChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveHeatMap
        data={data}
        theme={darkNivoTheme as any}
        margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
        axisTop={null}
        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        colors={{ type: 'sequential', scheme: 'purple_blue' }}
        borderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        animate={true}
        motionConfig="gentle"
        hoverTarget="cell"
        cellOpacity={0.85}
      />
    </div>
  );
}

// ==================== TREEMAP CHART ====================
export function TreeMapChart({ data }: { data: any }) {
  if (!data || !data.children?.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveTreeMap
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        identity="name"
        value="value"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        labelSkipSize={24}
        labelTextColor="rgba(255,255,255,0.8)"
        parentLabelTextColor="rgba(255,255,255,0.6)"
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        animate={true}
        motionConfig="gentle"
        innerPadding={3}
        outerPadding={3}
      />
    </div>
  );
}

// ==================== BUMP CHART ====================
export function BumpChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveBump
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 100, bottom: 40, left: 60 }}
        lineWidth={3}
        activeLineWidth={5}
        inactiveLineWidth={2}
        inactiveOpacity={0.15}
        pointSize={10}
        activePointSize={14}
        inactivePointSize={0}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={3}
        activePointBorderWidth={3}
        pointBorderColor={{ from: 'serie.color' }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== CALENDAR CHART ====================
export function CalendarChart({ data, from, to }: { data: any[]; from: string; to: string }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 200 }}>
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        theme={darkNivoTheme as any}
        emptyColor="rgba(255,255,255,0.03)"
        colors={['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa']}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        yearSpacing={40}
        monthBorderColor="rgba(255,255,255,0.08)"
        dayBorderWidth={1}
        dayBorderColor="rgba(255,255,255,0.05)"
      />
    </div>
  );
}

// ==================== CHORD CHART ====================
export function ChordChart({ matrix, keys }: { matrix: number[][]; keys: string[] }) {
  if (!matrix.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveChord
        matrix={matrix}
        keys={keys}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        padAngle={0.02}
        innerRadiusRatio={0.96}
        innerRadiusOffset={0.02}
        arcOpacity={0.8}
        arcBorderWidth={1}
        arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        ribbonOpacity={0.5}
        ribbonBorderWidth={1}
        ribbonBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        enableLabel={true}
        label="id"
        labelOffset={12}
        labelRotation={-90}
        labelTextColor="rgba(255,255,255,0.6)"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== CIRCLE PACKING CHART ====================
export function CirclePackingChart({ data }: { data: any }) {
  if (!data || !data.children?.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveCirclePacking
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        id="name"
        value="value"
        padding={4}
        enableLabels={true}
        labelsSkipRadius={20}
        labelTextColor="rgba(255,255,255,0.8)"
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== FUNNEL CHART ====================
export function FunnelChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveFunnel
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        borderWidth={10}
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        labelColor="rgba(255,255,255,0.8)"
        enableBeforeSeparators={true}
        enableAfterSeparators={true}
        beforeSeparatorLength={50}
        beforeSeparatorOffset={10}
        afterSeparatorLength={50}
        afterSeparatorOffset={10}
        currentPartSizeExtension={10}
        currentBorderWidth={20}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== NETWORK CHART ====================
export function NetworkChart({ data }: { data: any }) {
  if (!data?.nodes?.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveNetwork
        data={data}
        theme={darkNivoTheme as any}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        linkDistance={(e: any) => e.distance || 50}
        centeringStrength={0.3}
        repulsivity={6}
        nodeSize={(n: any) => n.size || 10}
        activeNodeSize={(n: any) => (n.size || 10) * 1.5}
        nodeColor={(n: any) => n.color || '#6366f1'}
        nodeBorderWidth={1}
        nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        linkThickness={(n: any) => 1 + (n.weight || 1)}
        linkBlendMode="screen"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== SANKEY CHART ====================
export function SankeyChart({ data }: { data: any }) {
  if (!data?.nodes?.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveSankey
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 120, bottom: 20, left: 20 }}
        align="justify"
        sort="auto"
        nodeOpacity={0.85}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={0.3}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={10}
        labelTextColor="rgba(255,255,255,0.6)"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== SCATTERPLOT CHART ====================
export function ScatterPlotChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveScatterPlot
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        blendMode="screen"
        nodeSize={10}
        axisBottom={{ tickSize: 5, tickPadding: 5 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== STREAM CHART ====================
export function StreamChart({ data, keys }: { data: any[]; keys: string[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveStream
        data={data}
        keys={keys}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        axisBottom={{ tickSize: 5, tickPadding: 5 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        offsetType="diverging"
        fillOpacity={0.7}
        borderWidth={0}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== SUNBURST CHART ====================
export function SunburstChart({ data }: { data: any }) {
  if (!data || !data.children?.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveSunburst
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        id="name"
        value="value"
        cornerRadius={3}
        borderColor={{ theme: 'background' }}
        borderWidth={1}
        enableArcLabels={true}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="rgba(255,255,255,0.8)"
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== SWARMPLOT CHART ====================
export function SwarmPlotChart({ data, groups }: { data: any[]; groups: string[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveSwarmPlot
        data={data}
        groups={groups}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        identity="id"
        value="value"
        size={8}
        forceStrength={4}
        simulationIterations={100}
        borderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== VORONOI CHART ====================
export function VoronoiChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveVoronoi
        data={data}
        xDomain={[0, 100]}
        yDomain={[0, 100]}
        enableLinks={true}
        linkLineColor="rgba(255,255,255,0.1)"
        cellLineColor="rgba(255,255,255,0.15)"
        pointSize={6}
        pointColor="#6366f1"
        margin={{ top: 1, right: 1, bottom: 1, left: 1 }}
      />
    </div>
  );
}

// ==================== WAFFLE CHART ====================
export function WaffleChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveWaffle
        data={data}
        total={data.reduce((sum: number, d: any) => sum + d.value, 0)}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        rows={18}
        columns={14}
        padding={2}
        borderRadius={3}
        borderWidth={0}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== MARIMEKKO CHART ====================
export function MarimekkoChart({ data, id, value, dimensions }: { data: any[]; id: string; value: string; dimensions: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 300 }}>
      <ResponsiveMarimekko
        data={data}
        id={id}
        value={value}
        dimensions={dimensions}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        innerPadding={3}
        axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
        axisLeft={{ tickSize: 5, tickPadding: 5 }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== RADIAL BAR CHART ====================
export function RadialBarChart({ data }: { data: any[] }) {
  if (!data.length) return <EmptyChart />;
  return (
    <div style={{ height: 350 }}>
      <ResponsiveRadialBar
        data={data}
        theme={darkNivoTheme as any}
        colors={chartColors}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        padding={0.4}
        cornerRadius={4}
        enableRadialGrid={true}
        enableCircularGrid={true}
        radialAxisStart={{ tickSize: 5, tickPadding: 5 }}
        circularAxisOuter={{ tickSize: 5, tickPadding: 12 }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}

// ==================== EMPTY STATE ====================
function EmptyChart() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <p className="text-white/30 text-xs font-medium">No data available</p>
    </div>
  );
}
