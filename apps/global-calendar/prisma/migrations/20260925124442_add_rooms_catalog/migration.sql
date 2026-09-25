-- CreateTable
CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `building` VARCHAR(191) NOT NULL,
    `roomNumber` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NULL,

    UNIQUE INDEX `rooms_label_key`(`label`),
    INDEX `rooms_building_idx`(`building`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
