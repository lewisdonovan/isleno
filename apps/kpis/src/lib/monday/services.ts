import { mondayRequest } from '@/lib/auth';
import { UserSession, MondayUser } from '@/types/auth';
import { Board, BoardDetails, BoardItem } from '@/types/monday';
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
} from './queries';


const KPI_BOARD   = 9076494835;
const ACT_BOARD   = 9076281262;  // Activities
const LEADS_BOARD = 5740801783;
const PAGE_SIZE   = 500;

function debug(tag: string, info: unknown) {
  if (process.env.DEBUG_MONDAY === 'true') {
    console.log(`[${tag}]`, JSON.stringify(info, null, 2));
  }
}


/**
 * Fetch a paginated list of boards
 */
export async function fetchBoards(
  session: UserSession,
  page: number,
  limit: number
): Promise<Board[]> {
  const data = await mondayRequest<{ boards: Board[] }>(
    session,
    GET_BOARDS,
    { page, limit }
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
  const data = await mondayRequest<{ boards: BoardDetails[] }>(
    session,
    GET_BOARD_DETAILS,
    { ids: [id] }
  );
  return data.boards[0];
}

/**
 * Fetch the current authenticated user
 */
export async function fetchCurrentUser(
  session: UserSession
): Promise<MondayUser> {
  const data = await mondayRequest<{ me: MondayUser }>(
    session,
    GET_CURRENT_USER
  );
  return data.me;
}

/**
 * Fetch all users across pages
 */
export async function fetchUsers(
  session: UserSession
): Promise<MondayUser[]> {
  const all: MondayUser[] = [];
  let page = 1;
  const PAGE_SIZE = 100;

  while (true) {
    const vars = { limit: PAGE_SIZE, page };
    const data = await mondayRequest<{ users: MondayUser[] }>(
      session,
      GET_USERS_PAGE,
      vars
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
  const allItems: BoardItem[] = [];
  let cursor: string | null = null;
  const PAGE_SIZE = 100;
  const BOARD_ID = 9076281262;

  while (true) {
    const variables: Record<string, any> = {
      boardId: [BOARD_ID],
      limit: PAGE_SIZE,
    };
    if (cursor) variables.cursor = cursor;

    const data = await mondayRequest<
      { boards: Array<{ items_page: { cursor: string | null; has_more: boolean; items: BoardItem[] } }> }
    >(
      session,
      GET_PA_ACTIVITIES_PAGE,
      variables
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
  const data = await mondayRequest<{
    boards: Array<{ groups: { id: string; title: string }[] }>;
  }>(session, GET_KPI_GROUPS, { boardId: [KPI_BOARD] });

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
  const all: any[] = [];

  // 1ª página
  const first = await mondayRequest<{
    boards: Array<{ groups: Array<{ items_page: { cursor: string | null; items: any[] } }> }>;
  }>(
    session,
    GET_KPIS_BY_GROUP_PAGE,
    { boardId: [KPI_BOARD], groupIds: [groupId], limit: PAGE_SIZE }  // 👈 aquí LISTA
  );

  const page = first.boards?.[0]?.groups?.[0]?.items_page;
  all.push(...(page?.items ?? []));

  // siguientes páginas
  let cursor = page?.cursor ?? null;
  while (cursor) {
    const next = await mondayRequest<{ next_items_page: { cursor: string | null; items: any[] } }>(
      session,
      NEXT_ITEMS_PAGE,
      { cursor, limit: PAGE_SIZE }
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
  const all: any[] = [];
  let cursor: string | null = null;

  while (true) {
    const vars: Record<string, any> = { boardId: [ACT_BOARD], limit: PAGE_SIZE };
    if (cursor) vars.cursor = cursor;

    const data = await mondayRequest<{
      boards: Array<{ items_page: { cursor: string | null; items: any[] } }>;
    }>(session, GET_ACTIVITIES, vars);

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
  const all: any[] = [];
  const PAGE_SIZE = 500;

  /* — 1ª página con reglas de fecha y status — */
  const first = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: any[] } }>
  }>(
    session,
    GET_POINT_ACTIVITIES_PAGE(startDate, endDate, PAGE_SIZE),
  );

  const page = first.boards?.[0]?.items_page;
  all.push(...(page?.items ?? []));

  /* — siguientes páginas con next_items_page — */
  let cursor = page?.cursor ?? null;
  while (cursor) {
    const next = await mondayRequest<{
      next_items_page: { cursor: string | null; items: any[] }
    }>(
      session,
      NEXT_ITEMS_PAGE,
      { cursor, limit: PAGE_SIZE },
    );
    all.push(...next.next_items_page.items);
    cursor = next.next_items_page.cursor;
  }

  debug('getPointActivities', { startDate, endDate, items: all.length });
  return all;
}

/**
 * Leads provenientes de colaboradores (“11. Contacto closer”)
 */
export async function getLeadsFromCollaborators(
  session: UserSession,
  { limit = PAGE_SIZE, onlyFirst = false } = {},
) {
  const all: any[] = [];

  const first = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: any[] } }>
  }>(
    session,
    GET_LEADS_COLLABORATORS_PAGE,
    { boardId: [LEADS_BOARD], limit }
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
      session,
      NEXT_ITEMS_PAGE,
      { cursor, limit }
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
  const developmentBoardId = process.env.BOARD_ID_HIGH_LEVEL_DEVELOPMENT;
  const propertyBoardId = process.env.BOARD_ID_PROPERTY_DATABASE;
  const linkColumnId = "board_relation_mksftpxc";

  if (!developmentBoardId || !propertyBoardId) {
    throw new Error('Environment variables BOARD_ID_HIGH_LEVEL_DEVELOPMENT and BOARD_ID_PROPERTY_DATABASE must be set');
  }

  const data = await mondayRequest<{
    boards: Array<{ items_page: { cursor: string | null; items: BoardItem[] } }>;
  }>(
    session,
    GET_DEVELOPMENT_PROJECTS,
    {
      boardId: developmentBoardId,
      propertyBoardId: propertyBoardId,
      linkColumnId: linkColumnId,
    }
  );

  debug('fetchDevelopmentProjects', { 
    boards: data.boards?.length,
    items: data.boards?.[0]?.items_page?.items?.length 
  });
  
  return data;
}