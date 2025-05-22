/*
  Warnings:

  - You are about to drop the `voucher_usage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vouchers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `voucher_usage` DROP FOREIGN KEY `voucher_usage_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `voucher_usage` DROP FOREIGN KEY `voucher_usage_userId_fkey`;

-- DropForeignKey
ALTER TABLE `voucher_usage` DROP FOREIGN KEY `voucher_usage_voucherId_fkey`;

-- DropTable
DROP TABLE `voucher_usage`;

-- DropTable
DROP TABLE `vouchers`;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `discountAmount` FLOAT NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN `voucherId` VARCHAR(191) NULL;
