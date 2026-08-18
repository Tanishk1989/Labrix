export function isFutureLocalDeadline(value: string, now = new Date()) {
  if (!value) return true;
  const deadline = new Date(value);
  return !Number.isNaN(deadline.valueOf()) && deadline > now;
}

export function deadlineSummary(
  value: string,
  options: { locale?: string; timeZoneName?: string } = {},
) {
  if (!value) return "No deadline";
  const localParts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  const deadline = localParts
    ? new Date(
        Date.UTC(
          Number(localParts[1]),
          Number(localParts[2]) - 1,
          Number(localParts[3]),
          Number(localParts[4]),
          Number(localParts[5]),
        ),
      )
    : new Date(value);
  if (Number.isNaN(deadline.valueOf())) return "Choose a valid date and time";

  const date = new Intl.DateTimeFormat(options.locale ?? "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: localParts ? "UTC" : undefined,
  }).format(deadline);
  return options.timeZoneName ? `${date} (${options.timeZoneName})` : date;
}

export function serializeLocalDeadline(value: string) {
  if (!value) return "";
  const deadline = new Date(value);
  return Number.isNaN(deadline.valueOf()) ? value : deadline.toISOString();
}
