import { useEffect, useState } from "react";
import { CustomerData, ListItemProps } from "../utils/dashboardService";
import { useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { MdDeleteForever, MdEdit, MdSearch } from "react-icons/md";
import Modal from "./Modal";
import { nanSafe } from "../utils/nanSafe";
import { CgSpinner } from "react-icons/cg";
import dayjs from "dayjs";

interface Props extends CustomerData {}

export default function CustomerItem({ name, email, funds, id }: Props) {
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [nameState, setNameState] = useState(name);
  const [emailState, setEmailState] = useState(email);
  const [fundState, setFundState] = useState(funds);
  const [saving, setSaving] = useState(false);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searching, setSearching] = useState(true);
  const [searchedList, setSearchedList] = useState<ListItemProps[]>([]);

  const handleEdit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: nameState,
        email: emailState,
        funds: nanSafe(fundState),
      };

      await updateDoc(doc(db, "users", id), data);
      queryClient.setQueryData<CustomerData[]>(["customers"], (prevList) =>
        prevList!.map((item) => (item.id === id ? { ...data, id: id } : item))
      );

      setEditModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: any) => {
    e.preventDefault();
    setDeleting(true);
    try {
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        await deleteDoc(doc(db, "users", id));
        queryClient.setQueryData<CustomerData[]>(["customers"], (prevList) =>
          prevList!.filter((item) => item.id !== id)
        );
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = async (e: any) => {
    e.preventDefault();
    setSearching(true);
    try {
      if (confirm(`Are you sure you want to search "${name}"'s entries?`)) {
        setSearchModalOpen(true);
        const snap = await getDocs(
          query(
            collection(db, "log"),
            where("customerId", "==", id),
            orderBy("timestamp", "desc")
          )
        );
        setSearchedList(
          snap.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id } as ListItemProps)
          )
        );
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    setNameState(name);
    setEmailState(email);
    setFundState(funds);
  }, [name, email, funds]);

  return (
    <>
      <div
        className={`w-full flex justify-between items-center p-2 border-b border-b-gray-300 ${
          deleting ? "opacity-30" : ""
        }`}
      >
        <div>
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-sm">{email}</p>
        </div>
        {funds > 0 && <p className="font-bold">{funds.toLocaleString()} ₩</p>}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">{id}</p>
          <button
            onClick={handleSearch}
            disabled={deleting}
            className="bg-gray-500 p-0.5 rounded-full cursor-pointer"
          >
            <MdSearch color="white" size={24} />
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            disabled={deleting}
            className="bg-gray-500 p-0.5 rounded-full cursor-pointer"
          >
            <MdEdit color="white" size={24} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 p-0.5 rounded-full cursor-pointer"
          >
            <MdDeleteForever color="white" size={24} />
          </button>
        </div>
      </div>
      <Modal open={editModalOpen} setOpen={setEditModalOpen}>
        <div className="w-96 flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Edit Customer</h1>
          <form onSubmit={handleEdit} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Name"
              className="w-full border border-amber-500 bg-white p-2 rounded-xl"
              value={nameState}
              onChange={(e) => setNameState(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Email"
              className="w-full border border-amber-500 bg-white p-2 rounded-xl"
              value={emailState}
              onChange={(e) => setEmailState(e.target.value)}
              required
            />
            <div className="w-full flex items-center gap-2">
              <p>Funds: </p>
              <input
                type="number"
                className="w-full border border-amber-500 bg-white p-2 rounded-xl"
                value={fundState}
                onChange={(e) => setFundState(parseInt(e.target.value))}
                min="0"
                required
              />
              <p className="text-xl">₩</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer self-center"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </Modal>
      <Modal open={searchModalOpen} setOpen={setSearchModalOpen}>
        <div className="w-128 h-96 flex-col gap-2 overflow-scroll">
          {searching ? (
            <div className="w-full h-full flex flex-col justify-center items-center">
              <h1 className="text-xl font-bold mb-4">Searching</h1>
              <CgSpinner size={48} className="animate-spin" />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-2">Customer Logs</h1>
              {searchedList.map(({ timestamp, payment, details, notes }, i) => (
                <div
                  className="w-full flex justify-between items-center p-2 border-b border-b-gray-300"
                  key={i}
                >
                  <div>
                    <p className="font-semibold">
                      {dayjs(timestamp.toDate()).format("M/D/YYYY hh:mm A")}
                    </p>
                    <p className="text-sm ml-4">
                      -{" "}
                      {details
                        .map(
                          ({ menuLabel, quantity }) =>
                            `${menuLabel} x${quantity}`
                        )
                        .join(", ")}
                    </p>
                    <p className="text-sm text-gray-500">{notes}</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {payment.toLocaleString()} ₩
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
