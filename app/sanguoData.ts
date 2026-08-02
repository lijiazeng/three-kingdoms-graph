export type Mode = "world" | "people" | "events";
export type SourceKey = "drama" | "novel" | "history";
export type EntityType = "person" | "event" | "place";
export type Faction = "汉室" | "群雄" | "曹魏" | "蜀汉" | "孙吴" | "司马晋";

export type SourceNote = {
  title: string;
  body: string;
  cite: string;
};

export type Person = {
  id: string;
  name: string;
  courtesy: string;
  faction: Faction;
  role: string;
  summary: string;
  aliases: string[];
  portrait: string;
  silhouette: string;
  route: string[];
  baikeUrl?: string;
  videoUrl?: string;
  sources: Record<SourceKey, SourceNote>;
};

export type StoryEvent = {
  id: string;
  name: string;
  image: string;
  stage: number;
  date: string;
  era: string;
  placeId: string;
  people: string[];
  summary: string;
  outcome: string;
  allusion?: string;
  baikeUrl?: string;
  position: { x: number; y: number };
  sources: Record<SourceKey, SourceNote>;
};

export type Place = {
  id: string;
  name: string;
  image: string;
  modern: string;
  certainty: "较明确" | "约定位置" | "存在争议";
  position: { x: number; y: number };
  summary: string;
  aliases: string[];
  sources: Record<SourceKey, SourceNote>;
};

export type Moment = {
  id: string;
  title: string;
  date: string;
  era: string;
  eventId: string;
  summary: string;
  focalPlace: string;
};

export type Relation = {
  from: string;
  to: string;
  label: string;
  type: "alliance" | "command" | "rivalry" | "hostile" | "debt" | "kinship";
  start: number;
  end: number;
  source: SourceKey;
};

export const sourceLabels: Record<SourceKey, string> = {
  drama: "电视剧",
  novel: "原著",
  history: "正史",
};

export const factionLabels: Record<Faction, string> = {
  汉室: "汉室",
  群雄: "群雄",
  曹魏: "曹魏",
  蜀汉: "蜀汉",
  孙吴: "孙吴",
  司马晋: "司马晋",
};

type PersonSeed = Omit<Person, "portrait" | "silhouette" | "sources"> & {
  screen: string;
  novel: string;
  history: string;
  historyCite?: string;
};

const INTRODUCTION_MIN_LENGTH = 50;
const INTRODUCTION_MAX_LENGTH = 100;

function textLength(value: string) {
  return Array.from(value).length;
}

function makeBoundedIntroduction(parts: string[]) {
  const normalized = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  let introduction = "";

  for (const part of normalized) {
    if (textLength(introduction) >= INTRODUCTION_MIN_LENGTH) break;
    introduction += part;
  }

  if (textLength(introduction) < INTRODUCTION_MIN_LENGTH) {
    introduction += "其经历既推动局势变化，也折射出汉末三国时代人物选择与政治格局之间的复杂关系。";
  }

  if (textLength(introduction) <= INTRODUCTION_MAX_LENGTH) {
    return introduction;
  }

  const shortened = Array.from(introduction)
    .slice(0, INTRODUCTION_MAX_LENGTH - 1)
    .join("")
    .replace(/[，、；：]+$/u, "");
  return `${shortened}。`;
}

function baikeItemUrl(itemName: string) {
  return `https://baike.baidu.com/item/${encodeURIComponent(itemName)}`;
}

function makePerson(seed: PersonSeed): Person {
  return {
    ...seed,
    summary: makeBoundedIntroduction([
      seed.summary,
      seed.history,
      seed.screen,
    ]),
    portrait: `/images/portraits/${seed.id}.webp`,
    silhouette: `/images/silhouettes/${seed.id}.png`,
    sources: {
      drama: {
        title: "荧屏形象",
        body: seed.screen,
        cite: "央视 1994 年版《三国演义》相关段落",
      },
      novel: {
        title: "原著塑造",
        body: seed.novel,
        cite: "罗贯中《三国演义》相关回目",
      },
      history: {
        title: "史传轮廓",
        body: seed.history,
        cite: seed.historyCite ?? "陈寿《三国志》相关本传及裴松之注",
      },
    },
  };
}

const personSeeds: PersonSeed[] = [
  {
    id: "han-xiandi",
    name: "汉献帝",
    courtesy: "名 协",
    faction: "汉室",
    role: "东汉末代皇帝",
    summary: "乱世名义上的天下共主，在董卓与曹操先后控制下辗转，禅位标志汉室终结。",
    aliases: ["刘协", "献帝", "山阳公"],
    route: ["luoyang", "changan", "xuchang", "luoyang"],
    screen: "电视剧以颠沛、受制与衣带诏等场面表现皇权衰微。",
    novel: "原著强化其悲剧处境，使汉室正统成为群雄行动的重要道德坐标。",
    history: "即位、迁都、许都受制和禅让曹丕均有明确史载。",
    historyCite: "《后汉书·孝献帝纪》；《三国志·魏书·文帝纪》",
  },
  {
    id: "he-jin",
    name: "何进",
    courtesy: "字 遂高",
    faction: "汉室",
    role: "大将军",
    summary: "为清除宦官召外兵入京，却先被诛杀，直接打开董卓控制洛阳的缺口。",
    aliases: ["何大将军"],
    route: ["luoyang"],
    screen: "作为洛阳政变的触发者出现，决断迟疑加速朝局崩解。",
    novel: "原著把召董卓进京写成致命误判。",
    history: "与袁绍谋诛宦官、遇害及京师兵变皆有史载。",
  },
  {
    id: "dong-zhuo",
    name: "董卓",
    courtesy: "字 仲颖",
    faction: "群雄",
    role: "太师 · 凉州军阀",
    summary: "乘京师之乱掌握朝廷，废立天子、迁都长安，成为群雄联合讨伐的对象。",
    aliases: ["董太师"],
    route: ["luoyang", "hulao", "changan"],
    screen: "电视剧以强暴、猜忌与权势塑造乱世暴政的中心。",
    novel: "文学形象极端化，承担开篇首位共同敌人的功能。",
    history: "入京、废少帝、迁都和被吕布所杀均有史实骨架。",
    historyCite: "《后汉书·董卓列传》；《三国志·魏书·董卓传》",
  },
  {
    id: "lu-bu",
    name: "吕布",
    courtesy: "字 奉先",
    faction: "群雄",
    role: "飞将 · 割据诸侯",
    summary: "武勇冠绝而政治反复，先杀董卓，后辗转兖徐，最终殒命白门楼。",
    aliases: ["奉先", "温侯", "飞将"],
    route: ["luoyang", "changan", "puyang", "xiapi"],
    screen: "电视剧把绝伦武艺、反复选择与白门楼结局连成完整悲剧。",
    novel: "三英战吕布与辕门射戟极大放大其勇武。",
    history: "反复依附诸侯、诛董卓和下邳败亡有详细传记。",
  },
  {
    id: "diaochan",
    name: "貂蝉",
    courtesy: "无载",
    faction: "群雄",
    role: "连环计核心人物",
    summary: "王允连环计中的关键人物，以个人选择介入董卓与吕布的权力裂痕。",
    aliases: ["任红昌"],
    route: ["changan"],
    screen: "电视剧赋予她克制、牺牲与主动承担，使其不只是计谋工具。",
    novel: "原著以貂蝉离间董卓、吕布，完成连环计的情感机关。",
    history: "正史没有貂蝉之名，仅记吕布与董卓侍婢私通并心怀不安。",
    historyCite: "《三国志·魏书·吕布传》",
  },
  {
    id: "wang-yun",
    name: "王允",
    courtesy: "字 子师",
    faction: "汉室",
    role: "司徒",
    summary: "策动吕布诛杀董卓，却未能稳定长安政局，旋即败亡。",
    aliases: ["王司徒"],
    route: ["luoyang", "changan"],
    screen: "电视剧突出其忍辱布局与诛董后的短暂昂扬。",
    novel: "连环计使其成为以弱制强的谋臣代表。",
    history: "联合吕布诛卓属实；以貂蝉实施连环计则为文学重构。",
  },
  {
    id: "yuan-shao",
    name: "袁绍",
    courtesy: "字 本初",
    faction: "群雄",
    role: "河北霸主",
    summary: "四世三公之后，曾居诸侯盟主，统一河北后在官渡败于曹操。",
    aliases: ["本初", "袁盟主"],
    route: ["luoyang", "hulao", "ye", "guandu"],
    screen: "电视剧以门第、声望与多谋少决构成其盛衰。",
    novel: "原著强化优柔寡断，与曹操的果决形成鲜明对照。",
    history: "据河北四州、官渡败北与死后诸子内争均有明确记载。",
  },
  {
    id: "yuan-shu",
    name: "袁术",
    courtesy: "字 公路",
    faction: "群雄",
    role: "淮南割据者",
    summary: "据淮南称帝，因政治孤立与军事失败迅速衰亡。",
    aliases: ["公路", "仲家皇帝"],
    route: ["luoyang", "hulao", "shouchun"],
    screen: "电视剧以僭号称帝表现名分与实力错位。",
    novel: "传国玉玺成为其野心的戏剧象征。",
    history: "建号仲氏、称帝及败亡均有史载。",
  },
  {
    id: "gongsun-zan",
    name: "公孙瓒",
    courtesy: "字 伯圭",
    faction: "群雄",
    role: "幽州军阀",
    summary: "以白马义从闻名，曾与袁绍争夺河北，最终败亡易京。",
    aliases: ["伯圭", "白马将军"],
    route: ["hulao", "ye"],
    screen: "主要作为刘备早年依托与诸侯会盟成员出现。",
    novel: "原著借其引出赵云并连接桃园群体与诸侯战场。",
    history: "长期经营幽州、与袁绍战争及易京败亡有载。",
  },
  {
    id: "liu-biao",
    name: "刘表",
    courtesy: "字 景升",
    faction: "群雄",
    role: "荆州牧",
    summary: "坐镇荆州多年，为刘备提供暂居空间，其死后荆州迅速卷入曹孙刘争夺。",
    aliases: ["景升", "刘荆州"],
    route: ["xiangyang"],
    screen: "电视剧突出其守成与继嗣难题。",
    novel: "荆州内争为三顾茅庐和赤壁前奏提供政治背景。",
    history: "单骑入荆州、保境多年及死后刘琮降曹均有史载。",
  },
  {
    id: "liu-zhang",
    name: "刘璋",
    courtesy: "字 季玉",
    faction: "群雄",
    role: "益州牧",
    summary: "以刘备入川抵御张鲁，最终失去益州。",
    aliases: ["季玉"],
    route: ["chengdu", "fucheng"],
    screen: "电视剧把其宽弱与益州内部离心并置。",
    novel: "以同宗相让与反客为主形成刘备入蜀的伦理张力。",
    history: "邀请刘备入蜀、双方反目和成都投降均有记载。",
  },
  {
    id: "chen-gong",
    name: "陈宫",
    courtesy: "字 公台",
    faction: "群雄",
    role: "吕布谋主",
    summary: "离开曹操后辅佐吕布，明知难成仍在白门楼拒绝再降。",
    aliases: ["公台"],
    route: ["chenliu", "puyang", "xiapi"],
    screen: "电视剧以清醒、刚烈与对曹操失望塑造其悲剧。",
    novel: "捉放曹等情节把两人的道德分歧提前并扩大。",
    history: "背曹迎吕布、守下邳和拒降就死有载，捉放曹为文学加工。",
  },
  {
    id: "cao-cao",
    name: "曹操",
    courtesy: "字 孟德",
    faction: "曹魏",
    role: "汉丞相 · 魏武帝",
    summary: "从陈留起兵到统一北方，以挟天子、屯田和征战奠定曹魏基业。",
    aliases: ["孟德", "曹丞相", "魏武帝"],
    route: ["luoyang", "chenliu", "xuchang", "guandu", "wulin", "huarong", "luoyang"],
    screen: "电视剧兼写雄才、机警、诗性与猜忌，是全剧最复杂的权力人物之一。",
    novel: "原著以“奸雄”统摄其形象，同时保留非凡军事与政治能力。",
    history: "统一北方、整顿制度和赤壁受挫等事迹见《武帝纪》。",
    historyCite: "《三国志·魏书·武帝纪》",
  },
  {
    id: "cao-pi",
    name: "曹丕",
    courtesy: "字 子桓",
    faction: "曹魏",
    role: "魏文帝",
    summary: "继承魏王之位并接受汉献帝禅让，建立曹魏。",
    aliases: ["子桓", "魏文帝"],
    route: ["ye", "xuchang", "luoyang"],
    screen: "电视剧把储位竞争、禅汉与对兄弟的猜忌相连。",
    novel: "七步诗成为其与曹植关系最著名的文学记忆。",
    history: "继嗣、代汉与治魏有本纪；七步成诗细节来源较晚。",
  },
  {
    id: "cao-zhi",
    name: "曹植",
    courtesy: "字 子建",
    faction: "曹魏",
    role: "陈王 · 文学家",
    summary: "才华卓著，却在储位竞争中败于曹丕，政治生命长期受限。",
    aliases: ["子建", "陈思王"],
    route: ["ye", "luoyang"],
    screen: "电视剧用七步诗浓缩兄弟权力冲突。",
    novel: "文学形象以才高受忌为核心。",
    history: "文才、争储失败及徙封见《陈思王植传》，七步诗非本传所载。",
  },
  {
    id: "xun-yu",
    name: "荀彧",
    courtesy: "字 文若",
    faction: "曹魏",
    role: "尚书令 · 王佐之才",
    summary: "为曹操规划根本、举荐人才并维系许都，晚年因政治方向分歧而失意。",
    aliases: ["文若", "荀令君"],
    route: ["ye", "xuchang", "shouchun"],
    screen: "电视剧把其汉臣立场与曹操称魏公的分歧推向悲剧。",
    novel: "原著延续忠汉而死的解释框架。",
    history: "迎帝都许、战略谋划和晚年失和均有传载，死因解释存在讨论。",
  },
  {
    id: "guo-jia",
    name: "郭嘉",
    courtesy: "字 奉孝",
    faction: "曹魏",
    role: "军师祭酒",
    summary: "深受曹操倚重，以洞察人心与战局著称，北征归途中早逝。",
    aliases: ["奉孝"],
    route: ["xuchang", "guandu", "ye"],
    screen: "电视剧以简练判断表现其敏锐。",
    novel: "遗计定辽东进一步传奇化其洞察。",
    history: "官渡前后与北征谋划见《郭嘉传》。",
  },
  {
    id: "jia-xu",
    name: "贾诩",
    courtesy: "字 文和",
    faction: "曹魏",
    role: "太尉 · 谋士",
    summary: "历事多主而善于自全，先助张绣后归曹操，在继嗣问题上影响深远。",
    aliases: ["文和"],
    route: ["changan", "wancheng", "xuchang", "luoyang"],
    screen: "电视剧突出其冷静与对人性弱点的把握。",
    novel: "宛城用计和离间马超韩遂最具传播力。",
    history: "劝张绣降曹、官渡与继嗣建议均有传载。",
  },
  {
    id: "xiahou-dun",
    name: "夏侯惇",
    courtesy: "字 元让",
    faction: "曹魏",
    role: "大将军",
    summary: "曹操宗亲重将，长期镇守方面并管理后方。",
    aliases: ["元让", "盲夏侯"],
    route: ["chenliu", "puyang", "bowang", "xuchang"],
    screen: "电视剧以刚烈勇武为主。",
    novel: "拔矢啖睛成为其标志性传奇。",
    history: "失一目、镇守与军政职掌有载；啖睛为文学渲染。",
  },
  {
    id: "xiahou-yuan",
    name: "夏侯渊",
    courtesy: "字 妙才",
    faction: "曹魏",
    role: "征西将军",
    summary: "以快速行军著称，镇守汉中时在定军山战死。",
    aliases: ["妙才"],
    route: ["xuchang", "hanzhong", "dingjun"],
    screen: "电视剧以定军山对决集中呈现其勇而失备。",
    novel: "被黄忠斩杀构成蜀军夺取汉中的高潮。",
    history: "西征战绩与定军山战死均有本传。",
  },
  {
    id: "zhang-liao",
    name: "张辽",
    courtesy: "字 文远",
    faction: "曹魏",
    role: "前将军",
    summary: "吕布旧将，归曹后成为名将，合肥之战威震江东。",
    aliases: ["文远", "张八百"],
    route: ["xiapi", "guandu", "hefei"],
    screen: "电视剧以白门归曹与合肥威名概括其转折。",
    novel: "八百破十万强化其勇将传奇。",
    history: "合肥突击与守御见《张辽传》，战绩确有史实核心。",
  },
  {
    id: "dian-wei",
    name: "典韦",
    courtesy: "无载",
    faction: "曹魏",
    role: "校尉 · 宿卫",
    summary: "以勇力护卫曹操，宛城断后战死。",
    aliases: ["古之恶来"],
    route: ["chenliu", "puyang", "wancheng"],
    screen: "电视剧把宛城死战拍成忠勇绝唱。",
    novel: "双戟与独守寨门强化其猛将形象。",
    history: "勇力、宿卫及宛城战死均见《典韦传》。",
  },
  {
    id: "xu-chu",
    name: "许褚",
    courtesy: "字 仲康",
    faction: "曹魏",
    role: "武卫将军",
    summary: "长期担任曹操近卫，以谨慎忠勇著称。",
    aliases: ["仲康", "虎痴"],
    route: ["xuchang", "guandu", "hanzhong"],
    screen: "电视剧以虎将与忠诚宿卫为核心。",
    novel: "裸衣斗马超等情节突出纯粹武勇。",
    history: "护卫曹操和潼关临危有本传，部分单挑为演义。",
  },
  {
    id: "zhang-he",
    name: "张郃",
    courtesy: "字 儁乂",
    faction: "曹魏",
    role: "车骑将军",
    summary: "由袁绍阵营归曹，历经多朝，在街亭击破马谡。",
    aliases: ["儁乂"],
    route: ["guandu", "hanzhong", "jieting", "qishan"],
    screen: "电视剧以街亭胜将和蜀魏长期对手出现。",
    novel: "后期常作为诸葛亮北伐中的魏军劲敌。",
    history: "官渡归曹、街亭破蜀与木门战死均有传载。",
  },
  {
    id: "sima-yi",
    name: "司马懿",
    courtesy: "字 仲达",
    faction: "司马晋",
    role: "太傅 · 魏国权臣",
    summary: "长期与蜀汉北伐周旋，高平陵政变后奠定司马氏掌权基础。",
    aliases: ["仲达", "宣王"],
    route: ["luoyang", "jieting", "wuzhangyuan", "luoyang"],
    screen: "电视剧把其隐忍、克制与诸葛亮的隔空对峙写得极具张力。",
    novel: "空城计与五丈原斗智强化其谨慎多疑。",
    history: "抗蜀、平辽东和高平陵政变均有明确史载；空城计无载。",
  },
  {
    id: "cao-zhen",
    name: "曹真",
    courtesy: "字 子丹",
    faction: "曹魏",
    role: "大司马",
    summary: "曹魏宗室统帅，参与抵御诸葛亮北伐。",
    aliases: ["子丹"],
    route: ["luoyang", "chencang", "qishan"],
    screen: "电视剧受原著影响，常被置于司马懿对照中。",
    novel: "文学叙事显著削弱其军事能力以衬托诸葛亮与司马懿。",
    history: "镇守西北、破羌胡与抗蜀有传，史实评价高于演义。",
  },
  {
    id: "deng-ai",
    name: "邓艾",
    courtesy: "字 士载",
    faction: "曹魏",
    role: "征西将军",
    summary: "长期经营西线，偷渡阴平直抵成都，完成灭蜀关键一击。",
    aliases: ["士载"],
    route: ["luoyang", "qishan", "yinping", "mianzhu", "chengdu"],
    screen: "电视剧以险道奇袭表现其军事冒险与决断。",
    novel: "偷渡阴平被写成后三国最具视觉性的奇兵行动。",
    history: "阴平行军、破诸葛瞻和成都受降见《邓艾传》。",
  },
  {
    id: "zhong-hui",
    name: "钟会",
    courtesy: "字 士季",
    faction: "曹魏",
    role: "镇西将军",
    summary: "率主力攻蜀并在剑阁牵制姜维，灭蜀后与姜维谋变失败。",
    aliases: ["士季"],
    route: ["luoyang", "jiange", "chengdu"],
    screen: "电视剧展现其才气、野心与成都兵变结局。",
    novel: "与姜维的最后合谋构成蜀亡余波。",
    history: "伐蜀、收姜维与反乱均见《钟会传》。",
  },
  {
    id: "liu-bei",
    name: "刘备",
    courtesy: "字 玄德",
    faction: "蜀汉",
    role: "汉昭烈帝",
    summary: "从流寓诸侯到据有益州、汉中，以延续汉室为旗号建立蜀汉。",
    aliases: ["玄德", "刘皇叔", "先主"],
    route: ["zhuo", "xuzhou", "xinye", "changban", "red-cliffs", "chengdu", "baidicheng"],
    screen: "电视剧以仁厚、坚韧与兄弟情为主轴，同时保留政治判断。",
    novel: "原著突出仁德与正统，部分政治锋芒被有意收敛。",
    history: "转战、入蜀、称帝与夷陵败亡见《先主传》。",
  },
  {
    id: "guan-yu",
    name: "关羽",
    courtesy: "字 云长",
    faction: "蜀汉",
    role: "前将军 · 荆州统帅",
    summary: "以忠勇著称，镇守荆州时威震华夏，最终在孙曹夹击下败亡。",
    aliases: ["云长", "关公", "美髯公"],
    route: ["zhuo", "xuzhou", "xuchang", "red-cliffs", "fancheng", "maicheng"],
    screen: "电视剧以威仪、克制与义重如山塑造关羽。",
    novel: "温酒斩华雄、过五关和华容道等典故构成神化路径。",
    history: "斩颜良、镇荆州、水淹七军和败走麦城有载；多项典故为文学加工。",
  },
  {
    id: "zhang-fei",
    name: "张飞",
    courtesy: "字 益德",
    faction: "蜀汉",
    role: "车骑将军",
    summary: "勇猛善战，长坂据桥与入蜀战功突出，也因暴而无恩留下致命弱点。",
    aliases: ["益德", "翼德", "张三爷"],
    route: ["zhuo", "xuzhou", "changban", "chengdu", "langzhong"],
    screen: "电视剧兼顾粗豪、机敏、可爱与暴烈。",
    novel: "当阳喝断桥与义释严颜使其形象超越单纯猛将。",
    history: "长坂拒敌、破张郃和临出征被部下所杀均有载。",
  },
  {
    id: "zhuge-liang",
    name: "诸葛亮",
    courtesy: "字 孔明",
    faction: "蜀汉",
    role: "丞相 · 武乡侯",
    summary: "由隆中出山，联吴、治蜀并持续北伐，成为蜀汉政治与精神中心。",
    aliases: ["孔明", "卧龙", "诸葛丞相"],
    route: ["longzhong", "chaisang", "chengdu", "nanzhong", "qishan", "wuzhangyuan"],
    screen: "电视剧以沉静、洞察与鞠躬尽瘁统摄其一生。",
    novel: "大量奇谋与天文气象叙事使其接近全知军师。",
    history: "联吴、治蜀、南征与北伐有本传；草船、借风、空城等不见本传。",
  },
  {
    id: "zhao-yun",
    name: "赵云",
    courtesy: "字 子龙",
    faction: "蜀汉",
    role: "镇军将军",
    summary: "长期追随刘备，长坂护主、入蜀与汉中作战，以稳健忠勇著称。",
    aliases: ["子龙", "常山赵子龙"],
    route: ["ye", "xuzhou", "changban", "chengdu", "hanzhong", "jieting"],
    screen: "电视剧以长坂单骑形成其最鲜明的英雄图像。",
    novel: "七进七出等细节大幅扩展长坂传奇。",
    history: "长坂护幼主、入蜀与汉水之战有载，细节少于演义。",
  },
  {
    id: "pang-tong",
    name: "庞统",
    courtesy: "字 士元",
    faction: "蜀汉",
    role: "军师中郎将",
    summary: "与诸葛亮并称凤雏，为刘备谋取益州，进围雒县时中流矢而亡。",
    aliases: ["士元", "凤雏"],
    route: ["xiangyang", "chaisang", "fucheng", "luofengpo"],
    screen: "电视剧以不羁外表、敏锐判断与落凤坡悲剧塑造人物。",
    novel: "连环计与落凤坡均被高度戏剧化。",
    history: "献取蜀三策、攻雒县中流矢身亡有载；赤壁献连环无载。",
  },
  {
    id: "fa-zheng",
    name: "法正",
    courtesy: "字 孝直",
    faction: "蜀汉",
    role: "尚书令 · 谋主",
    summary: "推动刘备入蜀并在汉中战役中献策，是蜀汉早期关键谋臣。",
    aliases: ["孝直"],
    route: ["chengdu", "fucheng", "hanzhong", "dingjun"],
    screen: "电视剧以入蜀内应与汉中谋划表现其锐利。",
    novel: "定军山前后的谋划集中体现其军略。",
    history: "迎刘备、取益州和汉中献策见《法正传》。",
  },
  {
    id: "ma-chao",
    name: "马超",
    courtesy: "字 孟起",
    faction: "蜀汉",
    role: "骠骑将军",
    summary: "关西名将，败于曹操后辗转入蜀，成为刘备集团的重要声望力量。",
    aliases: ["孟起", "锦马超"],
    route: ["changan", "hanzhong", "jiameng", "chengdu"],
    screen: "电视剧以潼关追曹与葭萌关酣战突出勇武。",
    novel: "许褚、张飞两场单挑塑造其西凉猛将形象。",
    history: "关中起兵、投张鲁和归刘备均有传；部分单挑为文学加工。",
  },
  {
    id: "huang-zhong",
    name: "黄忠",
    courtesy: "字 汉升",
    faction: "蜀汉",
    role: "后将军",
    summary: "以老将形象闻名，定军山斩夏侯渊奠定汉中战局。",
    aliases: ["汉升", "老将军"],
    route: ["xiangyang", "chengdu", "dingjun"],
    screen: "电视剧以老当益壮与定军山决战完成高光。",
    novel: "长沙战关羽等情节扩展其归蜀过程。",
    history: "随刘备入蜀、定军山斩夏侯渊有明确传载。",
  },
  {
    id: "wei-yan",
    name: "魏延",
    courtesy: "字 文长",
    faction: "蜀汉",
    role: "征西大将军",
    summary: "镇守汉中多年并参与北伐，诸葛亮死后与杨仪冲突而败亡。",
    aliases: ["文长"],
    route: ["xiangyang", "chengdu", "hanzhong", "qishan", "wuzhangyuan"],
    screen: "电视剧受原著影响，以勇猛、孤傲和反骨疑云塑造。",
    novel: "脑后反骨贯穿其结局预设。",
    history: "善养士卒、谋略自负与杨仪冲突有载，没有反骨相术。",
  },
  {
    id: "liu-shan",
    name: "刘禅",
    courtesy: "字 公嗣",
    faction: "蜀汉",
    role: "蜀汉后主",
    summary: "承继蜀汉四十年，后期政局衰弱，邓艾兵临成都时投降。",
    aliases: ["阿斗", "后主", "安乐公"],
    route: ["changban", "chengdu", "luoyang"],
    screen: "电视剧由幼主托孤写到乐不思蜀，形成强烈反差。",
    novel: "常被概括为昏弱之主。",
    history: "在位、降魏及迁洛阳均有本传；能力评价历来存在分歧。",
  },
  {
    id: "ma-su",
    name: "马谡",
    courtesy: "字 幼常",
    faction: "蜀汉",
    role: "参军",
    summary: "才器受诸葛亮赏识，却在街亭违令失守，成为北伐转折人物。",
    aliases: ["幼常"],
    route: ["chengdu", "nanzhong", "jieting"],
    screen: "电视剧细写请令、失街亭与挥泪斩马谡的情感重量。",
    novel: "纸上谈兵式的轻敌被显著强化。",
    history: "街亭违亮节度、败后被处置有载；具体死法史料表述不一。",
  },
  {
    id: "jiang-wei",
    name: "姜维",
    courtesy: "字 伯约",
    faction: "蜀汉",
    role: "大将军",
    summary: "由魏降蜀，承接诸葛亮北伐志业，蜀亡后试图借钟会之乱复国。",
    aliases: ["伯约"],
    route: ["jieting", "chengdu", "qishan", "jiange", "chengdu"],
    screen: "电视剧把其写成诸葛亮精神继承者和蜀汉最后的执着。",
    novel: "九伐中原与诈降复国强化悲壮色彩。",
    history: "多次北伐、剑阁拒钟会和成都兵变均有传载。",
  },
  {
    id: "sun-jian",
    name: "孙坚",
    courtesy: "字 文台",
    faction: "孙吴",
    role: "破虏将军",
    summary: "江东孙氏奠基者，讨董时表现突出，后攻刘表战死。",
    aliases: ["文台", "江东猛虎"],
    route: ["hulao", "luoyang", "xiangyang"],
    screen: "电视剧以勇烈和传国玉玺引出孙氏江东基业。",
    novel: "匿玉玺与盟军冲突强化其家族野心。",
    history: "讨董入洛阳和攻襄阳战死有载，玉玺细节史源复杂。",
  },
  {
    id: "sun-ce",
    name: "孙策",
    courtesy: "字 伯符",
    faction: "孙吴",
    role: "讨逆将军",
    summary: "渡江创业，以迅疾征战奠定江东六郡，英年早逝后托业孙权。",
    aliases: ["伯符", "小霸王"],
    route: ["shouchun", "chaisang", "jianye"],
    screen: "电视剧用短而有力的段落表现创业与托孤。",
    novel: "小霸王之名与于吉故事强化其勇烈、躁急。",
    history: "平定江东、遇刺重伤和托付孙权均有本传。",
  },
  {
    id: "sun-quan",
    name: "孙权",
    courtesy: "字 仲谋",
    faction: "孙吴",
    role: "吴大帝",
    summary: "承接江东基业，在赤壁主战并长期经营孙吴，形成三国鼎立。",
    aliases: ["仲谋", "吴主", "吴大帝"],
    route: ["chaisang", "red-cliffs", "hefei", "jianye"],
    screen: "电视剧突出其在群臣分歧中决断、用人与守成。",
    novel: "赤壁断案与合肥受挫构成主要形象节点。",
    history: "主政江东、赤壁、称帝和晚年继承危机均有本纪式传载。",
  },
  {
    id: "zhou-yu",
    name: "周瑜",
    courtesy: "字 公瑾",
    faction: "孙吴",
    role: "偏将军 · 南郡太守",
    summary: "江东核心统帅，力主拒曹并指挥赤壁之战，后筹划西进途中早逝。",
    aliases: ["公瑾", "周郎", "大都督"],
    route: ["chaisang", "fankou", "red-cliffs", "jiangling"],
    screen: "电视剧兼写统帅英气与同诸葛亮竞合的戏剧锋芒。",
    novel: "才略卓越却屡受孔明牵制，气量被明显文学化。",
    history: "主战、统军赤壁与谋取益州见《周瑜传》，无三气之说。",
  },
  {
    id: "lu-su",
    name: "鲁肃",
    courtesy: "字 子敬",
    faction: "孙吴",
    role: "横江将军",
    summary: "较早提出鼎足江东战略，推动孙刘联盟并继周瑜镇守荆州前线。",
    aliases: ["子敬", "鲁都督"],
    route: ["chaisang", "xiakou", "red-cliffs", "jiangling"],
    screen: "电视剧以忠厚调停者为基调，也展现联刘战略眼光。",
    novel: "常被置于周瑜、诸葛亮之间，憨厚色彩被放大。",
    history: "榻上策、迎刘备和维系联盟见《鲁肃传》，战略地位更高。",
  },
  {
    id: "huang-gai",
    name: "黄盖",
    courtesy: "字 公覆",
    faction: "孙吴",
    role: "武锋中郎将",
    summary: "江东宿将，赤壁建议火攻并实施诈降突击。",
    aliases: ["公覆", "黄老将军"],
    route: ["chaisang", "red-cliffs"],
    screen: "电视剧以受刑、诈降与火船冲阵完成悲壮高光。",
    novel: "苦肉计把忠诚与计谋绑定为著名典故。",
    history: "建策火攻、书报诈降有载；受杖苦肉不见正史。",
  },
  {
    id: "lu-meng",
    name: "吕蒙",
    courtesy: "字 子明",
    faction: "孙吴",
    role: "南郡太守",
    summary: "由勇将成长为统帅，白衣渡江袭取荆州，改变吴蜀关系。",
    aliases: ["子明", "吴下阿蒙"],
    route: ["chaisang", "hefei", "xunyang", "jiangling", "maicheng"],
    screen: "电视剧呈现刮目相看、隐病欺关羽与袭荆州。",
    novel: "关羽死后吕蒙遭神魂索命属强烈文学报应。",
    history: "勤学、白衣袭荆州和病卒均有传载。",
  },
  {
    id: "lu-xun",
    name: "陆逊",
    courtesy: "字 伯言",
    faction: "孙吴",
    role: "大都督 · 丞相",
    summary: "夷陵以坚守待变、火攻破刘备，后成为孙吴重臣。",
    aliases: ["伯言"],
    route: ["jianye", "jiangling", "yiling"],
    screen: "电视剧以年轻儒将的沉稳反衬刘备急于决战。",
    novel: "八阵图脱身等情节连接夷陵与诸葛亮神机。",
    history: "夷陵统军与火攻大胜有明确传载。",
  },
  {
    id: "gan-ning",
    name: "甘宁",
    courtesy: "字 兴霸",
    faction: "孙吴",
    role: "折冲将军",
    summary: "由锦帆游侠转为江东猛将，在荆州、合肥战线屡立战功。",
    aliases: ["兴霸", "锦帆贼"],
    route: ["xiakou", "chaisang", "hefei"],
    screen: "电视剧以豪勇敢战为主。",
    novel: "百骑劫营强化其冒险型武将形象。",
    history: "归孙权、破黄祖与濡须作战见《甘宁传》。",
  },
  {
    id: "zhang-zhao",
    name: "张昭",
    courtesy: "字 子布",
    faction: "孙吴",
    role: "江东长史",
    summary: "孙策托孤重臣，主掌内政，赤壁前倾向迎曹。",
    aliases: ["子布"],
    route: ["chaisang", "jianye"],
    screen: "电视剧让其成为江东主降意见的主要代表。",
    novel: "舌战群儒中与诸葛亮交锋最受注意。",
    history: "辅政与赤壁前主降有载；完整舌战场面为文学加工。",
  },
  {
    id: "sima-zhao",
    name: "司马昭",
    courtesy: "字 子上",
    faction: "司马晋",
    role: "晋王 · 魏国权臣",
    summary: "承接父兄权力，控制曹魏并发动灭蜀战争，为西晋代魏铺路。",
    aliases: ["子上", "晋文王"],
    route: ["luoyang", "xuchang"],
    screen: "电视剧以权力公开化和“路人皆知”表现代魏进程。",
    novel: "弑君与灭蜀把其推到后三国权力中心。",
    history: "掌政、甘露之变和伐蜀均有史载。",
  },
  {
    id: "sima-yan",
    name: "司马炎",
    courtesy: "字 安世",
    faction: "司马晋",
    role: "晋武帝",
    summary: "接受魏帝禅让建立西晋，太康元年灭吴，三国归于一统。",
    aliases: ["安世", "晋武帝"],
    route: ["luoyang", "jianye"],
    screen: "电视剧以代魏与受降收束全剧。",
    novel: "作为三分归晋的终局人物出现。",
    history: "建晋、制度调整和灭吴见《晋书·武帝纪》。",
    historyCite: "《晋书·武帝纪》",
  },
];

const personLinkOverrides: Record<
  string,
  { baikeUrl?: string; videoUrl?: string }
> = {
  "han-xiandi": { videoUrl: "https://baike.baidu.com/l/Yk4RdoS2" },
  "dong-zhuo": { videoUrl: "https://baike.baidu.com/l/ai0YmIUL" },
  "lu-bu": { videoUrl: "https://baike.baidu.com/l/hq71WZwF" },
  "wang-yun": { videoUrl: "https://baike.baidu.com/l/RxnVE8E" },
  "yuan-shao": { videoUrl: "https://baike.baidu.com/l/UlYNtirn" },
  "liu-zhang": { videoUrl: "https://baike.baidu.com/l/QHIqazb2" },
  "chen-gong": { videoUrl: "https://baike.baidu.com/l/sauyoUD" },
  "cao-cao": {
    baikeUrl: "https://baike.baidu.com/item/%E6%9B%B9%E6%93%8D/6772",
    videoUrl: "https://baike.baidu.com/l/J96AERLz",
  },
  "cao-pi": { videoUrl: "https://baike.baidu.com/l/Kjlr0jX5" },
  "xun-yu": { videoUrl: "https://baike.baidu.com/l/aXNqBuyB" },
  "jia-xu": { videoUrl: "https://baike.baidu.com/l/dOzFMJXj" },
  "xiahou-dun": { videoUrl: "https://baike.baidu.com/l/R3rwWGkX" },
  "xiahou-yuan": { videoUrl: "https://baike.baidu.com/l/Ztb0DQrP" },
  "dian-wei": { videoUrl: "https://baike.baidu.com/l/OrxjMEx8" },
  "sima-yi": { videoUrl: "https://baike.baidu.com/l/QRMF9QrN" },
  "cao-zhen": { videoUrl: "https://baike.baidu.com/l/ip7KBaBa" },
  "deng-ai": { videoUrl: "https://baike.baidu.com/l/ZY49H3OF" },
  "zhong-hui": { videoUrl: "https://baike.baidu.com/l/TlrmHBbu" },
  "liu-bei": { videoUrl: "https://baike.baidu.com/l/B7Vl0OjJ" },
  "guan-yu": { videoUrl: "https://baike.baidu.com/l/Eh3wapvH" },
  "zhang-fei": { videoUrl: "https://baike.baidu.com/l/GdaELbfl" },
  "zhuge-liang": {
    baikeUrl: "https://baike.baidu.com/item/%E8%AF%B8%E8%91%9B%E4%BA%AE/21048",
    videoUrl: "https://baike.baidu.com/l/CjYdvIlV",
  },
  "zhao-yun": { videoUrl: "https://baike.baidu.com/l/RTxicEDj" },
  "pang-tong": { videoUrl: "https://baike.baidu.com/l/LFwudzDR" },
  "fa-zheng": { videoUrl: "https://baike.baidu.com/l/CXXDPDli" },
  "ma-chao": { videoUrl: "https://baike.baidu.com/l/D7PbiCR9" },
  "huang-zhong": { videoUrl: "https://baike.baidu.com/l/IxMMQccb" },
  "wei-yan": { videoUrl: "https://baike.baidu.com/l/MQaRQr3l" },
  "liu-shan": { videoUrl: "https://baike.baidu.com/l/YyhhCO1T" },
  "jiang-wei": { videoUrl: "https://baike.baidu.com/l/HXzRLhwf" },
  "sun-jian": { videoUrl: "https://baike.baidu.com/l/dixTTZn8" },
  "sun-ce": { videoUrl: "https://baike.baidu.com/l/LhGuTPuz" },
  "sun-quan": { videoUrl: "https://baike.baidu.com/l/MTGjG6iT" },
  "zhou-yu": { videoUrl: "https://baike.baidu.com/l/Z9WwnH0U" },
  "lu-su": { videoUrl: "https://baike.baidu.com/l/VwfYXYzd" },
  "huang-gai": { videoUrl: "https://baike.baidu.com/l/bpSWKRb9" },
  "lu-meng": { videoUrl: "https://baike.baidu.com/l/Ks8CWxcH" },
  "lu-xun": { videoUrl: "https://baike.baidu.com/l/N8USjYz6" },
  "zhang-zhao": { videoUrl: "https://baike.baidu.com/l/httNTqq3" },
  "sima-zhao": { videoUrl: "https://baike.baidu.com/l/jDn6TJbx" },
  "sima-yan": { videoUrl: "https://baike.baidu.com/l/GwO6aNbv" },
};

export const people: Person[] = personSeeds.map((seed) => ({
  ...makePerson(seed),
  baikeUrl: personLinkOverrides[seed.id]?.baikeUrl ?? baikeItemUrl(seed.name),
  videoUrl: personLinkOverrides[seed.id]?.videoUrl,
}));

type PlaceSeed = [
  id: string,
  name: string,
  modern: string,
  certainty: Place["certainty"],
  x: number,
  y: number,
  summary: string,
  aliases?: string[],
];

const placeSeeds: PlaceSeed[] = [
  ["zhuo", "涿郡", "今河北涿州一带", "约定位置", 62, 11, "桃园结义与刘关张起兵的叙事原点。", ["涿县"]],
  ["guangzong", "广宗", "今河北威县东一带", "较明确", 61, 16, "黄巾军主力与汉军交战区域。"],
  ["luoyang", "洛阳", "今河南洛阳", "较明确", 51, 29, "东汉旧都，也是曹魏、西晋权力交接的重要都城。"],
  ["changan", "长安", "今陕西西安", "较明确", 39, 29, "董卓迁都后的政治中心，也是关中兵争枢纽。"],
  ["hulao", "虎牢关", "今河南荥阳汜水一带", "存在争议", 55, 29, "诸侯讨董叙事中的关口战场。", ["汜水关"]],
  ["chenliu", "陈留", "今河南开封东南", "较明确", 58, 32, "曹操起兵与早期经营的重要区域。"],
  ["puyang", "濮阳", "今河南濮阳", "较明确", 62, 25, "曹操与吕布争夺兖州的核心战场。"],
  ["ye", "邺城", "今河北临漳一带", "较明确", 58, 20, "袁绍、曹操经营河北的重要政治中心。"],
  ["xuzhou", "徐州", "今江苏徐州及周边", "约定位置", 69, 34, "陶谦、刘备、吕布与曹操反复争夺之地。"],
  ["xiapi", "下邳", "今江苏睢宁西北一带", "约定位置", 70, 38, "吕布最后据点与白门楼所在。"],
  ["xuchang", "许昌", "今河南许昌", "较明确", 58, 37, "献帝东归后曹操奉天子以令诸侯的政治中心。", ["许都"]],
  ["wancheng", "宛城", "今河南南阳", "较明确", 51, 44, "张绣降而复叛、典韦战死之地。"],
  ["guandu", "官渡", "今河南中牟东北一带", "较明确", 59, 30, "曹操与袁绍决定北方格局的战场。"],
  ["baima", "白马", "今河南滑县一带", "约定位置", 62, 29, "官渡战前颜良军所在。"],
  ["xiangyang", "襄阳", "今湖北襄阳", "较明确", 50, 51, "荆州政治与南北交通枢纽。"],
  ["xinye", "新野", "今河南新野", "较明确", 51, 47, "刘备依附刘表期间的驻地。"],
  ["longzhong", "隆中", "今湖北襄阳西一带", "存在争议", 48, 51, "诸葛亮躬耕与隆中对的文化地标。"],
  ["bowang", "博望", "今河南方城一带", "较明确", 51, 45, "刘备军与夏侯惇交锋之处。"],
  ["changban", "长坂", "今湖北当阳一带", "较明确", 53, 58, "刘备南撤遭曹军追击的转折战场。", ["长坂坡"]],
  ["xiakou", "夏口", "今武汉一带", "约定位置", 61, 57, "刘备集团暂时立足并推动孙刘联盟的节点。"],
  ["chaisang", "柴桑", "今江西九江一带", "较明确", 68, 61, "赤壁前江东决策与外交舞台。"],
  ["fankou", "樊口", "今湖北鄂州一带", "约定位置", 63, 59, "孙刘军队会合、向赤壁推进的节点。"],
  ["red-cliffs", "赤壁", "今湖北赤壁长江沿岸，具体战场有争议", "存在争议", 57, 62, "赤壁大战核心战区，以范围而非单点表达。"],
  ["wulin", "乌林", "今湖北洪湖一带，具体地望有争议", "存在争议", 57, 59, "曹军江北营寨方向。"],
  ["huarong", "华容道", "约今湖北监利一带", "存在争议", 53, 64, "曹军赤壁败退途中泥泞难行的路线。"],
  ["jiangling", "江陵", "今湖北荆州", "较明确", 53, 59, "荆州南郡治所与孙刘曹长期争夺的枢纽。", ["南郡"]],
  ["fancheng", "樊城", "今湖北襄阳樊城区", "较明确", 51, 50, "关羽北伐围攻曹仁的主要战场。"],
  ["maicheng", "麦城", "今湖北当阳东南一带", "约定位置", 54, 57, "关羽败亡前最后据点。"],
  ["jianye", "建业", "今江苏南京", "较明确", 77, 56, "孙吴后期都城。", ["秣陵", "建康"]],
  ["hefei", "合肥", "今安徽合肥", "较明确", 70, 48, "曹魏与孙吴长期对峙的淮南重镇。"],
  ["shouchun", "寿春", "今安徽寿县", "较明确", 67, 44, "袁术称帝及淮南兵争重镇。"],
  ["xunyang", "寻阳", "今江西九江一带", "约定位置", 68, 59, "吕蒙白衣渡江前的上游节点。"],
  ["chengdu", "成都", "今四川成都", "较明确", 29, 61, "蜀汉都城与西南政治中心。"],
  ["fucheng", "涪城", "今四川绵阳", "较明确", 32, 55, "刘备入蜀与刘璋会面的节点。"],
  ["luofengpo", "落凤坡", "今四川德阳一带，具体地望有争议", "存在争议", 31, 58, "演义中庞统中伏身亡之地。"],
  ["jiameng", "葭萌关", "今四川广元昭化一带", "约定位置", 34, 50, "刘备入蜀北线关隘。"],
  ["hanzhong", "汉中", "今陕西汉中", "较明确", 37, 45, "蜀魏之间的战略门户。"],
  ["dingjun", "定军山", "今陕西勉县南", "较明确", 36, 46, "黄忠斩夏侯渊、汉中战局转折之地。"],
  ["yiling", "夷陵", "今湖北宜昌东一带", "较明确", 48, 62, "吴蜀夷陵之战的广域战区。", ["猇亭"]],
  ["baidicheng", "白帝城", "今重庆奉节", "较明确", 42, 61, "刘备败退与托孤之地。"],
  ["nanzhong", "南中", "今云南、贵州及川南部分区域", "约定位置", 31, 79, "蜀汉南征所涵盖的广阔区域。"],
  ["qishan", "祁山", "今甘肃礼县东一带", "较明确", 35, 38, "诸葛亮与姜维北伐的重要方向。"],
  ["jieting", "街亭", "今甘肃秦安一带，具体位置有讨论", "存在争议", 37, 34, "第一次北伐粮道与侧翼关键节点。"],
  ["chencang", "陈仓", "今陕西宝鸡", "较明确", 40, 32, "蜀魏北伐攻防重镇。"],
  ["wuzhangyuan", "五丈原", "今陕西岐山南", "较明确", 41, 34, "诸葛亮最后一次北伐驻军与病逝之地。"],
  ["yinping", "阴平", "今甘肃文县至四川平武山道", "存在争议", 34, 47, "邓艾奇兵绕过剑阁的险道。"],
  ["jiange", "剑阁", "今四川剑阁", "较明确", 34, 52, "姜维阻挡钟会主力的雄关。"],
  ["mianzhu", "绵竹", "今四川德阳绵竹", "较明确", 31, 58, "诸葛瞻阻击邓艾并战死之地。"],
  ["langzhong", "阆中", "今四川阆中", "较明确", 32, 52, "张飞镇守与遇害之地。"],
];

export const places: Place[] = placeSeeds.map(
  ([id, name, modern, certainty, x, y, summary, aliases = []]) => ({
    id,
    name,
    image: `/images/places/${id}.webp`,
    modern,
    certainty,
    position: { x, y },
    summary,
    aliases,
    sources: {
      drama: {
        title: "荧屏空间",
        body: `电视剧把${name}作为人物行动与局势变化的可见舞台，画面重在叙事方位而非精确复原。`,
        cite: "央视 1994 年版《三国演义》相关段落",
      },
      novel: {
        title: "文学地景",
        body: `原著中的${name}兼具真实地理与章回叙事功能，行军距离和空间关系有时会为戏剧节奏调整。`,
        cite: "罗贯中《三国演义》相关回目",
      },
      history: {
        title: certainty === "存在争议" ? "地望仍有讨论" : "史地对照",
        body:
          certainty === "存在争议"
            ? `${name}确与相关历史叙事相连，但精确位置或战场范围存在不同考证，本图采用范围化标记。`
            : `${name}可与今地作大致对应；本图只表达历史地理关系，不套用现代行政边界。`,
        cite: "《三国志》相关纪传；《资治通鉴》相关卷次；历史地理研究通说",
      },
    },
  }),
);

type EventSeed = {
  id: string;
  name: string;
  date: string;
  era: string;
  placeId: string;
  people: string[];
  summary: string;
  outcome: string;
  history: string;
  allusion?: string;
  historyCite?: string;
};

const eventSeeds: EventSeed[] = [
  { id: "yellow-turban", name: "黄巾起义", date: "中平元年 · 184", era: "乱世初起", placeId: "guangzong", people: ["han-xiandi", "liu-bei", "guan-yu", "zhang-fei"], summary: "太平道起事席卷多州，东汉中央秩序迅速松动，地方武装由此扩张。", outcome: "起义主力被镇压，但州郡军权坐大，群雄时代的条件已经形成。", history: "张角发动黄巾起义、汉廷调兵镇压有明确史载。", historyCite: "《后汉书·皇甫嵩朱儁列传》" },
  { id: "peach-garden", name: "桃园结义", date: "中平元年 · 184", era: "乱世初起", placeId: "zhuo", people: ["liu-bei", "guan-yu", "zhang-fei"], summary: "刘备、关羽、张飞因平乱相聚，电视剧以誓言确立贯穿全剧的兄弟主轴。", outcome: "三人共同起兵，开始长期流转于诸侯之间。", history: "刘关张情若兄弟、寝则同床有载，桃园盟誓不见正史。", allusion: "桃园三结义", historyCite: "《三国志·蜀书·关羽传》《张飞传》" },
  { id: "eunuch-coup", name: "十常侍之乱", date: "中平六年 · 189", era: "乱世初起", placeId: "luoyang", people: ["he-jin", "yuan-shao", "dong-zhuo"], summary: "何进谋诛宦官反被杀，袁绍率军入宫，洛阳权力真空骤然出现。", outcome: "董卓率凉州军入京，控制朝廷。", history: "何进遇害、袁绍诛宦官与董卓入京的基本脉络可证。", historyCite: "《后汉书·何进传》" },
  { id: "dong-enters-luoyang", name: "董卓入京", date: "中平六年 · 189", era: "乱世初起", placeId: "luoyang", people: ["dong-zhuo", "han-xiandi", "lu-bu", "wang-yun"], summary: "董卓收并军队、废立皇帝，以武力控制洛阳。", outcome: "中央权威进一步崩解，地方反董联盟开始形成。", history: "董卓废少帝立刘协、专断朝政有载。" },
  { id: "cao-dagger", name: "孟德献刀", date: "初平元年 · 190 前后", era: "乱世初起", placeId: "luoyang", people: ["cao-cao", "dong-zhuo", "chen-gong"], summary: "曹操借献刀之名行刺董卓未遂，仓促逃离洛阳。", outcome: "曹操回到陈留起兵，进入群雄舞台。", history: "曹操拒绝董卓任命并逃归乡里有载，献七星刀行刺不见正史。", allusion: "献刀刺董" },
  { id: "coalition", name: "诸侯讨董", date: "初平元年 · 190", era: "乱世初起", placeId: "hulao", people: ["yuan-shao", "cao-cao", "sun-jian", "liu-bei"], summary: "关东诸侯以讨伐董卓为名结盟，却因利益分歧难以协同。", outcome: "董卓迁都长安，联盟旋即瓦解，各方开始争夺地盘。", history: "关东州郡起兵与董卓迁都有载；会盟编制与战功细节和演义不同。" },
  { id: "hua-xiong", name: "温酒斩华雄", date: "演义时序 · 190", era: "乱世初起", placeId: "hulao", people: ["guan-yu", "yuan-shao", "sun-jian", "cao-cao"], summary: "无名关羽请战，酒尚温而斩华雄，第一次令诸侯侧目。", outcome: "关羽声名初显，刘关张被纳入诸侯战争中心。", history: "华雄史载为孙坚军所斩，关羽温酒斩华雄为演义移花接木。", allusion: "温酒斩华雄", historyCite: "《三国志·吴书·孙破虏讨逆传》" },
  { id: "three-vs-lu", name: "三英战吕布", date: "演义时序 · 190", era: "乱世初起", placeId: "hulao", people: ["lu-bu", "liu-bei", "guan-yu", "zhang-fei"], summary: "刘关张合战吕布，把个人勇武与兄弟协力推到开篇高潮。", outcome: "吕布退回关内，桃园群体由此获得传奇声名。", history: "虎牢关三英战吕布不见正史，属演义核心武戏。", allusion: "三英战吕布" },
  { id: "beauty-scheme", name: "连环计", date: "初平三年 · 192", era: "乱世初起", placeId: "changan", people: ["wang-yun", "diaochan", "lu-bu", "dong-zhuo"], summary: "王允借貂蝉离间董卓与吕布，使权力同欲望同时失控。", outcome: "吕布决意反戈，董卓统治走向终局。", history: "王允联合吕布属实；貂蝉与完整连环计为文学创造。", allusion: "美人连环计" },
  { id: "lu-kills-dong", name: "吕布诛董卓", date: "初平三年 · 192", era: "乱世初起", placeId: "changan", people: ["lu-bu", "dong-zhuo", "wang-yun", "diaochan"], summary: "吕布在宫门内应下刺杀董卓，长安一度欢庆。", outcome: "王允未能收束凉州旧部，李傕郭汜反攻长安。", history: "吕布奉王允之命杀董卓有明确史载。" },
  { id: "emperor-xu", name: "曹操迎献帝", date: "建安元年 · 196", era: "群雄逐鹿", placeId: "xuchang", people: ["cao-cao", "han-xiandi", "xun-yu"], summary: "曹操迎奉献帝迁都许县，以中央名义号令诸侯。", outcome: "许都成为新政治中心，曹操获得制度与名分优势。", history: "荀彧劝奉天子、迁都许县和借朝廷号令群雄均有史载。" },
  { id: "wancheng", name: "宛城之战", date: "建安二年 · 197", era: "群雄逐鹿", placeId: "wancheng", people: ["cao-cao", "jia-xu", "dian-wei"], summary: "张绣降而复叛，曹军猝不及防，典韦力战断后。", outcome: "曹操长子曹昂、典韦战死；数年后张绣在贾诩建议下归曹。", history: "宛城突袭与曹昂、典韦之死有载；部分起因细节为演义扩写。" },
  { id: "white-gate", name: "白门楼", date: "建安三年 · 199", era: "群雄逐鹿", placeId: "xiapi", people: ["cao-cao", "liu-bei", "lu-bu", "chen-gong", "zhang-liao"], summary: "吕布败困下邳被俘，陈宫拒降，张辽转入曹操阵营。", outcome: "吕布势力覆灭，曹操基本控制徐州。", history: "下邳围城、吕布被缚与处死、陈宫就死均有传载。", allusion: "白门楼殒命" },
  { id: "heroes-wine", name: "煮酒论英雄", date: "建安四年 · 199", era: "群雄逐鹿", placeId: "xuchang", people: ["cao-cao", "liu-bei"], summary: "曹操以天下英雄试探刘备，雷声掩过筷落，也掩过双方第一次正面识别。", outcome: "刘备暂时脱身，随后借机离开许都。", history: "曹操曾言“今天下英雄，唯使君与操耳”见裴注材料；完整煮酒场景为文学加工。", allusion: "青梅煮酒" },
  { id: "girdle-edict", name: "衣带诏", date: "建安四至五年 · 199—200", era: "群雄逐鹿", placeId: "xuchang", people: ["han-xiandi", "liu-bei", "cao-cao"], summary: "献帝密诏诛曹，刘备等人被卷入一场以汉室名义发动的秘密反抗。", outcome: "董承等被诛，刘备与曹操公开决裂。", history: "董承谋反与被诛有载，是否确有缝入衣带的密诏存在史源讨论。", allusion: "衣带诏" },
  { id: "guandu", name: "官渡之战", date: "建安五年 · 200", era: "群雄逐鹿", placeId: "guandu", people: ["cao-cao", "yuan-shao", "xun-yu", "guo-jia", "zhang-he"], summary: "兵力居劣的曹操坚守官渡并奇袭乌巢，扭转河北争霸。", outcome: "袁绍主力崩溃，曹操逐步统一北方。", history: "官渡对峙、许攸来奔与乌巢粮营被袭均有明确史载。", allusion: "火烧乌巢" },
  { id: "xu-shu-recommends", name: "徐庶荐诸葛", date: "建安十二年 · 207 前后", era: "群雄逐鹿", placeId: "xinye", people: ["liu-bei", "zhuge-liang"], summary: "刘备在新野求贤，徐庶将目光引向隆中卧龙。", outcome: "刘备决定亲赴隆中，战略视野由求一城转向谋天下。", history: "徐庶与诸葛亮相交、向刘备推荐诸葛亮有传记依据；情节铺排多为演义。", allusion: "走马荐诸葛" },
  { id: "three-visits", name: "三顾茅庐", date: "建安十二年 · 207", era: "群雄逐鹿", placeId: "longzhong", people: ["liu-bei", "guan-yu", "zhang-fei", "zhuge-liang"], summary: "刘备三访隆中，诸葛亮以天下三分的战略回应知遇。", outcome: "诸葛亮出山，刘备集团获得长期战略与组织核心。", history: "刘备三往见诸葛亮与隆中对见《诸葛亮传》，戏剧细节由演义扩展。", allusion: "三顾茅庐" },
  { id: "bowang-fire", name: "火烧博望坡", date: "建安七年 · 202／演义后置", era: "群雄逐鹿", placeId: "bowang", people: ["liu-bei", "zhuge-liang", "xiahou-dun", "zhao-yun"], summary: "电视剧沿原著把博望坡设为诸葛亮出山后的第一场用兵。", outcome: "诸葛亮以伏兵火攻建立军中威信。", history: "博望交战发生于诸葛亮出山前，史载主要指挥者为刘备；演义调整时序。", allusion: "火烧博望坡", historyCite: "《三国志·蜀书·先主传》" },
  { id: "changban", name: "长坂坡", date: "建安十三年 · 208", era: "群雄逐鹿", placeId: "changban", people: ["liu-bei", "cao-cao", "zhao-yun", "zhang-fei", "guan-yu"], summary: "曹操轻骑追及刘备，军民溃散；赵云护主、张飞据桥成为败局中的英雄支点。", outcome: "刘备退向江夏，与刘琦会合并寻求联吴。", history: "当阳长坂追击、赵云护主和张飞据水断桥均有史实核心，战斗细节经文学放大。", allusion: "单骑救主 · 当阳断喝" },
  { id: "debate-scholars", name: "舌战群儒", date: "建安十三年 · 208", era: "赤壁鏖战", placeId: "chaisang", people: ["zhuge-liang", "sun-quan", "lu-su", "zhang-zhao"], summary: "诸葛亮在江东主降声浪中逐一辩驳，为联盟争取政治空间。", outcome: "江东降战之争集中到孙权与周瑜的最终判断。", history: "诸葛亮出使、鲁肃周瑜主战有载；完整群儒辩论为原著群像创作。", allusion: "舌战群儒" },
  { id: "straw-boats", name: "草船借箭", date: "演义时序 · 208", era: "赤壁鏖战", placeId: "fankou", people: ["zhuge-liang", "zhou-yu", "lu-su", "cao-cao"], summary: "浓雾江面上，诸葛亮借草船鼓噪诱取曹军箭矢。", outcome: "军令状化险为夷，周瑜与诸葛亮的竞合加深。", history: "诸葛亮草船借箭不见正史，后世常与孙权濡须近似故事联系。", allusion: "草船借箭" },
  { id: "bitter-chain", name: "苦肉与连环", date: "演义时序 · 208", era: "赤壁鏖战", placeId: "wulin", people: ["zhou-yu", "huang-gai", "pang-tong", "cao-cao"], summary: "苦肉、诈降和连环船被扣成一条计谋链，为火攻创造条件。", outcome: "黄盖取得接近曹军船阵的机会。", history: "黄盖献火攻与诈降有载；受杖苦肉、庞统献连环不见正史。", allusion: "苦肉计 · 连环计" },
  { id: "east-wind", name: "借东风", date: "演义时序 · 208 冬", era: "赤壁鏖战", placeId: "red-cliffs", people: ["zhuge-liang", "zhou-yu", "huang-gai"], summary: "七星坛祭风把气象窗口写成诸葛亮近乎神机的高潮。", outcome: "东南风起，火攻进入执行时刻。", history: "史籍记火攻时东南风急，没有诸葛亮设坛借风。", allusion: "借东风" },
  { id: "red-cliffs-battle", name: "火烧赤壁", date: "建安十三年 · 208 冬", era: "赤壁鏖战", placeId: "red-cliffs", people: ["zhou-yu", "huang-gai", "cao-cao", "liu-bei", "zhuge-liang"], summary: "黄盖火船顺风冲阵，曹军舰船与岸上营寨相继燃烧。", outcome: "曹军北撤，孙刘得以立足，三方格局获得形成时间。", history: "黄盖载薪灌油、诈降纵火及曹军败退均见《周瑜传》，疾病和水土不服也是重要背景。", allusion: "火烧赤壁", historyCite: "《三国志·吴书·周瑜传》；《资治通鉴》卷六十五" },
  { id: "huarong", name: "败走华容", date: "建安十三年 · 208 冬", era: "赤壁鏖战", placeId: "huarong", people: ["cao-cao", "guan-yu", "liu-bei"], summary: "曹军穿过泥泞道路北撤，演义让关羽在最后关口面对旧恩与军令。", outcome: "曹操主力退回北方，孙刘联盟随即进入战后利益分配。", history: "华容道泥泞撤退有载，关羽设伏义释曹操无载。", allusion: "华容道义释曹操" },
  { id: "zhou-yu-thrice", name: "三气周瑜", date: "演义时序 · 209—210", era: "赤壁鏖战", placeId: "jiangling", people: ["zhou-yu", "zhuge-liang", "liu-bei", "lu-su"], summary: "荆州争夺被改写为周瑜与诸葛亮三次斗智，最终以“既生瑜，何生亮”收束。", outcome: "周瑜病逝，鲁肃继任，孙刘关系继续在合作与冲突间摇摆。", history: "周瑜取南郡、谋西进和病卒有载；三气与临终名言均为文学创作。", allusion: "三气周瑜" },
  { id: "enter-yi", name: "刘备入川", date: "建安十六年 · 211", era: "三足鼎立", placeId: "fucheng", people: ["liu-bei", "liu-zhang", "pang-tong", "fa-zheng"], summary: "刘璋邀刘备入蜀御张鲁，益州内部迎刘力量推动局势转向。", outcome: "刘备由客军转为争夺益州，双方最终决裂。", history: "刘璋迎刘备、法正张松等谋迎和双方反目均有史载。" },
  { id: "falling-phoenix", name: "落凤坡", date: "建安十九年 · 214", era: "三足鼎立", placeId: "luofengpo", people: ["pang-tong", "liu-bei"], summary: "庞统在进军雒城途中中伏，凤雏陨落成为入蜀叙事的悲点。", outcome: "诸葛亮、张飞、赵云分路入蜀增援，成都包围加速。", history: "庞统攻雒县中流矢而死有载；落凤坡、错骑白马等细节为演义铺陈。", allusion: "落凤坡凤雏陨落" },
  { id: "dingjun", name: "定军山", date: "建安二十四年 · 219", era: "三足鼎立", placeId: "dingjun", people: ["huang-zhong", "xiahou-yuan", "fa-zheng", "liu-bei"], summary: "法正择机、黄忠突击，夏侯渊战死，汉中攻防发生决定性逆转。", outcome: "曹操不久撤出汉中，刘备控制战略门户。", history: "黄忠于定军山斩夏侯渊、刘备夺汉中有明确史载。", allusion: "老将定军山" },
  { id: "hanzhong-king", name: "汉中称王", date: "建安二十四年 · 219", era: "三足鼎立", placeId: "hanzhong", people: ["liu-bei", "zhuge-liang", "guan-yu", "zhang-fei", "zhao-yun"], summary: "刘备据有汉中后进位汉中王，蜀汉政权形态逐渐完备。", outcome: "刘备集团达到势力高峰，也引出关羽随后北伐襄樊。", history: "群臣上表、刘备自立汉中王和官爵安排均有史载。" },
  { id: "flood-seven-armies", name: "水淹七军", date: "建安二十四年 · 219 秋", era: "三足鼎立", placeId: "fancheng", people: ["guan-yu", "cao-cao", "lu-meng"], summary: "汉水暴涨，关羽擒于禁、斩庞德，威震华夏。", outcome: "曹操集团一度震动，孙权则加速从侧后袭取荆州。", history: "秋雨水涨、七军皆没与于禁投降有载；关羽对洪水的主动控制不宜过度解释。", allusion: "水淹七军" },
  { id: "white-robes", name: "白衣渡江", date: "建安二十四年 · 219 冬", era: "三足鼎立", placeId: "xunyang", people: ["lu-meng", "sun-quan", "guan-yu"], summary: "吕蒙隐蔽军队、沿江袭取公安江陵，关羽后方迅速瓦解。", outcome: "荆州易手，关羽失去退路。", history: "吕蒙称病、陆逊代防和兵至浔阳尽伏精兵于𦩷𦪇中有传载。", allusion: "白衣渡江" },
  { id: "maicheng", name: "败走麦城", date: "建安二十四年 · 219 冬", era: "三足鼎立", placeId: "maicheng", people: ["guan-yu", "lu-meng", "sun-quan", "cao-cao"], summary: "关羽从樊城撤退，部众离散，突围至临沮被俘。", outcome: "关羽父子遇害，蜀吴联盟彻底破裂。", history: "关羽退守麦城、突围被获与被杀有载；多处追逃细节为演义扩写。", allusion: "败走麦城" },
  { id: "cao-death", name: "曹操薨", date: "建安二十五年 · 220", era: "三足鼎立", placeId: "luoyang", people: ["cao-cao", "cao-pi", "sima-yi", "han-xiandi"], summary: "曹操病逝洛阳，曹丕继魏王与丞相之位。", outcome: "曹魏权力平稳交接，禅汉程序随即启动。", history: "曹操病逝、曹丕嗣位和后续禅让有本纪记载。" },
  { id: "liu-emperor", name: "刘备称帝", date: "章武元年 · 221", era: "三足鼎立", placeId: "chengdu", people: ["liu-bei", "zhuge-liang", "liu-shan"], summary: "曹丕代汉后，刘备在成都即皇帝位，国号汉。", outcome: "魏、汉、吴三方政治格局正式成形。", history: "刘备即位、建元章武有《先主传》记载。" },
  { id: "yiling", name: "夷陵之战", date: "章武二年 · 222", era: "三足鼎立", placeId: "yiling", people: ["liu-bei", "lu-xun", "sun-quan", "zhao-yun"], summary: "刘备东征孙吴，陆逊坚守数月后发动火攻，蜀军连营崩溃。", outcome: "刘备退至白帝城，吴蜀力量重新平衡并恢复联盟。", history: "刘备东征、陆逊统军和火烧连营均有明确史载。", allusion: "火烧连营" },
  { id: "baidi", name: "白帝托孤", date: "章武三年 · 223", era: "三足鼎立", placeId: "baidicheng", people: ["liu-bei", "zhuge-liang", "liu-shan", "zhao-yun"], summary: "刘备病重，在永安托刘禅与国事于诸葛亮。", outcome: "诸葛亮辅政，蜀汉进入后主时代。", history: "刘备托孤诸葛亮、李严有载；君臣对白见《诸葛亮传》。", allusion: "白帝城托孤" },
  { id: "seven-captures", name: "七擒孟获", date: "建兴三年 · 225", era: "三足鼎立", placeId: "nanzhong", people: ["zhuge-liang", "ma-su"], summary: "电视剧沿原著用七纵七擒表现攻心为上的南征方略。", outcome: "南中暂时安定，蜀汉获得北伐后方。", history: "诸葛亮南征平定四郡有载；七擒孟获主要见于后出材料，具体细节难证。", allusion: "七擒七纵" },
  { id: "memorial", name: "出师表", date: "建兴五年 · 227", era: "南征北伐", placeId: "hanzhong", people: ["zhuge-liang", "liu-shan", "jiang-wei"], summary: "诸葛亮驻汉中准备北伐，上表后主陈述治国、用人和报先帝之志。", outcome: "蜀军进入长期北伐阶段。", history: "《出师表》全文传统上见《诸葛亮传》，其写作与北伐背景明确。", allusion: "出师未捷身先死" },
  { id: "jieting", name: "街亭之失", date: "建兴六年 · 228", era: "南征北伐", placeId: "jieting", people: ["ma-su", "zhuge-liang", "zhang-he", "sima-yi"], summary: "马谡违背部署舍水上山，被张郃切断水道，街亭迅速失守。", outcome: "第一次北伐前线撤退，三郡复失。", history: "马谡违亮节度、张郃绝其汲道并大破之有载；司马懿当时并非街亭主将。", allusion: "失街亭" },
  { id: "empty-city", name: "空城计", date: "演义时序 · 228", era: "南征北伐", placeId: "jieting", people: ["zhuge-liang", "sima-yi"], summary: "兵力空虚之际，诸葛亮开门抚琴，以镇定迫使司马懿退军。", outcome: "撤军窗口被争取，智慧与谨慎成为一场心理对决。", history: "诸葛亮空城退司马懿不见正史，且当时两人战场位置难以对应。", allusion: "空城计" },
  { id: "ma-su-executed", name: "挥泪斩马谡", date: "建兴六年 · 228", era: "南征北伐", placeId: "hanzhong", people: ["zhuge-liang", "ma-su"], summary: "诸葛亮依法处置马谡，以私人知遇对照军法国政。", outcome: "诸葛亮自贬三等，蜀汉重整北伐体系。", history: "马谡败后被处置、诸葛亮自贬有载；马谡是狱中亡、被斩或逃亡后被获，史料表述不完全一致。", allusion: "挥泪斩马谡" },
  { id: "wooden-oxen", name: "木牛流马", date: "建兴九至十二年 · 231—234", era: "南征北伐", placeId: "qishan", people: ["zhuge-liang", "sima-yi", "jiang-wei"], summary: "蜀军以木牛流马转运粮草，演义进一步将其写成可复制、可夺取的机关器械。", outcome: "后勤能力提升，却仍无法消除远征粮道的结构性压力。", history: "诸葛亮作木牛流马有本传记载，具体构造和演义机关细节不可确知。", allusion: "木牛流马" },
  { id: "wuzhang", name: "秋风五丈原", date: "建兴十二年 · 234", era: "南征北伐", placeId: "wuzhangyuan", people: ["zhuge-liang", "sima-yi", "jiang-wei", "wei-yan"], summary: "诸葛亮与司马懿长期对峙，积劳病逝于五丈原军中。", outcome: "蜀军撤退，诸葛亮时代结束，魏延与杨仪冲突爆发。", history: "五丈原屯军、诸葛亮病卒和蜀军整齐撤退均有记载。", allusion: "星落五丈原" },
  { id: "gaoping", name: "高平陵之变", date: "正始十年 · 249", era: "南征北伐", placeId: "luoyang", people: ["sima-yi", "cao-zhen", "sima-zhao"], summary: "司马懿趁曹爽陪帝出城发动政变，控制洛阳。", outcome: "曹爽集团被诛，司马氏取得曹魏最高权力。", history: "政变经过与曹爽投降被诛有明确史载；曹真早已去世，此处作为宗室权力谱系关联。" },
  { id: "jiang-wei-campaigns", name: "姜维北伐", date: "延熙十六年至景耀五年 · 253—262", era: "三分归晋", placeId: "qishan", people: ["jiang-wei", "deng-ai", "liu-shan"], summary: "姜维多次出陇右与邓艾等交战，在进取与国力消耗之间争议日深。", outcome: "蜀汉内部疲弊，姜维退屯沓中，防御体系出现空隙。", history: "姜维多次出兵陇西、胜负往复均有本传；演义以“九伐中原”整齐化。" },
  { id: "sima-zhao-heart", name: "司马昭之心", date: "甘露五年 · 260", era: "三分归晋", placeId: "luoyang", people: ["sima-zhao", "sima-yan"], summary: "魏帝曹髦试图反抗司马昭控制，在宫门冲突中被杀。", outcome: "曹魏皇权名存实亡，司马氏代魏只待程序完成。", history: "曹髦言“司马昭之心，路人所知也”并率兵出宫遇害见《三国志》裴注及《资治通鉴》。", allusion: "路人皆知" },
  { id: "yinping", name: "偷渡阴平", date: "景元四年 · 263", era: "三分归晋", placeId: "yinping", people: ["deng-ai", "zhong-hui", "jiang-wei"], summary: "钟会受阻剑阁，邓艾率奇兵穿越阴平险道直入蜀腹。", outcome: "魏军出现在成都平原北缘，蜀汉常规防线被绕过。", history: "邓艾自阴平行无人之地七百余里、裹毡滚谷等险行有传载。", allusion: "偷渡阴平" },
  { id: "shu-falls", name: "蜀汉灭亡", date: "炎兴元年 · 263", era: "三分归晋", placeId: "chengdu", people: ["liu-shan", "deng-ai", "jiang-wei", "zhong-hui"], summary: "诸葛瞻败于绵竹后，邓艾兵临成都，刘禅接受谯周建议投降。", outcome: "蜀汉灭亡；姜维随后借钟会之乱尝试复国而失败。", history: "绵竹战败、刘禅出降和钟会姜维之乱均有多传互证。" },
  { id: "three-to-jin", name: "三国归晋", date: "太康元年 · 280", era: "三分归晋", placeId: "jianye", people: ["sima-yan", "sun-quan"], summary: "西晋多路伐吴，王濬楼船东下，吴主孙皓出降。", outcome: "自汉末分裂近百年的天下重新统一，三国时代落幕。", history: "晋灭吴的部署、进军和孙皓投降见《晋书》《三国志》相关纪传；孙权作为孙吴政权源头关联。", allusion: "三分归一统", historyCite: "《晋书·武帝纪》；《三国志·吴书·三嗣主传》" },
];

const placeIndex = new Map(places.map((place) => [place.id, place]));

const eventBaikeEntries: Record<string, string> = {
  "yellow-turban": "黄巾起义",
  "peach-garden": "桃园三结义",
  "eunuch-coup": "十常侍之乱",
  "cao-dagger": "孟德献刀",
  coalition: "讨伐董卓",
  "hua-xiong": "温酒斩华雄",
  "three-vs-lu": "三英战吕布",
  "beauty-scheme": "连环计",
  wancheng: "宛城之战",
  "white-gate": "白门楼",
  "heroes-wine": "青梅煮酒论英雄",
  "girdle-edict": "衣带诏",
  guandu: "官渡之战",
  "three-visits": "三顾茅庐",
  "bowang-fire": "火烧博望坡",
  changban: "长坂坡之战",
  "debate-scholars": "舌战群儒",
  "straw-boats": "草船借箭",
  "bitter-chain": "苦肉计",
  "east-wind": "借东风",
  "red-cliffs-battle": "赤壁之战",
  huarong: "华容道",
  "zhou-yu-thrice": "三气周瑜",
  "enter-yi": "刘备入川",
  "falling-phoenix": "落凤坡",
  dingjun: "定军山之战",
  "flood-seven-armies": "水淹七军",
  "white-robes": "白衣渡江",
  maicheng: "败走麦城",
  yiling: "夷陵之战",
  baidi: "白帝城托孤",
  "seven-captures": "七擒孟获",
  memorial: "出师表",
  jieting: "街亭之战",
  "empty-city": "空城计",
  "ma-su-executed": "挥泪斩马谡",
  "wooden-oxen": "木牛流马",
  wuzhang: "五丈原之战",
  gaoping: "高平陵之变",
  "jiang-wei-campaigns": "姜维北伐",
  "sima-zhao-heart": "司马昭之心，路人皆知",
  yinping: "偷渡阴平",
  "shu-falls": "魏灭蜀之战",
  "three-to-jin": "晋灭吴之战",
};

export const events: StoryEvent[] = eventSeeds.map((seed, stage) => {
  const place = placeIndex.get(seed.placeId);
  const nudge = ((stage % 3) - 1) * 0.9;
  return {
    ...seed,
    summary: makeBoundedIntroduction([
      seed.summary,
      seed.outcome,
      seed.history,
    ]),
    baikeUrl: eventBaikeEntries[seed.id]
      ? baikeItemUrl(eventBaikeEntries[seed.id])
      : undefined,
    image: `/images/events/${seed.id}.webp`,
    stage,
    position: {
      x: Math.max(4, Math.min(96, (place?.position.x ?? 50) + nudge)),
      y: Math.max(8, Math.min(90, (place?.position.y ?? 50) - nudge * 0.55)),
    },
    sources: {
      drama: {
        title: "荧屏叙事",
        body: `央视 1994 年版以“${seed.name}”组织人物行动与情绪高潮：${seed.summary}`,
        cite: "央视 1994 年版《三国演义》相关段落",
      },
      novel: {
        title: seed.allusion ? `典故：${seed.allusion}` : "章回叙事",
        body: seed.allusion
          ? `原著通过“${seed.allusion}”强化计谋、性格与因果，使这一节点成为后世最熟悉的三国记忆之一。`
          : "原著在史实骨架上重排场面、对白与人物动机，使事件更适合连续章回叙事。",
        cite: "罗贯中《三国演义》相关回目",
      },
      history: {
        title: "史料边界",
        body: seed.history,
        cite: seed.historyCite ?? "陈寿《三国志》相关纪传；司马光《资治通鉴》相关卷次",
      },
    },
  };
});

export const moments: Moment[] = events.map((event) => ({
  id: `moment-${event.id}`,
  title: event.name,
  date: event.date,
  era: event.era,
  eventId: event.id,
  summary: event.summary,
  focalPlace: placeIndex.get(event.placeId)?.name ?? "天下",
}));

export const relations: Relation[] = [
  { from: "liu-bei", to: "guan-yu", label: "兄弟", type: "kinship", start: 0, end: 33, source: "novel" },
  { from: "liu-bei", to: "zhang-fei", label: "兄弟", type: "kinship", start: 0, end: 35, source: "novel" },
  { from: "guan-yu", to: "zhang-fei", label: "兄弟", type: "kinship", start: 0, end: 33, source: "novel" },
  { from: "dong-zhuo", to: "lu-bu", label: "义父子", type: "command", start: 3, end: 9, source: "history" },
  { from: "wang-yun", to: "lu-bu", label: "共谋", type: "alliance", start: 8, end: 9, source: "history" },
  { from: "diaochan", to: "lu-bu", label: "情系", type: "alliance", start: 8, end: 9, source: "novel" },
  { from: "diaochan", to: "dong-zhuo", label: "离间", type: "rivalry", start: 8, end: 9, source: "novel" },
  { from: "cao-cao", to: "yuan-shao", label: "争霸", type: "hostile", start: 5, end: 15, source: "history" },
  { from: "cao-cao", to: "han-xiandi", label: "奉迎／控制", type: "command", start: 10, end: 34, source: "history" },
  { from: "cao-cao", to: "xun-yu", label: "君臣", type: "command", start: 10, end: 26, source: "history" },
  { from: "cao-cao", to: "guo-jia", label: "倚重", type: "command", start: 10, end: 19, source: "history" },
  { from: "cao-cao", to: "jia-xu", label: "纳策", type: "command", start: 11, end: 34, source: "history" },
  { from: "lu-bu", to: "chen-gong", label: "主从", type: "command", start: 10, end: 12, source: "history" },
  { from: "liu-bei", to: "cao-cao", label: "竞逐", type: "hostile", start: 12, end: 34, source: "history" },
  { from: "liu-bei", to: "zhuge-liang", label: "君臣知遇", type: "command", start: 17, end: 37, source: "history" },
  { from: "sun-quan", to: "zhou-yu", label: "授兵", type: "command", start: 20, end: 26, source: "history" },
  { from: "sun-quan", to: "lu-su", label: "纳策", type: "command", start: 20, end: 31, source: "history" },
  { from: "liu-bei", to: "sun-quan", label: "联盟", type: "alliance", start: 20, end: 31, source: "history" },
  { from: "zhuge-liang", to: "sun-quan", label: "出使", type: "alliance", start: 20, end: 24, source: "history" },
  { from: "zhou-yu", to: "zhuge-liang", label: "竞合", type: "rivalry", start: 20, end: 26, source: "novel" },
  { from: "zhou-yu", to: "huang-gai", label: "火攻", type: "command", start: 22, end: 24, source: "history" },
  { from: "pang-tong", to: "cao-cao", label: "连环", type: "rivalry", start: 22, end: 23, source: "novel" },
  { from: "cao-cao", to: "sun-quan", label: "对峙", type: "hostile", start: 20, end: 35, source: "history" },
  { from: "liu-bei", to: "liu-zhang", label: "反客为主", type: "hostile", start: 27, end: 28, source: "history" },
  { from: "liu-bei", to: "pang-tong", label: "倚为谋主", type: "command", start: 27, end: 28, source: "history" },
  { from: "liu-bei", to: "fa-zheng", label: "倚为谋主", type: "command", start: 27, end: 35, source: "history" },
  { from: "huang-zhong", to: "xiahou-yuan", label: "定军决战", type: "hostile", start: 29, end: 29, source: "history" },
  { from: "guan-yu", to: "lu-meng", label: "荆州对手", type: "hostile", start: 31, end: 33, source: "history" },
  { from: "sun-quan", to: "lu-meng", label: "授命袭荆", type: "command", start: 31, end: 33, source: "history" },
  { from: "liu-bei", to: "lu-xun", label: "夷陵对阵", type: "hostile", start: 36, end: 36, source: "history" },
  { from: "liu-bei", to: "liu-shan", label: "父子", type: "kinship", start: 35, end: 37, source: "history" },
  { from: "zhuge-liang", to: "liu-shan", label: "托孤辅政", type: "command", start: 37, end: 44, source: "history" },
  { from: "zhuge-liang", to: "ma-su", label: "知遇／军法", type: "command", start: 38, end: 42, source: "history" },
  { from: "zhuge-liang", to: "sima-yi", label: "长期对峙", type: "hostile", start: 40, end: 44, source: "history" },
  { from: "zhuge-liang", to: "jiang-wei", label: "器重传承", type: "command", start: 40, end: 44, source: "novel" },
  { from: "sima-yi", to: "sima-zhao", label: "父子权力", type: "kinship", start: 45, end: 47, source: "history" },
  { from: "jiang-wei", to: "deng-ai", label: "陇右争锋", type: "hostile", start: 46, end: 49, source: "history" },
  { from: "jiang-wei", to: "zhong-hui", label: "诈降合谋", type: "alliance", start: 48, end: 49, source: "history" },
  { from: "sima-zhao", to: "deng-ai", label: "伐蜀授命", type: "command", start: 48, end: 49, source: "history" },
  { from: "sima-zhao", to: "zhong-hui", label: "伐蜀授命", type: "command", start: 48, end: 49, source: "history" },
  { from: "sima-zhao", to: "sima-yan", label: "父子继承", type: "kinship", start: 47, end: 50, source: "history" },
];

export const eras = Array.from(new Set(moments.map((moment) => moment.era)));

export const tours = [
  {
    id: "red-cliffs",
    title: "十分钟看懂赤壁",
    subtitle: "从长坂败局到华容余波",
    stages: [19, 20, 21, 22, 23, 24, 25],
  },
  {
    id: "liu-bei-life",
    title: "刘备：从涿郡到白帝",
    subtitle: "流寓、联盟、立国与托孤",
    stages: [1, 12, 17, 19, 24, 27, 30, 35, 36, 37],
  },
  {
    id: "cao-north",
    title: "曹操统一北方",
    subtitle: "名分、人才与关键战役",
    stages: [4, 5, 10, 11, 12, 13, 15, 24, 34],
  },
  {
    id: "shu-northern",
    title: "蜀汉北伐长卷",
    subtitle: "出师、街亭、五丈原与姜维",
    stages: [39, 40, 41, 42, 43, 44, 46, 48, 49],
  },
  {
    id: "sun-jiangdong",
    title: "孙氏经营江东",
    subtitle: "猛虎创业、赤壁立国与夷陵守成",
    stages: [5, 20, 24, 31, 32, 36, 50],
  },
  {
    id: "jingzhou",
    title: "荆州归属变迁",
    subtitle: "隆中、赤壁、襄樊与麦城",
    stages: [17, 19, 24, 26, 27, 31, 32, 33, 36],
  },
  {
    id: "sima-rise",
    title: "司马氏通往一统",
    subtitle: "对蜀、政变、代魏与灭吴",
    stages: [40, 44, 45, 47, 48, 49, 50],
  },
];

export const personById = (id: string) =>
  people.find((person) => person.id === id);
export const eventById = (id: string) =>
  events.find((event) => event.id === id);
export const placeById = (id: string) =>
  places.find((place) => place.id === id);
