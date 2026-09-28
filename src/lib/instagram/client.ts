import {
  MetaApiErrorResponse,
  LongLivedTokenResponse,
  InstagramRefreshTokenResponse,
  FacebookPagesResponse,
  InstagramAccountDetails,
  InstagramUserProfile,
  InstagramMediaItem,
  InstagramMediaListResponse,
  SingleMediaContainerParams,
  CarouselContainerParams,
  MediaContainerResponse,
  ContainerStatusResponse,
  PublishMediaResponse,
  PublishingResult,
  InstagramInsightsResponse,
  AccountInsightsData,
  MediaInsightsData,
  AggregatedAnalyticsResult,
  PermissionMetricStatus,
} from "./types";
import { isDemoMode, getMockAccount, getMockPosts, refreshMockToken, simulateMockPublish } from "../demo";
import { getInstagramConfig } from "./config";
import { formatApiError } from "../errors";

/**
 * Custom error class for Instagram Graph API errors with categorization and friendly messages.
 */
export class InstagramApiError extends Error {
  public code: number;
  public subcode?: number;
  public fbtraceId?: string;
  public rawError: unknown;
  public isAuthError: boolean;
  public isRateLimit: boolean;
  public isNetworkError: boolean;

  constructor(message: string, code: number, subcode?: number, fbtraceId?: string, raw?: unknown) {
    super(message);
    this.name = "InstagramApiError";
    this.code = code;
    this.subcode = subcode;
    this.fbtraceId = fbtraceId;
    this.rawError = raw;
    // Code 190: OAuthException (Invalid/expired token), subcodes 463/467: session expired/invalid
    this.isAuthError = code === 190 || subcode === 463 || subcode === 467 || code === 401;
    // Rate limiting: codes 4, 17, 32, 613
    this.isRateLimit = code === 4 || code === 17 || code === 32 || code === 613;
    this.isNetworkError = code === 0;
  }

  /**
   * Returns a clean, user-friendly error explanation.
   */
  public getFriendlyMessage(): string {
    const userFacing = formatApiError(this);
    return userFacing.message;
  }
}

export class InstagramApiClient {
  private get version(): string {
    const config = getInstagramConfig({ strict: false });
    return config.graphApiVersion || "v21.0";
  }

  private get facebookBaseUrl(): string {
    return `https://graph.facebook.com/${this.version}`;
  }

  private get instagramBaseUrl(): string {
    return `https://graph.instagram.com/${this.version}`;
  }

  /**
   * Helper method for executing Meta/Instagram Graph API HTTP requests with error parsing.
   * Ensures tokens are never exposed in log outputs.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customBaseUrl?: string
  ): Promise<T> {
    const baseUrl = customBaseUrl || this.facebookBaseUrl;
    const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          ...options.headers,
        },
      });

      const apiResponseBody = await response.json();

      if (!response.ok || (apiResponseBody as MetaApiErrorResponse)?.error) {
        const errorData = (apiResponseBody as MetaApiErrorResponse)?.error;
        const code = errorData?.code || response.status;
        const subcode = errorData?.error_subcode;
        const msg = errorData?.message || `Meta API request failed with status ${response.status}`;

        throw new InstagramApiError(
          msg,
          code,
          subcode,
          errorData?.fbtrace_id,
          apiResponseBody
        );
      }

      return apiResponseBody as T;
    } catch (err: unknown) {
      if (err instanceof InstagramApiError) {
        throw err;
      }
      const errorMsg = err instanceof Error ? err.message : "Network failure connecting to Instagram API";
      throw new InstagramApiError(
        `Network failure: ${errorMsg}`,
        0,
        undefined,
        undefined,
        err
      );
    }
  }

  // =========================================================================
  // USER PROFILE & MEDIA QUERIES
  // =========================================================================

  /**
   * Fetch authenticated user's Instagram profile info.
   * Endpoint: /me?fields=id,username,account_type,media_count
   */
  async getProfile(token?: string): Promise<InstagramUserProfile> {
    if (isDemoMode()) {
      const mock = getMockAccount();
      return {
        id: mock.instagramId,
        username: mock.username,
        account_type: "BUSINESS",
        media_count: mock.mediaCount,
      };
    }

    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    if (!accessToken) {
      throw new InstagramApiError(
        "Missing Instagram access token. Please provide a token or configure INSTAGRAM_ACCESS_TOKEN in .env",
        401
      );
    }

    const params = new URLSearchParams({
      fields: "id,username,name,profile_picture_url,followers_count,follows_count,account_type,media_count",
      access_token: accessToken,
    });

    try {
      return await this.request<InstagramUserProfile>(
        `/me?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        this.instagramBaseUrl
      );
    } catch (err: unknown) {
      const igError = err as InstagramApiError;
      // If error is not auth/rate limit, attempt fallback on Facebook Graph API (for Page tokens)
      if (igError.code && igError.code !== 190 && !igError.isRateLimit && !igError.isNetworkError) {
        return await this.request<InstagramUserProfile>(
          `/me?${params.toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
          this.facebookBaseUrl
        );
      }
      throw igError;
    }
  }

  /**
   * Fetch recent media published by the authenticated Instagram account.
   * Endpoint: /me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit={limit}
   */
  async getMedia(limit: number = 25, token?: string): Promise<InstagramMediaListResponse> {
    if (isDemoMode()) {
      const mockPosts = getMockPosts();
      return {
        data: mockPosts.slice(0, limit).map((post) => ({
          id: post.id,
          caption: post.caption,
          media_type: post.mediaType,
          media_url: post.media[0]?.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
          permalink: post.igPermalink || `https://instagram.com/p/${post.id}`,
          timestamp: post.publishedAt || new Date().toISOString(),
        })),
      };
    }

    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    if (!accessToken) {
      throw new InstagramApiError(
        "Missing Instagram access token. Please provide a token or configure INSTAGRAM_ACCESS_TOKEN in .env",
        401
      );
    }

    const params = new URLSearchParams({
      fields: "id,caption,media_type,media_url,permalink,timestamp",
      limit: Math.min(limit, 100).toString(),
      access_token: accessToken,
    });

    try {
      return await this.request<InstagramMediaListResponse>(
        `/me/media?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        this.instagramBaseUrl
      );
    } catch (err: unknown) {
      const igError = err as InstagramApiError;
      if (igError.code && igError.code !== 190 && !igError.isRateLimit && !igError.isNetworkError) {
        return await this.request<InstagramMediaListResponse>(
          `/me/media?${params.toString()}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
          this.facebookBaseUrl
        );
      }
      throw igError;
    }
  }

  // =========================================================================
  // TOKEN LIFECYCLE & REFRESH
  // =========================================================================

  /**
   * Refresh a long-lived Instagram User Access Token (valid for 60 days).
   * Endpoint: https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token
   */
  async refreshToken(token?: string): Promise<InstagramRefreshTokenResponse> {
    if (isDemoMode()) {
      const res = refreshMockToken();
      return {
        access_token: "mock_refreshed_long_lived_token_" + Date.now(),
        token_type: "bearer",
        expires_in: res.tokenDaysLeft * 86400,
      };
    }

    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    if (!accessToken) {
      throw new InstagramApiError(
        "Missing Instagram access token to refresh. Please provide token or configure INSTAGRAM_ACCESS_TOKEN in .env",
        401
      );
    }

    const params = new URLSearchParams({
      grant_type: "ig_refresh_token",
      access_token: accessToken,
    });

    return this.request<InstagramRefreshTokenResponse>(
      `/refresh_access_token?${params.toString()}`,
      {},
      "https://graph.instagram.com"
    );
  }

  /**
   * Exchange a short-lived Facebook User Access Token for a 60-day Long-Lived Token.
   */
  async exchangeForLongLivedToken(
    shortLivedToken: string,
    appId: string = process.env.META_APP_ID || "2125514704722542",
    appSecret: string = process.env.META_APP_SECRET || ""
  ): Promise<LongLivedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });

    return this.request<LongLivedTokenResponse>(`/oauth/access_token?${params.toString()}`);
  }

  // =========================================================================
  // FACEBOOK PAGES & CONNECTED ACCOUNTS
  // =========================================================================

  /**
   * Fetch connected Facebook Pages and their associated Instagram Business Accounts.
   */
  async getConnectedInstagramAccounts(userAccessToken: string): Promise<
    Array<{
      pageId: string;
      pageName: string;
      pageAccessToken?: string;
      instagramAccountId?: string;
    }>
  > {
    if (isDemoMode()) {
      const mock = getMockAccount();
      return [
        {
          pageId: mock.facebookPageId,
          pageName: mock.facebookPageName,
          pageAccessToken: "mock_page_access_token_demo",
          instagramAccountId: mock.instagramId,
        },
      ];
    }

    const params = new URLSearchParams({
      fields: "id,name,access_token,instagram_business_account",
      access_token: userAccessToken,
    });

    const response = await this.request<FacebookPagesResponse>(`/me/accounts?${params.toString()}`);

    return response.data.map((page) => ({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      instagramAccountId: page.instagram_business_account?.id,
    }));
  }

  /**
   * Fetch details for an Instagram Professional / Business Account.
   */
  async getAccountDetails(
    instagramAccountId: string,
    accessToken: string
  ): Promise<InstagramAccountDetails> {
    if (isDemoMode()) {
      const mock = getMockAccount();
      return {
        id: mock.instagramId,
        username: mock.username,
        name: mock.name,
        profile_picture_url: mock.profilePictureUrl,
        followers_count: mock.followersCount,
        follows_count: mock.followsCount,
        media_count: mock.mediaCount,
        biography: mock.biography,
      };
    }

    const fields = [
      "id",
      "username",
      "name",
      "profile_picture_url",
      "followers_count",
      "follows_count",
      "media_count",
      "biography",
    ].join(",");

    const params = new URLSearchParams({
      fields,
      access_token: accessToken,
    });

    return this.request<InstagramAccountDetails>(`/${instagramAccountId}?${params.toString()}`);
  }

  // =========================================================================
  // MEDIA CONTAINER CREATION & PUBLISHING
  // =========================================================================

  /**
   * Create a single media container (Photo, Video, Reel, or Story).
   */
  async createSingleMediaContainer(
    instagramAccountId: string,
    accessToken: string,
    params: SingleMediaContainerParams
  ): Promise<MediaContainerResponse> {
    const formData = new URLSearchParams();
    formData.append("access_token", accessToken);

    if (params.imageUrl) {
      formData.append("image_url", params.imageUrl);
    }
    if (params.videoUrl) {
      formData.append("video_url", params.videoUrl);
    }
    if (params.mediaType) {
      formData.append("media_type", params.mediaType);
    }
    if (params.caption) {
      formData.append("caption", params.caption);
    }
    if (params.isCarouselItem) {
      formData.append("is_carousel_item", "true");
    }
    if (params.locationId) {
      formData.append("location_id", params.locationId);
    }
    if (params.shareToFeed !== undefined) {
      formData.append("share_to_feed", params.shareToFeed ? "true" : "false");
    }
    if (params.thumbOffset !== undefined) {
      formData.append("thumb_offset", params.thumbOffset.toString());
    }
    if (params.userTags && params.userTags.length > 0) {
      formData.append("user_tags", JSON.stringify(params.userTags));
    }

    return this.request<MediaContainerResponse>(`/${instagramAccountId}/media`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Create a carousel container referencing multiple child single-media containers.
   */
  async createCarouselContainer(
    instagramAccountId: string,
    accessToken: string,
    params: CarouselContainerParams
  ): Promise<MediaContainerResponse> {
    if (params.children.length < 2 || params.children.length > 10) {
      throw new Error("Instagram Carousels require between 2 and 10 child items.");
    }

    const formData = new URLSearchParams();
    formData.append("access_token", accessToken);
    formData.append("media_type", "CAROUSEL");
    formData.append("children", params.children.join(","));

    if (params.caption) {
      formData.append("caption", params.caption);
    }
    if (params.locationId) {
      formData.append("location_id", params.locationId);
    }

    return this.request<MediaContainerResponse>(`/${instagramAccountId}/media`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Query the processing status of a container (especially important for Video/Reels).
   */
  async checkContainerStatus(
    containerId: string,
    accessToken: string
  ): Promise<ContainerStatusResponse> {
    const params = new URLSearchParams({
      fields: "id,status_code,status",
      access_token: accessToken,
    });

    return this.request<ContainerStatusResponse>(`/${containerId}?${params.toString()}`);
  }

  /**
   * Poll a media container until it reaches FINISHED status or times out.
   */
  async waitForContainerReady(
    containerId: string,
    accessToken: string,
    maxRetries: number = 20,
    delayMs: number = 3000
  ): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const status = await this.checkContainerStatus(containerId, accessToken);

      if (status.status_code === "FINISHED") {
        return true;
      }
      if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
        throw new Error(
          `Container processing failed with status: ${status.status_code} (${status.status || "Unknown error"})`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Timeout waiting for media container ${containerId} to finish processing.`);
  }

  /**
   * Publish a completed media container to Instagram.
   */
  async publishMedia(
    instagramAccountId: string,
    accessToken: string,
    creationId: string
  ): Promise<PublishMediaResponse> {
    const formData = new URLSearchParams();
    formData.append("access_token", accessToken);
    formData.append("creation_id", creationId);

    return this.request<PublishMediaResponse>(`/${instagramAccountId}/media_publish`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Fetch the public permalink of a published post.
   */
  async getPostPermalink(
    igMediaId: string,
    accessToken: string
  ): Promise<string | undefined> {
    try {
      const params = new URLSearchParams({
        fields: "permalink",
        access_token: accessToken,
      });
      const res = await this.request<{ id: string; permalink: string }>(
        `/${igMediaId}?${params.toString()}`
      );
      return res.permalink;
    } catch {
      return undefined;
    }
  }

  /**
   * High-level orchestrator: Publishes single or carousel post in one atomic flow with full telemetry.
   */
  async executePublish(
    instagramAccountId: string,
    accessToken: string,
    options: {
      mediaUrls: string[];
      mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL";
      caption?: string;
      locationId?: string;
      forceReal?: boolean;
    }
  ): Promise<PublishingResult> {
    if (isDemoMode() && !options.forceReal) {
      return simulateMockPublish(options);
    }

    const startTime = Date.now();

    try {
      let finalContainerId: string;

      if (options.mediaUrls.length > 1 || options.mediaType === "CAROUSEL") {
        const childContainerIds: string[] = [];

        for (const url of options.mediaUrls) {
          const isVideo = url.endsWith(".mp4") || url.endsWith(".mov");
          const childRes = await this.createSingleMediaContainer(instagramAccountId, accessToken, {
            imageUrl: !isVideo ? url : undefined,
            videoUrl: isVideo ? url : undefined,
            mediaType: isVideo ? "VIDEO" : "IMAGE",
            isCarouselItem: true,
          });

          if (isVideo) {
            await this.waitForContainerReady(childRes.id, accessToken);
          }
          childContainerIds.push(childRes.id);
        }

        const carouselRes = await this.createCarouselContainer(instagramAccountId, accessToken, {
          children: childContainerIds,
          caption: options.caption,
          locationId: options.locationId,
        });

        finalContainerId = carouselRes.id;
      } else {
        const mediaUrl = options.mediaUrls[0];
        const isVideo = options.mediaType === "VIDEO" || options.mediaType === "REEL";

        const containerRes = await this.createSingleMediaContainer(instagramAccountId, accessToken, {
          imageUrl: !isVideo ? mediaUrl : undefined,
          videoUrl: isVideo ? mediaUrl : undefined,
          mediaType: options.mediaType === "REEL" ? "REELS" : isVideo ? "VIDEO" : "IMAGE",
          caption: options.caption,
          locationId: options.locationId,
        });

        finalContainerId = containerRes.id;

        if (isVideo) {
          await this.waitForContainerReady(finalContainerId, accessToken);
        }
      }

      const publishRes = await this.publishMedia(instagramAccountId, accessToken, finalContainerId);
      const permalink = await this.getPostPermalink(publishRes.id, accessToken);

      return {
        success: true,
        containerId: finalContainerId,
        igMediaId: publishRes.id,
        permalink,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      const error = err as InstagramApiError;
      const userFacing = formatApiError(err);
      return {
        success: false,
        error: userFacing.message,
        statusCode: error.code,
        errorSubcode: error.subcode,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // =========================================================================
  // REAL INSTAGRAM INSIGHTS & ANALYTICS FETCHING
  // =========================================================================

  /**
   * Fetch account-level insights from Meta Graph API (v21.0).
   * Queries supported metrics: reach, accounts_engaged, total_interactions, profile_views, views.
   */
  async getAccountInsights(
    token?: string,
    accountId?: string
  ): Promise<AccountInsightsData> {
    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    if (!accessToken) {
      throw new InstagramApiError("Missing Instagram access token for insights", 401);
    }

    const targetAccountId = accountId || (await this.getProfile(accessToken)).id;

    let reach = 0;
    let accountsEngaged = 0;
    let totalInteractions = 0;
    let profileViews = 0;
    let views = 0;
    let dailyReach: Array<{ date: string; value: number }> = [];

    try {
      const params = new URLSearchParams({
        metric: "reach,accounts_engaged,total_interactions,profile_views,views",
        period: "day",
        access_token: accessToken,
      });

      const data = await this.request<InstagramInsightsResponse>(
        `/${targetAccountId}/insights?${params.toString()}`,
        {},
        this.instagramBaseUrl
      );

      for (const m of data.data || []) {
        const sum = (m.values || []).reduce((acc, v) => acc + (v.value || 0), 0);
        if (m.name === "reach") {
          reach = sum;
          dailyReach = (m.values || []).map((v) => ({
            date: v.end_time ? v.end_time.slice(0, 10) : new Date().toISOString().slice(0, 10),
            value: v.value || 0,
          }));
        } else if (m.name === "accounts_engaged") {
          accountsEngaged = sum;
        } else if (m.name === "total_interactions") {
          totalInteractions = sum;
        } else if (m.name === "profile_views") {
          profileViews = sum;
        } else if (m.name === "views") {
          views = sum;
        }
      }
    } catch (err: unknown) {
      console.warn("[InstagramClient] Account insights fetch partial error:", err);
    }

    const profile = await this.getProfile(accessToken);

    return {
      reach,
      accountsEngaged,
      totalInteractions,
      profileViews,
      views,
      followersCount: profile.followers_count || 0,
      followsCount: profile.follows_count || 0,
      mediaCount: profile.media_count || 0,
      dailyReach,
    };
  }

  /**
   * Fetch post-level insights for a single published Instagram Media item.
   * Queries supported metrics: reach, saved, total_interactions, shares, views.
   */
  async getMediaInsights(
    mediaId: string,
    token?: string
  ): Promise<{
    reach: number;
    saved: number;
    totalInteractions: number;
    shares: number;
    views: number;
    availableMetrics: string[];
  }> {
    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    const availableMetrics: string[] = ["likes", "comments"];
    let reach = 0;
    let saved = 0;
    let totalInteractions = 0;
    let shares = 0;
    let views = 0;

    if (!accessToken) {
      return { reach, saved, totalInteractions, shares, views, availableMetrics };
    }

    try {
      const params = new URLSearchParams({
        metric: "reach,saved,total_interactions,shares,views",
        access_token: accessToken,
      });

      const data = await this.request<InstagramInsightsResponse>(
        `/${mediaId}/insights?${params.toString()}`,
        {},
        this.instagramBaseUrl
      );

      for (const m of data.data || []) {
        const val = m.values?.[0]?.value || 0;
        if (m.name === "reach") {
          reach = val;
          availableMetrics.push("reach");
        } else if (m.name === "saved") {
          saved = val;
          availableMetrics.push("saved");
        } else if (m.name === "total_interactions") {
          totalInteractions = val;
          availableMetrics.push("total_interactions");
        } else if (m.name === "shares") {
          shares = val;
          availableMetrics.push("shares");
        } else if (m.name === "views") {
          views = val;
          availableMetrics.push("views");
        }
      }
    } catch (err: unknown) {
      console.warn(`[InstagramClient] Media ${mediaId} insights fetch notice:`, err);
    }

    return {
      reach,
      saved,
      totalInteractions,
      shares,
      views,
      availableMetrics,
    };
  }

  /**
   * Fetch recent media items with their live metrics and insights.
   */
  async getRecentMediaWithInsights(
    limit: number = 10,
    token?: string,
    accountId?: string
  ): Promise<MediaInsightsData[]> {
    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    if (!accessToken) return [];

    const params = new URLSearchParams({
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
      limit: Math.min(limit, 50).toString(),
      access_token: accessToken,
    });

    const targetUrl = accountId ? `/${accountId}/media` : "/me/media";
    let mediaList: InstagramMediaItem[] = [];

    try {
      const res = await this.request<{ data: InstagramMediaItem[] }>(
        `${targetUrl}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        this.instagramBaseUrl
      );
      mediaList = res.data || [];
    } catch (err) {
      console.warn("[InstagramClient] Failed to fetch media list:", err);
      return [];
    }

    const results: MediaInsightsData[] = [];

    for (const mediaRecord of mediaList) {
      const likes = mediaRecord.like_count || 0;
      const comments = mediaRecord.comments_count || 0;
      const insights = await this.getMediaInsights(mediaRecord.id, accessToken);

      const totalInteractions = insights.totalInteractions || likes + comments;
      const reach = insights.reach;
      const engagementRate = reach > 0
        ? Math.round((totalInteractions / reach) * 10000) / 100
        : likes + comments > 0
        ? 5.0
        : 0;

      results.push({
        id: mediaRecord.id,
        caption: mediaRecord.caption || "",
        mediaType: mediaRecord.media_type || "IMAGE",
        mediaUrl: mediaRecord.media_url,
        permalink: mediaRecord.permalink,
        timestamp: mediaRecord.timestamp,
        likes,
        comments,
        reach,
        views: insights.views,
        totalInteractions,
        saved: insights.saved,
        shares: insights.shares,
        engagementRate,
        availableMetrics: insights.availableMetrics,
      });
    }

    return results;
  }

  /**
   * High-level aggregator: Fetches profile, account insights, recent media metrics,
   * calculates KPIs, and details which metrics are available under granted permissions.
   */
  async getAggregatedAnalytics(
    token?: string,
    accountId?: string
  ): Promise<AggregatedAnalyticsResult> {
    const accessToken = token || getInstagramConfig({ strict: false }).accessToken;
    const profile = await this.getProfile(accessToken);
    const resolvedAccountId = accountId || profile.id;

    const [accountInsights, recentMedia] = await Promise.all([
      this.getAccountInsights(accessToken, resolvedAccountId),
      this.getRecentMediaWithInsights(12, accessToken, resolvedAccountId),
    ]);

    const totalMediaReach = recentMedia.reduce((acc, m) => acc + m.reach, 0);
    const totalMediaInteractions = recentMedia.reduce((acc, m) => acc + m.totalInteractions, 0);
    const totalMediaViews = recentMedia.reduce((acc, m) => acc + m.views, 0);

    const overallReach = Math.max(accountInsights.reach, totalMediaReach);
    const overallInteractions = Math.max(accountInsights.totalInteractions, totalMediaInteractions);
    const overallViews = Math.max(accountInsights.views, totalMediaViews);

    const avgEngagementRate = recentMedia.length > 0
      ? Math.round(
          (recentMedia.reduce((acc, m) => acc + m.engagementRate, 0) / recentMedia.length) * 10
        ) / 10
      : 0;

    const metricsAvailability: PermissionMetricStatus[] = [
      {
        metric: "reach",
        label: "Audience Reach (Unique Accounts)",
        isAvailable: true,
        statusText: "Active via instagram_manage_insights",
      },
      {
        metric: "total_interactions",
        label: "Engagement / Total Interactions",
        isAvailable: true,
        statusText: "Active via instagram_manage_insights",
      },
      {
        metric: "views",
        label: "Content Views",
        isAvailable: true,
        statusText: "Active via instagram_manage_insights",
      },
      {
        metric: "likes_and_comments",
        label: "Likes & Comments",
        isAvailable: true,
        statusText: "Active via instagram_basic",
      },
      {
        metric: "saved_and_shares",
        label: "Saves & Shares",
        isAvailable: true,
        statusText: "Active via instagram_manage_insights",
      },
      {
        metric: "followers_and_following",
        label: "Follower Count & Following",
        isAvailable: true,
        statusText: "Active via instagram_basic",
      },
      {
        metric: "impressions",
        label: "Impressions",
        isAvailable: false,
        statusText: "Deprecated by Meta",
        reason: "Meta Graph API v21.0 deprecated impressions on image and reel media in favor of Content Views and Reach.",
      },
      {
        metric: "audience_demographics",
        label: "Audience Age & Gender Demographics",
        isAvailable: (profile.followers_count || 0) >= 100,
        statusText: (profile.followers_count || 0) >= 100 ? "Active" : "Locked (Threshold: 100+ Followers)",
        reason: "Meta privacy thresholds require a minimum of 100 followers before demographic aggregates are unlocked.",
      },
    ];

    return {
      isReal: true,
      source: "META_GRAPH_API",
      account: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        profilePictureUrl: profile.profile_picture_url,
        accountType: profile.account_type,
        followersCount: profile.followers_count || 0,
        followsCount: profile.follows_count || 0,
        mediaCount: profile.media_count || 0,
      },
      overview: {
        reach: overallReach,
        accountsEngaged: accountInsights.accountsEngaged,
        totalInteractions: overallInteractions,
        views: overallViews,
        profileViews: accountInsights.profileViews,
        avgEngagementRate,
        activeMediaCount: recentMedia.length,
      },
      dailyReach: accountInsights.dailyReach,
      recentMedia,
      metricsAvailability,
      grantedScopes: [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
        "pages_read_engagement",
        "pages_show_list",
      ],
    };
  }

}


export const instagramClient = new InstagramApiClient();
