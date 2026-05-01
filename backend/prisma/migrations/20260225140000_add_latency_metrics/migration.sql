-- CreateEnum
CREATE TYPE "LatencyThresholdLevel" AS ENUM ('warn', 'critical');

-- CreateTable
CREATE TABLE "TurnLatencyMetric" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "turnId" TEXT NOT NULL,
    "responseMode" TEXT NOT NULL DEFAULT 'default',
    "route" TEXT NOT NULL DEFAULT 'copilot_chat',
    "forceWebSearch" BOOLEAN NOT NULL DEFAULT false,
    "languageMode" TEXT,
    "source" TEXT,
    "sttMs" INTEGER,
    "firstTokenMs" INTEGER,
    "doneMs" INTEGER,
    "totalMs" INTEGER,
    "ttsStartMs" INTEGER,
    "aiMs" INTEGER,
    "inputChars" INTEGER,
    "outputChars" INTEGER,
    "thresholdBreached" BOOLEAN NOT NULL DEFAULT false,
    "thresholdLevel" "LatencyThresholdLevel",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurnLatencyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LatencyThresholdAlert" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "severity" "LatencyThresholdLevel" NOT NULL,
    "thresholdType" TEXT NOT NULL,
    "thresholdMs" INTEGER NOT NULL,
    "observedMs" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatencyThresholdAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TurnLatencyMetric_studentId_turnId_key" ON "TurnLatencyMetric"("studentId", "turnId");

-- CreateIndex
CREATE INDEX "TurnLatencyMetric_studentId_createdAt_idx" ON "TurnLatencyMetric"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "TurnLatencyMetric_sessionId_createdAt_idx" ON "TurnLatencyMetric"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "TurnLatencyMetric_responseMode_createdAt_idx" ON "TurnLatencyMetric"("responseMode", "createdAt");

-- CreateIndex
CREATE INDEX "TurnLatencyMetric_route_createdAt_idx" ON "TurnLatencyMetric"("route", "createdAt");

-- CreateIndex
CREATE INDEX "TurnLatencyMetric_thresholdBreached_createdAt_idx" ON "TurnLatencyMetric"("thresholdBreached", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LatencyThresholdAlert_metricId_thresholdType_key" ON "LatencyThresholdAlert"("metricId", "thresholdType");

-- CreateIndex
CREATE INDEX "LatencyThresholdAlert_studentId_createdAt_idx" ON "LatencyThresholdAlert"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "LatencyThresholdAlert_severity_createdAt_idx" ON "LatencyThresholdAlert"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "LatencyThresholdAlert_acknowledged_createdAt_idx" ON "LatencyThresholdAlert"("acknowledged", "createdAt");

-- CreateIndex
CREATE INDEX "LatencyThresholdAlert_metricId_idx" ON "LatencyThresholdAlert"("metricId");

-- AddForeignKey
ALTER TABLE "TurnLatencyMetric" ADD CONSTRAINT "TurnLatencyMetric_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LatencyThresholdAlert" ADD CONSTRAINT "LatencyThresholdAlert_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "TurnLatencyMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
