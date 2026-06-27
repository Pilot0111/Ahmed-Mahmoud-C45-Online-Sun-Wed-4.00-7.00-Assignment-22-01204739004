import { BadRequestException } from '@nestjs/common';
import { initializeApp, App, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import path from "node:path";
import { existsSync } from "node:fs";

export class NotificationService {
  private readonly client?: App;
  constructor() {
    let cred;

    // Check for Environment Variables (Best Practice for Production)
    if (
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      cred = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      // Fallback to local file for development (Ensure this is in .gitignore)
      const serviceAccountPath = path.resolve(process.cwd(), "src/config/firebase-service-account.json");
      if (existsSync(serviceAccountPath)) {
        cred = cert(serviceAccountPath);
      } else {
        console.warn("Firebase credentials not found in Environment or local config file.");
      }
    }

    if (cred) {
      this.client = initializeApp({
        credential: cred,
      });
    }
  }

  async sendPushNotification({
    token,
    title,
    body,
  }: {
    token: string;
    title: string;
    body: string;
  }): Promise<string> {
    if (!this.client) {
      throw new BadRequestException("Notification service is not initialized (missing credentials)");
    }
    try {
      const response = await getMessaging(this.client).send({
        notification: { title, body },
        token,
        webpush: {
          notification: {
            title,
            body,
            requireInteraction: true, // Prevents the notification from disappearing automatically
          },
        },
      });
      console.log("Successfully sent message to FCM:", response);
      return response;
    } catch (error: any) {
      console.error("FCM Error sending notification:", error);
      throw new BadRequestException(error.message || "Failed to send notification");
    }
  }
  async sendNotifications({
    tokens,
    title,
    body,
  }: {
    tokens: string[];
    title: string;
    body: string;
  }): Promise<string[]> {
    try {
      const results = await Promise.all(
        tokens.map((token) => this.sendPushNotification({ token, title, body }))
      );
      return results;
    } catch (error: any) {
      console.error("FCM Error sending multicast notification:", error);
      throw new BadRequestException(error.message || "Failed to send notification");
    }
  }
}

export default new NotificationService();
