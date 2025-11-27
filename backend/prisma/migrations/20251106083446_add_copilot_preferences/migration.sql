/*
  Warnings:

  - You are about to drop the column `summarization` on the `ChatSession` table. All the data in the column will be lost.
  - Made the column `preferredLanguage` on table `StudentProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ChatSession" DROP COLUMN "summarization";

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "topInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "preferredLanguage" SET NOT NULL,
ALTER COLUMN "preferredLanguage" SET DEFAULT 'English';

-- CreateTable
CREATE TABLE "CopilotPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL,
    "interests" JSONB NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopilotPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CopilotPreferences_userId_key" ON "CopilotPreferences"("userId");

-- AddForeignKey
ALTER TABLE "CopilotPreferences" ADD CONSTRAINT "CopilotPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
