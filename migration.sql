-- Tambahkan unique constraint pada kolom orderId di tabel netflix_profiles
ALTER TABLE `netflix_profiles` ADD UNIQUE INDEX `netflix_profiles_orderId_key` (`orderId`); 