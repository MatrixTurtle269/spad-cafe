import { signOut, User } from "firebase/auth";
import { auth } from "../firebase";
import { MdAccountCircle } from "react-icons/md";
import NavBar from "./Navbar";

export default function Header({
  user,
  admin,
}: {
  user: User | null | undefined;
  admin: boolean | null;
}) {
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
    <header className="w-full h-16 bg-amber-200 pl-2 pr-4 flex items-center gap-12 fixed top-0 shadow-md">
      <div className="flex flex-row items-center">
        <img
          src="https://stpaulacademy.org/img/common/New-daechi-logo.png"
          className="w-14 h-14"
        />
        <img
          src="https://lh3.googleusercontent.com/d/1NjLuJ06X8p2arC9k1PqEQLPLEAAn8eTr"
          className="h-14"
        />
      </div>
      {admin ? <NavBar /> : <div className="flex-1" />}
      <div className="flex flex-row items-center">
        {user && (
          <>
            <div className="flex flex-col items-end mr-2">
              <p>{user?.email}</p>
              <form onSubmit={handleLogout}>
                <button
                  type="submit"
                  className="text-amber-600 underline cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
            <MdAccountCircle size={48} color="gray" />
          </>
        )}
      </div>
    </header>
  );
}
