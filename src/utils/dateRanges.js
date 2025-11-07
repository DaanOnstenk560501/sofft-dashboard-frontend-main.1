const subtractDaysInclusive = (endDate, days) => {
  const start = new Date(endDate);
  start.setDate(start.getDate() - (days - 1));
  return start;
};

const subtractMonths = (endDate, months) => {
  const start = new Date(endDate);
  start.setMonth(start.getMonth() - months);
  return start;
};

const subtractYears = (endDate, years) => {
  const start = new Date(endDate);
  start.setFullYear(start.getFullYear() - years);
  return start;
};

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const RANGE_OPTIONS = [
  { key: "7d", label: "Past Week", getStart: (end) => subtractDaysInclusive(end, 7) },
  { key: "1m", label: "Past Month", getStart: (end) => subtractMonths(end, 1) },
  { key: "6m", label: "Past 6 Months", getStart: (end) => subtractMonths(end, 6) },
  { key: "1y", label: "Past Year", getStart: (end) => subtractYears(end, 1) },
];

export const resolveDateRange = (rangeKey, fallbackKey = RANGE_OPTIONS[0].key) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  const rangeOption =
    RANGE_OPTIONS.find((option) => option.key === rangeKey) ??
    RANGE_OPTIONS.find((option) => option.key === fallbackKey) ??
    RANGE_OPTIONS[0];

  const startDate = rangeOption.getStart(endDate);
  startDate.setHours(0, 0, 0, 0);

  return {
    start: startDate,
    end: endDate,
  };
};
