import { useState } from "react";
import {
  setPersistence,
  signInWithEmailAndPassword,
  browserLocalPersistence,
  User,
} from "firebase/auth";
import { auth } from "../firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { CgSpinner } from "react-icons/cg";

export default function Login({ user }: { user: User | null | undefined }) {
  if (user === undefined) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <CgSpinner size={64} className="animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <h1 className="text-4xl font-semibold mb-4">Sign in to continue</h1>
      <form
        onSubmit={handleLogin}
        className="flex flex-col justify-center items-center gap-2"
      >
        <input
          type="text"
          placeholder="Email"
          className="w-96 border border-amber-500 p-2 rounded-xl"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-96 border border-amber-500 p-2 rounded-xl"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 p-2 text-white font-bold cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
