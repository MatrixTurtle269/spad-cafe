const crypto = require("crypto");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const serviceAccount = require("../serviceAccountKey.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = getFirestore(app);

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "spadcafe@gmail.com",
      pass: "dyql onvp kbvr sjpt",
    },
  });

const createUsers = async () => {
    try {
        const users = [];
        const usersSnapshot = await db.collection("users").get();
        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const exists = await admin.auth().getUser(doc.id).then(() => true).catch(() => false);
            if (!exists) {
                users.push({
                    id: doc.id,
                    email: data.email,
                    name: data.name,
                });
            }
        }

        const rl = readline.createInterface({ input, output });
        await rl.question(`Found ${users.length} users without Firebase accounts (${users.map(u => u.email).join(", ")}). Proceed?`);
        console.log("Confirmed, proceeding.");

        for (const user of users) {
            const password = crypto.randomBytes(6).toString("base64"); // ~8 chars, high entropy
            try {
                const userRecord = await admin.auth().createUser({
                    uid: user.id,
                    email: user.email,
                    password: password,
                });
                console.log('Successfully created new user for ', user.name, ': ', userRecord.uid);
            } catch (e) {
                console.error("Error creating new user: ", e);
                continue;
            }

            const message = `Hello,

Thank you for being a valued customer at the Badger Brews™ STUCO Cafe.

This email contains your login credentials to our FastPaws™ online ordering system, where you will be able to place orders online, request deliveries, and view your transaction history.
Please keep this information secure and do not share it with others.

Login Credentials — ${user.name}
-------------------------
Email: ${user.email}
Password: ${password}
-------------------------

You can access our website through: https://spad-cafe.web.app

If you have any questions or need assistance, please do not hesitate to reach out to: hyunjin.nam@stpaulacademy.org
Again, thank you for choosing Badger Brews™! We look forward to serving you through our online infrastructure.

Sincerely,
Hyunjin Nam, STUCO President`;

            const res = await transporter.sendMail({
                from: { name: "SPAD Café", address: "spadcafe@gmail.com" },
                to: user.email,
                subject: "STUCO Cafe Online Ordering System",
                text: message.trim(),
            });

            const success = res.accepted.length > 0;
            if (success) {
                console.log(`Email sent successfully to ${user.email}`);
            } else {
                console.error(`Failed to send email to ${user.email}: ${res.rejected.join(", ")}`);
            }
       }    
    } catch(e) {
        console.error(e);
    } finally {
        await app.delete();
    }
}

createUsers();