import { useEffect, useState } from "react";
import { useAuth } from "./firebase";
import { CgSpinner } from "react-icons/cg";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import Menu from "./pages/Menu";
import Customers from "./pages/Customers";
import Header from "./components/Header";
import Lunch from "./pages/Lunch";
import Vouchers from "./pages/Vouchers";
import CustomerDashboard from "./pages/CustomerDashboard";

const queryClient = new QueryClient();

function FullscreenLoading() {
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <h1 className="text-xl font-bold mb-4">Just a moment...</h1>
      <CgSpinner size={64} className="animate-spin" />
    </div>
  );
}

function RequireAdmin({
  admin,
  children,
}: {
  admin: boolean | null;
  children: React.ReactElement;
}) {
  // App already gates `admin === null` while logged in,
  // but keep this defensive in case we reuse it elsewhere.
  if (admin === null) return <FullscreenLoading />;
  return admin ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      // Auth still resolving: do nothing here (handled by gate below)
      if (loading) return;

      // Logged out
      if (user === null) {
        setAdmin(false);
        return;
      }

      // Logged in: check claims
      setAdmin(null);
      const token = await user.getIdTokenResult();
      setAdmin(Boolean(token.claims.admin));
    })();
  }, [user]);

  // Gate the entire app until auth (and admin claims, if logged in) are resolved.
  if (loading) {
    return <FullscreenLoading />;
  }

  if (user && admin === null) {
    return <FullscreenLoading />;
  }

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
              <Route index element={<CustomerDashboard />} />
              <Route
                path="orders"
                element={
                  <RequireAdmin admin={admin}>
                    <Dashboard />
                  </RequireAdmin>
                }
              />
              <Route
                path="checkout"
                element={
                  <RequireAdmin admin={admin}>
                    <Checkout />
                  </RequireAdmin>
                }
              />
              <Route
                path="menu"
                element={
                  <RequireAdmin admin={admin}>
                    <Menu />
                  </RequireAdmin>
                }
              />
              <Route
                path="customers"
                element={
                  <RequireAdmin admin={admin}>
                    <Customers />
                  </RequireAdmin>
                }
              />
              <Route
                path="lunch"
                element={
                  <RequireAdmin admin={admin}>
                    <Lunch />
                  </RequireAdmin>
                }
              />
              <Route
                path="vouchers"
                element={
                  <RequireAdmin admin={admin}>
                    <Vouchers />
                  </RequireAdmin>
                }
              />
            </Route>
          </Routes>
        </div>
        <Header user={user} admin={admin} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
