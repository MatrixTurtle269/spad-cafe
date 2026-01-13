import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import Menu from "./pages/Menu";
import Customers from "./pages/Customers";
import Header from "./components/Header";
import Lunch from "./pages/Lunch";

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    (async () => {
      setAdmin(null);
      if (!user) return;
      const token = await user.getIdTokenResult();
      if (token.claims.admin) {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    })();
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="w-full h-full overflow-hidden">
          <Routes>
            <Route path="/" element={<Login user={user} />} />
            <Route
              path="/dashboard"
              element={<DashboardLayout user={user} admin={admin} />}
            >
              <Route index element={<Dashboard />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="menu" element={<Menu />} />
              <Route path="customers" element={<Customers />} />
              <Route path="lunch" element={<Lunch />} />
            </Route>
          </Routes>
        </div>
        <Header user={user} admin={admin} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
