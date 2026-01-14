import { useEffect, useState } from "react";
import Modal from "./Modal";
import {
  MdCheckCircleOutline,
  MdDinnerDining,
  MdFoodBank,
  MdHideImage,
} from "react-icons/md";
import { LunchData } from "../utils/dashboardService";
import dayjs from "dayjs";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Rating } from "react-custom-rating-component";

export default function LunchRatingFAB() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // const [ratings, setRatings] = useState<LunchRatingData[]>([]);
  const [details, setDetails] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const [rating, setRating] = useState<number>(2.5);
  const [comments, setComments] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const ratingScale = [
    "Very Bad",
    "Bad",
    "Okay",
    "Good",
    "Excellent",
    "Outstanding",
  ];

  useEffect(() => {
    const dateKey = dayjs(new Date()).format("YYYY-MM-DD");

    const fetchLunchData = async () => {
      setLoading(true);
      try {
        if (!auth.currentUser) return;

        // Check if already responded
        const ratingSnap = await getDoc(
          doc(db, "lunch_feedback", `${dateKey}_${auth.currentUser.uid}`)
        );
        setSubmitted(ratingSnap.exists());

        // Fetch lunch details
        const docSnap = await getDoc(doc(db, "lunch", dateKey));
        if (docSnap.exists()) {
          const data = docSnap.data() as LunchData;
          setDetails(data.details);
          setImageUrl(data.imageUrl);
        } else {
          setDetails("");
          setImageUrl("");
        }
        // const ratingsSnap = await getDocs(
        //   query(
        //     collection(db, "lunch_feedback"),
        //     where("date", "==", dateKey),
        //     orderBy("timestamp", "desc")
        //   )
        // );
        // setRatings(
        //   ratingsSnap.docs.map(
        //     (doc) => ({ ...doc.data(), id: doc.id } as LunchRatingData)
        //   )
        // );
      } catch (e) {
        alert(`Error fetching lunch data: ${e}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLunchData();
  }, []);

  const onSave = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    if (!confirm("Are you sure you want to submit your feedback?")) return;

    setSaving(true);
    try {
      const dateKey = dayjs(new Date()).format("YYYY-MM-DD");
      const user = auth.currentUser;
      if (!user) return;

      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (!userDocSnap.exists()) return;

      const data = {
        date: dateKey,
        rating,
        comments,
        name: userDocSnap.data().name,
        customerId: user.uid,
        timestamp: new Date() as any,
      };

      await setDoc(doc(db, "lunch_feedback", `${dateKey}_${user.uid}`), data);
      setSubmitted(true);
      alert("Thank you for your feedback!");
    } catch (e) {
      alert(`Error saving feedback: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        className="flex items-center gap-1 px-4 py-2 fixed bottom-4 left-4 bg-amber-500 hover:bg-amber-400 text-white text-2xl font-semibold rounded-full cursor-pointer shadow"
        onClick={() => setOpen(true)}
      >
        <MdDinnerDining size={24} />
        Lunch Feedback
        <div className="absolute -top-2 -right-2 px-1 py-0.5 rounded-full text-xs bg-red-500 text-white">
          NEW
        </div>
      </button>
      <Modal open={open} setOpen={setOpen}>
        <div className="max-w-[80vw] flex flex-col items-center gap-4 p-2">
          <MdFoodBank size={64} className="text-amber-500" />
          <h2 className="text-2xl font-bold">SPAD values your feedback!</h2>
          <p>Please take a moment to rate today's lunch.</p>
          {loading ? (
            <p className="text-gray-300">Loading lunch details...</p>
          ) : (
            <>
              <div className="flex gap-4 p-2 rounded-xl bg-gray-100">
                <div className="flex flex-col justify-center items-center w-96">
                  <p className="text-lg font-semibold">
                    {dayjs(new Date()).format("MMMM D, YYYY (dddd)")}
                  </p>
                  <p className="text-center whitespace-pre-wrap">
                    {details || "No details available"}
                  </p>
                </div>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Lunch"
                    className="w-48 h-48 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-xl bg-gray-200 flex flex-col justify-center items-center">
                    <MdHideImage size={48} color="gray" />
                    <span>No Image</span>
                  </div>
                )}
              </div>
              {submitted ? (
                <div className="w-full flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <MdCheckCircleOutline size={24} color="green" />
                    <span className="text-xl text-green-700 font-bold">
                      Thank you for your feedback!
                    </span>
                  </div>
                  <span>Every opinion improves our lunch experience.</span>
                  {/* <span className="my-4">
                    Take a look at what peers are saying.
                  </span>
                  <div className="w-full h-48 rounded-xl bg-gray-100 overflow-scroll p-2">
                    {ratings.length > 0 ? (
                      ratings.map(({ rating, comments, id }) => (
                        <div
                          className="w-full flex gap-2 bg-gray-200 rounded-xl p-2"
                          key={id}
                        >
                          <MdAccountCircle color="gray" size={48} />
                          <div className="w-full flex-col gap-2">
                            <div className="w-full flex justify-between">
                              <Rating
                                defaultValue={rating}
                                size="30px"
                                spacing="3px"
                                precision={0.5}
                                activeColor="orange"
                                defaultColor="lightgray"
                                readOnly
                              />
                            </div>
                            <span>{comments}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full flex flex-col justify-center items-center mt-12">
                        <p className="text-2xl text-gray-300">No Responses</p>
                      </div>
                    )}
                  </div> */}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Rating
                    defaultValue={2.5}
                    size="50px"
                    spacing="5px"
                    precision={0.5}
                    activeColor="orange"
                    defaultColor="lightgray"
                    onChange={(value) => setRating(value)}
                  />
                  <span className="text-lg font-semibold">
                    {Math.floor(rating * 2)} - {ratingScale[Math.floor(rating)]}
                  </span>
                  <textarea
                    placeholder="Leave detailed feedback..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-96 h-32 border border-amber-500 bg-white p-2 rounded-xl"
                  />
                  <span className="text-sm font-bold text-red-500 text-center mb-2">
                    Your response is anonymous. Please leave respectful and
                    constructive feedback.
                  </span>
                  <button
                    className="flex justify-center gap-2 w-48 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 disabled:bg-gray-400 p-2 text-white font-bold cursor-pointer"
                    onClick={onSave}
                    disabled={saving}
                  >
                    {saving ? "Submitting..." : "Submit"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
