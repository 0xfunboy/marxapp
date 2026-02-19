import type { Assumption, TargetPreset } from "./types";

export const MODEL_VERSION = "0.1.0";

export const ASSUMPTIONS: Assumption[] = [
  {
    id: "water_desalination_kwh_m3",
    label: "Desalination energy cost",
    description: "Average energy needed to deliver 1 m3 of treated water",
    defaultValue: 3.5,
    range: [2.5, 6],
    unit: "kWh/m3",
    impactText: "Higher values make water gaps harder to close",
    rationale: "Didactic range based on technical literature",
    version: MODEL_VERSION
  },
  {
    id: "water_network_losses",
    label: "Water network losses",
    description: "Average distribution loss ratio",
    defaultValue: 0.25,
    range: [0.1, 0.45],
    unit: "ratio",
    impactText: "Higher values increase effective demand",
    rationale: "Simplified global proxy",
    version: MODEL_VERSION
  },
  {
    id: "planning_efficiency_multiplier",
    label: "Planning efficiency",
    description: "Multiplier applied to waste and timing reduction",
    defaultValue: 1,
    range: [0.7, 1.2],
    unit: "x",
    impactText: "Higher values improve effective reallocation",
    rationale: "Synthetic didactic parameter",
    version: MODEL_VERSION
  },
  {
    id: "transition_shock_output",
    label: "Transition output shock",
    description: "Industrial output reduction during transition period",
    defaultValue: 0.08,
    range: [0.02, 0.2],
    unit: "ratio",
    impactText: "Higher values worsen short-term outcomes",
    rationale: "Represents organizational frictions",
    version: MODEL_VERSION
  }
];

export const TARGET_MULTIPLIERS: Record<TargetPreset, number> = {
  minimum: 0.85,
  dignity: 1,
  high: 1.15
};
