import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { magicLink } from "better-auth/plugins";
import { db } from "./db/index.js";
import * as authSchema from "./db/auth-schema.js";
import { sendMagicLinkEmail } from "./lib/mailer.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
  trustedOrigins: [process.env.BETTER_AUTH_URL!, ...(process.env.ALLOWED_ORIGINS?.split(",") ?? [])],
});

export type AuthUser = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"];
export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["session"];
