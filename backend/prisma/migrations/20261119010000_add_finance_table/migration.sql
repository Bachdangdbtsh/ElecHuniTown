CREATE TABLE "Finance" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cashBalance" BIGINT NOT NULL DEFAULT 0,
    "totalExpense" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Finance_singleton" CHECK ("id" = 1)
);

INSERT INTO "Finance" ("id", "cashBalance", "totalExpense") VALUES (1, 0, 0);
