import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async (e: any) => {
    e.preventDefault();
    if (confirm("Are you sure you want to sign out?")) {
      try {
        await signOut(auth);
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  return (
    <header className="w-full h-16 bg-amber-200 px-4 flex justify-between items-center fixed top-0">
      <div className="flex flex-row items-center gap-2">
        <img src="https://stpaulacademy.org/img/common/New-daechi-logo.png" className="w-12 h-12" />
        <h1 className="text-4xl font-semibold font-serif">SPAD Café</h1>
      </div>
      <div className="flex flex-row items-center">
        {user ? (
          <div className="flex flex-col items-end">
            <p>{user?.email}</p>
            <div className="flex flex-row items-center gap-2">
              <Link to="/dashboard" className="text-blue-500 underline">
                Dashboard
              </Link>
              <form onSubmit={handleLogout}>
                <button type="submit" className="text-amber-600 underline cursor-pointer">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <Link to="/login" className="text-amber-600 underline">
              Login
            </Link>
          </div>
        )}
        <div className="w-12 h-12 ml-4 bg-gray-300 rounded-full" />
      </div>
    </header>
  );
}
