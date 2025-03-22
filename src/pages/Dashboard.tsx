import { useEffect, useState } from "react";
import { fetchList, ListItemProps, LocalListDataAdder, LocalListDataDeleter, LocalListDataUpdater } from "../utils/dashboardService";
import dayjs from "dayjs";
import ListItem from "../components/ListItem";
import TotalPanel from "../components/TotalPanel";
import AddEntryPanel from "../components/AddEntryPanel";
import DateSelector from "../components/DateSelector";

export default function Dashboard() {
  const [list, setList] = useState<ListItemProps[]>([]);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [isToday, setIsToday] = useState(true);

  // Aggregation stats
  const [doneCount, setDoneCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const updateLocalListData: LocalListDataUpdater = (id, updatedProps) => {
    setList((prevList) => prevList.map((item) => (item.id === id ? { ...item, ...updatedProps } : item)));
    console.log(updatedProps);
  };
  const addLocalListData: LocalListDataAdder = (props) => {
    setList((prevList) => [props, ...prevList]);
  };
  const deleteLocalListData: LocalListDataDeleter = (id) => {
    setList((prevList) => prevList.filter((item) => item.id !== id));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const listData = await fetchList(date);
      setList(listData);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsToday(dayjs(date).isSame(dayjs(), "day"));
    handleRefresh();
  }, [date]);

  useEffect(() => {
    setDoneCount(list.reduce((prev, curr) => prev + (curr.done ? 1 : 0), 0));
    setRevenue(list.reduce((prev, curr) => prev + curr.originalPayment, 0));
  }, [list]);

  return (
    <div className="w-full flex flex-col gap-4">
      <DateSelector date={date} isToday={isToday} setDate={setDate} />
      <div className="w-full flex flex-1 gap-4">
        <div className="flex-2 flex-col">
          <div className="w-full border-b border-b-gray-300 flex justify-between">
            <p>
              <b className="text-red-500">{list.length - doneCount}</b> waiting / <b className="text-green-600">{doneCount}</b> completed
            </p>
            <p>
              <b>{list.length}</b> total orders
            </p>
          </div>

          <div className="w-full">
            {loading ? (
              <p>Loading...</p>
            ) : list.length > 0 ? (
              list.map((props, i) => <ListItem {...props} updateLocal={updateLocalListData} deleteLocal={deleteLocalListData} key={i} />)
            ) : (
              <div className="w-full h-full flex justify-center items-center">
                <p>No Entries</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex-col">
          <AddEntryPanel addLocal={addLocalListData} />
          <TotalPanel loading={loading} revenue={revenue} />
        </div>
      </div>
    </div>
  );
}
