'use server'
import { cookies } from 'next/headers'
import { mondayRequest } from '@/lib/auth'
// Define a specific type for the expected form data to avoid using `any`
type SaveItemFormData = {
  owner: string
  dueDate: string
  activity: string
  title: string
}

export async function saveItem(formData: SaveItemFormData) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('monday_session')
  /* if (!sessionCookie) throw new Error('Unauthorized: no session found') */
  const session = sessionCookie
    ? JSON.parse(sessionCookie.value)
    : null
  /* if (Date.now() > session.expiresAt) throw new Error('Session expired') */

  const CREATE_ITEM = `
    mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
        id
      }
    }
  `

  const columnValues = {
    person: {
      personsAndTeams: [{ id: parseInt(formData.owner, 10), kind: 'person' }],
    },
    date_mkqpkqd0: formData.dueDate,
    board_relation_mkqpcrfk: {
      item_ids: [parseInt(formData.activity, 10)],
    },
  }

  const data = await mondayRequest<{ create_item: { id: string } }>(
      session,
      CREATE_ITEM,
      {
        boardId: 9076318311,
        itemName: formData.title,
        columnValues: JSON.stringify(columnValues),
      }
  )

  return data.create_item
}
