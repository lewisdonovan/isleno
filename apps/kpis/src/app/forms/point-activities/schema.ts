import type { JSONSchema7 } from "json-schema";

export const schema: JSONSchema7 = {
  type: "object",
  required: ["title", "owner", "dueDate", "activity"],
  properties: {
    title: {
      type: "string",
      title: "Title",
      default: "",
    },
    owner: {
      type: "string",
      title: "Owner",
    },
    dueDate: {
      type: "string",
      format: "date",
      title: "Due Date Time",
    },
    activity: {
      type: "string",
      title: "Point Activities",
    },
  },
};

// UI schema for widget customization
export const uiSchema: Record<string, any> = {
  title: {
    "ui:placeholder": "Enter title",
  },
  owner: {
    "ui:widget": "select",
    "ui:placeholder": "Select owner",
  },
  dueDate: {
    "ui:widget": "date",
  },
  activity: {
    "ui:widget": "select",
    "ui:placeholder": "Select activity",
  },
};

export const formData: Record<string, any> = {};
