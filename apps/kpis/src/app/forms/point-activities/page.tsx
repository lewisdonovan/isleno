import type { Metadata } from "next";

import ClientFormWrapper from "./ClientFormWrapper";

export const metadata: Metadata = {
  title: "Point Activities Form",
};

export default function PointActivitiesFormPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-3xl font-semibold">
        Point Activities Form
      </h1>
      <ClientFormWrapper />
    </main>
  );
}
