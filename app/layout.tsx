import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PasswordRecoveryRedirect } from "@/components/password-recovery-redirect";

export const metadata: Metadata = {
  title: "DormLoot",
  description: "A campus marketplace for dorm essentials."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PasswordRecoveryRedirect />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
