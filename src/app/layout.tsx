import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduManage | School Management SaaS",
  description: "A bold school management SaaS MVP for administrators, teachers, parents, students, and staff."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
