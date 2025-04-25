/*
  Warnings:

  - Added the required column `name` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/

-- Pertama, tambahkan kolom dengan NULL untuk sementara
ALTER TABLE `accounts` ADD COLUMN `name` VARCHAR(191) NULL;

-- Mengisi nilai untuk data yang sudah ada
UPDATE `accounts` SET `name` = CONCAT(type, ' Premium Account') WHERE `name` IS NULL;

-- Mengubah kolom menjadi NOT NULL setelah diisi
ALTER TABLE `accounts` MODIFY `name` VARCHAR(191) NOT NULL;

-- Menambahkan kolom lainnya
ALTER TABLE `accounts` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `features` TEXT NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL,
    ADD COLUMN `thumbnail` VARCHAR(191) NULL,
    MODIFY `type` ENUM('NETFLIX', 'SPOTIFY', 'DISNEY', 'AMAZON', 'YOUTUBE', 'APPLE', 'HBO', 'GAMING', 'VPN', 'CLOUD', 'EDUCATION', 'OTHER') NOT NULL;
