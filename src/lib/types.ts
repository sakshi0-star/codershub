export type ContentStatus = "published" | "draft" | "scheduled";
export type PurchaseStatus = "completed" | "pending" | "refunded" | "failed";
export type VerificationStatus = "unverified" | "in_review" | "verified";

export interface Content {
  id: string;
  title: string;
  description: string;
  /** Price in cents */
  price: number;
  /** "gradient:<n>" for seeded items, or a (downscaled) data URL for uploads */
  thumbnail: string;
  videoName: string;
  videoSize: number;
  durationSec: number;
  views: number;
  status: ContentStatus;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRow extends Content {
  purchases: number;
  revenue: number;
}

export interface Purchase {
  id: string;
  contentId: string;
  /** Snapshot so history survives content deletion */
  contentTitle: string;
  /** Amount in cents */
  amount: number;
  country: string;
  status: PurchaseStatus;
  createdAt: string;
}

export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  country: string;
  address: string;
}

export type IdType = "passport" | "national_id" | "drivers_license";

export interface Verification {
  status: VerificationStatus;
  personal?: PersonalInfo;
  idType?: IdType;
  documentName?: string;
  selfieCompleted?: boolean;
  submittedAt?: string;
}

export interface DemoSettings {
  /** Artificial latency added to every API call */
  latencyMs: number;
  /** Content/purchase/overview endpoints return 503 */
  failRequests: boolean;
  /** The next simulated video upload fails part-way, then clears itself */
  failNextUpload: boolean;
}

export interface Db {
  content: Content[];
  purchases: Purchase[];
  verification: Verification;
  settings: DemoSettings;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Overview {
  totalRevenue: number;
  revenueThisMonth: number;
  totalContent: number;
  totalPurchases: number;
  publishedContent: number;
}

export interface SeriesPoint {
  date: string;
  revenue: number;
  purchases: number;
}
