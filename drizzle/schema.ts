import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRoles = ["Admin", "Vendedor", "Financeiro", "Estoque"] as const;
export const productStatuses = ["ativo", "inativo"] as const;
export const movementTypes = ["compra", "venda", "devolucao", "ajuste_entrada", "ajuste_saida", "perda", "entrada_manual", "saida_manual"] as const;
export const paymentStatuses = ["pendente", "recebido", "pago", "vencido", "cancelado"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("Admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const businessSettings = mysqlTable("businessSettings", {
  id: int("id").autoincrement().primaryKey(),
  dollarQuoteMicros: int("dollarQuoteMicros").notNull().default(5600000),
  minimumMarginBps: int("minimumMarginBps").notNull().default(3000),
  desiredMarginBps: int("desiredMarginBps").notNull().default(5500),
  salesTaxBps: int("salesTaxBps").notNull().default(0),
  packagingCostCents: int("packagingCostCents").notNull().default(0),
  reserveBps: int("reserveBps").notNull().default(500),
  revenueGoalCents: int("revenueGoalCents").notNull().default(1500000),
  profitGoalCents: int("profitGoalCents").notNull().default(450000),
  minimumStock: int("minimumStock").notNull().default(2),
  idleDaysThreshold: int("idleDaysThreshold").notNull().default(60),
  updatedByUserId: int("updatedByUserId").references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dollarQuotes = mysqlTable("dollarQuotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteMicros: int("quoteMicros").notNull(),
  source: varchar("source", { length: 64 }).notNull().default("manual"),
  effectiveAt: timestamp("effectiveAt").defaultNow().notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  company: varchar("company", { length: 160 }),
  phone: varchar("phone", { length: 32 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  country: varchar("country", { length: 80 }),
  city: varchar("city", { length: 120 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  instagram: varchar("instagram", { length: 128 }),
  email: varchar("email", { length: 320 }),
  city: varchar("city", { length: 120 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["novo", "recorrente", "VIP", "inativo"]).notNull().default("novo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const saleChannels = mysqlTable("saleChannels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  feeBps: int("feeBps").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("saleChannels_name_unique").on(table.name)]);

export const paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  feeBps: int("feeBps").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("paymentMethods_name_unique").on(table.name)]);

export const catalogOptions = mysqlTable("catalogOptions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["time", "liga", "colecao", "categoria", "tamanho", "cor", "despesa"]).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  team: varchar("team", { length: 120 }),
  league: varchar("league", { length: 120 }),
  collection: varchar("collection", { length: 120 }),
  category: varchar("category", { length: 80 }),
  shirtType: varchar("shirtType", { length: 40 }),
  size: varchar("size", { length: 40 }),
  predominantColor: varchar("predominantColor", { length: 120 }),
  supplierId: int("supplierId").references(() => suppliers.id),
  supplierUrl: varchar("supplierUrl", { length: 500 }),
  notes: text("notes"),
  imageKey: varchar("imageKey", { length: 512 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  status: mysqlEnum("status", productStatuses).notNull().default("ativo"),
  listPriceCents: int("listPriceCents").notNull().default(0),
  usdValueCents: int("usdValueCents").notNull().default(0),
  quoteMicros: int("quoteMicros").notNull().default(0),
  internationalShippingCents: int("internationalShippingCents").notNull().default(0),
  domesticShippingCents: int("domesticShippingCents").notNull().default(0),
  importFeesCents: int("importFeesCents").notNull().default(0),
  packagingCostCents: int("packagingCostCents").notNull().default(0),
  otherCostsCents: int("otherCostsCents").notNull().default(0),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("products_code_unique").on(table.code)]);

export const productVariants = mysqlTable("productVariants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  label: varchar("label", { length: 120 }).notNull(),
  size: varchar("size", { length: 40 }),
  color: varchar("color", { length: 120 }),
  sku: varchar("sku", { length: 48 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("productVariants_sku_unique").on(table.sku)]);

export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").references(() => suppliers.id),
  purchaseDate: timestamp("purchaseDate").notNull(),
  orderNumber: varchar("orderNumber", { length: 80 }),
  shippingCents: int("shippingCents").notNull().default(0),
  feesCents: int("feesCents").notNull().default(0),
  totalCents: int("totalCents").notNull().default(0),
  paymentMethodId: int("paymentMethodId").references(() => paymentMethods.id),
  paymentStatus: mysqlEnum("paymentStatus", paymentStatuses).notNull().default("pendente"),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchaseItems = mysqlTable("purchaseItems", {
  id: int("id").autoincrement().primaryKey(),
  purchaseId: int("purchaseId").notNull().references(() => purchases.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitCostCents: int("unitCostCents").notNull(),
  totalCostCents: int("totalCostCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryLots = mysqlTable("inventoryLots", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  purchaseItemId: int("purchaseItemId").references(() => purchaseItems.id),
  sourceType: varchar("sourceType", { length: 40 }).notNull().default("compra"),
  receivedAt: timestamp("receivedAt").notNull(),
  initialQuantity: int("initialQuantity").notNull(),
  availableQuantity: int("availableQuantity").notNull(),
  unitCostCents: int("unitCostCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  saleNumber: varchar("saleNumber", { length: 24 }).notNull(),
  soldAt: timestamp("soldAt").notNull(),
  customerId: int("customerId").references(() => customers.id),
  saleChannelId: int("saleChannelId").references(() => saleChannels.id),
  paymentMethodId: int("paymentMethodId").references(() => paymentMethods.id),
  grossCents: int("grossCents").notNull(),
  discountCents: int("discountCents").notNull().default(0),
  channelFeeCents: int("channelFeeCents").notNull().default(0),
  paymentFeeCents: int("paymentFeeCents").notNull().default(0),
  taxCents: int("taxCents").notNull().default(0),
  costCents: int("costCents").notNull().default(0),
  netCents: int("netCents").notNull(),
  profitCents: int("profitCents").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", paymentStatuses).notNull().default("recebido"),
  dueDate: timestamp("dueDate"),
  receivedAt: timestamp("receivedAt"),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("sales_number_unique").on(table.saleNumber)]);

export const saleItems = mysqlTable("saleItems", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull().references(() => sales.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  discountCents: int("discountCents").notNull().default(0),
  unitCostCents: int("unitCostCents").notNull(),
  totalCostCents: int("totalCostCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryMovements = mysqlTable("inventoryMovements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id),
  type: mysqlEnum("type", movementTypes).notNull(),
  quantity: int("quantity").notNull(),
  unitCostCents: int("unitCostCents").notNull().default(0),
  purchaseId: int("purchaseId").references(() => purchases.id),
  saleId: int("saleId").references(() => sales.id),
  notes: text("notes"),
  occurredAt: timestamp("occurredAt").notNull(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  expenseDate: timestamp("expenseDate").notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  amountCents: int("amountCents").notNull(),
  supplierId: int("supplierId").references(() => suppliers.id),
  paymentMethodId: int("paymentMethodId").references(() => paymentMethods.id),
  status: mysqlEnum("status", paymentStatuses).notNull().default("pendente"),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const financialEntries = mysqlTable("financialEntries", {
  id: int("id").autoincrement().primaryKey(),
  kind: mysqlEnum("kind", ["receber", "pagar"]).notNull(),
  sourceType: varchar("sourceType", { length: 40 }).notNull(),
  sourceId: int("sourceId").notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  amountCents: int("amountCents").notNull(),
  status: mysqlEnum("status", paymentStatuses).notNull().default("pendente"),
  dueDate: timestamp("dueDate"),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["estoque_zerado", "estoque_baixo", "margem_baixa", "conta_vencida", "produto_parado", "meta_atingida"]).notNull(),
  severity: mysqlEnum("severity", ["critico", "atencao", "informacao"]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  message: text("message").notNull(),
  referenceType: varchar("referenceType", { length: 40 }),
  referenceId: int("referenceId"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  beforeData: json("beforeData"),
  afterData: json("afterData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
