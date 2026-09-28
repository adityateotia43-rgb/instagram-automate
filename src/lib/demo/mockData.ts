/**
 * Comprehensive Mock Data for InstaFlow Studio Demo Mode
 * Used when DEMO_MODE=true to simulate realistic Instagram Business & Creator metrics.
 */

export interface MockAccount {
  id: string;
  instagramId: string;
  username: string;
  name: string;
  biography: string;
  profilePictureUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  accountType: "BUSINESS" | "CREATOR";
  facebookPageId: string;
  facebookPageName: string;
  isVerified: boolean;
  website: string;
}

export interface MockMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL" | "STORY";
  width: number;
  height: number;
  order: number;
}

export interface MockPost {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL" | "STORY";
  aspectRatio: "1:1" | "4:5" | "16:9";
  media: MockMedia[];
  status: "PUBLISHED" | "SCHEDULED" | "DRAFT";
  igMediaId?: string;
  igPermalink?: string;
  publishedAt?: string;
  metrics?: {
    likes: number;
    comments: number;
    reach: number;
    impressions: number;
    saved: number;
    shares: number;
    engagementRate: number;
  };
}

export interface MockScheduledItem {
  id: string;
  postId: string;
  caption: string;
  mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL" | "STORY";
  thumbnailUrl: string;
  scheduledFor: string;
  timezone: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  aspectRatio: string;
}

export interface MockDraft {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  mediaType: "IMAGE" | "VIDEO" | "REEL" | "CAROUSEL";
  thumbnailUrl: string;
  category?: string;
  aspectRatio?: "1:1" | "4:5" | "16:9";
  updatedAt: string;
}

export type NotificationType =
  | "POST_PUBLISHED"
  | "POST_FAILED"
  | "TOKEN_EXPIRING"
  | "TOKEN_EXPIRED"
  | "SCHEDULED_REMINDER"
  | "ACCOUNT_DISCONNECTED"
  | "SYSTEM";

export interface MockNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface MockAnalytics {
  audienceReach: {
    value: string;
    trend: string;
    subtext: string;
  };
  engagementRate: {
    value: string;
    trend: string;
    subtext: string;
  };
  scheduledInQueue: {
    value: string;
    trend: string;
    subtext: string;
  };
  publishingVelocity: {
    value: string;
    trend: string;
    subtext: string;
  };
  followerGrowth: Array<{ date: string; count: number }>;
  channelBreakdown: Array<{ channel: string; percentage: number }>;
}

export const mockAccount: MockAccount = {
  id: "account_demo_luminous",
  instagramId: "17841405822340912",
  username: "@luminous.studio",
  name: "Luminous Design Studio",
  biography:
    "Visual velocity for modern creators & digital brands. ✨ Creative direction, CGI design systems & architectural aesthetics.",
  profilePictureUrl:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  followersCount: 142800,
  followsCount: 482,
  mediaCount: 184,
  accountType: "BUSINESS",
  facebookPageId: "109823487192348",
  facebookPageName: "Luminous Studio Global",
  isVerified: true,
  website: "https://luminous.studio",
};

export const mockPosts: MockPost[] = [
  {
    id: "post_01",
    caption:
      "Precision meets pure aesthetic momentum. ✨\nIntroducing Horizon Drop 04 — engineered for creator teams redefining visual culture. Link in bio to explore the design tokens kit. 🚀\n\n#designinspo #creativedirector #saasbranding #socialmediatips",
    mediaType: "CAROUSEL",
    aspectRatio: "1:1",
    media: [
      {
        id: "media_01_a",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        fileType: "IMAGE",
        width: 2160,
        height: 2160,
        order: 0,
      },
      {
        id: "media_01_b",
        url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
        fileType: "IMAGE",
        width: 2160,
        height: 2160,
        order: 1,
      },
    ],
    status: "PUBLISHED",
    igMediaId: "18029384918234812",
    igPermalink: "https://instagram.com/p/DF93kLA291a",
    publishedAt: "2026-09-12T18:45:00Z",
    metrics: {
      likes: 4820,
      comments: 142,
      reach: 38400,
      impressions: 49200,
      saved: 840,
      shares: 312,
      engagementRate: 6.2,
    },
  },
  {
    id: "post_02",
    caption:
      "Brutalist architecture in motion. Sound on 🎧. Exploring light, shadow, and architectural textures in high-density monolithic concrete.\n\n#archidaily #brutalism #3danimation #monolithic #cgiart",
    mediaType: "REEL",
    aspectRatio: "16:9",
    media: [
      {
        id: "media_02_a",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        fileType: "REEL",
        width: 1080,
        height: 1920,
        order: 0,
      },
    ],
    status: "PUBLISHED",
    igMediaId: "18029384918234813",
    igPermalink: "https://instagram.com/reel/DF81jK391b",
    publishedAt: "2026-09-10T14:30:00Z",
    metrics: {
      likes: 12450,
      comments: 382,
      reach: 94200,
      impressions: 118400,
      saved: 2100,
      shares: 1420,
      engagementRate: 8.4,
    },
  },
  {
    id: "post_03",
    caption:
      "Color harmony exploration 01 — pairing electric cadmium rose with obsidian depths. What gradient system are you rocking this season? Drop your favorite palette below.\n\n#colorpalette #uidesign #typography #branddesign",
    mediaType: "IMAGE",
    aspectRatio: "4:5",
    media: [
      {
        id: "media_03_a",
        url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
        fileType: "IMAGE",
        width: 1080,
        height: 1350,
        order: 0,
      },
    ],
    status: "PUBLISHED",
    igMediaId: "18029384918234814",
    igPermalink: "https://instagram.com/p/DF72lQ109c",
    publishedAt: "2026-09-08T17:15:00Z",
    metrics: {
      likes: 3190,
      comments: 98,
      reach: 22100,
      impressions: 28400,
      saved: 512,
      shares: 180,
      engagementRate: 5.1,
    },
  },
];

export const mockScheduledPosts: MockScheduledItem[] = [
  {
    id: "sched_01",
    postId: "post_sched_01",
    caption:
      "Behind the Scenes: Designing for high-fidelity interactive media. Sneak peek into our Q4 design language overhaul.",
    mediaType: "CAROUSEL",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    scheduledFor: "2026-09-15T18:45:00Z",
    timezone: "PST (UTC-8)",
    status: "PENDING",
    aspectRatio: "1:1",
  },
  {
    id: "sched_02",
    postId: "post_sched_02",
    caption:
      "5 principles for effortless grid harmony on Instagram. Save this breakdown for your next campaign rollout.",
    mediaType: "IMAGE",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80",
    scheduledFor: "2026-09-17T12:00:00Z",
    timezone: "PST (UTC-8)",
    status: "PENDING",
    aspectRatio: "4:5",
  },
  {
    id: "sched_03",
    postId: "post_sched_03",
    caption:
      "Visual velocity reel: Monolithic dark UI in motion with micro-interactions and smooth damping spring physics.",
    mediaType: "REEL",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    scheduledFor: "2026-09-19T16:30:00Z",
    timezone: "PST (UTC-8)",
    status: "PENDING",
    aspectRatio: "16:9",
  },
];

export const mockDrafts: MockDraft[] = [
  {
    id: "draft_01",
    title: "Monochrome Editorial Concepts",
    caption:
      "Exploring high-contrast typography and negative space for brutalist luxury publications. Testing 4:5 vertical proportions with ultra-fine serif headers.\n\n#editorial #graphicdesign #brutalist #typography",
    hashtags: ["#editorial", "#graphicdesign", "#brutalist", "#typography"],
    mediaType: "CAROUSEL",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    category: "Editorial",
    aspectRatio: "4:5",
    updatedAt: "2026-09-14T10:15:00Z",
  },
  {
    id: "draft_02",
    title: "Creator Studio Setup Breakdown",
    caption:
      "Hardware, lighting, and ambient color theory for production-grade studio desks. Swipe through for the full cabling management breakdown.\n\n#setuptour #creatorstudio #desksetup #minimalism",
    hashtags: ["#setuptour", "#creatorstudio", "#desksetup", "#minimalism"],
    mediaType: "IMAGE",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    category: "Studio",
    aspectRatio: "1:1",
    updatedAt: "2026-09-13T19:40:00Z",
  },
  {
    id: "draft_03",
    title: "Kinetic 3D Typography Reel",
    caption:
      "Fluid kinetic typography simulation rendered in octane. Testing viral audio hooks and dynamic captions for maximum retention.\n\n#3danimation #motiongraphics #c4d #kinetic",
    hashtags: ["#3danimation", "#motiongraphics", "#c4d", "#kinetic"],
    mediaType: "REEL",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    category: "Motion",
    aspectRatio: "16:9",
    updatedAt: "2026-09-12T14:20:00Z",
  },
  {
    id: "draft_04",
    title: "Horizon Drop 04 Launch Campaign",
    caption:
      "The next chapter in algorithmic design assets. Limited edition token access starts this Friday. Are you on the early whitelist?\n\n#launch #designtokens #saasgrowth #creativetools",
    hashtags: ["#launch", "#designtokens", "#saasgrowth", "#creativetools"],
    mediaType: "CAROUSEL",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80",
    category: "Launch",
    aspectRatio: "1:1",
    updatedAt: "2026-09-11T16:00:00Z",
  },
  {
    id: "draft_05",
    title: "Architectural Lighting Study",
    caption:
      "Golden hour shadows interacting with brutalist concrete geometry. Visual rhythm and spatial serenity in pure form.\n\n#architecture #lighting #minimalmood #brutalism",
    hashtags: ["#architecture", "#lighting", "#minimalmood", "#brutalism"],
    mediaType: "IMAGE",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
    category: "Design",
    aspectRatio: "4:5",
    updatedAt: "2026-09-09T08:30:00Z",
  },
];

export const mockAnalytics: MockAnalytics = {
  audienceReach: {
    value: "1.42M",
    trend: "+14.8%",
    subtext: "vs. previous 30 days",
  },
  engagementRate: {
    value: "5.84%",
    trend: "+1.2%",
    subtext: "across active posts",
  },
  scheduledInQueue: {
    value: "18 Posts",
    trend: "+6 queued",
    subtext: "Next post in 2h 15m",
  },
  publishingVelocity: {
    value: "99.4%",
    trend: "+0.4%",
    subtext: "0 failed containers",
  },
  followerGrowth: [
    { date: "Aug 15", count: 128400 },
    { date: "Aug 22", count: 131900 },
    { date: "Aug 29", count: 135600 },
    { date: "Sep 05", count: 139100 },
    { date: "Sep 12", count: 142800 },
  ],
  channelBreakdown: [
    { channel: "Feed Posts", percentage: 54 },
    { channel: "Reels & Video", percentage: 28 },
    { channel: "Explore Discovery", percentage: 14 },
    { channel: "Stories", percentage: 4 },
  ],
};

export interface MockMediaAsset {
  id: string;
  name: string;
  url: string;
  type: "IMAGE" | "REEL" | "VIDEO";
  aspectRatio: "1:1" | "4:5" | "9:16" | "16:9";
  dimensions: string;
  size: string;
  sizeBytes: number;
  uploadedAt: string;
  tags: string[];
}

export const mockMediaAssets: MockMediaAsset[] = [
  {
    id: "asset_01",
    name: "horizon_drop_neon_hero.jpg",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    type: "IMAGE",
    aspectRatio: "1:1",
    dimensions: "2160 × 2160",
    size: "3.4 MB",
    sizeBytes: 3565158,
    uploadedAt: "Sep 14, 2026",
    tags: ["Branding", "CGI / 3D", "Hero"],
  },
  {
    id: "asset_02",
    name: "holographic_glass_render_02.png",
    url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    type: "IMAGE",
    aspectRatio: "1:1",
    dimensions: "2160 × 2160",
    size: "4.8 MB",
    sizeBytes: 5033164,
    uploadedAt: "Sep 13, 2026",
    tags: ["CGI / 3D", "Abstract", "Tokens"],
  },
  {
    id: "asset_03",
    name: "brutalist_concrete_motion.mp4",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    type: "REEL",
    aspectRatio: "9:16",
    dimensions: "1080 × 1920",
    size: "18.2 MB",
    sizeBytes: 19084083,
    uploadedAt: "Sep 10, 2026",
    tags: ["Architecture", "Motion", "Reel"],
  },
  {
    id: "asset_04",
    name: "cadmium_rose_minimal_01.jpg",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    type: "IMAGE",
    aspectRatio: "4:5",
    dimensions: "1080 × 1350",
    size: "2.1 MB",
    sizeBytes: 2202009,
    uploadedAt: "Sep 08, 2026",
    tags: ["Editorial", "Minimalism", "Design"],
  },
  {
    id: "asset_05",
    name: "creator_studio_desk_setup.jpg",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    type: "IMAGE",
    aspectRatio: "1:1",
    dimensions: "2160 × 2160",
    size: "3.9 MB",
    sizeBytes: 4089446,
    uploadedAt: "Sep 05, 2026",
    tags: ["Workspace", "Studio", "Hardware"],
  },
  {
    id: "asset_06",
    name: "monolithic_dark_ui_walkthrough.mp4",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    type: "VIDEO",
    aspectRatio: "16:9",
    dimensions: "1920 × 1080",
    size: "24.5 MB",
    sizeBytes: 25690112,
    uploadedAt: "Sep 02, 2026",
    tags: ["Product", "UI / UX", "Walkthrough"],
  },
  {
    id: "asset_07",
    name: "geometric_neon_sculpture.jpg",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80",
    type: "IMAGE",
    aspectRatio: "4:5",
    dimensions: "1080 × 1350",
    size: "3.1 MB",
    sizeBytes: 3250585,
    uploadedAt: "Aug 29, 2026",
    tags: ["Branding", "CGI / 3D", "Lighting"],
  },
  {
    id: "asset_08",
    name: "tokyo_cyberpunk_nightscape.mp4",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    type: "REEL",
    aspectRatio: "9:16",
    dimensions: "1080 × 1920",
    size: "16.4 MB",
    sizeBytes: 17196646,
    uploadedAt: "Aug 25, 2026",
    tags: ["Motion", "Reel", "Nightscape"],
  },
];

export const mockNotifications: MockNotification[] = [
  {
    id: "notif_01",
    type: "POST_PUBLISHED",
    title: "Post Published to Instagram",
    message: "Carousel #18029384918234812 published live to @luminous.studio via Meta Graph API.",
    isRead: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    link: "/dashboard/activity",
    metadata: { containerId: "18029384918234812", handle: "@luminous.studio" },
  },
  {
    id: "notif_02",
    type: "SCHEDULED_REMINDER",
    title: "Upcoming Scheduled Post",
    message: "'5 principles for effortless grid harmony' is scheduled for execution today at 18:45 PST.",
    isRead: false,
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(), // 42 mins ago
    link: "/dashboard/scheduled",
    metadata: { slot: "18:45 PST" },
  },
  {
    id: "notif_03",
    type: "TOKEN_EXPIRING",
    title: "OAuth Token Refresh Required",
    message: "Meta long-lived user token expires in 8 days. Click to refresh token lifespan.",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    link: "/dashboard/settings",
    metadata: { daysRemaining: 8 },
  },
  {
    id: "notif_04",
    type: "POST_FAILED",
    title: "Publishing Check Warning",
    message: "Video container encoding returned subcode 2207001 (re-encoding needed for 1080x1920).",
    isRead: true,
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), // Yesterday
    readAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    link: "/dashboard/activity",
    metadata: { errorCode: 2207001 },
  },
  {
    id: "notif_05",
    type: "SYSTEM",
    title: "Meta Graph API v20.0 Verified",
    message: "Connected webhooks and permissions successfully validated against Instagram Graph API.",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    readAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    link: "/dashboard/settings",
    metadata: { apiVersion: "v20.0" },
  },
  {
    id: "notif_06",
    type: "ACCOUNT_DISCONNECTED",
    title: "Secondary Account Notice",
    message: "Secondary account @creator.lab requires permissions renewal to continue syncing analytics.",
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    readAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    link: "/dashboard/settings",
    metadata: { account: "@creator.lab" },
  },
];

export interface MockUserSettings {
  autoFirstComment: boolean;
  firstCommentTemplate: string;
  defaultRatio: "1:1" | "4:5" | "16:9";
  defaultTimezone: string;
  shareToFacebook: boolean;
  autoHashtagsInComment: boolean;
  hideLikeCount: boolean;
  disableComments: boolean;
  tokenDaysLeft: number;
  connectedAccount?: {
    username: string;
    accountType: string;
    facebookPageName: string;
    connectedAt: string;
  };
  metaAppId: string;
  metaAppSecret?: string;
}

export const mockUserSettings: MockUserSettings = {
  autoFirstComment: true,
  firstCommentTemplate: "Drop a 🔥 if you want a DM invite to tomorrow's backstage breakdown!",
  defaultRatio: "1:1",
  defaultTimezone: "PST (UTC-8)",
  shareToFacebook: true,
  autoHashtagsInComment: false,
  hideLikeCount: false,
  disableComments: false,
  tokenDaysLeft: 52,
  metaAppId: "91823471029384",
};

export interface MockPublishingAttempt {
  id: string;
  postId: string;
  postCaption?: string;
  scheduledPostId?: string;
  status: "INITIATED" | "CONTAINER_CREATED" | "PROCESSING" | "SUCCESS" | "FAILED";
  creationId?: string;
  statusCode?: number;
  errorMessage?: string;
  errorSubcode?: number;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export const mockPublishingAttempts: MockPublishingAttempt[] = [
  {
    id: "attempt_demo_01",
    postId: "post_01",
    postCaption: "Precision meets pure aesthetic momentum.",
    scheduledPostId: "sched_01",
    status: "SUCCESS",
    creationId: "container_17992019482710293",
    statusCode: 200,
    requestPayload: {
      mediaUrls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"],
      mediaType: "CAROUSEL",
      caption: "Precision meets pure aesthetic momentum.",
    },
    responsePayload: {
      id: "18029384918234812",
      permalink: "https://instagram.com/p/DF93kLA291a",
    },
    attemptNumber: 1,
    startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3600 * 1000 + 1420).toISOString(),
    durationMs: 1420,
  },
  {
    id: "attempt_demo_02",
    postId: "post_02",
    postCaption: "Brutalist architecture in motion.",
    scheduledPostId: "sched_02",
    status: "FAILED",
    creationId: "container_17992019482710294",
    statusCode: 400,
    errorMessage: "Video container encoding returned subcode 2207001 (unsupported framerate or profile).",
    errorSubcode: 2207001,
    requestPayload: {
      mediaUrls: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
      mediaType: "REEL",
    },
    responsePayload: {
      error: {
        message: "The video could not be processed",
        type: "OAuthException",
        code: 100,
        error_subcode: 2207001,
      },
    },
    attemptNumber: 1,
    startedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 7200 * 1000 + 2100).toISOString(),
    durationMs: 2100,
  },
];




