import { MenuItemProps } from "../utils/dashboardService";

interface Props extends MenuItemProps {}

export default function MenuItem({ name, price, outOfStock }: Props) {
  return (
    <>
      <div className="w-64 bg-gray-100 shadow-md rounded-xl p-2 gap-2 flex flex-col justify-between">
        <div className="w-full h-32 bg-gray-200 rounded-lg"></div>
        <div className="w-full flex items-baseline justify-between">
          <p className="text-xl font-semibold">{name}</p>
          {outOfStock ? (
            <p className="self-end text-red-500 font-bold">Out of Stock</p>
          ) : (
            <p className="self-end">{price.toLocaleString()} ₩</p>
          )}
        </div>
      </div>
    </>
  );
}
