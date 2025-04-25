-- AlterTable
ALTER TABLE `accounts` ADD COLUMN `isFamilyPlan` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `maxSlots` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `orders` MODIFY `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'EXPIRED', 'PAID') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `spotify_slots` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `slotName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isAllocated` BOOLEAN NOT NULL DEFAULT false,
    `isMainAccount` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `orderItemId` VARCHAR(191) NULL,

    UNIQUE INDEX `spotify_slots_orderItemId_key`(`orderItemId`),
    INDEX `spotify_slots_accountId_fkey`(`accountId`),
    INDEX `spotify_slots_userId_fkey`(`userId`),
    INDEX `spotify_slots_orderItemId_fkey`(`orderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `spotify_slots` ADD CONSTRAINT `spotify_slots_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spotify_slots` ADD CONSTRAINT `spotify_slots_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spotify_slots` ADD CONSTRAINT `spotify_slots_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
