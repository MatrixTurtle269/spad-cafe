interface Props {
  loading: boolean;
  revenue: number;
}

export default function TotalPanel({ loading, revenue }: Props) {
  return (
    <div className="w-full flex flex-col p-4 bg-amber-100 border border-amber-500 rounded-xl overflow-hidden mt-4">
      <h1 className="text-xl font-semibold">Total Revenue</h1>
      <p className="text-sm">Ignores discounts and manually set payments.</p>
      <div className="w-full flex justify-center items-center border border-amber-500 bg-white p-2 rounded-xl mt-2">
        {loading ? <p>Loading...</p> : <p className="text-2xl font-bold">{revenue.toLocaleString()} ₩</p>}
      </div>
    </div>
  );
}
