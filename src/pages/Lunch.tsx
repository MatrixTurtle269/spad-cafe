import { useEffect, useRef, useState } from "react";
import { LunchData, LunchRatingData } from "../utils/dashboardService";
import dayjs from "dayjs";
import { Rating } from "react-custom-rating-component";
import Calendar from "react-calendar";
import { MdDelete, MdImage } from "react-icons/md";
import LunchRatingItem from "../components/LunchRatingItem";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import { db, storage } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export default function Lunch() {
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [ratings, setRatings] = useState<LunchRatingData[]>([]);

  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    // Fetch existing lunch data for the selected date
    const fetchLunchData = async () => {
      setLoading(true);
      try {
        const dateKey = dayjs(date).format("YYYY-MM-DD");
        const docSnap = await getDoc(doc(db, "lunch", dateKey));
        if (docSnap.exists()) {
          const data = docSnap.data() as LunchData;
          setDetails(data.details);
          setImageUrl(data.imageUrl);
        } else {
          setDetails("");
          setImageUrl("");
        }
        const ratingsSnap = await getDocs(
          query(
            collection(db, "lunch_feedback"),
            where("date", "==", dateKey),
            orderBy("timestamp", "desc")
          )
        );
        setRatings(
          ratingsSnap.docs.map(
            (doc) => ({ ...doc.data(), id: doc.id } as LunchRatingData)
          )
        );
        setOverallRating(
          ratingsSnap.docs.length > 0
            ? ratingsSnap.docs.reduce(
                (sum, doc) => sum + (doc.data().rating || 0),
                0
              ) / ratingsSnap.docs.length
            : null
        );
      } catch (e) {
        alert(`Error fetching lunch data: ${e}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLunchData();
  }, [date]);

  const uploadLunchImage = async (file: File) => {
    setUploadError("");
    setUploading(true);
    setUploadProgress(0);

    // Use the selected calendar date so each day can have its own image.
    const dateKey = dayjs(date).format("YYYY-MM-DD");

    // Example path: lunch/2026-01-12.jpg
    const path = `lunch/${dateKey}`;
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
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          }
        },
        (err) => {
          setUploading(false);
          setUploadError(err?.message || "Upload failed");
          reject(err);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            setImageUrl(url + `&t=${Date.now()}`);

            const lunchData: LunchData = {
              details,
              imageUrl: url,
              updatedAt: new Date() as any,
            };
            await setDoc(doc(db, "lunch", dateKey), lunchData);

            setUploading(false);
            resolve(url);
          } catch (e: any) {
            setUploading(false);
            setUploadError(e?.message || "Failed to update image URL");
            reject(e);
          }
        }
      );
    });
  };

  const onClearImage = async () => {
    setUploading(true);
    try {
      const dateKey = dayjs(date).format("YYYY-MM-DD");
      const lunchData: LunchData = {
        details,
        imageUrl: "",
        updatedAt: new Date() as any,
      };
      await setDoc(doc(db, "lunch", dateKey), lunchData);
      setImageUrl("");
    } catch (e) {
      alert("Error clearing image");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const dateKey = dayjs(date).format("YYYY-MM-DD");
      const lunchData: LunchData = {
        details,
        imageUrl,
        updatedAt: new Date() as any,
      };
      await setDoc(doc(db, "lunch", dateKey), lunchData);
      alert("Changes saved!");
    } catch (e) {
      alert("Error saving lunch data");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteResponse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      await deleteDoc(doc(db, "lunch_feedback", id));
      setRatings((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert("Error deleting response");
    }
  };

  const onPickFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side guard
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      e.target.value = "";
      return;
    }

    try {
      await uploadLunchImage(file);
    } finally {
      // Allow selecting the same file again later
      e.target.value = "";
    }
  };

  return (
    <div className="flex w-screen h-screen gap-4 pt-16">
      <div className="flex flex-col overflow-scroll p-4">
        <Calendar
          locale="en"
          value={date}
          onClickDay={(v) => {
            setDate(v);
          }}
        />
        {!dayjs(date).isSame(dayjs(), "day") && (
          <button
            className="cursor-pointer underline text-amber-600"
            onClick={() => setDate(new Date())}
          >
            Back to Today
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 justify-center items-center">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-4 pr-4 py-4 border-r border-gray-300">
            <h1 className="text-2xl font-bold">
              {dayjs(date).format("MMMM D, YYYY (dddd)")}
            </h1>
            <div className="w-full h-96 bg-gray-100 rounded-xl overflow-hidden">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />

              {/* Preview if uploaded */}
              {imageUrl ? (
                <div className="w-full h-full">
                  <img
                    src={imageUrl}
                    alt="Lunch"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <button
                    type="button"
                    onClick={onPickFile}
                    disabled={saving || uploading}
                    className="flex justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
                  >
                    <MdImage size={24} />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </button>
                </div>
              )}
            </div>

            {(uploading || uploadError) && (
              <div className="w-full flex flex-col items-center">
                {uploading && (
                  <div className="text-sm text-gray-600">
                    Uploading:{" "}
                    <span className="font-semibold">{uploadProgress}%</span>
                  </div>
                )}
                {uploadError && (
                  <div className="text-sm text-red-600">{uploadError}</div>
                )}
              </div>
            )}

            {imageUrl && (
              <div className="w-full flex justify-center items-center gap-4">
                <button
                  type="button"
                  onClick={onPickFile}
                  disabled={saving || uploading}
                  className="flex justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
                >
                  <MdImage size={24} />
                  {uploading ? "Uploading..." : "Replace Image"}
                </button>
                <button
                  type="button"
                  onClick={onClearImage}
                  disabled={saving || uploading}
                  className="flex justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 active:bg-red-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
                >
                  <MdDelete size={24} />
                  Clear Image
                </button>
              </div>
            )}

            <textarea
              placeholder="What's on the menu today?"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full h-48 border border-amber-500 bg-white p-2 rounded-xl"
            />
            <div className="w-full flex justify-end">
              <button
                className="flex justify-center gap-2 w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
                onClick={onSave}
                disabled={saving || uploading}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 pr-4 py-4">
            <h1 className="text-xl font-bold text-gray-500">Overall Rating</h1>
            <div className="w-full flex justify-center items-center gap-8 border-b border-gray-300 pb-4">
              <Rating
                defaultValue={overallRating || 0}
                size="50px"
                spacing="5px"
                precision={0.5}
                activeColor="orange"
                defaultColor="lightgray"
                readOnly
              />
              <span className="text-xl">
                <span className="text-4xl font-bold text-amber-500">
                  {overallRating ? Math.round(overallRating) : "-"}
                </span>{" "}
                / 5
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-500">
              Survey Responses
            </h1>
            <div className="flex flex-col flex-1 overflow-scroll gap-1">
              {ratings.length > 0 ? (
                ratings.map(({ rating, comments, name, id }) => (
                  <LunchRatingItem
                    rating={rating}
                    comments={comments}
                    name={name}
                    id={id}
                    onDeleteResponse={onDeleteResponse}
                  />
                ))
              ) : (
                <div className="w-full flex flex-col justify-center items-center mt-48">
                  <p className="text-2xl text-gray-300">No Responses</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
