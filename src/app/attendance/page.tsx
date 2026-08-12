"use client";

import * as React from "react";
import { ModulePage } from "@/components/pages/ModulePage";
import { attendance } from "@/data/mockData";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  const [status, setStatus] = React.useState("Present");
  return (
    <ModulePage
      title="Attendance Management"
      description="Daily attendance, class-wise marking, history, teacher attendance placeholder, monthly summary, and WhatsApp absence trigger placeholder."
      rows={attendance.map((item) => ({ student: item.student, class: item.className, date: item.date, status: item.status }))}
    >
      <div className="rounded-card bg-pastel-yellow p-5">
        <h2 className="text-lg font-black">Quick mark demo</h2>
        <p className="mt-2 text-sm text-[#72706c]">Current selected status: {status}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Present", "Absent", "Late"].map((item) => <Button key={item} variant={status === item ? "default" : "ghost"} onClick={() => setStatus(item)}>{item}</Button>)}
        </div>
      </div>
    </ModulePage>
  );
}
