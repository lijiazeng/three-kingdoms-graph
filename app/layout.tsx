import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "三国万象",
    template: "%s｜三国万象",
  },
  description:
    "在一张连续的天下画布中探索汉末三国的人物、事件、地点、关系与史料差异。",
  icons: {
    icon: "/images/sanguo-wanxiang-logo.png",
    shortcut: "/images/sanguo-wanxiang-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
