import { mondayRequest } from '@/lib/auth';
import { GET_BOARDS, GET_BOARD_DETAILS, GET_CURRENT_USER } from './queries';
import { UserSession } from '@/types/auth';

export async function fetchBoards(session: UserSession, page: number, limit: number) {
  return mondayRequest(session, GET_BOARDS,{ page, limit });
}

export async function fetchBoardDetails(session: UserSession, id: string) {
  return mondayRequest(session, GET_BOARD_DETAILS, { ids: [id] });
}

export async function fetchCurrentUser(session: UserSession) {
  return mondayRequest(session, GET_CURRENT_USER);
} 