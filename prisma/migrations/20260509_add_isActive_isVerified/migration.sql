-- Add isActive and isVerified columns to User table
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
