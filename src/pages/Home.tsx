import { MdConstruction } from "react-icons/md";

export default function Home() {
  return (
    <div>
      <div className="w-full flex flex-col items-center pt-16">
        <MdConstruction size={128} />
        <h1 className="text-6xl font-semibold">Under Development</h1>
        <p className="mt-4 text-xl">Remote Ordering is not ready yet.</p>
      </div>
    </div>
  );
}
