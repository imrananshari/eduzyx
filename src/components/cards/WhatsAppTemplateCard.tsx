"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import type { WhatsAppTemplate } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function WhatsAppTemplateCard({ template }: { template: WhatsAppTemplate }) {
  const [enabled, setEnabled] = React.useState(template.enabled);
  return (
    <article className="rounded-card bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <Badge tone="yellow">{template.category}</Badge>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <div className="mt-5 flex size-12 items-center justify-center rounded-[18px] bg-pastel-blue">
        <MessageCircle className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-black">{template.name}</h3>
      <p className="mt-2 text-sm leading-6 text-[#72706c]">{template.preview}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold text-[#72706c]">
        <span>Last sent: {template.lastSent}</span>
        <span>{enabled ? "Enabled" : "Paused"}</span>
      </div>
      <Button className="mt-5 w-full">Send test message</Button>
    </article>
  );
}
