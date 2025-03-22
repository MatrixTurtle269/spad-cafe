import { useCustomerList } from "../utils/dashboardService";
import { useQueryClient } from "@tanstack/react-query";
import { MdRefresh } from "react-icons/md";

interface Props {
  queryKey: string;
}

export default function RefreshButton({ queryKey }: Props) {
  const queryClient = useQueryClient();
  const { isFetching } = useCustomerList();

  return (
    <button
      className="p-1 rounded-full hover:bg-amber-100 cursor-pointer"
      disabled={isFetching}
      onClick={() => {
        if (confirm("Are you sure you want to refresh? Do this only when needed to prevent unnecessary database reads.")) {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }}>
      <MdRefresh size={20} />
    </button>
  );
}
