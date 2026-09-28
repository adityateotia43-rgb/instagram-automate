/**
 * Meta Graph API Type Definitions
 * Covers Instagram Graph API for Business, Creator, and User accounts.
 */

export interface MetaApiErrorDetails {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  is_transient?: boolean;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
}

export interface MetaApiErrorResponse {
  error: MetaApiErrorDetails;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Duration in seconds (typically ~5184000 = 60 days)
}

export interface InstagramRefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Duration in seconds (typically ~5184000 = 60 days)
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
  };
}

export interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface InstagramAccountDetails {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  account_type?: "BUSINESS" | "MEDIA_CREATOR" | "PERSONAL" | string;
  media_count?: number;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  media_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramMediaListResponse {
  data: InstagramMediaItem[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface UserTag {
  username: string;
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

export interface SingleMediaContainerParams {
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "REELS" | "STORIES";
  caption?: string;
  locationId?: string;
  userTags?: UserTag[];
  isCarouselItem?: boolean;
  shareToFeed?: boolean; // For Reels
  thumbOffset?: number; // In milliseconds for video thumbnails
}

export interface CarouselContainerParams {
  children: string[]; // Array of single media container IDs (2 to 10 items)
  caption?: string;
  locationId?: string;
}

export interface MediaContainerResponse {
  id: string; // The creation_id / container_id
}

export type ContainerStatusCode = "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";

export interface ContainerStatusResponse {
  id: string;
  status_code: ContainerStatusCode;
  status?: string;
}

export interface PublishMediaResponse {
  id: string; // The published Instagram media ID
}

export interface PublishingResult {
  success: boolean;
  containerId?: string;
  igMediaId?: string;
  permalink?: string;
  error?: string;
  statusCode?: number;
  errorSubcode?: number;
  durationMs?: number;
}


export interface InstagramInsightValue {
  value: number;
  end_time?: string;
}

export interface InstagramInsightMetric {
  name: string;
  period: string;
  values: InstagramInsightValue[];
  title?: string;
  description?: string;
  id?: string;
}

export interface InstagramInsightsResponse {
  data: InstagramInsightMetric[];
  paging?: {
    previous?: string;
    next?: string;
  };
}

export interface AccountInsightsData {
  reach: number;
  accountsEngaged: number;
  totalInteractions: number;
  profileViews: number;
  views: number;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  dailyReach: Array<{ date: string; value: number }>;
}

export interface MediaInsightsData {
  id: string;
  caption?: string;
  mediaType: string;
  mediaUrl?: string;
  permalink?: string;
  timestamp: string;
  likes: number;
  comments: number;
  reach: number;
  views: number;
  totalInteractions: number;
  saved: number;
  shares: number;
  engagementRate: number;
  availableMetrics: string[];
}

export interface PermissionMetricStatus {
  metric: string;
  label: string;
  isAvailable: boolean;
  statusText: string;
  reason?: string;
}

export interface AggregatedAnalyticsResult {
  isReal: boolean;
  source: "META_GRAPH_API" | "DEMO_SANDBOX";
  account: {
    id: string;
    username: string;
    name?: string;
    profilePictureUrl?: string;
    accountType?: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
  };
  overview: {
    reach: number;
    accountsEngaged: number;
    totalInteractions: number;
    views: number;
    profileViews: number;
    avgEngagementRate: number;
    activeMediaCount: number;
  };
  dailyReach: Array<{ date: string; value: number }>;
  recentMedia: MediaInsightsData[];
  metricsAvailability: PermissionMetricStatus[];
  grantedScopes: string[];
}
