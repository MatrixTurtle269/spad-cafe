const admin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// admin.auth(app).createUser({uid: "QbmJJLSsAbVoUTU9rAMh", email: "jaeuk.kim@stpaulacademy.org", password: "12345678"}).then((userRecord) => {
//     // See the UserRecord reference doc for the contents of userRecord.
//     console.log('Successfully created new user:', userRecord);
//   }).catch((error) => {
//     console.error('Error creating new user:', error);
//   });

admin.auth(app).setCustomUserClaims("ZDGXTA3XTg5iaApmzipe", { admin: true }).then(() => {
  console.log("Custom claims set for user");
}).catch((error) => {
  console.error("Error setting custom claims:", error);
});