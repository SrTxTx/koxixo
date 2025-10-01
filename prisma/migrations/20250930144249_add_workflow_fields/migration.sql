-- AlterTable
ALTER TABLE "orders" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "approvedById" INTEGER;
ALTER TABLE "orders" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "completedById" INTEGER;
ALTER TABLE "orders" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "deliveredById" INTEGER;
ALTER TABLE "orders" ADD COLUMN "rejectedAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "rejectedById" INTEGER;
ALTER TABLE "orders" ADD COLUMN "rejectionReason" TEXT;
