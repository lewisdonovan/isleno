import { mondayRequest } from '@/lib/auth';
import { UserSession, MondayUser } from '@isleno/types/auth';
import { Board, BoardDetails, BoardItem } from '@isleno/types/monday';
import { MONDAY_BOARD_IDS, getMondayBoardId } from '@/lib/constants/mondayBoards';
import {
  GET_BOARDS,
  GET_BOARD_DETAILS,
  GET_CURRENT_USER,
  GET_USERS_PAGE,
  GET_PA_ACTIVITIES_PAGE,
  GET_KPI_GROUPS,
  GET_ACTIVITIES,
  NEXT_ITEMS_PAGE,
  GET_KPIS_BY_GROUP_PAGE,
  GET_LEADS_COLLABORATORS_PAGE,
  GET_POINT_ACTIVITIES_PAGE,
  GET_DEVELOPMENT_PROJECTS,
  GET_DEVELOPMENT_PROJECTS_FILTERED_AND_LINKED,
  GET_PROPERTY_DATABASE_RENOVATION,
} from './queries';


const PAGE_SIZE   = 500;

function debug(tag: string, info: unknown) {
  if (process.env.DEBUG_MONDAY === 'true') {
    console.log(`[${tag}]`, JSON.stringify(info, null, 2));
  }
}

// Helper function to extract token from session
function getTokenFromSession(session: UserSession): string {
  return session.accessToken.replace('Bearer ', '');
}

/**
 * Fetch a paginated list of boards
 */
export async function fetchBoards(
  session: UserSession,
  page: number,
  limit: number
): Promise<Board[]> {
  const token = getTokenFromSession(session);
  const data = await mondayRequest<{ boards: Board[] }>(
    token,
    GET_BOARDS,
    { page, limit },
    session.user.id
  );
  return data.boards;
}

/**
 * Fetch details for a single board
 */
export async function fetchBoardDetails(
  session: UserSession,
  id: string
): Promise<BoardDetails> {
  const token = getTokenFromSession(session);
  const data = await mondayRequest<{ boards: BoardDetails[] }>(
    token,
    GET_BOARD_DETAILS,
    { ids: [id] },
    session.user.id
  );
  return data.boards[0];
}

/**
 * Fetch the current authenticated user
 */
export async function fetchCurrentUser(
  session: UserSession
): Promise<MondayUser> {
  const token = getTokenFromSession(session);
  const data = await mondayRequest<{ me: MondayUser }>(
    token,
    GET_CURRENT_USER,
    undefined,
    session.user.id
  );
  return data.me;
}

/**
 * Fetch all users across pages
 */
export async function fetchUsers(
  session: UserSession
): Promise<MondayUser[]> {
  const token = getTokenFromSession(session);
  const all: MondayUser[] = [];
  let page = 1;
  const PAGE_SIZE = 100;

  while (true) {
    const vars = { limit: PAGE_SIZE, page };
    const data = await mondayRequest<{ users: MondayUser[] }>(
      token,
      GET_USERS_PAGE,
      vars,
      session.user.id
    );
    if (!data.users?.length) break;
    all.push(...data.users);
    if (data.users.length < PAGE_SIZE) break;
    page += 1;
  }

  return all;
}

/**
 * Fetch point activities items from a specific board
 */
export async function fetchPaActivities(
  session: UserSession
): Promise<BoardItem[]> {
  const token = getTokenFromSession(session);
  const allItems: BoardItem[] = [];
  let cursor: string | null = null;
  const PAGE_SIZE = 100;

  while (true) {
    const variables: Record<string, any> = {
      boardId: [MONDAY_BOARD_IDS.ACTIVITIES],
      limit: PAGE_SIZE,
    };
    if (cursor) variables.cursor = cursor;

    const data = await mondayRequest<
      { boards: Array<{ items_page: { cursor: string | null; has_more: boolean; items: BoardItem[] } }> }
    >(
      token,
      GET_PA_ACTIVITIES_PAGE,
      variables,
      session.user.id
    );

    const page = data.boards?.[0]?.items_page;
    if (!page) break;
    allItems.push(...page.items);
    if (!page.has_more) break;
    cursor = page.cursor;
  }

  return allItems;
}

/**
 * Grupos del board de KPIs
 */
export async function getKpiGroups(session: UserSession) {
  const token = getTokenFromSession(session);
  const data = await mondayRequest<{
    boards: Array<{ groups: { id: string; title: string }[] }>;
  }>(token, GET_KPI_GROUPS, { boardId: [MONDAY_BOARD_IDS.KPI] }, session.user.id);

  const groups = data.boards?.[0]?.groups || [];
  debug('getKpiGroups', { count: groups.length });
  return groups;
}

/**
 * KPIs de un grupo específico
 */
export async function getKpisByGroup(
  session: UserSession,
  groupId: string,
) {
  const token = getTokenFromSession(session);
  const all: any[] = [];

  // 1ª página
  const first = await mondayRequest<{
    boards: Array<{ groups: Array<{ items_page: { cursor: string | null; items: any[] } }> }>;
  }>(
    token,
    GET_KPIS_BY_GROUP_PAGE,
    { boardId: [MONDAY_BOARD_IDS.KPI], groupIds: [groupId], limit: PAGE_SIZE },  // 👈 aquí LISTA
    session.user.id
  );

  const page = first.boards?.[0]?.groups?.[0]?.items_page;
  all.push(...(page?.items ?? []));

  // siguientes páginas
  let cursor = page?.cursor ?? null;
  while (cursor) {
    const next = await mondayRequest<{ next_items_page: { cursor: string | null; items: any[] } }>(
      token,
      NEXT_ITEMS_PAGE,
      { cursor, limit: PAGE_SIZE },
      session.user.id
    );
    all.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }

  debug('getKpisByGroup', { groupId, items: all.length });
  return all;
}

/**
 * Activities board (ID 9076281262)
 */
export async function getActivities(session: UserSession) {
  const token = getTokenFromSession(session);
  const all: any[] = [];
  let cursor: string | null = null;

  while (true) {
    const vars: Record<string, any> = { boardId: [MONDAY_BOARD_IDS.ACTIVITIES], limit: PAGE_SIZE };
    if (cursor) vars.cursor = cursor;

    const data = await mondayRequest<{
      boards: Array<{ items_page: { cursor: string | null; items: any[] } }>;
    }>(token, GET_ACTIVITIES, vars, session.user.id);

    const page = data.boards?.[0]?.items_page;
    if (!page) break;

    all.push(...page.items);
    if (!page.cursor) break;
    cursor = page.cursor;
  }

  debug('getActivities', { items: all.length });
  return all;
}

/**
 * Point Activities board (ID 9076318311)
 */
export async function getPointActivities(
  session: UserSession,
  startDate: string,
  endDate: string,
) {
  const token = getTokenFromSession(session);
  const all: any[] = [];
  const PAGE_SIZE = 500;

  /* — 1ª página con reglas de fecha y status — */
  const first = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: any[] } }>
  }>(
    token,
    GET_POINT_ACTIVITIES_PAGE(startDate, endDate, PAGE_SIZE),
    { boardId: MONDAY_BOARD_IDS.POINT_ACTIVITIES },
    session.user.id
  );

  const page = first.boards?.[0]?.items_page;
  all.push(...(page?.items ?? []));

  /* — siguientes páginas con next_items_page — */
  let cursor = page?.cursor ?? null;
  while (cursor) {
    const next = await mondayRequest<{
      next_items_page: { cursor: string | null; items: any[] }
    }>(
      token,
      NEXT_ITEMS_PAGE,
      { cursor, limit: PAGE_SIZE },
      session.user.id
    );
    all.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }

  debug('getPointActivities', { startDate, endDate, items: all.length });
  return all;
}

/**
 * Leads provenientes de colaboradores ("11. Contacto closer")
 */
export async function getLeadsFromCollaborators(
  session: UserSession,
  { limit = PAGE_SIZE, onlyFirst = false } = {},
) {
  const token = getTokenFromSession(session);
  const all: any[] = [];

  const first = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: any[] } }>
  }>(
    token,
    GET_LEADS_COLLABORATORS_PAGE,
    { boardId: [MONDAY_BOARD_IDS.LEADS], limit },
    session.user.id
  );

  all.push(...first.boards?.[0]?.items_page.items ?? []);

  if (onlyFirst) {
    debug('getLeadsFromCollaborators', { items: all.length, note: 'onlyFirst' });
    return all;         
  }

  let cursor = first.boards?.[0]?.items_page.cursor ?? null;
  while (cursor) {
    const next = await mondayRequest<{
      next_items_page: { cursor: string | null; items: any[] }
    }>(
      token,
      NEXT_ITEMS_PAGE,
      { cursor, limit },
      session.user.id
    );

    all.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }

  debug('getLeadsFromCollaborators', { items: all.length });
  return all;
}

/**
 * Fetch development projects with linked property data
 */
export async function fetchDevelopmentProjects(
  session: UserSession
): Promise<{ boards: Array<{ items_page: { cursor: string | null; items: BoardItem[] } }> }> {
  const token = getTokenFromSession(session);
  const developmentBoardId = MONDAY_BOARD_IDS.DEVELOPMENT_PROJECTS;
  const propertyBoardId = MONDAY_BOARD_IDS.PROPERTY_DATABASE;
  const linkColumnId = "board_relation_mksftpxc";

  if (!developmentBoardId || !propertyBoardId) {
    throw new Error('Environment variables BOARD_ID_HIGH_LEVEL_DEVELOPMENT and BOARD_ID_PROPERTY_DATABASE must be set');
  }

  const data = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: BoardItem[] } }>;
  }>(
    token,
    GET_DEVELOPMENT_PROJECTS,
    {
      boardId: developmentBoardId,
      propertyBoardId: propertyBoardId,
      linkColumnId: linkColumnId,
    },
    session.user.id
  );

  debug('fetchDevelopmentProjects', { 
    boards: data.boards?.length,
    items: data.boards?.[0]?.items_page?.items?.length 
  });
  
  return data;
}

/**
 * Fetch development projects with linked property data (filtered by specific groups)
 */
export async function fetchDevelopmentProjectsFiltered(
  session: UserSession
): Promise<{ boards: Array<{ items_page: { cursor: string | null; items: BoardItem[] } }> }> {
  const token = getTokenFromSession(session);
  const developmentBoardId = MONDAY_BOARD_IDS.DEVELOPMENT_PROJECTS;
  const propertyBoardId = MONDAY_BOARD_IDS.PROPERTY_DATABASE;
  const linkColumnId = "board_relation_mksftpxc";

  if (!developmentBoardId || !propertyBoardId) {
    throw new Error('Environment variables BOARD_ID_HIGH_LEVEL_DEVELOPMENT and BOARD_ID_PROPERTY_DATABASE must be set');
  }

  const data = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: BoardItem[] } }>;
  }>(
    token,
    GET_DEVELOPMENT_PROJECTS_FILTERED_AND_LINKED,
    {
      boardId: developmentBoardId,
      propertyBoardId: propertyBoardId,
      linkColumnId: linkColumnId,
    },
    session.user.id
  );

  debug('fetchDevelopmentProjectsFiltered', { 
    boards: data.boards?.length,
    items: data.boards?.[0]?.items_page?.items?.length 
  });
  
  return data;
}

/**
 * Fetch property database renovation data for financial calculations
 */
export async function fetchPropertyDatabaseRenovation(
  session: UserSession
): Promise<{ boards: Array<{ groups: Array<{ items_page: { items: BoardItem[] } }> }> }> {
  const token = getTokenFromSession(session);
  const boardId = getMondayBoardId('PROPERTY_DATABASE');
  console.log({boardId})
  
  console.log('Using board ID for property database:', boardId);
  console.log('Environment variable BOARD_ID_PROPERTY_DATABASE:', process.env.BOARD_ID_PROPERTY_DATABASE);
  
  const data = await mondayRequest<{
    boards: Array<{ groups: Array<{ items_page: { items: BoardItem[] } }> }>;
  }>(
    token,
    GET_PROPERTY_DATABASE_RENOVATION,
    { boardId },
    session.user.id
  );

  debug('fetchPropertyDatabaseRenovation', { 
    boardId,
    boards: data.boards?.length,
    groups: data.boards?.[0]?.groups?.length,
    items: data.boards?.[0]?.groups?.[0]?.items_page?.items?.length 
  });
  
  return data;
}