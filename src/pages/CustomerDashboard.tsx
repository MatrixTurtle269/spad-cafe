import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, useAuth } from "../firebase";

import {
  CustomerData,
  ListItemProps,
  LocalListDataAdder,
  LunchData,
} from "../utils/dashboardService";
import dayjs from "dayjs";
import CustomerListItem from "../components/CustomerListItem";
import { MdAdd, MdHideImage } from "react-icons/md";
import CustomerOrderModal from "../components/CustomerOrderModal";
import LunchRatingButton from "../components/LunchRatingButton";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [list, setList] = useState<ListItemProps[]>([]);
  const [listMap, setListMap] = useState<
    { day: string; items: ListItemProps[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData>();

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const addLocalListData: LocalListDataAdder = (props) => {
    setList((prevList) => [props, ...prevList]);
  };

  const [lunchDetails, setLunchDetails] = useState<string>("");
  const [lunchImageUrl, setLunchImageUrl] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          const customerData = userDocSnap.data();
          setCustomerData({ ...customerData, id: user.uid } as CustomerData);
        }

        const start = dayjs().startOf("week").toDate();
        const end = dayjs().endOf("week").toDate();
        const listDataSnap = await getDocs(
          query(
            collection(db, "log"),
            where("customerId", "==", user.uid),
            where("timestamp", ">=", start),
            where("timestamp", "<=", end),
            orderBy("timestamp", "desc"),
          ),
        );
        setList(
          listDataSnap.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id }) as ListItemProps,
          ),
        );

        // Fetch lunch details
        const dateKey = dayjs(new Date()).format("YYYY-MM-DD");
        const docSnap = await getDoc(doc(db, "lunch", dateKey));
        if (docSnap.exists()) {
          const data = docSnap.data() as LunchData;
          setLunchDetails(data.details);
          setLunchImageUrl(data.imageUrl);
        } else {
          setLunchDetails("");
          setLunchImageUrl("");
        }
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const grouped = list.reduce<{ day: string; items: ListItemProps[] }[]>(
      (acc, item) => {
        const day = dayjs(item.timestamp.toDate())
          .startOf("day")
          .format("dddd, MMMM D");

        let entry = acc.find((x) => x.day === day);
        if (!entry) {
          entry = { day, items: [] };
          acc.push(entry);
        }

        entry.items.push(item);
        return acc;
      },
      [],
    );
    setListMap(grouped);
  }, [list]);

  return (
    <div className="flex w-screen h-screen gap-4 pt-16">
      <div className="flex flex-1 flex-row gap-4 p-4">
        {loading || !customerData ? (
          <div className="flex flex-col flex-1 justify-center items-center">
            <h1 className="text-xl font-bold mb-4">Just a moment...</h1>
            <CgSpinner size={64} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col flex-3 overflow-scroll">
              <div className="flex w-full items-center gap-2">
                <div className="flex flex-1 flex-col">
                  <h1 className="text-3xl">
                    Hello, <b>{customerData.name}</b>
                  </h1>
                  <div className="w-full h-px bg-gray-300 my-2" />
                  <h2 className="text-xl font-semibold">Your Orders</h2>
                </div>
                <button
                  className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xl font-semibold rounded-full cursor-pointer"
                  onClick={() => setOrderModalOpen(true)}
                >
                  Place New Order
                  <MdAdd size={24} />
                </button>
              </div>
              {list.length > 0 ? (
                <div className="mt-2">
                  {listMap.reduce((acc, { day, items }) => {
                    acc.push(
                      <div
                        className="flex flex-col bg-gray-100 rounded-xl overflow-hidden p-4 mb-4 shadow gap-2"
                        key={day}
                      >
                        <h3 className="text-lg font-bold">{day}</h3>
                        {items.map((props, i) => (
                          <CustomerListItem {...props} key={i} />
                        ))}
                      </div>,
                    );
                    return acc;
                  }, [] as React.ReactNode[])}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-gray-500">
                    You haven't ordered anything this week.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col flex-2 gap-4">
              <div className="flex flex-col flex-1">
                <h2 className="text-xl font-semibold mb-2">STUCO Events</h2>
                <div className="flex w-full h-full bg-gray-100 rounded-xl items-center justify-center">
                  <p className="text-gray-500">No events at the moment.</p>
                </div>
              </div>
              <div className="flex flex-col flex-2">
                <h2 className="text-xl font-semibold mb-2">Today's Lunch</h2>
                <div className="flex min-h-64 gap-4 p-2 rounded-xl bg-gray-100">
                  <div className="flex flex-3 flex-col justify-center items-center">
                    <p className="text-lg font-semibold">
                      {dayjs(new Date()).format("MMMM D, YYYY (dddd)")}
                    </p>
                    <p className="text-center whitespace-pre-wrap">
                      {lunchDetails || "No details available"}
                    </p>
                  </div>
                  {lunchImageUrl ? (
                    <img
                      src={lunchImageUrl}
                      alt="Lunch"
                      className="flex flex-2 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-2 rounded-xl bg-gray-200 flex-col justify-center items-center">
                      <MdHideImage size={48} color="gray" />
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col w-full mt-2 items-center">
                  <LunchRatingButton
                    details={lunchDetails || ""}
                    imageUrl={lunchImageUrl || ""}
                  />
                </div>
              </div>
            </div>
            <CustomerOrderModal
              addLocal={addLocalListData}
              customerData={customerData}
              open={orderModalOpen}
              setOpen={setOrderModalOpen}
            />
          </>
        )}
      </div>
    </div>
  );
}
