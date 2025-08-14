-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "language" TEXT NOT NULL DEFAULT '',
    "avatar_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" BIGINT NOT NULL,
    "used_at" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "public"."email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_token_idx" ON "public"."email_verifications"("token");

-- CreateIndex
CREATE INDEX "email_verifications_user_id_idx" ON "public"."email_verifications"("user_id");

-- CreateIndex
CREATE INDEX "email_verifications_expires_at_idx" ON "public"."email_verifications"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "public"."password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "public"."password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "public"."password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "public"."password_resets"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
