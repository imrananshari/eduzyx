import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export default function RequestDemoPage() {
  return (
    <main className="min-h-screen bg-canvas p-5">
      <div className="mx-auto max-w-3xl rounded-card bg-white p-6">
        <Link href="/" className="text-xl font-black">EduManage</Link>
        <h1 className="mt-8 text-4xl font-black">Request Demo</h1>
        <p className="mt-2 text-sm leading-6 text-[#72706c]">Tell us about your school and we will prepare a walkthrough.</p>
        <form className="mt-6 flex flex-col gap-3">
          <Input required placeholder="School name" />
          <Input required placeholder="Work email" />
          <Input placeholder="Phone number" />
          <Textarea placeholder="What modules matter most?" />
          <Button>Request Demo</Button>
        </form>
      </div>
    </main>
  );
}
