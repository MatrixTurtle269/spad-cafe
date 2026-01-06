import { useEffect, useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MdClose } from "react-icons/md";
import { useQueryClient } from "@tanstack/react-query";
import { MenuItemProps } from "../utils/dashboardService";
import Modal from "./Modal";

interface Props extends MenuItemProps {}

export default function MenuItem({ name, price, outOfStock, id }: Props) {
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);

  const [nameState, setNameState] = useState(name);
  const [priceState, setPriceState] = useState(price);
  const [outOfStockState, setOutOfStockState] = useState(outOfStock || false);
  const [saving, setSaving] = useState(false);

  const handleEdit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: nameState,
        price: priceState,
        outOfStock: outOfStockState,
      };

      await updateDoc(doc(db, "menu", id), data);
      queryClient.setQueryData<MenuItemProps[]>(["menu"], (prevList) =>
        prevList!.map((item) => (item.id === id ? { ...data, id: id } : item))
      );

      setOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (
        confirm(
          `Are you sure you want to delete "${name}"? Deleted menu items will appear as "[Deleted Item]" in receipts.`
        )
      ) {
        await deleteDoc(doc(db, "menu", id));
        queryClient.setQueryData<MenuItemProps[]>(["menu"], (prevMenu) =>
          prevMenu!.filter((item) => item.id !== id)
        );
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setNameState(name);
    setPriceState(price);
    setOutOfStockState(outOfStock || false);
  }, [name, price, outOfStock]);

  return (
    <>
      <div
        className={`w-64 bg-gray-100 shadow-md rounded-xl p-2 flex flex-col justify-between relative ${
          deleting ? "opacity-30" : ""
        }`}
      >
        <p className="text-xl font-semibold">{name}</p>
        <div className="w-full flex items-baseline justify-between">
          <button
            onClick={() => setOpen(true)}
            className="text-amber-600 underline cursor-pointer"
          >
            Edit
          </button>
          {outOfStock ? (
            <p className="self-end text-red-500 font-bold">Out of Stock</p>
          ) : (
            <p className="self-end">{price.toLocaleString()} ₩</p>
          )}
        </div>
        <div
          className={`absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 cursor-pointer ${
            deleting ? "invisible" : ""
          }`}
          onClick={handleDelete}
        >
          <MdClose size={12} color="white" />
        </div>
      </div>
      <Modal open={open} setOpen={setOpen}>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Edit Menu Item</h1>
          <form onSubmit={handleEdit} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Name"
              className="w-96 border border-amber-500 bg-white p-2 rounded-xl"
              value={nameState}
              onChange={(e) => setNameState(e.target.value)}
              required
            />
            <div className="w-96 flex items-center gap-2">
              <input
                type="number"
                placeholder="Price"
                className="w-full border border-amber-500 bg-white p-2 rounded-xl"
                value={priceState}
                onChange={(e) => setPriceState(parseInt(e.target.value))}
                min="0"
                max="99999"
                required
              />
              <p className="text-xl">₩</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="outOfStockCheckbox"
                checked={outOfStockState}
                onChange={(e) => setOutOfStockState(e.target.checked)}
              />
              <label htmlFor="outOfStockCheckbox">Out of Stock</label>
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
    </>
  );
}
