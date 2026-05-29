-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('PEMOHON', 'ADMIN') NOT NULL DEFAULT 'PEMOHON',
    `jenisKelamin` VARCHAR(191) NULL,
    `tanggalLahir` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `activateToken` VARCHAR(191) NULL,
    `resetToken` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomorPermohonan` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `namaPemohon` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `noHp` VARCHAR(191) NOT NULL,
    `emailPemohon` VARCHAR(191) NOT NULL,
    `tanggalPermohonan` DATETIME(3) NOT NULL,
    `suratPengantar` VARCHAR(191) NULL,
    `status` ENUM('MENUNGGU_SAMPEL', 'SAMPEL_DITERIMA', 'VERIFIKASI', 'MENUNGGU_PEMBAYARAN', 'LUNAS', 'ON_PROGRESS', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU_SAMPEL',
    `totalTagihan` DECIMAL(65, 30) NULL,
    `kodeBilling` VARCHAR(191) NULL,
    `buktiBayar` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LabRequest_nomorPermohonan_key`(`nomorPermohonan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sample` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `namaSampel` VARCHAR(191) NOT NULL,
    `beratBasah` DOUBLE NULL,
    `beratKering` DOUBLE NULL,
    `kemasan` VARCHAR(191) NULL,
    `jenisUji` JSON NOT NULL,
    `hargaTotal` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('MENUNGGU', 'DITERIMA', 'OK', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU',
    `alasanTolak` VARCHAR(191) NULL,
    `lhpFile` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IKM` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `jawaban` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `IKM_requestId_key`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LabRequest` ADD CONSTRAINT `LabRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sample` ADD CONSTRAINT `Sample_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `LabRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IKM` ADD CONSTRAINT `IKM_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `LabRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
