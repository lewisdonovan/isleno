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

export const GET_DEVELOPMENT_PROJECTS_FILTERED_AND_LINKED = `
  query GetDevelopmentProjectsFilteredAndLinked(
    $boardId: ID!,
    $propertyBoardId: ID!,
    $linkColumnId: String!
  ) {
    boards(ids: [$boardId]) {
      items_page(query_params: {
        operator: or,
        rules: [
          { column_id: "group", compare_value: "topics", operator: any_of },
          { column_id: "group", compare_value: "new_group", operator: any_of },
          { column_id: "group", compare_value: "group_title", operator: any_of },
          { column_id: "group", compare_value: "new_group83889", operator: any_of },
          { column_id: "group", compare_value: "new_group17614", operator: any_of },
          { column_id: "group", compare_value: "new_group__1", operator: any_of }
        ]
      }) {
        cursor
        items {
          id
          name
          group {
            id
          }
          column_values(ids: [
            "date4",
            "date_mkt5pp4v",
            "date_mkt5naw5", 
            "date_mkt5z4qf",
            "date_mkt5y4pf",
            "date_mkt5m6tt",
            "date_mkt5ky38",
            "text",
            "n_meros_mkmnjx0h",
            "numeric_mkrjfzt5",
            "numbers23__1",
            "dup__of_sale_price__1",
            "status"
          ]) {
            id
            value
            type
            column {
              id
              title
            }
            text
          }
          linked_items(
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

export const GET_PROPERTY_DATABASE_RENOVATION = `
  query GetPropertyDatabaseRenovation($boardId: ID!) {
    boards(ids: [$boardId]) {
      groups(ids: ["new_group60998__1"]) {
        id
        title
        items_page {
          items {
            name
            column_values(ids: [
              "numbers4", 
              "formula668", 
              "numbers95", 
              "numbers90",
              "connect_boards64"
            ]) {
              id
              text
              type
              ... on FormulaValue {
                display_value
              }
            }
            group {
              id
              title
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
  query GetPointActivitiesPage($boardId: ID!) {
    boards(ids: [$boardId]) {
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