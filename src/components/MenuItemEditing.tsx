import React, { useState } from "react";
import { MenuItemProps } from "../utils/dashboardService";
import { nanSafe } from "../utils/nanSafe";
import { MdChevronLeft, MdChevronRight, MdClose } from "react-icons/md";

import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../firebase";

interface Props extends MenuItemProps {
  categoryId: string;
  editItem: (itemId: string, data: Partial<MenuItemProps>) => void;
  moveItem: (
    categoryId: string,
    itemId: string,
    direction: "up" | "down",
  ) => void;
  removeItem: (itemId: string) => void;
  setDisableSave: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MenuItemEditing(item: Props) {
  const { categoryId, editItem, moveItem, removeItem, setDisableSave } = item;
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setDisableSave(true);
    setUploadProgress(0);

    const path = `menuImages/${item.id}`;
    const ref = storageRef(storage, path);

    return new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(ref, file, {
        contentType: file.type || "image/jpeg",
      });

      task.on(
        "state_changed",
        (snap) => {
          if (snap.totalBytes > 0) {
            setUploadProgress(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
            );
          }
        },
        (err) => {
          setUploading(false);
          setDisableSave(false);
          alert(`Upload failed: ${err.message}`);
          reject(err);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            editItem(item.id, { imageUrl: url }); // Update item with new image URL
            resolve(url);
          } catch (e: any) {
            alert(`Failed to get download URL: ${e.message}`);
            reject(e);
          } finally {
            setUploading(false);
            setDisableSave(false);
          }
        },
      );
    });
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const onPickFile = () => {
    fileInputRef.current?.click();
  };
  const onRemoveFile = () => {
    if (!confirm("Are you sure you want to remove the image?")) return;
    editItem(item.id, { imageUrl: "" });
  };
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side guard
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      e.target.value = "";
      return;
    }

    try {
      await uploadImage(file);
    } finally {
      // Allow selecting the same file again later
      e.target.value = "";
    }
  };

  return (
    <div
      className="w-64 bg-gray-100 shadow-md rounded-xl p-2 flex flex-col gap-1 relative"
      key={item.id}
    >
      <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        {uploading ? (
          <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
            {uploadProgress.toFixed(0)}%
          </div>
        ) : item.imageUrl ? (
          <>
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 flex items-center gap-1">
              <button
                type="button"
                onClick={onPickFile}
                disabled={uploading}
                className="flex justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-1 text-xs text-white font-bold cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemoveFile}
                className="flex justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-300 p-1 text-xs text-white font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
            <button
              type="button"
              onClick={onPickFile}
              disabled={uploading}
              className="flex justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-sm text-white font-bold cursor-pointer"
            >
              Upload Image
            </button>
          </div>
        )}
      </div>
      <input
        type="text"
        value={item.name}
        onChange={(e) => {
          const newName = e.target.value;
          editItem(item.id, { name: newName });
        }}
        className="text-lg font-bold border border-amber-500 p-1 rounded-lg"
      />
      <div className="w-full flex items-center gap-2">
        <input
          type="number"
          placeholder="Price"
          className="w-full border border-amber-500 bg-white p-2 rounded-xl"
          value={item.price}
          onChange={(e) => {
            const newPrice = parseInt(e.target.value);
            editItem(item.id, { price: nanSafe(newPrice) });
          }}
          min="0"
          max="99999"
          required
        />
        <p className="text-xl">₩</p>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            id={`outOfStockCheckbox-${categoryId}-${item.id}`}
            checked={item.outOfStock}
            onChange={(e) => {
              const newOutOfStock = e.target.checked;
              editItem(item.id, {
                outOfStock: newOutOfStock,
              });
            }}
          />
          <label htmlFor={`outOfStockCheckbox-${categoryId}-${item.id}`}>
            Out of Stock
          </label>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            id={`newTagCheckbox-${categoryId}-${item.id}`}
            checked={item.newTag}
            onChange={(e) => {
              const isNewTag = e.target.checked;
              editItem(item.id, {
                newTag: isNewTag,
              });
            }}
          />
          <label htmlFor={`newTagCheckbox-${categoryId}-${item.id}`}>New</label>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            id={`bestTagCheckbox-${categoryId}-${item.id}`}
            checked={item.bestTag}
            onChange={(e) => {
              const isBestTag = e.target.checked;
              editItem(item.id, {
                bestTag: isBestTag,
              });
            }}
          />
          <label htmlFor={`bestTagCheckbox-${categoryId}-${item.id}`}>
            Best
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          className="cursor-pointer"
          onClick={() => moveItem(categoryId, item.id, "up")}
        >
          <MdChevronLeft size={20} color="black" />
        </button>
        <button
          className="cursor-pointer"
          onClick={() => moveItem(categoryId, item.id, "down")}
        >
          <MdChevronRight size={20} color="black" />
        </button>
      </div>
      <div
        className={
          "absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 cursor-pointer"
        }
        onClick={() => {
          if (!confirm("Are you sure you want to delete this item?")) {
            return;
          }
          removeItem(item.id);
        }}
      >
        <MdClose size={12} color="white" />
      </div>
    </div>
  );
}
