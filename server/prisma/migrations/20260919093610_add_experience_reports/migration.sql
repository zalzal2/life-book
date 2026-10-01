-- CreateTable
CREATE TABLE `experience_reports` (
    `id` VARCHAR(191) NOT NULL,
    `experienceId` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `experience_reports_experienceId_idx`(`experienceId`),
    UNIQUE INDEX `experience_reports_experienceId_reporterId_key`(`experienceId`, `reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `experience_reports` ADD CONSTRAINT `experience_reports_experienceId_fkey` FOREIGN KEY (`experienceId`) REFERENCES `experiences`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `experience_reports` ADD CONSTRAINT `experience_reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
