-- CreateTable
CREATE TABLE "CutoffConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "cutoffHour" INTEGER NOT NULL DEFAULT 23,
    "cutoffMinute" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "RegistrationOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newStatus" TEXT NOT NULL,
    "note" TEXT,
    "originalStatus" TEXT,
    CONSTRAINT "RegistrationOverride_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RegistrationOverride_registrationId_idx" ON "RegistrationOverride"("registrationId");
