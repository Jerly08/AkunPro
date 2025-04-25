/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `netflix_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `netflix_profiles` ADD COLUMN `orderId` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `paymentUrl` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `netflix_profiles_orderId_key` ON `netflix_profiles`(`orderId`);

-- CreateIndex
CREATE INDEX `netflix_profiles_userId_fkey` ON `netflix_profiles`(`userId`);

-- CreateIndex
CREATE INDEX `netflix_profiles_orderId_fkey` ON `netflix_profiles`(`orderId`);

-- AddForeignKey
ALTER TABLE `netflix_profiles` ADD CONSTRAINT `netflix_profiles_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `netflix_profiles` ADD CONSTRAINT `netflix_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
