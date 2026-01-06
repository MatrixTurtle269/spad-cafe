import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebase";
import {
  CustomerData,
  LocalCompiledListDataAdder,
} from "../utils/dashboardService";
import { nanSafe } from "../utils/nanSafe";
import SelectCustomerButton from "./SelectCustomerButton";

interface Props {
  jobId: string;
  addLocal: LocalCompiledListDataAdder;
}

export default function AddCheckoutJobCompiledListItemPanel({
  jobId,
  addLocal,
}: Props) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [payment, setPayment] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!customer) {
      alert("No customer selected");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        customer: customer,
        receipt: [],
        payment: nanSafe(payment),
        emailSent: false,
        paid: false,
      };

      const docRef = await addDoc(
        collection(db, "checkout", jobId, "compiled"),
        data
      );
      addLocal({ ...data, id: docRef.id });

      setCustomer(null);
      setPayment(0);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-[800px] mt-4 flex flex-col p-4 bg-amber-100 border border-amber-500 rounded-xl gap-2 self-center">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex flex-1">
          <SelectCustomerButton customer={customer} setCustomer={setCustomer} />
        </div>
        <div className="flex flex-1 gap-2 items-center">
          <input
            type="number"
            className="flex flex-1 border border-amber-500 bg-white p-2 rounded-xl"
            value={payment}
            onChange={(e) => setPayment(parseInt(e.target.value))}
            required
          />
          <p className="text-xl">₩</p>
        </div>
        <button
          type="submit"
          disabled={submitting || customer === null}
          className="w-32 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 ml-8 text-white font-bold cursor-pointer self-center"
        >
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}
