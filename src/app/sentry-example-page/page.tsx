import type { Metadata } from "next";
import { SentryExampleClient } from "./sentry-example-client";

export const metadata: Metadata = {
  title: "sentry-example-page",
  description: "Test Sentry for your Next.js app!",
};

export default function Page() {
  return <SentryExampleClient />;
}
