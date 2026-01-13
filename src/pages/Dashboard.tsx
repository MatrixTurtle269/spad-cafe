import { useEffect, useState } from "react";
import { subscribeToList, ListItemProps } from "../utils/dashboardService";
import dayjs from "dayjs";
import ListItem from "../components/ListItem";
import AddEntryPanel from "../components/AddEntryPanel";
import DateSelector from "../components/DateSelector";
import { MdList } from "react-icons/md";
import colors from "tailwindcss/colors";

export default function Dashboard() {
  const [list, setList] = useState<ListItemProps[]>([]);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [isToday, setIsToday] = useState(true);

  // Aggregation stats
  const [doneCount, setDoneCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  // const updateLocalListData: LocalListDataUpdater = (id, updatedProps) => {
  //   setList((prevList) =>
  //     prevList.map((item) =>
  //       item.id === id ? { ...item, ...updatedProps } : item
  //     )
  //   );
  //   console.log(updatedProps);
  // };
  // const addLocalListData: LocalListDataAdder = (props) => {
  //   setList((prevList) => [props, ...prevList]);
  // };
  // const deleteLocalListData: LocalListDataDeleter = (id) => {
  //   setList((prevList) => prevList.filter((item) => item.id !== id));
  // };

  useEffect(() => {
    setIsToday(dayjs(date).isSame(dayjs(), "day"));
    setLoading(true);
    const unsubscribe = subscribeToList(date, (items) => {
      setList(items);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [date]);

  useEffect(() => {
    setDoneCount(list.reduce((prev, curr) => prev + (curr.done ? 1 : 0), 0));
    setRevenue(list.reduce((prev, curr) => prev + curr.originalPayment, 0));
  }, [list]);

  return (
    <div className="flex w-screen h-screen gap-4 pt-16">
      <div className="flex-2 flex-col overflow-scroll p-4">
        <div className="w-full bg-gray-100 px-4 p-2 flex justify-between rounded-xl shadow">
          <p>
            <b className="text-red-500">{list.length - doneCount}</b> waiting /{" "}
            <b className="text-green-600">{doneCount}</b> completed /{" "}
            <b>{list.length}</b> total orders
          </p>
          <p>
            Total Revenue: <b>{revenue.toLocaleString()} ₩</b>
          </p>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : list.length > 0 ? (
          list.map((props) => <ListItem {...props} key={props.id} />)
        ) : (
          <div className="w-full flex flex-col justify-center items-center mt-48">
            <MdList size={128} color={colors.gray["300"]} />
            <p className="text-gray-300">No Entries</p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 pr-4 py-4">
        <DateSelector date={date} isToday={isToday} setDate={setDate} />
        <AddEntryPanel />
      </div>
    </div>
  );
}
