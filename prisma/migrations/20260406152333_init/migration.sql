-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'grazier');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('dormant', 'growing');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('death', 'purchase', 'sale', 'transfer', 'vaccination', 'treatment');

-- CreateEnum
CREATE TYPE "SrccStatus" AS ENUM ('balanced', 'overstocked');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'grazier',
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "totalAreaHa" DOUBLE PRECISION NOT NULL,
    "financialYearStart" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paddock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeHa" DOUBLE PRECISION NOT NULL,
    "stacRating" INTEGER NOT NULL,
    "kgdmPerHa" DOUBLE PRECISION NOT NULL,
    "totalKgdm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paddock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mob" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minWeightKg" DOUBLE PRECISION NOT NULL,
    "maxWeightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StockClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockFlowEntry" (
    "id" TEXT NOT NULL,
    "mobId" TEXT NOT NULL,
    "stockClassId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL,
    "numberOfAnimals" INTEGER NOT NULL,
    "averageWeightKg" DOUBLE PRECISION NOT NULL,
    "lsu" DOUBLE PRECISION NOT NULL,
    "kgdmu" DOUBLE PRECISION NOT NULL,
    "kgdmTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockFlowEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEvent" (
    "id" TEXT NOT NULL,
    "mobId" TEXT NOT NULL,
    "stockClassId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "StockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrazingPlan" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "seasonType" "SeasonType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPlanDays" INTEGER NOT NULL,
    "srccRatio" DOUBLE PRECISION NOT NULL,
    "srccStatus" "SrccStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrazingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaddockAllocation" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "paddockId" TEXT NOT NULL,
    "mobId" TEXT NOT NULL,
    "grazePeriodDays" DOUBLE PRECISION NOT NULL,
    "surplusDeficitKgdm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaddockAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedEstimate" (
    "id" TEXT NOT NULL,
    "paddockId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "estimatedBiomassKgDmPerHa" DOUBLE PRECISION NOT NULL,
    "growthRateKgDmPerHaPerDay" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StockClass_name_key" ON "StockClass"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paddock" ADD CONSTRAINT "Paddock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mob" ADD CONSTRAINT "Mob_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockFlowEntry" ADD CONSTRAINT "StockFlowEntry_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "Mob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockFlowEntry" ADD CONSTRAINT "StockFlowEntry_stockClassId_fkey" FOREIGN KEY ("stockClassId") REFERENCES "StockClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEvent" ADD CONSTRAINT "StockEvent_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "Mob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEvent" ADD CONSTRAINT "StockEvent_stockClassId_fkey" FOREIGN KEY ("stockClassId") REFERENCES "StockClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEvent" ADD CONSTRAINT "StockEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrazingPlan" ADD CONSTRAINT "GrazingPlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaddockAllocation" ADD CONSTRAINT "PaddockAllocation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "GrazingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaddockAllocation" ADD CONSTRAINT "PaddockAllocation_paddockId_fkey" FOREIGN KEY ("paddockId") REFERENCES "Paddock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaddockAllocation" ADD CONSTRAINT "PaddockAllocation_mobId_fkey" FOREIGN KEY ("mobId") REFERENCES "Mob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEstimate" ADD CONSTRAINT "FeedEstimate_paddockId_fkey" FOREIGN KEY ("paddockId") REFERENCES "Paddock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
