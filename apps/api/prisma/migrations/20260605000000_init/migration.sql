CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'SETUP', 'DISABLED');
CREATE TYPE "UserRole" AS ENUM ('SITE_ADMIN', 'COMPANY_ADMIN', 'OUTLET_USER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');
CREATE TYPE "OutletStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'OFFLINE', 'NEEDS_SETUP', 'INACTIVE');
CREATE TYPE "LabelType" AS ENUM ('PRODUCT', 'COMPACT_PRODUCT', 'TIMESTAMP');
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADED', 'PENDING', 'FAILED');

CREATE TABLE "Company" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserOutletAccess" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  CONSTRAINT "UserOutletAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Outlet" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "shortCode" TEXT NOT NULL,
  "status" "OutletStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "codePrefix" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'company',
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "outletId" TEXT,
  "productCode" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'company',
  "nameEn" TEXT NOT NULL,
  "nameZh" TEXT NOT NULL,
  "daysToExpire" INTEGER NOT NULL,
  "hoursToExpire" INTEGER NOT NULL,
  "storageMethodEn" TEXT NOT NULL,
  "storageMethodZh" TEXT NOT NULL,
  "imageStatus" TEXT NOT NULL DEFAULT 'missing',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutletProduct" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "outletId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutletProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Device" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "outletId" TEXT,
  "deviceName" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'android',
  "appVersion" TEXT NOT NULL,
  "deviceIdentifier" TEXT NOT NULL,
  "printerName" TEXT,
  "printerMacAddress" TEXT,
  "printerBluetoothId" TEXT,
  "lastPrinterConnectedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrintJob" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "clientJobId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "productId" TEXT,
  "deviceId" TEXT,
  "productCodeSnapshot" TEXT NOT NULL,
  "productNameSnapshot" TEXT NOT NULL,
  "labelType" "LabelType" NOT NULL,
  "labelSize" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "printerName" TEXT,
  "printerMacAddress" TEXT,
  "printerBluetoothId" TEXT,
  "printedAt" TIMESTAMP(3) NOT NULL,
  "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'UPLOADED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "recordId" TEXT,
  "risk" TEXT NOT NULL DEFAULT 'low',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserOutletAccess_userId_outletId_key" ON "UserOutletAccess"("userId", "outletId");
CREATE UNIQUE INDEX "Outlet_companyId_code_key" ON "Outlet"("companyId", "code");
CREATE UNIQUE INDEX "Outlet_companyId_shortCode_key" ON "Outlet"("companyId", "shortCode");
CREATE UNIQUE INDEX "ProductCategory_companyId_codePrefix_key" ON "ProductCategory"("companyId", "codePrefix");
CREATE UNIQUE INDEX "Product_companyId_productCode_key" ON "Product"("companyId", "productCode");
CREATE UNIQUE INDEX "OutletProduct_outletId_productId_key" ON "OutletProduct"("outletId", "productId");
CREATE UNIQUE INDEX "Device_deviceIdentifier_key" ON "Device"("deviceIdentifier");
CREATE UNIQUE INDEX "PrintJob_clientJobId_key" ON "PrintJob"("clientJobId");
CREATE INDEX "PrintJob_companyId_outletId_printedAt_idx" ON "PrintJob"("companyId", "outletId", "printedAt");
CREATE INDEX "PrintJob_companyId_labelType_labelSize_idx" ON "PrintJob"("companyId", "labelType", "labelSize");

ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserOutletAccess" ADD CONSTRAINT "UserOutletAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserOutletAccess" ADD CONSTRAINT "UserOutletAccess_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OutletProduct" ADD CONSTRAINT "OutletProduct_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OutletProduct" ADD CONSTRAINT "OutletProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrintJob" ADD CONSTRAINT "PrintJob_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

