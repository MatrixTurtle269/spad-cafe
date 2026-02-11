import { Navigate, Outlet, useLocation } from "react-router-dom";
import { User } from "firebase/auth";
import Modal from "../components/Modal";
import { MdConstruction } from "react-icons/md";

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
      <Modal open={true} setOpen={() => {}}>
        <div className="w-128 p-4 bg-white rounded-lg flex flex-col items-center gap-4">
          <MdConstruction size={48} />
          <h1 className="text-2xl font-bold">Maintenance Notice</h1>
          <p className="text-center">Dear Customers,</p>
          <p className="text-center">
            Due to internal maintenance and preparations for upcoming events,
            the Badger Brews™ STUCO Cafe will be{" "}
            <b>closed today (Thursday, February 12th).</b> We apologize for the
            inconvenience.
          </p>
          <p className="text-center">
            Sincerely,
            <br />
            Hyunjin Nam, STUCO President
          </p>
        </div>
      </Modal>
    </div>
  );
}
