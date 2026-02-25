import {
  addDoc,
  collection,
  doc,
  increment,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  CustomerData,
  LocalListDataAdder,
  MenuItemProps,
  useMenu,
} from "../utils/dashboardService";
import { nanSafe } from "../utils/nanSafe";
import { db } from "../firebase";
import Modal from "./Modal";
import MenuItemOrder from "./MenuItemOrder";

interface Props {
  addLocal: LocalListDataAdder;
  customerData: CustomerData;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CustomerOrderModal({
  addLocal,
  customerData,
  open,
  setOpen,
}: Props) {
  const { data: menu, isFetching } = useMenu();

  const itemById = useMemo(() => {
    const map: Record<string, MenuItemProps> = {};
    if (menu?.items) {
      for (const it of menu.items) map[it.id] = it;
    }
    return map;
  }, [menu]);

  const orderedItems = useMemo(() => {
    if (!menu?.categories) return [] as MenuItemProps[];

    const out: MenuItemProps[] = [];
    for (const cat of menu.categories) {
      for (const id of cat.items) {
        const it = itemById[id];
        if (it) out.push(it);
      }
    }
    return out;
  }, [menu, itemById]);

  const itemIndexById = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < orderedItems.length; i++) {
      map[orderedItems[i].id] = i;
    }
    return map;
  }, [orderedItems]);

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
        details: orderedItems
          .map(({ name, id }, i) => ({
            menuId: id,
            menuLabel: name,
            quantity: quantityConfig[i] ?? 0,
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

      setQuantityConfig(new Array(orderedItems.length).fill(0)); // Reset qty
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
    setQuantityConfig(Array(orderedItems.length).fill(0));
  }, [orderedItems.length]);

  useEffect(() => {
    setPayment(
      orderedItems.length
        ? quantityConfig
            .map((q, i) => nanSafe(q) * (orderedItems[i]?.price ?? 0))
            .reduce((a, b) => a + b, 0)
        : 0,
    ); // Reduce sum
  }, [quantityConfig, orderedItems]);

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
    <Modal open={open} setOpen={setOpen}>
      <div className="w-[70vw] h-[70vh] flex flex-1 p-4 bg-amber-100 border border-amber-500 rounded-xl overflow-hidden gap-2">
        {isFetching || !menu?.items || !menu?.categories ? (
          <div className="w-full h-full flex justify-center items-center">
            <p>Loading...</p>
          </div>
        ) : (
          <form
            onSubmit={handleAddEntry}
            className="w-full flex flex-row gap-4"
          >
            <div className="flex flex-2 flex-col gap-2">
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
              <div className="flex flex-grow min-h-0 overflow-scroll flex-col border border-amber-500 bg-white rounded-xl">
                {menu.categories.length > 0 && orderedItems.length > 0 ? (
                  <div className="flex flex-col">
                    {menu.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <div className="sticky top-0 z-10 bg-gray-100 px-4 py-2 shadow">
                          <p className="font-bold text-gray-800">{cat.title}</p>
                        </div>

                        <div className="w-full grid grid-cols-3 gap-2 p-2">
                          {cat.items
                            .map((id) => itemById[id])
                            .filter(Boolean)
                            .map((item) => {
                              const i = itemIndexById[item.id];
                              const qty = quantityConfig[i] ?? 0;

                              return (
                                <MenuItemOrder
                                  key={item.id}
                                  {...item}
                                  i={i}
                                  qty={qty}
                                  changeItem={changeItem}
                                />
                              );
                            })}

                          {cat.items.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No items in this category
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <p>No Menu Items</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-1 flex-col border border-amber-500 bg-white p-2 rounded-xl items-end">
                {payment <= 0 ? (
                  <p className="w-full mt-16 text-center text-gray-500">
                    No items selected
                  </p>
                ) : (
                  <>
                    <h1 className="w-full text-lg font-bold">
                      Payment Summary
                    </h1>
                    <div className="w-full h-px bg-gray-300 my-1" />
                    {orderedItems
                      .map(({ name, price }, i) => ({
                        menuLabel: name,
                        price: price,
                        quantity: quantityConfig[i] ?? 0,
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
                          Credit Subtraction: -
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
              <input
                type="text"
                placeholder="Deliver to..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border border-amber-500 bg-white p-2 rounded-xl"
              />
              <button
                type="submit"
                disabled={submitting || payment <= 0 || finalPayment < 0}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
              >
                {submitting
                  ? "Submitting..."
                  : `Order ${finalPayment.toLocaleString()} ₩`}
              </button>
              {notes === "" && (
                <p className="font-semibold text-red-500">
                  You have not specified a delivery location. Please collect
                  your order in person on the 1st floor.
                </p>
              )}
              {finalPayment < 0 && (
                <p className="text-sm text-red-500">
                  Payment cannot be less than 0!
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
