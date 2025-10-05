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

// Base color palette
const BASE_COLORS = {
  // Entity types
  Article: "#3b82f6", // blue
  Person: "#10b981", // green
  Organization: "#8b5cf6", // purple
  Location: "#f59e0b", // amber
  Concept: "#ec4899", // pink
  Event: "#ef4444", // red
  Date: "#6366f1", // indigo
  Technology: "#06b6d4", // cyan

  // Sentiment
  positive: "#16a34a", // green-600
  negative: "#dc2626", // red-600
  neutral: "#64748b", // slate-500

  // Financial specific
  Revenue: "#10b981", // green
  Profit: "#059669", // emerald-600
  Cost: "#ef4444", // red
  Expense: "#f97316", // orange
  Metric: "#3b82f6", // blue
  Segment: "#8b5cf6", // purple
  Period: "#6366f1", // indigo
  Margin: "#14b8a6", // teal
};

export const VISUALIZATION_CONFIGS: Record<ArticleType, VisualizationConfig> = {
  general: {
    articleType: "general",
    name: "General Layout",
    description: "Balanced layout for mixed content",
    nodeColors: {
      Article: BASE_COLORS.Article,
      Person: BASE_COLORS.Person,
      Organization: BASE_COLORS.Organization,
      Location: BASE_COLORS.Location,
      Concept: BASE_COLORS.Concept,
      Event: BASE_COLORS.Event,
      Date: BASE_COLORS.Date,
      Technology: BASE_COLORS.Technology,
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
    priorityTypes: ["Organization", "Person", "Event"],
    sentimentOverride: true,
  },

  "financial-statement": {
    articleType: "financial-statement",
    name: "Financial Flow",
    description: "Hierarchical layout showing financial statement flow",
    nodeColors: {
      Article: BASE_COLORS.Article,
      Organization: BASE_COLORS.Organization,
      ORGANIZATION: BASE_COLORS.Organization,

      // Financial metrics with semantic colors (uppercase versions for dynamic entities)
      "REVENUE METRIC": BASE_COLORS.Revenue,
      "REVENUE STREAM": "#059669", // emerald-600
      Revenue: BASE_COLORS.Revenue,
      Profit: BASE_COLORS.Profit,
      Cost: BASE_COLORS.Cost,
      Expense: BASE_COLORS.Expense,
      Metric: BASE_COLORS.Metric,

      // Business structure
      Segment: BASE_COLORS.Segment,
      "CUSTOMER SEGMENT": BASE_COLORS.Segment,
      "GEOGRAPHIC MARKET": BASE_COLORS.Location,
      Division: "#a855f7", // purple-500
      Department: "#c084fc", // purple-400

      // Time and context
      "TIME PERIOD": BASE_COLORS.Period,
      Period: BASE_COLORS.Period,
      Date: BASE_COLORS.Date,
      DATE: BASE_COLORS.Date,
      Margin: BASE_COLORS.Margin,
      Percentage: "#06b6d4", // cyan

      // Fallback for Concept/Event
      Concept: BASE_COLORS.Concept,
      CONCEPT: BASE_COLORS.Concept,
      Event: BASE_COLORS.Event,
    },
    layout: {
      type: "hierarchical",
      direction: "LR", // Left to Right for financial flow (like Sankey diagram)
      spacing: {
        nodeHorizontal: 350,
        nodeVertical: 100,
        sectionGap: 80,
      },
      groupBy: "custom", // Custom grouping for financial hierarchy
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 3.5,
      highlightWidth: 5,
      defaultColor: "#64748b",
      strongColor: "#3b82f6",
      highlightColor: "#fbbf24",
      animated: true, // Animate to show flow
    },
    priorityTypes: ["Revenue", "Profit", "Segment", "Organization"],
    sentimentOverride: false, // Use semantic colors, not sentiment
    columnOrder: {
      // Column 1: Total revenue
      "REVENUE METRIC": 1,
      
      // Column 2: Revenue breakdown by segment
      "REVENUE STREAM": 2,
      
      // Column 3: Supporting context
      "ORGANIZATION": 3,
      "CUSTOMER SEGMENT": 3,
      "GEOGRAPHIC MARKET": 3,
      
      // Column 4: Time period
      "TIME PERIOD": 4,
      "DATE": 4,
      
      // Column 5: Other concepts
      "CONCEPT": 5,
    },
  },

  investment: {
    articleType: "investment",
    name: "Investment Network",
    description: "Network layout showing investment relationships",
    nodeColors: {
      Article: BASE_COLORS.Article,
      Organization: BASE_COLORS.Organization,
      Person: BASE_COLORS.Person,

      // Investment specific
      Investor: "#8b5cf6", // purple
      Company: "#3b82f6", // blue
      Fund: "#6366f1", // indigo
      Valuation: "#10b981", // green
      Investment: "#14b8a6", // teal
      Round: "#06b6d4", // cyan

      Concept: BASE_COLORS.Concept,
      Date: BASE_COLORS.Date,
      Location: BASE_COLORS.Location,
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
    priorityTypes: ["Investor", "Company", "Valuation"],
    sentimentOverride: true,
  },

  "revenue-analysis": {
    articleType: "revenue-analysis",
    name: "Revenue Breakdown",
    description: "Hierarchical layout showing revenue composition",
    nodeColors: {
      Article: BASE_COLORS.Article,
      Organization: BASE_COLORS.Organization,
      ORGANIZATION: "#8b5cf6", // purple - organizations

      // Revenue specific (both capitalized and uppercase versions)
      Revenue: BASE_COLORS.Revenue,
      "REVENUE METRIC": "#10b981", // green - for total/aggregate revenue
      RevenueStream: "#14b8a6", // teal - for individual revenue streams
      "REVENUE STREAM": "#14b8a6", // teal - for individual revenue streams
      Product: "#3b82f6", // blue
      Service: "#06b6d4", // cyan
      Customer: "#a855f7", // purple-500
      "CUSTOMER SEGMENT": "#a855f7", // purple-500 - customer segments
      Segment: "#c084fc", // purple-400
      Channel: "#f59e0b", // amber
      Market: "#f97316", // orange - markets
      "GEOGRAPHIC MARKET": "#f97316", // orange - geographic markets
      Metric: BASE_COLORS.Metric,

      // Time and context
      "TIME PERIOD": "#6366f1", // indigo - time periods
      Period: "#6366f1", // indigo
      Concept: "#ec4899", // pink - concepts
      CONCEPT: "#ec4899", // pink - concepts
      Date: "#818cf8", // indigo-400
      DATE: "#818cf8", // indigo-400
      Location: "#f59e0b", // amber
    },
    layout: {
      type: "hierarchical",
      direction: "LR",
      spacing: {
        nodeHorizontal: 280,
        nodeVertical: 130,
        sectionGap: 70,
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
    priorityTypes: ["Revenue", "RevenueStream", "Product", "Customer"],
    sentimentOverride: false,
    columnOrder: {
      // Column 1: Total revenue
      "Revenue": 1,
      "REVENUE METRIC": 1,
      
      // Column 2: Revenue streams
      "RevenueStream": 2,
      "REVENUE STREAM": 2,
      
      // Column 3: Products and services
      "Product": 3,
      "Service": 3,
      
      // Column 4: Customers and segments
      "Customer": 4,
      "Segment": 4,
      "CUSTOMER SEGMENT": 4,
      
      // Column 5: Channels and markets
      "Channel": 5,
      "Market": 5,
      "GEOGRAPHIC MARKET": 5,
      
      // Column 6: Context
      "ORGANIZATION": 6,
      "DATE": 6,
      "TIME PERIOD": 6,
      "CONCEPT": 6,
    },
  },

  "organizational-chart": {
    articleType: "organizational-chart",
    name: "Org Chart",
    description: "Hierarchical layout showing organizational structure",
    nodeColors: {
      Article: BASE_COLORS.Article,
      Organization: BASE_COLORS.Organization,
      Person: BASE_COLORS.Person,

      // Org structure
      Division: "#8b5cf6", // purple
      Department: "#a855f7", // purple-500
      Team: "#c084fc", // purple-400
      SubTeam: "#d8b4fe", // purple-300

      // Roles
      Executive: "#ef4444", // red (high importance)
      Manager: "#f59e0b", // amber
      Role: BASE_COLORS.Concept,

      Location: BASE_COLORS.Location,
      Concept: BASE_COLORS.Concept,
    },
    layout: {
      type: "hierarchical",
      direction: "TB",
      spacing: {
        nodeHorizontal: 220,
        nodeVertical: 100,
        sectionGap: 60,
      },
      groupBy: "custom", // Custom for org hierarchy
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 3,
      highlightWidth: 4,
      defaultColor: "#94a3b8",
      strongColor: "#8b5cf6",
      highlightColor: "#fbbf24",
      animated: false,
    },
    priorityTypes: ["Person", "Division", "Department", "Team"],
    sentimentOverride: false,
  },

  "security-incident": {
    articleType: "security-incident",
    name: "Attack Chain",
    description: "Flow layout showing attack progression",
    nodeColors: {
      Article: BASE_COLORS.Article,

      // Threat actors
      Attacker: "#dc2626", // red-600 (negative)
      ThreatActor: "#b91c1c", // red-700

      // Victims
      Victim: "#f59e0b", // amber (warning)
      Organization: "#f97316", // orange

      // Attack components
      Vulnerability: "#ef4444", // red
      Exploit: "#dc2626", // red-600
      Malware: "#b91c1c", // red-700
      AttackVector: "#f87171", // red-400

      // Systems
      System: "#3b82f6", // blue
      Technology: BASE_COLORS.Technology,
      Data: "#8b5cf6", // purple

      // Response
      SecurityTool: "#10b981", // green
      Detection: "#059669", // emerald-600

      Date: BASE_COLORS.Date,
      Location: BASE_COLORS.Location,
      Concept: BASE_COLORS.Concept,
    },
    layout: {
      type: "hierarchical",
      direction: "LR", // Left to Right for attack flow
      spacing: {
        nodeHorizontal: 300,
        nodeVertical: 120,
        sectionGap: 80,
      },
      groupBy: "custom",
    },
    edgeStyle: {
      defaultWidth: 2.5,
      strongWidth: 4,
      highlightWidth: 5,
      defaultColor: "#94a3b8",
      strongColor: "#dc2626",
      highlightColor: "#fbbf24",
      animated: true,
    },
    priorityTypes: ["Attacker", "Victim", "Vulnerability", "System"],
    sentimentOverride: false, // Use semantic colors
    columnOrder: {
      // Column 1: Threat actors
      "Attacker": 1,
      "ThreatActor": 1,
      
      // Column 2: Attack methods
      "Vulnerability": 2,
      "Exploit": 2,
      "Malware": 2,
      "AttackVector": 2,
      
      // Column 3: Targets
      "Victim": 3,
      "System": 3,
      "Data": 3,
      
      // Column 4: Detection and response
      "SecurityTool": 4,
      "Detection": 4,
      
      // Column 5: Context
      "ORGANIZATION": 5,
      "Technology": 5,
      "DATE": 5,
      "TIME PERIOD": 5,
      "Location": 5,
      "CONCEPT": 5,
    },
  },

  "market-analysis": {
    articleType: "market-analysis",
    name: "Market Landscape",
    description: "Network layout showing competitive landscape",
    nodeColors: {
      Article: BASE_COLORS.Article,
      Organization: BASE_COLORS.Organization,

      // Market players
      Company: "#3b82f6", // blue
      Competitor: "#8b5cf6", // purple
      Leader: "#10b981", // green
      Challenger: "#f59e0b", // amber

      // Market elements
      Market: "#ec4899", // pink
      Segment: "#a855f7", // purple-500
      Product: "#06b6d4", // cyan
      Technology: BASE_COLORS.Technology,
      Trend: "#14b8a6", // teal

      // Metrics
      MarketShare: "#10b981", // green
      Metric: BASE_COLORS.Metric,

      Person: BASE_COLORS.Person,
      Location: BASE_COLORS.Location,
      Concept: BASE_COLORS.Concept,
      Date: BASE_COLORS.Date,
    },
    layout: {
      type: "force",
      spacing: {
        nodeHorizontal: 320,
        nodeVertical: 180,
        sectionGap: 90,
      },
      groupBy: "importance",
    },
    edgeStyle: {
      defaultWidth: 2,
      strongWidth: 3.5,
      highlightWidth: 5,
      defaultColor: "#94a3b8",
      strongColor: "#8b5cf6",
      highlightColor: "#fbbf24",
      animated: false,
    },
    priorityTypes: ["Company", "Market", "Product", "Trend"],
    sentimentOverride: true,
  },
};

export function getVisualizationConfig(
  articleType: ArticleType
): VisualizationConfig {
  return VISUALIZATION_CONFIGS[articleType] || VISUALIZATION_CONFIGS.general;
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

  // Use type-specific color from config
  return config.nodeColors[type] || BASE_COLORS.neutral;
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
