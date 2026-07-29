/**
 * Single source of truth for the UDS clinical measure set tracked in MeasureWise.
 * Every measure picker, chart, label map and CSV validator reads from here so
 * the app can never drift into showing different measure lists in different places.
 */

export interface UdsMeasure {
  /** CMS identifier used as the stable key in the database (uds_trends.measure_id) */
  id: string;
  /** Short display name, e.g. "Cervical Cancer Screening" */
  short: string;
  /** Full label, e.g. "CMS124 – Cervical Cancer Screening" */
  label: string;
  /** Value stored on PDSA cycles (`uds_measure`), e.g. "CMS124: Cervical Cancer Screening" */
  value: string;
  /** Chart line color (HSL string) */
  color: string;
  /** true when a LOWER rate is better (inverse measure) */
  inverse?: boolean;
}

export const UDS_MEASURE_LIST: UdsMeasure[] = [
  {
    id: "CMS2",
    short: "Depression Screening",
    label: "CMS2 – Screening for Depression & Follow-Up",
    value: "CMS2: Depression Screening",
    color: "hsl(270, 60%, 50%)",
  },
  {
    id: "CMS138",
    short: "Tobacco Use Screening",
    label: "CMS138 – Tobacco Use Screening & Cessation",
    value: "CMS138: Tobacco Screening & Cessation",
    color: "hsl(24, 85%, 50%)",
  },
  {
    id: "CMS130",
    short: "Colorectal Cancer Screening",
    label: "CMS130 – Colorectal Cancer Screening",
    value: "CMS130: Colorectal Cancer Screening",
    color: "hsl(192, 70%, 35%)",
  },
  {
    id: "CMS124",
    short: "Cervical Cancer Screening",
    label: "CMS124 – Cervical Cancer Screening",
    value: "CMS124: Cervical Cancer Screening",
    color: "hsl(215, 70%, 45%)",
  },
  {
    id: "CMS125",
    short: "Breast Cancer Screening",
    label: "CMS125 – Breast Cancer Screening",
    value: "CMS125: Breast Cancer Screening",
    color: "hsl(165, 60%, 40%)",
  },
  {
    id: "CMS165",
    short: "Hypertension Control",
    label: "CMS165 – Controlling High Blood Pressure",
    value: "CMS165: Blood Pressure Control",
    color: "hsl(38, 92%, 50%)",
  },
  {
    id: "CMS122",
    short: "Diabetes A1c > 9% or Untested",
    label: "CMS122 – Diabetes: HbA1c > 9% or Untested",
    value: "CMS122: Diabetes HbA1c Poor Control",
    color: "hsl(0, 72%, 51%)",
    inverse: true,
  },
];

/** "CMS124: Cervical Cancer Screening" style values used on PDSA cycles */
export const UDS_MEASURE_VALUES = UDS_MEASURE_LIST.map((m) => m.value);

/** measure_id -> short label */
export const UDS_MEASURE_LABELS: Record<string, string> = Object.fromEntries(
  UDS_MEASURE_LIST.map((m) => [m.id, m.short]),
);

export const UDS_MEASURE_IDS = UDS_MEASURE_LIST.map((m) => m.id);
