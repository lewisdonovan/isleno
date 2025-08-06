"use client";

import { useState, useEffect } from "react";
import Form from "@rjsf/shadcn";
import type { IChangeEvent } from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { JSONSchema7 } from "json-schema";

import {
  schema as baseSchema,
  uiSchema as baseUiSchema,
  formData as baseFormData,
} from "./schema";
import { saveItem } from "./actions";

export default function RJSFClientForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [schema, setSchema] = useState(baseSchema);
  const [uiSchema, setUiSchema] = useState(baseUiSchema);
  const [formData, setFormData] = useState<Record<string, any>>(baseFormData);
  const [loading, setLoading] = useState(true);

  const handleSubmit = async ({ formData }: IChangeEvent<any>) => {
    try {
      setSubmitting(true);
      await saveItem(formData);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleError = (errors: unknown) => console.error(errors);

  useEffect(() => {
    async function loadOptions() {
      try {
        const usersRes = await fetch("/api/integrations/monday/users");
        const usersJson = await usersRes.json();
        const users = usersJson.data?.users || [];
        const ownerIds = users.map((u: any) => String(u.id));
        const ownerNames = users.map((u: any) => u.name);

        const actsRes = await fetch("/api/integrations/monday/pa-activities");
        const actsJson = await actsRes.json();
        const activities = actsJson.data?.items || [];

        const activityOneOf = [
          { const: "", title: "Select an option" },
          ...activities.map((a: any) => ({
            const: String(a.id),
            title: a.name,
          })),
        ];

        const ownerEnum = ["", ...ownerIds];
        const ownerEnumNames = ["Select an option", ...ownerNames];

        type JSONSchema7Ext = JSONSchema7 & { oneOf?: any[] };

        const newSchema: JSONSchema7Ext = {
          ...baseSchema,
          properties: {
            ...(baseSchema.properties ?? {}),
            owner: { type: "string", title:'Owner', enum: ownerEnum },
            activity: { type: "string", title:'Activity', oneOf: activityOneOf },
          },
        } as JSONSchema7;

        const newUiSchema = {
          ...baseUiSchema,
          owner: {
            ...(baseUiSchema.owner ?? {}),
            "ui:widget": "select",
            "ui:enumNames": ownerEnumNames,
          },
        };

        const today = new Date().toISOString().split("T")[0];
        setSchema(newSchema);
        setUiSchema(newUiSchema);
        setFormData({
          ...baseFormData,
          owner: "",
          activity: "",
          dueDate: today,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <section>
      {submitted && (
        <p className="mb-4 rounded-md bg-green-100 p-2 text-green-800">
          Data submitted successfully!
        </p>
      )}

      <Form
        schema={schema}
        uiSchema={uiSchema}
        validator={validator}
        formData={formData}
        onSubmit={handleSubmit}
        onError={handleError}
        disabled={submitting}
      >
        <div className="flex ">
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>
      </Form>
    </section>
  );
}
