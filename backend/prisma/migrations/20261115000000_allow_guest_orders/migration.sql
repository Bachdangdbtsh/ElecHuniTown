-- Orders can be placed without a customer account.
ALTER TABLE "Order" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "RecipientInfo" ALTER COLUMN "customerId" DROP NOT NULL;
