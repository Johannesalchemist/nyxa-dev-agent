// amuse_events.config.ts — Configuration and constants for Amuse Events

export const MODERATION_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const DEFAULT_SEARCH_RADIUS_KM = 25;

export const INSTANT_DATE_RADIUS_KM = 5;

export const MYSTERY_DATE_REVEAL_MINUTES = 30;

export const MATCHING_SCORE_THRESHOLD = 0.6;

export const MATCHING_WEIGHTS = {
  distance: 0.3,
  interest_overlap: 0.3,
  activity_level: 0.2,
  room_affinity: 0.2,
};

export const GROUP_CHEMISTRY_SIZE = {
  men: 4,
  women: 4,
};

export const HEATMAP_ZONE_RADIUS_KM = 1;
export const HEATMAP_MIN_EVENTS = 3;

export const FEED_SORT_WEIGHTS = {
  dating_relevance: 0.4,
  distance: 0.3,
  activity: 0.15,
  premium_boost: 0.15,
};

export const TRUSTED_HOST_THRESHOLD = {
  min_events: 5,
  min_average_rating: 4.0,
};

export const SPAM_DETECTION = {
  max_events_per_hour: 5,
  max_events_per_day: 20,
  min_distance_between_events_km: 0.1,
};

export const PREMIUM_RULES = {
  standard: {
    moderation_delay: true,
    image_allowed: false,
    recurring_allowed: false,
    card_color: "grey" as const,
    card_size: "small" as const,
  },
  premium: {
    moderation_delay: false,
    image_allowed: true,
    recurring_allowed: true,
    card_color: "highlight" as const,
    card_size: "large" as const,
  },
};

export const ICEBREAKER_PROMPTS = {
  two_truths_one_lie: [
    "Tell two truths and one lie about yourself — can they guess which is the lie?",
    "Share two real travel stories and one made-up one!",
    "Name two foods you love and one you secretly hate.",
  ],
  would_you_rather: [
    "Would you rather have dinner on a rooftop or a picnic in a park?",
    "Would you rather travel back in time or into the future?",
    "Would you rather always be slightly early or fashionably late?",
  ],
  compatibility_quiz: [
    "What's your ideal Sunday morning — brunch out or lazy at home?",
    "Mountains or beach for a weekend getaway?",
    "Cooking together or ordering in?",
  ],
};

export const SPONTAN_OPTIONS = {
  "1": { label: "Coffee", event_type: "coffee" as const },
  "2": { label: "Walk", event_type: "walk" as const },
  "3": { label: "Drink", event_type: "date" as const },
  "4": { label: "Surprise", event_type: "adventure" as const },
};
