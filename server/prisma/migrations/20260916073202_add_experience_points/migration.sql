-- AlterTable
ALTER TABLE `user_experiences` ADD COLUMN `earnedExp` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `experiencePoints` INTEGER NOT NULL DEFAULT 0;
