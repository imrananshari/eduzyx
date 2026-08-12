import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function WhatsAppPreviewPanel() {
  return (
    <div className="rounded-card bg-ink p-5 text-white">
      <Badge tone="yellow">Cloud API-ready</Badge>
      <div className="mt-5 flex size-12 items-center justify-center rounded-[18px] bg-cta">
        <MessageCircle className="size-6" />
      </div>
      <h3 className="mt-4 text-xl font-black">Message preview</h3>
      <p className="mt-3 rounded-[20px] bg-white p-4 text-sm leading-6 text-ink">Hi Priya, Aarav is marked absent today. Please confirm if he is unwell or will arrive late.</p>
      <Button className="mt-5 w-full">Send test message</Button>
    </div>
  );
}
