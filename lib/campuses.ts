export const campusOptions = ["Rose Hill", "Lincoln Center"] as const;

export type CampusOption = (typeof campusOptions)[number];

export const unknownCampusLabel = "Unknown campus";

export function isKnownCampus(campus?: string | null): campus is CampusOption {
  return campusOptions.includes((campus ?? "").trim() as CampusOption);
}

export function getCampusDisplayName(campus?: string | null) {
  const trimmedCampus = campus?.trim();

  return isKnownCampus(trimmedCampus) ? trimmedCampus : unknownCampusLabel;
}

export function getCampusFilterOptions() {
  return [...campusOptions];
}

export function getCampusFilterValue(campus?: string | null) {
  const trimmedCampus = campus?.trim();

  return isKnownCampus(trimmedCampus) ? trimmedCampus : "";
}

export function getCampusSelectOptions() {
  return [...campusOptions];
}

export function getCampusSelectValue(currentCampus?: string | null) {
  const trimmedCampus = currentCampus?.trim();

  return isKnownCampus(trimmedCampus) ? trimmedCampus : campusOptions[0];
}

export function getKnownCampusCount(campuses: Array<string | null | undefined>) {
  return new Set(
    campuses
      .map((campus) => campus?.trim())
      .filter((campus): campus is CampusOption => isKnownCampus(campus))
  ).size;
}
