import { ArticleType } from "./article-types";

export interface NodeColorConfig {
  [key: string]: string;
}

export interface LayoutConfig {
  type: "hierarchical" | "grid" | "force" | "circular" | "sankey";
  direction?: "TB" | "LR" | "BT" | "RL"; // Top-Bottom, Left-Right, etc.
  spacing: {
    nodeHorizontal: number;
    nodeVertical: number;
    sectionGap: number;
    articleGap?: number; // Extra spacing after the article node (for LR layouts)
  };
  groupBy?: "type" | "importance" | "sentiment" | "custom";
}

export interface EdgeStyleConfig {
  defaultWidth: number;
  strongWidth: number;
  highlightWidth: number;
  defaultColor: string;
  strongColor: string;
  highlightColor: string;
  animated: boolean;
}

export interface VisualizationConfig {
  articleType: ArticleType;
  name: string;
  description: string;
  nodeColors: NodeColorConfig;
  layout: LayoutConfig;
  edgeStyle: EdgeStyleConfig;
  priorityTypes: string[]; // Entity types to show prominently
  sentimentOverride: boolean; // Whether sentiment colors override type colors
  columnOrder?: Record<string, number>; // For LR layouts: entity type -> column number
}

// Base color palette - maps entity types to colors
const BASE_COLORS = {
  // Sentiment colors
  positive: "#16a34a", // green-600
  negative: "#dc2626", // red-600
  neutral: "#64748b", // slate-500

  // General entity types
  Person: "#10b981", // green
  Organization: "#8b5cf6", // purple
  Location: "#f59e0b", // amber
  Technology: "#06b6d4", // cyan
  Event: "#ef4444", // red
  Concept: "#ec4899", // pink
  Date: "#6366f1", // indigo

  // Investment entity types
  Company: "#3b82f6", // blue
  Investor: "#8b5cf6", // purple
  Fund: "#6366f1", // indigo
  Valuation: "#10b981", // green
  Investment: "#14b8a6", // teal
  Round: "#06b6d4", // cyan
  Sector: "#a855f7", // purple-500
  Metric: "#3b82f6", // blue

  // Revenue entity types
  RevenueMetric: "#10b981", // green
  RevenueStream: "#14b8a6", // teal
  Product: "#3b82f6", // blue
  Service: "#06b6d4", // cyan
  Customer: "#a855f7", // purple-500
  CustomerSegment: "#a855f7", // purple-500
  Channel: "#f59e0b", // amber
  Market: "#f97316", // orange
  GeographicMarket: "#f97316", // orange
  TimePeriod: "#6366f1", // indigo
};

export const VISUALIZATION_CONFIGS: Record<ArticleType, VisualizationConfig> = {
  general: {
    articleType: "general",
    name: "General Layout",
    description: "Balanced layout for mixed content",
    nodeColors: {
      // Use BASE_COLORS - normalization handles all variations
      ...BASE_COLORS,
    },
    layout: {
      type: "grid",
      spacing: {
        nodeHorizontal: 300,
        nodeVertical: 150,
        sectionGap: 50,
      },
      groupBy: "type",
    },
    edgeStyle: {
      defaultWidth: 1.5,
      strongWidth: 3,
      highlightWidth: 4,
      defaultColor: "#94a3b8",
      strongColor: "#6366f1",
      highlightColor: "#fbbf24",
      animated: false,
    },
    priorityTypes: [],
    sentimentOverride: true,
  },

  investment: {
    articleType: "investment",
    name: "Investment Network",
    description: "Network layout showing investment relationships",
    nodeColors: {
      // Dynamic color generation handles all entity types
      ...BASE_COLORS,
    },
    layout: {
      type: "force",
      spacing: {
        nodeHorizontal: 350,
        nodeVertical: 200,
        sectionGap: 100,
      },
      groupBy: "importance",
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 4,
      highlightWidth: 5,
      defaultColor: "#94a3b8",
      strongColor: "#8b5cf6",
      highlightColor: "#fbbf24",
      animated: true,
    },
    priorityTypes: [],
    sentimentOverride: true,
  },

  "revenue-analysis": {
    articleType: "revenue-analysis",
    name: "Revenue Breakdown",
    description: "Hierarchical layout showing revenue composition",
    nodeColors: {
      // Dynamic color generation handles all entity types
      ...BASE_COLORS,
    },
    layout: {
      type: "hierarchical",
      direction: "LR",
      spacing: {
        nodeHorizontal: 280,
        nodeVertical: 150, // Increased to prevent node overlap
        sectionGap: 70,
        articleGap: 200, // Extra spacing after article node
      },
      groupBy: "custom",
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 3.5,
      highlightWidth: 5,
      defaultColor: "#64748b",
      strongColor: "#10b981",
      highlightColor: "#fbbf24",
      animated: true,
    },
    priorityTypes: [],
    sentimentOverride: false,
  },

  "mystery-investigation": {
    articleType: "mystery-investigation",
    name: "Mystery Investigation",
    description: "Network layout for solving mysteries and investigations",
    nodeColors: {
      ...BASE_COLORS,
      // Mystery-specific colors
      Evidence: "#ef4444", // red - critical evidence
      Clue: "#f59e0b", // amber - clues
    },
    layout: {
      type: "force",
      spacing: {
        nodeHorizontal: 300,
        nodeVertical: 180,
        sectionGap: 100,
      },
      groupBy: "importance",
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 4,
      highlightWidth: 5,
      defaultColor: "#94a3b8",
      strongColor: "#ef4444", // red for contradictions
      highlightColor: "#fbbf24",
      animated: true,
    },
    priorityTypes: [],
    sentimentOverride: true, // Highlight guilty/suspicious entities
  },
};

export function getVisualizationConfig(
  articleType: ArticleType
): VisualizationConfig {
  return VISUALIZATION_CONFIGS[articleType] || VISUALIZATION_CONFIGS.general;
}

// Normalize entity type to a consistent format for color matching
function normalizeEntityType(type: string): string {
  // Convert to lowercase and remove plurals
  let normalized = type.toLowerCase().trim();

  // Remove common plural endings
  if (normalized.endsWith("ies")) {
    normalized = normalized.slice(0, -3) + "y"; // companies -> company
  } else if (normalized.endsWith("es")) {
    normalized = normalized.slice(0, -2); // services -> service
  } else if (normalized.endsWith("s")) {
    normalized = normalized.slice(0, -1); // products -> product
  }

  return normalized;
}

// Generate a consistent color from a string (deterministic hashing)
function generateColorFromString(str: string): string {
  // Normalize the string first
  const normalized = normalizeEntityType(str);

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Define a palette of distinct, professional colors
  const colorPalette = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#10b981", // green
    "#f59e0b", // amber
    "#ec4899", // pink
    "#ef4444", // red
    "#6366f1", // indigo
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f97316", // orange
    "#a855f7", // purple-500
    "#c084fc", // purple-400
    "#059669", // emerald-600
    "#d946ef", // fuchsia-500
    "#0ea5e9", // sky-500
    "#84cc16", // lime-500
    "#f43f5e", // rose-500
    "#8b5cf6", // violet-500
  ];

  // Use hash to select a color from palette
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

export function getNodeColor(
  type: string,
  sentiment: string | undefined,
  config: VisualizationConfig
): string {
  // If sentiment override is enabled and sentiment exists, use sentiment color
  if (config.sentimentOverride && sentiment) {
    if (sentiment === "negative") return BASE_COLORS.negative;
    if (sentiment === "positive") return BASE_COLORS.positive;
  }

  // Try exact match first (for special cases like "REVENUE METRIC")
  if (config.nodeColors[type]) {
    return config.nodeColors[type];
  }

  // Try normalized match (handles Person/PERSON/People/PEOPLE)
  const normalized = normalizeEntityType(type);
  for (const [key, color] of Object.entries(config.nodeColors)) {
    if (normalizeEntityType(key) === normalized) {
      return color;
    }
  }

  // Generate consistent color for unknown types
  // This ensures same entity type always gets same color
  return generateColorFromString(type);
}

export function getEdgeStyle(
  isFromArticle: boolean,
  strength: string | undefined,
  isHighlighted: boolean,
  config: VisualizationConfig
) {
  const shouldFade = false; // Will be set by caller based on highlighting

  return {
    strokeWidth: isHighlighted
      ? config.edgeStyle.highlightWidth
      : strength === "strong"
      ? config.edgeStyle.strongWidth
      : isFromArticle
      ? config.edgeStyle.strongWidth - 0.5
      : config.edgeStyle.defaultWidth,
    stroke: isHighlighted
      ? config.edgeStyle.highlightColor
      : isFromArticle
      ? config.nodeColors.Article || "#3b82f6"
      : strength === "strong"
      ? config.edgeStyle.strongColor
      : config.edgeStyle.defaultColor,
    opacity: shouldFade ? 0.2 : 1,
  };
}
