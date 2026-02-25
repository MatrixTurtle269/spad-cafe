import { MdHideImage, MdStar } from "react-icons/md";
import { IoSparkles } from "react-icons/io5";
import { MenuItemProps } from "../utils/dashboardService";

interface Props extends MenuItemProps {
  i: number;
  qty: number;
  changeItem: (i: number, q: number) => void;
}

export default function MenuItemOrder({
  name,
  price,
  outOfStock,
  imageUrl,
  newTag,
  bestTag,
  i,
  qty,
  changeItem,
}: Props) {
  return (
    <div
      className={`shadow-md rounded-xl p-2 col-span-1 flex box-border grow-0 shrink-0 flex-col justify-evenly ${qty > 0 ? "bg-amber-100" : "bg-gray-100"}`}
    >
      <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col gap-2 items-center justify-center text-xl text-gray-500">
            <MdHideImage size={24} color="gray" />
            No Image
          </div>
        )}
        <div className="absolute top-1 right-1 flex gap-1">
          {newTag && (
            <div className="flex items-center px-1.5 py-0.5 gap-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
              <IoSparkles size={12} color="white" />
              NEW
            </div>
          )}
          {bestTag && (
            <div className="flex items-center px-1 py-0.5 gap-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
              <MdStar size={14} color="white" />
              BEST
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-0">
        <p className="text-lg font-semibold line-clamp-1">{name}</p>
        <div className="bg-gray-300 h-px w-full mb-1" />
        <div className="w-full flex">
          <div className="flex flex-1">
            {outOfStock ? (
              <p className="text-red-500 font-bold">Out of Stock</p>
            ) : (
              <p className="line-clamp-1">{price.toLocaleString()} ₩</p>
            )}
          </div>
          {!outOfStock && (
            <div className="flex flex-1 gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  changeItem(i, Math.max(0, qty - 1));
                }}
                className="w-6 h-6 cursor-pointer bg-red-100 hover:bg-red-200 rounded-lg shadow text-lg flex items-center justify-center font-semibold"
              >
                -
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => changeItem(i, parseInt(e.target.value))}
                min="0"
                max="99"
                step="1"
                className="bg-white border border-amber-500 pl-1 flex flex-1 rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  changeItem(i, qty + 1);
                }}
                className="w-6 h-6 cursor-pointer bg-green-100 hover:bg-green-200 rounded-lg shadow text-lg flex items-center justify-center font-semibold"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
