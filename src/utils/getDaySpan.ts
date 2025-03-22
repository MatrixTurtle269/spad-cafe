import dayjs from "dayjs";

export function getDaySpan(date: Date) {
  const day = dayjs(date);
  const start = day.startOf("day").toDate();
  const end = day.endOf("day").toDate();

  return { start, end };
}
