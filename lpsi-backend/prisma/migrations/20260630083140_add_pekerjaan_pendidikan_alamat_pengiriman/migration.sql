-- AlterTable
ALTER TABLE `LabRequest` ADD COLUMN `alamatPengiriman` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `pekerjaan` VARCHAR(191) NULL,
    ADD COLUMN `pendidikanTerakhir` VARCHAR(191) NULL;
