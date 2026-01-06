import { useEffect, useState } from "react";
import { CustomerData, useCustomerList } from "../utils/dashboardService";
import AddCustomerButton from "../components/AddCustomerButton";
import CustomerItem from "../components/CustomerItem";
import RefreshButton from "../components/RefreshButton";
import Fuse from "fuse.js";

export default function Customers() {
  const { data: customerList, isFetching } = useCustomerList();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<CustomerData[]>([]);

  const fuse = new Fuse(customerList || [], {
    keys: ["name"],
    threshold: 0.3,
  });

  useEffect(() => {
    setSearchResult(
      searchQuery === ""
        ? customerList || []
        : fuse.search(searchQuery).map((result) => result.item)
    );
  }, [searchQuery, customerList]);

  return (
    <div className="w-full flex flex-col gap-4 pt-20 p-4">
      <div className="w-full flex justify-between items-center pb-2 border-b border-b-gray-300">
        <div className="flex gap-4">
          <h1 className="text-2xl font-semibold">
            {customerList?.length} Registered Customers
          </h1>
          <AddCustomerButton />
        </div>
        <RefreshButton queryKey="customers" />
      </div>
      <input
        type="text"
        placeholder="Search..."
        className="w-128 border border-amber-500 bg-white p-2 rounded-xl"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="w-full flex flex-col">
        {isFetching || !customerList ? (
          <p>Fetching customer list...</p>
        ) : searchResult.length > 0 ? (
          searchResult.map((props, i) => <CustomerItem {...props} key={i} />)
        ) : (
          <p>No results</p>
        )}
      </div>
    </div>
  );
}
