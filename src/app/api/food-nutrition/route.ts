import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

// ── ミクロ栄養素キー一覧 ──────────────────────────────────���───────────────────
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

// ── 日本食品標準成分表 2020年版 に基づくフォールバック DB ─────────────────────
// 値は子ども向け 1人前（1食分）の目安量。
// AIが 0 または null を返したフィールドのみ補完に使用する。
interface FoodFallback {
  /** 食品名に含まれていればマッチするキーワード（いずれか1つ） */
  keywords: string[]
  micro: MicroMap
}

const FOOD_FALLBACK_DB: FoodFallback[] = [
  // ─── 緑黄色野菜 ───────────────────��───────────────────────────────────────
  {
    keywords: ['青汁', 'あおじる'],
    micro: {
      vitamin_a: 200, vitamin_k: 300, vitamin_c: 40, vitamin_e: 2.0,
      folate: 80, calcium: 100, iron: 1.5, magnesium: 30,
      potassium: 400, vitamin_b1: 0.05, vitamin_b2: 0.10,
    },
  },
  {
    keywords: ['ほうれん草', 'ほうれんそう', 'ホウレンソウ'],
    micro: {
      vitamin_a: 460, vitamin_k: 216, vitamin_c: 28, vitamin_e: 1.6,
      folate: 168, calcium: 39, iron: 1.6, magnesium: 55,
      potassium: 552, vitamin_b1: 0.09, vitamin_b2: 0.17,
      vitamin_b6: 0.10, manganese: 0.52,
    },
  },
  {
    keywords: ['ケール', 'けーる'],
    micro: {
      vitamin_a: 420, vitamin_k: 441, vitamin_c: 57, vitamin_e: 2.0,
      folate: 84, calcium: 154, iron: 0.6, magnesium: 31,
      potassium: 420, vitamin_b6: 0.16, vitamin_c_raw: 57,
    } as MicroMap,
  },
  {
    keywords: ['小松菜', 'こまつな', 'コマツナ'],
    micro: {
      vitamin_a: 208, vitamin_k: 256, vitamin_c: 31, vitamin_e: 1.0,
      folate: 88, calcium: 136, iron: 2.2, magnesium: 10,
      potassium: 400, vitamin_b2: 0.10,
    },
  },
  {
    keywords: ['モロヘイヤ', 'もろへいや'],
    micro: {
      vitamin_a: 420, vitamin_k: 320, vitamin_c: 33, vitamin_e: 3.3,
      folate: 125, calcium: 130, iron: 0.5, magnesium: 27,
      potassium: 350, vitamin_b2: 0.21,
    },
  },
  {
    keywords: ['ブロッコリー', 'ぶろっこりー'],
    micro: {
      vitamin_a: 60, vitamin_k: 120, vitamin_c: 96, vitamin_e: 2.0,
      folate: 168, calcium: 30, iron: 0.8, magnesium: 21,
      potassium: 288, vitamin_b6: 0.18, vitamin_b1: 0.10,
    },
  },
  {
    keywords: ['にんじん', 'ニンジン', '人参'],
    micro: {
      vitamin_a: 584, vitamin_k: 7, vitamin_c: 5, vitamin_e: 0.4,
      folate: 17, calcium: 22, iron: 0.2, magnesium: 12,
      potassium: 216, vitamin_b6: 0.10,
    },
  },
  {
    keywords: ['かぼちゃ', 'カボチャ', '南瓜'],
    micro: {
      vitamin_a: 264, vitamin_k: 22, vitamin_c: 34, vitamin_e: 3.9,
      folate: 34, calcium: 18, iron: 0.4, magnesium: 20,
      potassium: 360, vitamin_b6: 0.18,
    },
  },
  {
    keywords: ['トマト', 'とまと'],
    micro: {
      vitamin_a: 75, vitamin_k: 3, vitamin_c: 23, vitamin_e: 0.5,
      folate: 33, calcium: 23, iron: 0.3, magnesium: 12,
      potassium: 315, vitamin_b6: 0.11, niacin: 0.8,
    },
  },
  // ─── 乳製品 ───────────────────────────────────────────────────────────────
  {
    keywords: ['牛乳', 'ぎゅうにゅう', 'ミルク', 'みるく'],
    micro: {
      vitamin_a: 76, vitamin_d: 0.6, vitamin_b2: 0.30, vitamin_b12: 0.6,
      calcium: 220, phosphorus: 186, potassium: 300, magnesium: 20,
      iodine: 32, zinc: 0.8, selenium: 4,
    },
  },
  {
    keywords: ['ヨーグルト', 'よーぐると'],
    micro: {
      vitamin_b2: 0.14, vitamin_b12: 0.4,
      calcium: 120, phosphorus: 100, potassium: 170, magnesium: 12,
      iodine: 9, zinc: 0.5,
    },
  },
  {
    keywords: ['チーズ', 'ちーず'],
    micro: {
      vitamin_a: 90, vitamin_d: 0.2, vitamin_b2: 0.27, vitamin_b12: 1.2,
      calcium: 630, phosphorus: 400, sodium: 460, zinc: 2.7,
    },
  },
  // ─── 魚介類 ───────────────────────────────────────────────────────────────
  {
    keywords: ['鮭', 'さけ', 'サーモン', 'さーもん', 'シャケ', 'しゃけ'],
    micro: {
      vitamin_d: 25.6, vitamin_e: 2.0, vitamin_b6: 0.51, vitamin_b12: 4.7,
      niacin: 7.6, calcium: 11, phosphorus: 192, selenium: 30,
      potassium: 320, magnesium: 29,
    },
  },
  {
    keywords: ['まぐろ', 'マグロ', 'ツナ', 'つな', 'tuna'],
    micro: {
      vitamin_d: 4.0, vitamin_b6: 0.68, vitamin_b12: 1.4,
      niacin: 14.4, selenium: 28, potassium: 320,
      phosphorus: 280, magnesium: 26,
    },
  },
  {
    keywords: ['しらす', 'シラス', 'ちりめん', 'チリメン'],
    micro: {
      vitamin_d: 12.0, vitamin_b12: 1.3,
      calcium: 104, phosphorus: 130, iodine: 22,
    },
  },
  {
    keywords: ['あさり', 'アサリ'],
    micro: {
      vitamin_b12: 26.0, iron: 1.9, zinc: 0.7,
      calcium: 33, potassium: 140, selenium: 8,
    },
  },
  {
    keywords: ['さば', 'サバ', '鯖'],
    micro: {
      vitamin_d: 10.4, vitamin_b2: 0.26, vitamin_b12: 9.2,
      niacin: 8.8, selenium: 30, potassium: 296,
      phosphorus: 224, magnesium: 26, calcium: 6,
    },
  },
  // ─── 肉類 ───────────────────────────────────────────────────────────────��─
  {
    keywords: ['鶏レバー', 'とりればー', 'レバー', 'ればー', '肝'],
    micro: {
      vitamin_a: 3000, vitamin_b2: 1.1, vitamin_b12: 26.0, folate: 780,
      iron: 5.4, zinc: 2.0, copper: 0.21, selenium: 25,
    },
  },
  {
    keywords: ['豚肉', 'ぶたにく', '豚', 'ポーク', 'ぽーく', '豚バラ', '豚ロース'],
    micro: {
      vitamin_b1: 0.55, vitamin_b6: 0.26, niacin: 6.4,
      zinc: 2.2, iron: 0.5, phosphorus: 168, potassium: 280,
    },
  },
  {
    keywords: ['鶏肉', 'とりにく', '鶏', 'チキン', 'ちきん', '唐揚げ', 'から揚げ', 'からあげ'],
    micro: {
      vitamin_b6: 0.51, niacin: 6.4, vitamin_b12: 0.3,
      zinc: 1.2, selenium: 15, phosphorus: 168, potassium: 296,
    },
  },
  // ─── 大豆製品 ─────────────────────────────────────────────────────────────
  {
    keywords: ['納豆', 'なっとう'],
    micro: {
      vitamin_k: 240, vitamin_b2: 0.22, folate: 48, biotin: 6.4,
      calcium: 36, iron: 1.3, zinc: 0.8, magnesium: 40,
      potassium: 264, vitamin_e: 0.4,
    },
  },
  {
    keywords: ['豆腐', 'とうふ', 'トウフ'],
    micro: {
      calcium: 113, iron: 2.3, zinc: 1.1, magnesium: 41,
      potassium: 210, vitamin_e: 0.2, folate: 18,
    },
  },
  {
    keywords: ['大豆', 'だいず', '枝豆', 'えだまめ'],
    micro: {
      vitamin_k: 17, folate: 120, calcium: 70, iron: 1.8,
      zinc: 1.4, magnesium: 60, potassium: 500,
      vitamin_b1: 0.25, vitamin_b2: 0.11,
    },
  },
  // ─── 卵 ───────────────────────────────────────────────────────────────────
  {
    keywords: ['卵', 'たまご', 'タマゴ', '玉子', '目玉焼き', 'スクランブル', 'ゆで卵', 'オムレツ', 'TKG', '卵かけ'],
    micro: {
      vitamin_a: 89, vitamin_d: 1.0, vitamin_e: 0.5,
      vitamin_b2: 0.27, vitamin_b12: 0.5, folate: 22, biotin: 12.0,
      iron: 0.9, zinc: 0.7, selenium: 15,
      calcium: 26, phosphorus: 95,
    },
  },
  // ─── 果物 ─────────────────────────────────────────────────────────────────
  {
    keywords: ['バナナ', 'ばなな'],
    micro: {
      vitamin_b6: 0.38, vitamin_c: 16, folate: 26,
      potassium: 360, magnesium: 32, vitamin_e: 0.5,
    },
  },
  {
    keywords: ['みかん', 'ミカン', '蜜柑', 'オレンジ', 'いちご', '苺', 'キウイ'],
    micro: {
      vitamin_a: 44, vitamin_c: 25, folate: 19,
      potassium: 128, calcium: 15,
    },
  },
  {
    keywords: ['さつまいも', 'サツマイモ', '薩摩芋', 'さつま芋'],
    micro: {
      vitamin_a: 80, vitamin_c: 23, vitamin_e: 1.0, vitamin_b6: 0.25,
      folate: 26, potassium: 470, calcium: 36, magnesium: 24,
    },
  },
]

// ── AI レスポンスにフォールバック値を適用 ────────────────────────────────────
// AI が 0 または null を返したフィールドのみ補完。非ゼロの AI 値は上書きしない。
function applyFallback(
  result: Record<string, number | null>,
  inputFoodName: string,
): void {
  const name = inputFoodName.toLowerCase()
  const match = FOOD_FALLBACK_DB.find(fb =>
    fb.keywords.some(k => name.includes(k.toLowerCase()))
  )
  if (!match) return

  for (const key of MICRO_KEYS) {
    const fallbackVal = (match.micro as Record<string, number | undefined>)[key]
    if (fallbackVal !== undefined && (result[key] === 0 || result[key] === null || result[key] === undefined)) {
      result[key] = fallbackVal
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
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `「${foodName.trim()}」の一般的な1人前の栄養素を推定して、以下のJSON形式のみで返してください。
{
  "foodName": "料理名（日本語・目安量付き）",
  "calories": カロリー(kcal・整数),
  "protein": たんぱく質(g・小数第1位),
  "carbs": 炭水化物(g・小数第1位),
  "fat": 脂質(g・小数第1位),
  "portion": "目安量（例: 1皿・200g）",
  "vitamin_a":        ビタミンA(μg・整数・不明なら0),
  "vitamin_d":        ビタミンD(μg・小数第1位・不明なら0),
  "vitamin_e":        ビタミンE(mg・小数第1位・不明なら0),
  "vitamin_k":        ビタミンK(μg・整数・不明なら0),
  "vitamin_c":        ビタミンC(mg・整数・不明なら0),
  "vitamin_b1":       ビタミンB1(mg・小数第2位・不明なら0),
  "vitamin_b2":       ビタミンB2(mg・小数第2位・不明なら0),
  "vitamin_b6":       ビタミンB6(mg・小数第2位・不明なら0),
  "vitamin_b12":      ビタミンB12(μg・小数第1位・不明なら0),
  "niacin":           ナイアシン(mg・小数第1位・不明なら0),
  "pantothenic_acid": パントテン酸(mg・小数第2位・不明なら0),
  "folate":           葉酸(μg・整数・不明なら0),
  "biotin":           ビオチン(μg・小数第1位・不明なら0),
  "calcium":          カルシウム(mg・整数・不明なら0),
  "phosphorus":       リン(mg・整数・不明なら0),
  "potassium":        カリウム(mg・整数・不明なら0),
  "sulfur":           硫黄(mg・整数・不明なら0),
  "chlorine":         塩素(mg・整数・不明なら0),
  "sodium":           ナトリウム(mg・整数・不明なら0),
  "magnesium":        マグネシウム(mg・整数・不明なら0),
  "iron":             鉄(mg・小数第1位・不明なら0),
  "zinc":             亜鉛(mg・小数第1位・不明なら0),
  "copper":           銅(mg・小数第2位・不明なら0),
  "manganese":        マンガン(mg・小数第2位・不明なら0),
  "iodine":           ヨウ素(μg・整数・不明なら0),
  "selenium":         セレン(μg・整数・不明なら0),
  "molybdenum":       モリブデン(μg・整数・不明なら0),
  "chromium":         クロム(μg・整数・不明なら0),
  "cobalt":           コバルト(μg・小数第1位・不明なら0)
}
食品として認識できない場合は全フィールドをnullにしてください。JSONのみ返してください。`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  console.log('[food-nutrition] raw AI text:', text)

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0]) as Record<string, number | null>

    if (result.calories === null) {
      return NextResponse.json({ error: '食品として認識できませんでした' }, { status: 422 })
    }

    // ① AIが null/undefined を返したミクロ栄養素フィールドを 0 に正規化
    for (const key of MICRO_KEYS) {
      if (result[key] === null || result[key] === undefined) {
        result[key] = 0
      }
    }

    // ② 日本食品標準成分表のフォールバックDBで 0 フィールドを補完
    applyFallback(result, foodName.trim())

    console.log('[food-nutrition] final micro sample:', {
      vitamin_k: result.vitamin_k,
      vitamin_c: result.vitamin_c,
      folate: result.folate,
      calcium: result.calcium,
      iron: result.iron,
      magnesium: result.magnesium,
    })

    return NextResponse.json({ result })
  } catch {
    console.error('[POST /api/food-nutrition] parse error, raw text:', text)
    return NextResponse.json({ error: 'AIの応答を解析できませんでした' }, { status: 500 })
  }
}
