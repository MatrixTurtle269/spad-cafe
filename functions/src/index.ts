import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";
import dayjs from "dayjs";

import type {
  MenuItemProps,
  ListItemProps,
  CustomerData,
  CheckoutJobCompiledListItemProps,
} from "./types";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const compile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Insufficient permissions.");
  }
  const { jobId, start, end } = request.data as {
    jobId: string;
    start: Date;
    end: Date;
  };

  const startTimestamp = Timestamp.fromDate(
    dayjs(start).startOf("day").toDate()
  );
  const endTimestamp = Timestamp.fromDate(
    dayjs(end).add(1, "day").startOf("day").toDate()
  );
  console.log("Start: ", startTimestamp.toDate());
  console.log("End: ", endTimestamp.toDate());

  // Clear existing compilation
  const existingCompSnap = await admin
    .firestore()
    .collection(`checkout/${jobId}/compiled`)
    .get();
  const delBatch = admin.firestore().batch();
  existingCompSnap.docs.forEach((doc) => {
    delBatch.delete(doc.ref);
  });
  await delBatch.commit();

  // Organize menu
  const menuListSnap = await admin.firestore().collection("menu").get();
  const menu = menuListSnap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as MenuItemProps)
  );

  const userListSnap = await admin.firestore().collection("users").get();
  const users = userListSnap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as CustomerData)
  );

  const compiled: CheckoutJobCompiledListItemProps[] = [];

  for (const customer of users) {
    // Match entries
    const matchSnap = await admin
      .firestore()
      .collection("log")
      .where("customerId", "==", customer.id)
      .where("timestamp", ">=", startTimestamp)
      .where("timestamp", "<", endTimestamp)
      .get();
    if (matchSnap.docs.length <= 0) continue; // Skip if no match

    const match = matchSnap.docs.map((doc) => doc.data() as ListItemProps);

    // Accumulate payment
    const totalPayment = match.reduce((prev, curr) => prev + curr.payment, 0);
    if (totalPayment <= 0) continue; // Skip if no payment

    // Write receipt
    const receipt = [];
    const countByMenuId = match.reduce((acc, curr) => {
      curr.details.forEach(({ menuId, quantity }) => {
        acc[menuId] = (acc[menuId] || 0) + quantity;
      });
      return acc;
    }, {} as { [id: string]: number });
    for (const [menuId, quantity] of Object.entries(countByMenuId)) {
      const menuName = menu.find((v) => v.id === menuId)?.name;
      receipt.push({
        name: menuName || "[Deleted Item]",
        quantity: quantity,
      });
    }

    // Write document
    const itemData = {
      customer: customer,
      receipt: receipt,
      payment: totalPayment,
      emailSent: false,
      paid: false,
    };
    const docSnap = await admin
      .firestore()
      .collection(`checkout/${jobId}/compiled`)
      .add(itemData);

    compiled.push({ ...itemData, id: docSnap.id });
  }

  // Update checkout job
  const lastCompInfo = {
    start: start,
    end: end,
    timestamp: new Date().toISOString(),
  };
  await admin.firestore().doc(`checkout/${jobId}`).update({
    lastCompInfo: lastCompInfo,
  });

  return { compiled, lastCompInfo }; // Resolve
});

export const merge = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Insufficient permissions.");
  }
  const { mergeId, toId } = request.data as {
    mergeId: string;
    toId: string;
  };

  const mergeSnap = await admin.firestore().doc(`checkout/${mergeId}`).get();
  if (!mergeSnap.exists)
    throw new HttpsError("internal", "Merge job doesn't exist.");
  if (!mergeSnap.data()?.lastCompInfo)
    throw new HttpsError(
      "internal",
      "The merge target must be compiled first."
    );

  const mergeListSnap = await admin
    .firestore()
    .collection(`checkout/${mergeId}/compiled`)
    .get();
  const mergeList = mergeListSnap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as CheckoutJobCompiledListItemProps)
  );

  const toListSnap = await admin
    .firestore()
    .collection(`checkout/${toId}/compiled`)
    .get();
  const toList = toListSnap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as CheckoutJobCompiledListItemProps)
  );

  for (const mergeItem of mergeList) {
    const totalPayment = mergeItem.payment + (mergeItem.modifier ?? 0);
    const searchIndex = toList.findIndex(
      ({ customer }) => customer.id === mergeItem.customer.id
    );
    if (searchIndex >= 0) {
      toList[searchIndex].modifier =
        (toList[searchIndex].modifier ?? 0) + totalPayment;
    } else {
      const pushData = {
        customer: mergeItem.customer,
        receipt: mergeItem.receipt,
        emailSent: mergeItem.emailSent,
        paid: mergeItem.paid,
        payment: 0,
        modifier: totalPayment,
      };
      const pushItemSnap = await admin
        .firestore()
        .collection(`checkout/${toId}/compiled`)
        .add(pushData);

      toList.push({ ...pushData, id: pushItemSnap.id });
    }
  }

  return { toList };
});

const escapeHTML = (str: string) => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const parseHTML = (str: string) => {
  const lines = str.split("\n");
  const escapedLines = lines.map((line) => escapeHTML(line.trim()));
  const withBreaks = escapedLines.join("<br>");
  return `<p>${withBreaks}</p>`;
};

export const dispatch = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Insufficient permissions.");
  }
  const { title, header, footer, footnote, jobId } = request.data as {
    title: string;
    header: string;
    footer: string;
    footnote: string;
    jobId: string;
  };

  const listSnap = await admin
    .firestore()
    .collection(`checkout/${jobId}/compiled`)
    .get();
  const list = listSnap.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id } as CheckoutJobCompiledListItemProps)
  );

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "spadcafe@gmail.com",
      pass: "dyql onvp kbvr sjpt",
    },
  });

  for (const [i, item] of list.entries()) {
    const totalPayment = item.payment + (item.modifier ?? 0);
    const name = item.customer.name;

    const message = `Hello,
    
    ${header}
    
    Your pending payment is: ${totalPayment.toLocaleString()} won

    Receipt - ${name}
    -------------------------------
    ${item.receipt.reduce((prev, curr, i) => {
      return prev + (i ? "\n- " : "- ") + curr.name + " x" + curr.quantity;
    }, "")}
    -------------------------------
    Subtotal: ${item.payment.toLocaleString()} won
    Modifier: ${item.modifier ? item.modifier.toLocaleString() : "0"} won
    Total: ${totalPayment.toLocaleString()} won
    
    ${footer}
    
    ${footnote}`;

    const html = `<p>Hello,</p>
    ${parseHTML(header)}
    <p><b>Your pending payment is: ${totalPayment.toLocaleString()} won</b></p>
    
    <span>Receipt - ${name}</span><br />
    <span>-------------------------------</span>
    <ul>${item.receipt.reduce((prev, curr, i) => {
      return prev + (i ? "\n" : "") + `<li>${curr.name} x${curr.quantity}</li>`;
    }, "")}</ul>
    <span>-------------------------------</span><br />
    <span>Subtotal: ${item.payment.toLocaleString()} won</span><br />
    <span>Modifier: ${
      item.modifier ? item.modifier.toLocaleString() : "0"
    } won</span><br />
    <b>Total: ${totalPayment.toLocaleString()} won</b>
    ${parseHTML(footer)}
    
    <i>${parseHTML(footnote)}</i>`;

    const res = await transporter.sendMail({
      from: { name: "SPAD Café", address: "spadcafe@gmail.com" },
      to: item.customer.email,
      subject: title,
      text: message,
      html: html,
    });

    const success = res.accepted.length > 0;
    await admin
      .firestore()
      .doc(`checkout/${jobId}/compiled/${item.id}`)
      .update({
        emailSent: success,
      });
    list[i].emailSent = success;
  }

  return { list };
});
