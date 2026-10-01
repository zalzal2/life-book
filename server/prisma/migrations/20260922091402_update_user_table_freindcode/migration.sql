/*
  Warnings:

  - A unique constraint covering the columns `[friendCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendCode` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `friendCode` VARCHAR(8) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_friendCode_key` ON `users`(`friendCode`);
