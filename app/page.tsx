import type { Metadata } from "next";
import { SanguoExplorer } from "./SanguoExplorer";

export const metadata: Metadata = {
  title: "三国全史关系图谱",
  description:
    "以央视 1994 年版《三国演义》为主线，对照原著与正史，贯穿黄巾起义至三国归晋的人物、事件与地点关系图谱。",
};

export default function Home() {
  return <SanguoExplorer />;
}
