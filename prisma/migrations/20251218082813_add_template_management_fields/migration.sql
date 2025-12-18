/*
  Warnings:

  - You are about to drop the column `path` on the `templates` table. All the data in the column will be lost.
  - Added the required column `data` to the `templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "templates" DROP COLUMN "path",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_isFeatured_idx" ON "templates"("isFeatured");
