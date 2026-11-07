-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('SEDAN', 'SUV_MPV', 'VAN');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AT', 'MT');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "RentalType" AS ENUM ('SELF_DRIVE', 'WITH_DRIVER');

-- CreateEnum
CREATE TYPE "RateDuration" AS ENUM ('HOURS_12', 'HOURS_24', 'WEEKLY', 'MONTHLY', 'MONTHLY_UNLI');

-- CreateEnum
CREATE TYPE "PricingUnit" AS ENUM ('FLAT', 'PER_DAY');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PAYMENT_VERIFICATION', 'PENDING_REQUIREMENTS', 'REQUIREMENTS_REVIEW', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RequirementAppliesTo" AS ENUM ('SELF_DRIVE', 'WITH_DRIVER', 'BOTH');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REUPLOAD_REQUESTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'REUPLOAD_REQUESTED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('RESERVATION_FEE', 'RENTAL_BALANCE', 'SECURITY_DEPOSIT', 'SECURITY_DEPOSIT_REFUND', 'ADDITIONAL_CHARGE', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "PaymentMethodKind" AS ENUM ('BANK_TRANSFER', 'E_WALLET', 'CASH', 'ONLINE_GATEWAY');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('DELIVERY', 'DELIVERY_SURCHARGE', 'CARWASH', 'OTHER');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "AvailabilityBlockType" AS ENUM ('MAINTENANCE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingRequestType" AS ENUM ('RESCHEDULE', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "BookingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relation" TEXT,
    "birth_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "VehicleCategory" NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "transmission" "Transmission" NOT NULL,
    "seats" INTEGER NOT NULL,
    "fuel_type" TEXT,
    "color" TEXT,
    "plate_number" TEXT,
    "description" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allow_self_drive" BOOLEAN NOT NULL DEFAULT true,
    "allow_with_driver" BOOLEAN NOT NULL DEFAULT true,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "alt_text" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_rates" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "rental_type" "RentalType" NOT NULL,
    "duration" "RateDuration" NOT NULL,
    "pricing_unit" "PricingUnit" NOT NULL DEFAULT 'PER_DAY',
    "amount" DECIMAL(12,2),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicle_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "vehicle_id" UUID,
    "rental_type" "RentalType",
    "min_days" INTEGER,
    "starts_at" TIMESTAMPTZ,
    "ends_at" TIMESTAMPTZ,
    "auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_fees" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "FeeType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "vehicle_category" "VehicleCategory",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "additional_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_availability" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" "AvailabilityBlockType" NOT NULL DEFAULT 'MAINTENANCE',
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "vehicle_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "promotion_id" UUID,
    "rental_type" "RentalType" NOT NULL,
    "pickup_at" TIMESTAMPTZ NOT NULL,
    "return_at" TIMESTAMPTZ NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "hold_expires_at" TIMESTAMPTZ,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "purpose" TEXT,
    "pickup_method" TEXT NOT NULL DEFAULT 'OFFICE',
    "delivery_address" TEXT,
    "include_carwash" BOOLEAN NOT NULL DEFAULT true,
    "rate_plan" "RateDuration" NOT NULL,
    "rental_days" INTEGER NOT NULL,
    "rental_hours" INTEGER NOT NULL,
    "rental_fee" DECIMAL(12,2) NOT NULL,
    "delivery_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "carwash_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "reservation_fee" DECIMAL(12,2) NOT NULL,
    "pricing_breakdown" JSONB NOT NULL,
    "submitted_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "released_at" TIMESTAMPTZ,
    "returned_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "reject_reason" TEXT,
    "reminder_sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_fees" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "additional_fee_id" UUID,
    "type" "FeeType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "note" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_notes" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "type" "BookingRequestType" NOT NULL,
    "status" "BookingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_pickup_at" TIMESTAMPTZ,
    "requested_return_at" TIMESTAMPTZ,
    "reason" TEXT,
    "admin_response" TEXT,
    "requested_by_id" UUID NOT NULL,
    "handled_by_id" UUID,
    "handled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_types" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "applies_to" "RequirementAppliesTo" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "requirement_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requirements" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "requirement_type_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "status" "RequirementStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "rejection_reason" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "booking_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_documents" (
    "id" UUID NOT NULL,
    "booking_requirement_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "storage_provider" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "selected_option" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_reviews" (
    "id" UUID NOT NULL,
    "booking_requirement_id" UUID NOT NULL,
    "document_id" UUID,
    "action" "ReviewAction" NOT NULL,
    "reason" TEXT,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PaymentMethodKind" NOT NULL,
    "account_name" TEXT,
    "account_number" TEXT,
    "instructions" TEXT,
    "qr_image_url" TEXT,
    "is_customer_selectable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "payment_method_id" UUID NOT NULL,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "amount" DECIMAL(12,2) NOT NULL,
    "reference_number" TEXT,
    "proof_storage_provider" TEXT,
    "proof_storage_key" TEXT,
    "proof_mime_type" TEXT,
    "receipt_number" TEXT,
    "notes" TEXT,
    "rejection_reason" TEXT,
    "idempotency_key" TEXT,
    "gateway_provider" TEXT,
    "gateway_payment_id" TEXT,
    "gateway_status" TEXT,
    "gateway_payload" JSONB,
    "submitted_by_id" UUID,
    "verified_by_id" UUID,
    "paid_at" TIMESTAMPTZ,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_agreements" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "agreement_number" TEXT NOT NULL,
    "terms_snapshot" TEXT NOT NULL,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ,
    "accepted_ip" TEXT,

    CONSTRAINT "rental_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "booking_id" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sent_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_user_id_key" ON "customer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_slug_key" ON "vehicles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE INDEX "vehicles_category_idx" ON "vehicles"("category");

-- CreateIndex
CREATE INDEX "vehicles_status_is_published_idx" ON "vehicles"("status", "is_published");

-- CreateIndex
CREATE INDEX "vehicle_images_vehicle_id_idx" ON "vehicle_images"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "vehicle_rates_destination_id_idx" ON "vehicle_rates"("destination_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_rates_vehicle_id_destination_id_rental_type_duratio_key" ON "vehicle_rates"("vehicle_id", "destination_id", "rental_type", "duration");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "additional_fees_code_key" ON "additional_fees"("code");

-- CreateIndex
CREATE INDEX "additional_fees_type_is_active_idx" ON "additional_fees"("type", "is_active");

-- CreateIndex
CREATE INDEX "vehicle_availability_vehicle_id_start_at_end_at_idx" ON "vehicle_availability"("vehicle_id", "start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_vehicle_id_pickup_at_return_at_idx" ON "bookings"("vehicle_id", "pickup_at", "return_at");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_hold_expires_at_idx" ON "bookings"("hold_expires_at");

-- CreateIndex
CREATE INDEX "booking_fees_booking_id_idx" ON "booking_fees"("booking_id");

-- CreateIndex
CREATE INDEX "booking_status_history_booking_id_idx" ON "booking_status_history"("booking_id");

-- CreateIndex
CREATE INDEX "booking_notes_booking_id_idx" ON "booking_notes"("booking_id");

-- CreateIndex
CREATE INDEX "booking_requests_booking_id_idx" ON "booking_requests"("booking_id");

-- CreateIndex
CREATE INDEX "booking_requests_status_idx" ON "booking_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "requirement_types_code_key" ON "requirement_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "booking_requirements_booking_id_requirement_type_id_key" ON "booking_requirements"("booking_id", "requirement_type_id");

-- CreateIndex
CREATE INDEX "requirement_documents_booking_requirement_id_idx" ON "requirement_documents"("booking_requirement_id");

-- CreateIndex
CREATE INDEX "requirement_reviews_booking_requirement_id_idx" ON "requirement_reviews"("booking_requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_code_key" ON "payment_methods"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_payment_id_key" ON "payments"("gateway_payment_id");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_type_idx" ON "payments"("type");

-- CreateIndex
CREATE UNIQUE INDEX "rental_agreements_booking_id_key" ON "rental_agreements"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_agreements_agreement_number_key" ON "rental_agreements"("agreement_number");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_booking_id_idx" ON "notifications"("booking_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_rates" ADD CONSTRAINT "vehicle_rates_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_rates" ADD CONSTRAINT "vehicle_rates_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability" ADD CONSTRAINT "vehicle_availability_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability" ADD CONSTRAINT "vehicle_availability_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_fees" ADD CONSTRAINT "booking_fees_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_fees" ADD CONSTRAINT "booking_fees_additional_fee_id_fkey" FOREIGN KEY ("additional_fee_id") REFERENCES "additional_fees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_notes" ADD CONSTRAINT "booking_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requirements" ADD CONSTRAINT "booking_requirements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requirements" ADD CONSTRAINT "booking_requirements_requirement_type_id_fkey" FOREIGN KEY ("requirement_type_id") REFERENCES "requirement_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_documents" ADD CONSTRAINT "requirement_documents_booking_requirement_id_fkey" FOREIGN KEY ("booking_requirement_id") REFERENCES "booking_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_documents" ADD CONSTRAINT "requirement_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_reviews" ADD CONSTRAINT "requirement_reviews_booking_requirement_id_fkey" FOREIGN KEY ("booking_requirement_id") REFERENCES "booking_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_reviews" ADD CONSTRAINT "requirement_reviews_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "requirement_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_reviews" ADD CONSTRAINT "requirement_reviews_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- CUSTOWORKS – database-level integrity rules (hand-written)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Sanity checks
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_period_valid" CHECK ("return_at" > "pickup_at");
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_amounts_valid" CHECK ("rental_fee" >= 0 AND "total_amount" >= 0 AND "reservation_fee" >= 0 AND "discount" >= 0);
ALTER TABLE "vehicle_availability" ADD CONSTRAINT "vehicle_availability_period_valid" CHECK ("end_at" > "start_at");
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "vehicle_rates" ADD CONSTRAINT "vehicle_rates_amount_valid" CHECK ("amount" IS NULL OR "amount" >= 0);
ALTER TABLE "additional_fees" ADD CONSTRAINT "additional_fees_amount_valid" CHECK ("amount" >= 0);
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_seats_valid" CHECK ("seats" > 0);

-- DOUBLE-BOOKING PROTECTION
-- No two active bookings for the same vehicle may overlap in time. Even if two
-- requests race past the application checks, PostgreSQL rejects the second one.
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "vehicle_id" WITH =,
    tstzrange("pickup_at", "return_at", '[)') WITH &&
  ) WHERE ("status" IN ('DRAFT','PENDING_PAYMENT','PAYMENT_VERIFICATION','PENDING_REQUIREMENTS','REQUIREMENTS_REVIEW','CONFIRMED','ONGOING'));

-- DUPLICATE-PAYMENT PROTECTION
-- Only one live (pending/approved) reservation-fee payment per booking.
CREATE UNIQUE INDEX "payments_one_live_reservation_fee"
  ON "payments" ("booking_id")
  WHERE "type" = 'RESERVATION_FEE' AND "status" IN ('PENDING_VERIFICATION','APPROVED');

-- The same bank / e-wallet reference number cannot be reused on live payments.
CREATE UNIQUE INDEX "payments_unique_live_reference"
  ON "payments" ("payment_method_id", lower("reference_number"))
  WHERE "reference_number" IS NOT NULL AND "status" IN ('PENDING_VERIFICATION','APPROVED');
