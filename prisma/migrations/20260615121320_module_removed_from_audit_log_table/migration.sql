/*
  Warnings:

  - You are about to drop the column `module` on the `audit_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "module";
