import { Context, Schema } from 'koishi';

export const name = 'splendor';


export interface Config { }
export const Config: Schema<Config> = Schema.object({});

const GEM_COLORS = ['red', 'blue', 'green', 'black', 'white'] as const;
type GemColor = (typeof GEM_COLORS)[number];
type GemBag = Record<GemColor, number>;
type CardLevel = 1 | 2 | 3;

interface Card
{
  id: string;
  title: string;
  level: CardLevel;
  color: GemColor;
  prestige: number;
  cost: Partial<GemBag>;
}

interface Noble
{
  id: string;
  title: string;
  prestige: number;
  requirement: Partial<GemBag>;
}

interface PlayerState
{
  id: string;
  name: string;
  gems: GemBag;
  gold: number;
  prestige: number;
  cards: Card[];
  reserved: Card[];
  nobles: string[];
}

interface RoomState
{
  id: string;
  name: string;
  ownerId: string;
  players: PlayerState[];
  started: boolean;
  currentTurn: number;
  round: number;
  pool: GemBag;
  goldPool: number;
  board: Record<CardLevel, Card[]>;
  deck: Record<CardLevel, Card[]>;
  nobles: Noble[];
  log: string[];
  winner?: string;
}

export function apply(ctx: Context, config: Config)
{

  const rooms = new Map<string, RoomState>();
  const endGameVotes = new Map<string, Set<string>>();

  const CARD_LIBRARY: Record<CardLevel, Card[]> = {
    1: [
      { id: 'L1-01', title: '青石小径', level: 1, color: 'green', prestige: 0, cost: { blue: 1 } },
      { id: 'L1-02', title: '海盐栈桥', level: 1, color: 'blue', prestige: 0, cost: { white: 1 } },
      { id: 'L1-03', title: '朱红花田', level: 1, color: 'red', prestige: 0, cost: { green: 1 } },
      { id: 'L1-04', title: '黑曜盆栽', level: 1, color: 'black', prestige: 0, cost: { red: 1 } },
      { id: 'L1-05', title: '银雪商铺', level: 1, color: 'white', prestige: 0, cost: { black: 1 } },
      { id: 'L1-06', title: '琉璃仆役', level: 1, color: 'blue', prestige: 1, cost: { red: 1, white: 1 } },
      { id: 'L1-07', title: '守夜石阶', level: 1, color: 'black', prestige: 1, cost: { white: 1, green: 1 } },
      { id: 'L1-08', title: '绯红果园', level: 1, color: 'red', prestige: 1, cost: { blue: 1, black: 1 } },
      { id: 'L1-09', title: '薄暮庭院', level: 1, color: 'green', prestige: 1, cost: { blue: 1, red: 1 } },
      { id: 'L1-10', title: '清晨古道', level: 1, color: 'white', prestige: 1, cost: { red: 1, green: 1 } },
      { id: 'L1-11', title: '琥珀商队', level: 1, color: 'red', prestige: 2, cost: { blue: 2 } },
      { id: 'L1-12', title: '远海灯塔', level: 1, color: 'blue', prestige: 2, cost: { green: 2 } },
    ],
    2: [
      { id: 'L2-01', title: '绚彩帆船', level: 2, color: 'blue', prestige: 2, cost: { white: 2, red: 2 } },
      { id: 'L2-02', title: '白金花棚', level: 2, color: 'white', prestige: 2, cost: { green: 2, blue: 2 } },
      { id: 'L2-03', title: '深林祭坛', level: 2, color: 'green', prestige: 2, cost: { red: 2, black: 2 } },
      { id: 'L2-04', title: '殷红港湾', level: 2, color: 'red', prestige: 2, cost: { blue: 2, white: 2 } },
      { id: 'L2-05', title: '黯黑钟塔', level: 2, color: 'black', prestige: 2, cost: { green: 2, white: 2 } },
      { id: 'L2-06', title: '月光博物馆', level: 2, color: 'white', prestige: 3, cost: { red: 2, blue: 2, black: 1 } },
      { id: 'L2-07', title: '星辰宫殿', level: 2, color: 'blue', prestige: 3, cost: { green: 2, red: 2, white: 1 } },
      { id: 'L2-08', title: '太阳广场', level: 2, color: 'red', prestige: 3, cost: { green: 2, black: 2, blue: 1 } },
      { id: 'L2-09', title: '森林观测站', level: 2, color: 'green', prestige: 3, cost: { white: 2, red: 2, black: 1 } },
      { id: 'L2-10', title: '暗夜指挥塔', level: 2, color: 'black', prestige: 3, cost: { blue: 2, green: 2, white: 1 } },
      { id: 'L2-11', title: '宝石工坊', level: 2, color: 'green', prestige: 4, cost: { blue: 3, red: 2, white: 2 } },
      { id: 'L2-12', title: '王冠宝座', level: 2, color: 'black', prestige: 4, cost: { red: 3, green: 2, blue: 2 } },
    ],
    3: [
      { id: 'L3-01', title: '王者会客厅', level: 3, color: 'red', prestige: 4, cost: { blue: 3, black: 3, white: 2 } },
      { id: 'L3-02', title: '神谕秘库', level: 3, color: 'blue', prestige: 4, cost: { green: 3, red: 3, black: 2 } },
      { id: 'L3-03', title: '碧空王座', level: 3, color: 'green', prestige: 4, cost: { white: 3, blue: 3, red: 2 } },
      { id: 'L3-04', title: '黑金议会', level: 3, color: 'black', prestige: 4, cost: { green: 3, white: 3, blue: 2 } },
      { id: 'L3-05', title: '白银圣堂', level: 3, color: 'white', prestige: 4, cost: { red: 3, green: 3, black: 2 } },
      { id: 'L3-06', title: '星曜宝典', level: 3, color: 'blue', prestige: 5, cost: { red: 3, green: 3, white: 2, black: 2 } },
      { id: 'L3-07', title: '日冕大殿', level: 3, color: 'red', prestige: 5, cost: { white: 3, blue: 3, green: 2, black: 2 } },
      { id: 'L3-08', title: '极光祭坛', level: 3, color: 'green', prestige: 5, cost: { black: 3, red: 3, blue: 2, white: 2 } },
      { id: 'L3-09', title: '银月角斗场', level: 3, color: 'white', prestige: 5, cost: { green: 3, black: 3, blue: 2, red: 2 } },
      { id: 'L3-10', title: '暗影宫廷', level: 3, color: 'black', prestige: 5, cost: { white: 3, red: 3, green: 2, blue: 2 } },
      { id: 'L3-11', title: '宝石之王', level: 3, color: 'red', prestige: 6, cost: { blue: 4, green: 4, white: 3 } },
      { id: 'L3-12', title: '璀璨王冠', level: 3, color: 'white', prestige: 6, cost: { red: 4, black: 4, green: 3 } },
    ],
  };

  const NOBLES: Noble[] = [
    { id: 'N-01', title: '石之守护', prestige: 3, requirement: { red: 4 } },
    { id: 'N-02', title: '海之诚意', prestige: 3, requirement: { blue: 4 } },
    { id: 'N-03', title: '林之盟约', prestige: 3, requirement: { green: 4 } },
    { id: 'N-04', title: '夜之教条', prestige: 3, requirement: { black: 4 } },
    { id: 'N-05', title: '晨之誓言', prestige: 3, requirement: { white: 4 } },
    { id: 'N-06', title: '宝石贵族', prestige: 3, requirement: { red: 3, blue: 3 } },
    { id: 'N-07', title: '绿野领主', prestige: 3, requirement: { green: 3, white: 3 } },
    { id: 'N-08', title: '星芒君王', prestige: 3, requirement: { black: 3, red: 3 } },
  ];

  function createEmptyGemBag(): GemBag
  {
    return { red: 0, blue: 0, green: 0, black: 0, white: 0 };
  }

  function shuffle<T>(items: T[]): T[]
  {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function fillBoard(room: RoomState, level: CardLevel): void
  {
    const deck = room.deck[level];
    const board = room.board[level];
    while (board.length < 4 && deck.length > 0)
    {
      board.push(deck.shift()!);
    }
  }

  function getRoomByUser(rooms: Map<string, RoomState>, userId: string): RoomState | undefined
  {
    for (const room of rooms.values())
    {
      if (room.players.some(player => player.id === userId)) return room;
    }
    return undefined;
  }

  function ensureRoom(rooms: Map<string, RoomState>, roomId: string): RoomState
  {
    const room = rooms.get(roomId);
    if (!room) throw new Error(`房间 ${roomId} 不存在。`);
    return room;
  }

  function getPlayerByUser(room: RoomState, userId: string): PlayerState | undefined
  {
    return room.players.find(player => player.id === userId);
  }

  const GEM_EMOJIS: Record<GemColor, string> = {
    red: '🔴',
    blue: '🔵',
    green: '🟢',
    black: '⚫',
    white: '⚪',
  };

  function formatGemColor(color: GemColor): string
  {
    return `${GEM_EMOJIS[color]}${color}`;
  }

  function formatGemSummary(gems: GemBag): string
  {
    return GEM_COLORS.map(color => `${formatGemColor(color)}:${gems[color]}`).join(' / ');
  }

  function formatMemberList(room: RoomState): string
  {
    return room.players.map((player, index) => `${index + 1}. ${player.name} (${player.id})`).join('\n');
  }

  function formatCost(cost: Partial<GemBag>): string
  {
    const entries = GEM_COLORS.map(color =>
    {
      const count = cost[color] ?? 0;
      return count > 0 ? `${formatGemColor(color)}:${count}` : null;
    }).filter(Boolean) as string[];
    return entries.length ? entries.join(', ') : '无';
  }

  function formatBoard(level: CardLevel, cards: Card[]): string
  {
    if (!cards.length) return `第${level}层：暂无卡牌`;
    return cards.map((card, index) => `${index + 1}. ${card.title} [${formatGemColor(card.color)}] 声望:${card.prestige} 成本:${formatCost(card.cost)}`).join('\n');
  }

  function formatNobleCards(nobles: Noble[]): string
  {
    if (!nobles.length) return '暂无贵族牌';
    return nobles.map((noble, index) => `${index + 1}. 👑 ${noble.title} 声望:${noble.prestige} 条件:${formatCost(noble.requirement)}`).join('\n');
  }

  function formatPlayerSummary(player: PlayerState): string
  {
    return `${player.name}：宝石 ${formatGemSummary(player.gems)} / 黄金 ${player.gold} / 声望 ${player.prestige} / 已购 ${player.cards.length} / 预留 ${player.reserved.length}`;
  }

  function canAfford(player: PlayerState, cost: Partial<GemBag>): boolean
  {
    let goldNeeded = 0;
    for (const color of GEM_COLORS)
    {
      const required = cost[color] ?? 0;
      const owned = player.gems[color] ?? 0;
      if (required > owned) goldNeeded += required - owned;
    }
    return goldNeeded <= player.gold;
  }

  function payCost(player: PlayerState, cost: Partial<GemBag>): void
  {
    let goldNeeded = 0;
    for (const color of GEM_COLORS)
    {
      const required = cost[color] ?? 0;
      const owned = player.gems[color] ?? 0;
      if (required > owned) goldNeeded += required - owned;
    }
    if (goldNeeded > player.gold) throw new Error('黄金不足，无法支付');

    for (const color of GEM_COLORS)
    {
      const required = cost[color] ?? 0;
      const owned = player.gems[color] ?? 0;
      player.gems[color] = Math.max(0, owned - required);
    }
    player.gold -= goldNeeded;
  }

  function checkNobles(room: RoomState, player: PlayerState): void
  {
    const unlocked = room.nobles.filter(noble => !player.nobles.includes(noble.id) && GEM_COLORS.every(color => (player.gems[color] ?? 0) >= (noble.requirement[color] ?? 0)));
    for (const noble of unlocked)
    {
      player.nobles.push(noble.id);
      player.prestige += noble.prestige;
      room.log.push(`${player.name} 获得贵族 ${noble.title}`);
    }
  }

  function checkWinner(room: RoomState): boolean
  {
    for (const player of room.players)
    {
      if (player.prestige >= 15)
      {
        room.winner = player.name;
        return true;
      }
    }
    return false;
  }

  function advanceTurn(room: RoomState): void
  {
    room.currentTurn = (room.currentTurn + 1) % room.players.length;
    room.round += room.currentTurn === 0 ? 1 : 0;
    room.log.push(`轮到 ${room.players[room.currentTurn].name} 行动`);
  }

  function describeAvailableBoard(room: RoomState): string
  {
    return ([1, 2, 3] as CardLevel[]).map(level =>
    {
      const cards = room.board[level];
      if (!cards.length) return `第${level}层：暂无卡牌`;
      const entries = cards.map((card, index) => `${index + 1}.${card.title}(${formatGemColor(card.color)}) 需:${formatCost(card.cost)} 声望:${card.prestige}`).join('；');
      return `第${level}层：${entries}`;
    }).join('\n') + `\n贵族牌：\n${formatNobleCards(room.nobles)}`;
  }


  function createRandomRoomId(): string
  {
    return `SPL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  function getUserId(session: any): string
  {
    return session?.userId || session?.uid || 'unknown';
  }

  function getUserName(session: any): string
  {
    return session?.username || '未知玩家';
  }

  function isRoomId(value?: string): boolean
  {
    return !!value && /^SPL-[A-Z0-9]+$/i.test(value);
  }

  function isGemColor(value?: string): boolean
  {
    return !!value && (GEM_COLORS as readonly string[]).includes(value.toLowerCase());
  }

  function resolveRoomBySession(session: any, roomId?: string): RoomState | undefined
  {
    const userId = getUserId(session);
    if (roomId && isRoomId(roomId))
    {
      try
      {
        return ensureRoom(rooms, roomId);
      } catch
      {
        return undefined;
      }
    }
    return getRoomByUser(rooms, userId);
  }

  function startGame(room: RoomState): void
  {
    endGameVotes.delete(room.id);
    room.started = true;
    room.currentTurn = 0;
    room.round = 1;
    room.pool = { red: 4, blue: 4, green: 4, black: 4, white: 4 };
    room.goldPool = 5;
    room.nobles = shuffle(NOBLES).slice(0, 3);
    room.players.forEach(player =>
    {
      player.gems = createEmptyGemBag();
      player.gold = 0;
      player.prestige = 0;
      player.cards = [];
      player.reserved = [];
      player.nobles = [];
    });

    room.deck = {
      1: shuffle(CARD_LIBRARY[1]),
      2: shuffle(CARD_LIBRARY[2]),
      3: shuffle(CARD_LIBRARY[3]),
    };
    room.board = { 1: [], 2: [], 3: [] };
    for (const level of [1, 2, 3] as CardLevel[])
    {
      fillBoard(room, level);
    }
    room.log.push(`游戏开始，当前行动：${room.players[0].name}`);
  }

  ctx.command('splendor', '璀璨宝石');

  ctx.command('splendor', '璀璨宝石').subcommand('.create [roomName:text]', '创建房间')
    .example('splendor.create 玫瑰王座')
    .action(async ({ session }, roomName) =>
    {
      const userId = getUserId(session);
      const userName = getUserName(session);
      if (getRoomByUser(rooms, userId))
      {
        return `${userName} 你已经在房间中，不能重复创建。`;
      }

      const room: RoomState = {
        id: createRandomRoomId(),
        name: roomName || `${userName}的璀璨宝石厅`,
        ownerId: userId,
        players: [{
          id: userId,
          name: userName,
          gems: createEmptyGemBag(),
          gold: 0,
          prestige: 0,
          cards: [],
          reserved: [],
          nobles: [],
        }],
        started: false,
        currentTurn: 0,
        round: 1,
        pool: createEmptyGemBag(),
        goldPool: 5,
        board: { 1: [], 2: [], 3: [] },
        deck: { 1: [], 2: [], 3: [] },
        nobles: [],
        log: [`${userName} 创建了房间`],
      };

      rooms.set(room.id, room);
      return `房间创建成功！\n房间名：${room.name}\n房间号：${room.id}\n房主：${userName}\n加入方式：splendor.join ${room.id}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.join <roomId:text>', '加入房间')
    .example('splendor.join SPL-ABCD12')
    .action(async ({ session }, roomId) =>
    {
      const userId = getUserId(session);
      const userName = getUserName(session);
      if (getRoomByUser(rooms, userId))
      {
        return `${userName} 你已经在其他房间中，不能重复加入。`;
      }

      let room: RoomState;
      try
      {
        room = ensureRoom(rooms, roomId);
      } catch
      {
        return `房间 ${roomId} 不存在。`;
      }

      if (room.started)
      {
        return `房间 ${room.id} 已经开始游戏，不能再加入。`;
      }
      if (room.players.length >= 4)
      {
        return `房间 ${room.id} 已满员，当前人数：${room.players.length}/4。`;
      }

      room.players.push({
        id: userId,
        name: userName,
        gems: createEmptyGemBag(),
        gold: 0,
        prestige: 0,
        cards: [],
        reserved: [],
        nobles: [],
      });
      room.log.push(`${userName} 加入房间`);
      return `${userName} 已加入房间 ${room.id}。\n当前成员：\n${formatMemberList(room)}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.room [roomId:text]', '查看房间成员')
    .example('splendor.room')
    .action(async ({ session }, roomId) =>
    {
      const userId = getUserId(session);
      const room = roomId ? (() =>
      {
        try { return ensureRoom(rooms, roomId); } catch { return undefined; }
      })() : getRoomByUser(rooms, userId);
      if (!room) return '你当前不在任何房间。';
      const host = room.players.find(player => player.id === room.ownerId)?.name || '未知房主';
      return `房间名：${room.name}\n房间号：${room.id}\n房主：${host}\n状态：${room.started ? '已开始' : '等待中'}\n成员列表：\n${formatMemberList(room)}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.start [roomId:text]', '房主开始游戏')
    .example('splendor.start')
    .action(async ({ session }, roomId) =>
    {
      const userId = getUserId(session);
      const room = roomId ? (() =>
      {
        try { return ensureRoom(rooms, roomId); } catch { return undefined; }
      })() : getRoomByUser(rooms, userId);
      if (!room) return '你当前不在任何房间。';
      if (room.ownerId !== userId) return `只有房主才能开始游戏。`;
      if (room.players.length < 2 || room.players.length > 4) return '正式璀璨宝石支持 2–4 人游戏。';
      if (room.started) return `房间 ${room.id} 已经开始了。`;

      startGame(room);
      const current = room.players[room.currentTurn];
      const gemPoolText = formatGemSummary(room.pool);
      const boardText = describeAvailableBoard(room);
      return `游戏开始！\n房间：${room.name}\n当前行动：${current.name}\n\n操作说明：\n- 💎 take：取得宝石。规则为“3个同色”或“2个不同颜色”。\n  当前宝石池：${gemPoolText}\n- 🛒 buy：购买卡牌。可购买的卡牌如下：\n${boardText}\n- 🧾 reserve：预留卡牌，预留后可获得 1 枚黄金。\n- ⏭️ end：结束当前回合，轮到下一位玩家。\n\n可执行示例（需要带房间号）：\n- 💎 splendor.take ${room.id} red blue\n- 🛒 splendor.buy ${room.id} 1 1\n- 🧾 splendor.reserve ${room.id} 2 1\n- ⏭️ splendor.end ${room.id}\n\n注：已在当前房间中时，也可直接省略房间号，例如：splendor.take red blue`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.status [roomId:text]', '查看当前游戏状态')
    .example('splendor.status')
    .action(async ({ session }, roomId) =>
    {
      const room = resolveRoomBySession(session, roomId);
      if (!room) return '你当前不在任何房间。';
      if (!room.started) return `房间 ${room.id} 还未开始，当前成员：\n${formatMemberList(room)}`;

      const summaries = room.players.map((player, index) =>
      {
        const marker = index === room.currentTurn ? '【当前行动】' : '  ';
        return `${marker}${formatPlayerSummary(player)}`;
      }).join('\n');

      const boardText = ([1, 2, 3] as CardLevel[]).map(level =>
        `第${level}层：\n${formatBoard(level, room.board[level])}`,
      ).join('\n\n');

      const nobleText = formatNobleCards(room.nobles);
      return `房间：${room.name}\n轮数：${room.round}\n当前行动：${room.players[room.currentTurn].name}\n宝石池：${formatGemSummary(room.pool)} / 黄金池：${room.goldPool}\n\n玩家：\n${summaries}\n\n牌桌：\n${boardText}\n\n贵族牌：\n${nobleText}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.take [roomId:text] [gems:text]', '抽取宝石')
    .example('splendor.take SPL-ABCD12 red blue')
    .action(async ({ session }, roomId, gems) =>
    {
      const userId = getUserId(session);
      let targetRoomId: string | undefined = roomId;
      let targetGems = gems;

      if (roomId && !isRoomId(roomId) && targetGems)
      {
        targetRoomId = undefined;
        targetGems = `${roomId} ${targetGems}`;
      } else if (roomId && !isRoomId(roomId) && !targetGems)
      {
        targetRoomId = undefined;
        targetGems = roomId;
      }

      const room = resolveRoomBySession(session, targetRoomId);
      if (!room) return '你当前不在任何房间。';
      const player = getPlayerByUser(room, userId);
      if (!player) return '你不在这个房间里。';
      if (!room.started) return '游戏尚未开始。';
      if (room.winner) return `${room.winner} 已经获得胜利，游戏已结束。`;
      if (room.players[room.currentTurn].id !== userId) return `当前轮到 ${room.players[room.currentTurn].name} 行动。`;

      const selected = (targetGems || '').split(/\s+/).map(color => color.trim().toLowerCase()).filter(Boolean);
      if (!selected.length) return '请指定要拿取的宝石颜色。';
      const invalid = selected.filter(color => !GEM_COLORS.includes(color as GemColor));
      if (invalid.length) return `颜色不合法，允许：${GEM_COLORS.join('、')}。`;

      const unique = [...new Set(selected)];
      const chosen = unique as GemColor[];

      if (selected.length === 3 && chosen.length === 1)
      {
        const color = chosen[0];
        if (room.pool[color] < 3) return `${color} 宝石不足，无法取 3 个同色。`;
        room.pool[color] -= 3;
        player.gems[color] += 3;
      } else if (selected.length === 2 && chosen.length === 2)
      {
        for (const color of chosen)
        {
          if (room.pool[color] <= 0) return `${color} 宝石不足，无法同时拿取这些宝石。`;
          room.pool[color] -= 1;
          player.gems[color] += 1;
        }
      } else
      {
        return '正式规则：一次只能取 3 个同色，或者 2 个不同颜色。';
      }

      room.log.push(`${player.name} 抽取了 ${selected.join('、')} 宝石`);
      advanceTurn(room);
      return `${player.name} 抽取成功：${selected.join('、')}。\n当前行动：${room.players[room.currentTurn].name}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.buy [roomId:text] [level:text] [slot:text]', '购买卡牌')
    .example('splendor.buy SPL-ABCD12 1 2')
    .action(async ({ session }, roomId, level, slot) =>
    {
      const userId = getUserId(session);
      let targetRoomId: string | undefined = roomId;
      let targetLevel = level;
      let targetSlot: string | undefined = slot;

      if (roomId && !isRoomId(roomId) && level && !slot)
      {
        targetRoomId = undefined;
        targetLevel = roomId;
        targetSlot = level;
      } else if (roomId && !isRoomId(roomId) && !level && !slot)
      {
        targetRoomId = undefined;
        targetLevel = roomId;
        targetSlot = undefined;
      }

      const room = resolveRoomBySession(session, targetRoomId);
      if (!room) return '你当前不在任何房间。';

      const player = getPlayerByUser(room, userId);
      if (!player) return '你不在这个房间里。';
      if (!room.started) return '游戏尚未开始。';
      if (room.winner) return `${room.winner} 已经获得胜利，游戏已结束。`;
      if (room.players[room.currentTurn].id !== userId) return `当前轮到 ${room.players[room.currentTurn].name} 行动。`;

      const cardLevel = Number(targetLevel) as CardLevel;
      const slotIndex = Number(targetSlot);
      if (!([1, 2, 3] as number[]).includes(cardLevel)) return '卡牌层级必须是 1、2 或 3。';
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > room.board[cardLevel].length)
      {
        return `第 ${cardLevel} 层没有编号为 ${targetSlot} 的卡牌。`;
      }

      const card = room.board[cardLevel][slotIndex - 1];
      if (!card) return '该卡牌不存在。';
      if (!canAfford(player, card.cost))
      {
        return `你无法支付 ${card.title} 的成本：${formatCost(card.cost)}。`;
      }

      payCost(player, card.cost);
      player.cards.push(card);
      player.prestige += card.prestige;
      room.board[cardLevel].splice(slotIndex - 1, 1);
      fillBoard(room, cardLevel);
      checkNobles(room, player);
      room.log.push(`${player.name} 购买了 ${card.title}`);

      if (checkWinner(room))
      {
        return `${player.name} 成功购买 ${card.title}，并达到胜利条件！\n总声望：${player.prestige}`;
      }

      advanceTurn(room);
      return `${player.name} 成功购买 ${card.title}。\n当前行动：${room.players[room.currentTurn].name}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.reserve [roomId:text] [level:text] [slot:text]', '预留卡牌')
    .example('splendor.reserve SPL-ABCD12 2 1')
    .action(async ({ session }, roomId, level, slot) =>
    {
      const userId = getUserId(session);
      let targetRoomId: string | undefined = roomId;
      let targetLevel = level;
      let targetSlot: string | undefined = slot;

      if (roomId && !isRoomId(roomId) && level && !slot)
      {
        targetRoomId = undefined;
        targetLevel = roomId;
        targetSlot = level;
      } else if (roomId && !isRoomId(roomId) && !level && !slot)
      {
        targetRoomId = undefined;
        targetLevel = roomId;
        targetSlot = undefined;
      }

      const room = resolveRoomBySession(session, targetRoomId);
      if (!room) return '你当前不在任何房间。';

      const player = getPlayerByUser(room, userId);
      if (!player) return '你不在这个房间里。';
      if (!room.started) return '游戏尚未开始。';
      if (room.winner) return `${room.winner} 已经获得胜利，游戏已结束。`;
      if (room.players[room.currentTurn].id !== userId) return `当前轮到 ${room.players[room.currentTurn].name} 行动。`;
      if (player.reserved.length >= 3) return '你最多只能预留 3 张卡牌。';

      const cardLevel = Number(targetLevel) as CardLevel;
      const slotIndex = Number(targetSlot);
      if (!([1, 2, 3] as number[]).includes(cardLevel)) return '卡牌层级必须是 1、2 或 3。';
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > room.board[cardLevel].length)
      {
        return `第 ${cardLevel} 层没有编号为 ${targetSlot} 的卡牌。`;
      }

      const card = room.board[cardLevel][slotIndex - 1];
      if (!card) return '该卡牌不存在。';

      player.reserved.push(card);
      room.board[cardLevel].splice(slotIndex - 1, 1);
      if (room.goldPool > 0)
      {
        player.gold += 1;
        room.goldPool -= 1;
      }
      fillBoard(room, cardLevel);
      room.log.push(`${player.name} 预留了 ${card.title}，获得 1 枚黄金`);
      advanceTurn(room);
      return `${player.name} 预留成功：${card.title}。\n当前行动：${room.players[room.currentTurn].name}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.end [roomId:text]', '结束当前回合')
    .example('splendor.end SPL-ABCD12')
    .action(async ({ session }, roomId) =>
    {
      const userId = getUserId(session);
      const room = resolveRoomBySession(session, roomId);
      if (!room) return '你当前不在任何房间。';

      const player = getPlayerByUser(room, userId);
      if (!player) return '你不在这个房间里。';
      if (!room.started) return '游戏尚未开始。';
      if (room.winner) return `${room.winner} 已经获得胜利，游戏已结束。`;
      if (room.players[room.currentTurn].id !== userId) return `当前轮到 ${room.players[room.currentTurn].name} 行动。`;

      room.log.push(`${player.name} 结束回合`);
      advanceTurn(room);
      return `${player.name} 已结束回合。\n当前行动：${room.players[room.currentTurn].name}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.kill [roomId:text]', '房主强制结束游戏')
    .example('splendor.kill SPL-ABCD12')
    .action(async ({ session }, roomId) =>
    {
      const userId = getUserId(session);
      const room = resolveRoomBySession(session, roomId);
      if (!room) return '你当前不在任何房间。';
      if (room.ownerId !== userId) return '只有房主才能强制结束游戏。';

      const ranking = [...room.players]
        .sort((left, right) => right.prestige - left.prestige)
        .map((player, index) => `${index + 1}. ${player.name}（${player.prestige} 声望）`)
        .join('\n');
      rooms.delete(room.id);
      endGameVotes.delete(room.id);
      return `房主已强制结束房间 ${room.name} 的游戏。\n最终排名：\n${ranking}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.vote-end [roomId:text]', '投票结束当前游戏')
    .example('splendor.vote-end SPL-ABCD12')
    .action(async ({ session }, roomId) =>
    {
      const userId = getUserId(session);
      const room = resolveRoomBySession(session, roomId);
      if (!room) return '你当前不在任何房间。';
      if (!getPlayerByUser(room, userId)) return '你不在这个房间里。';
      if (!room.started) return '游戏尚未开始，无需投票结束。';
      if (room.winner) return `${room.winner} 已经获得胜利，游戏已结束。`;

      const votes = endGameVotes.get(room.id) || new Set<string>();
      if (votes.has(userId))
      {
        return `你已投票结束游戏。当前票数：${votes.size}/${room.players.length}。`;
      }

      votes.add(userId);
      endGameVotes.set(room.id, votes);
      const requiredVotes = Math.floor(room.players.length / 2) + 1;
      room.log.push(`${getUserName(session)} 投票结束游戏（${votes.size}/${requiredVotes}）`);

      if (votes.size < requiredVotes)
      {
        return `${getUserName(session)} 已投票结束游戏。当前票数：${votes.size}/${room.players.length}，还需 ${requiredVotes - votes.size} 票通过。`;
      }

      const ranking = [...room.players]
        .sort((left, right) => right.prestige - left.prestige)
        .map((player, index) => `${index + 1}. ${player.name}（${player.prestige} 声望）`)
        .join('\n');
      rooms.delete(room.id);
      endGameVotes.delete(room.id);
      return `结束游戏投票已通过，房间 ${room.name} 的游戏已结束。\n最终排名：\n${ranking}`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.rules', '查看游戏规则')
    .example('splendor.rules')
    .action(() =>
    {
      return `璀璨宝石游戏规则：\n\n1. 游戏目标\n率先获得至少 15 点声望即可获胜。\n\n2. 回合行动\n每次行动后将自动轮到下一位玩家；也可使用 splendor.end 放弃本回合。\n- 抽取宝石：使用 splendor.take，可拿 3 枚同色宝石，或 2 枚不同色宝石。\n- 购买卡牌：使用 splendor.buy <层级> <位置>。支付卡牌成本后获得卡牌颜色对应的永久折扣和声望。黄金可代替任意颜色宝石支付。\n- 预留卡牌：使用 splendor.reserve <层级> <位置>。每人最多预留 3 张；黄金池尚有黄金时，预留可获得 1 枚黄金。\n\n3. 贵族牌\n当你拥有的已购卡牌颜色数量满足贵族牌条件时，会自动获得该贵族牌及其声望。\n\n4. 指令示例\n- splendor.take red blue\n- splendor.take red red red\n- splendor.buy 1 2\n- splendor.reserve 2 1\n- splendor.status\n\n5. 结束游戏\n玩家可用 splendor.vote-end 发起结束投票；超过半数同意后游戏结束。房主可使用 splendor.kill 直接强制结束游戏。`;
    });

  ctx.command('splendor', '璀璨宝石').subcommand('.help', '查看帮助')
    .action(async ({ session }) =>
    {
      const userId = getUserId(session);
      const room = getRoomByUser(rooms, userId);
      const currentInfo = room ? `\n当前房间：${room.id} (${room.name})` : '';

      return `正式璀璨宝石纯文本指令：\n1. splendor.create [房间名]\n2. splendor.join &lt;房间号&gt;\n3. splendor.room [&lt;房间号&gt;]\n4. splendor.start [&lt;房间号&gt;]\n5. splendor.status [&lt;房间号&gt;]\n6. splendor.take [&lt;房间号&gt;] red blue\n7. splendor.buy [&lt;房间号&gt;] &lt;层级&gt; &lt;位置&gt;\n8. splendor.reserve [&lt;房间号&gt;] &lt;层级&gt; &lt;位置&gt;\n9. splendor.end [&lt;房间号&gt;]\n10. splendor.kill [&lt;房间号&gt;]（仅房主可强制结束游戏）\n11. splendor.vote-end [&lt;房间号&gt;]（超过半数玩家同意后结束游戏）\n12. splendor.rules（查看游戏规则）\n说明：在当前已开始的房间中，玩家可以直接省略房间号，如：splendor.take red blue${currentInfo}`;
    });

}

