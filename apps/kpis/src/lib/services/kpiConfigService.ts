export interface KpiConfiguration {
  kpiOrder: string[];
  objectives: Record<string, number>;
  hiddenKpisGeneral: string[];
  hiddenKpisCollab: string[];
  hiddenClosers: number[];
}

export interface KpiConfigState {
  kpiOrder: string[];
  objectives: Record<string, number>;
  hiddenKpisGeneral: Set<string>;
  hiddenKpisCollab: Set<string>;
  hiddenClosers: Set<number>;
}

export class KpiConfigService {
  /**
   * Exports current configuration to JSON string
   */
  static exportConfig(state: KpiConfigState): string {
    const config: KpiConfiguration = {
      kpiOrder: state.kpiOrder,
      objectives: state.objectives,
      hiddenKpisGeneral: Array.from(state.hiddenKpisGeneral),
      hiddenKpisCollab: Array.from(state.hiddenKpisCollab),
      hiddenClosers: Array.from(state.hiddenClosers),
    };
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Copies configuration to clipboard
   */
  static async copyConfigToClipboard(state: KpiConfigState): Promise<void> {
    const json = this.exportConfig(state);
    await navigator.clipboard.writeText(json);
  }

  /**
   * Parses and validates imported configuration
   */
  static parseImportedConfig(jsonString: string): KpiConfiguration {
    try {
      const config = JSON.parse(jsonString);
      
      // Validate required fields
      if (!config.kpiOrder || !Array.isArray(config.kpiOrder)) {
        throw new Error('Invalid kpiOrder field');
      }
      
      if (!config.objectives || typeof config.objectives !== 'object') {
        throw new Error('Invalid objectives field');
      }

      // Ensure arrays exist and are arrays
      config.hiddenKpisGeneral = config.hiddenKpisGeneral || [];
      config.hiddenKpisCollab = config.hiddenKpisCollab || [];
      config.hiddenClosers = config.hiddenClosers || [];

      if (!Array.isArray(config.hiddenKpisGeneral) || 
          !Array.isArray(config.hiddenKpisCollab) || 
          !Array.isArray(config.hiddenClosers)) {
        throw new Error('Hidden field arrays are invalid');
      }

      return config;
    } catch (error) {
      throw new Error(`Invalid JSON configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Converts configuration to state format with Sets
   */
  static configToState(config: KpiConfiguration): Partial<KpiConfigState> {
    return {
      kpiOrder: config.kpiOrder,
      objectives: config.objectives,
      hiddenKpisGeneral: new Set(config.hiddenKpisGeneral),
      hiddenKpisCollab: new Set(config.hiddenKpisCollab),
      hiddenClosers: new Set(config.hiddenClosers),
    };
  }

  /**
   * Imports configuration from JSON string and returns state updates
   */
  static importConfig(jsonString: string): Partial<KpiConfigState> {
    const config = this.parseImportedConfig(jsonString);
    return this.configToState(config);
  }
} 