import { useEffect, useState } from "react";
import { db } from "../firebase";
import { updateDoc, deleteDoc, doc } from "firebase/firestore";
import dayjs from "dayjs";
import { ListItemProps } from "../utils/dashboardService";
import { MdChevronRight, MdDeleteForever } from "react-icons/md";
import Modal from "./Modal";

interface Props extends ListItemProps {}

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
  online,
  doneIndices,
  id,
}: Props) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [flattenedDetails, setFlattenedDetails] = useState<string[]>([]);
  const [detailsShown, setDetailsShown] = useState(false);

  const flatten = (details: Props["details"]) => {
    const flattenedDetails: string[] = [];
    details.forEach(({ menuLabel, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        flattenedDetails.push(menuLabel);
      }
    });
    return flattenedDetails;
  };

  useEffect(() => {
    setFlattenedDetails(flatten(details));
  }, [details]);

  const handleDeleteEntry = async () => {
    setDeleting(true);
    try {
      if (confirm("Are you sure you want to delete this item?")) {
        await deleteDoc(doc(db, "log", id));
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onDoneChangeHandler = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "log", id), { done: e.target.checked });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const onDoneIndicesChangeHandler = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number | undefined
  ) => {
    setUpdating(true);
    try {
      let newDoneIndices = doneIndices ? [...doneIndices] : [];
      if (e.target.checked) {
        if (index !== undefined && !newDoneIndices.includes(index)) {
          newDoneIndices.push(index);
        }
      } else {
        newDoneIndices = newDoneIndices.filter((i) => i !== index);
      }
      await updateDoc(doc(db, "log", id), {
        done: newDoneIndices.length === flattenedDetails.length,
        doneIndices: newDoneIndices,
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <div
        className={`w-full flex flex-col gap-1 p-2 border-b border-b-gray-300 relative ${
          deleting ? "opacity-30" : ""
        } ${online ? "bg-blue-50" : "bg-white"}`}
      >
        <div className="w-full flex flex-row items-center justify-between">
          <div className="flex flex-1 flex-col items-start">
            <p className="font-bold">{name}</p>
            <p className="text-sm text-gray-500">
              {online && <b className="text-blue-500">Online: </b>}
              {notes}
            </p>
          </div>
          <div className="flex flex-1 justify-center">
            <button
              onClick={() => setDetailsShown(true)}
              className="font-bold text-xl text-amber-600 cursor-pointer"
            >
              {(discount > 0 || manualPaymentSet) && (
                <s className="mr-2 opacity-30">
                  {originalPayment.toLocaleString()} ₩
                </s>
              )}
              {payment.toLocaleString()} ₩
            </button>
          </div>
          <div className="flex flex-1 justify-center">
            <p>{dayjs(timestamp.toDate()).format("h:mm A")}</p>
          </div>
          <div className="flex flex-[0.6] justify-start gap-2">
            <input
              type="checkbox"
              checked={done}
              disabled={updating}
              onChange={onDoneChangeHandler}
              className="w-6 h-6"
            />
            {updating ? (
              <p>Updating...</p>
            ) : done ? (
              <p className="text-green-600 font-semibold">Done</p>
            ) : (
              <p className="text-red-500 font-semibold">
                Waiting ({doneIndices?.length || 0}/{flattenedDetails.length})
              </p>
            )}
          </div>
          <button
            onClick={handleDeleteEntry}
            disabled={deleting}
            className="bg-red-500 p-0.5 rounded-full cursor-pointer"
          >
            <MdDeleteForever color="white" size={24} />
          </button>
        </div>
        <div className="w-full flex gap-1">
          <MdChevronRight size={24} />
          <div className="flex-1 flex flex-wrap gap-2 rounded-lg bg-gray-50">
            {flattenedDetails.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={doneIndices ? doneIndices.includes(index) : false}
                  disabled={updating}
                  onChange={(e) => onDoneIndicesChangeHandler(e, index)}
                  className="w-4 h-4"
                />
                <p
                  className={`text-sm font-semibold ${
                    doneIndices && doneIndices.includes(index)
                      ? "line-through text-gray-500"
                      : ""
                  }`}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal open={detailsShown} setOpen={setDetailsShown}>
        <div className="w-128 overflow-auto flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Transaction Details</h1>
          <div>
            <p>
              Customer: <b>{name}</b>
            </p>
            <p>
              Timestamp:{" "}
              <b>{dayjs(timestamp.toDate()).format("MMMM D, YYYY h:mm A")}</b>
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
