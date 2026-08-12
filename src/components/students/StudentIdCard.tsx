"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import QRCode from "qrcode";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StudentCardData = {
  name: string;
  studentCode: string;
  className: string;
  sectionName: string;
  schoolName: string;
  schoolCode?: string | null;
  schoolLogoUrl?: string | null;
  imageUrl?: string | null;
  parentEmail?: string | null;
  parentPhone?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  issuedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  profileUrl: string;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Auto";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Auto";
  return date.toLocaleDateString();
}

export function StudentIdCard({ data, printable = false }: { data: StudentCardData; printable?: boolean }) {
  const [flipped, setFlipped] = React.useState(false);
  const [qr, setQr] = React.useState("");

  React.useEffect(() => {
    let active = true;
    QRCode.toDataURL(data.profileUrl, { margin: 1, width: 132, color: { dark: "#3b2c67", light: "#fff7f1" } })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setQr("");
      });
    return () => {
      active = false;
    };
  }, [data.profileUrl]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn("relative h-[420px] w-[268px] [perspective:1200px]", printable && "h-[400px]")}>
        <div className={cn("relative size-full transition duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
          <CardFace>
            <Decorations />
            <div className="relative z-10 flex h-full flex-col items-center px-6 py-7 text-center">
              <div className="mb-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-normal text-[#3b2c67]">
                {data.schoolLogoUrl ? <img src={data.schoolLogoUrl} alt="" className="size-8 rounded-full object-cover" /> : <span className="size-4 rounded-full bg-[#3b2c67]" />}
                <span>{data.schoolCode || data.schoolName}</span>
              </div>
              <div className="flex size-32 items-center justify-center overflow-hidden rounded-full bg-white ring-4 ring-white">
                {data.imageUrl ? <img src={data.imageUrl} alt={data.name} className="size-full object-cover" /> : <span className="text-4xl font-black text-[#3b2c67]">{data.name.slice(0, 1).toUpperCase() || "S"}</span>}
              </div>
              <div className="mt-8">
                <h3 className="text-2xl font-black leading-tight text-[#3b2c67]">{data.name || "Student Name"}</h3>
                <p className="mt-1 text-xs font-black uppercase text-[#3b2c67]">{data.className} - Section {data.sectionName}</p>
                <p className="mt-2 rounded-pill bg-white/80 px-3 py-1 text-[10px] font-black text-[#3b2c67]">ID {data.studentCode || "Generated on save"}</p>
              </div>
              <div className="mt-auto rounded-[10px] border-2 border-[#3b2c67] bg-white/60 px-5 py-3 text-[11px] font-black text-[#3b2c67]">
                <p>JOIN: {formatDate(data.issuedAt)}</p>
                <p>EXPIRE: {formatDate(data.expiresAt)}</p>
              </div>
            </div>
          </CardFace>

          <CardFace back>
            <Decorations reverse />
            <div className="relative z-10 flex h-full flex-col items-center px-6 py-8 text-center">
              <div className="mt-14 rounded-[22px] border border-white/60 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-md">
                <h3 className="text-2xl font-black leading-tight text-[#3b2c67]">{data.name || "Student Name"}</h3>
                <p className="mt-2 text-[11px] font-bold text-[#6f5f86]">ID {data.studentCode || "Generated on save"}</p>
                <p className="mt-1 text-[11px] font-bold text-[#6f5f86]">Blood {data.bloodGroup || "Not set"}</p>
                <p className="mt-1 max-h-8 overflow-hidden text-[11px] font-bold leading-4 text-[#6f5f86]">{data.address || "Address not set"}</p>
                <p className="mt-1 text-[11px] font-bold text-[#6f5f86]">Phone {data.parentPhone || "+91 00000 00000"}</p>
              </div>
              <p className="mt-7 text-xs font-black uppercase text-[#3b2c67]">More info</p>
              <div className="mt-2 flex size-28 items-center justify-center bg-white p-2">
                {qr ? <img src={qr} alt="Student QR code" className="size-full" /> : <span className="text-[10px] font-black text-[#3b2c67]">QR</span>}
              </div>
              <div className="mt-3 flex h-8 w-40 items-end justify-center gap-[2px] rounded-[8px] bg-white/85 px-3 py-1">
                {Array.from({ length: 22 }).map((_, index) => <span key={index} className="bg-[#3b2c67]" style={{ width: index % 4 === 0 ? 3 : 2, height: 10 + ((index * 7) % 18) }} />)}
              </div>
              <p className="mt-auto rounded-pill bg-white/80 px-3 py-1 text-[10px] font-black uppercase text-[#3b2c67] backdrop-blur">{data.schoolName}</p>
            </div>
          </CardFace>
        </div>
      </div>
      {!printable ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => setFlipped((current) => !current)}>
          <RotateCw className="size-4" />
          Flip card
        </Button>
      ) : null}
    </div>
  );
}

function CardFace({ children, back = false }: { children: React.ReactNode; back?: boolean }) {
  return (
    <div className={cn("id-card-face absolute inset-0 overflow-hidden rounded-[2px] bg-[#fff7f1] text-[#3b2c67] shadow-[0_14px_24px_rgba(21,19,19,0.14)] [backface-visibility:hidden]", back && "[transform:rotateY(180deg)]")}>
      {children}
    </div>
  );
}

function Decorations({ reverse = false }: { reverse?: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0">
      <span className={cn("absolute -left-10 top-0 h-28 w-20 rounded-b-full bg-[#fbb316]", reverse && "left-10 -top-10 h-24 w-24 rounded-full")} />
      <span className="absolute -right-9 top-0 size-28 rounded-bl-full bg-[#d85aae]" />
      <span className="absolute -bottom-14 -left-10 size-32 rounded-full bg-[#d85aae]" />
      <span className="absolute -bottom-10 -left-8 size-20 rounded-tr-full bg-[#3b2c67]" />
      <span className="absolute -right-11 bottom-10 size-24 rounded-full bg-[#ff4a22]" />
      <span className="absolute -right-7 bottom-24 size-16 rounded-full bg-[#d85aae]" />
      <span className="absolute bottom-6 left-24 size-10 rounded-full bg-[#fbb316]" />
      <span className="absolute bottom-8 left-20 grid grid-cols-5 gap-1">
        {Array.from({ length: 20 }).map((_, index) => <i key={index} className="size-1 rounded-full bg-[#3b2c67]" />)}
      </span>
      <span className="absolute left-2 top-20 h-24 w-24 rounded-full border-2 border-[#3b2c67]" />
      <span className="absolute left-0 top-24 h-24 w-24 rounded-full border-2 border-[#3b2c67]" />
      <span className="absolute right-6 top-24 h-24 w-12 border-2 border-[#fbb316]" />
      <span className="absolute right-5 top-5 text-4xl font-black text-[#3b2c67]">+</span>
      <span className="absolute left-20 top-7 text-3xl font-black text-[#ff4a22]">+</span>
    </div>
  );
}
