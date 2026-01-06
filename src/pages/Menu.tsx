import { useMenu } from "../utils/dashboardService";
import MenuItem from "../components/MenuItem";
import AddMenuButton from "../components/AddMenuButton";
import RefreshButton from "../components/RefreshButton";

export default function Menu() {
  const { data: menu, isFetching } = useMenu();

  return (
    <div className="w-full flex flex-col gap-4 p-4 pt-20">
      <div className="w-full flex items-center justify-between pb-2 border-b border-b-gray-300 gap-4">
        <div className="flex gap-4">
          <h1 className="text-2xl font-semibold">{menu?.length} Menu Items</h1>
          <AddMenuButton />
        </div>
        <RefreshButton queryKey="menu" />
      </div>
      <div className="w-full flex flex-wrap gap-4">
        {isFetching || !menu ? (
          <p>Fetching menu data...</p>
        ) : (
          menu.map((props, i) => <MenuItem {...props} key={i} />)
        )}
      </div>
    </div>
  );
}
