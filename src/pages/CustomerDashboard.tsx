import React, { useEffect, useState } from "react";
import { CgSpinner } from "react-icons/cg";

import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

import CustomerOrderPanel from "../components/CustomerOrderPanel";
import {
  CustomerData,
  ListItemProps,
  LocalListDataAdder,
} from "../utils/dashboardService";
import dayjs from "dayjs";
import CustomerListItem from "../components/CustomerListItem";

export default function CustomerDashboard({ user }: { user: User }) {
  const [list, setList] = useState<ListItemProps[]>([]);
  const [listMap, setListMap] = useState<
    { day: string; items: ListItemProps[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<CustomerData>();

  const addLocalListData: LocalListDataAdder = (props) => {
    setList((prevList) => [props, ...prevList]);
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
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
            orderBy("timestamp", "desc")
          )
        );
        setList(
          listDataSnap.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id } as ListItemProps)
          )
        );
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
      []
    );
    setListMap(grouped);
  }, [list]);

  return (
    <div className="flex w-screen h-screen gap-4 pt-16">
      <div className="flex flex-1 flex-row gap-4 p-4">
        {loading || !customerData ? (
          <div className="flex flex-1 justify-center items-center">
            <h1 className="text-xl font-bold mb-4">Just a moment...</h1>
            <CgSpinner size={64} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col flex-3 overflow-scroll">
              <h1 className="text-3xl">
                Hello, <b>{customerData.name}</b>
              </h1>
              <div className="w-full h-px bg-gray-300 my-2" />
              <h2 className="text-xl font-semibold">Your Orders</h2>
              {list.length > 0 ? (
                <div className="gap-4 mt-4">
                  {listMap.reduce((acc, { day, items }) => {
                    acc.push(
                      <div
                        className="flex flex-col bg-gray-100 rounded-xl overflow-hidden p-4 mb-6 shadow gap-2"
                        key={day}
                      >
                        <h3 className="text-lg font-bold">{day}</h3>
                        {items.map((props, i) => (
                          <CustomerListItem {...props} key={i} />
                        ))}
                      </div>
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
            <div className="flex flex-2">
              <CustomerOrderPanel
                addLocal={addLocalListData}
                customerData={customerData}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
