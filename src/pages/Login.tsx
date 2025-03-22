import { useState } from "react";
import { setPersistence, signInWithEmailAndPassword, browserLocalPersistence } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
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
      <form onSubmit={handleLogin} className="flex flex-col justify-center items-center gap-2">
        <input type="text" placeholder="Email" className="w-96 border border-amber-500 p-2 rounded-xl" onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Password"
          className="w-96 border border-amber-500 p-2 rounded-xl"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 p-2 text-white font-bold cursor-pointer">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
