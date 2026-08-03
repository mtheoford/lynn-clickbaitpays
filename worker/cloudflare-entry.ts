// The OpenNext worker is generated before Wrangler bundles this custom entry.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore generated at build time and intentionally absent before the first build
import handler, { DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";
import { enforceScheduledBillingState, processBillingMessages } from "../lib/stripe-events";
import type { BillingQueueMessage, RuntimeEnv } from "../lib/runtime";

type QueueMessage = {
  body: BillingQueueMessage;
  ack(): void;
  retry(): void;
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

const worker = {
  fetch: handler.fetch,

  queue(
    batch: { messages: QueueMessage[] },
    _env: RuntimeEnv,
    context: ExecutionContext,
  ) {
    context.waitUntil(processBillingMessages(batch.messages));
  },

  scheduled(
    _event: { scheduledTime: number; cron: string },
    _env: RuntimeEnv,
    context: ExecutionContext,
  ) {
    context.waitUntil(enforceScheduledBillingState());
  },
};

export default worker;

export { DOQueueHandler, DOShardedTagCache };
