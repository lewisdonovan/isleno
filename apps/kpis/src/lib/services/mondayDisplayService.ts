interface Board {
  id: string;
  name: string;
}

export class MondayDisplayService {
  /**
   * Fetches Monday.com boards data
   */
  static async fetchBoards(limit: number = 5): Promise<Board[]> {
    const response = await fetch(`/api/integrations/monday/boards?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch boards');
    }

    const result = await response.json();
    
    return result.data?.boards || [];
  }
} 