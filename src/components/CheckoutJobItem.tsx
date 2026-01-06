import { Timestamp } from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MdChevronRight } from "react-icons/md";
dayjs.extend(relativeTime);

interface Props {
  name: string;
  timestamp: Timestamp;
  processed: boolean;
  index: number;
  selectedJobIndex: number | null;
  setSelectedJobIndex: Dispatch<SetStateAction<number | null>>;
}

export default function CheckoutJobItem({
  name,
  timestamp,
  processed,
  index,
  selectedJobIndex,
  setSelectedJobIndex,
}: Props) {
  return (
    <div
      className={`w-full px-3 py-2 flex justify-between items-center hover:bg-blue-50 border-b border-gray-300 cursor-pointer ${
        selectedJobIndex === index ? "bg-blue-100" : ""
      }`}
      onClick={() => {
        setSelectedJobIndex(index);
      }}
    >
      <div>
        <p className="text-lg font-semibold">{name}</p>
        <div className="flex gap-1">
          {processed ? (
            <p className="text-sm font-bold text-blue-500">Processed</p>
          ) : (
            <p className="text-sm font-bold text-red-500">Pending</p>
          )}
          <p className="text-sm">
            - Created {dayjs(timestamp.toDate()).fromNow()}
          </p>
        </div>
      </div>
      <MdChevronRight size={24} />
    </div>
  );
}
