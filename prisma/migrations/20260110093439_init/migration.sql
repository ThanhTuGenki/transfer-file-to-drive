-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'SCANNING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "transfer_folders" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_files" (
    "id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "original_url" TEXT NOT NULL,
    "name" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transfer_files" ADD CONSTRAINT "transfer_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "transfer_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
