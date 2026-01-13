import { useQuery } from "@tanstack/react-query";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getDaySpan } from "./getDaySpan";

export type MenuItemProps = {
  name: string;
  price: number;
  outOfStock?: boolean;
  index?: number;
  category?: string;
  id: string;
};
export type MenuCategoryProps = {
  name: string;
  index: number;
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
  online?: boolean;
  doneIndices?: (number | undefined)[];
  id: string;
};
export type CustomerData = {
  name: string;
  email: string;
  funds: number;
  id: string;
};
export type CheckoutJobData = {
  name: string;
  processed: boolean;
  timestamp: Timestamp;
  start?: Date;
  end?: Date;
  lastCompInfo?: { timestamp: Date; start: Date; end: Date };
  id: string;
};
export type CheckoutJobCompiledListItemProps = {
  customer: CustomerData;
  receipt: { name: string; quantity: number }[];
  payment: number;
  modifier?: number;
  emailSent: boolean;
  paid: boolean;
  id: string;
};
export type LunchData = {
  details: string;
  imageUrl: string;
  updatedAt: Timestamp;
};
export type LunchRatingData = {
  date: string; // YYYY-MM-DD
  rating: number;
  comments: string;
  id: string;
  name: string;
  customerId: string;
  timestamp: Timestamp;
};

export type LocalListDataUpdater = (
  id: string,
  updatedProps: Partial<ListItemProps>
) => void;
export type LocalListDataAdder = (props: ListItemProps) => void;
export type LocalListDataDeleter = (id: string) => void;

export type LocalCompiledListDataAdder = (
  props: CheckoutJobCompiledListItemProps
) => void;
export type LocalCompiledListDataUpdater = (
  id: string,
  updatedProps: Partial<CheckoutJobCompiledListItemProps>
) => void;
export type LocalCompiledListDataDeleter = (id: string) => void;

export const fetchList = async (date: Date) => {
  const { start, end } = getDaySpan(date);
  const snap = await getDocs(
    query(
      collection(db, "log"),
      where("timestamp", ">=", start),
      where("timestamp", "<=", end),
      orderBy("timestamp", "desc")
    )
  );
  return snap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as ListItemProps)
  );
};

export const subscribeToList = (
  date: Date,
  callback: (items: ListItemProps[]) => void
) => {
  const { start, end } = getDaySpan(date);

  const q = query(
    collection(db, "log"),
    where("timestamp", ">=", start),
    where("timestamp", "<=", end),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(
      (doc) => ({ ...doc.data(), id: doc.id } as ListItemProps)
    );
    callback(items);
  });

  return unsubscribe;
};

export const useMenu = () => {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "menu"));
      return snap.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as MenuItemProps)
      );
    },
    staleTime: 1000 * 60 * 10, // Stale after 10 mins
  });
};

export const useMenuCategories = () => {
  return useQuery({
    queryKey: ["menuCategories"],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, "menuCategories"), orderBy("index", "asc"))
      );
      return snap.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as MenuCategoryProps)
      );
    },
    staleTime: 1000 * 60 * 10, // Stale after 10 mins
  });
};

export const useCustomerList = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, "users"), orderBy("name", "desc"))
      );
      return snap.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as CustomerData)
      );
    },
    staleTime: 1000 * 60 * 10, // Stale after 10 mins
  });
};

export const useCheckoutJobList = () => {
  return useQuery({
    queryKey: ["checkoutJobs"],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, "checkout"), orderBy("timestamp", "desc"))
      );
      return snap.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as CheckoutJobData)
      );
    },
    staleTime: 1000 * 60 * 10, // Stale after 10 mins
  });
};
