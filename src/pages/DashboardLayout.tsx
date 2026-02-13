import { Navigate, Outlet, useLocation } from "react-router-dom";
import { User } from "firebase/auth";

export default function DashboardLayout({
  user,
  admin,
}: {
  user: User | null | undefined;
  admin: boolean | null;
}) {
  const location = useLocation();
  const path = location.pathname;
  const isAdminPath =
    path.includes("/dashboard/orders") ||
    path.includes("/dashboard/menu") ||
    path.includes("/dashboard/customers") ||
    path.includes("/dashboard/lunch") ||
    path.includes("/dashboard/vouchers");

  if (user === null) return <Navigate to="/" replace />;

  if (isAdminPath && admin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-full">
      <Outlet />
    </div>
  );
}
