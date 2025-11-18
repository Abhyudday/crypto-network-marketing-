-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'ADJUSTMENT';

-- AlterTable
ALTER TABLE "BonusHistory" ADD COLUMN     "bonusDetails" TEXT,
ADD COLUMN     "tradingDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BonusHistory_tradingDate_idx" ON "BonusHistory"("tradingDate");
