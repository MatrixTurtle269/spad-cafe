import { useState } from "react";
import { db } from "../firebase";
import { updateDoc, deleteDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import { ListItemProps, LocalListDataDeleter, LocalListDataUpdater } from "../utils/dashboardService";
import { MdDeleteForever } from "react-icons/md";
import Modal from "./Modal";

interface Props extends ListItemProps {
  updateLocal: LocalListDataUpdater;
  deleteLocal: LocalListDataDeleter;
}

export default function ListItem({
  name,
  payment,
  originalPayment,
  manualPaymentSet,
  manualPayment,
  discount,
  fundsUsed,
  fundSubtraction,
  notes,
  timestamp,
  details,
  done,
  id,
  updateLocal,
  deleteLocal,
}: Props) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [detailsShown, setDetailsShown] = useState(false);

  const handleDeleteEntry = async () => {
    setDeleting(true);
    try {
      if (confirm("Are you sure you want to delete this item?")) {
        await deleteDoc(doc(db, "log", id));
        deleteLocal(id);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const onChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    updateLocal(id, { done: e.target.checked });
    setUpdating(true);
    try {
      await updateDoc(doc(db, "log", id), { done: e.target.checked });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div className={`w-full flex flex-row items-center justify-between p-2 border-b border-b-gray-300 relative ${deleting ? "opacity-30" : ""}`}>
        <div className="flex flex-1 flex-col items-start">
          <p className="font-bold">{name}</p>
          <p className="text-sm ml-4">- {details.map(({ menuLabel, quantity }) => `${menuLabel} x${quantity}`).join(", ")}</p>
          <p className="text-sm text-gray-500">{notes}</p>
        </div>
        <div className="flex flex-1 justify-center">
          <button onClick={() => setDetailsShown(true)} className="font-bold text-xl text-amber-600 cursor-pointer">
            {(discount > 0 || manualPaymentSet) && <s className="mr-2 opacity-30">{originalPayment.toLocaleString()} ₩</s>}
            {payment.toLocaleString()} ₩
          </button>
        </div>
        <div className="flex flex-1 justify-center">
          <p>{dayjs(timestamp.toDate()).format("h:mm A")}</p>
        </div>
        <div className="flex flex-[0.5] justify-start gap-2">
          <input type="checkbox" checked={done} disabled={updating} onChange={onChangeHandler} className="w-6 h-6" />
          {updating ? (
            <p>Updating...</p>
          ) : done ? (
            <p className="text-green-600 font-semibold">Done</p>
          ) : (
            <p className="text-red-500 font-semibold">Waiting</p>
          )}
        </div>
        <button onClick={handleDeleteEntry} disabled={deleting} className="bg-red-500 p-0.5 rounded-full cursor-pointer">
          <MdDeleteForever color="white" size={24} />
        </button>
      </div>
      <Modal open={detailsShown} setOpen={setDetailsShown}>
        <div className="w-128 overflow-auto flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Transaction Details</h1>
          <div>
            <p>
              Customer: <b>{name}</b>
            </p>
            <p>
              Timestamp: <b>{dayjs(timestamp.toDate()).format("MMMM D, YYYY h:mm A")}</b>
            </p>
            <p>Entry ID: {id}</p>
          </div>
          <div>
            <b>Purchased Items:</b>
            {details.map(({ menuLabel, quantity }) => (
              <p>
                - {menuLabel} / Quantity: {quantity}
              </p>
            ))}
          </div>
          <div>
            {manualPaymentSet ? (
              <>
                <p>
                  <s>
                    Item Total: <b>{originalPayment.toLocaleString()} ₩</b>
                  </s>
                  <i className="text-blue-500 ml-2">Overridden</i>
                </p>
                <p className="text-blue-500">
                  Manual Price: <b>{manualPayment.toLocaleString()} ₩</b>
                </p>
              </>
            ) : (
              <p>
                Item Total: <b>{originalPayment.toLocaleString()} ₩</b>
              </p>
            )}
            <p className="text-red-500">
              Discount: <b>- {discount.toLocaleString()} ₩</b>
            </p>
            {fundsUsed && (
              <p className="text-red-500">
                Funds Used: <b>- {fundSubtraction.toLocaleString()} ₩</b>
              </p>
            )}
            <p>
              Total: <b>{payment.toLocaleString()} ₩</b>
            </p>
          </div>
          <div>
            <b>Notes:</b>
            <p>{notes === "" ? "-" : notes}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
