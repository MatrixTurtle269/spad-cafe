import React from "react";

interface Props {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}

export default function Modal({ open, setOpen, children }: Props) {
  return (
    <div
      className={`w-screen h-screen fixed top-0 left-0 bg-black/50 flex justify-center items-center z-10 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
      onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white p-4 rounded-xl">
        {children}
      </div>
    </div>
  );
}
