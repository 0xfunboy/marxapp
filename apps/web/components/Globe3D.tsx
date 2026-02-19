"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

type DomainKey = "water" | "energy" | "food" | "health" | "education" | "internet";

type DomainStat = {
  domain: DomainKey;
  coveragePct: number;
  gapModeValue: number;
  belowThresholdPopulation: number;
  confidence: "high" | "medium" | "low";
};

type CountryBundle = {
  iso3: string;
  country: string;
  region: string;
  population: number;
  centroid: { lat: number; lon: number };
  perDomain: Record<DomainKey, DomainStat>;
};

type Props = {
  countries: CountryBundle[];
  gapMode: boolean;
  selectedIso3?: string;
  onSelect: (iso3: string) => void;
  onHoverIso?: (iso3: string | null) => void;
};

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const DOMAIN_ORDER: DomainKey[] = ["water", "energy", "food", "health", "education", "internet"];
const DOMAIN_COLORS: Record<DomainKey, string> = {
  water: "#2f88ff",
  energy: "#ffcd3c",
  food: "#58c27d",
  health: "#ff5ca8",
  education: "#a36dff",
  internet: "#47d1ff"
};

function getIsoFromFeature(feature: { properties?: Record<string, unknown> } | null | undefined): string | null {
  if (!feature || !feature.properties) return null;
  const iso = feature.properties["ISO3166-1-Alpha-3"];
  return typeof iso === "string" && iso.length === 3 ? iso : null;
}

function buildStackGradient(c: CountryBundle) {
  const values = DOMAIN_ORDER.map((d) => Math.max(1, c.perDomain[d].coveragePct));
  const total = values.reduce((acc, v) => acc + v, 0);

  let cursor = 0;
  const chunks: string[] = [];
  for (let i = 0; i < DOMAIN_ORDER.length; i += 1) {
    const domain = DOMAIN_ORDER[i];
    const h = (values[i] / total) * 100;
    const start = cursor;
    const end = cursor + h;
    chunks.push(`${DOMAIN_COLORS[domain]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    cursor = end;
  }
  return `linear-gradient(to top, ${chunks.join(",")})`;
}

export function Globe3D({ countries, gapMode, selectedIso3, onSelect, onHoverIso }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(980);
  const [polygons, setPolygons] = useState<Array<{ properties?: Record<string, unknown> }>>([]);
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width || 980);
      setWidth(Math.max(320, w));
    });
    obs.observe(hostRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/data/countries.geojson")
      .then((r) => r.json())
      .then((geo) => {
        if (!mounted) return;
        const features = Array.isArray(geo?.features) ? geo.features : [];
        setPolygons(features);
      })
      .catch(() => {
        setPolygons([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    onHoverIso?.(hoverIso);
  }, [hoverIso, onHoverIso]);

  const htmlData = useMemo(
    () =>
      countries.map((c) => {
        const avgCoverage = DOMAIN_ORDER.reduce((acc, d) => acc + Math.max(0, Math.min(100, c.perDomain[d].coveragePct)), 0) / DOMAIN_ORDER.length;
        const avgGap = DOMAIN_ORDER.reduce((acc, d) => acc + Math.max(0, Math.min(100, c.perDomain[d].gapModeValue * 100)), 0) / DOMAIN_ORDER.length;
        return {
          ...c,
          lat: c.centroid.lat,
          lng: c.centroid.lon,
          avgCoverage,
          avgGap
        };
      }),
    [countries]
  );

  return (
    <div ref={hostRef} style={{ width: "100%", height: 600, borderRadius: 16, overflow: "hidden" }}>
      <Globe
        width={width}
        height={600}
        globeImageUrl="/textures/earth-blue-marble.jpg"
        backgroundImageUrl="/textures/night-sky.png"
        atmosphereColor="#ff4a4a"
        atmosphereAltitude={0.18}
        polygonsData={polygons}
        polygonCapColor={(f) => {
          const iso = getIsoFromFeature(f as { properties?: Record<string, unknown> });
          if (!iso) return "rgba(0,0,0,0)";
          if (iso === hoverIso) return "rgba(255,95,95,0.22)";
          if (iso === selectedIso3) return "rgba(255,196,72,0.18)";
          return "rgba(0,0,0,0)";
        }}
        polygonSideColor={() => "rgba(255,255,255,0.02)"}
        polygonStrokeColor={(f) => {
          const iso = getIsoFromFeature(f as { properties?: Record<string, unknown> });
          if (iso === hoverIso) return "rgba(255,162,162,0.92)";
          if (iso === selectedIso3) return "rgba(255,225,150,0.8)";
          return "rgba(255,255,255,0.18)";
        }}
        polygonAltitude={(f) => {
          const iso = getIsoFromFeature(f as { properties?: Record<string, unknown> });
          if (iso === hoverIso) return 0.009;
          if (iso === selectedIso3) return 0.006;
          return 0.001;
        }}
        onPolygonHover={(f) => setHoverIso(getIsoFromFeature(f as { properties?: Record<string, unknown> }))}
        onPolygonClick={(f) => {
          const iso = getIsoFromFeature(f as { properties?: Record<string, unknown> });
          if (iso) onSelect(iso);
        }}
        htmlElementsData={htmlData}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={(d) => {
          const row = d as (typeof htmlData)[number];
          const el = document.createElement("div");
          const signal = gapMode ? row.avgGap : row.avgCoverage;
          const totalHeight = Math.max(12, Math.min(145, signal * 1.35));
          el.style.width = row.iso3 === selectedIso3 ? "11px" : "8px";
          el.style.height = `${totalHeight}px`;
          el.style.borderRadius = "6px";
          el.style.background = buildStackGradient(row);
          el.style.border = row.iso3 === selectedIso3 ? "1px solid #ffe2a6" : "1px solid rgba(255,255,255,0.3)";
          el.style.boxShadow = "0 0 10px rgba(0,0,0,0.45)";
          el.style.cursor = "pointer";
          el.style.transform = "translate(-50%, -100%)";
          el.title = `${row.country} (${row.iso3})`;
          el.onclick = () => onSelect(row.iso3);
          return el;
        }}
        htmlTransitionDuration={250}
      />
    </div>
  );
}
