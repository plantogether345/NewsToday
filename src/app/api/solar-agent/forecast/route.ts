import { NextRequest, NextResponse } from "next/server";

const NIXTLA_API_KEY = process.env.NIXTLA_API_KEY || "";
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";

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
  timeSeriesData?: { ds: string; y: number }[];
}

// Kalman filter simulation for soiling model
function simulateKalmanSoiling(params: ForecastParams, months: number = 12) {
  const phi = 0.9526; // state transition
  const theta = -2.610; // soiling impact on production
  const basePM10Effect = 8.0e-5;
  const baseDustEffect = 5.0e-5;
  const humidityDamping = 8.6e-5;
  const rainReduction = 0.2;

  const monthlyData = [];
  let y2 = 0.005; // initial soiling state
  let cumulativeKalman = 0;
  let totalLossKwh = 0;
  let totalPenalty = 0;
  let totalCleaningCost = 0;
  let missions = 0;

  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"];

  // Regional climate profiles (dry days, rain probability per month)
  const regionProfiles: Record<string, { dryDaysMultiplier: number; rainMonths: number[] }> = {
    "Sfax": { dryDaysMultiplier: 1.0, rainMonths: [0, 1, 2, 9, 10, 11] },
    "Tunis": { dryDaysMultiplier: 0.85, rainMonths: [0, 1, 2, 3, 9, 10, 11] },
    "Sousse": { dryDaysMultiplier: 0.9, rainMonths: [0, 1, 2, 10, 11] },
    "Gabes": { dryDaysMultiplier: 1.1, rainMonths: [0, 1, 10, 11] },
    "Tozeur": { dryDaysMultiplier: 1.4, rainMonths: [0, 11] },
    "Tataouine": { dryDaysMultiplier: 1.5, rainMonths: [] },
    "Bizerte": { dryDaysMultiplier: 0.75, rainMonths: [0, 1, 2, 3, 4, 9, 10, 11] },
    "Kairouan": { dryDaysMultiplier: 1.05, rainMonths: [0, 1, 2, 9, 10, 11] },
  };

  const profile = regionProfiles[params.region] || regionProfiles["Sfax"];

  // Environment multipliers
  const envMultipliers: Record<string, number> = {
    "Urbain / Industriel": 1.2,
    "Rural / Agricole": 0.8,
    "Cotier": 0.9,
    "Desertique / Saharien": 1.5,
  };
  const envFactor = envMultipliers[params.environment] || 1.0;

  const dailyCapacity = params.power * params.solarHours; // kWh/day at STC

  for (let m = 0; m < months; m++) {
    const isRainyMonth = profile.rainMonths.includes(m);
    const monthDryDays = params.dryDays * profile.dryDaysMultiplier * (isRainyMonth ? 0.3 : 1.2) * (1 + (m >= 5 && m <= 8 ? 0.5 : 0));
    const monthPM10 = params.pm10 * envFactor * (1 + (m >= 3 && m <= 8 ? 0.3 : -0.1));
    const monthDust = params.dust * envFactor * (1 + (m >= 5 && m <= 8 ? 0.4 : -0.1));
    const monthHumidity = params.humidity * (isRainyMonth ? 1.2 : 0.85);

    // State transition: Y2(t) = phi * Y2(t-1) + effects
    const baseRate = (monthPM10 * basePM10Effect + monthDust * baseDustEffect) * envFactor;
    const humEffect = monthHumidity * humidityDamping;
    y2 = phi * y2 + baseRate - humEffect + basePM10Effect * monthDryDays * 0.001;

    if (isRainyMonth) {
      y2 = y2 * rainReduction;
    }

    y2 = Math.max(0, Math.min(y2, 0.08)); // cap at 8%
    const y2Max = y2 * (1.5 + Math.random() * 0.5);
    cumulativeKalman += y2;

    // Production loss
    const monthlyProduction = dailyCapacity * 30;
    const lossPercent = y2 * Math.abs(theta) * 100;
    const lossKwh = monthlyProduction * (lossPercent / 100);
    totalLossKwh += lossKwh;

    // Penalty calculation
    let monthPenalty = 0;
    if (lossPercent > params.penaltyThreshold) {
      monthPenalty = (lossPercent - params.penaltyThreshold) * params.penaltyRate * params.power / 100;
    }
    totalPenalty += monthPenalty;

    // Check if cleaning needed
    let monthMissions = 0;
    let status = "NORMAL";
    if (y2 * 100 > params.triggerThreshold) {
      monthMissions = 1;
      missions += 1;
      totalCleaningCost += params.cleaningCost;
      y2 = y2 * (1 - params.cleaningEfficiency / 100);
      status = "NETTOYAGE";
    } else if (lossPercent > params.penaltyThreshold * 0.8) {
      status = "ATTENTION";
    }

    monthlyData.push({
      month: monthNames[m],
      dryDays: Math.round(monthDryDays * 10) / 10,
      pm10: Math.round(monthPM10 * 10) / 10,
      y2Avg: Math.round(y2 * 100 * 1000) / 1000,
      y2Max: Math.round(y2Max * 100 * 1000) / 1000,
      lossKwh: Math.round(lossKwh),
      lossPercent: Math.round(lossPercent * 1000) / 1000,
      penalty: Math.round(monthPenalty),
      missions: monthMissions,
      status,
    });
  }

  const annualProduction = dailyCapacity * 365;
  const lossPercentAnnual = (totalLossKwh / annualProduction) * 100;
  const netBalance = totalPenalty - totalCleaningCost;

  return {
    monthlyData,
    summary: {
      totalMissions: missions,
      frequencyStatus: missions <= 2 ? "Frequence acceptable" : "Frequence elevee",
      maxSoilingY2: Math.round(Math.max(...monthlyData.map((m) => m.y2Max)) * 100) / 100,
      cumulativeKalman: Math.round(cumulativeKalman * 100) / 100,
      annualLossKwh: Math.round(totalLossKwh),
      annualLossPercent: Math.round(lossPercentAnnual * 100) / 100,
      netBalance: Math.round(netBalance),
      isCleaningProfitable: netBalance > 0,
      totalCleaningCost: Math.round(totalCleaningCost),
      totalPenaltiesAvoided: Math.round(totalPenalty),
      revenueLost: Math.round(totalLossKwh * params.electricityPrice),
    },
    kalmanModel: {
      phi,
      theta,
      r2: 0.9650,
      rmse: 0.251,
      mae: 0.166,
      observations: monthlyData.length * 30,
      productionEquation: `Y1(t) = 0.474 + 1.758e-3*Irradiation - 0.0406*TempAmb + 0.0256*TempModule + 0.0219*UVIndex + ${theta}*Y2(t)`,
      soilingEquation: `Y2(t) = ${phi}*Y2(t-1) + ${basePM10Effect}*PM10 + ${baseDustEffect}*dust + base_rate(PM10,dust,hum) - ${humidityDamping}*Humidite -> x${rainReduction} si pluie detectee`,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { params, timeSeriesData } = body as { params: ForecastParams; timeSeriesData?: { ds: string; y: number }[] };

    // Run Kalman soiling simulation
    const kalmanResults = simulateKalmanSoiling(params);

    // If we have time series data, also call TimeGPT for production forecast
    let timeGPTForecast = null;
    if (timeSeriesData && timeSeriesData.length > 0) {
      try {
        const nixtlaResponse = await fetch("https://api.nixtla.io/forecast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NIXTLA_API_KEY}`,
            accept: "application/json",
          },
          body: JSON.stringify({
            model: "timegpt-1",
            freq: "MS",
            fh: 12,
            y: {
              timestamps: timeSeriesData.map((d) => d.ds),
              values: timeSeriesData.map((d) => d.y),
            },
            level: [80, 90],
            clean_ex_first: true,
            finetune_steps: 10,
          }),
        });

        if (nixtlaResponse.ok) {
          const nixtlaData = await nixtlaResponse.json();
          timeGPTForecast = nixtlaData;
        } else {
          const errText = await nixtlaResponse.text();
          console.error("TimeGPT error:", errText);
        }
      } catch (nixtlaError) {
        console.error("TimeGPT request failed:", nixtlaError);
      }
    }

    // Use Cerebras to generate textual insights
    let aiInsights = "";
    try {
      const insightsPrompt = `Based on the following solar PV soiling analysis for a ${params.power} kWc installation in ${params.region} (${params.environment}):
- Annual production loss: ${kalmanResults.summary.annualLossKwh} kWh (${kalmanResults.summary.annualLossPercent}%)
- Total cleaning missions needed: ${kalmanResults.summary.totalMissions}
- Net financial balance: ${kalmanResults.summary.netBalance} DT
- Max soiling Y2: ${kalmanResults.summary.maxSoilingY2}%
- Critical months: ${kalmanResults.monthlyData.filter((m) => m.status !== "NORMAL").map((m) => m.month).join(", ") || "None"}

Provide 3-4 concise, actionable recommendations and alerts. Format as bullet points. Include specific months and financial figures. Do not mention any tools or APIs used.`;

      const cerebrasResp = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            { role: "system", content: "You are a solar energy PV specialist. Provide concise technical recommendations. Never mention tools or APIs." },
            { role: "user", content: insightsPrompt },
          ],
          max_tokens: 1024,
          temperature: 0.5,
        }),
      });

      if (cerebrasResp.ok) {
        const cerebrasData = await cerebrasResp.json();
        aiInsights = cerebrasData.choices?.[0]?.message?.content || "";
      }
    } catch (insightsError) {
      console.error("Insights generation error:", insightsError);
    }

    return NextResponse.json({
      kalmanResults,
      timeGPTForecast,
      aiInsights,
      params,
    });
  } catch (error) {
    console.error("Forecast error:", error);
    return NextResponse.json(
      { error: "Forecast generation failed" },
      { status: 500 }
    );
  }
}
