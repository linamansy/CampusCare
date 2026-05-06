/*
  Warnings:

  - You are about to alter the column `title` on the `Issue` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `location` on the `Issue` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "assignedTo" INTEGER,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "location" SET DATA TYPE VARCHAR(200);
