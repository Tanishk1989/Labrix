-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterTable: existing users receive ACTIVE without changing their IDs or relations.
ALTER TABLE "User"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable: identity links are optional, so seeded users remain unlinked.
CREATE TABLE "ExternalIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSubject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- A provider subject identifies at most one local Labrix user.
CREATE UNIQUE INDEX "ExternalIdentity_provider_providerSubject_key"
ON "ExternalIdentity"("provider", "providerSubject");

-- A local user has at most one identity from a given provider.
CREATE UNIQUE INDEX "ExternalIdentity_userId_provider_key"
ON "ExternalIdentity"("userId", "provider");

ALTER TABLE "ExternalIdentity"
ADD CONSTRAINT "ExternalIdentity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
