export function formatPostedDate(dateValue: string) {
  const postedDate = new Date(dateValue);

  if (Number.isNaN(postedDate.getTime())) {
    return "Posted recently";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfPostedDate = new Date(
    postedDate.getFullYear(),
    postedDate.getMonth(),
    postedDate.getDate()
  );
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const dayDifference = Math.floor(
    (startOfToday.getTime() - startOfPostedDate.getTime()) / millisecondsPerDay
  );

  if (dayDifference <= 0) {
    return "Posted today";
  }

  if (dayDifference === 1) {
    return "Posted yesterday";
  }

  if (dayDifference < 7) {
    return `Posted ${dayDifference} days ago`;
  }

  return `Posted ${postedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })}`;
}
