"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ImageUploadField, FileUploadField, VideoUploadField } from "@/components/forms/UploadFields";

export function FormModal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-pastel-purple p-5">
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MockForm({ kind, media = false }: { kind: string; media?: boolean }) {
  const [submitted, setSubmitted] = React.useState(false);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Input required placeholder={`${kind} title or name`} />
      <Input required placeholder="Class / section / audience" />
      <Textarea required placeholder="Short description" />
      {media ? (
        <div className="grid gap-3 md:grid-cols-3">
          <ImageUploadField />
          <FileUploadField />
          <VideoUploadField />
        </div>
      ) : null}
      <Button type="submit">Save {kind}</Button>
      {submitted ? (
        <p className="flex items-center gap-2 rounded-pill bg-white px-4 py-3 text-sm font-bold text-ink">
          <CheckCircle2 className="size-4 text-cta" />
          Mock {kind.toLowerCase()} saved. Backend integration can replace this later.
        </p>
      ) : null}
    </form>
  );
}

export function StudentForm() {
  return <MockForm kind="Student" media />;
}

export function ClassForm() {
  return <MockForm kind="Class" />;
}

export function HomeworkForm() {
  return <MockForm kind="Homework" media />;
}

export function FeeForm() {
  return <MockForm kind="Fee" />;
}

export function NoticeForm() {
  return <MockForm kind="Notice" />;
}
