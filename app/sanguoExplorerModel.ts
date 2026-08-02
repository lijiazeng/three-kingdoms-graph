import {
  eventById,
  events,
  factionLabels,
  people,
  personById,
  placeById,
  places,
} from "./sanguoData";
import type {
  EntityType,
  Faction,
  Person,
  Place,
  SourceKey,
} from "./sanguoData";

export const factions = Object.keys(factionLabels) as Faction[];
export const MIN_MAP_SCALE = 1;
export const MAX_MAP_SCALE = 2.8;
export const MAP_SCALE_STEP = 0.24;
export const INITIAL_MAP_VIEW: MapView = { x: 0, y: 0, scale: 1 };

export type MapView = {
  x: number;
  y: number;
  scale: number;
};

export type MapSize = {
  width: number;
  height: number;
};

export type NodePosition = {
  x: number;
  y: number;
};

export type Narration = {
  key: string;
  src: string;
  title: string;
};

export type BattleBrief = {
  title: string;
  terrain: string;
  sides: string;
  steps: string[];
};

export const battleBriefs: Record<string, BattleBrief> = {
  guandu: {
    title: "官渡战局",
    terrain: "黄河南岸 · 粮道决胜",
    sides: "曹操军 ↔ 袁绍军",
    steps: ["坚守官渡", "许攸来奔", "奇袭乌巢"],
  },
  "red-cliffs-battle": {
    title: "赤壁战局",
    terrain: "长江中游 · 水陆火攻",
    sides: "孙刘联军 ↔ 曹操军",
    steps: ["联军会合", "黄盖诈降", "顺风火攻"],
  },
  dingjun: {
    title: "定军山战局",
    terrain: "汉中山地 · 制高争夺",
    sides: "刘备军 ↔ 夏侯渊军",
    steps: ["对峙山麓", "法正举旗", "黄忠突击"],
  },
  yiling: {
    title: "夷陵战局",
    terrain: "峡江山地 · 连营火攻",
    sides: "陆逊军 ↔ 刘备军",
    steps: ["陆逊坚守", "蜀军连营", "火攻反击"],
  },
  jieting: {
    title: "街亭战局",
    terrain: "陇山通道 · 水源粮道",
    sides: "张郃军 ↔ 马谡军",
    steps: ["马谡上山", "张郃断水", "蜀军撤退"],
  },
  wuzhang: {
    title: "五丈原对峙",
    terrain: "渭水南岸 · 长期消耗",
    sides: "诸葛亮军 ↔ 司马懿军",
    steps: ["蜀军屯田", "魏军坚守", "星落撤军"],
  },
  yinping: {
    title: "阴平奇袭",
    terrain: "秦蜀险道 · 纵深突破",
    sides: "邓艾奇兵 → 成都",
    steps: ["剑阁受阻", "越过阴平", "直抵绵竹"],
  },
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function nodeKey(type: EntityType, id: string) {
  return `${type}:${id}`;
}

export function constrainMapView(
  view: MapView,
  width: number,
  height: number,
): MapView {
  const scale = clamp(view.scale, MIN_MAP_SCALE, MAX_MAP_SCALE);
  const maxX = width * 0.12 + (width * (scale - 1)) / 2;
  const maxY = height * 0.1 + (height * (scale - 1)) / 2;

  return {
    scale,
    x: clamp(view.x, -maxX, maxX),
    y: clamp(view.y, -maxY, maxY),
  };
}

export function getTerritoryZones(stage: number) {
  if (stage <= 9) {
    return [
      {
        faction: "汉室" as Faction,
        label: "汉廷名义",
        cx: 520,
        cy: 205,
        rx: 150,
        ry: 82,
      },
      {
        faction: "群雄" as Faction,
        label: "州郡群雄",
        cx: 640,
        cy: 285,
        rx: 255,
        ry: 150,
      },
    ];
  }
  if (stage <= 19) {
    return [
      {
        faction: "曹魏" as Faction,
        label: "曹操",
        cx: 585,
        cy: 190,
        rx: 230,
        ry: 128,
      },
      {
        faction: "群雄" as Faction,
        label: "割据残部",
        cx: 365,
        cy: 330,
        rx: 105,
        ry: 95,
      },
      {
        faction: "蜀汉" as Faction,
        label: "刘备",
        cx: 515,
        cy: 420,
        rx: 72,
        ry: 64,
      },
      {
        faction: "孙吴" as Faction,
        label: "孙氏江东",
        cx: 735,
        cy: 410,
        rx: 120,
        ry: 94,
      },
    ];
  }
  if (stage <= 34) {
    return [
      {
        faction: "曹魏" as Faction,
        label: "曹操集团",
        cx: 590,
        cy: 180,
        rx: 255,
        ry: 145,
      },
      {
        faction: "蜀汉" as Faction,
        label: "刘备集团",
        cx: 400,
        cy: 425,
        rx: 110,
        ry: 105,
      },
      {
        faction: "孙吴" as Faction,
        label: "孙吴",
        cx: 725,
        cy: 420,
        rx: 145,
        ry: 110,
      },
    ];
  }
  if (stage <= 44) {
    return [
      {
        faction: "曹魏" as Faction,
        label: "曹魏",
        cx: 585,
        cy: 180,
        rx: 260,
        ry: 145,
      },
      {
        faction: "蜀汉" as Faction,
        label: "蜀汉",
        cx: 355,
        cy: 430,
        rx: 120,
        ry: 120,
      },
      {
        faction: "孙吴" as Faction,
        label: "孙吴",
        cx: 720,
        cy: 425,
        rx: 150,
        ry: 115,
      },
    ];
  }

  return [
    {
      faction: "司马晋" as Faction,
      label: stage === 50 ? "西晋" : "司马氏控制区",
      cx: 555,
      cy: 215,
      rx: 290,
      ry: 175,
    },
    ...(stage < 49
      ? [
          {
            faction: "蜀汉" as Faction,
            label: "蜀汉",
            cx: 350,
            cy: 440,
            rx: 105,
            ry: 105,
          },
        ]
      : []),
    {
      faction: "孙吴" as Faction,
      label: stage === 50 ? "吴地归晋" : "孙吴",
      cx: 725,
      cy: 430,
      rx: 145,
      ry: 112,
    },
  ];
}

export function getCapitalIds(stage: number) {
  if (stage <= 2) return ["luoyang"];
  if (stage <= 9) return ["changan"];
  if (stage <= 34) return ["xuchang", "jianye"];
  if (stage <= 49) return ["luoyang", "chengdu", "jianye"];
  return ["luoyang"];
}

export function getEntitySource(
  type: EntityType,
  id: string,
  source: SourceKey,
) {
  if (type === "person") return personById(id)?.sources[source];
  if (type === "event") return eventById(id)?.sources[source];
  return placeById(id)?.sources[source];
}

export function getEntityTitle(type: EntityType, id: string) {
  if (type === "person") return personById(id)?.name ?? "";
  if (type === "event") return eventById(id)?.name ?? "";
  return placeById(id)?.name ?? "";
}

export function getEntitySummary(type: EntityType, id: string) {
  if (type === "person") return personById(id)?.summary ?? "";
  if (type === "event") return eventById(id)?.summary ?? "";
  return placeById(id)?.summary ?? "";
}

export function getNarration(
  type: EntityType,
  id: string,
): Narration | undefined {
  if (type === "person") {
    const person = personById(id);
    return person
      ? {
          key: `person:${person.id}`,
          src: `/audio/narrations/people/${person.id}.mp3`,
          title: person.name,
        }
      : undefined;
  }
  if (type === "event") {
    const event = eventById(id);
    return event
      ? {
          key: `event:${event.id}`,
          src: `/audio/narrations/events/${event.id}.mp3`,
          title: event.name,
        }
      : undefined;
  }
  return undefined;
}

export function factionClass(faction: Faction) {
  const names: Record<Faction, string> = {
    汉室: "faction-han",
    群雄: "faction-neutral",
    曹魏: "faction-cao",
    蜀汉: "faction-liu",
    孙吴: "faction-wu",
    司马晋: "faction-jin",
  };
  return names[faction];
}

export function buildRoutePath(route: string[]) {
  const points = route
    .map((id) => placeById(id))
    .filter((place): place is Place => Boolean(place))
    .map((place) => `${place.position.x * 10},${place.position.y * 6.2}`);
  return points.length < 2 ? "" : `M ${points.join(" L ")}`;
}

export function buildGraphPositions(visiblePeople: Person[]) {
  const centers: Record<Faction, { x: number; y: number }> = {
    汉室: { x: 18, y: 25 },
    群雄: { x: 22, y: 66 },
    曹魏: { x: 47, y: 27 },
    蜀汉: { x: 47, y: 72 },
    孙吴: { x: 75, y: 64 },
    司马晋: { x: 78, y: 25 },
  };
  const groups = new Map<Faction, Person[]>();
  visiblePeople.forEach((person) => {
    groups.set(person.faction, [...(groups.get(person.faction) ?? []), person]);
  });

  const positions: Record<string, NodePosition> = {};
  groups.forEach((group, faction) => {
    const center = centers[faction];
    group.forEach((person, index) => {
      const angle =
        -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(group.length, 3);
      const radius = group.length === 1 ? 0 : Math.min(11, 5 + group.length * 0.9);
      positions[person.id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius * 0.7,
      };
    });
  });
  return positions;
}

export function buildRelationGeometry(
  from: NodePosition,
  to: NodePosition,
  label: string,
  mapSize: MapSize,
) {
  const x1 = (from.x / 100) * mapSize.width;
  const y1 = (from.y / 100) * mapSize.height;
  const x2 = (to.x / 100) * mapSize.width;
  const y2 = (to.y / 100) * mapSize.height;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const rawAngle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const angle =
    rawAngle > 90 ? rawAngle - 180 : rawAngle < -90 ? rawAngle + 180 : rawAngle;

  return {
    x1,
    y1,
    x2,
    y2,
    midX,
    midY,
    angle,
    labelWidth: Math.max(36, label.length * 9 + 16),
  };
}

export function searchEntities(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const personItems = people.map((person) => ({
    type: "person" as const,
    id: person.id,
    name: person.name,
    meta: `${person.courtesy} · ${person.role}`,
    haystack: [
      person.name,
      person.courtesy,
      person.role,
      ...person.aliases,
    ].join(" "),
  }));
  const eventItems = events.map((event) => ({
    type: "event" as const,
    id: event.id,
    name: event.name,
    meta: `${event.date} · ${event.allusion ?? event.era}`,
    haystack: [
      event.name,
      event.allusion ?? "",
      event.summary,
      event.era,
    ].join(" "),
  }));
  const placeItems = places.map((place) => ({
    type: "place" as const,
    id: place.id,
    name: place.name,
    meta: `${place.modern} · ${place.certainty}`,
    haystack: [place.name, place.modern, ...place.aliases].join(" "),
  }));

  return [...personItems, ...eventItems, ...placeItems]
    .filter((item) => item.haystack.toLowerCase().includes(normalized))
    .slice(0, 10);
}
