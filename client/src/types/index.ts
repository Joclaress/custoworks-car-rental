export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  profile?: {
    address?: string | null;
    city?: string | null;
    province?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContactRelation?: string | null;
  } | null;
}

export type VehicleCategory = 'SEDAN' | 'SUV_MPV' | 'VAN';
export type Transmission = 'AT' | 'MT';
export type VehicleStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
export type RentalType = 'SELF_DRIVE' | 'WITH_DRIVER';
export type RateDuration = 'HOURS_12' | 'HOURS_24' | 'WEEKLY' | 'MONTHLY' | 'MONTHLY_UNLI';

export interface VehicleImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  category: VehicleCategory;
  make: string;
  model: string;
  year?: number | null;
  transmission: Transmission;
  seats: number;
  fuelType?: string | null;
  color?: string | null;
  plateNumber?: string | null;
  description?: string | null;
  features: string[];
  allowSelfDrive: boolean;
  allowWithDriver: boolean;
  status: VehicleStatus;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: VehicleImage[];
  startingRates?: {
    SELF_DRIVE: number | null;
    WITH_DRIVER: number | null;
    SELF_DRIVE_12: number | null;
    WITH_DRIVER_12: number | null;
  };
  rates?: VehicleRate[];
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface VehicleRate {
  id: string;
  vehicleId: string;
  destinationId: string;
  rentalType: RentalType;
  duration: RateDuration;
  amount: number | null;
  isPublished: boolean;
  notes?: string | null;
  destination?: Destination;
}

export type BookingStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_VERIFICATION'
  | 'PENDING_REQUIREMENTS'
  | 'REQUIREMENTS_REVIEW'
  | 'CONFIRMED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export interface FeeLine {
  additionalFeeId: string | null;
  type: 'DELIVERY' | 'DELIVERY_SURCHARGE' | 'CARWASH' | 'OTHER';
  name: string;
  amount: number;
}

export interface PricingQuote {
  vehicleId: string;
  destinationId: string;
  rentalType: RentalType;
  pickupAt: string;
  returnAt: string;
  rentalHours: number;
  rentalDays: number;
  ratePlan: RateDuration;
  ratePlanLabel: string;
  rateAmount: number;
  rateUnit: string;
  rentalFeeLabel: string;
  rentalFee: number;
  fees: FeeLine[];
  deliveryFee: number;
  carwashFee: number;
  otherFees: number;
  discount: number;
  promotion: { id: string; name: string; code: string | null } | null;
  totalAmount: number;
  reservationFee: number;
  balanceDue: number;
}

export interface RequirementDocument {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  selectedOption?: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';
  createdAt: string;
}

export interface BookingRequirement {
  id: string;
  requirementTypeId: string;
  name: string;
  isRequired: boolean;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUESTED';
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  requirementType?: {
    code: string;
    description?: string | null;
    options: string[];
  };
  documents?: RequirementDocument[];
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  kind: 'BANK_TRANSFER' | 'E_WALLET' | 'CASH' | 'ONLINE_GATEWAY';
  accountName?: string | null;
  accountNumber?: string | null;
  instructions?: string | null;
  qrImageUrl?: string | null;
  isCustomerSelectable: boolean;
  isActive: boolean;
}

export interface Payment {
  id: string;
  bookingId: string;
  paymentMethodId: string;
  type: 'RESERVATION_FEE' | 'RENTAL_BALANCE' | 'SECURITY_DEPOSIT' | 'SECURITY_DEPOSIT_REFUND' | 'ADDITIONAL_CHARGE' | 'REFUND';
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'VOIDED';
  amount: number;
  referenceNumber?: string | null;
  proofStorageKey?: string | null;
  receiptNumber?: string | null;
  rejectionReason?: string | null;
  paidAt?: string | null;
  verifiedAt?: string | null;
  paymentMethod: PaymentMethod;
  verifiedBy?: { fullName: string } | null;
  booking?: {
    reference: string;
    customerName: string;
    vehicle?: { name: string };
  };
}

export interface Booking {
  id: string;
  reference: string;
  customerId: string;
  vehicleId: string;
  destinationId: string;
  rentalType: RentalType;
  pickupAt: string;
  returnAt: string;
  status: BookingStatus;
  holdExpiresAt?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  purpose?: string | null;
  pickupMethod: 'OFFICE' | 'DELIVERY';
  deliveryAddress?: string | null;
  includeCarwash: boolean;
  ratePlan: RateDuration;
  rentalDays: number;
  rentalHours: number;
  rentalFee: number;
  deliveryFee: number;
  carwashFee: number;
  otherFees: number;
  discount: number;
  totalAmount: number;
  reservationFee: number;
  createdAt?: string;
  submittedAt?: string | null;
  confirmedAt?: string | null;
  releasedAt?: string | null;
  returnedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  vehicle: Vehicle;
  destination: Destination;
  fees?: FeeLine[];
  requirements?: BookingRequirement[];
  payments?: Payment[];
  agreement?: { agreementNumber: string; acceptedAt?: string | null };
  notes?: Array<{ id: string; body: string; createdAt: string; author: { fullName: string; role: string } }>;
  requests?: Array<{
    id: string;
    type: 'RESCHEDULE' | 'CANCELLATION';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reason?: string | null;
    requestedPickupAt?: string | null;
    requestedReturnAt?: string | null;
    adminResponse?: string | null;
    createdAt: string;
  }>;
}

export interface AdditionalFee {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: 'DELIVERY' | 'DELIVERY_SURCHARGE' | 'CARWASH' | 'OTHER';
  amount: number;
  vehicleCategory?: VehicleCategory | null;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  discountType: 'PERCENT' | 'FIXED';
  value: number;
  minDays?: number | null;
  isActive: boolean;
}

