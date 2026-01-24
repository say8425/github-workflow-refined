import { t } from "@/utils/i18n";

export const PRESET_FORMATS = [
  { label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" },
  { label: "YYYY/MM/DD HH:mm", value: "YYYY/MM/DD HH:mm" },
  { label: "MM/DD/YYYY h:mm A", value: "MM/DD/YYYY h:mm A" },
  { label: "DD/MM/YYYY HH:mm", value: "DD/MM/YYYY HH:mm" },
  { label: "MMM DD, YYYY h:mm A", value: "MMM DD, YYYY h:mm A" },
  { label: "MMMM DD, YYYY HH:mm", value: "MMMM DD, YYYY HH:mm" },
];

export function getThresholdOptions() {
  return [
    { label: t("threshold1Hour"), value: 60 * 60 * 1000 },
    { label: t("threshold6Hours"), value: 6 * 60 * 60 * 1000 },
    { label: t("threshold12Hours"), value: 12 * 60 * 60 * 1000 },
    { label: t("threshold24Hours"), value: 24 * 60 * 60 * 1000 },
    { label: t("threshold7Days"), value: 7 * 24 * 60 * 60 * 1000 },
    { label: t("threshold30Days"), value: 30 * 24 * 60 * 60 * 1000 },
  ];
}
