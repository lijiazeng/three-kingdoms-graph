"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import Image from "next/image";
import {
  eras,
  eventById,
  events,
  factionLabels,
  moments,
  personById,
  placeById,
  places,
  relations,
  sourceLabels,
  tours,
} from "./sanguoData";
import type {
  EntityType,
  Faction,
  Mode,
  Person,
  Place,
  SourceKey,
} from "./sanguoData";
import {
  battleBriefs,
  buildGraphPositions,
  buildRelationGeometry,
  buildRoutePath,
  clamp,
  constrainMapView,
  factionClass,
  factions,
  getCapitalIds,
  getEntitySource,
  getEntitySummary,
  getEntityTitle,
  getNarration,
  getTerritoryZones,
  INITIAL_MAP_VIEW,
  MAP_SCALE_STEP,
  MAX_MAP_SCALE,
  MIN_MAP_SCALE,
  nodeKey,
  searchEntities,
} from "./sanguoExplorerModel";
import type {
  MapSize,
  MapView,
  NodePosition,
} from "./sanguoExplorerModel";

type NarrationState = "idle" | "loading" | "playing" | "paused" | "error";

type MapDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type NodeDrag = {
  pointerId: number;
  key: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type AnimatedPositionStyle = CSSProperties & {
  "--node-delay": string;
};

const BASE_MAP_LABEL_IDS = new Set([
  "luoyang",
  "changan",
  "ye",
  "xuchang",
  "xuzhou",
  "xiangyang",
  "jiangling",
  "hanzhong",
  "chengdu",
  "hefei",
  "jianye",
  "red-cliffs",
  "baidicheng",
  "qishan",
  "jiange",
]);

const SECONDARY_MAP_LABEL_IDS = new Set([
  "zhuo",
  "puyang",
  "guandu",
  "wancheng",
  "shouchun",
  "xiakou",
  "chaisang",
  "yiling",
  "nanzhong",
  "wuzhangyuan",
]);

const TERTIARY_MAP_LABEL_IDS = new Set([
  "guangzong",
  "hulao",
  "chenliu",
  "xiapi",
  "xinye",
  "changban",
  "fankou",
  "huarong",
  "fucheng",
  "jiameng",
  "jieting",
  "chencang",
  "yinping",
  "langzhong",
]);

type TabIconName = Mode | SourceKey;

const tabIconPaths: Record<TabIconName, string[]> = {
  world: [
    "M3.5 5.2 8 3.5l4 1.7 4.5-1.7v15.3L12 20.5 8 18.8l-4.5 1.7Z",
    "M8 3.5v15.3M12 5.2v15.3",
  ],
  people: [
    "M12 11.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M4.5 20c.7-4.1 3.2-6.1 7.5-6.1s6.8 2 7.5 6.1",
  ],
  events: ["M6 20V4", "M6 5h11l-2.3 3L17 11H6"],
  drama: ["M3.5 5.5h17v12h-17Z", "m10 9.2 5 2.8-5 2.8Z"],
  novel: [
    "M3.5 5.5c3.5-.7 6.1.2 8.5 2v11c-2.4-1.8-5-2.7-8.5-2Z",
    "M20.5 5.5c-3.5-.7-6.1.2-8.5 2v11c2.4-1.8 5-2.7 8.5-2Z",
  ],
  history: ["M5 3.5h14v17H5Z", "M8 7h8M8 11h8M8 15h5"],
};

function TabIcon({ name }: { name: TabIconName }) {
  return (
    <span className="tab-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {tabIconPaths[name].map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </span>
  );
}

function MapEntityIcon({ type }: { type: "place" | "event" }) {
  const paths =
    type === "event"
      ? ["M6 21V4", "M6 5h11l-2.4 3L17 11H6"]
      : [
          "M4 20V9h3V5h3v4h4V5h3v4h3v11",
          "M4 12h16",
          "M9 20v-4h6v4",
        ];

  return (
    <span className={`map-entity-icon ${type}-icon`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    </span>
  );
}

export function SanguoExplorer() {
  const [mode, setMode] = useState<Mode>("world");
  const [stage, setStage] = useState(24);
  const [source, setSource] = useState<SourceKey>("drama");
  const [selected, setSelected] = useState<{ type: EntityType; id: string }>({
    type: "event",
    id: "red-cliffs-battle",
  });
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [factionFilter, setFactionFilter] = useState<Faction | "全部">("全部");
  const [eraFilter, setEraFilter] = useState("全部");
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [tourCursor, setTourCursor] = useState(0);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [mapView, setMapView] = useState<MapView>(INITIAL_MAP_VIEW);
  const [mapSize, setMapSize] = useState<MapSize>({
    width: 1000,
    height: 620,
  });
  const [mapDragging, setMapDragging] = useState(false);
  const [nodePositionOverrides, setNodePositionOverrides] = useState<
    Record<string, NodePosition>
  >({});
  const [draggingNodeKey, setDraggingNodeKey] = useState<string | null>(null);
  const [narrationState, setNarrationState] =
    useState<NarrationState>("idle");
  const [narrationProgress, setNarrationProgress] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const hashReadyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const narrationAudioRef = useRef<HTMLAudioElement>(null);
  const mapCanvasRef = useRef<HTMLDivElement>(null);
  const mapDragRef = useRef<MapDrag | null>(null);
  const nodeDragRef = useRef<NodeDrag | null>(null);
  const suppressMapClickRef = useRef(false);
  const suppressNodeClickRef = useRef<string | null>(null);

  const currentMoment = moments[stage];
  const currentEvent = events[stage];
  const territoryZones = getTerritoryZones(stage);
  const capitalIds = getCapitalIds(stage);
  const battleBrief = battleBriefs[currentEvent.id];
  const selectedPerson =
    selected.type === "person" ? personById(selected.id) : undefined;
  const selectedEvent =
    selected.type === "event" ? eventById(selected.id) : undefined;
  const selectedPlace =
    selected.type === "place" ? placeById(selected.id) : undefined;
  const selectedSource = getEntitySource(selected.type, selected.id, source);
  const currentNarration = getNarration(selected.type, selected.id);
  const activeTour = tours.find((tour) => tour.id === activeTourId);
  const timelinePeople = currentEvent.people
    .slice(0, 2)
    .map((id) => personById(id))
    .filter((person): person is Person => Boolean(person));

  const activeRelations = useMemo(
    () =>
      relations.filter(
        (relation) => stage >= relation.start && stage <= relation.end,
      ),
    [stage],
  );

  const visiblePeople = useMemo(() => {
    const ids = new Set(currentEvent.people);
    activeRelations.forEach((relation) => {
      ids.add(relation.from);
      ids.add(relation.to);
    });
    if (selectedPerson) ids.add(selectedPerson.id);
    return [...ids]
      .map((id) => personById(id))
      .filter((person): person is Person => Boolean(person))
      .filter(
        (person) =>
          factionFilter === "全部" || person.faction === factionFilter,
      )
      .slice(0, 16);
  }, [activeRelations, currentEvent.people, factionFilter, selectedPerson]);

  const graphPositions = useMemo(
    () => buildGraphPositions(visiblePeople),
    [visiblePeople],
  );

  const draggableGraphPositions = useMemo(() => {
    const positions = { ...graphPositions };
    Object.keys(positions).forEach((id) => {
      const override = nodePositionOverrides[nodeKey("person", id)];
      if (override) positions[id] = override;
    });
    return positions;
  }, [graphPositions, nodePositionOverrides]);

  const visibleRelations = useMemo(() => {
    const visibleIds = new Set(visiblePeople.map((person) => person.id));
    return activeRelations.filter(
      (relation) =>
        visibleIds.has(relation.from) && visibleIds.has(relation.to),
    );
  }, [activeRelations, visiblePeople]);

  const visibleEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          Math.abs(event.stage - stage) <= 2 &&
          (eraFilter === "全部" || event.era === eraFilter),
      ),
    [eraFilter, stage],
  );

  const visiblePlaces = useMemo(() => {
    const ids = new Set(visibleEvents.map((event) => event.placeId));
    ids.add(currentEvent.placeId);
    capitalIds.forEach((id) => ids.add(id));
    if (selectedPlace) ids.add(selectedPlace.id);
    selectedPerson?.route.slice(-4).forEach((id) => ids.add(id));
    return [...ids]
      .map((id) => placeById(id))
      .filter((place): place is Place => Boolean(place));
  }, [capitalIds, currentEvent.placeId, selectedPerson, selectedPlace, visibleEvents]);

  const searchItems = useMemo(() => searchEntities(query), [query]);

  useEffect(() => {
    const viewport = timelineViewportRef.current;
    if (!viewport) return;
    const target = stage * 96 - viewport.clientWidth / 2 + 48;
    viewport.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [stage]);

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;

    const updateMapSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setMapSize((current) => {
        if (
          Math.abs(current.width - rect.width) < 0.5 &&
          Math.abs(current.height - rect.height) < 0.5
        ) {
          return current;
        }
        return { width: rect.width, height: rect.height };
      });
    };

    updateMapSize();
    const observer = new ResizeObserver(updateMapSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setFilterOpen(false);
        setTourOpen(false);
        setVideoOpen(false);
        setQuery("");
      }
      if (!searchOpen && !videoOpen && event.key === "ArrowLeft") {
        chooseStage(Math.max(0, stage - 1));
      }
      if (!searchOpen && !videoOpen && event.key === "ArrowRight") {
        chooseStage(Math.min(moments.length - 1, stage + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const hash = window.location.hash.replace(/^#/, "");
      const [hashMode, hashType, hashId, hashStage] = hash.split("/");
      if (hashMode === "world" || hashMode === "people" || hashMode === "events") {
        setMode(hashMode);
      }
      if (
        (hashType === "person" || hashType === "event" || hashType === "place") &&
        hashId
      ) {
        setSelected({ type: hashType, id: hashId });
      }
      if (hashStage && !Number.isNaN(Number(hashStage))) {
        setStage(Math.min(moments.length - 1, Math.max(0, Number(hashStage))));
      }
      hashReadyRef.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hashReadyRef.current) return;
    window.history.replaceState(
      null,
      "",
      `#${mode}/${selected.type}/${selected.id}/${stage}`,
    );
  }, [mode, selected, stage]);

  useEffect(() => {
    if (!tourPlaying || !activeTour) return;
    const timer = window.setInterval(() => {
      setTourCursor((cursor) => {
        const next = cursor + 1;
        if (next >= activeTour.stages.length) {
          setTourPlaying(false);
          return cursor;
        }
        const nextStage = activeTour.stages[next];
        setStage(nextStage);
        setSelected({ type: "event", id: moments[nextStage].eventId });
        setMode("events");
        return next;
      });
    }, 4800);
    return () => window.clearInterval(timer);
  }, [activeTour, tourPlaying]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      narrationAudioRef.current?.pause();
    },
    [],
  );

  useEffect(() => {
    const narration = narrationAudioRef.current;
    narration?.pause();
    if (narration) {
      narration.currentTime = 0;
      narration.load();
    }
    if (audioRef.current) audioRef.current.volume = 0.18;
    const frame = window.requestAnimationFrame(() => {
      setNarrationState("idle");
      setNarrationProgress(0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentNarration?.key]);

  function selectMode(nextMode: Mode) {
    setVideoOpen(false);
    setMode(nextMode);
    setPanelOpen(true);
    if (nextMode === "people") {
      setSelected({ type: "person", id: currentEvent.people[0] ?? "cao-cao" });
      return;
    }
    if (nextMode === "events") {
      setSelected({ type: "event", id: currentEvent.id });
      return;
    }
    setSelected({ type: "place", id: currentEvent.placeId });
  }

  function selectEntity(type: EntityType, id: string) {
    setVideoOpen(false);
    const nextMode: Record<EntityType, Mode> = {
      person: "people",
      event: "events",
      place: "world",
    };
    setMode(nextMode[type]);
    setSelected({ type, id });
    if (type === "event") {
      const event = eventById(id);
      if (event) setStage(event.stage);
    }
    setPanelOpen(true);
  }

  const selectPerson = (id: string) => selectEntity("person", id);
  const selectEvent = (id: string) => selectEntity("event", id);
  const selectPlace = (id: string) => selectEntity("place", id);

  function chooseSearchResult(type: EntityType, id: string) {
    setFactionFilter("全部");
    setEraFilter("全部");
    selectEntity(type, id);
    setSearchOpen(false);
    setQuery("");
  }

  function chooseStage(index: number) {
    setVideoOpen(false);
    setStage(index);
    if (mode === "people") {
      setSelected({ type: "person", id: events[index].people[0] ?? "cao-cao" });
    } else if (mode === "world") {
      setSelected({ type: "place", id: events[index].placeId });
    } else {
      setSelected({ type: "event", id: moments[index].eventId });
    }
  }

  function startTour(id: string) {
    const tour = tours.find((item) => item.id === id);
    if (!tour) return;
    setVideoOpen(false);
    const firstStage = tour.stages[0];
    setActiveTourId(id);
    setTourCursor(0);
    setStage(firstStage);
    setMode("events");
    setSelected({ type: "event", id: moments[firstStage].eventId });
    setTourOpen(false);
    setTourPlaying(true);
  }

  function stepTour(direction: -1 | 1) {
    if (!activeTour) return;
    setVideoOpen(false);
    const cursor = Math.max(
      0,
      Math.min(activeTour.stages.length - 1, tourCursor + direction),
    );
    const nextStage = activeTour.stages[cursor];
    setTourCursor(cursor);
    setStage(nextStage);
    setSelected({ type: "event", id: moments[nextStage].eventId });
  }

  async function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (soundOn) {
      audio.pause();
      setSoundOn(false);
      return;
    }
    audio.volume = narrationState === "playing" ? 0.04 : 0.18;
    try {
      await audio.play();
      setSoundOn(true);
    } catch {
      setSoundOn(false);
    }
  }

  async function toggleNarration() {
    const narration = narrationAudioRef.current;
    if (!narration || !currentNarration) return;

    if (narrationState === "playing") {
      narration.pause();
      setNarrationState("paused");
      if (audioRef.current) audioRef.current.volume = 0.18;
      return;
    }

    setNarrationState("loading");
    if (audioRef.current && soundOn) audioRef.current.volume = 0.04;
    try {
      await narration.play();
      setNarrationState("playing");
    } catch {
      setNarrationState("error");
      if (audioRef.current) audioRef.current.volume = 0.18;
    }
  }

  function handleNarrationTimeUpdate() {
    const narration = narrationAudioRef.current;
    if (!narration || !Number.isFinite(narration.duration)) return;
    setNarrationProgress(
      Math.min(100, (narration.currentTime / narration.duration) * 100),
    );
  }

  function handleNarrationEnded() {
    const narration = narrationAudioRef.current;
    if (narration) narration.currentTime = 0;
    if (audioRef.current) audioRef.current.volume = 0.18;
    setNarrationState("idle");
    setNarrationProgress(0);
  }

  function updateMapScale(
    nextScale: number | ((currentScale: number) => number),
    clientX?: number,
    clientY?: number,
  ) {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const focusX =
      clientX === undefined ? 0 : clientX - rect.left - rect.width / 2;
    const focusY =
      clientY === undefined ? 0 : clientY - rect.top - rect.height / 2;

    setMapView((current) => {
      const requestedScale =
        typeof nextScale === "function"
          ? nextScale(current.scale)
          : nextScale;
      const scale = clamp(requestedScale, MIN_MAP_SCALE, MAX_MAP_SCALE);
      const ratio = scale / current.scale;
      return constrainMapView(
        {
          scale,
          x: focusX - (focusX - current.x) * ratio,
          y: focusY - (focusY - current.y) * ratio,
        },
        rect.width,
        rect.height,
      );
    });
  }

  function resetMapView() {
    setMapView(INITIAL_MAP_VIEW);
    setNodePositionOverrides({});
  }

  function handleMapWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    updateMapScale(
      (currentScale) => currentScale + direction * MAP_SCALE_STEP,
      event.clientX,
      event.clientY,
    );
  }

  function startNodeDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    type: EntityType,
    id: string,
    position: NodePosition,
  ) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const key = nodeKey(type, id);
    nodeDragRef.current = {
      pointerId: event.pointerId,
      key,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
    setDraggingNodeKey(key);
  }

  function handleNodePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > 3) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    const width = Math.max(1, mapSize.width * mapView.scale);
    const height = Math.max(1, mapSize.height * mapView.scale);
    setNodePositionOverrides((current) => ({
      ...current,
      [drag.key]: {
        x: clamp(drag.originX + (deltaX / width) * 100, 4, 96),
        y: clamp(drag.originY + (deltaY / height) * 100, 6, 94),
      },
    }));
  }

  function finishNodeDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = nodeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (drag.moved) {
      suppressNodeClickRef.current = drag.key;
      window.setTimeout(() => {
        if (suppressNodeClickRef.current === drag.key) {
          suppressNodeClickRef.current = null;
        }
      }, 0);
    }
    nodeDragRef.current = null;
    setDraggingNodeKey(null);
  }

  function handleNodeClick(
    event: ReactMouseEvent<HTMLButtonElement>,
    type: EntityType,
    id: string,
    selectNode: () => void,
  ) {
    const key = nodeKey(type, id);
    if (suppressNodeClickRef.current === key) {
      event.preventDefault();
      event.stopPropagation();
      suppressNodeClickRef.current = null;
      return;
    }
    selectNode();
  }

  function handleMapPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "button, .map-zoom-controls, .battle-inset, .map-legend",
      )
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    mapDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: mapView.x,
      originY: mapView.y,
      moved: false,
    };
    setMapDragging(true);
  }

  function handleMapPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > 4) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setMapView((current) =>
      constrainMapView(
        {
          scale: current.scale,
          x: drag.originX + deltaX,
          y: drag.originY + deltaY,
        },
        rect.width,
        rect.height,
      ),
    );
  }

  function finishMapDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    suppressMapClickRef.current = drag.moved;
    mapDragRef.current = null;
    setMapDragging(false);
    window.setTimeout(() => {
      suppressMapClickRef.current = false;
    }, 0);
  }

  function handleMapClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressMapClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressMapClickRef.current = false;
  }

  function handleMapDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "button, .battle-inset, .map-legend, .map-zoom-controls",
      )
    ) {
      return;
    }
    resetMapView();
  }

  const selectedTitle = getEntityTitle(selected.type, selected.id);
  const selectedSummary = getEntitySummary(selected.type, selected.id);
  const selectedBaikeUrl = selectedPerson?.baikeUrl ?? selectedEvent?.baikeUrl;

  function openPersonVideo() {
    if (!selectedPerson?.videoUrl) return;
    const narration = narrationAudioRef.current;
    if (narration && !narration.paused) {
      narration.pause();
      setNarrationState("paused");
    }
    setVideoOpen(true);
  }

  return (
    <main className="sanguo-app">
      <div className="cinematic-backdrop" aria-hidden="true">
        <div className="backdrop-wash" />
        <div className="fog fog-one" />
        <div className="fog fog-two" />
        <div className="vignette" />
      </div>
      <audio
        ref={audioRef}
        src="/audio/three-kingdoms-ambience.mp3"
        loop
        preload="metadata"
      />
      <audio
        ref={narrationAudioRef}
        src={currentNarration?.src}
        preload="metadata"
        onTimeUpdate={handleNarrationTimeUpdate}
        onEnded={handleNarrationEnded}
        onError={() => {
          setNarrationState("error");
          if (audioRef.current) audioRef.current.volume = 0.18;
        }}
      />

      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => {
            setMode("world");
            setStage(0);
            setSelected({ type: "event", id: moments[0].eventId });
          }}
          aria-label="返回三国全史总览"
        >
          <span className="brand-seal" aria-hidden="true">
            <Image
              src="/images/sanguo-wanxiang-logo.png"
              alt=""
              width={44}
              height={44}
              priority
              unoptimized
            />
          </span>
          <span className="brand-copy">
            <strong>三国万象</strong>
            <small>央视 1994 版 · 全史关系图谱 · AI 生成内容</small>
          </span>
        </button>

        <nav className="mode-switcher" aria-label="主要视角">
          {([
            ["world", "天下"],
            ["people", "人物"],
            ["events", "事件"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={mode === value ? "is-active" : ""}
              aria-pressed={mode === value}
              onClick={() => selectMode(value)}
            >
              <TabIcon name={value} />
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <span className="era-stamp">{currentMoment.era} · {currentMoment.date}</span>
          <button
            type="button"
            className="icon-action"
            onClick={() => setTourOpen(true)}
            aria-label="打开专题叙事"
            title="专题叙事"
          >
            <span aria-hidden="true">卷</span>
          </button>
          <button
            type="button"
            className="icon-action"
            onClick={() => setFilterOpen(true)}
            aria-label="打开图谱筛选"
            title="图谱筛选"
          >
            <span aria-hidden="true">筛</span>
          </button>
          <button
            type="button"
            className="icon-action search-action"
            onClick={() => setSearchOpen(true)}
            aria-label="搜索人物、事件与地点"
            title="搜索人物、事件与地点"
          >
            <span className="search-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="5.5" />
                <path d="m15 15 4.5 4.5" />
              </svg>
            </span>
          </button>
          <button
            type="button"
            className={`icon-action sound-action ${soundOn ? "is-on" : ""}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "暂停原创三国氛围音乐" : "播放原创三国氛围音乐"}
            title={soundOn ? "暂停原创三国氛围音乐" : "播放原创三国氛围音乐"}
          >
            <span className="sound-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 9.2h3.4L12 5.5v13l-4.6-3.7H4z" />
                {soundOn ? (
                  <>
                    <path d="M15.1 8.2a5 5 0 0 1 0 7.6" />
                    <path d="M17.7 5.8a8.2 8.2 0 0 1 0 12.4" />
                  </>
                ) : (
                  <path d="m15.5 9 5 6m0-6-5 6" />
                )}
              </svg>
            </span>
          </button>
        </div>
      </header>

      <section className="world-stage" aria-label="汉末三国天下画布">
        <div
          key={currentMoment.id}
          className="scene-intro"
          aria-live="polite"
        >
          <div className="eyebrow">
            <span>{currentMoment.era}</span><i /><span>{currentMoment.focalPlace}</span>
          </div>
          <h1>{currentMoment.title}</h1>
          <p>{currentMoment.summary}</p>
        </div>

        <div
          ref={mapCanvasRef}
          className={`map-canvas mode-${mode} ${panelOpen ? "panel-open" : ""} ${
            mapDragging ? "is-dragging" : ""
          }`}
          onWheel={handleMapWheel}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={finishMapDrag}
          onPointerCancel={finishMapDrag}
          onClickCapture={handleMapClickCapture}
          onDoubleClick={handleMapDoubleClick}
          role="region"
          aria-label="可缩放、可拖拽的汉末三国历史地图"
        >
          <div
            className="map-transform-layer"
            style={{
              transform: `translate3d(${mapView.x}px, ${mapView.y}px, 0) scale(${mapView.scale})`,
            }}
          >
            <Image
              src="/images/three-kingdoms-world.webp"
              alt=""
              fill
              priority
              unoptimized
              sizes="100vw"
              className="historical-map-image"
            />
            <div className="historical-map-wash" aria-hidden="true" />
            <svg
              className="cartography"
              viewBox="0 0 1000 620"
              role="img"
              aria-label="汉末三国历史地理示意图，争议地点以虚线标记"
            >
              {mode === "world" &&
                territoryZones.map((zone) => (
                  <g
                    className={`territory-zone ${factionClass(zone.faction)}`}
                    key={`${stage}-${zone.faction}-${zone.label}`}
                  >
                    <ellipse
                      cx={zone.cx}
                      cy={zone.cy}
                      rx={zone.rx}
                      ry={zone.ry}
                    />
                    <text x={zone.cx} y={zone.cy}>{zone.label}</text>
                  </g>
                ))}
              {mode === "people" && selectedPerson && (
                <path className="person-route" d={buildRoutePath(selectedPerson.route)} />
              )}
            </svg>

            <div
              className={`historical-place-label-layer ${
                mapView.scale >= 1.2 ? "show-detail-labels" : ""
              }`}
              aria-hidden="true"
            >
              {places.map((place) => {
                const hasWorldMarker =
                  mode === "world" &&
                  visiblePlaces.some((visiblePlace) => visiblePlace.id === place.id);
                if (hasWorldMarker) return null;
                const isCapital = capitalIds.includes(place.id);
                const isMajor = isCapital || BASE_MAP_LABEL_IDS.has(place.id);
                const isSecondary = SECONDARY_MAP_LABEL_IDS.has(place.id);
                const isTertiary = TERTIARY_MAP_LABEL_IDS.has(place.id);
                return (
                  <span
                    key={place.id}
                    className={`historical-place-label ${
                      isMajor
                        ? "is-major"
                        : isSecondary
                          ? "is-secondary"
                          : isTertiary
                            ? "is-tertiary"
                            : "is-minor"
                    } ${isCapital ? "is-capital-label" : ""}`}
                    style={{
                      left: `${place.position.x}%`,
                      top: `${place.position.y}%`,
                    }}
                  >
                    {place.name}
                  </span>
                );
              })}
            </div>

            {mode === "people" && (
              <svg
                className="relation-network"
                viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {visibleRelations.map((relation) => {
                  const from = draggableGraphPositions[relation.from];
                  const to = draggableGraphPositions[relation.to];
                  if (!from || !to) return null;
                  const geometry = buildRelationGeometry(
                    from,
                    to,
                    relation.label,
                    mapSize,
                  );
                  const isFocused =
                    !selectedPerson ||
                    relation.from === selectedPerson.id ||
                    relation.to === selectedPerson.id;
                  return (
                    <g
                      className={`relation-line relation-${relation.type} source-${relation.source} ${
                        isFocused ? "is-focused" : "is-dimmed"
                      }`}
                      data-from={relation.from}
                      data-to={relation.to}
                      key={`${relation.from}-${relation.to}-${relation.label}`}
                    >
                      <line
                        className="relation-halo"
                        x1={geometry.x1}
                        y1={geometry.y1}
                        x2={geometry.x2}
                        y2={geometry.y2}
                      />
                      <line
                        className="relation-stroke"
                        x1={geometry.x1}
                        y1={geometry.y1}
                        x2={geometry.x2}
                        y2={geometry.y2}
                      />
                      <circle
                        className="relation-endpoint"
                        cx={geometry.x1}
                        cy={geometry.y1}
                        r="2.2"
                      />
                      <circle
                        className="relation-endpoint"
                        cx={geometry.x2}
                        cy={geometry.y2}
                        r="2.2"
                      />
                      <g
                        className="relation-label"
                        transform={`translate(${geometry.midX} ${geometry.midY}) rotate(${geometry.angle})`}
                      >
                        <rect
                          x={-geometry.labelWidth / 2}
                          y="-9"
                          width={geometry.labelWidth}
                          height="18"
                          rx="9"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          y="0.5"
                        >
                          {relation.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            )}

          {mode === "world" &&
            visiblePlaces.map((place, index) => {
              const key = nodeKey("place", place.id);
              const position =
                nodePositionOverrides[key] ?? place.position;
              return (
                <button
                  key={place.id}
                  type="button"
                  data-node-key={key}
                  className={`map-marker certainty-${place.certainty} ${
                    selected.type === "place" && selected.id === place.id ? "is-selected" : ""
                  } ${capitalIds.includes(place.id) ? "is-capital" : ""} ${
                    draggingNodeKey === key ? "is-node-dragging" : ""
                  }`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    "--node-delay": `${Math.min(index, 8) * 45}ms`,
                  } as AnimatedPositionStyle}
                  onPointerDown={(event) =>
                    startNodeDrag(event, "place", place.id, position)
                  }
                  onPointerMove={handleNodePointerMove}
                  onPointerUp={finishNodeDrag}
                  onPointerCancel={finishNodeDrag}
                  onClick={(event) =>
                    handleNodeClick(event, "place", place.id, () =>
                      selectPlace(place.id),
                    )
                  }
                  aria-label={`${place.name}，${place.modern}，${place.certainty}，可拖动`}
                >
                  <MapEntityIcon type="place" />
                  <span className="marker-label"><strong>{place.name}</strong><small>{place.certainty}</small></span>
                </button>
              );
            })}

          {mode === "people" &&
            visiblePeople.map((person, index) => {
              const key = nodeKey("person", person.id);
              const position = draggableGraphPositions[person.id];
              return (
                <button
                  key={person.id}
                  type="button"
                  data-node-key={key}
                  data-person-id={person.id}
                  className={`person-node ${factionClass(person.faction)} ${
                    selected.type === "person" && selected.id === person.id ? "is-selected" : ""
                  } ${draggingNodeKey === key ? "is-node-dragging" : ""}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    "--node-delay": `${Math.min(index, 10) * 42}ms`,
                  } as AnimatedPositionStyle}
                  onPointerDown={(event) =>
                    startNodeDrag(event, "person", person.id, position)
                  }
                  onPointerMove={handleNodePointerMove}
                  onPointerUp={finishNodeDrag}
                  onPointerCancel={finishNodeDrag}
                  onClick={(event) =>
                    handleNodeClick(event, "person", person.id, () =>
                      selectPerson(person.id),
                    )
                  }
                  aria-label={`${person.name}，${person.role}，可拖动`}
                >
                  <span className="node-silhouette" aria-hidden="true">
                    <span
                      className="node-silhouette-art"
                      style={{ WebkitMaskImage: `url(${person.silhouette})`, maskImage: `url(${person.silhouette})` }}
                    />
                  </span>
                  <span className="node-copy"><strong>{person.name}</strong><small>{factionLabels[person.faction]}</small></span>
                </button>
              );
            })}

          {mode === "events" &&
            visibleEvents.map((event, index) => {
              const key = nodeKey("event", event.id);
              const position =
                nodePositionOverrides[key] ?? event.position;
              return (
                <button
                  key={event.id}
                  type="button"
                  data-node-key={key}
                  className={`event-marker ${
                    selected.type === "event" && selected.id === event.id ? "is-selected" : ""
                  } ${event.stage < stage ? "is-past" : ""} ${
                    event.stage > stage ? "is-future" : ""
                  } ${draggingNodeKey === key ? "is-node-dragging" : ""}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    "--node-delay": `${Math.min(index, 6) * 55}ms`,
                  } as AnimatedPositionStyle}
                  onPointerDown={(pointerEvent) =>
                    startNodeDrag(
                      pointerEvent,
                      "event",
                      event.id,
                      position,
                    )
                  }
                  onPointerMove={handleNodePointerMove}
                  onPointerUp={finishNodeDrag}
                  onPointerCancel={finishNodeDrag}
                  onClick={(clickEvent) =>
                    handleNodeClick(clickEvent, "event", event.id, () =>
                      selectEvent(event.id),
                    )
                  }
                  aria-label={`${event.name}，${event.date}，可拖动`}
                >
                  <MapEntityIcon type="event" />
                  <span className="event-label"><strong>{event.name}</strong>{event.allusion && <small>{event.allusion}</small>}</span>
                </button>
              );
            })}
          </div>

          {mode === "events" && battleBrief && (
            <section className="battle-inset" aria-label={`${battleBrief.title}局部战役图`}>
              <header>
                <div><small>局部战役图</small><strong>{battleBrief.title}</strong></div>
                <span>{battleBrief.terrain}</span>
              </header>
              <div className="battle-sides">{battleBrief.sides}</div>
              <div className="battle-flow">
                {battleBrief.steps.map((step, index) => (
                  <div key={step}>
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    <span>{step}</span>
                    {index < battleBrief.steps.length - 1 && <b aria-hidden="true">›</b>}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="map-zoom-controls" aria-label="地图缩放控制">
            <button
              type="button"
              onClick={() =>
                updateMapScale(
                  (currentScale) => currentScale + MAP_SCALE_STEP,
                )
              }
              disabled={mapView.scale >= MAX_MAP_SCALE}
              aria-label="放大地图"
              title="放大地图"
            >
              +
            </button>
            <output aria-live="polite">{Math.round(mapView.scale * 100)}%</output>
            <button
              type="button"
              onClick={() =>
                updateMapScale(
                  (currentScale) => currentScale - MAP_SCALE_STEP,
                )
              }
              disabled={mapView.scale <= MIN_MAP_SCALE}
              aria-label="缩小地图"
              title="缩小地图"
            >
              −
            </button>
            <button
              type="button"
              className="map-reset"
              onClick={resetMapView}
              disabled={
                mapView.scale === MIN_MAP_SCALE &&
                mapView.x === 0 &&
                mapView.y === 0 &&
                Object.keys(nodePositionOverrides).length === 0
              }
              aria-label="复位地图与图谱节点"
              title="复位地图与图谱节点"
            >
              ◎
            </button>
          </div>

          <div className="map-legend">
            <span><i className="legend-dot certain" />考证位置</span>
            <span><i className="legend-dot uncertain" />争议范围</span>
            {mode === "world" && (
              <><span><i className="legend-zone" />势力范围示意</span><span><i className="legend-capital" />政权中心</span></>
            )}
            {mode === "people" && (
              <><span><i className="legend-line history" />史载关系</span><span><i className="legend-line novel" />演义关系</span></>
            )}
          </div>
        </div>

        <aside className={`detail-panel ${panelOpen ? "is-open" : "is-closed"}`}>
          <div
            key={`${selected.type}-${selected.id}`}
            className={`detail-scroll ${selectedPerson || selectedEvent || selectedPlace ? "has-media" : ""}`}
          >
            {selectedEvent && (
              <div className="event-image-frame">
                <Image
                  src={selectedEvent.image}
                  alt={`${selectedEvent.name}原创事件场景图`}
                  fill
                  unoptimized
                  sizes="390px"
                />
                <span className="ai-media-label">AI 生成图像</span>
              </div>
            )}

            {selectedPlace && (
              <div className="event-image-frame place-image-frame">
                <Image
                  src={selectedPlace.image}
                  alt={`${selectedPlace.name}原创历史地点场景图`}
                  fill
                  unoptimized
                  sizes="390px"
                />
                <span className="ai-media-label">AI 生成图像</span>
              </div>
            )}

            {!selectedPerson && (
              <div className="detail-type-row">
                <span className="detail-type">{selected.type === "event" ? "事件" : "地点"}</span>
                {selectedPlace && <span className={`certainty-badge certainty-${selectedPlace.certainty}`}>{selectedPlace.certainty}</span>}
                {selectedEvent?.allusion && <span className="allusion-badge">典故</span>}
              </div>
            )}

            {selectedPerson && (
              <div className="portrait-frame">
                <Image
                  src={selectedPerson.portrait}
                  alt={`${selectedPerson.name}原创人物画像`}
                  fill
                  unoptimized
                  sizes="390px"
                />
                <span className="ai-media-label">AI 生成图像</span>
              </div>
            )}

            <div className="detail-heading">
              <p className="detail-kicker">{selectedPerson?.role ?? selectedPlace?.modern ?? selectedEvent?.date}</p>
              <div className="detail-title-row">
                <h2>{selectedTitle}</h2>
                {currentNarration && (
                  <button
                    type="button"
                    className="narration-button"
                    data-state={narrationState}
                    onClick={toggleNarration}
                    aria-pressed={narrationState === "playing"}
                    aria-label={`${
                      narrationState === "playing" ? "暂停" : "播放"
                    }${currentNarration.title}语音讲解`}
                    title={`${
                      narrationState === "playing" ? "暂停" : "播放"
                    }${currentNarration.title}语音讲解`}
                    style={{
                      "--narration-progress": `${narrationProgress}%`,
                    } as CSSProperties}
                  >
                    {narrationState === "loading" ? (
                      <svg
                        className="narration-spinner"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                    ) : narrationState === "playing" ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7.5 6.5h3v11h-3zM13.5 6.5h3v11h-3z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M5 9.2h3.2l4.3-3.5v12.6l-4.3-3.5H5z" />
                        <path
                          className="narration-wave"
                          d="M15.2 9.1a4.2 4.2 0 0 1 0 5.8M17.8 6.8a7.4 7.4 0 0 1 0 10.4"
                        />
                      </svg>
                    )}
                    <span>
                      {narrationState === "error"
                        ? "重试"
                        : narrationState === "playing"
                          ? "暂停"
                          : "AI讲解"}
                    </span>
                  </button>
                )}
                {selectedPerson?.videoUrl && (
                  <button
                    type="button"
                    className="narration-button entity-video-button"
                    onClick={openPersonVideo}
                    aria-label={`播放${selectedPerson.name}秒懂历史视频`}
                    title={`播放${selectedPerson.name}秒懂历史视频`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 5.5v13l11-6.5Z" />
                    </svg>
                    <span>视频</span>
                  </button>
                )}
              </div>
              {selectedPerson && <p className="courtesy">{selectedPerson.courtesy} · {factionLabels[selectedPerson.faction]}</p>}
            </div>
            <p className="detail-summary">
              {selectedSummary}
              {selectedBaikeUrl && (
                <a
                  className="detail-baike-link"
                  href={selectedBaikeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`在百度百科查看${selectedTitle}`}
                  title={`在百度百科查看${selectedTitle}`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9.5 14.5 14.5 9.5" />
                    <path d="M7.2 16.8 5.7 18.3a3.2 3.2 0 0 1-4.5-4.5l4-4a3.2 3.2 0 0 1 4.5 0" />
                    <path d="m16.8 7.2 1.5-1.5a3.2 3.2 0 1 1 4.5 4.5l-4 4a3.2 3.2 0 0 1-4.5 0" />
                  </svg>
                </a>
              )}
            </p>

            {selectedEvent && <div className="event-outcome"><span>结果</span><p>{selectedEvent.outcome}</p></div>}
            {selectedPerson && (
              <div className="route-summary">
                <span>行动路线</span>
                <p>{selectedPerson.route.map((id) => placeById(id)?.name ?? id).join(" → ")}</p>
              </div>
            )}

            <div className="source-section">
              <div className="section-label"><span>三重叙事</span></div>
              <div className="source-tabs" role="tablist" aria-label="来源对照">
                {(["drama", "novel", "history"] as SourceKey[]).map((sourceKey) => (
                  <button
                    type="button"
                    key={sourceKey}
                    role="tab"
                    aria-selected={source === sourceKey}
                    className={source === sourceKey ? "is-active" : ""}
                    onClick={() => setSource(sourceKey)}
                  >
                    <TabIcon name={sourceKey} />
                    <span className="tab-label">{sourceLabels[sourceKey]}</span>
                  </button>
                ))}
              </div>
              {selectedSource && (
                <div className="source-note" role="tabpanel">
                  <h3>{selectedSource.title}</h3><p>{selectedSource.body}</p>
                  <footer><span>出处</span>{selectedSource.cite}</footer>
                </div>
              )}
            </div>

            {selectedEvent && (
              <div className="related-section">
                <div className="section-label"><span>关键人物</span></div>
                <div className="related-pills">
                  {selectedEvent.people.map((id) => {
                    const person = personById(id);
                    return person ? (
                      <button type="button" key={id} onClick={() => selectPerson(id)}>
                        <i className={factionClass(person.faction)} />{person.name}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {selectedPerson && (
              <div className="related-section">
                <div className="section-label"><span>相关事件</span></div>
                <div className="related-pills">
                  {events.filter((event) => event.people.includes(selectedPerson.id)).map((event) => (
                    <button type="button" key={event.id} onClick={() => selectEvent(event.id)}>{event.name}</button>
                  ))}
                </div>
              </div>
            )}

            {selectedPlace && (
              <div className="related-section">
                <div className="section-label"><span>发生于此</span></div>
                <div className="related-pills">
                  {events.filter((event) => event.placeId === selectedPlace.id).map((event) => (
                    <button type="button" key={event.id} onClick={() => selectEvent(event.id)}>{event.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <button
          type="button"
          className={`panel-toggle ${panelOpen ? "is-open" : "is-closed"}`}
          onClick={() => setPanelOpen((value) => !value)}
          aria-label={panelOpen ? "收起详情" : "展开详情"}
          title={panelOpen ? "收起详情" : "展开详情"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M15 3v18" />
            {panelOpen ? (
              <path d="m8.5 9 3 3-3 3" />
            ) : (
              <path d="m11.5 9-3 3 3 3" />
            )}
          </svg>
        </button>
      </section>

      {activeTour && (
        <section className="tour-player" aria-label="沉浸式专题导览">
          <div><small>正在导览</small><strong>{activeTour.title}</strong><span>{tourCursor + 1} / {activeTour.stages.length}</span></div>
          <button type="button" onClick={() => stepTour(-1)} disabled={tourCursor === 0}>‹</button>
          <button type="button" className="tour-play" onClick={() => setTourPlaying((value) => !value)}>{tourPlaying ? "暂停" : "继续"}</button>
          <button type="button" onClick={() => stepTour(1)} disabled={tourCursor === activeTour.stages.length - 1}>›</button>
          <button type="button" className="tour-close" onClick={() => { setActiveTourId(null); setTourPlaying(false); }}>结束</button>
        </section>
      )}

      <section className="timeline-shell" aria-label="三国全史事件时间轴">
        <div className="timeline-ornament timeline-ornament-left" aria-hidden="true">
          <i /><i /><i />
        </div>
        <div className="timeline-ornament timeline-ornament-right" aria-hidden="true">
          <i /><i /><i />
        </div>
        {timelinePeople.map((person, index) => (
          <span
            key={`${currentEvent.id}-${person.id}`}
            className={`timeline-figure timeline-figure-${index + 1}`}
            style={{
              WebkitMaskImage: `url(${person.silhouette})`,
              maskImage: `url(${person.silhouette})`,
            }}
            aria-hidden="true"
          />
        ))}
        <button type="button" className="timeline-arrow" onClick={() => chooseStage(Math.max(0, stage - 1))} disabled={stage === 0} aria-label="上一个时刻">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m11 6-6 6 6 6" />
          </svg>
        </button>
        <div className="timeline-viewport" ref={timelineViewportRef}>
          <div
            className="timeline-track"
            style={{ "--timeline-count": moments.length, "--timeline-stage": stage } as CSSProperties}
          >
            <div className="timeline-progress" />
            {moments.map((moment, index) => (
              <button
                type="button"
                key={moment.id}
                className={`${index === stage ? "is-active" : ""} ${index < stage ? "is-past" : ""}`}
                onClick={() => chooseStage(index)}
                aria-current={index === stage ? "step" : undefined}
                aria-label={`${moment.title}，${moment.date}`}
              >
                <span className="timeline-dot" />
                <span className="timeline-label"><strong>{moment.title}</strong></span>
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="timeline-arrow" onClick={() => chooseStage(Math.min(moments.length - 1, stage + 1))} disabled={stage === moments.length - 1} aria-label="下一个时刻">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </section>

      {videoOpen && selectedPerson?.videoUrl && (
        <div
          className="video-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedPerson.name}秒懂历史视频`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setVideoOpen(false);
          }}
        >
          <section className="video-dialog">
            <header>
              <div>
                <small>百度百科 · 秒懂历史</small>
                <h2>{selectedPerson.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                aria-label="关闭视频"
                title="关闭视频"
              >
                ×
              </button>
            </header>
            <div className="video-embed">
              <iframe
                key={selectedPerson.videoUrl}
                src={selectedPerson.videoUrl}
                title={`${selectedPerson.name}秒懂历史视频`}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-forms allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>
            <footer>
              <span>视频内容由百度百科提供</span>
              <a
                href={selectedPerson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                新窗口打开 ↗
              </a>
            </footer>
          </section>
        </div>
      )}

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="全局搜索" onMouseDown={(event) => {
          if (event.currentTarget === event.target) { setSearchOpen(false); setQuery(""); }
        }}>
          <div className="search-dialog">
            <div className="search-input-wrap"><span aria-hidden="true">⌕</span>
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索人物、字号、势力、典故、古今地名…" aria-label="搜索" />
              <button type="button" onClick={() => { setSearchOpen(false); setQuery(""); }}>ESC</button>
            </div>
            <div className="search-results">
              {!query && <div className="search-empty"><span>试试搜索</span><div>{["孔明", "官渡", "空城计", "五丈原"].map((term) => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}</div></div>}
              {query && searchItems.length === 0 && <p className="no-results">全史图谱中暂未找到“{query}”</p>}
              {searchItems.map((item) => (
                <button type="button" key={`${item.type}-${item.id}`} className="search-result" onClick={() => chooseSearchResult(item.type, item.id)}>
                  <span className={`result-type type-${item.type}`}>{item.type === "person" ? "人" : item.type === "event" ? "事" : "地"}</span>
                  <span><strong>{item.name}</strong><small>{item.meta}</small></span><i aria-hidden="true">↗</i>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {filterOpen && (
        <div className="drawer-overlay" role="dialog" aria-modal="true" aria-label="筛选图谱" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setFilterOpen(false);
        }}>
          <section className="drawer-panel">
            <header><div><small>收束天下</small><h2>筛选图谱</h2></div><button type="button" onClick={() => setFilterOpen(false)}>×</button></header>
            <div className="filter-group"><span>势力</span><div className="filter-pills">
              {(["全部", ...factions] as const).map((faction) => <button type="button" key={faction} className={factionFilter === faction ? "is-active" : ""} onClick={() => setFactionFilter(faction)}>{faction}</button>)}
            </div></div>
            <div className="filter-group"><span>历史阶段</span><div className="filter-pills">
              {["全部", ...eras].map((era) => <button type="button" key={era} className={eraFilter === era ? "is-active" : ""} onClick={() => setEraFilter(era)}>{era}</button>)}
            </div></div>
            <footer><button type="button" onClick={() => { setFactionFilter("全部"); setEraFilter("全部"); }}>恢复全部</button><button type="button" className="primary" onClick={() => setFilterOpen(false)}>应用筛选</button></footer>
          </section>
        </div>
      )}

      {tourOpen && (
        <div className="drawer-overlay" role="dialog" aria-modal="true" aria-label="专题叙事" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setTourOpen(false);
        }}>
          <section className="drawer-panel tour-library">
            <header><div><small>沿一条线进入历史</small><h2>专题叙事</h2></div><button type="button" onClick={() => setTourOpen(false)}>×</button></header>
            <div className="tour-list">
              {tours.map((tour, index) => (
                <button type="button" key={tour.id} onClick={() => startTour(tour.id)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{tour.title}</strong><small>{tour.subtitle}</small></div>
                  <i>进入导览 ›</i>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
