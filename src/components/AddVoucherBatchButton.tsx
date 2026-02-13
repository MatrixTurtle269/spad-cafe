import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebase";
import { CustomerData } from "../utils/dashboardService";
import Modal from "./Modal";
import { useQueryClient } from "@tanstack/react-query";
import { MdAdd } from "react-icons/md";

// const values = [3000, 5000, 10000];

export default function AddVoucherBatchButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        name: name,
        email: email,
        funds: 0,
      };

      const docRef = await addDoc(collection(db, "users"), data);
      queryClient.setQueryData<CustomerData[]>(["customers"], (prevList) => [
        { ...data, id: docRef.id },
        ...prevList!,
      ]);

      setOpen(false);
      setName("");
      setEmail("");
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
        Create New Batch
        <MdAdd size={20} />
      </button>
      <Modal open={open} setOpen={setOpen}>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Create New Voucher Batch</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Name"
              className="w-96 border border-amber-500 bg-white p-2 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Email"
              className="w-full border border-amber-500 bg-white p-2 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
