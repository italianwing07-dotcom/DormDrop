export const campusOptions = [
  "Fordham",
  "NYU",
  "Columbia",
  "St. John's",
  "Boston College",
  "Other"
] as const;

export type CampusOption = (typeof campusOptions)[number];

export function isKnownCampus(campus?: string | null) {
  return campusOptions.includes((campus ?? "").trim() as CampusOption);
}

export function getCampusDisplayName(campus?: string | null): CampusOption {
  const trimmedCampus = campus?.trim();

  return isKnownCampus(trimmedCampus) ? (trimmedCampus as CampusOption) : "Other";
}

export function getCampusFilterOptions() {
  return [...campusOptions];
}

export function getCampusFilterValue(campus?: string | null) {
  return getCampusDisplayName(campus);
}

export function getCampusSelectOptions() {
  return [...campusOptions];
}

export function getCampusSelectValue(currentCampus?: string | null) {
  return getCampusDisplayName(currentCampus);
}
