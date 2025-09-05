import { ODOO_API_KEY, ODOO_DB_NAME, ODOO_URL, ODOO_USER_ID } from "../constants/odoo";

class OdooApiClient {
  private url: string;
  private db: string;
  private uid: number;
  private password?: string;

  constructor() {
    this.url = ODOO_URL;
    this.db = ODOO_DB_NAME;
    this.uid = ODOO_USER_ID;
    this.password = ODOO_API_KEY;

    if (!this.url || !this.db || !this.uid || !this.password) {
      throw new Error("Odoo environment variables are not set.");
    }
  }

  private async jsonRpc(path: string, params: any): Promise<any> {
    const response = await fetch(`${this.url}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: [...params, ["company_id", "=", 1]], // Isleno main company only
        id: Math.floor(Math.random() * 1000000000),
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('Odoo API Error:', data.error);
      throw new Error(data.error.data?.message || data.error.message);
    }
    return data.result;
  }

  public async executeKw(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    const params = {
      service: 'object',
      method: 'execute_kw',
      args: [this.db, this.uid, this.password, model, method, args, kwargs],
    };
    return this.jsonRpc('/jsonrpc', params);
  }

  public async searchRead(model: string, domain: any[] = [], kwargs: any = {}): Promise<any[]> {
    return this.executeKw(model, 'search_read', [domain], kwargs);
  }
  
  public async write(model: string, ids: number[], values: any): Promise<boolean> {
    return this.executeKw(model, 'write', [ids, values]);
  }
}

export const odooApi = new OdooApiClient(); 