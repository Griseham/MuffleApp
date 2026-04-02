import {
  TIMELINE_MONTHS,
  EXTENDED_TIMELINE_MONTHS,
  CURRENT_MONTH_INDEX,
} from "../../backend/timelineMockData";

export const ZONE1_START_YEAR = 2015;
export const ZONE1_LAST_YEAR = 2026;
export const ZONE1_PRESENT_END_YEAR = ZONE1_LAST_YEAR - 1;

export const ZONE1_PAST_MONTHS = TIMELINE_MONTHS.filter(
  (month) => month.year >= ZONE1_START_YEAR && month.year <= ZONE1_PRESENT_END_YEAR
);

export const ZONE1_MONTHS = EXTENDED_TIMELINE_MONTHS
  .filter((month) => month.year >= ZONE1_START_YEAR && month.year <= ZONE1_LAST_YEAR)
  .map((month) => ({
    ...month,
    isFuture: month.year === ZONE1_LAST_YEAR,
  }));

export const ZONE1_PAST_YEARS = Array.from(new Set(ZONE1_PAST_MONTHS.map((month) => month.year)));
export const ZONE1_SEPARATOR_INDEX = ZONE1_PAST_MONTHS.length;
export const ZONE1_FUTURE_YEAR = ZONE1_LAST_YEAR;
export const ZONE1_CURRENT_MONTH_INDEX = Math.max(
  0,
  Math.min(CURRENT_MONTH_INDEX, ZONE1_PAST_MONTHS.length - 1)
);
export const ZONE1_CURRENT_TIMELINE_YEAR =
  ZONE1_PAST_MONTHS[ZONE1_CURRENT_MONTH_INDEX]?.year ?? ZONE1_PRESENT_END_YEAR;
