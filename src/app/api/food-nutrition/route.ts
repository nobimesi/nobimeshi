import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

// ── ミクロ栄養素キー一覧 ─────────────────────────────────────────────────────
const MICRO_KEYS = [
  'vitamin_a','vitamin_d','vitamin_e','vitamin_k','vitamin_c',
  'vitamin_b1','vitamin_b2','vitamin_b6','vitamin_b12',
  'niacin','pantothenic_acid','folate','biotin',
  'calcium','phosphorus','potassium','sulfur','chlorine','sodium',
  'magnesium','iron','zinc','copper','manganese',
  'iodine','selenium','molybdenum','chromium','cobalt',
] as const

type MicroKey = typeof MICRO_KEYS[number]
type MicroMap = Partial<Record<MicroKey, number>>

// ── 日本食品標準成分表 2020年版 フォールバック DB（子ども1人前） ─────────────
interface FoodFallback { keywords: string[]; micro: MicroMap }

const FOOD_FALLBACK_DB: FoodFallback[] = [
  // ─── 緑黄色野菜 ────────────────────────────────────────────────────────────
  {
    keywords: ['青汁', 'あおじる'],
    micro: { vitamin_a:200, vitamin_k:300, vitamin_c:40, vitamin_e:2.0,
      folate:80, calcium:100, iron:1.5, magnesium:30, potassium:400,
      vitamin_b1:0.05, vitamin_b2:0.10 },
  },
  {
    keywords: ['ほうれん草', 'ほうれんそう', 'ホウレンソウ'],
    micro: { vitamin_a:460, vitamin_k:216, vitamin_c:28, vitamin_e:1.6,
      folate:168, calcium:39, iron:1.6, magnesium:55, potassium:552,
      vitamin_b1:0.09, vitamin_b2:0.17, vitamin_b6:0.10, manganese:0.52 },
  },
  {
    keywords: ['ケール', 'けーる'],
    micro: { vitamin_a:420, vitamin_k:441, vitamin_c:57, vitamin_e:2.0,
      folate:84, calcium:154, iron:0.6, magnesium:31, potassium:420,
      vitamin_b6:0.16 },
  },
  {
    keywords: ['小松菜', 'こまつな', 'コマツナ'],
    micro: { vitamin_a:208, vitamin_k:256, vitamin_c:31, vitamin_e:1.0,
      folate:88, calcium:136, iron:2.2, magnesium:10, potassium:400,
      vitamin_b2:0.10 },
  },
  {
    keywords: ['モロヘイヤ', 'もろへいや'],
    micro: { vitamin_a:420, vitamin_k:320, vitamin_c:33, vitamin_e:3.3,
      folate:125, calcium:130, iron:0.5, magnesium:27, potassium:350,
      vitamin_b2:0.21 },
  },
  {
    keywords: ['ブロッコリー', 'ぶろっこりー'],
    micro: { vitamin_a:60, vitamin_k:120, vitamin_c:96, vitamin_e:2.0,
      folate:168, calcium:30, iron:0.8, magnesium:21, potassium:288,
      vitamin_b6:0.18, vitamin_b1:0.10 },
  },
  {
    keywords: ['にんじん', 'ニンジン', '人参'],
    micro: { vitamin_a:584, vitamin_k:7, vitamin_c:5, vitamin_e:0.4,
      folate:17, calcium:22, iron:0.2, magnesium:12, potassium:216,
      vitamin_b6:0.10 },
  },
  {
    keywords: ['かぼちゃ', 'カボチャ', '南瓜'],
    micro: { vitamin_a:264, vitamin_k:22, vitamin_c:34, vitamin_e:3.9,
      folate:34, calcium:18, iron:0.4, magnesium:20, potassium:360,
      vitamin_b6:0.18 },
  },
  {
    keywords: ['トマト', 'とまと'],
    micro: { vitamin_a:75, vitamin_k:3, vitamin_c:23, vitamin_e:0.5,
      folate:33, calcium:23, iron:0.3, magnesium:12, potassium:315,
      vitamin_b6:0.11, niacin:0.8 },
  },
  {
    keywords: ['キャベツ', 'きゃべつ'],
    micro: { vitamin_k:78, vitamin_c:41, folate:78, calcium:43,
      potassium:200, magnesium:14, vitamin_b6:0.11, vitamin_b1:0.04 },
  },
  {
    keywords: ['たまねぎ', 'タマネギ', '玉ねぎ', '玉葱'],
    micro: { vitamin_c:8, folate:15, calcium:21, potassium:150,
      vitamin_b6:0.17, phosphorus:33 },
  },
  {
    keywords: ['きゅうり', 'キュウリ', '胡瓜'],
    micro: { vitamin_k:34, vitamin_c:14, folate:25, calcium:26,
      potassium:200, magnesium:15 },
  },
  {
    keywords: ['ピーマン', 'ぴーまん', 'パプリカ'],
    micro: { vitamin_a:33, vitamin_c:76, vitamin_e:0.8, vitamin_k:6,
      folate:26, potassium:190, calcium:11, vitamin_b6:0.19 },
  },
  {
    keywords: ['しいたけ', 'シイタケ', 'えのき', 'エノキ', 'まいたけ', 'マイタケ', 'しめじ', 'シメジ', 'きのこ', 'キノコ'],
    micro: { vitamin_d:0.3, vitamin_b2:0.19, niacin:3.8,
      folate:49, potassium:290, phosphorus:96, magnesium:15 },
  },
  {
    keywords: ['じゃがいも', 'ジャガイモ', '馬鈴薯', 'ポテト'],
    micro: { vitamin_c:28, vitamin_b6:0.23, folate:20,
      potassium:420, phosphorus:47, magnesium:20, niacin:1.3 },
  },
  {
    keywords: ['さつまいも', 'サツマイモ', '薩摩芋', 'さつま芋'],
    micro: { vitamin_a:80, vitamin_c:23, vitamin_e:1.0, vitamin_b6:0.25,
      folate:26, potassium:470, calcium:36, magnesium:24 },
  },
  {
    keywords: ['とうもろこし', 'トウモロコシ', 'コーン'],
    micro: { vitamin_b1:0.15, niacin:2.3, folate:95,
      potassium:290, phosphorus:100, magnesium:37, vitamin_e:0.5 },
  },
  {
    keywords: ['アボカド', 'あぼかど'],
    micro: { vitamin_e:2.1, vitamin_k:21, folate:84, vitamin_b6:0.32,
      potassium:720, magnesium:33, phosphorus:55 },
  },
  // ─── 海藻 ──────────────────────────────────────────────────────────────────
  {
    keywords: ['わかめ', 'ワカメ'],
    micro: { vitamin_k:66, folate:44, calcium:100, iodine:160,
      magnesium:110, potassium:730, iron:0.7 },
  },
  {
    keywords: ['のり', 'ノリ', '海苔', 'こんぶ', 'コンブ', '昆布', 'ひじき'],
    micro: { vitamin_k:200, vitamin_b2:0.20, folate:170,
      calcium:140, iodine:200, iron:2.0, magnesium:100 },
  },
  // ─── 乳製品 ────────────────────────────────────────────────────────────────
  {
    keywords: ['牛乳', 'ぎゅうにゅう', 'ミルク', 'みるく'],
    micro: { vitamin_a:76, vitamin_d:0.6, vitamin_b2:0.30, vitamin_b12:0.6,
      calcium:220, phosphorus:186, potassium:300, magnesium:20,
      iodine:32, zinc:0.8, selenium:4 },
  },
  {
    keywords: ['ヨーグルト', 'よーぐると'],
    micro: { vitamin_b2:0.14, vitamin_b12:0.4,
      calcium:120, phosphorus:100, potassium:170, magnesium:12,
      iodine:9, zinc:0.5 },
  },
  {
    keywords: ['チーズ', 'ちーず'],
    micro: { vitamin_a:90, vitamin_d:0.2, vitamin_b2:0.27, vitamin_b12:1.2,
      calcium:630, phosphorus:400, sodium:460, zinc:2.7 },
  },
  // ─── 魚介類 ────────────────────────────────────────────────────────────────
  {
    keywords: ['鮭', 'さけ', 'サーモン', 'さーもん', 'シャケ', 'しゃけ'],
    micro: { vitamin_d:25.6, vitamin_e:2.0, vitamin_b6:0.51, vitamin_b12:4.7,
      niacin:7.6, calcium:11, phosphorus:192, selenium:30,
      potassium:320, magnesium:29 },
  },
  {
    keywords: ['まぐろ', 'マグロ', 'ツナ', 'つな', 'tuna'],
    micro: { vitamin_d:4.0, vitamin_b6:0.68, vitamin_b12:1.4,
      niacin:14.4, selenium:28, potassium:320,
      phosphorus:280, magnesium:26 },
  },
  {
    keywords: ['しらす', 'シラス', 'ちりめん', 'チリメン'],
    micro: { vitamin_d:12.0, vitamin_b12:1.3,
      calcium:104, phosphorus:130, iodine:22 },
  },
  {
    keywords: ['あさり', 'アサリ'],
    micro: { vitamin_b12:26.0, iron:1.9, zinc:0.7,
      calcium:33, potassium:140, selenium:8 },
  },
  {
    keywords: ['さば', 'サバ', '鯖'],
    micro: { vitamin_d:10.4, vitamin_b2:0.26, vitamin_b12:9.2,
      niacin:8.8, selenium:30, potassium:296,
      phosphorus:224, magnesium:26, calcium:6 },
  },
  {
    keywords: ['アジ', 'あじ', '鯵'],
    micro: { vitamin_d:8.9, vitamin_b12:6.4, niacin:6.6,
      selenium:14, potassium:300, phosphorus:200, calcium:66 },
  },
  {
    keywords: ['えび', 'エビ', '海老', '蝦'],
    micro: { vitamin_b12:1.3, niacin:2.3, selenium:31,
      zinc:1.4, phosphorus:195, potassium:230, calcium:57 },
  },
  {
    keywords: ['いか', 'イカ', '烏賊'],
    micro: { vitamin_b12:2.2, niacin:4.5, selenium:35,
      zinc:1.3, phosphorus:240, potassium:300 },
  },
  {
    keywords: ['たこ', 'タコ', '蛸'],
    micro: { vitamin_b12:1.3, zinc:1.7, selenium:45,
      phosphorus:160, potassium:290 },
  },
  // ─── 肉類 ──────────────────────────────────────────────────────────────────
  {
    keywords: ['鶏レバー', 'とりればー', 'レバー', 'ればー', '肝'],
    micro: { vitamin_a:3000, vitamin_b2:1.1, vitamin_b12:26.0, folate:780,
      iron:5.4, zinc:2.0, copper:0.21, selenium:25 },
  },
  {
    keywords: ['豚肉', 'ぶたにく', '豚バラ', '豚ロース', 'ポークチョップ'],
    micro: { vitamin_b1:0.55, vitamin_b6:0.26, niacin:6.4,
      zinc:2.2, iron:0.5, phosphorus:168, potassium:280 },
  },
  {
    keywords: ['豚', 'ぽーく', 'ポーク'],
    micro: { vitamin_b1:0.55, vitamin_b6:0.26, niacin:6.4,
      zinc:2.2, iron:0.5, phosphorus:168, potassium:280 },
  },
  {
    keywords: ['鶏肉', 'とりにく', 'チキン', 'ちきん', '唐揚げ', 'から揚げ', 'からあげ'],
    micro: { vitamin_b6:0.51, niacin:6.4, vitamin_b12:0.3,
      zinc:1.2, selenium:15, phosphorus:168, potassium:296 },
  },
  {
    keywords: ['鶏', 'とり'],
    micro: { vitamin_b6:0.51, niacin:6.4, vitamin_b12:0.3,
      zinc:1.2, selenium:15, phosphorus:168, potassium:296 },
  },
  {
    keywords: ['牛肉', 'ぎゅうにく', 'ビーフ', 'びーふ', '牛ロース', '牛バラ', 'ステーキ'],
    micro: { vitamin_b6:0.28, vitamin_b12:1.3, niacin:4.5,
      zinc:3.6, iron:1.4, phosphorus:156, potassium:280, selenium:7 },
  },
  {
    keywords: ['牛', 'ぎゅう'],
    micro: { vitamin_b6:0.28, vitamin_b12:1.3, niacin:4.5,
      zinc:3.6, iron:1.4, phosphorus:156, potassium:280, selenium:7 },
  },
  {
    keywords: ['ハム', 'はむ', 'ソーセージ', 'ウインナー', 'うぃんなー', 'ベーコン'],
    micro: { vitamin_b1:0.46, vitamin_b6:0.15, niacin:4.2,
      zinc:1.6, sodium:850, phosphorus:130, potassium:180 },
  },
  // ─── 大豆製品 ──────────────────────────────────────────────────────────────
  {
    keywords: ['納豆', 'なっとう'],
    micro: { vitamin_k:240, vitamin_b2:0.22, folate:48, biotin:6.4,
      calcium:36, iron:1.3, zinc:0.8, magnesium:40,
      potassium:264, vitamin_e:0.4 },
  },
  {
    keywords: ['豆腐', 'とうふ', 'トウフ'],
    micro: { calcium:113, iron:2.3, zinc:1.1, magnesium:41,
      potassium:210, vitamin_e:0.2, folate:18 },
  },
  {
    keywords: ['大豆', 'だいず', '枝豆', 'えだまめ'],
    micro: { vitamin_k:17, folate:120, calcium:70, iron:1.8,
      zinc:1.4, magnesium:60, potassium:500,
      vitamin_b1:0.25, vitamin_b2:0.11 },
  },
  {
    keywords: ['みそ', '味噌', 'みそしる', '味噌汁', 'みそスープ'],
    micro: { vitamin_b2:0.10, vitamin_k:12, folate:18,
      calcium:24, iron:0.5, zinc:0.6, sodium:820, magnesium:18 },
  },
  // ─── 卵 ────────────────────────────────────────────────────────────────────
  {
    keywords: ['卵', 'たまご', 'タマゴ', '玉子', '目玉焼き', 'スクランブル', 'ゆで卵', 'オムレツ', 'TKG', '卵かけ', '出汁巻き'],
    micro: { vitamin_a:89, vitamin_d:1.0, vitamin_e:0.5,
      vitamin_b2:0.27, vitamin_b12:0.5, folate:22, biotin:12.0,
      iron:0.9, zinc:0.7, selenium:15, calcium:26, phosphorus:95 },
  },
  // ─── 穀物・パン・麺 ────────────────────────────────────────────────────────
  {
    keywords: ['ごはん', 'ご飯', '白米', 'はくまい', '米', 'おにぎり'],
    micro: { vitamin_b1:0.08, niacin:1.2, folate:12,
      phosphorus:68, potassium:89, magnesium:14, vitamin_e:0.1 },
  },
  {
    keywords: ['パン', 'ぱん', '食パン', 'トースト'],
    micro: { vitamin_b1:0.09, niacin:1.4, folate:22,
      calcium:29, phosphorus:67, potassium:86, sodium:370 },
  },
  {
    keywords: ['うどん', 'ウドン', 'そうめん', '素麺'],
    micro: { vitamin_b1:0.06, niacin:1.0, folate:8,
      phosphorus:52, potassium:20, sodium:180 },
  },
  {
    keywords: ['そば', 'ソバ', '蕎麦'],
    micro: { vitamin_b1:0.08, niacin:1.5, folate:11,
      phosphorus:95, potassium:100, magnesium:24, manganese:0.35 },
  },
  {
    keywords: ['パスタ', 'ぱすた', 'スパゲッティ', 'スパゲティ', 'マカロニ'],
    micro: { vitamin_b1:0.11, niacin:1.8, folate:14,
      phosphorus:80, potassium:60, selenium:7 },
  },
  // ─── 果物 ──────────────────────────────────────────────────────────────────
  {
    keywords: ['バナナ', 'ばなな'],
    micro: { vitamin_b6:0.38, vitamin_c:16, folate:26,
      potassium:360, magnesium:32, vitamin_e:0.5 },
  },
  {
    keywords: ['みかん', 'ミカン', '蜜柑', 'オレンジ', 'いよかん', '柑橘'],
    micro: { vitamin_c:35, folate:22, potassium:150, calcium:21, vitamin_a:44 },
  },
  {
    keywords: ['いちご', 'イチゴ', '苺'],
    micro: { vitamin_c:62, folate:90, potassium:170, calcium:17 },
  },
  {
    keywords: ['りんご', 'リンゴ', '林檎'],
    micro: { vitamin_c:6, folate:2, potassium:110, calcium:3, vitamin_e:0.1 },
  },
  {
    keywords: ['ぶどう', 'ブドウ', '葡萄'],
    micro: { vitamin_c:2, folate:15, potassium:130, calcium:6 },
  },
  {
    keywords: ['もも', 'モモ', '桃'],
    micro: { vitamin_c:8, folate:13, potassium:180, calcium:4, niacin:0.6 },
  },
  {
    keywords: ['キウイ', 'きうい', 'キウイフルーツ'],
    micro: { vitamin_c:71, folate:37, potassium:300, calcium:33, vitamin_k:37 },
  },
  // ─── 菓子・飲料 ────────────────────────────────────────────────────────────
  {
    keywords: ['コーンフレーク', 'シリアル', 'グラノーラ'],
    micro: { vitamin_b1:0.35, vitamin_b2:0.40, niacin:4.5, folate:100,
      iron:3.0, calcium:100, phosphorus:110 },
  },
  {
    keywords: ['チョコレート', 'ちょこ', 'チョコ'],
    micro: { vitamin_e:0.6, iron:1.3, zinc:1.0, magnesium:54,
      phosphorus:98, potassium:270, calcium:51 },
  },
]

// ── カテゴリ別デフォルト値（フォールバックDBにマッチしない食品向け）──────────
const CATEGORY_DEFAULTS: Record<string, MicroMap> = {
  vegetable: {
    vitamin_a:100, vitamin_k:60, vitamin_c:20, vitamin_e:0.5,
    folate:40, calcium:30, iron:0.5, magnesium:10, potassium:200,
    vitamin_b1:0.05, vitamin_b2:0.05,
  },
  meat: {
    vitamin_b1:0.20, vitamin_b6:0.25, vitamin_b12:0.5, niacin:5.0,
    zinc:1.5, iron:0.8, phosphorus:130, potassium:220, selenium:10,
  },
  fish: {
    vitamin_d:5.0, vitamin_b6:0.25, vitamin_b12:2.0, niacin:5.0,
    selenium:20, phosphorus:130, potassium:200, calcium:20,
  },
  fruit: {
    vitamin_c:20, folate:20, potassium:150, calcium:10, vitamin_a:30, vitamin_e:0.3,
  },
  grain: {
    vitamin_b1:0.15, niacin:1.5, folate:20, phosphorus:80, potassium:100, magnesium:15,
  },
  dairy: {
    calcium:200, vitamin_b2:0.20, vitamin_b12:0.5, phosphorus:150, potassium:200, zinc:0.6,
  },
  legume: {
    folate:60, calcium:50, iron:1.0, magnesium:30, potassium:250, vitamin_b1:0.15, vitamin_k:30,
  },
  seaweed: {
    vitamin_k:100, iodine:100, calcium:80, folate:50, magnesium:50, iron:1.0,
  },
  processed: {
    vitamin_b1:0.10, sodium:500, phosphorus:100, potassium:150, zinc:0.5,
  },
  other: {
    vitamin_b1:0.05, vitamin_b2:0.05, calcium:20, iron:0.3, potassium:100,
  },
}

function detectCategory(foodName: string): keyof typeof CATEGORY_DEFAULTS {
  const n = foodName.toLowerCase()
  const has = (...words: string[]) => words.some(w => n.includes(w))
  if (has('野菜','サラダ','葉','根菜','芋','いも','菜','草','ねぎ','もやし','きのこ','茸','たけのこ')) return 'vegetable'
  if (has('肉','ミート','ビーフ','ポーク','チキン','ラム','ハム','ソーセージ','ウインナー','ベーコン','レバー')) return 'meat'
  if (has('魚','刺身','鮮','寿司','すし','えび','海老','いか','蛸','たこ','貝','あさり','しじみ','ほたて')) return 'fish'
  if (has('果物','フルーツ','ジュース','果汁','りんご','バナナ','みかん','いちご','ぶどう','もも','梨','メロン','スイカ')) return 'fruit'
  if (has('ごはん','ご飯','米','パン','麺','うどん','そば','パスタ','ラーメン','おにぎり','もち','餅','シリアル','コーン')) return 'grain'
  if (has('牛乳','ミルク','チーズ','ヨーグルト','乳','クリーム')) return 'dairy'
  if (has('豆','とうふ','豆腐','納豆','みそ','味噌','きな粉','おから','大豆','えだまめ')) return 'legume'
  if (has('わかめ','のり','海苔','こんぶ','昆布','ひじき','もずく','寒天')) return 'seaweed'
  if (has('チョコ','ケーキ','クッキー','菓子','スナック','アイス','ゼリー','プリン','飴','グミ')) return 'processed'
  return 'other'
}

// ── フォールバック適用（DB→カテゴリの2段階） ─────────────────────────────────
function applyFallback(result: Record<string, number | null>, foodName: string): void {
  const name = foodName.toLowerCase()

  // Stage 1: DBマッチ
  const dbMatch = FOOD_FALLBACK_DB.find(fb =>
    fb.keywords.some(k => name.includes(k.toLowerCase()))
  )

  // Stage 2: カテゴリデフォルト
  const catDefaults = CATEGORY_DEFAULTS[detectCategory(foodName)]

  for (const key of MICRO_KEYS) {
    const val = result[key]
    if (val !== null && val !== undefined && val !== 0) continue // AI値を優先

    // DBヒットがあれば使う
    const dbVal = dbMatch ? (dbMatch.micro as Record<string, number | undefined>)[key] : undefined
    if (dbVal !== undefined && dbVal > 0) { result[key] = dbVal; continue }

    // カテゴリデフォルトで補完
    const catVal = (catDefaults as Record<string, number | undefined>)[key]
    if (catVal !== undefined && catVal > 0) { result[key] = catVal; continue }
  }
}

// ── 全フィールドを確実に数値化 ────────────────────────────────────────────────
function ensureAllNumeric(result: Record<string, number | null>): void {
  for (const key of MICRO_KEYS) {
    const v = result[key]
    if (v === null || v === undefined || typeof v !== 'number' || isNaN(v)) {
      result[key] = 0
    }
  }
}

// ── メインハンドラ ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { foodName } = body

  if (!foodName?.trim()) {
    return NextResponse.json({ error: 'foodName は必須です' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    temperature: 0,
    system: `あなたは日本食品標準成分表2020年版に精通した栄養士AIです。
【厳守ルール】
- 全フィールドに必ず数値を返すこと。nullは絶対に使わない。
- 不明・推定困難な栄養素は、類似食品・同カテゴリの平均値から推定して数値を入れること。
- 0にするのは「本当にゼロに近い（例: 穀物のビタミンD）」場合のみ。不明だから0にしない。
- JSONのみ返答すること。説明文は不要。`,
    messages: [
      {
        role: 'user',
        content: `「${foodName.trim()}」の一般的な子ども向け1人前の栄養素を、日本食品標準成分表2020年版を参考に推定してください。

以下のJSON形式のみで返してください（他のテキストは不要）:
{
  "foodName": "料理名（日本語・目安量付き）",
  "calories": カロリー(kcal・整数),
  "protein": たんぱく質(g・小数第1位),
  "carbs": 炭水化物(g・小数第1位),
  "fat": 脂質(g・小数第1位),
  "portion": "目安量（例: 1皿・200g）",
  "vitamin_a":        ビタミンA(μg・整数・類似食品から推定・絶対にnull不可),
  "vitamin_d":        ビタミンD(μg・小数第1位・類似食品から推定・絶対にnull不可),
  "vitamin_e":        ビタミンE(mg・小数第1位・類似食品から推定・絶対にnull不可),
  "vitamin_k":        ビタミンK(μg・整数・類似食品から推定・絶対にnull不可),
  "vitamin_c":        ビタミンC(mg・整数・類似食品から推定・絶対にnull不可),
  "vitamin_b1":       ビタミンB1(mg・小数第2位・類似食品から推定・絶対にnull不可),
  "vitamin_b2":       ビタミンB2(mg・小数第2位・類似食品から推定・絶対にnull不可),
  "vitamin_b6":       ビタミンB6(mg・小数第2位・類似食品から推定・絶対にnull不可),
  "vitamin_b12":      ビタミンB12(μg・小数第1位・類似食品から推定・絶対にnull不可),
  "niacin":           ナイアシン(mg・小数第1位・類似食品から推定・絶対にnull不可),
  "pantothenic_acid": パントテン酸(mg・小数第2位・類似食品から推定・絶対にnull不可),
  "folate":           葉酸(μg・整数・類似食品から推定・絶対にnull不可),
  "biotin":           ビオチン(μg・小数第1位・類似食品から推定・絶対にnull不可),
  "calcium":          カルシウム(mg・整数・類似食品から推定・絶対にnull不可),
  "phosphorus":       リン(mg・整数・類似食品から推定・絶対にnull不可),
  "potassium":        カリウム(mg・整数・類似食品から推定・絶対にnull不可),
  "sulfur":           硫黄(mg・整数・不明なら1),
  "chlorine":         塩素(mg・整数・不明なら1),
  "sodium":           ナトリウム(mg・整数・類似食品から推定・絶対にnull不可),
  "magnesium":        マグネシウム(mg・整数・類似食品から推定・絶対にnull不可),
  "iron":             鉄(mg・小数第1位・類似食品から推定・絶対にnull不可),
  "zinc":             亜鉛(mg・小数第1位・類似食品から推定・絶対にnull不可),
  "copper":           銅(mg・小数第2位・類似食品から推定・絶対にnull不可),
  "manganese":        マンガン(mg・小数第2位・類似食品から推定・絶対にnull不可),
  "iodine":           ヨウ素(μg・整数・類似食品から推定・絶対にnull不可),
  "selenium":         セレン(μg・整数・類似食品から推定・絶対にnull不可),
  "molybdenum":       モリブデン(μg・整数・不明なら1),
  "chromium":         クロム(μg・整数・不明なら1),
  "cobalt":           コバルト(μg・小数第1位・不明なら0.1)
}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  console.log('[food-nutrition] raw AI text (first 300):', text.slice(0, 300))

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0]) as Record<string, number | null>

    if (result.calories === null || result.calories === undefined) {
      return NextResponse.json({ error: '食品として認識できませんでした' }, { status: 422 })
    }

    // Step 1: null/undefined/NaN → 0 に正規化
    ensureAllNumeric(result)

    // Step 2: 0のフィールドをDB→カテゴリの2段階で補完
    applyFallback(result, foodName.trim())

    // Step 3: 補完後もnullが残っていないか最終確認
    ensureAllNumeric(result)

    console.log('[food-nutrition] final micro:', {
      vitamin_k: result.vitamin_k, vitamin_c: result.vitamin_c,
      folate: result.folate, calcium: result.calcium,
      iron: result.iron, magnesium: result.magnesium,
      vitamin_d: result.vitamin_d, zinc: result.zinc,
    })

    return NextResponse.json({ result })
  } catch {
    console.error('[POST /api/food-nutrition] parse error, raw text:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
