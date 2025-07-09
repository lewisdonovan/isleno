// Board column type
export interface BoardColumn {
  id: string;
  title: string;
  type: string;
}

// Board group type
export interface BoardGroup {
  id: string;
  title: string;
  color: string;
  position: number;
}

// Board column value structure
export interface BoardColumnValue {
  id: string;
  value: string | null;
  type: string;
  column: {
    id: string;
    title: string;
  };
  text: string | null;
}

// Board item type
export interface BoardItem {
  id: string;
  name: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
  column_values: BoardColumnValue[];
  linked_items?: BoardItem[]; // Nested board items
}

// Items page pagination structure
export interface ItemsPage {
  cursor: string | null;
  has_more?: boolean;
  items: BoardItem[];
}

// Board type (basic info for list)
export interface Board {
  id: string;
  name: string;
  description?: string;
  state?: string;
  board_kind?: string;
  board_folder_id?: string;
  updated_at?: string;
}

// Board details type (for single board view)
export interface BoardDetails extends Board {
  columns?: BoardColumn[];
  groups?: BoardGroup[];
  items_page?: ItemsPage;
}

// Monday.com API response for boards list/details
export interface MondayBoardsResponse {
  data?: {
    boards?: BoardDetails[];
  };
  errors?: Array<{
    message: string;
  }>;
}

// Root structure for current-projects.json
export interface MondayProjectsData {
  boards: Array<{
    items_page: ItemsPage;
  }>;
} 