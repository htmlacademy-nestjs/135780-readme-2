-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('video', 'text', 'quote', 'photo', 'link');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('published', 'draft');

-- CreateTable
CREATE TABLE "publications" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "type" "PublicationType" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[],
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "is_repost" BOOLEAN NOT NULL DEFAULT false,
    "original_publication_id" UUID,
    "original_author_id" UUID,
    "title" VARCHAR(50),
    "video_url" TEXT,
    "announcement" VARCHAR(255),
    "text" TEXT,
    "quote_author" VARCHAR(50),
    "photo_id" TEXT,
    "link_url" TEXT,
    "description" VARCHAR(300),

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "text" VARCHAR(300) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "publication_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publications_author_id_idx" ON "publications"("author_id");

-- CreateIndex
CREATE INDEX "publications_status_published_at_idx" ON "publications"("status", "published_at");

-- CreateIndex
CREATE INDEX "publications_original_publication_id_idx" ON "publications"("original_publication_id");

-- CreateIndex
CREATE INDEX "comments_publication_id_created_at_idx" ON "comments"("publication_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "likes_publication_id_user_id_key" ON "likes"("publication_id", "user_id");

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_original_publication_id_fkey" FOREIGN KEY ("original_publication_id") REFERENCES "publications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
