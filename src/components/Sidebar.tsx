import { ReactNode } from "react";
import { NavLink, To } from "react-router-dom";

export default function Sidebar() {
  const NavItem = ({ to, end, children }: { to: To; end?: boolean; children?: ReactNode }) => {
    return (
      <NavLink to={to} end={end} className={({ isActive }) => `text-xl ${isActive ? "font-semibold text-amber-600" : ""}`}>
        {children}
      </NavLink>
    );
  };

  return (
    <div className="h-full flex flex-col items-center p-4 gap-2">
      <NavItem to="/dashboard" end>
        Orders
      </NavItem>
      <NavItem to="/dashboard/menu">Edit Menu</NavItem>
      <NavItem to="/dashboard/customers">Customers</NavItem>
    </div>
  );
}
