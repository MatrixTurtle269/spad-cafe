import { useEffect, useState } from "react";
import {
  MdCheck,
  MdDeleteForever,
  MdMerge,
  MdPayments,
  MdSend,
  MdStackedBarChart,
} from "react-icons/md";
import { CgSpinner } from "react-icons/cg";
import { useQueryClient } from "@tanstack/react-query";
import { db, functions } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
const compile = httpsCallable(functions, "compile");
const merge = httpsCallable(functions, "merge");
const dispatch = httpsCallable(functions, "dispatch");

import dayjs from "dayjs";

import {
  CheckoutJobCompiledListItemProps,
  CheckoutJobData,
  LocalCompiledListDataAdder,
  LocalCompiledListDataDeleter,
  LocalCompiledListDataUpdater,
  useCheckoutJobList,
} from "../utils/dashboardService";
import {
  defaultHeader,
  defaultFooter,
  defaultFootnote,
} from "../utils/emailDefaults";

import CheckoutJobItem from "../components/CheckoutJobItem";
import AddCheckoutJobButton from "../components/AddCheckoutJobButton";
import DurationSelector from "../components/DurationSelector";
import Modal from "../components/Modal";
import CheckoutJobCompiledListItem from "../components/CheckoutJobCompiledListItem";
import AddCheckoutJobCompiledListItemPanel from "../components/AddCheckoutJobCompiledListItemPanel";

export default function Checkout() {
  const queryClient = useQueryClient();
  const { data: checkoutJobs, isFetching } = useCheckoutJobList();
  const [selectedJobIndex, setSelectedJobIndex] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<CheckoutJobData | null>(null);
  const [compiledList, setCompiledList] =
    useState<CheckoutJobCompiledListItemProps[]>();
  const [loading, setLoading] = useState(false);

  const addLocalCompiledListData: LocalCompiledListDataAdder = (props) => {
    setCompiledList((prevList) => [...prevList!, props]);
  };
  const updateLocalCompiledListData: LocalCompiledListDataUpdater = (
    id,
    updatedProps
  ) => {
    setCompiledList((prevList) =>
      prevList!.map((item) =>
        item.id === id ? { ...item, ...updatedProps } : item
      )
    );
    console.log(updatedProps);
  };
  const deleteLocalCompiledListData: LocalCompiledListDataDeleter = (id) => {
    setCompiledList((prevList) => prevList!.filter((item) => item.id !== id));
  };

  const [duration, setDuration] = useState<{ start?: Date; end?: Date }>({
    start: undefined,
    end: undefined,
  });
  const [durationValid, setDurationValid] = useState(false);

  const [compiling, setCompiling] = useState(false);

  // Merge Modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTargetIndex, setMergeTargetIndex] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  // Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [title, setTitle] = useState("");
  const [header, setHeader] = useState(defaultHeader);
  const [footer, setFooter] = useState(defaultFooter);
  const [footnote, setFootnote] = useState(defaultFootnote);

  const handleDelete = async () => {
    const selectedJob = checkoutJobs![selectedJobIndex!];
    try {
      if (confirm(`Are you sure you want to delete "${selectedJob.name}"?`)) {
        setSelectedJobIndex(null); // Reset view
        await deleteDoc(doc(db, "checkout", selectedJob.id));
        queryClient.setQueryData<CheckoutJobData[]>(
          ["checkoutJobs"],
          (prevList) => prevList!.filter((item) => item.id !== selectedJob.id)
        );
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCompile = async () => {
    if (!(duration.start && duration.end)) {
      alert("Invalid duration.");
      return;
    }
    if (!selectedJob) {
      alert("No job selected.");
      return;
    }
    if (
      confirm(
        `Are you sure you want to compile all orders from ${dayjs(
          duration.start
        ).format("M/D/YYYY")} to ${dayjs(duration.end).format(
          "M/D/YYYY"
        )}? This will take a moment.`
      )
    ) {
      try {
        setCompiling(true);
        const res = (
          await compile({
            jobId: selectedJob.id,
            start: duration.start,
            end: duration.end,
          })
        ).data as {
          compiled: CheckoutJobCompiledListItemProps[];
          lastCompInfo: any;
        };
        setSelectedJob((prevData) => ({
          ...prevData!,
          start: duration.start,
          end: duration.end,
          lastCompInfo: res.lastCompInfo,
        }));
        setCompiledList(res.compiled);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setCompiling(false);
      }
    }
  };

  const handleMerge = async () => {
    if (mergeTargetIndex === null) {
      alert("No merge target selected.");
      return;
    }
    if (!selectedJob) {
      alert("No job selected.");
      return;
    }
    if (confirm("Are you sure you want to merge? This will take a moment.")) {
      setMergeModalOpen(false);
      setMerging(true);
      try {
        const res = (
          await merge({
            mergeId: checkoutJobs![mergeTargetIndex].id,
            toId: selectedJob.id,
          })
        ).data as { toList: CheckoutJobCompiledListItemProps[] };
        setCompiledList(res.toList);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setMerging(false);
        setMergeTargetIndex(null);
      }
    }
  };

  const handleDispatch = async () => {
    if (!selectedJob) {
      alert("No job selected.");
      return;
    }
    if (
      confirm("Are you sure you want to dispatch? This will take a moment.")
    ) {
      setDispatchModalOpen(false);
      setDispatching(true);
      try {
        const res = (
          await dispatch({
            title: title,
            header: header,
            footer: footer,
            footnote: footnote,
            jobId: selectedJob.id,
          })
        ).data as { list: CheckoutJobCompiledListItemProps[] };
        setCompiledList(res.list);
      } catch (e: any) {
        alert(e.message);
      } finally {
        setDispatching(false);
      }
    }
  };

  useEffect(() => {
    if (selectedJobIndex === null) {
      setSelectedJob(null);
    } else {
      (async () => {
        setLoading(true);
        try {
          const id = checkoutJobs![selectedJobIndex].id;
          const snap = await getDoc(doc(db, "checkout", id));
          if (snap.exists()) {
            setSelectedJob({ ...snap.data(), id: id } as CheckoutJobData);
            if (snap.data().lastCompInfo) {
              const compSnap = await getDocs(
                query(collection(db, "checkout", id, "compiled"))
              );
              setCompiledList(
                compSnap.docs.map(
                  (doc) =>
                    ({
                      ...doc.data(),
                      id: doc.id,
                    } as CheckoutJobCompiledListItemProps)
                )
              );
            }
          }
        } catch (e: any) {
          alert(e.message);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [selectedJobIndex]);

  useEffect(() => {
    if (selectedJob) {
      setDuration({
        start: selectedJob.start,
        end: selectedJob.end,
      });
    }
  }, [selectedJob]);

  return (
    <>
      <div className="flex w-full h-full pt-16 overflow-clip">
        <div className="fixed w-80 h-full flex-col border-r border-gray-300 overflow-y-scroll">
          {isFetching || !checkoutJobs ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="w-full p-2 border-b border-gray-300">
                <AddCheckoutJobButton
                  setSelectedJobIndex={setSelectedJobIndex}
                />
              </div>
              {checkoutJobs.length > 0 ? (
                checkoutJobs.map((props, i) => (
                  <CheckoutJobItem
                    {...props}
                    index={i}
                    selectedJobIndex={selectedJobIndex}
                    setSelectedJobIndex={setSelectedJobIndex}
                    key={i}
                  />
                ))
              ) : (
                <p className="p-4">No Checkout Jobs. Add one!</p>
              )}
            </>
          )}
        </div>
        <div className="ml-80 w-full h-full flex-col p-4 overflow-scroll">
          {isFetching || !checkoutJobs || loading ? (
            <p>Loading...</p>
          ) : selectedJob === null ? (
            <div className="w-full h-full flex flex-col justify-center items-center gap-4">
              <MdPayments size={96} color="lightgray" />
              <p className="text-gray-400">Choose a Checkout Job</p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <div className="w-full flex flex-row items-center justify-between">
                <h1 className="text-3xl font-bold">{selectedJob.name}</h1>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 p-1 rounded-full cursor-pointer"
                >
                  <MdDeleteForever color="white" size={32} />
                </button>
              </div>
              <DurationSelector
                duration={duration}
                setDuration={setDuration}
                valid={durationValid}
                setValid={setDurationValid}
              />
              <div className="w-full flex flex-row items-center gap-2">
                <div className="flex-1 h-[1px] bg-gray-300" />
                <button
                  disabled={!durationValid || compiling}
                  className="w-48 flex justify-center items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer self-center"
                  onClick={handleCompile}
                >
                  {compiling ? "Compiling..." : "Compile"}
                  <MdStackedBarChart color="white" size={24} />
                </button>
              </div>
              {selectedJob.lastCompInfo ? (
                <>
                  <p className="text-lg">
                    Last compiled on{" "}
                    {dayjs(selectedJob.lastCompInfo.timestamp).format(
                      "M/D/YYYY"
                    )}{" "}
                    - Params:{" "}
                    {dayjs(selectedJob.lastCompInfo.start).format("M/D/YYYY")} ~{" "}
                    {dayjs(selectedJob.lastCompInfo.end).format("M/D/YYYY")}
                  </p>
                  <div className="w-full min-w-[600px] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setMergeModalOpen(true);
                        }}
                        className="w-48 flex justify-center items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-300 p-2 text-white font-bold cursor-pointer"
                      >
                        Merge
                        <MdMerge color="white" size={24} />
                      </button>
                      <button
                        onClick={() => {
                          setDispatchModalOpen(true);
                        }}
                        className="w-48 flex justify-center items-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-400 p-2 text-white font-bold cursor-pointer"
                      >
                        Dispatch
                        <MdSend color="white" size={24} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 rounded-xl bg-gray-200">
                        <p className="text-xl">
                          Total:{" "}
                          <b>
                            {compiledList
                              ?.reduce(
                                (prev, curr) =>
                                  prev + curr.payment + (curr.modifier ?? 0),
                                0
                              )
                              .toLocaleString()}{" "}
                            ₩
                          </b>
                        </p>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-red-200">
                        <p className="text-xl">
                          Remaining:{" "}
                          <b>
                            {compiledList
                              ?.reduce(
                                (prev, curr) =>
                                  prev +
                                  (curr.paid
                                    ? 0
                                    : curr.payment + (curr.modifier ?? 0)),
                                0
                              )
                              .toLocaleString()}{" "}
                            ₩
                          </b>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-[1px] bg-gray-300 my-2" />
                  <div>
                    {compiledList?.map((props, i) => (
                      <CheckoutJobCompiledListItem
                        {...props}
                        parentId={selectedJob.id}
                        updateLocal={updateLocalCompiledListData}
                        deleteLocal={deleteLocalCompiledListData}
                        key={i}
                      />
                    ))}
                  </div>
                  <AddCheckoutJobCompiledListItemPanel
                    jobId={selectedJob.id}
                    addLocal={addLocalCompiledListData}
                  />
                </>
              ) : (
                <p>Not compiled yet</p>
              )}
            </div>
          )}
        </div>
      </div>
      <Modal open={mergeModalOpen} setOpen={setMergeModalOpen}>
        <div className="w-128 overflow-auto flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Merge Payment Data</h1>
          <div className="flex flex-col">
            <p className="border-b pb-2 border-gray-300">
              Select a checkout job to merge to this.
            </p>
            {checkoutJobs?.map(
              ({ name }, i) =>
                i !== selectedJobIndex && (
                  <div
                    onClick={() => {
                      setMergeTargetIndex(i);
                    }}
                    className={`w-full flex items-center justify-between p-2 ${
                      mergeTargetIndex === i ? "bg-gray-100" : ""
                    } hover:bg-gray-200 border-b border-gray-300 cursor-pointer`}
                    key={i}
                  >
                    <p className="text-lg font-semibold">{name}</p>
                    {mergeTargetIndex === i ? (
                      <MdCheck color="green" size={24} />
                    ) : (
                      <p className="text-gray-500 text-sm">Select</p>
                    )}
                  </div>
                )
            )}
          </div>
          {mergeTargetIndex !== null && (
            <>
              <p>
                This will merge <b>{checkoutJobs![mergeTargetIndex].name}</b> to{" "}
                <b>{selectedJob?.name}</b>. Only items marked as "unpaid" will
                be merged. The merged payments will be appended as modifiers.
              </p>
              <button
                onClick={handleMerge}
                className="w-48 rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-300 p-2 text-white font-bold self-end cursor-pointer"
              >
                Proceed
              </button>
            </>
          )}
        </div>
      </Modal>
      <Modal open={dispatchModalOpen} setOpen={setDispatchModalOpen}>
        <div className="w-192 overflow-auto flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Compose Email Dispatch</h1>
          <div>
            <p className="border-b pb-2 mb-4 border-gray-300">
              Below is a preview. Edit the title, header, footer, and footnote
              as necessary.
            </p>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-amber-500 bg-white p-2 mb-4 rounded-xl"
            />
            <p>Hello,</p>
            <textarea
              value={header}
              onChange={(e) => {
                setHeader(e.target.value);
              }}
              placeholder="Compose header..."
              className="w-full h-36 my-2 border border-amber-500 bg-white p-2 rounded-xl"
            />
            <p>
              <b>Your pending payment is: XXX won</b>
            </p>
            <span>Receipt - [NAME]</span>
            <br />
            <span>-------------------------------</span>
            <ul className="list-inside list-disc">
              <li>ITEM 1 x1</li>
              <li>ITEM 2 x2</li>
              <li>ITEM 3 x3</li>
            </ul>
            <span>-------------------------------</span>
            <br />
            <span>Subtotal: XXX won</span>
            <br />
            <span>Modifier: XXX won</span>
            <br />
            <b>Total: XXX won</b>
            <textarea
              value={footer}
              onChange={(e) => {
                setFooter(e.target.value);
              }}
              placeholder="Compose footer..."
              className="w-full h-36 my-2 border border-amber-500 bg-white p-2 rounded-xl"
            />
            <textarea
              value={footnote}
              onChange={(e) => {
                setFootnote(e.target.value);
              }}
              placeholder="Add footnote..."
              className="w-full h-18 my-2 border border-amber-500 bg-white p-2 rounded-xl"
            />
          </div>
          <button
            disabled={title === ""}
            onClick={handleDispatch}
            className="w-48 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-400 disabled:bg-gray-400 p-2 text-white font-bold self-end cursor-pointer"
          >
            Proceed
          </button>
        </div>
      </Modal>
      <Modal open={compiling} setOpen={() => {}} locked>
        <div className="w-96 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">Compiling</h1>
          <CgSpinner size={64} className="animate-spin" />
        </div>
      </Modal>
      <Modal open={merging} setOpen={() => {}} locked>
        <div className="w-96 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">Merging</h1>
          <CgSpinner size={64} className="animate-spin" />
        </div>
      </Modal>
      <Modal open={dispatching} setOpen={() => {}} locked>
        <div className="w-96 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">Dispatching</h1>
          <CgSpinner size={64} className="animate-spin" />
        </div>
      </Modal>
    </>
  );
}
