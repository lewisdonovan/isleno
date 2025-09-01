/**
 * Service Provider for managing service instances and dependency injection
 */
export class ServiceProvider {
  private static instance: ServiceProvider | null = null;
  private services: Map<string, any> = new Map();
  private serviceFactories: Map<string, () => any> = new Map();

  private constructor() {
    // Private constructor
  }

  static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }

  /**
   * Register a service factory function
   */
  register<T>(serviceName: string, factory: () => T): void {
    this.serviceFactories.set(serviceName, factory);
  }

  /**
   * Get a service instance, creating it if necessary
   */
  get<T>(serviceName: string): T {
    if (!this.services.has(serviceName)) {
      const factory = this.serviceFactories.get(serviceName);
      if (!factory) {
        throw new Error(`Service '${serviceName}' not registered`);
      }
      this.services.set(serviceName, factory());
    }
    return this.services.get(serviceName);
  }

  /**
   * Check if a service is registered
   */
  has(serviceName: string): boolean {
    return this.serviceFactories.has(serviceName);
  }

  /**
   * Clear all service instances (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Reset the service provider (useful for testing)
   */
  static reset(): void {
    ServiceProvider.instance = null;
  }
}

// Global service provider instance
export const serviceProvider = ServiceProvider.getInstance();
