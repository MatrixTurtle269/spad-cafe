import { useState } from "react";
import { MdAccountCircle, MdDelete } from "react-icons/md";
import { Rating } from "react-custom-rating-component";

interface Props {
  rating: number;
  comments: string;
  name: string;
  id: string;
  onDeleteResponse: (id: string) => void;
}

export default function LunchRatingItem({
  rating,
  comments,
  name,
  id,
  onDeleteResponse,
}: Props) {
  const [showName, setShowName] = useState(false);

  return (
    <div className="w-full flex gap-2 bg-gray-100 rounded-xl p-2" key={id}>
      <MdAccountCircle color="gray" size={48} />
      <div className="w-full flex-col gap-2">
        <div className="w-full flex justify-between">
          <div className="flex items-center gap-2">
            {showName && <span className="text-xl font-semibold">{name}</span>}
            <button
              onClick={() => setShowName(!showName)}
              className="text-sm text-amber-500 underline cursor-pointer"
            >
              {showName ? "Hide Name" : "Show Name"}
            </button>
          </div>
          <div className="flex">
            <Rating
              defaultValue={rating}
              size="30px"
              spacing="3px"
              precision={0.5}
              activeColor="orange"
              defaultColor="lightgray"
              readOnly
            />
            <button
              onClick={() => onDeleteResponse(id)}
              className="ml-2 bg-red-500 cursor-pointer rounded-full"
            >
              <MdDelete size={24} color="white" />
            </button>
          </div>
        </div>
        <span>{comments}</span>
      </div>
    </div>
  );
}
