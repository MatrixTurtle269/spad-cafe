import { addDoc, collection, Timestamp } from "firebase/firestore";
import { Dispatch, SetStateAction, useState } from "react";
import { db } from "../firebase";
import { CheckoutJobData } from "../utils/dashboardService";
import Modal from "./Modal";
import { useQueryClient } from "@tanstack/react-query";
import { MdAdd } from "react-icons/md";

interface Props {
  setSelectedJobIndex: Dispatch<SetStateAction<number | null>>;
}

export default function AddCheckoutJobButton({ setSelectedJobIndex }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        name: name,
        processed: false,
        timestamp: Timestamp.fromDate(new Date()),
      };

      const docRef = await addDoc(collection(db, "checkout"), data);
      queryClient.setQueryData<CheckoutJobData[]>(
        ["checkoutJobs"],
        (prevList) => [{ ...data, id: docRef.id }, ...prevList!]
      );

      setOpen(false);
      setName("");
      setSelectedJobIndex(0); // Select the one just created
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-full cursor-pointer"
        onClick={() => setOpen(true)}
      >
        Add New
        <MdAdd size={20} />
      </button>
      <Modal open={open} setOpen={setOpen}>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">New Checkout Job</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Name"
              className="w-96 border border-amber-500 bg-white p-2 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer self-center"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
