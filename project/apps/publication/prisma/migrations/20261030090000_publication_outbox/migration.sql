CREATE TABLE "publication_outbox" (
  "id" BIGSERIAL NOT NULL,
  "pattern" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "publication_outbox_pkey" PRIMARY KEY ("id")
);
