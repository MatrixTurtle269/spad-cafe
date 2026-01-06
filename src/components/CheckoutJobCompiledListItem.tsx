import { useEffect, useState } from "react";
import { deleteDoc, deleteField, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  CheckoutJobCompiledListItemProps,
  LocalCompiledListDataDeleter,
  LocalCompiledListDataUpdater,
} from "../utils/dashboardService";
import {
  MdChevronRight,
  MdDeleteForever,
  MdMail,
  MdMarkEmailRead,
} from "react-icons/md";
import Modal from "./Modal";
import { nanSafe } from "../utils/nanSafe";

export default function CheckoutJobCompiledListItem({
  customer,
  receipt,
  payment,
  modifier,
  emailSent,
  paid,
  id,
  parentId,
  updateLocal,
  deleteLocal,
}: CheckoutJobCompiledListItemProps & {
  parentId: string;
  updateLocal: LocalCompiledListDataUpdater;
  deleteLocal: LocalCompiledListDataDeleter;
}) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [modifierState, setModifierState] = useState(modifier);
  const [modifierInputState, setModifierInputState] = useState(modifier ?? 0);
  const [modifierSaving, setModifierSaving] = useState(false);

  const [paidState, setPaidState] = useState(paid);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setModifierState(modifier);
  }, [modifier]);

  useEffect(() => {
    setPaidState(paid);
  }, [paid]);

  const handleModifierEdit = async (e: any) => {
    e.preventDefault();
    setModifierSaving(true);
    try {
      const safe = nanSafe(modifierInputState);
      const newState = safe === 0 ? undefined : safe;
      await updateDoc(doc(db, "checkout", parentId, "compiled", id), {
        modifier: newState ?? deleteField(),
      });
      updateLocal(id, {
        modifier: newState,
      });
      setModifierModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setModifierSaving(false);
    }
  };

  const handlePaidEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLocal(id, {
      paid: e.target.checked,
    });
    setSaving(true);
    try {
      await updateDoc(doc(db, "checkout", parentId, "compiled", id), {
        paid: e.target.checked,
      });
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
      if (
        confirm(
          `Are you sure you want to delete the payment item for "${customer.name}"?`
        )
      ) {
        await deleteDoc(doc(db, "checkout", parentId, "compiled", id));
        deleteLocal(id);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className={`w-full min-w-[800px] flex flex-col gap-2 p-2 border-b border-b-gray-300 ${
          paid ? "bg-green-100" : ""
        } ${deleting ? "opacity-30" : ""}`}
      >
        <div className={"w-full flex flex-row justify-between items-center"}>
          <div className="flex flex-1 flex-row justify-start items-center gap-1">
            <button
              onClick={() => {
                setExpanded(!expanded);
              }}
              className="p-0.5 hover:bg-gray-100 rounded-full cursor-pointer"
            >
              <MdChevronRight
                color="black"
                size={24}
                className={`${expanded ? "rotate-90" : ""}`}
              />
            </button>
            <div>
              <p className="text-md font-semibold">{customer.name}</p>
              <p className="text-xs">{customer.email}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-row justify-end items-center">
            <p
              onClick={() => {
                setModifierModalOpen(true);
              }}
              className="font-bold cursor-pointer"
            >
              {payment.toLocaleString()} ₩
              {modifierState && (
                <span className="text-purple-500">
                  {" "}
                  {modifierState < 0 ? "-" : "+"}{" "}
                  {Math.abs(modifierState).toLocaleString()} ₩ ={" "}
                  {(payment + modifierState).toLocaleString()} ₩
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-1 flex-row justify-center items-center gap-2">
            {emailSent ? (
              <MdMarkEmailRead color="green" size={24} />
            ) : (
              <MdMail color="lightgray" size={24} />
            )}
          </div>
          <div className="flex flex-[0.5] flex-row justify-start items-center gap-2">
            <input
              type="checkbox"
              checked={paidState}
              disabled={saving}
              onChange={handlePaidEdit}
              className="w-6 h-6"
            />
            {saving ? (
              <p>Updating...</p>
            ) : paidState ? (
              <p className="text-green-600 font-semibold">Paid</p>
            ) : (
              <p className="text-red-500 font-semibold">Unpaid</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 p-0.5 rounded-full cursor-pointer"
          >
            <MdDeleteForever color="white" size={24} />
          </button>
        </div>
        {expanded && (
          <div className="w-full p-2 bg-gray-200 rounded-xl">
            {receipt.map(({ name, quantity }, i) => (
              <p className="text-xs" key={i}>
                - {name} x{quantity}
              </p>
            ))}
          </div>
        )}
      </div>
      <Modal open={modifierModalOpen} setOpen={setModifierModalOpen}>
        <div className="w-96 flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Edit Payment</h1>
          <form onSubmit={handleModifierEdit} className="flex flex-col gap-2">
            <p>
              Payment: <b>{payment.toLocaleString()} ₩</b>
            </p>
            <div className="flex items-center gap-2">
              <p>Modifier: </p>
              <input
                type="number"
                value={modifierInputState}
                onChange={(e) =>
                  setModifierInputState(parseInt(e.target.value))
                }
                className="flex-1 border border-amber-500 bg-white p-2 rounded-xl"
              />
              <b>₩</b>
            </div>
            <p>
              Total:{" "}
              <b
                className={
                  nanSafe(modifierInputState) === 0 ? "" : "text-purple-500"
                }
              >
                {(payment + nanSafe(modifierInputState)).toLocaleString()} ₩
              </b>
            </p>
            <button
              type="submit"
              disabled={modifierSaving}
              className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer self-center"
            >
              {modifierSaving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
