import { useQuery } from "@tanstack/react-query";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import { getDaySpan } from "./getDaySpan";

export type MenuItemProps = {
  name: string;
  price: number;
  id: string;
};
export type ListItemProps = {
  timestamp: Timestamp;
  name: string;
  customerId: string;
  payment: number;
  originalPayment: number;
  manualPaymentSet: boolean;
  manualPayment: number;
  discount: number;
  fundsUsed: boolean;
  fundSubtraction: number;
  notes: string;
  details: {
    menuId: string;
    menuLabel: string;
    quantity: number;
  }[];
  done: boolean;
  id: string;
};
export type CustomerData = {
  name: string;
  email: string;
  funds: number;
  id: string;
};

export type LocalListDataUpdater = (id: string, updatedProps: Partial<ListItemProps>) => void;
export type LocalListDataAdder = (props: ListItemProps) => void;
export type LocalListDataDeleter = (id: string) => void;

export const fetchList = async (date: Date) => {
  const { start, end } = getDaySpan(date);
  const listSnap = await getDocs(
    query(collection(db, "log"), where("timestamp", ">=", start), where("timestamp", "<=", end), orderBy("timestamp", "desc"))
  );
  return listSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as ListItemProps));
};

export const useMenu = () => {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const menuSnap = await getDocs(collection(db, "menu"));
      return menuSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as MenuItemProps));
    },
    staleTime: 1000 * 60 * 10, // Stale after 10 mins
  });
};

export const useCustomerList = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const querySnap = await getDocs(query(collection(db, "users"), orderBy("name", "desc")));
      return querySnap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as CustomerData));
    },
    staleTime: Infinity,
  });
};
