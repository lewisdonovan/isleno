import { DateTime } from 'luxon';
import { MondayProjectsData, BoardItem, BoardColumnValue } from '@/types/monday';
import { ProjectData, CashflowEvent, PROJECT_STAGES, PHASE_MAPPING } from '@/types/projects';
import { FINANCIAL_ESTIMATES } from '@/lib/constants/projectConstants';

// Types are now imported from @/types/projects

// Service class for handling project data
export class ProjectsDataService {
  private static instance: ProjectsDataService;
  private cachedProjectsData: MondayProjectsData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ProjectsDataService {
    if (!ProjectsDataService.instance) {
      ProjectsDataService.instance = new ProjectsDataService();
    }
    return ProjectsDataService.instance;
  }

  // Fetch projects data from API with caching
  async fetchProjectsData(options: { force?: boolean } = {}): Promise<MondayProjectsData> {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!options.force && this.cachedProjectsData && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedProjectsData;
    }

    try {
      const response = await fetch('/api/monday/development-projects', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to Monday.com.');
        }
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cachedProjectsData = data;
      this.lastFetchTime = now;
      
      return data;
    } catch (error) {
      console.error('Error fetching projects data:', error);
      throw error;
    }
  }

  // Parse Monday.com column value
  private parseColumnValue(columnValues: BoardColumnValue[], columnId: string): any {
    const column = columnValues.find(cv => cv.id === columnId);
    if (!column?.value) return null;
    
    try {
      const parsed = JSON.parse(column.value);
      return parsed;
    } catch {
      // For simple string values
      return column.value.replace(/"/g, '');
    }
  }

  // Extract progress percentage from project name
  private extractProgress(name: string): number {
    const match = name.match(/^(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  // Extract zone from project name  
  private extractZone(name: string): 'PMI' | 'MAH' {
    return name.includes('| PMI |') ? 'PMI' : 'MAH';
  }

  // Generate cashflow events based on project data
  private generateCashflowEvents(project: Partial<ProjectData>): CashflowEvent[] {
    const events: CashflowEvent[] = [];
    
    // Purchase deposit (when arras signed)
    if (project.arrasSignedDate && project.arrasAmount) {
      events.push({
        date: project.arrasSignedDate,
        amount: -project.arrasAmount, // Outflow
        type: 'purchase_deposit',
        description: `Purchase deposit for ${project.propertyId}`,
        projectId: project.id!
      });
    }
    
      // Final purchase payment (estimate: 30 days after arras or at notary)
  if (project.arrasSignedDate && project.outstandingAmount) {
    const finalPaymentDate = project.latestNotaryDate || project.arrasSignedDate.plus({ days: FINANCIAL_ESTIMATES.PURCHASE_TO_NOTARY_DAYS });
      events.push({
        date: finalPaymentDate,
        amount: -project.outstandingAmount, // Outflow
        type: 'purchase_final',
        description: `Final purchase payment for ${project.propertyId}`,
        projectId: project.id!
      });
    }
    
    // Construction costs (estimate: 50% of total investment during renovation)
    if (project.projectFinishDate && project.arrasAmount && project.outstandingAmount) {
      const totalPurchase = project.arrasAmount + project.outstandingAmount;
      const constructionCost = totalPurchase * FINANCIAL_ESTIMATES.CONSTRUCTION_COST_RATIO;
      const constructionStart = project.arrasSignedDate?.plus({ days: FINANCIAL_ESTIMATES.ARRAS_TO_CONSTRUCTION_DAYS }) || DateTime.now();
      
      events.push({
        date: constructionStart,
        amount: -constructionCost, // Outflow
        type: 'construction_cost',
        description: `Construction costs for ${project.propertyId}`,
        projectId: project.id!
      });
    }
    
    // Sale revenue (when project completes and has sale price)
    if (project.projectFinishDate && (project.salePrice || project.soldPrice)) {
      const revenue = project.soldPrice || project.salePrice!;
      events.push({
        date: project.projectFinishDate,
        amount: revenue, // Inflow
        type: 'sale_revenue',
        description: `Sale revenue for ${project.propertyId}`,
        projectId: project.id!
      });
    }
    
    // Rental income (for rental properties - estimate monthly income)
    if (project.phase === 'Rent' && project.projectFinishDate) {
      const monthlyRent = FINANCIAL_ESTIMATES.MONTHLY_RENT_ESTIMATE;
      const rentStart = project.projectFinishDate;
      
      // Generate 12 months of rental income
      for (let i = 0; i < 12; i++) {
        events.push({
          date: rentStart.plus({ months: i }),
          amount: monthlyRent, // Monthly inflow
          type: 'rental_income',
          description: `Monthly rent for ${project.propertyId}`,
          projectId: project.id!
        });
      }
    }
    
    return events;
  }

  // Parse Monday.com project data
  private parseProject(item: BoardItem): ProjectData {
    const progress = this.extractProgress(item.name);
    const zone = this.extractZone(item.name);
    
    // Extract data from column values
    const propertyId = this.parseColumnValue(item.column_values, 'text') || '';
    const arrasSignedDate = this.parseColumnValue(item.column_values, 'date4')?.date 
      ? DateTime.fromISO(this.parseColumnValue(item.column_values, 'date4').date) 
      : undefined;
    const projectFinishDate = this.parseColumnValue(item.column_values, 'date__1')?.date
      ? DateTime.fromISO(this.parseColumnValue(item.column_values, 'date__1').date)
      : undefined;
    const latestNotaryDate = this.parseColumnValue(item.column_values, 'fecha_mkmnj216')?.date
      ? DateTime.fromISO(this.parseColumnValue(item.column_values, 'fecha_mkmnj216').date)
      : undefined;
    const arrasSoldDate = this.parseColumnValue(item.column_values, 'fecha__1')?.date
      ? DateTime.fromISO(this.parseColumnValue(item.column_values, 'fecha__1').date)
      : undefined;
        
    const arrasAmount = parseFloat(this.parseColumnValue(item.column_values, 'n_meros_mkmnjx0h')) || 0;
    const outstandingAmount = parseFloat(this.parseColumnValue(item.column_values, 'numeric_mkrjfzt5')) || 0;
    const salePrice = parseFloat(this.parseColumnValue(item.column_values, 'numbers23__1')) || 0;
    const soldPrice = parseFloat(this.parseColumnValue(item.column_values, 'dup__of_sale_price__1')) || 0;
    
    const statusIndex = this.parseColumnValue(item.column_values, 'status')?.index;
    const stage = statusIndex !== undefined ? PROJECT_STAGES[statusIndex as keyof typeof PROJECT_STAGES] : 'Unknown';
    
    // Create base project data
    const projectData: Partial<ProjectData> = {
      id: item.id,
      name: item.name,
      propertyId,
      zone,
      phase: stage,
      progress,
      arrasSignedDate,
      projectFinishDate,
      latestNotaryDate,
      arrasSoldDate,
      arrasAmount,
      outstandingAmount,
      salePrice,
      soldPrice
    };
    
    // Generate cashflow events
    const cashflowEvents = this.generateCashflowEvents(projectData);
    
    return {
      ...projectData,
      cashflowEvents
    } as ProjectData;
  }

  // Parse all projects from Monday.com data
  async parseProjectsData(options: { force?: boolean } = {}): Promise<ProjectData[]> {
    try {
      const data = await this.fetchProjectsData(options);
      
      if (!data?.boards) {
        console.warn('No boards data found in response');
        return [];
      }

      const projects: ProjectData[] = [];
      
      data.boards.forEach((board: any) => {
        if (board.items_page?.items) {
          board.items_page.items.forEach((item: any) => {
            try {
              const project = this.parseProject(item);
              projects.push(project);
            } catch (error) {
              console.warn(`Failed to parse project ${item.id}:`, error);
            }
          });
        }
      });
      
      console.log(`Parsed ${projects.length} projects from Monday.com data`);
      return projects;
    } catch (error) {
      console.error('Error parsing projects data:', error);
      throw error;
    }
  }

  // Get all cashflow events across all projects
  async getAllCashflowEvents(options: { force?: boolean } = {}): Promise<CashflowEvent[]> {
    const projects = await this.parseProjectsData(options);
    return projects.flatMap(p => p.cashflowEvents);
  }

  // Calculate projected liquidity for a given date
  async calculateProjectedLiquidity(targetDate: DateTime, startingBalance: number = 500000, options: { force?: boolean } = {}): Promise<number> {
    const events = await this.getAllCashflowEvents(options);
    const relevantEvents = events.filter(event => event.date <= targetDate);
    
    return relevantEvents.reduce((balance, event) => balance + event.amount, startingBalance);
  }
}

// Export singleton instance
export const projectsDataService = ProjectsDataService.getInstance(); 