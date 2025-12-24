-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "aiFeaturesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowedDomains" TEXT[],
ADD COLUMN     "badgeSet" TEXT NOT NULL DEFAULT 'old-school',
ADD COLUMN     "brandingFaviconUrl" TEXT,
ADD COLUMN     "brandingLogoUrl" TEXT,
ADD COLUMN     "creditsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCourseImageUrl" TEXT,
ADD COLUMN     "defaultGroupId" TEXT,
ADD COLUMN     "defaultUserTypeId" TEXT,
ADD COLUMN     "disallowMainDomainLogin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ecommerceProcessor" TEXT,
ADD COLUMN     "externalAnnouncement" TEXT,
ADD COLUMN     "externalAnnouncementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "internalAnnouncement" TEXT,
ADD COLUMN     "internalAnnouncementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languageCode" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "maxRegistrations" INTEGER,
ADD COLUMN     "signupMode" TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN     "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsOfService" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ALTER COLUMN "settings" SET DEFAULT '{}';

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_defaultUserTypeId_fkey" FOREIGN KEY ("defaultUserTypeId") REFERENCES "user_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_defaultGroupId_fkey" FOREIGN KEY ("defaultGroupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
