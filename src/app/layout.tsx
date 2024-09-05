import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="fixed w-[250vw] h-[250vw] -z-50 bg-gradient-to-br from-blue-500 to-pink-400 animate-translateXY"/>
          
        <Toaster />
        <div className="flex justify-center items-center w-screen">
          {/* {children} */}
        </div>
      </body>
    </html>
  );
}
