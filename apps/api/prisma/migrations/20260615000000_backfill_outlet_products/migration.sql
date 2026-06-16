-- Backfill missing outlet-level availability rows for existing companies.
-- Every active outlet should start with one OutletProduct row for each company product.

DELETE FROM "OutletProduct" a
USING "OutletProduct" b
WHERE a."id" > b."id"
  AND a."outletId" = b."outletId"
  AND a."productId" = b."productId";

CREATE UNIQUE INDEX IF NOT EXISTS "OutletProduct_outletId_productId_key"
ON "OutletProduct"("outletId", "productId");

INSERT INTO "OutletProduct" ("id", "outletId", "productId", "active", "updatedAt")
SELECT gen_random_uuid()::text, o."id", p."id", true, CURRENT_TIMESTAMP
FROM "Outlet" o
JOIN "Product" p ON p."companyId" = o."companyId"
WHERE o."status" = 'ACTIVE'
ON CONFLICT ("outletId", "productId") DO NOTHING;
