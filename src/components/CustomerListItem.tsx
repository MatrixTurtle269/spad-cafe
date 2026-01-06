import { useState } from "react";
import dayjs from "dayjs";
import { ListItemProps } from "../utils/dashboardService";
import Modal from "./Modal";

interface Props extends ListItemProps {}

export default function CustomerListItem({
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
}: Props) {
  const [detailsShown, setDetailsShown] = useState(false);

  return (
    <>
      <div
        className={`w-full flex flex-row items-center justify-between p-3 border border-amber-500 bg-amber-50 rounded-xl relative`}
      >
        <div className="flex flex-1 flex-col items-start">
          <p className="font-semibold">
            {details
              .map(({ menuLabel, quantity }) => `${menuLabel} (${quantity})`)
              .join(", ")}
          </p>
          <p className="text-sm text-gray-500">{notes}</p>
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
        <div className="flex flex-[0.3] justify-start gap-2">
          {done ? (
            <p className="text-green-600 font-semibold">Completed</p>
          ) : (
            <p className="text-red-500 font-semibold">Preparing</p>
          )}
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
