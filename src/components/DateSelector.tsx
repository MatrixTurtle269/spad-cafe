import dayjs from "dayjs";
import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import Modal from "./Modal";

interface Props {
  date: Date;
  isToday: boolean;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
}

export default function DateSelector({ date, isToday, setDate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full py-2 bg-gray-100 rounded-xl flex flex-col items-center gap-2">
        <div className="w-full flex flex-row justify-center items-center gap-4">
          <button onClick={() => setDate((prevDate) => dayjs(prevDate).subtract(1, "day").toDate())} className="cursor-pointer">
            <MdChevronLeft size={30} />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="cursor-pointer px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-xl shadow text-lg font-semibold">
            {dayjs(date).format("dddd, M/D/YYYY")}
          </button>
          <button onClick={() => setDate((prevDate) => dayjs(prevDate).add(1, "day").toDate())} className="cursor-pointer">
            <MdChevronRight size={30} />
          </button>
        </div>
        {!isToday && (
          <button className="cursor-pointer underline text-amber-600" onClick={() => setDate(new Date())}>
            Back to Today
          </button>
        )}
      </div>
      <Modal open={open} setOpen={setOpen}>
        <Calendar
          locale="en"
          value={date}
          onClickDay={(v) => {
            setDate(v);
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
