import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const data = await import("../app/sanguoData.ts");
const { events, people, places, relations } = data;

const argv = process.argv.slice(2);
const phase = readArgument("--phase") ?? "all";
const only = readArgument("--only");
const limit = Number(readArgument("--limit") ?? 0);
const concurrency = Math.max(
  1,
  Math.min(4, Number(readArgument("--concurrency") ?? 2)),
);
const force = argv.includes("--force");

const transcriptRoot = path.join(projectRoot, "content", "narrations");
const audioRoot = path.join(projectRoot, "public", "audio", "narrations");
const personIndex = new Map(people.map((person) => [person.id, person]));
const placeIndex = new Map(places.map((place) => [place.id, place]));

const tasks = [
  ...people.map((person) => ({
    type: "person",
    id: person.id,
    name: person.name,
    entity: person,
  })),
  ...events.map((event) => ({
    type: "event",
    id: event.id,
    name: event.name,
    entity: event,
  })),
]
  .filter((task) => !only || `${task.type}:${task.id}` === only)
  .slice(0, limit > 0 ? limit : undefined);

if (!["scripts", "audio", "all"].includes(phase)) {
  throw new Error("--phase 仅支持 scripts、audio 或 all");
}

await Promise.all([
  mkdir(path.join(transcriptRoot, "people"), { recursive: true }),
  mkdir(path.join(transcriptRoot, "events"), { recursive: true }),
  mkdir(path.join(audioRoot, "people"), { recursive: true }),
  mkdir(path.join(audioRoot, "events"), { recursive: true }),
]);

function readArgument(name) {
  const direct = argv.find((item) => item.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function typeDirectory(type) {
  return type === "person" ? "people" : "events";
}

function transcriptPath(task) {
  return path.join(
    transcriptRoot,
    typeDirectory(task.type),
    `${task.id}.txt`,
  );
}

function audioPath(task) {
  return path.join(audioRoot, typeDirectory(task.type), `${task.id}.mp3`);
}

async function fileSize(filePath) {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

function ensureSentence(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return /[。！？；]$/.test(text) ? text : `${text}。`;
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))];
}

function pickEvents(items, maximum = 6) {
  if (items.length <= maximum) return items;
  const indexes = Array.from(
    { length: maximum },
    (_, index) => Math.round((index * (items.length - 1)) / (maximum - 1)),
  );
  return uniqueValues(indexes.map((index) => items[index]?.id)).map((id) =>
    items.find((item) => item.id === id),
  );
}

function relationSourceLabel(source) {
  if (source === "history") return "史传关系";
  if (source === "novel") return "演义叙事";
  return "电视剧叙事";
}

function composePersonNarration(person) {
  const route = uniqueValues(
    person.route.map((id) => placeIndex.get(id)?.name ?? id),
  );
  const relatedRelations = relations.filter(
    (relation) =>
      relation.from === person.id || relation.to === person.id,
  );
  const allRelatedEvents = events.filter((event) =>
    event.people.includes(person.id),
  );
  const relatedEvents = pickEvents(allRelatedEvents, 6);
  const aliases = uniqueValues(
    person.aliases.filter(
      (alias) =>
        alias !== person.name && !person.courtesy.includes(alias),
    ),
  );

  const paragraphs = [
    `现在介绍${person.name}。${person.courtesy}，属于${person.faction}阵营，身份是${person.role}。${
      aliases.length > 0
        ? `在不同叙事中，人们还会用${aliases.join("、")}称呼他。`
        : ""
    }${ensureSentence(person.summary)}`,
  ];

  if (route.length > 0) {
    paragraphs.push(
      `从全史地图的行动轨迹看，${person.name}与${route.join(
        "、",
      )}等地相连。这条路线不是现代意义上的精确旅行记录，而是把人物在剧集、演义和史传中的主要活动空间串联起来，帮助理解他如何进入不同政治与军事舞台。`,
    );
  }

  if (relatedRelations.length > 0) {
    const descriptions = relatedRelations.map((relation) => {
      const otherId =
        relation.from === person.id ? relation.to : relation.from;
      const other = personIndex.get(otherId);
      return `与${other?.name ?? otherId}之间是“${
        relation.label
      }”关系，这一标注属于${relationSourceLabel(relation.source)}`;
    });
    paragraphs.push(
      `在人物关系网络中，${descriptions.join(
        "；",
      )}。这些连线并不表示人物关系始终不变，而是指出相关历史阶段中最值得注意的联系、冲突或文学塑造。`,
    );
  }

  if (relatedEvents.length > 0) {
    const eventNarration = relatedEvents
      .map(
        (event) =>
          `在${event.date}的“${event.name}”中，${ensureSentence(
            event.summary,
          )}这件事的结果是：${ensureSentence(event.outcome)}`,
      )
      .join("");
    paragraphs.push(
      `${person.name}的生涯可以放回完整时间线中理解。${eventNarration}${
        allRelatedEvents.length > relatedEvents.length
          ? `这里选取的是${allRelatedEvents.length}个关联事件中的关键节点，其余经历仍可沿网站时间轴继续查看。`
          : ""
      }`,
    );
  }

  paragraphs.push(
    `回到央视1994年版电视剧，${ensureSentence(
      person.screen,
    )}这是一种以人物行动和戏剧冲突为中心的荧屏表达，适合作为进入故事的第一层。`,
    `对照《三国演义》，${ensureSentence(
      person.novel,
    )}文学叙事会集中性格、强化对手关系，并把漫长历史压缩成更清楚的戏剧线索，因此不能直接等同于史实。`,
    `再看正史，${ensureSentence(person.history)}${
      person.historyCite
        ? `相关史料入口是${person.historyCite}。`
        : `相关记载可从${person.sources.history.cite}继续查考。`
    }正史能帮助我们确认基本政治与军事轮廓，但对人物内心和具体对话通常不会像电视剧与小说那样铺陈。`,
    `把三种叙事放在一起，${person.name}的重要性不只在某一句名言或某一场胜负，而在于他与${person.faction}的兴衰、关键人物关系以及上述历史节点共同构成了一条连续线索。观看电视剧时保留文学感染力，回到演义时辨认创作方法，再以史传校准事实边界，才能得到更完整的人物认识。`,
  );

  return paragraphs.join("\n\n");
}

function composeEventNarration(event) {
  const place = placeIndex.get(event.placeId);
  const participants = event.people
    .map((id) => personIndex.get(id))
    .filter(Boolean);
  const previous = events
    .filter((item) => item.stage < event.stage)
    .slice(-2);
  const next = events
    .filter((item) => item.stage > event.stage)
    .slice(0, 2);
  const participantText = participants
    .map(
      (person) =>
        `${person.name}，身份为${person.role}，属于${person.faction}`,
    )
    .join("；");

  const paragraphs = [
    `现在讲解“${event.name}”。它位于${event.era}阶段，时间标注为${event.date}。${
      place
        ? `事件关联地点是${place.name}，对应${place.modern}，图谱将其考证状态标为${place.certainty}。`
        : ""
    }${ensureSentence(event.summary)}`,
  ];

  if (place) {
    paragraphs.push(
      `从空间角度看，${ensureSentence(
        place.summary,
      )}网站地图用历史关系而不是现代行政边界呈现这一地点，因此地望存在争议时，只表达大致区域，不把文学场景误当成已经完全确定的考古坐标。`,
    );
  }

  if (previous.length > 0) {
    paragraphs.push(
      `理解这件事，需要先看它之前的局势。${previous
        .map(
          (item) =>
            `“${item.name}”发生在${item.date}，其结果是${ensureSentence(
              item.outcome,
            )}`,
        )
        .join(
          "",
        )}这些前序变化共同构成了“${event.name}”得以发生的政治与军事条件。`,
    );
  }

  if (participants.length > 0) {
    paragraphs.push(
      `事件中的关键人物包括：${participantText}。人物名单说明谁与这一节点直接相关，但并不把所有行动都归于单一人物；真正需要观察的是不同阵营的目标、命令、合作与冲突如何在同一时刻汇合。`,
    );
  }

  paragraphs.push(
    `事件的发展可以概括为：${ensureSentence(
      event.summary,
    )}最终结果是：${ensureSentence(
      event.outcome,
    )}结果段不仅说明当时的胜负，还用于判断势力范围、人物命运和后续战略为何发生变化。`,
  );

  if (next.length > 0) {
    paragraphs.push(
      `沿时间轴继续向后，紧接着可以看到${next
        .map(
          (item) =>
            `“${item.name}”，其时间为${item.date}，结果是${ensureSentence(
              item.outcome,
            )}`,
        )
        .join(
          "以及",
        )}由此可见，“${event.name}”不是孤立场面，而是前后因果链中的一个转折点。`,
    );
  }

  paragraphs.push(
    `在央视1994年版电视剧中，${ensureSentence(
      event.sources.drama.body,
    )}电视剧通过调度、表演节奏和场面组织，把复杂过程集中成便于理解的戏剧高潮。`,
    `对照《三国演义》，${ensureSentence(
      event.sources.novel.body,
    )}原著的章回结构会强化计谋、巧合、对话和人物对照，其中富有感染力的桥段不能自动视为史书记载。`,
    `正史层面，${ensureSentence(event.history)}${
      event.historyCite
        ? `主要史料入口是${event.historyCite}。`
        : `可从${event.sources.history.cite}继续查考。`
    }史书提供事件轮廓和结果依据，但具体过程、人物心理与精确场景仍可能存在记载差异。`,
    `因此，理解“${event.name}”应当分三步：先借电视剧进入情境，再观察演义如何组织故事，最后用史料确认可证部分和争议边界。这样既不会削弱史诗叙事的感染力，也能看清这一事件在汉末三国整体进程中的真实位置。`,
  );

  return paragraphs.join("\n\n");
}

function validateNarration(value, minimumLength) {
  const bannedPatterns = [
    /饰演/,
    /扮演/,
    /演员/,
    /第[一二三四五六七八九十百\d]+集/,
    /剧照/,
  ];
  if (value.length < minimumLength) {
    throw new Error(
      `讲解稿过短，仅 ${value.length} 个字符，最低要求 ${minimumLength}`,
    );
  }
  if (value.length > 2400) {
    throw new Error(`讲解稿过长，共 ${value.length} 个字符`);
  }
  const banned = bannedPatterns.find((pattern) => pattern.test(value));
  if (banned) throw new Error(`讲解稿包含禁用内容：${banned}`);
}

function runCommand(command, commandArguments, timeoutMs = 240000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArguments, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} 执行超时`));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(
          new Error(
            `${command} 退出码 ${code}${stderr ? `：${stderr}` : ""}`,
          ),
        );
      }
    });
  });
}

async function withRetry(operation, label, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const waitMs = 1800 * attempt;
      console.error(
        `[重试 ${attempt}/${attempts - 1}] ${label}：${error.message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function generateTranscript(task) {
  const outputPath = transcriptPath(task);
  if (!force && (await fileSize(outputPath)) > 900) {
    return { status: "skipped", path: outputPath };
  }

  const narration =
    task.type === "person"
      ? composePersonNarration(task.entity)
      : composeEventNarration(task.entity);
  const minimumLength = task.type === "person" ? 650 : 600;
  validateNarration(narration, minimumLength);

  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, `${narration}\n`, "utf8");
  await rename(temporaryPath, outputPath);
  return { status: "generated", path: outputPath, length: narration.length };
}

async function generateAudio(task) {
  const inputPath = transcriptPath(task);
  const outputPath = audioPath(task);
  const transcript = await readFile(inputPath, "utf8");
  const minimumLength = task.type === "person" ? 650 : 600;
  validateNarration(transcript.trim(), minimumLength);
  if ((await fileSize(inputPath)) < 900) {
    throw new Error(`${task.type}:${task.id} 缺少合格讲解稿`);
  }
  if (!force && (await fileSize(outputPath)) > 50000) {
    return { status: "skipped", path: outputPath };
  }

  const temporaryPath = `${outputPath}.tmp`;
  await withRetry(
    () =>
      runCommand(
        "mmx",
        [
          "speech",
          "synthesize",
          "--text-file",
          inputPath,
          "--model",
          "speech-2.8-hd",
          "--voice",
          "male-qn-jingying",
          "--speed",
          "0.96",
          "--volume",
          "1",
          "--pitch",
          "0",
          "--format",
          "mp3",
          "--sample-rate",
          "24000",
          "--bitrate",
          "48000",
          "--channels",
          "1",
          "--language",
          "zh",
          "--out",
          temporaryPath,
          "--non-interactive",
          "--quiet",
          "--output",
          "json",
        ],
        360000,
      ),
    `${task.type}:${task.id} 语音`,
  );
  if ((await fileSize(temporaryPath)) < 50000) {
    throw new Error(`${task.type}:${task.id} 生成的音频文件异常`);
  }
  await rename(temporaryPath, outputPath);
  return {
    status: "generated",
    path: outputPath,
    size: await fileSize(outputPath),
  };
}

async function runPool(items, worker, label) {
  let cursor = 0;
  let completed = 0;
  const failures = [];

  async function consume() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const task = items[index];
      try {
        const result = await worker(task);
        completed += 1;
        console.log(
          `[${label} ${completed}/${items.length}] ${task.type}:${task.id} ${result.status}`,
        );
      } catch (error) {
        completed += 1;
        failures.push({ task: `${task.type}:${task.id}`, error: error.message });
        console.error(
          `[${label}失败 ${completed}/${items.length}] ${task.type}:${task.id}：${error.message}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, consume),
  );
  if (failures.length > 0) {
    throw new Error(
      `${label}有 ${failures.length} 项失败：${JSON.stringify(failures)}`,
    );
  }
}

async function writeManifest() {
  const entries = [];
  for (const task of tasks) {
    const transcript = await readFile(transcriptPath(task), "utf8");
    entries.push({
      type: task.type,
      id: task.id,
      name: task.name,
      voice: "male-qn-jingying",
      model: "speech-2.8-hd",
      characters: transcript.trim().length,
      audio: `/audio/narrations/${typeDirectory(task.type)}/${task.id}.mp3`,
    });
  }
  await writeFile(
    path.join(audioRoot, "manifest.json"),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        voice: "male-qn-jingying",
        model: "speech-2.8-hd",
        count: entries.length,
        entries,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

console.log(
  `准备处理 ${tasks.length} 项，阶段 ${phase}，并发 ${concurrency}，强制重建 ${force ? "是" : "否"}`,
);

if (phase === "scripts" || phase === "all") {
  await runPool(tasks, generateTranscript, "讲解稿");
}
if (phase === "audio" || phase === "all") {
  await runPool(tasks, generateAudio, "语音");
  await writeManifest();
}

console.log("全部任务完成。");
