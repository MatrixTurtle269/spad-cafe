import { ReactNode } from "react";
import { NavLink, To } from "react-router-dom";

export default function NavBar() {
  const NavItem = ({
    to,
    end,
    children,
  }: {
    to: To;
    end?: boolean;
    children?: ReactNode;
  }) => {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `w-full p-1 rounded-lg text-center ${
            isActive ? "bg-amber-100 text-amber-600 font-semibold" : ""
          }`
        }
      >
        {children}
      </NavLink>
    );
  };

  return (
    <div className="flex flex-1 items-center p-2 bg-white rounded-xl">
      <NavItem to="/dashboard" end>
        Orders
      </NavItem>
      <NavItem to="/dashboard/checkout">Checkout</NavItem>
      <NavItem to="/dashboard/menu">Edit Menu</NavItem>
      <NavItem to="/dashboard/customers">Customers</NavItem>
      <NavItem to="/dashboard/lunch">Lunch</NavItem>
      <NavItem to="/dashboard/vouchers">Vouchers</NavItem>
    </div>
  );
}
