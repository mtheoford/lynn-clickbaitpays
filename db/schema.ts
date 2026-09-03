import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    phone: text("phone").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_users_email_unique").on(table.email),
    uniqueIndex("idx_users_stripe_customer_unique").on(table.stripeCustomerId),
  ],
);

export const sites = sqliteTable(
  "sites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    companyName: text("company_name"),
    displayNameType: text("display_name_type", {
      enum: ["personal", "business"],
    })
      .notNull()
      .default("personal"),
    initials: text("initials").notNull(),
    publicEmail: text("public_email").notNull(),
    publicPhone: text("public_phone").notNull(),
    showEmail: integer("show_email", { mode: "boolean" }).notNull().default(true),
    showPhone: integer("show_phone", { mode: "boolean" }).notNull().default(true),
    bio: text("bio").notNull(),
    referralUrl: text("referral_url").notNull(),
    status: text("status", {
      enum: ["pending", "active", "past_due", "suspended", "canceled", "deleted"],
    })
      .notNull()
      .default("pending"),
    publicationOverride: text("publication_override", {
      enum: ["suspended", "canceled"],
    }),
    sourceSiteId: text("source_site_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    reservationExpiresAt: integer("reservation_expires_at", { mode: "timestamp_ms" }),
    deletionScheduledAt: integer("deletion_scheduled_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_sites_slug_unique").on(table.slug),
    uniqueIndex("idx_sites_checkout_session_unique").on(table.stripeCheckoutSessionId),
    index("idx_sites_user_id").on(table.userId),
    index("idx_sites_status").on(table.status),
    index("idx_sites_deletion_scheduled_at").on(table.deletionScheduledAt),
    index("idx_sites_source_site_id").on(table.sourceSiteId),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    plan: text("plan", { enum: ["monthly", "annual", "complimentary"] }).notNull(),
    status: text("status").notNull(),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
    graceEndsAt: integer("grace_ends_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_subscriptions_stripe_subscription_unique").on(
      table.stripeSubscriptionId,
    ),
    index("idx_subscriptions_user_id").on(table.userId),
    index("idx_subscriptions_site_id").on(table.siteId),
    index("idx_subscriptions_stripe_customer").on(table.stripeCustomerId),
    index("idx_subscriptions_status").on(table.status),
  ],
);

export const magicLinkTokens = sqliteTable(
  "magic_link_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_magic_link_tokens_hash_unique").on(table.tokenHash),
    index("idx_magic_link_tokens_user_id").on(table.userId),
    index("idx_magic_link_tokens_expires_at").on(table.expiresAt),
  ],
);

export const customerSessions = sqliteTable(
  "customer_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_customer_sessions_hash_unique").on(table.tokenHash),
    index("idx_customer_sessions_user_id").on(table.userId),
    index("idx_customer_sessions_expires_at").on(table.expiresAt),
  ],
);

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    siteId: text("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    eventType: text("event_type", { enum: ["page_view", "referral_click", "growth_click"] })
      .notNull(),
    referrerHost: text("referrer_host"),
    visitorHash: text("visitor_hash"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("idx_analytics_events_site_created").on(table.siteId, table.createdAt),
    index("idx_analytics_events_type_created").on(table.eventType, table.createdAt),
  ],
);

export const signupPageEvents = sqliteTable(
  "signup_page_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type", {
      enum: ["page_view", "signup_click", "demo_click"],
    }).notNull(),
    placement: text("placement", {
      enum: ["page", "header", "hero", "product_preview", "closing"],
    }).notNull(),
    visitorHash: text("visitor_hash").notNull(),
    source: text("source"),
    referrerHost: text("referrer_host"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("idx_signup_page_events_created").on(table.createdAt),
    index("idx_signup_page_events_type_created").on(
      table.eventType,
      table.createdAt,
    ),
    index("idx_signup_page_events_visitor_created").on(
      table.visitorHash,
      table.createdAt,
    ),
  ],
);

export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] })
    .notNull()
    .default("pending"),
  payloadJson: text("payload_json").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  receivedAt: integer("received_at", { mode: "timestamp_ms" }).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("idx_audit_logs_target").on(table.targetType, table.targetId),
    index("idx_audit_logs_created_at").on(table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type SponsorSite = typeof sites.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
