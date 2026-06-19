-- CreateTable
CREATE TABLE "landing_page_contents" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "outlet_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landing_page_contents_outlet_id_idx" ON "landing_page_contents"("outlet_id");

-- CreateIndex
CREATE INDEX "landing_page_contents_section_is_active_idx" ON "landing_page_contents"("section", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "landing_page_contents_section_key_outlet_id_key" ON "landing_page_contents"("section", "key", "outlet_id");

-- AddForeignKey
ALTER TABLE "landing_page_contents" ADD CONSTRAINT "landing_page_contents_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
