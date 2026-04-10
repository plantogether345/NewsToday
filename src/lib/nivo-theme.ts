export const darkNivoTheme = {
  background: 'transparent',
  text: {
    fontSize: 11,
    fill: 'rgba(255, 255, 255, 0.6)',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  axis: {
    domain: {
      line: {
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1,
      },
    },
    legend: {
      text: {
        fontSize: 12,
        fill: 'rgba(255, 255, 255, 0.6)',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    ticks: {
      line: {
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1,
      },
      text: {
        fontSize: 10,
        fill: 'rgba(255, 255, 255, 0.5)',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  grid: {
    line: {
      stroke: 'rgba(255, 255, 255, 0.05)',
      strokeWidth: 1,
    },
  },
  legends: {
    title: {
      text: {
        fontSize: 11,
        fill: 'rgba(255, 255, 255, 0.6)',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
    text: {
      fontSize: 11,
      fill: 'rgba(255, 255, 255, 0.6)',
      outlineWidth: 0,
      outlineColor: 'transparent',
    },
    ticks: {
      line: {},
      text: {
        fontSize: 10,
        fill: 'rgba(255, 255, 255, 0.6)',
        outlineWidth: 0,
        outlineColor: 'transparent',
      },
    },
  },
  annotations: {
    text: {
      fontSize: 13,
      fill: 'rgba(255, 255, 255, 0.6)',
      outlineWidth: 2,
      outlineColor: '#050507',
      outlineOpacity: 1,
    },
    link: {
      stroke: 'rgba(255, 255, 255, 0.3)',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: '#050507',
      outlineOpacity: 1,
    },
    outline: {
      stroke: 'rgba(255, 255, 255, 0.3)',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: '#050507',
      outlineOpacity: 1,
    },
    symbol: {
      fill: 'rgba(255, 255, 255, 0.3)',
      outlineWidth: 2,
      outlineColor: '#050507',
      outlineOpacity: 1,
    },
  },
  tooltip: {
    wrapper: {},
    container: {
      background: '#1a1a24',
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 12,
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '8px 12px',
    },
    basic: {},
    chip: {},
    table: {},
    tableCell: {},
    tableCellValue: {},
  },
};

export const chartColors = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a78bfa', // purple light
  '#818cf8', // indigo light
  '#c084fc', // purple
  '#7c3aed', // violet dark
  '#4f46e5', // indigo dark
  '#a855f7', // purple bright
  '#6d28d9', // violet darker
  '#5b21b6', // violet deep
  '#e879f9', // fuchsia
  '#f472b6', // pink
  '#38bdf8', // sky
  '#2dd4bf', // teal
  '#34d399', // emerald
  '#fbbf24', // amber
];
