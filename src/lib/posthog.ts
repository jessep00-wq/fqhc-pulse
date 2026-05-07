import posthog from "posthog-js";

const POSTHOG_KEY = "phc_yykGVwtQWE69AH6RCGH34Se9UFPR4PK9SkdBA9efP2c6";
const POSTHOG_HOST = "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

export function trackPostHogEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(eventName, properties);
}

export function resetPostHog() {
  if (!initialized) return;
  posthog.reset();
}
