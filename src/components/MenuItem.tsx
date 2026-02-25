import { MdHideImage, MdStar } from "react-icons/md";
import { IoSparkles } from "react-icons/io5";
import { MenuItemProps } from "../utils/dashboardService";

interface Props extends MenuItemProps {}

export default function MenuItem({
  name,
  price,
  outOfStock,
  imageUrl,
  newTag,
  bestTag,
}: Props) {
  return (
    <div className="w-64 bg-gray-100 shadow-md rounded-xl p-2 gap-2 flex flex-col justify-between">
      <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
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
        <p className="text-xl font-semibold line-clamp-1">{name}</p>
        {outOfStock ? (
          <p className="text-red-500 font-bold">Out of Stock</p>
        ) : (
          <p className="line-clamp-1">{price.toLocaleString()} ₩</p>
        )}
      </div>
    </div>
  );
}
