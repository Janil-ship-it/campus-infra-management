-- CreateTable
CREATE TABLE `calendar_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sourceModule` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `isAllDay` BOOLEAN NOT NULL DEFAULT false,
    `eventType` VARCHAR(191) NOT NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'MODULE_ONLY',
    `recurrenceRule` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `calendar_events_sourceModule_idx`(`sourceModule`),
    INDEX `calendar_events_startTime_endTime_idx`(`startTime`, `endTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_participants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `eventId` BIGINT NOT NULL,
    `userId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ATTENDEE',
    `rsvpStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',

    UNIQUE INDEX `event_participants_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_module_permissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `moduleName` VARCHAR(191) NOT NULL,
    `canView` BOOLEAN NOT NULL DEFAULT true,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,
    `grantedBy` INTEGER NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_module_permissions_userId_moduleName_key`(`userId`, `moduleName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_audit_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `eventId` BIGINT NULL,
    `userId` INTEGER NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `details` JSON NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `calendar_audit_log_timestamp_idx`(`timestamp`),
    INDEX `calendar_audit_log_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_participants` ADD CONSTRAINT `event_participants_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `calendar_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_audit_log` ADD CONSTRAINT `calendar_audit_log_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `calendar_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
