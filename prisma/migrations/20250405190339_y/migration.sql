/*
  Warnings:

  - You are about to drop the column `category` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `features` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `accounts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `accounts` DROP FOREIGN KEY `accounts_sellerId_fkey`;

-- DropIndex
DROP INDEX `accounts_accountEmail_key` ON `accounts`;

-- AlterTable
ALTER TABLE `accounts` DROP COLUMN `category`,
    DROP COLUMN `features`,
    DROP COLUMN `icon`,
    DROP COLUMN `name`,
    DROP COLUMN `thumbnail`,
    ADD COLUMN `bookedAt` DATETIME(3) NULL,
    ADD COLUMN `bookedUntil` DATETIME(3) NULL,
    ADD COLUMN `isBooked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `orderIdBooking` VARCHAR(191) NULL,
    MODIFY `warranty` INTEGER NOT NULL DEFAULT 30,
    MODIFY `sellerId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isFromAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
