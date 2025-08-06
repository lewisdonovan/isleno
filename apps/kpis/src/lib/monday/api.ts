import { mondayRequest } from '@/lib/auth';
import { GET_BOARDS, GET_BOARD_DETAILS, GET_CURRENT_USER } from './queries';
import { UserSession } from '@isleno/types/auth';

export async function fetchBoards(session: UserSession, page: number, limit: number) {
  const token = session.accessToken.replace('Bearer ', '');
  return mondayRequest(token, GET_BOARDS,{ page, limit }, session.user.id);
}

export async function fetchBoardDetails(session: UserSession, id: string) {
  const token = session.accessToken.replace('Bearer ', '');
  return mondayRequest(token, GET_BOARD_DETAILS, { ids: [id] }, session.user.id);
}

export async function fetchCurrentUser(session: UserSession) {
  const token = session.accessToken.replace('Bearer ', '');
  return mondayRequest(token, GET_CURRENT_USER, undefined, session.user.id);
} 