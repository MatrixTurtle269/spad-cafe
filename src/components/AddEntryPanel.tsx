import {
  addDoc,
  collection,
  doc,
  increment,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { CustomerData, useMenu } from "../utils/dashboardService";
import { nanSafe } from "../utils/nanSafe";
import { db } from "../firebase";
import SelectCustomerButton from "./SelectCustomerButton";
import { useQueryClient } from "@tanstack/react-query";

export default function AddEntryPanel() {
  const queryClient = useQueryClient();
  const { data: menu, isFetching } = useMenu();

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [funds, setFunds] = useState(0);
  const [subtractFromFunds, setSubtractFromFunds] = useState(false);
  const [fundSubtraction, setFundSubtraction] = useState(0);

  const [payment, setPayment] = useState(0);
  const [quantityConfig, setQuantityConfig] = useState<number[]>([]);

  const [manualPriceEnabled, setManualPriceEnabled] = useState(false);
  const [manualPrice, setManualPrice] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notesEnabled, setNotesEnabled] = useState(false);
  const [notes, setNotes] = useState("");

  const [finalPayment, setFinalPayment] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const handleAddEntry = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        name: customer!.name,
        customerId: customer!.id,
        payment: finalPayment,
        originalPayment: payment,
        manualPaymentSet: manualPriceEnabled,
        manualPayment: nanSafe(manualPrice),
        discount: nanSafe(discount),
        fundsUsed: subtractFromFunds,
        fundSubtraction: fundSubtraction,
        notes: notes,
        timestamp: Timestamp.fromDate(new Date()),
        details: menu!
          .map(({ name, id }, i) => ({
            menuId: id,
            menuLabel: name,
            quantity: quantityConfig[i],
          }))
          .filter(({ quantity }) => quantity > 0),
        done: false,
      };

      await addDoc(collection(db, "log"), data);

      if (subtractFromFunds) {
        await updateDoc(doc(db, "users", customer!.id), {
          funds: increment(-fundSubtraction),
        });
        queryClient.setQueryData<CustomerData[]>(["customers"], (prevList) =>
          prevList!.map((item) =>
            item.id === customer!.id
              ? { ...item, funds: funds - fundSubtraction }
              : item
          )
        );
      }

      setCustomer(null);
      setQuantityConfig(new Array(menu!.length).fill(0)); // Reset qty
      setManualPrice(0);
      setDiscount(0);
      setNotes("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const changeItem = (i: number, q: number) => {
    setQuantityConfig((prevQC) => {
      const configCopy = [...prevQC];
      configCopy[i] = q;
      return configCopy;
    });
  };

  useEffect(() => {
    setQuantityConfig(Array(menu ? menu.length : 0).fill(0));
  }, [menu]);

  useEffect(() => {
    setPayment(
      menu
        ? quantityConfig
            .map((q, i) => nanSafe(q) * menu[i].price)
            .reduce((a, b) => a + b, 0)
        : 0
    ); // Reduce sum
  }, [quantityConfig]);

  useEffect(() => {
    if (customer) {
      setFunds(customer.funds);
      if (customer.funds <= 0) {
        setSubtractFromFunds(false);
      } else {
        setSubtractFromFunds(true);
      }
    } else {
      setFunds(0);
      setSubtractFromFunds(false);
    }
  }, [customer]);

  useEffect(() => {
    let final = manualPriceEnabled ? nanSafe(manualPrice) : payment;
    if (discountEnabled) {
      final -= nanSafe(discount);
    }
    if (subtractFromFunds) {
      const fundSub = Math.min(final, funds);
      final -= fundSub;
      setFundSubtraction(fundSub);
    }
    setFinalPayment(final);
  }, [
    funds,
    subtractFromFunds,
    fundSubtraction,
    payment,
    manualPriceEnabled,
    manualPrice,
    discountEnabled,
    discount,
  ]);

  return (
    <div className="w-full flex flex-1 flex-col p-4 bg-amber-100 border border-amber-500 rounded-xl overflow-hidden gap-2">
      {isFetching || !menu ? (
        <div className="w-full h-full flex justify-center items-center">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <SelectCustomerButton customer={customer} setCustomer={setCustomer} />
          <div
            className={`w-full flex items-center justify-between ${
              customer === null ? "hidden" : ""
            }`}
          >
            <p className="">
              Funds: <b>{funds.toLocaleString()} ₩</b>
            </p>
            <label>
              <input
                type="checkbox"
                checked={subtractFromFunds}
                onChange={(e) => setSubtractFromFunds(e.target.checked)}
                className="w-4 h-4 mr-1"
                disabled={funds <= 0}
              />
              Use Funds
            </label>
          </div>
          <form
            onSubmit={handleAddEntry}
            className="flex flex-grow min-h-0 flex-col gap-2"
          >
            <div className="flex flex-grow min-h-0 overflow-scroll flex-col border border-amber-500 bg-white rounded-xl">
              {menu.length > 0 ? (
                menu.map(({ name, price, outOfStock }, i) => (
                  <div
                    className={`w-full flex flex-row items-center justify-between py-1 pr-2 pl-4 ${
                      outOfStock
                        ? "bg-red-100"
                        : quantityConfig[i] > 0
                        ? "bg-blue-100"
                        : ""
                    }`}
                    key={i}
                  >
                    <p>{name}</p>
                    <div className="flex flex-row items-center gap-1">
                      <p>
                        <b>{price.toLocaleString()} ₩</b> - Qty:
                      </p>
                      <input
                        type="number"
                        value={quantityConfig[i]}
                        onChange={(e) =>
                          changeItem(i, parseInt(e.target.value))
                        }
                        min="0"
                        max="99"
                        step="1"
                        className="bg-gray-100 p-2 rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          changeItem(i, quantityConfig[i] + 1);
                        }}
                        className="w-8 h-8 cursor-pointer bg-green-100 hover:bg-green-200 rounded-lg shadow text-lg font-semibold"
                      >
                        +
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          changeItem(i, Math.max(0, quantityConfig[i] - 1));
                        }}
                        className="w-8 h-8 cursor-pointer bg-red-100 hover:bg-red-200 rounded-lg shadow text-lg font-semibold"
                      >
                        -
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex justify-center items-center">
                  <p>No Menu Items</p>
                </div>
              )}
            </div>
            <div
              className={`w-full flex items-center gap-2 ${
                manualPriceEnabled ? "" : "hidden"
              }`}
            >
              <p className="text-lg">Manual Price Set: </p>
              <input
                type="number"
                className="flex-1 border border-amber-500 bg-white p-2 rounded-xl"
                value={manualPrice}
                onChange={(e) => setManualPrice(parseInt(e.target.value))}
                min="0"
                max="99999"
                required={manualPriceEnabled}
              />
              <p className="text-xl">₩</p>
            </div>
            <div
              className={`w-full flex items-center gap-2 ${
                discountEnabled ? "" : "hidden"
              }`}
            >
              <p className="text-lg text-red-500">Discount: -</p>
              <input
                type="number"
                className="flex-1 border border-amber-500 bg-white p-2 rounded-xl"
                value={discount}
                onChange={(e) => setDiscount(parseInt(e.target.value))}
                min="0"
                max="99999"
              />
              <p className="text-xl">₩</p>
            </div>
            {subtractFromFunds && (
              <div>
                <p className="text-lg text-red-500">
                  Fund Subtraction: -<b>{fundSubtraction.toLocaleString()} ₩</b>
                </p>
                <p className="text-sm text-red-500">
                  Remaining Funds After Transaction:{" "}
                  <b>{(funds - fundSubtraction).toLocaleString()} ₩</b>
                </p>
              </div>
            )}
            {notesEnabled && (
              <textarea
                placeholder="Notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-24 border border-amber-500 bg-white p-2 rounded-xl"
              />
            )}
            <div className="w-full flex justify-between items-center">
              <div className="flex gap-2">
                <label>
                  <input
                    type="checkbox"
                    checked={manualPriceEnabled}
                    onChange={(e) => setManualPriceEnabled(e.target.checked)}
                    className="w-4 h-4 mr-1"
                  />
                  Manual Price
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={discountEnabled}
                    onChange={(e) => setDiscountEnabled(e.target.checked)}
                    className="w-4 h-4 mr-1"
                  />
                  Discount
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={notesEnabled}
                    onChange={(e) => setNotesEnabled(e.target.checked)}
                    className="w-4 h-4 mr-1"
                  />
                  Notes
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting || customer === null || finalPayment < 0}
                className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
              >
                {submitting
                  ? "Submitting..."
                  : `Submit ${finalPayment.toLocaleString()} ₩`}
              </button>
            </div>
            {finalPayment < 0 && (
              <p className="text-sm text-red-500">
                Payment cannot be less than 0!
              </p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
