import { BoardItem, BoardColumnValue } from '@isleno/types/monday';

export interface PropertyRenovationData {
  name: string;
  acquisitionPrice: number; // numbers4
  renovationCosts: number; // formula668
  taxes: number; // numbers95
  pessimisticSalesPrice: number; // numbers90
  connectedBoardId?: string; // connect_boards64
}

export interface WeeklyFinancialMetrics {
  weeklyInvestment: {
    totalSpend: number;
    avgMonthlySpend: number;
  };
  weeklyMargin: {
    margin: number;
    weeklyMargin: number;
  };
  generatedValue: number;
}

// Parse column value from Monday.com data
function parseColumnValue(columnValues: BoardColumnValue[], columnId: string): any {
  const column = columnValues.find(cv => cv.id === columnId);
  if (!column) return 0;
  
  let value: string | number = '0';
  
  // Handle different field types based on the sample data pattern
  if (column.type === 'formula') {
    // Formula fields like formula668 use display_value
    value = (column as any).display_value || column.text || '0';
  } else if (column.type === 'numbers') {
    // Number fields like numbers4, numbers95, numbers90 use text
    value = column.text || '0';
  } else if (column.type === 'board_relation') {
    // Board relation fields like connect_boards64 use text
    value = column.text || '0';
  } else {
    // Default fallback
    value = column.text || '0';
  }
  
  const parsedValue = parseFloat(value as string) || 0;
  
  // Debug logging for specific fields
  if (columnId === 'formula668' || columnId === 'numbers4') {
    console.log(`Parsing ${columnId} (${column.type}):`, {
      text: column.text,
      display_value: (column as any).display_value,
      finalValue: parsedValue
    });
  }
  
  return parsedValue;
}

// Parse property renovation data from Monday.com items
function parsePropertyRenovationData(items: BoardItem[]): PropertyRenovationData[] {
  return items.map(item => {
    // Debug logging for the first item to understand the data structure
    if (items.indexOf(item) === 0) {
      console.log('Debugging first item column values:');
      item.column_values.forEach(cv => {
        console.log(`Column ${cv.id} (${cv.type}):`, {
          text: cv.text,
          display_value: (cv as any).display_value,
          value: cv.value
        });
      });
    }
    
    return {
      name: item.name,
      acquisitionPrice: parseColumnValue(item.column_values, 'numbers4'),
      renovationCosts: parseColumnValue(item.column_values, 'formula668'),
      taxes: parseColumnValue(item.column_values, 'numbers95'),
      pessimisticSalesPrice: parseColumnValue(item.column_values, 'numbers90'),
      connectedBoardId: parseColumnValue(item.column_values, 'connect_boards64') || undefined
    };
  });
}

// Calculate weekly financial metrics
export function calculateWeeklyFinancialMetrics(properties: PropertyRenovationData[]): WeeklyFinancialMetrics {
  // Weekly Investment calculations
  const totalSpend = properties.reduce((sum, property) => {
    return sum + property.acquisitionPrice + property.taxes; // Not including renovation costs
  }, 0);
  
  const avgMonthlySpend = (totalSpend * 52) / 12; // Convert weekly to monthly
  
  // Weekly Margin calculations
  const totalMargin = properties.reduce((sum, property) => {
    const totalCost = property.acquisitionPrice + property.renovationCosts + property.taxes;
    const margin = property.pessimisticSalesPrice - totalCost;
    return sum + margin;
  }, 0);
  
  const weeklyMargin = totalMargin / 6; // Divide by 6 weeks of renovation
  
  // Generated Value
  const generatedValue = weeklyMargin - (totalSpend / 52); // weekly margin - weekly investment
  
  return {
    weeklyInvestment: {
      totalSpend,
      avgMonthlySpend
    },
    weeklyMargin: {
      margin: totalMargin,
      weeklyMargin
    },
    generatedValue
  };
}

// Service class for property database operations
export class PropertyDatabaseService {
  private static instance: PropertyDatabaseService;
  private cachedData: PropertyRenovationData[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): PropertyDatabaseService {
    if (!PropertyDatabaseService.instance) {
      PropertyDatabaseService.instance = new PropertyDatabaseService();
    }
    return PropertyDatabaseService.instance;
  }

  // Fetch property renovation data from API with caching
  async fetchPropertyRenovationData(options: { force?: boolean } = {}): Promise<PropertyRenovationData[]> {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!options.force && this.cachedData && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedData;
    }

    try {
      const response = await fetch('/api/integrations/monday/property-database-renovation');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch property renovation data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for API errors
      if (data.error) {
        throw new Error(`API Error: ${data.error}`);
      }
      
      // Parse the data
      const items = data.boards?.[0]?.groups?.[0]?.items_page?.items || [];
      console.log('Fetched items from property database:', items.length);
      
      const parsedData = parsePropertyRenovationData(items);
      console.log('Parsed property renovation data:', parsedData.length);
      
      this.cachedData = parsedData;
      this.lastFetchTime = now;
      
      return parsedData;
    } catch (error) {
      console.error('Error fetching property renovation data:', error);
      throw error;
    }
  }

  // Get weekly financial metrics
  async getWeeklyFinancialMetrics(options: { force?: boolean } = {}): Promise<WeeklyFinancialMetrics> {
    const properties = await this.fetchPropertyRenovationData(options);
    return calculateWeeklyFinancialMetrics(properties);
  }
}

// Export singleton instance
export const propertyDatabaseService = PropertyDatabaseService.getInstance(); 