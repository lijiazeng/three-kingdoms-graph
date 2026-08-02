import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("服务端渲染三国万象全史图谱", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>三国全史关系图谱｜三国万象<\/title>/i);
  assert.match(html, /三国万象/);
  assert.match(html, /天下/);
  assert.match(html, /人物/);
  assert.match(html, /事件/);
  assert.match(html, /火烧赤壁/);
  assert.match(html, /全史关系图谱/);
  assert.match(html, /电视剧/);
  assert.match(html, /原著/);
  assert.match(html, /正史/);
  assert.match(html, /地图缩放控制/);
  assert.match(html, /放大地图/);
  assert.match(html, /缩小地图/);
  assert.match(html, /复位地图与图谱节点/);
  assert.match(html, /可拖动/);
  assert.match(html, /收起详情/);
  assert.equal((html.match(/class="tab-icon"/g) ?? []).length, 6);
  assert.doesNotMatch(html, /选择标签样式|标签纹样|四式可选/);
  assert.doesNotMatch(html, /滚轮缩放|造型语汇参考|AI 原创重构/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("全史数据与 ImageGen 图片均保存在项目内", async () => {
  const [component, model, data, packageJson, worker, imageRoot, portraits, silhouettes, eventImages, placeImages] = await Promise.all([
    readFile(new URL("../app/SanguoExplorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sanguoExplorerModel.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sanguoData.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readdir(new URL("../public/images/", import.meta.url)),
    readdir(new URL("../public/images/portraits/", import.meta.url)),
    readdir(new URL("../public/images/silhouettes/", import.meta.url)),
    readdir(new URL("../public/images/events/", import.meta.url)),
    readdir(new URL("../public/images/places/", import.meta.url)),
  ]);
  const explorerSource = `${component}\n${model}`;

  assert.deepEqual(imageRoot.sort(), [
    "events",
    "places",
    "portraits",
    "red-cliffs-river.webp",
    "sanguo-wanxiang-logo.png",
    "silhouettes",
    "three-kingdoms-world.webp",
  ]);
  const personBlock = data
    .split("const personSeeds: PersonSeed[] = [")[1]
    .split("export const people")[0];
  const expectedPersonIds = [
    ...personBlock.matchAll(/^\s+id: "([^"]+)"/gm),
  ]
    .map((match) => match[1])
    .sort();
  const expectedPortraitAssets = expectedPersonIds.map((id) => `${id}.webp`);
  const expectedSilhouetteAssets = expectedPersonIds.map((id) => `${id}.png`);
  assert.equal(expectedPersonIds.length, 53);
  assert.equal(portraits.length, silhouettes.length);
  assert.deepEqual(portraits.sort(), expectedPortraitAssets);
  assert.deepEqual(silhouettes.sort(), expectedSilhouetteAssets);
  const eventBlock = data
    .split("const eventSeeds: EventSeed[] = [")[1]
    .split("const placeIndex")[0];
  const expectedEventAssets = [
    ...eventBlock.matchAll(/\{ id: "([^"]+)"/g),
  ]
    .map((match) => `${match[1]}.webp`)
    .sort();
  assert.equal(expectedEventAssets.length, 51);
  assert.deepEqual(eventImages.sort(), expectedEventAssets);
  assert.match(data, /image: `\/images\/events\/\$\{seed\.id\}\.webp`/);
  const placeBlock = data
    .split("const placeSeeds: PlaceSeed[] = [")[1]
    .split("export const places")[0];
  const expectedPlaceAssets = [
    ...placeBlock.matchAll(/^\s+\["([^"]+)",/gm),
  ]
    .map((match) => `${match[1]}.webp`)
    .sort();
  assert.equal(expectedPlaceAssets.length, 49);
  assert.deepEqual(placeImages.sort(), expectedPlaceAssets);
  assert.match(data, /image: `\/images\/places\/\$\{id\}\.webp`/);
  assert.match(data, /const INTRODUCTION_MIN_LENGTH = 50/);
  assert.match(data, /const INTRODUCTION_MAX_LENGTH = 100/);
  assert.match(data, /summary: makeBoundedIntroduction\(\[/);
  assert.ok(
    (data.match(/summary: makeBoundedIntroduction\(\[/g) ?? []).length >= 2,
    "人物与事件均应使用 50—100 字简介",
  );
  assert.match(component, /selectedEvent\.image/);
  assert.match(component, /selectedPlace\.image/);
  assert.match(component, /selectedBaikeUrl/);
  assert.match(component, /className="detail-baike-link"/);
  assert.match(component, /selectedPerson\?\.videoUrl/);
  assert.doesNotMatch(component, /detail-summary-row/);
  assert.equal((data.match(/videoUrl: "https:\/\/baike\.baidu\.com\/l\//g) ?? []).length, 41);
  assert.match(data, /"guan-yu": \{ videoUrl: "https:\/\/baike\.baidu\.com\/l\/Eh3wapvH" \}/);
  assert.match(data, /"yuan-shao": \{ videoUrl: "https:\/\/baike\.baidu\.com\/l\/UlYNtirn" \}/);
  assert.match(component, /className="video-overlay"/);
  assert.match(component, /<iframe/);
  assert.match(component, /sandbox="allow-forms allow-popups allow-presentation allow-same-origin allow-scripts"/);
  assert.match(component, /AI 生成内容/);
  assert.match(component, /AI 生成图像/);
  assert.match(component, /AI讲解/);
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /Permissions-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(
    data,
    /https:\/\/baike\.baidu\.com\/item\/%E6%9B%B9%E6%93%8D\/6772/,
  );
  assert.match(data, /https:\/\/baike\.baidu\.com\/l\/J96AERLz/);
  assert.match(data, /https:\/\/baike\.baidu\.com\/l\/CjYdvIlV/);
  assert.match(component, /\/images\/three-kingdoms-world\.webp/);
  assert.match(component, /\/images\/sanguo-wanxiang-logo\.png/);
  assert.match(component, /\/audio\/three-kingdoms-ambience\.mp3/);
  assert.match(component, /onWheel=\{handleMapWheel\}/);
  assert.match(component, /onPointerMove=\{handleMapPointerMove\}/);
  assert.match(component, /className="map-transform-layer"/);
  assert.match(component, /className={`historical-place-label-layer/);
  assert.match(component, /BASE_MAP_LABEL_IDS/);
  assert.match(component, /SECONDARY_MAP_LABEL_IDS/);
  assert.match(component, /TERTIARY_MAP_LABEL_IDS/);
  assert.match(component, /places\.map\(\(place\)/);
  assert.match(component, /startNodeDrag/);
  assert.match(component, /handleNodePointerMove/);
  assert.match(component, /draggableGraphPositions/);
  assert.match(component, /setNodePositionOverrides\(\{\}\)/);
  assert.match(component, /data-node-key=\{key\}/);
  assert.match(component, /<MapEntityIcon type="place" \/>/);
  assert.match(component, /<MapEntityIcon type="event" \/>/);
  assert.doesNotMatch(component, /className="event-index"/);
  assert.doesNotMatch(component, /timeline-label"><small>/);
  assert.doesNotMatch(explorerSource, /causal-thread|causal-item|当前事件因果关系/);
  assert.doesNotMatch(component, /点击进入事件|跨越完整时间线/);
  assert.doesNotMatch(explorerSource, /currentRoute|army-route|route-current/);
  assert.match(data, /id: "yellow-turban"/);
  assert.match(data, /id: "three-to-jin"/);
  assert.ok((data.match(/name: "/g) ?? []).length >= 100);
  assert.ok((data.match(/id: "/g) ?? []).length >= 100);
  assert.doesNotMatch(explorerSource, /https?:\/\/(?!baike\.baidu\.com)/);
  assert.doesNotMatch(data, /https?:\/\/(?!baike\.baidu\.com)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview/", import.meta.url)));
  await access(new URL("../public/images/red-cliffs-river.webp", import.meta.url));
  await access(new URL("../public/images/sanguo-wanxiang-logo.png", import.meta.url));
  await access(new URL("../public/images/three-kingdoms-world.webp", import.meta.url));
  await access(
    new URL("../public/audio/three-kingdoms-ambience.mp3", import.meta.url),
  );
  const sampleSilhouette = await readFile(
    new URL("../public/images/silhouettes/lu-bu.png", import.meta.url),
  );
  assert.equal(sampleSilhouette[25], 6, "剪影应为带透明通道的 RGBA PNG");
  const logo = await readFile(
    new URL("../public/images/sanguo-wanxiang-logo.png", import.meta.url),
  );
  assert.equal(logo[25], 6, "网站 Logo 应为透明背景的 RGBA PNG");
  await access(projectRoot);
});

test("人物与事件均具备独立的详实语音讲解", async () => {
  const [component, model, data, manifestText, peopleAudio, eventAudio, peopleScripts, eventScripts] =
    await Promise.all([
      readFile(new URL("../app/SanguoExplorer.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/sanguoExplorerModel.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/sanguoData.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../public/audio/narrations/manifest.json", import.meta.url),
        "utf8",
      ),
      readdir(new URL("../public/audio/narrations/people/", import.meta.url)),
      readdir(new URL("../public/audio/narrations/events/", import.meta.url)),
      readdir(new URL("../content/narrations/people/", import.meta.url)),
      readdir(new URL("../content/narrations/events/", import.meta.url)),
    ]);
  const explorerSource = `${component}\n${model}`;

  const personBlock = data
    .split("const personSeeds: PersonSeed[] = [")[1]
    .split("export const people")[0];
  const peopleIds = [...personBlock.matchAll(/^\s+id: "([^"]+)"/gm)].map(
    (match) => match[1],
  );
  const eventBlock = data
    .split("const eventSeeds: EventSeed[] = [")[1]
    .split("const placeIndex")[0];
  const eventIds = [...eventBlock.matchAll(/\{ id: "([^"]+)"/g)].map(
    (match) => match[1],
  );
  const expectedPeopleAudio = peopleIds.map((id) => `${id}.mp3`).sort();
  const expectedEventAudio = eventIds.map((id) => `${id}.mp3`).sort();
  const expectedPeopleScripts = peopleIds.map((id) => `${id}.txt`).sort();
  const expectedEventScripts = eventIds.map((id) => `${id}.txt`).sort();

  assert.equal(peopleIds.length, 53);
  assert.equal(eventIds.length, 51);
  assert.deepEqual(peopleAudio.sort(), expectedPeopleAudio);
  assert.deepEqual(eventAudio.sort(), expectedEventAudio);
  assert.deepEqual(peopleScripts.sort(), expectedPeopleScripts);
  assert.deepEqual(eventScripts.sort(), expectedEventScripts);

  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.count, 104);
  assert.equal(manifest.voice, "male-qn-jingying");
  assert.equal(manifest.model, "speech-2.8-hd");
  assert.equal(manifest.entries.length, 104);
  assert.ok(manifest.entries.every((entry) => entry.characters >= 600));
  assert.ok(
    manifest.entries.every(
      (entry) =>
        entry.voice === "male-qn-jingying" &&
        entry.model === "speech-2.8-hd",
    ),
  );

  const allAudioUrls = [
    ...expectedPeopleAudio.map(
      (name) => new URL(`../public/audio/narrations/people/${name}`, import.meta.url),
    ),
    ...expectedEventAudio.map(
      (name) => new URL(`../public/audio/narrations/events/${name}`, import.meta.url),
    ),
  ];
  const audioStats = await Promise.all(allAudioUrls.map((url) => stat(url)));
  assert.ok(audioStats.every((item) => item.size > 50000));

  const allScriptUrls = [
    ...expectedPeopleScripts.map(
      (name) => new URL(`../content/narrations/people/${name}`, import.meta.url),
    ),
    ...expectedEventScripts.map(
      (name) => new URL(`../content/narrations/events/${name}`, import.meta.url),
    ),
  ];
  const scripts = await Promise.all(
    allScriptUrls.map((url) => readFile(url, "utf8")),
  );
  assert.ok(scripts.every((script) => script.trim().length >= 600));
  assert.ok(
    scripts.every(
      (script) =>
        /电视剧/.test(script) &&
        /(《三国演义》|原著|演义)/.test(script) &&
        /(正史|史书|史料|史传)/.test(script),
    ),
  );
  assert.ok(
    scripts.every(
      (script) =>
        !/饰演|扮演|演员|第[一二三四五六七八九十百\d]+集|剧照|MiniMax|M2\.7/.test(
          script,
        ),
    ),
  );

  assert.match(component, /className="narration-button"/);
  assert.match(explorerSource, /\/audio\/narrations\/people\//);
  assert.match(explorerSource, /\/audio\/narrations\/events\//);
  assert.match(component, /语音讲解/);
});
