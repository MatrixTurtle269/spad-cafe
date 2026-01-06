import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

import Modal from "./Modal";

export type Duration = { start?: Date; end?: Date };

interface Props {
  duration: Duration;
  setDuration: Dispatch<SetStateAction<Duration>>;
  valid: boolean;
  setValid: Dispatch<SetStateAction<boolean>>;
}

export default function DurationSelector({
  duration,
  setDuration,
  setValid,
}: Props) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const [rangeIsInvalid, setRangeIsInvalid] = useState(false);

  useEffect(() => {
    if (duration.start && duration.end) {
      if (!dayjs(duration.end).isBefore(dayjs(duration.start))) {
        setRangeIsInvalid(false);
        setValid(true);
      } else {
        setRangeIsInvalid(true);
      }
    } else {
      setValid(false);
    }
  }, [duration]);

  return (
    <>
      <div className="w-full flex flex-row items-center gap-2">
        <p>Duration: </p>
        <button
          onClick={() => setStartOpen(true)}
          className={`cursor-pointer px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl shadow text-lg font-semibold ${
            duration.start ? "" : "text-gray-500"
          }`}
        >
          {duration.start
            ? dayjs(duration.start).format("dddd, M/D/YYYY")
            : "From"}
        </button>
        <p> ~ </p>
        <button
          onClick={() => setEndOpen(true)}
          className={`cursor-pointer px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl shadow text-lg font-semibold ${
            duration.end ? "" : "text-gray-500"
          }`}
        >
          {duration.end ? dayjs(duration.end).format("dddd, M/D/YYYY") : "To"}
        </button>
        <p>
          {duration.start && duration.end ? (
            rangeIsInvalid ? (
              <b className="text-red-500">Invalid range.</b>
            ) : (
              `(${
                dayjs(duration.end).diff(dayjs(duration.start), "day") + 1
              } days, spans ${
                dayjs(duration.end).week() - dayjs(duration.start).week() + 1
              } weeks)`
            )
          ) : (
            "Please choose a duration."
          )}
        </p>
      </div>
      <Modal open={startOpen} setOpen={setStartOpen}>
        <Calendar
          locale="en"
          value={duration.start}
          onClickDay={(v) => {
            setDuration((prev) => ({ ...prev, start: v }));
            setStartOpen(false);
          }}
        />
      </Modal>
      <Modal open={endOpen} setOpen={setEndOpen}>
        <Calendar
          locale="en"
          value={duration.end}
          onClickDay={(v) => {
            setDuration((prev) => ({ ...prev, end: v }));
            setEndOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
