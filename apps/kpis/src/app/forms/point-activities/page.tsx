import type { Metadata } from "next";

import ClientFormWrapper from "./ClientFormWrapper";

export const metadata: Metadata = {
  title: "Point Activities Form",
};

export default function PointActivitiesFormPage() {
  return (
    <main className="container mx-auto max-w-2xl p-4">
      <h1 className="mt-4 mb-5 text-3xl font-semibold">
        Point Activities Form
      </h1>
      <ClientFormWrapper />
    </main>
  );
}
