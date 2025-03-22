const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const XLSX = require("xlsx");
const { join } = require("path");
const { cwd } = require("process");

const serviceAccount = require("../serviceAccountKey.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = getFirestore(app);

const userListWorkbook = XLSX.readFile(join(cwd(), "scripts", "studentList.xlsx"));
console.log("Successfully imported sheet.");

const sheetName = userListWorkbook.SheetNames[0];
const sheet = userListWorkbook.Sheets[sheetName];

let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
rows = rows.filter((row) => row.length > 0);
rows.splice(0, 1); // Remove first row

const createUsers = async () => {
  // Delete all existing users
  try {
    const batch = db.batch();

    const snapshot = await db.collection("users").get();
    snapshot.forEach((docRef) => batch.delete(docRef));

    await batch.commit();
    console.log("Deleted users.");
  } catch (error) {
    console.error("Error while deleting users: ", error);
  }

  for (user of rows) {
    try {
      const name = user[1] ? `${user[0]} (${user[1]})` : user[0];

      const res = await db.collection("users").add({
        name: name,
        email: user[2],
        funds: 0,
      });

      console.log("Successfully created user ", name, " with id ", res.id);
    } catch (error) {
      console.error("Error creating new user:", error);
    }
  }
};

createUsers().then(() => app.delete());
