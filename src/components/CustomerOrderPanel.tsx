import {
  addDoc,
  collection,
  doc,
  increment,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  CustomerData,
  LocalListDataAdder,
  useMenu,
} from "../utils/dashboardService";
import { nanSafe } from "../utils/nanSafe";
import { db } from "../firebase";

interface Props {
  addLocal: LocalListDataAdder;
  customerData: CustomerData;
}

export default function CustomerOrderPanel({ addLocal, customerData }: Props) {
  const { data: menu, isFetching } = useMenu();

  const [funds, setFunds] = useState(0);
  const [subtractFromFunds, setSubtractFromFunds] = useState(false);
  const [fundSubtraction, setFundSubtraction] = useState(0);

  const [payment, setPayment] = useState(0);
  const [quantityConfig, setQuantityConfig] = useState<number[]>([]);

  const [notes, setNotes] = useState("");

  const [finalPayment, setFinalPayment] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const handleAddEntry = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        name: customerData.name,
        customerId: customerData.id,
        payment: finalPayment,
        originalPayment: payment,
        manualPaymentSet: false,
        manualPayment: 0,
        discount: 0,
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
        online: true,
      };

      const docRef = await addDoc(collection(db, "log"), data);
      addLocal({ ...data, id: docRef.id });

      if (subtractFromFunds) {
        await updateDoc(doc(db, "users", customerData.id), {
          funds: increment(-fundSubtraction),
        });
        setFunds((prevFunds) => prevFunds - fundSubtraction);
      }

      setQuantityConfig(new Array(menu!.length).fill(0)); // Reset qty
      setNotes("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      alert("Order placed! Thank you for your purchase.");
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
    setFunds(customerData.funds);
    if (customerData.funds <= 0) {
      setSubtractFromFunds(false);
    } else {
      setSubtractFromFunds(true);
    }
  }, [customerData]);

  useEffect(() => {
    let final = payment;
    if (subtractFromFunds) {
      const fundSub = Math.min(final, funds);
      final -= fundSub;
      setFundSubtraction(fundSub);
    }
    setFinalPayment(final);
  }, [funds, subtractFromFunds, fundSubtraction, payment]);

  return (
    <div className="w-full flex flex-1 flex-col p-4 bg-amber-100 border border-amber-500 rounded-xl overflow-hidden gap-2">
      {isFetching || !menu ? (
        <div className="w-full h-full flex justify-center items-center">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="w-full flex flex-row items-center justify-between">
            <h1>
              <b className="text-2xl">FastPaws™</b> Online Ordering
            </h1>
            <div className="flex flex-row p-2 border border-amber-500 bg-white rounded-xl gap-4">
              <p>
                Credits: <b>{funds.toLocaleString()} ₩</b>
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={subtractFromFunds}
                  onChange={(e) => setSubtractFromFunds(e.target.checked)}
                  className="w-4 h-4 mr-1"
                  disabled={funds <= 0}
                />
                Use Credits
              </label>
            </div>
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
                      quantityConfig[i] > 0 ? "bg-blue-100" : ""
                    }`}
                    key={i}
                  >
                    <p>{name}</p>
                    {outOfStock ? (
                      <b className="text-red-500">Out of Stock</b>
                    ) : (
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
                    )}
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex justify-center items-center">
                  <p>No Menu Items</p>
                </div>
              )}
            </div>
            <div className="flex flex-col border border-amber-500 bg-white p-2 rounded-xl items-end">
              {payment <= 0 ? (
                <p className="w-full text-center text-gray-500">
                  No items selected
                </p>
              ) : (
                <>
                  <h1 className="w-full text-lg font-bold">Payment Summary</h1>
                  <div className="w-full h-px bg-gray-300 my-1" />
                  {menu!
                    .map(({ name, price }, i) => ({
                      menuLabel: name,
                      price: price,
                      quantity: quantityConfig[i],
                    }))
                    .filter(({ quantity }) => quantity > 0)
                    .map(({ menuLabel, price, quantity }, i) => (
                      <div className="flex w-full items-center" key={i}>
                        <p className="flex-3 text-left">{menuLabel}</p>
                        <p className="flex-1 text-center">{quantity}</p>
                        <p className="flex-2 text-right font-bold">
                          {(price * quantity).toLocaleString()} ₩
                        </p>
                      </div>
                    ))}
                  <div className="w-full h-px bg-gray-300 my-1" />
                  {subtractFromFunds && (
                    <>
                      <p>
                        Subtotal: <b>{payment.toLocaleString()} ₩</b>
                      </p>
                      <p className="text-red-500">
                        Fund Subtraction: -
                        <b>{fundSubtraction.toLocaleString()} ₩</b>
                      </p>
                    </>
                  )}
                  <p className="text-lg">
                    Total Payment: <b>{finalPayment.toLocaleString()} ₩</b>
                  </p>
                </>
              )}
            </div>
            <div className="w-full flex items-center gap-2">
              <input
                type="text"
                placeholder="Deliver to..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex flex-1 border border-amber-500 bg-white p-2 rounded-xl"
              />
              <button
                type="submit"
                disabled={submitting || payment <= 0 || finalPayment < 0}
                className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
              >
                {submitting
                  ? "Submitting..."
                  : `Submit ${finalPayment.toLocaleString()} ₩`}
              </button>
            </div>
            {notes === "" && (
              <p className="font-semibold text-red-500">
                You have not specified a delivery location. Please collect your
                order at Room 403.
              </p>
            )}
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
