import { Navigate, Outlet } from "react-router-dom";
import { User } from "firebase/auth";
import { CgSpinner } from "react-icons/cg";
import CustomerDashboard from "./CustomerDashboard";
import LunchRatingFAB from "../components/LunchRatingFAB";

export default function DashboardLayout({
  user,
  admin,
}: {
  user: User | null | undefined;
  admin: boolean | null;
}) {
  return user === null ? (
    <Navigate to="/" replace />
  ) : user === undefined || admin === null ? (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <h1 className="text-xl font-bold mb-4">Just a moment...</h1>
      <CgSpinner size={64} className="animate-spin" />
    </div>
  ) : (
    <div className="flex h-full">
      {admin ? <Outlet /> : <CustomerDashboard user={user} />}
      <LunchRatingFAB />
    </div>
  );
}
