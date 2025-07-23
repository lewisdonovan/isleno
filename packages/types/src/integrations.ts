import type { Database } from '../db/public';

export type UserMondayToken =
  Database['public']['Tables']['user_monday_tokens']['Row']; 