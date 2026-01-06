import { Timestamp } from "firebase-admin/firestore";

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
export type CheckoutJobCompiledListItemProps = {
  customer: CustomerData;
  receipt: { name: string; quantity: number }[];
  payment: number;
  modifier?: number;
  emailSent: boolean;
  paid: boolean;
  id: string;
};
