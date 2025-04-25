/*
  Warnings:

  - A unique constraint covering the columns `[accountEmail]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `accounts_accountEmail_key` ON `accounts`(`accountEmail`);
