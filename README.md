# 三国万象（Three Kingdoms Graph）

以央视 1994 年版《三国演义》为叙事入口，对照《三国演义》原著与正史，在同一张可缩放、可拖拽的天下地图中探索人物、事件、地点及其关系。

> 项目地址：<https://github.com/lijiazeng/three-kingdoms-graph>

## 项目特色

- 53 位核心人物：人物关系、行动路线、三重叙事对照、独立画像与剪影。
- 51 个关键事件：从黄巾起义到三国归晋，以连续时间轴串联。
- 49 处历史地点：标注古今对应、考证可信度及相关事件。
- 7 个专题导览：赤壁、刘备生平、曹操统一北方、蜀汉北伐、孙氏江东、荆州变迁与司马氏崛起。
- 三种浏览视角：天下、人物、事件，可通过搜索和筛选快速定位。
- 史料边界清晰：电视剧负责叙事引入，原著展示文学塑造，正史负责史料收束。
- 沉浸式体验：原创氛围音乐、人物与事件 AI 语音讲解、事件和地点场景图。
- 图谱交互：地图缩放与拖拽、图谱节点拖动、节点位置一键复位。

## 快速开始

环境要求：Node.js `>= 22.13.0`、npm `>= 10`。

```bash
git clone https://github.com/lijiazeng/three-kingdoms-graph.git
cd three-kingdoms-graph
npm ci
npm run dev
```

打开 <http://localhost:3000/>。如需让同一局域网中的设备访问：

```bash
npm run dev -- --host 0.0.0.0
```

## 常用命令

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# ESLint 检查
npm run lint

# 构建并运行数据、资源和页面回归测试
npm test
```

语音讲解稿已经随仓库提供。重新生成讲解稿或音频需要本机安装并配置 `mmx`，且不得把 API 密钥写入仓库：

```bash
# 仅生成讲解稿
npm run narrations:generate -- --phase scripts

# 仅生成音频，可用 --only person:cao-cao 限定单项
npm run narrations:generate -- --phase audio
```

## 目录结构

```text
app/
  SanguoExplorer.tsx       主界面与交互逻辑
  sanguoData.ts            人物、事件、地点和关系数据
  sanguoExplorerModel.ts   时间轴、专题和地图派生模型
content/narrations/        人物与事件语音讲解稿
public/images/             地图、Logo、人物、事件和地点视觉资源
public/audio/              氛围音乐与语音讲解
scripts/                   媒体生成辅助脚本
tests/                     数据、资源和渲染回归测试
worker/                    Cloudflare Worker 入口与安全响应头
```

## 数据与史料原则

本项目不是逐集索引，也不收录演员表。每个对象尽量维持以下三层信息：

1. **电视剧**：以央视 1994 年版的整体叙事、人物塑造和场面组织为入口。
2. **原著**：对照《三国演义》的章回叙事、文学加工和典故来源。
3. **正史**：以《三国志》《后汉书》《资治通鉴》等史料校准基本事实与争议边界。

地图用于表达历史地理关系，不是现代 GIS 产品。争议地望、势力范围和人物路线均为帮助理解的示意，不应作为精确行政边界或考古结论使用。

## AI 生成内容说明

- 网站内人物、事件、地点、地图与 Logo 视觉资源均为 AI 生成或 AI 辅助制作，不使用电视剧剧照和演员照片。
- 人物面孔为虚构重构，不对应或冒充任何演员；冠服、甲胄与时代氛围仅作为艺术化历史表达。
- 人物与事件讲解稿由项目作者整理，音频使用 MiniMax `male-qn-jingying` 音色合成；页面按钮与媒体区域已标注 AI 内容。
- 若生成内容与现实人物、受保护作品或标识产生非预期相似，请通过 GitHub Issue 或安全渠道反馈。

## 外部链接与非官方声明

人物百科和部分“秒懂历史”视频使用百度百科公开链接。视频在第三方页面中加载，仓库不复制或再分发其视频文件，访问时适用第三方服务条款与隐私规则。

本项目是非官方、非商业的个人开源项目，与中央广播电视总台、电视剧制作方、出版机构、百度百科、OpenAI 或 MiniMax 均无隶属、赞助或授权关系。节目名、书名、商标和第三方内容权利归各自权利人所有；相关名称仅用于识别、评论和研究。

## 参与贡献

提交人物、事件或地点资料时，请同时说明电视剧、原著和正史中的信息边界，并提供可核查出处。代码与资源变更需先运行：

```bash
npm run lint
npm test
```

详细约定见 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [AGENT.md](./AGENT.md)。安全问题请按 [SECURITY.md](./SECURITY.md) 私下报告。

## 许可

- 源代码使用 [MIT License](./LICENSE)。
- 仓库内原创或 AI 生成媒体资源，在作者依法享有可许可权益的范围内，使用 [CC BY 4.0](./ASSET_LICENSE.md)。
- 第三方名称、链接、商标和嵌入内容不在上述许可范围内。
