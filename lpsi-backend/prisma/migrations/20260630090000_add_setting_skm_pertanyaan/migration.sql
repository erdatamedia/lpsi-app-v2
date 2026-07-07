CREATE TABLE `Setting` (
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SkmPertanyaan` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(191) NOT NULL,
  `urutan` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Setting` (`key`, `value`) VALUES ('nomorPrefix', 'SIPUJA');

INSERT INTO `SkmPertanyaan` (`label`, `urutan`) VALUES
  ('Kemudahan prosedur permohonan pengujian', 1),
  ('Kesesuaian persyaratan pengujian', 2),
  ('Kejelasan informasi layanan', 3),
  ('Kedisiplinan dan kesopanan petugas', 4),
  ('Kecepatan pelayanan', 5),
  ('Keadilan dalam pelayanan', 6),
  ('Keramahan dan kesopanan petugas', 7),
  ('Kewajaran biaya pengujian', 8),
  ('Kesesuaian antara biaya yang dibayarkan dan hasil pengujian', 9);
