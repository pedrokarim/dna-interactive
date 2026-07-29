export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsProperties = Record<string, AnalyticsPrimitive>;
export type AnalyticsConsent = "granted" | "denied" | "pending";

export interface SarutobiBrowserClient {
  capture(name: string, properties?: AnalyticsProperties): void;
  identify(distinctId: string, properties?: AnalyticsProperties): void;
  reset(): void;
  setConsent(state: AnalyticsConsent): void;
}

declare global {
  interface Window {
    sarutobi?: SarutobiBrowserClient;
  }
}

type PendingAction =
  | { kind: "capture"; name: string; properties?: AnalyticsProperties }
  | { kind: "identify"; distinctId: string; properties?: AnalyticsProperties }
  | { kind: "reset" };

const MAX_PENDING_ACTIONS = 50;
const pending: PendingAction[] = [];
let lastIdentitySignature: string | null = null;

function browserClient(): SarutobiBrowserClient | undefined {
  return typeof window === "undefined" ? undefined : window.sarutobi;
}

function run(action: PendingAction): boolean {
  const client = browserClient();
  if (!client) return false;

  try {
    if (action.kind === "capture") client.capture(action.name, action.properties);
    if (action.kind === "identify") client.identify(action.distinctId, action.properties);
    if (action.kind === "reset") client.reset();
    return true;
  } catch {
    return false;
  }
}

function enqueue(action: PendingAction): void {
  if (run(action)) return;
  if (pending.length >= MAX_PENDING_ACTIONS) pending.shift();
  pending.push(action);
}

export function activateSarutobi(): void {
  const client = browserClient();
  if (!client) return;

  try {
    client.setConsent("granted");
  } catch {
    return;
  }

  while (pending.length > 0) {
    const action = pending.shift();
    if (action && !run(action)) {
      pending.unshift(action);
      break;
    }
  }
}

export function captureAnalytics(name: string, properties?: AnalyticsProperties): void {
  const normalized = name.trim();
  if (!normalized) return;
  enqueue({ kind: "capture", name: normalized, properties });
}

export function identifyAnalytics(distinctId: string, properties?: AnalyticsProperties): void {
  const normalized = distinctId.trim();
  if (!normalized) return;
  const signature = `${normalized}:${JSON.stringify(properties ?? {})}`;
  if (signature === lastIdentitySignature) return;
  lastIdentitySignature = signature;
  enqueue({ kind: "identify", distinctId: normalized, properties });
}

export function resetAnalytics(): void {
  lastIdentitySignature = null;
  enqueue({ kind: "reset" });
}
