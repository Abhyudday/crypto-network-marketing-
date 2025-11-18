-- AlterTable
ALTER TABLE "BonusHistory" ADD COLUMN "tradingDate" TIMESTAMP(3),
ADD COLUMN "bonusDetails" TEXT;

-- CreateIndex
CREATE INDEX "BonusHistory_tradingDate_idx" ON "BonusHistory"("tradingDate");
