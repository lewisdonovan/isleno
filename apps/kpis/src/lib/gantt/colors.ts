export interface GanttColorScheme {
  barProgressColor: string;
  barProgressSelectedColor: string;
  barBackgroundColor: string;
  barBackgroundSelectedColor: string;
  projectProgressColor: string;
  projectProgressSelectedColor: string;
  projectBackgroundColor: string;
  projectBackgroundSelectedColor: string;
  milestoneBackgroundColor: string;
  milestoneBackgroundSelectedColor: string;
}

export const getDarkModeColors = (): GanttColorScheme => ({
  barProgressColor: "#f8fafc",
  barProgressSelectedColor: "#e2e8f0",
  barBackgroundColor: "#334155",
  barBackgroundSelectedColor: "#475569",
  projectProgressColor: "#10b981",
  projectProgressSelectedColor: "#059669",
  projectBackgroundColor: "#1e293b",
  projectBackgroundSelectedColor: "#334155",
  milestoneBackgroundColor: "#3b82f6",
  milestoneBackgroundSelectedColor: "#2563eb",
});

export const getLightModeColors = (): GanttColorScheme => ({
  barProgressColor: "#1f2937",
  barProgressSelectedColor: "#374151",
  barBackgroundColor: "#e5e7eb",
  barBackgroundSelectedColor: "#d1d5db",
  projectProgressColor: "#059669",
  projectProgressSelectedColor: "#047857",
  projectBackgroundColor: "#10b981",
  projectBackgroundSelectedColor: "#059669",
  milestoneBackgroundColor: "#3b82f6",
  milestoneBackgroundSelectedColor: "#2563eb",
});

export const getGanttColors = (isDark: boolean): GanttColorScheme => {
  return isDark ? getDarkModeColors() : getLightModeColors();
}; 