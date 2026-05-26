/*
  Warnings:

  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Registration" ("createdAt", "date", "id", "note", "status", "updatedAt", "userId") SELECT "createdAt", "date", "id", "note", "status", "updatedAt", "userId" FROM "Registration";
DROP TABLE "Registration";
ALTER TABLE "new_Registration" RENAME TO "Registration";
CREATE INDEX "Registration_userId_idx" ON "Registration"("userId");
CREATE UNIQUE INDEX "Registration_userId_date_key" ON "Registration"("userId", "date");
CREATE TABLE "new_RegistrationOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "registrationId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newStatus" TEXT NOT NULL,
    "note" TEXT,
    "originalStatus" TEXT,
    CONSTRAINT "RegistrationOverride_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RegistrationOverride" ("id", "newStatus", "note", "originalStatus", "performedAt", "performedBy", "registrationId") SELECT "id", "newStatus", "note", "originalStatus", "performedAt", "performedBy", "registrationId" FROM "RegistrationOverride";
DROP TABLE "RegistrationOverride";
ALTER TABLE "new_RegistrationOverride" RENAME TO "RegistrationOverride";
CREATE INDEX "RegistrationOverride_registrationId_idx" ON "RegistrationOverride"("registrationId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "isActive", "name", "password", "role", "updatedAt", "username") SELECT "createdAt", "id", "isActive", "name", "password", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
