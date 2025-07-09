export const GET_BOARDS = `
  query GetBoards($page: Int!, $limit: Int!) {
    boards(limit: $limit, page: $page) {
      id
      name
      description
      state
      board_kind
      board_folder_id
      updated_at
    }
  }
`;

export const GET_BOARD_DETAILS = `
  query GetBoardDetails($ids: [ID!]!) {
    boards(ids: $ids) {
      id
      name
      description
      state
      board_kind
      board_folder_id
      updated_at
      columns {
        id
        title
        type
        settings_str
      }
      groups {
        id
        title
        color
        position
      }
      items_page {
        cursor
        items {
          id
          name
          state
          created_at
          updated_at
          column_values {
            id
            value
            type
            column {
              title
            }
          }
        }
      }
    }
  }
`;

export const GET_CURRENT_USER = `
  query GetCurrentUser {
    me {
      id
      name
      email
      photo_thumb
      photo_thumb_small
      photo_original
    }
  }
`;

export const GET_USERS_PAGE = `
  query GetUsers($limit: Int!, $page: Int!) {
    users(limit: $limit, page: $page) {
      id
      name
      email
      photo_thumb
      photo_thumb_small
      photo_original
      is_guest
      enabled
    }
  }
`;

export const GET_PA_ACTIVITIES_PAGE = `
  query GetPAActivities($boardId: [ID!], $limit: Int!, $cursor: String) {
    boards(ids: $boardId) {
      items_page(limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name
          state
          created_at
          updated_at
          column_values {
            id
            value
            type
            column { title }
          }
        }
      }
    }
  }
`;

export const GET_KPI_GROUPS = `
  query GetKpiGroups($boardId: [ID!]) {
    boards(ids: $boardId) {
      groups {
        id
        title
      }
    }
  }
`;

export const GET_KPIS_BY_GROUP = `
  query GetKpisByGroup($boardId: [ID!], $groupId: String!, $limit: Int!, $cursor: String) {
    boards(ids: $boardId) {
      items_page(group_id: $groupId, limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name     
          column_values(ids: ["numeric_mkqpc92f"]) {
            id
            value
            text
          }
        }
      }
    }
  }
`;

export const GET_ACTIVITIES = `
  query GetActivities($boardId: [ID!], $limit: Int!, $cursor: String) {
    boards(ids: $boardId) {
      items_page(limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name
          column_values(ids: ["numeric_mkqpc92f", "text_mkqpzvqj"]) {
            id
            text
            value
          }
        }
      }
    }
  }
`;

export const GET_POINT_ACTIVITIES = `
  query GetPointActivities($boardId: [ID!], $limit: Int!, $cursor: String) {
    boards(ids: $boardId) {
      items_page(limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name
          column_values(ids: [
            "person",
            "board_relation_mkqpcrfk",
            "numeric_mkqp2bg3",
            "date_mkqpkqd0",
            "status"
          ]) {
            id
            text
            value
            type
          }
        }
      }
    }
  }
`;

export const GET_LEADS_COLLABORATORS = `
  query GetLeadsCollaborators(
    $boardId: [ID!],
    $limit: Int!,
    $page: Int!,
    $rules: [JSON!]
  ) {
    boards(ids: $boardId) {
      items_page(page: $page, limit: $limit, query_params: { rules: $rules }) {
        items { id name column_values(ids: ["people"]) { id text value } }
      }
    }
  }
`;

export const GET_LEADS_COLLABORATORS_PAGE = `
  query GetLeadsCollaboratorsPage(
    $boardId: [ID!],
    $limit: Int!
  ) {
    boards(ids: $boardId) {
      items_page(
        limit: $limit
        query_params: {
          rules: [
            { column_id: "status04", compare_value: ["11. Contacto closer"], operator: contains_terms },
          ]
        }
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ["people"]) { id text value }
        }
      }
    }
  }
`;


export const GET_KPIS_BY_GROUP_PAGE = `
  query GetKpisByGroupPage(
    $boardId: [ID!],
    $groupIds: [String!],
    $limit: Int!
  ) {
    boards(ids: $boardId) {
      groups(ids: $groupIds) {     
        items_page(limit: $limit) {  
          cursor
          items {
            id
            name
            column_values(ids:["numeric_mkqpc92f"]) {
              id text value
            }
          }
        }
      }
    }
  }
`;


export const NEXT_ITEMS_PAGE = `
  query NextItemsPage($cursor: String!, $limit: Int!) {
    next_items_page(cursor: $cursor, limit: $limit) {
      cursor
      items {
        id
        name
        column_values(ids:["numeric_mkqpc92f"]) {
          id text value
        }
      }
    }
  }
`;

export const GET_DEVELOPMENT_PROJECTS = `
  query GetDevelopmentProjects($boardId: ID!, $propertyBoardId: ID!, $linkColumnId: String!) {
    boards(ids: [$boardId]) {
      items_page {
        cursor
        items {
          id
          name
          column_values {
            id
            value
            type
            column {
              id
              title
            }
            text
          }
          linked_items (
            linked_board_id: $propertyBoardId, 
            link_to_item_column_id: $linkColumnId
          ) {
            id
            name
            column_values {
              id
              value
              type
              column {
                id
                title
              }
              text
            }
          }
        }
      }
    }
  }
`;

export const GET_POINT_ACTIVITIES_PAGE = (
  start: string,
  end: string,
  limit: number,
) => `
  query GetPointActivitiesPage {
    boards(ids: [9076318311]) {
      items_page(
        limit: ${limit},
        query_params: {
          operator: and,
          rules: [
            { column_id: "date_mkqpkqd0", compare_value: ["${start}","${end}"], operator: between }
          ]
        }
      ) {
        cursor
        items {
          id
          name
          column_values(ids:[
            "person",
            "board_relation_mkqpcrfk",
            "numeric_mkqp2bg3",
            "date_mkqpkqd0",
            "status"
          ]) {
            id
            text
            value
            type
          }
        }
      }
    }
  }
`;