import React, { useEffect, useState } from "react";
import { MdChevronRight, MdClose, MdGroupOff } from "react-icons/md";
import Modal from "./Modal";
import { CustomerData, useCustomerList } from "../utils/dashboardService";
import Fuse from "fuse.js";
import RefreshButton from "./RefreshButton";

interface Props {
  customer: CustomerData | null;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerData | null>>;
}

export default function SelectCustomerButton({ customer, setCustomer }: Props) {
  const [open, setOpen] = useState(false);

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
    <>
      <div className="w-full flex">
        <button
          className={`flex-1 border border-amber-500 ${
            customer
              ? "bg-amber-500 hover:bg-amber-400"
              : "bg-white hover:bg-amber-100"
          } p-2 rounded-xl cursor-pointer`}
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <div className="w-full flex justify-between items-center pl-1">
            {customer ? (
              <p className="text-white font-semibold">{customer.name}</p>
            ) : (
              <p className="text-gray-500">Select Customer</p>
            )}
            <MdChevronRight color={customer ? "white" : "black"} />
          </div>
        </button>
        {customer && (
          <button
            className="p-2 rounded-full cursor-pointer"
            onClick={() => setCustomer(null)}
          >
            <MdClose size={20} color="red" />
          </button>
        )}
      </div>
      <Modal open={open} setOpen={setOpen}>
        <div className="flex flex-col gap-2">
          <div className="w-full flex items-center justify-between">
            <h1 className="text-xl font-semibold">Select Customer</h1>
            <RefreshButton queryKey="customers" />
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-128 border border-amber-500 bg-white p-2 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="w-full h-96 overflow-y-scroll">
              {isFetching ? (
                <div className="w-full h-full flex justify-center items-center">
                  <p className="text-gray-500">Fetching customer list...</p>
                </div>
              ) : searchResult.length > 0 ? (
                searchResult.map((v, i) => (
                  <div
                    className="w-full p-2 border-b border-b-gray-300 hover:bg-amber-100 cursor-pointer"
                    onClick={() => {
                      setCustomer(v);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    key={i}
                  >
                    <p className="text-lg font-semibold">{v.name}</p>
                    <p className="text-sm text-gray-500">{v.email}</p>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center gap-2">
                  <MdGroupOff size={40} color="gray" />
                  <p>No Results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
