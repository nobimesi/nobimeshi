'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Search, PenLine, Camera, X, Check, Loader2, Upload, Plus, Trash2, Sparkles } from 'lucide-react'

// ---- 日本食品標準成分表ベース ----
type Food = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  portion: string   // 例: "150g", "200ml", "1個"
  category: string
  aliases?: string[] // 別名・表記ゆれ・料理名
  // ビタミン (per portion)
  vitamin_a?: number        // μg RAE
  vitamin_d?: number        // μg
  vitamin_e?: number        // mg α-TE
  vitamin_k?: number        // μg
  vitamin_b1?: number       // mg
  vitamin_b2?: number       // mg
  vitamin_b6?: number       // mg
  vitamin_b12?: number      // μg
  vitamin_c?: number        // mg
  niacin?: number           // mg NE
  pantothenic_acid?: number // mg
  folate?: number           // μg
  biotin?: number           // μg
  // ミネラル (per portion)
  calcium?: number    // mg
  phosphorus?: number // mg
  potassium?: number  // mg
  sulfur?: number     // mg
  chlorine?: number   // mg
  sodium?: number     // mg
  magnesium?: number  // mg
  iron?: number       // mg
  zinc?: number       // mg
  copper?: number     // mg
  manganese?: number  // mg
  iodine?: number     // μg
  selenium?: number   // μg
  molybdenum?: number // μg
  chromium?: number   // μg
  cobalt?: number     // μg
}

// 食品名・aliases いずれかにクエリが含まれるか
function matchesQuery(food: Food, q: string): boolean {
  if (food.name.includes(q)) return true
  return food.aliases?.some(a => a.includes(q)) ?? false
}

const FOOD_DB: Food[] = [
  // ===== 主食 =====
  { name: 'ごはん（茶碗1杯）',          calories: 252, protein: 3.8,  carbs: 55.7, fat: 0.5,  portion: '150g',  category: '主食', aliases: ['ご飯', '白米', 'お米', 'rice', '米', '飯'] },
  { name: '玄米ごはん（茶碗1杯）',      calories: 228, protein: 4.2,  carbs: 48.6, fat: 1.1,  portion: '150g',  category: '主食', aliases: ['玄米', '玄米ご飯', 'brown rice'] },
  { name: 'お粥（1杯）',                calories: 130, protein: 2.0,  carbs: 28.5, fat: 0.3,  portion: '300g',  category: '主食', aliases: ['おかゆ', '粥', 'かゆ', 'おじや'] },
  { name: '雑炊（1杯）',                calories: 155, protein: 5.0,  carbs: 30.0, fat: 1.5,  portion: '300g',  category: '主食', aliases: ['ぞうすい', 'お雑炊', 'リゾット'] },
  { name: 'お茶漬け（1杯）',            calories: 210, protein: 5.0,  carbs: 42.0, fat: 1.0,  portion: '280g',  category: '主食', aliases: ['茶漬け', 'ちゃづけ', 'おちゃづけ'] },
  { name: 'おにぎり（1個）',            calories: 176, protein: 2.8,  carbs: 38.5, fat: 0.3,  portion: '100g',  category: '主食', aliases: ['おむすび', '握り飯', 'にぎりめし'] },
  { name: '食パン（1枚）',              calories: 158, protein: 5.6,  carbs: 28.0, fat: 2.6,  portion: '60g',   category: '主食', aliases: ['パン', '白パン', 'bread', 'トースト', '食ぱん'] },
  { name: 'クロワッサン（1個）',        calories: 202, protein: 3.8,  carbs: 22.0, fat: 11.0, portion: '55g',   category: '主食', aliases: ['croissant', 'くろわっさん'] },
  { name: 'ベーグル（1個）',            calories: 248, protein: 9.0,  carbs: 49.0, fat: 1.5,  portion: '100g',  category: '主食', aliases: ['bagel', 'べーぐる'] },
  { name: 'ロールパン（1個）',          calories: 95,  protein: 3.0,  carbs: 15.0, fat: 2.6,  portion: '30g',   category: '主食', aliases: ['コッペパン', 'roll', 'ロール'] },
  { name: '蒸しパン（1個）',            calories: 175, protein: 3.5,  carbs: 32.0, fat: 4.0,  portion: '70g',   category: '主食', aliases: ['むしぱん', '中華まん'] },
  { name: 'フレンチトースト（1枚）',    calories: 220, protein: 7.0,  carbs: 26.0, fat: 9.5,  portion: '100g',  category: '主食', aliases: ['french toast', 'フレンチ'] },
  { name: 'うどん（1玉）',              calories: 231, protein: 6.1,  carbs: 47.5, fat: 0.8,  portion: '200g',  category: '主食', aliases: ['うどん麺', 'かけうどん', 'ざるうどん', '温うどん'] },
  { name: 'そば（1玉）',                calories: 268, protein: 12.0, carbs: 51.7, fat: 1.8,  portion: '200g',  category: '主食', aliases: ['蕎麦', '日本そば', 'ざるそば', 'もりそば'] },
  { name: 'そうめん（1束）',            calories: 127, protein: 3.8,  carbs: 26.5, fat: 0.5,  portion: '50g',   category: '主食', aliases: ['素麺', '冷麦', 'ひやむぎ', 'そうめん麺'] },
  { name: 'ラーメン（1杯）',            calories: 472, protein: 18.0, carbs: 68.0, fat: 14.0, portion: '500g',  category: '主食', aliases: ['らーめん', '中華そば', 'ramen', '拉麺'] },
  { name: '冷やし中華（1杯）',          calories: 490, protein: 16.0, carbs: 72.0, fat: 14.0, portion: '400g',  category: '主食', aliases: ['冷し中華', 'ひやしちゅうか', 'cold noodle'] },
  { name: 'パスタ（1人前）',            calories: 374, protein: 13.2, carbs: 73.1, fat: 1.8,  portion: '200g',  category: '主食', aliases: ['スパゲッティ', 'スパゲティ', 'pasta', 'ペンネ', 'スパ'] },
  { name: '焼きそば（1人前）',          calories: 430, protein: 14.0, carbs: 62.0, fat: 14.0, portion: '300g',  category: '主食', aliases: ['やきそば', 'ソース焼きそば', '炒め麺'] },
  { name: 'チャーハン（1皿）',          calories: 550, protein: 14.0, carbs: 78.0, fat: 18.0, portion: '280g',  category: '主食', aliases: ['炒飯', 'やきめし', '焼き飯', 'fried rice'] },
  { name: 'カレーライス（1皿）',        calories: 650, protein: 17.0, carbs: 105.0, fat: 15.0, portion: '500g', category: '主食', aliases: ['カレー', 'curry', 'カレーご飯'] },
  { name: 'ピラフ（1皿）',              calories: 450, protein: 10.0, carbs: 70.0, fat: 13.0, portion: '250g',  category: '主食', aliases: ['pilaf'] },
  { name: 'ピザ（1/4枚）',              calories: 350, protein: 14.0, carbs: 45.0, fat: 13.0, portion: '150g',  category: '主食', aliases: ['pizza', 'マルゲリータ', 'ピッツァ'] },
  { name: 'ナン（1枚）',                calories: 262, protein: 8.5,  carbs: 52.0, fat: 3.0,  portion: '100g',  category: '主食', aliases: ['naan', 'インドパン'] },
  { name: 'コーンフレーク（1食）',      calories: 143, protein: 3.0,  carbs: 32.0, fat: 0.6,  portion: '40g',   category: '主食', aliases: ['シリアル', 'cereal', 'コーンフレークス'] },
  { name: 'オートミール（1食）',        calories: 150, protein: 5.0,  carbs: 27.0, fat: 2.5,  portion: '40g',   category: '主食', aliases: ['グラノーラ', 'oatmeal', 'オーツ'] },
  { name: 'グラタン（1皿）',            calories: 350, protein: 14.0, carbs: 30.0, fat: 18.0, portion: '250g',  category: '主食', aliases: ['gratin', 'マカロニグラタン'] },
  { name: 'ドリア（1皿）',              calories: 400, protein: 15.0, carbs: 55.0, fat: 14.0, portion: '300g',  category: '主食', aliases: ['doria', 'シーフードドリア'] },
  { name: 'お好み焼き（1枚）',          calories: 400, protein: 14.0, carbs: 48.0, fat: 16.0, portion: '250g',  category: '主食', aliases: ['おこのみやき', 'okonomiyaki', 'ソース焼き'] },
  { name: 'たこ焼き（6個）',            calories: 290, protein: 10.0, carbs: 38.0, fat: 11.0, portion: '180g',  category: '主食', aliases: ['たこやき', 'takoyaki'] },

  // ===== 丼物 =====
  { name: '牛丼（並盛）',              calories: 666, protein: 23.0, carbs: 95.0, fat: 20.0, portion: '350g',  category: '丼物', aliases: ['ぎゅうどん', '牛どん', 'beef bowl'] },
  { name: '親子丼（1杯）',              calories: 560, protein: 26.0, carbs: 72.0, fat: 16.0, portion: '350g',  category: '丼物', aliases: ['おやこどん', 'oyakodon'] },
  { name: 'カツ丼（1杯）',              calories: 850, protein: 35.0, carbs: 105.0, fat: 28.0, portion: '400g', category: '丼物', aliases: ['かつどん', 'katsudon'] },
  { name: '天丼（1杯）',                calories: 750, protein: 22.0, carbs: 108.0, fat: 20.0, portion: '400g', category: '丼物', aliases: ['てんどん', 'tendon'] },
  { name: '海鮮丼（1杯）',              calories: 480, protein: 28.0, carbs: 70.0, fat: 8.0,  portion: '350g',  category: '丼物', aliases: ['かいせんどん', 'seafood bowl'] },
  { name: '鶏そぼろ丼（1杯）',          calories: 500, protein: 22.0, carbs: 72.0, fat: 12.0, portion: '320g',  category: '丼物', aliases: ['そぼろどん', 'とりそぼろ', '鶏ミンチ丼'] },
  { name: '豚丼（1杯）',                calories: 620, protein: 25.0, carbs: 88.0, fat: 18.0, portion: '350g',  category: '丼物', aliases: ['ぶたどん', '豚どん', 'pork bowl'] },
  { name: '中華丼（1皿）',              calories: 600, protein: 20.0, carbs: 88.0, fat: 16.0, portion: '400g',  category: '丼物', aliases: ['ちゅうかどん', '八宝菜丼'] },
  { name: 'マグロ丼（1杯）',            calories: 460, protein: 30.0, carbs: 68.0, fat: 4.0,  portion: '320g',  category: '丼物', aliases: ['まぐろどん', 'ネギトロ丼', 'てっかどん'] },
  { name: '納豆ごはん（1杯）',          calories: 352, protein: 12.0, carbs: 61.0, fat: 5.9,  portion: '200g',  category: '丼物', aliases: ['納豆ご飯', 'なっとうごはん'] },

  // ===== 卵料理 =====
  { name: '卵（1個・生）',              calories: 76,  protein: 6.2,  carbs: 0.2,  fat: 5.1,  portion: '60g',   category: '卵料理', aliases: ['たまご', 'タマゴ', 'egg', '生卵', '鶏卵'] },
  { name: '目玉焼き（1個）',            calories: 96,  protein: 6.2,  carbs: 0.3,  fat: 7.5,  portion: '65g',   category: '卵料理', aliases: ['目玉焼', 'めだまやき', 'フライドエッグ'] },
  { name: '卵焼き（1人前）',            calories: 185, protein: 12.5, carbs: 4.0,  fat: 12.8, portion: '130g',  category: '卵料理', aliases: ['玉子焼き', '玉子焼', 'だし巻き', 'だし巻き卵', 'たまごやき'] },
  { name: 'スクランブルエッグ（1人前）', calories: 165, protein: 11.5, carbs: 1.5, fat: 12.5, portion: '110g',  category: '卵料理', aliases: ['いり卵', '炒り卵', 'scrambled egg'] },
  { name: 'オムレツ（1人前）',          calories: 200, protein: 13.0, carbs: 2.5,  fat: 15.5, portion: '120g',  category: '卵料理', aliases: ['omelet', 'たまごオムレツ'] },
  { name: 'ゆで卵（1個）',              calories: 78,  protein: 6.5,  carbs: 0.2,  fat: 5.2,  portion: '60g',   category: '卵料理', aliases: ['ゆでたまご', 'boiled egg', '固ゆで卵'] },
  { name: '温泉卵（1個）',              calories: 68,  protein: 5.8,  carbs: 0.2,  fat: 4.6,  portion: '60g',   category: '卵料理', aliases: ['おんせんたまご', 'onsen egg', '半熟卵'] },
  { name: '茶碗蒸し（1個）',            calories: 70,  protein: 5.5,  carbs: 3.5,  fat: 3.0,  portion: '150g',  category: '卵料理', aliases: ['ちゃわんむし', 'chawan mushi', '茶碗むし'] },
  { name: 'オムライス（1皿）',          calories: 580, protein: 20.0, carbs: 72.0, fat: 22.0, portion: '350g',  category: '卵料理', aliases: ['オムライス', 'omurice', 'omelet rice'] },

  // ===== 肉料理 =====
  { name: '唐揚げ（3個）',              calories: 285, protein: 20.5, carbs: 11.5, fat: 16.5, portion: '150g',  category: '肉料理', aliases: ['から揚げ', 'からあげ', '鶏の唐揚げ', '鶏唐揚げ', 'karaage'] },
  { name: 'トンカツ（1枚）',            calories: 450, protein: 25.0, carbs: 22.0, fat: 28.0, portion: '180g',  category: '肉料理', aliases: ['豚カツ', 'とんかつ', 'pork cutlet', 'カツ'] },
  { name: 'チキンカツ（1枚）',          calories: 360, protein: 28.0, carbs: 18.0, fat: 18.0, portion: '150g',  category: '肉料理', aliases: ['鶏カツ', 'チキンカツ', 'chicken cutlet'] },
  { name: 'ハンバーグ（1個）',          calories: 295, protein: 18.5, carbs: 12.0, fat: 18.5, portion: '150g',  category: '肉料理', aliases: ['はんばーぐ', 'hamburger steak', 'デミハンバーグ'] },
  { name: 'メンチカツ（1個）',          calories: 240, protein: 12.0, carbs: 16.0, fat: 14.0, portion: '100g',  category: '肉料理', aliases: ['メンチ', 'minced cutlet'] },
  { name: 'コロッケ（1個）',            calories: 176, protein: 4.5,  carbs: 22.0, fat: 8.5,  portion: '90g',   category: '肉料理', aliases: ['croquette', 'ポテトコロッケ'] },
  { name: 'ロールキャベツ（2個）',      calories: 220, protein: 14.0, carbs: 16.0, fat: 10.0, portion: '200g',  category: '肉料理', aliases: ['ロールキャベツ', 'stuffed cabbage'] },
  { name: 'ミートボール（5個）',        calories: 245, protein: 13.5, carbs: 12.0, fat: 15.5, portion: '120g',  category: '肉料理', aliases: ['ミートボール', 'meatball', '肉団子'] },
  { name: '餃子（5個）',                calories: 280, protein: 14.5, carbs: 28.0, fat: 12.0, portion: '150g',  category: '肉料理', aliases: ['ぎょうざ', 'ギョーザ', 'gyoza', '焼き餃子', '水餃子'] },
  { name: '焼き鳥（2本）',              calories: 130, protein: 12.0, carbs: 5.0,  fat: 6.5,  portion: '80g',   category: '肉料理', aliases: ['やきとり', 'yakitori', '鶏串'] },
  { name: 'チキンソテー（1枚）',        calories: 280, protein: 26.0, carbs: 5.0,  fat: 16.0, portion: '150g',  category: '肉料理', aliases: ['チキンステーキ', 'chicken saute'] },
  { name: '照り焼きチキン（1枚）',      calories: 290, protein: 26.0, carbs: 8.5,  fat: 15.0, portion: '150g',  category: '肉料理', aliases: ['てりやき', 'teriyaki', 'テリヤキ'] },
  { name: '肉じゃが（1人前）',          calories: 220, protein: 12.0, carbs: 27.0, fat: 7.0,  portion: '200g',  category: '肉料理', aliases: ['にくじゃが', 'nikujaga'] },
  { name: 'すき焼き（1人前）',          calories: 400, protein: 22.0, carbs: 28.0, fat: 22.0, portion: '250g',  category: '肉料理', aliases: ['すきやき', 'sukiyaki'] },
  { name: 'しゃぶしゃぶ（1人前）',      calories: 320, protein: 24.0, carbs: 5.0,  fat: 22.0, portion: '200g',  category: '肉料理', aliases: ['しゃぶしゃぶ', 'shabu shabu'] },
  { name: 'ステーキ（1枚）',            calories: 350, protein: 28.0, carbs: 1.0,  fat: 24.0, portion: '150g',  category: '肉料理', aliases: ['steak', 'ビーフステーキ', 'サーロイン'] },
  { name: '焼肉カルビ（100g）',         calories: 472, protein: 14.0, carbs: 3.5,  fat: 42.0, portion: '100g',  category: '肉料理', aliases: ['カルビ', 'kalbi', '牛カルビ'] },
  { name: '焼肉ロース（100g）',         calories: 282, protein: 20.0, carbs: 3.0,  fat: 20.0, portion: '100g',  category: '肉料理', aliases: ['ロース', '牛ロース', 'roast beef'] },
  { name: '麻婆豆腐（1人前）',          calories: 230, protein: 14.0, carbs: 10.0, fat: 14.0, portion: '200g',  category: '肉料理', aliases: ['まーぼーとうふ', 'mapo tofu', 'マーボー豆腐'] },
  { name: '回鍋肉（1人前）',            calories: 280, protein: 16.0, carbs: 8.0,  fat: 20.0, portion: '200g',  category: '肉料理', aliases: ['ホイコーロー', 'twice cooked pork', 'キャベツ炒め肉'] },
  { name: '青椒肉絲（1人前）',          calories: 200, protein: 14.0, carbs: 8.0,  fat: 12.0, portion: '180g',  category: '肉料理', aliases: ['チンジャオロース', 'chinjaorosu', 'ピーマン肉炒め'] },
  { name: '酢豚（1人前）',              calories: 310, protein: 16.0, carbs: 28.0, fat: 14.0, portion: '200g',  category: '肉料理', aliases: ['すぶた', 'sweet and sour pork', '甘酢豚'] },
  { name: '春巻き（2本）',              calories: 260, protein: 8.0,  carbs: 28.0, fat: 13.0, portion: '120g',  category: '肉料理', aliases: ['はるまき', 'spring roll', 'ハルマキ'] },
  { name: '肉まん（1個）',              calories: 235, protein: 9.0,  carbs: 34.0, fat: 7.5,  portion: '100g',  category: '肉料理', aliases: ['にくまん', 'meat bun', '豚まん'] },
  { name: '鶏むね肉（100g）',           calories: 108, protein: 22.3, carbs: 0.0,  fat: 1.5,  portion: '100g',  category: '肉料理', aliases: ['鶏胸肉', 'とりむね', 'チキン', '鶏肉'] },
  { name: '鶏もも肉（100g）',           calories: 190, protein: 17.3, carbs: 0.0,  fat: 13.0, portion: '100g',  category: '肉料理', aliases: ['鶏腿肉', 'とりもも', 'もも肉'] },
  { name: '豚バラ肉（100g）',           calories: 386, protein: 13.4, carbs: 0.1,  fat: 34.0, portion: '100g',  category: '肉料理', aliases: ['豚バラ', 'ばら肉', '豚肉', 'ぶた肉'] },
  { name: '豚ロース肉（100g）',         calories: 248, protein: 19.3, carbs: 0.2,  fat: 18.0, portion: '100g',  category: '肉料理', aliases: ['豚ロース', 'ぽーくろーす', 'pork loin'] },
  { name: '牛もも肉（100g）',           calories: 182, protein: 21.2, carbs: 0.3,  fat: 9.6,  portion: '100g',  category: '肉料理', aliases: ['牛肉', 'ビーフ', 'beef', 'うし肉'] },
  { name: 'ウインナー（3本）',          calories: 191, protein: 6.5,  carbs: 3.1,  fat: 16.8, portion: '60g',   category: '肉料理', aliases: ['ウィンナー', 'ソーセージ', 'フランクフルト', 'wiener'] },
  { name: 'ハム（2枚）',                calories: 65,  protein: 6.5,  carbs: 1.5,  fat: 4.0,  portion: '40g',   category: '肉料理', aliases: ['ham', 'ロースハム', 'スライスハム'] },
  { name: 'ベーコン（2枚）',            calories: 128, protein: 6.5,  carbs: 0.2,  fat: 11.0, portion: '40g',   category: '肉料理', aliases: ['bacon', 'ストリップベーコン'] },
  { name: 'ミートソース（1人前）',      calories: 350, protein: 16.0, carbs: 25.0, fat: 20.0, portion: '200g',  category: '肉料理', aliases: ['ボロネーゼ', 'bolognese', 'ミートスパ'] },

  // ===== 魚介料理 =====
  { name: 'さんまの塩焼き（1尾）',      calories: 286, protein: 20.5, carbs: 0.1,  fat: 22.0, portion: '120g',  category: '魚介料理', aliases: ['サンマ', '秋刀魚', '塩焼き'] },
  { name: '鮭の塩焼き（1切れ）',        calories: 133, protein: 20.5, carbs: 0.1,  fat: 4.1,  portion: '80g',   category: '魚介料理', aliases: ['サーモン', '鮭', 'さけ', 'salmon', '塩鮭'] },
  { name: 'さばの味噌煮（1切れ）',      calories: 245, protein: 18.5, carbs: 10.5, fat: 13.5, portion: '120g',  category: '魚介料理', aliases: ['サバ味噌', 'さば缶', 'サバ缶', '鯖の味噌煮'] },
  { name: 'アジフライ（1枚）',          calories: 210, protein: 16.5, carbs: 13.0, fat: 10.5, portion: '110g',  category: '魚介料理', aliases: ['あじフライ', '鯵フライ', 'aji fry'] },
  { name: '魚フライ（1切れ）',          calories: 230, protein: 16.0, carbs: 14.0, fat: 12.0, portion: '120g',  category: '魚介料理', aliases: ['フライ', 'fish fry', '白身フライ'] },
  { name: 'エビフライ（2本）',          calories: 180, protein: 15.0, carbs: 12.0, fat: 8.0,  portion: '100g',  category: '魚介料理', aliases: ['えびフライ', '海老フライ', 'shrimp fry'] },
  { name: 'エビ天ぷら（2本）',          calories: 150, protein: 10.0, carbs: 12.0, fat: 6.0,  portion: '80g',   category: '魚介料理', aliases: ['えびてんぷら', '海老天', 'shrimp tempura', '天ぷら'] },
  { name: 'まぐろ刺身（5切れ）',        calories: 108, protein: 23.5, carbs: 0.0,  fat: 1.4,  portion: '80g',   category: '魚介料理', aliases: ['鮪', 'マグロ', 'tuna sashimi', '刺身', 'お刺身'] },
  { name: 'サーモン刺身（5切れ）',      calories: 130, protein: 18.0, carbs: 0.1,  fat: 6.0,  portion: '80g',   category: '魚介料理', aliases: ['サーモン', '鮭刺身', 'salmon sashimi'] },
  { name: 'にぎり寿司（8貫）',          calories: 400, protein: 24.0, carbs: 55.0, fat: 6.0,  portion: '280g',  category: '魚介料理', aliases: ['お寿司', 'おすし', 'sushi', '握り寿司'] },
  { name: 'えび（5尾）',                calories: 60,  protein: 13.6, carbs: 0.1,  fat: 0.3,  portion: '70g',   category: '魚介料理', aliases: ['エビ', '海老', '蝦', 'shrimp', 'プリプリエビ'] },
  { name: 'ほたて（3個）',              calories: 60,  protein: 10.5, carbs: 3.5,  fat: 0.5,  portion: '75g',   category: '魚介料理', aliases: ['ホタテ', '帆立', 'scallop', 'ホタテ貝'] },
  { name: 'いか（100g）',               calories: 88,  protein: 17.9, carbs: 0.4,  fat: 1.3,  portion: '100g',  category: '魚介料理', aliases: ['イカ', '烏賊', 'squid', 'calamari'] },
  { name: 'たこ（100g）',               calories: 76,  protein: 16.4, carbs: 0.1,  fat: 0.7,  portion: '100g',  category: '魚介料理', aliases: ['タコ', '蛸', 'octopus'] },
  { name: 'しらす（大さじ2）',          calories: 18,  protein: 3.0,  carbs: 0.0,  fat: 0.3,  portion: '15g',   category: '魚介料理', aliases: ['シラス', '白子', 'chirimen'] },
  { name: 'ちくわ（2本）',              calories: 72,  protein: 6.4,  carbs: 9.7,  fat: 0.8,  portion: '60g',   category: '魚介料理', aliases: ['竹輪', 'chikuwa', '練り物'] },
  { name: 'かまぼこ（2切れ）',          calories: 38,  protein: 4.8,  carbs: 3.8,  fat: 0.4,  portion: '40g',   category: '魚介料理', aliases: ['蒲鉾', 'kamaboko', '板かまぼこ'] },
  { name: 'さつま揚げ（1枚）',          calories: 95,  protein: 7.5,  carbs: 8.5,  fat: 3.5,  portion: '60g',   category: '魚介料理', aliases: ['さつまあげ', 'fried fishcake', 'てんぷら（九州）'] },
  { name: 'ツナ缶（1缶）',              calories: 97,  protein: 15.7, carbs: 0.3,  fat: 2.5,  portion: '70g',   category: '魚介料理', aliases: ['ツナ', 'シーチキン', 'tuna can'] },
  { name: 'サバ缶（1/2缶）',            calories: 190, protein: 17.0, carbs: 0.3,  fat: 12.5, portion: '100g',  category: '魚介料理', aliases: ['さば缶', 'サバ水煮', '鯖缶'] },

  // ===== 豆腐・大豆製品 =====
  { name: '豆腐（半丁）',              calories: 72,  protein: 6.5,  carbs: 1.5,  fat: 4.1,  portion: '150g',  category: '豆腐・大豆', aliases: ['とうふ', 'tofu', '絹豆腐', '木綿豆腐'] },
  { name: '納豆（1パック）',            calories: 100, protein: 8.3,  carbs: 5.4,  fat: 5.4,  portion: '50g',   category: '豆腐・大豆', aliases: ['なっとう', 'natto', '糸引き納豆'] },
  { name: '厚揚げ（1枚）',              calories: 143, protein: 9.5,  carbs: 1.5,  fat: 11.0, portion: '100g',  category: '豆腐・大豆', aliases: ['あつあげ', '生揚げ', 'thick fried tofu'] },
  { name: '油揚げ（1枚）',              calories: 119, protein: 7.5,  carbs: 0.5,  fat: 10.0, portion: '30g',   category: '豆腐・大豆', aliases: ['あぶらあげ', 'fried tofu', 'うすあげ'] },
  { name: 'がんもどき（1個）',          calories: 140, protein: 8.5,  carbs: 4.5,  fat: 10.5, portion: '90g',   category: '豆腐・大豆', aliases: ['がんも', 'ganmodoki'] },
  { name: '豆乳（1杯）',                calories: 92,  protein: 5.0,  carbs: 6.0,  fat: 4.5,  portion: '200ml', category: '豆腐・大豆', aliases: ['とうにゅう', 'soy milk', 'ソイミルク', '調整豆乳'] },
  { name: '枝豆（50g）',                calories: 68,  protein: 5.8,  carbs: 4.5,  fat: 3.0,  portion: '50g',   category: '豆腐・大豆', aliases: ['えだまめ', 'edamame', '大豆'] },
  { name: '高野豆腐（1枚）',            calories: 52,  protein: 5.0,  carbs: 1.0,  fat: 3.0,  portion: '20g',   category: '豆腐・大豆', aliases: ['こうやどうふ', '凍り豆腐', 'freeze-dried tofu'] },

  // ===== 野菜・副菜 =====
  { name: 'にんじん（中1本）',          calories: 30,  protein: 0.7,  carbs: 6.8,  fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['人参', 'ニンジン', 'carrot'] },
  { name: 'ほうれん草（1束）',          calories: 20,  protein: 2.2,  carbs: 3.1,  fat: 0.4,  portion: '100g',  category: '野菜', aliases: ['ほうれんそう', 'spinach', 'おひたし'] },
  { name: 'ほうれん草のお浸し（1人前）', calories: 22,  protein: 2.3,  carbs: 3.2,  fat: 0.5,  portion: '100g', category: '野菜', aliases: ['おひたし', 'お浸し', 'ほうれん草お浸し'] },
  { name: 'ブロッコリー（1/2房）',      calories: 37,  protein: 4.3,  carbs: 5.2,  fat: 0.5,  portion: '100g',  category: '野菜', aliases: ['ブロッコリ', 'broccoli'] },
  { name: 'トマト（中1個）',            calories: 19,  protein: 0.7,  carbs: 3.9,  fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['tomato', 'ミニトマト', 'プチトマト'] },
  { name: 'きゅうり（1本）',            calories: 13,  protein: 1.0,  carbs: 2.4,  fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['胡瓜', 'キュウリ', 'cucumber'] },
  { name: 'キャベツ（100g）',           calories: 23,  protein: 1.3,  carbs: 5.2,  fat: 0.2,  portion: '100g',  category: '野菜', aliases: ['cabbage', '千切りキャベツ'] },
  { name: 'じゃがいも（中1個）',        calories: 84,  protein: 1.6,  carbs: 19.7, fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['馬鈴薯', 'ポテト', 'potato', 'いも'] },
  { name: 'さつまいも（中1/2本）',      calories: 130, protein: 1.2,  carbs: 32.0, fat: 0.2,  portion: '100g',  category: '野菜', aliases: ['サツマイモ', '薩摩芋', 'sweet potato', '焼き芋'] },
  { name: 'たまねぎ（中1/2個）',        calories: 33,  protein: 1.0,  carbs: 7.6,  fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['玉葱', '玉ねぎ', 'onion'] },
  { name: 'えだまめ（50g）',            calories: 68,  protein: 5.8,  carbs: 4.5,  fat: 3.0,  portion: '50g',   category: '野菜', aliases: ['枝豆', 'エダマメ', 'edamame'] },
  { name: 'コーン缶（1/2缶）',          calories: 77,  protein: 2.9,  carbs: 15.9, fat: 1.2,  portion: '80g',   category: '野菜', aliases: ['とうもろこし', 'コーン', 'corn', 'スイートコーン'] },
  { name: 'なす（中1本）',              calories: 18,  protein: 1.1,  carbs: 3.6,  fat: 0.1,  portion: '80g',   category: '野菜', aliases: ['ナス', '茄子', 'eggplant', 'aubergine'] },
  { name: 'ピーマン（2個）',            calories: 11,  protein: 0.9,  carbs: 2.8,  fat: 0.2,  portion: '60g',   category: '野菜', aliases: ['ピーマン', 'green pepper', 'bell pepper'] },
  { name: 'パプリカ（1/2個）',          calories: 30,  protein: 1.0,  carbs: 7.0,  fat: 0.2,  portion: '75g',   category: '野菜', aliases: ['赤パプリカ', '黄パプリカ', 'paprika', 'red pepper'] },
  { name: 'アスパラガス（3本）',        calories: 16,  protein: 1.8,  carbs: 2.4,  fat: 0.2,  portion: '60g',   category: '野菜', aliases: ['アスパラ', 'asparagus'] },
  { name: 'レタス（1枚）',              calories: 5,   protein: 0.3,  carbs: 0.9,  fat: 0.1,  portion: '30g',   category: '野菜', aliases: ['レタス', 'lettuce', 'サニーレタス'] },
  { name: '白菜（1/4個）',              calories: 26,  protein: 1.4,  carbs: 5.2,  fat: 0.2,  portion: '200g',  category: '野菜', aliases: ['ハクサイ', '白菜', 'chinese cabbage', 'はくさい'] },
  { name: '長ネギ（1本）',              calories: 35,  protein: 1.4,  carbs: 8.3,  fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['ねぎ', 'ネギ', '葱', 'green onion', '長葱'] },
  { name: 'しいたけ（3枚）',            calories: 18,  protein: 2.2,  carbs: 3.7,  fat: 0.4,  portion: '60g',   category: '野菜', aliases: ['シイタケ', '椎茸', 'shiitake'] },
  { name: 'しめじ（1/2袋）',            calories: 16,  protein: 2.0,  carbs: 3.3,  fat: 0.5,  portion: '50g',   category: '野菜', aliases: ['シメジ', '占地', 'shimeji'] },
  { name: 'エリンギ（1本）',            calories: 20,  protein: 2.0,  carbs: 4.0,  fat: 0.3,  portion: '60g',   category: '野菜', aliases: ['えりんぎ', 'king oyster mushroom'] },
  { name: 'まいたけ（1/2袋）',          calories: 15,  protein: 1.5,  carbs: 2.7,  fat: 0.5,  portion: '50g',   category: '野菜', aliases: ['マイタケ', '舞茸', 'maitake'] },
  { name: 'れんこん（1節）',            calories: 66,  protein: 1.9,  carbs: 15.5, fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['レンコン', '蓮根', 'lotus root'] },
  { name: 'ごぼう（1/2本）',            calories: 65,  protein: 1.8,  carbs: 15.4, fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['ゴボウ', '牛蒡', 'burdock root'] },
  { name: 'さといも（中2個）',          calories: 76,  protein: 1.5,  carbs: 17.3, fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['里芋', 'サトイモ', 'taro'] },
  { name: 'かぼちゃ（1/8個）',          calories: 80,  protein: 1.6,  carbs: 20.6, fat: 0.3,  portion: '120g',  category: '野菜', aliases: ['カボチャ', '南瓜', 'pumpkin', 'squash'] },
  { name: 'とうもろこし（1本）',        calories: 91,  protein: 3.6,  carbs: 21.0, fat: 1.7,  portion: '150g',  category: '野菜', aliases: ['コーン', 'トウモロコシ', 'corn'] },
  { name: '大根（1/4本）',              calories: 18,  protein: 0.5,  carbs: 4.1,  fat: 0.1,  portion: '100g',  category: '野菜', aliases: ['だいこん', 'ダイコン', '大根おろし', 'daikon'] },
  { name: 'ごま（大さじ1）',            calories: 56,  protein: 1.9,  carbs: 2.0,  fat: 5.0,  portion: '9g',    category: '野菜', aliases: ['セサミ', 'sesame', 'いりごま'] },
  // 野菜料理
  { name: '野菜炒め（1人前）',          calories: 120, protein: 5.0,  carbs: 10.0, fat: 6.5,  portion: '180g',  category: '副菜', aliases: ['やさいいため', '炒め物', 'stir fry'] },
  { name: '野菜サラダ（1人前）',        calories: 45,  protein: 1.5,  carbs: 7.5,  fat: 1.5,  portion: '150g',  category: '副菜', aliases: ['サラダ', 'グリーンサラダ', 'salad', 'レタスサラダ'] },
  { name: 'ポテトサラダ（1人前）',      calories: 190, protein: 3.5,  carbs: 18.0, fat: 11.0, portion: '120g',  category: '副菜', aliases: ['ポテサラ'] },
  { name: 'ひじきの煮物（1人前）',      calories: 60,  protein: 2.5,  carbs: 9.0,  fat: 2.0,  portion: '80g',   category: '副菜', aliases: ['ひじき', '鹿尾菜', 'hijiki'] },
  { name: 'きんぴらごぼう（1人前）',    calories: 90,  protein: 2.5,  carbs: 14.0, fat: 3.0,  portion: '80g',   category: '副菜', aliases: ['きんぴら', 'kinpira'] },
  { name: '筑前煮（1人前）',            calories: 145, protein: 9.0,  carbs: 18.0, fat: 4.0,  portion: '180g',  category: '副菜', aliases: ['ちくぜんに', '煮物', '炒り鶏'] },
  { name: '切り干し大根の煮物（1人前）', calories: 75,  protein: 2.0,  carbs: 13.0, fat: 1.5,  portion: '80g',  category: '副菜', aliases: ['切り干し大根', 'きりぼしだいこん', '大根の煮物'] },
  { name: 'かぼちゃの煮物（1人前）',    calories: 95,  protein: 2.0,  carbs: 24.0, fat: 0.5,  portion: '120g',  category: '副菜', aliases: ['南瓜の煮物', 'かぼちゃ煮', 'かぼちゃ'] },
  { name: 'なすの煮浸し（1人前）',      calories: 55,  protein: 1.5,  carbs: 6.0,  fat: 3.0,  portion: '100g',  category: '副菜', aliases: ['ナスの煮物', 'なすのにびたし'] },
  { name: 'マカロニサラダ（1人前）',    calories: 220, protein: 4.5,  carbs: 26.0, fat: 11.0, portion: '120g',  category: '副菜', aliases: ['マカロニサラダ', 'macaroni salad'] },

  // ===== 汁物 =====
  { name: '味噌汁（1杯）',              calories: 31,  protein: 2.1,  carbs: 3.1,  fat: 1.0,  portion: '180ml', category: '汁物', aliases: ['みそ汁', 'お味噌汁', 'おみそしる', 'みそしる'] },
  { name: '豚汁（1杯）',                calories: 150, protein: 7.5,  carbs: 12.0, fat: 7.0,  portion: '200ml', category: '汁物', aliases: ['とんじる', 'tonjiru', 'ぶた汁'] },
  { name: 'コーンスープ（1杯）',        calories: 130, protein: 3.5,  carbs: 16.0, fat: 5.5,  portion: '200ml', category: '汁物', aliases: ['コーンポタージュ', 'ポタージュ', 'corn soup'] },
  { name: 'コンソメスープ（1杯）',      calories: 15,  protein: 1.0,  carbs: 2.5,  fat: 0.1,  portion: '200ml', category: '汁物', aliases: ['コンソメ', 'consomme', '洋風スープ'] },
  { name: 'トマトスープ（1杯）',        calories: 50,  protein: 1.5,  carbs: 8.5,  fat: 1.5,  portion: '200ml', category: '汁物', aliases: ['トマトスープ', 'tomato soup', 'ガスパチョ'] },
  { name: 'クラムチャウダー（1杯）',    calories: 180, protein: 7.0,  carbs: 16.0, fat: 9.0,  portion: '200ml', category: '汁物', aliases: ['クラムチャウダー', 'clam chowder'] },
  { name: 'シチュー（1皿）',            calories: 280, protein: 15.0, carbs: 25.0, fat: 12.0, portion: '250g',  category: '汁物', aliases: ['クリームシチュー', 'ビーフシチュー', 'stew'] },
  { name: 'スープ餃子（5個）',          calories: 200, protein: 10.0, carbs: 22.0, fat: 8.0,  portion: '200g',  category: '汁物', aliases: ['スープぎょうざ', '水餃子スープ'] },

  // ===== 乳製品 =====
  { name: '牛乳（1杯）',                calories: 122, protein: 6.6,  carbs: 9.6,  fat: 6.9,  portion: '200ml', category: '乳製品', aliases: ['ミルク', 'milk', '生乳', 'ぎゅうにゅう', '低脂肪乳'] },
  { name: 'ヨーグルト（1個）',          calories: 65,  protein: 3.4,  carbs: 7.9,  fat: 2.0,  portion: '100g',  category: '乳製品', aliases: ['yogurt', 'プレーンヨーグルト', 'よーぐると'] },
  { name: 'チーズ（スライス1枚）',      calories: 68,  protein: 4.1,  carbs: 0.4,  fat: 5.2,  portion: '20g',   category: '乳製品', aliases: ['cheese', 'スライスチーズ', 'とろけるチーズ', 'プロセスチーズ'] },
  { name: 'バター（1かけ）',            calories: 74,  protein: 0.1,  carbs: 0.0,  fat: 8.2,  portion: '10g',   category: '乳製品', aliases: ['butter', 'マーガリン'] },
  { name: '生クリーム（大さじ2）',      calories: 130, protein: 0.9,  carbs: 1.5,  fat: 13.5, portion: '30ml',  category: '乳製品', aliases: ['ホイップクリーム', 'whipped cream', 'cream'] },
  { name: 'アイスクリーム（1個）',      calories: 180, protein: 3.6,  carbs: 22.4, fat: 8.0,  portion: '100g',  category: '乳製品', aliases: ['アイス', 'ice cream', 'ソフトクリーム', 'ジェラート'] },

  // ===== 果物 =====
  { name: 'バナナ（1本）',              calories: 93,  protein: 1.1,  carbs: 22.5, fat: 0.2,  portion: '100g',  category: '果物', aliases: ['ばなな', 'banana', '完熟バナナ'] },
  { name: 'りんご（1/2個）',            calories: 56,  protein: 0.2,  carbs: 15.5, fat: 0.2,  portion: '100g',  category: '果物', aliases: ['リンゴ', 'アップル', 'apple', '林檎', 'ふじ'] },
  { name: 'みかん（1個）',              calories: 45,  protein: 0.7,  carbs: 11.1, fat: 0.1,  portion: '100g',  category: '果物', aliases: ['ミカン', 'オレンジ', 'マンダリン', '温州みかん', '柑橘'] },
  { name: 'いちご（5粒）',              calories: 34,  protein: 0.9,  carbs: 8.5,  fat: 0.1,  portion: '100g',  category: '果物', aliases: ['イチゴ', '苺', 'strawberry', 'ストロベリー'] },
  { name: 'ぶどう（1房）',              calories: 69,  protein: 0.4,  carbs: 17.1, fat: 0.1,  portion: '100g',  category: '果物', aliases: ['ブドウ', '葡萄', 'grape', 'マスカット'] },
  { name: 'もも（1個）',                calories: 43,  protein: 0.6,  carbs: 10.2, fat: 0.1,  portion: '100g',  category: '果物', aliases: ['桃', 'モモ', 'peach', 'ピーチ'] },
  { name: 'すいか（1切れ）',            calories: 37,  protein: 0.6,  carbs: 9.2,  fat: 0.1,  portion: '200g',  category: '果物', aliases: ['スイカ', '西瓜', 'watermelon'] },
  { name: 'キウイ（1個）',              calories: 53,  protein: 1.0,  carbs: 13.5, fat: 0.1,  portion: '100g',  category: '果物', aliases: ['キウイフルーツ', 'kiwi'] },
  { name: 'メロン（1切れ）',            calories: 45,  protein: 1.0,  carbs: 11.5, fat: 0.1,  portion: '150g',  category: '果物', aliases: ['メロン', 'melon', 'マスクメロン'] },
  { name: 'なし（1/2個）',              calories: 43,  protein: 0.3,  carbs: 11.3, fat: 0.1,  portion: '130g',  category: '果物', aliases: ['梨', 'ナシ', 'pear', '洋梨'] },
  { name: 'さくらんぼ（10粒）',         calories: 58,  protein: 1.0,  carbs: 14.0, fat: 0.1,  portion: '80g',   category: '果物', aliases: ['チェリー', 'cherry', 'サクランボ'] },
  { name: 'パイナップル（1切れ）',      calories: 51,  protein: 0.6,  carbs: 13.4, fat: 0.1,  portion: '120g',  category: '果物', aliases: ['パイナップル', 'pineapple', 'パイン'] },
  { name: 'マンゴー（1/2個）',          calories: 64,  protein: 0.6,  carbs: 16.9, fat: 0.1,  portion: '100g',  category: '果物', aliases: ['マンゴ', 'mango'] },
  { name: 'グレープフルーツ（1/2個）',  calories: 38,  protein: 0.9,  carbs: 9.6,  fat: 0.1,  portion: '150g',  category: '果物', aliases: ['グレープフルーツ', 'grapefruit'] },
  { name: 'アボカド（1/2個）',          calories: 95,  protein: 1.1,  carbs: 1.7,  fat: 9.3,  portion: '80g',   category: '果物', aliases: ['アボカド', 'avocado', 'バター果実'] },

  // ===== 飲み物 =====
  { name: 'オレンジジュース（1杯）',    calories: 42,  protein: 0.7,  carbs: 10.4, fat: 0.1,  portion: '200ml', category: '飲み物', aliases: ['みかんジュース', 'orange juice', 'OJ'] },
  { name: 'りんごジュース（1杯）',      calories: 46,  protein: 0.2,  carbs: 11.4, fat: 0.0,  portion: '200ml', category: '飲み物', aliases: ['アップルジュース', 'apple juice'] },
  { name: '野菜ジュース（1本）',        calories: 30,  protein: 1.0,  carbs: 6.5,  fat: 0.1,  portion: '200ml', category: '飲み物', aliases: ['野菜飲料', 'vegetable juice', 'トマトジュース'] },
  { name: 'スポーツドリンク（1本）',    calories: 48,  protein: 0.0,  carbs: 12.0, fat: 0.0,  portion: '500ml', category: '飲み物', aliases: ['ポカリスエット', 'スポドリ', 'sports drink', 'アクエリアス'] },
  { name: 'コーヒー牛乳（1本）',        calories: 92,  protein: 3.2,  carbs: 14.5, fat: 2.5,  portion: '200ml', category: '飲み物', aliases: ['カフェオレ', 'カフェラテ', 'cafe au lait'] },
  { name: 'ミルクティー（1杯）',        calories: 72,  protein: 2.0,  carbs: 10.5, fat: 2.0,  portion: '200ml', category: '飲み物', aliases: ['紅茶', 'milk tea', 'ロイヤルミルクティー'] },
  { name: '麦茶（1杯）',                calories: 2,   protein: 0.1,  carbs: 0.5,  fat: 0.0,  portion: '200ml', category: '飲み物', aliases: ['むぎちゃ', 'barley tea', 'お茶'] },
  { name: '炭酸飲料（1本）',            calories: 53,  protein: 0.1,  carbs: 13.0, fat: 0.0,  portion: '350ml', category: '飲み物', aliases: ['コーラ', 'ソーダ', 'soda', '炭酸'] },
  { name: 'ジュース（100ml）',          calories: 46,  protein: 0.2,  carbs: 11.4, fat: 0.0,  portion: '100ml', category: '飲み物', aliases: ['果汁', 'フルーツジュース', 'juice'] },
  { name: '豆乳（1杯）',                calories: 92,  protein: 5.0,  carbs: 6.0,  fat: 4.5,  portion: '200ml', category: '飲み物', aliases: ['とうにゅう', 'soy milk', 'ソイ'] },

  // ===== おやつ・菓子 =====
  { name: 'せんべい（3枚）',            calories: 112, protein: 2.3,  carbs: 24.0, fat: 0.5,  portion: '30g',   category: 'おやつ', aliases: ['煎餅', 'おせんべい', 'rice cracker'] },
  { name: 'チョコレート（25g）',        calories: 151, protein: 1.9,  carbs: 17.1, fat: 8.6,  portion: '25g',   category: 'おやつ', aliases: ['チョコ', 'chocolate', 'ミルクチョコ'] },
  { name: 'ポテトチップス（1袋）',      calories: 356, protein: 3.7,  carbs: 33.0, fat: 22.0, portion: '60g',   category: 'おやつ', aliases: ['ポテチ', 'potato chips', 'スナック'] },
  { name: 'プリン（1個）',              calories: 116, protein: 4.5,  carbs: 15.9, fat: 4.5,  portion: '100g',  category: 'おやつ', aliases: ['pudding', 'カスタードプリン'] },
  { name: 'クッキー（3枚）',            calories: 156, protein: 2.0,  carbs: 20.5, fat: 7.5,  portion: '30g',   category: 'おやつ', aliases: ['ビスケット', 'cookie', 'クラッカー'] },
  { name: 'ショートケーキ（1切れ）',    calories: 350, protein: 5.0,  carbs: 42.0, fat: 18.0, portion: '130g',  category: 'おやつ', aliases: ['ケーキ', 'strawberry shortcake', 'いちごケーキ'] },
  { name: 'チーズケーキ（1切れ）',      calories: 310, protein: 7.0,  carbs: 28.0, fat: 19.0, portion: '120g',  category: 'おやつ', aliases: ['cheese cake', 'チーズタルト'] },
  { name: 'チョコケーキ（1切れ）',      calories: 380, protein: 5.5,  carbs: 48.0, fat: 20.0, portion: '130g',  category: 'おやつ', aliases: ['ガトーショコラ', 'chocolate cake', 'チョコスポンジ'] },
  { name: 'ドーナツ（1個）',            calories: 265, protein: 3.5,  carbs: 32.0, fat: 14.0, portion: '80g',   category: 'おやつ', aliases: ['ドーナッツ', 'donut', 'doughnut'] },
  { name: 'たい焼き（1個）',            calories: 230, protein: 5.5,  carbs: 44.5, fat: 3.0,  portion: '120g',  category: 'おやつ', aliases: ['鯛焼き', 'taiyaki', 'たいやき', '鯛やき'] },
  { name: 'まんじゅう（1個）',          calories: 120, protein: 2.5,  carbs: 26.0, fat: 0.8,  portion: '55g',   category: 'おやつ', aliases: ['饅頭', 'manjyu', 'おまんじゅう'] },
  { name: 'カステラ（1切れ）',          calories: 175, protein: 3.8,  carbs: 33.5, fat: 2.8,  portion: '60g',   category: 'おやつ', aliases: ['カステラ', 'castella', 'スポンジケーキ'] },
  { name: 'ゼリー（1個）',              calories: 60,  protein: 1.5,  carbs: 14.0, fat: 0.0,  portion: '120g',  category: 'おやつ', aliases: ['jelly', 'フルーツゼリー', 'ゼリー菓子'] },
  { name: 'グミ（1袋）',                calories: 160, protein: 3.5,  carbs: 38.0, fat: 0.0,  portion: '45g',   category: 'おやつ', aliases: ['グミキャンディー', 'gummy'] },
  { name: '柿の種（1袋）',              calories: 180, protein: 3.5,  carbs: 33.0, fat: 4.0,  portion: '45g',   category: 'おやつ', aliases: ['かきのたね', '柿ピー', 'mixed nuts'] },
  { name: 'チョコアイス（1本）',        calories: 210, protein: 3.5,  carbs: 26.0, fat: 10.5, portion: '90g',   category: 'おやつ', aliases: ['チョコバー', 'chocolate ice cream', 'アイスバー'] },
  { name: 'ソフトクリーム（1個）',      calories: 165, protein: 4.0,  carbs: 22.0, fat: 7.0,  portion: '100g',  category: 'おやつ', aliases: ['ソフト', 'soft cream', 'ミルクソフト'] },
  { name: 'ワッフル（1個）',            calories: 225, protein: 5.0,  carbs: 32.0, fat: 9.0,  portion: '90g',   category: 'おやつ', aliases: ['waffle', 'ベルギーワッフル'] },
  { name: 'パンケーキ（2枚）',          calories: 340, protein: 7.5,  carbs: 52.0, fat: 11.5, portion: '150g',  category: 'おやつ', aliases: ['ホットケーキ', 'pancake', 'pancakes'] },
  { name: 'クレープ（1枚）',            calories: 230, protein: 4.5,  carbs: 30.0, fat: 11.0, portion: '90g',   category: 'おやつ', aliases: ['crepe', 'クレープ生地'] },
  { name: '大福（1個）',                calories: 215, protein: 3.5,  carbs: 48.0, fat: 1.0,  portion: '90g',   category: 'おやつ', aliases: ['だいふく', 'daifuku', 'いちご大福', 'もち'] },
  { name: 'ようかん（1切れ）',          calories: 130, protein: 1.5,  carbs: 32.0, fat: 0.2,  portion: '55g',   category: 'おやつ', aliases: ['羊羹', 'yokan', 'あんこ'] },
  { name: 'チョコクッキー（3枚）',      calories: 175, protein: 2.0,  carbs: 22.0, fat: 9.0,  portion: '35g',   category: 'おやつ', aliases: ['チョコビスケット', 'chocolate cookie'] },
  { name: 'ポップコーン（1袋）',        calories: 260, protein: 4.5,  carbs: 37.0, fat: 11.0, portion: '70g',   category: 'おやつ', aliases: ['popcorn', 'キャラメルポップコーン'] },

  // ===== 調味料・加工食品 =====
  { name: 'マヨネーズ（大さじ1）',      calories: 84,  protein: 0.3,  carbs: 0.4,  fat: 9.1,  portion: '12g',   category: '調味料', aliases: ['マヨ', 'mayo', 'mayonnaise'] },
  { name: 'ケチャップ（大さじ1）',      calories: 18,  protein: 0.4,  carbs: 4.2,  fat: 0.0,  portion: '15g',   category: '調味料', aliases: ['トマトケチャップ', 'ketchup'] },
  { name: 'ドレッシング（大さじ1）',    calories: 55,  protein: 0.2,  carbs: 2.5,  fat: 4.8,  portion: '15g',   category: '調味料', aliases: ['サラダドレッシング', 'dressing', 'フレンチドレッシング'] },
  { name: 'ソース（大さじ1）',          calories: 20,  protein: 0.3,  carbs: 4.5,  fat: 0.1,  portion: '18g',   category: '調味料', aliases: ['ウスターソース', 'tonkatsu sauce', 'お好みソース'] },
  { name: '醤油（大さじ1）',            calories: 14,  protein: 1.5,  carbs: 1.9,  fat: 0.0,  portion: '18g',   category: '調味料', aliases: ['しょうゆ', 'soy sauce', 'shoyu'] },
  { name: 'みそ（大さじ1）',            calories: 35,  protein: 2.2,  carbs: 4.0,  fat: 1.0,  portion: '18g',   category: '調味料', aliases: ['味噌', 'miso'] },
  { name: '砂糖（小さじ1）',            calories: 16,  protein: 0.0,  carbs: 4.1,  fat: 0.0,  portion: '4g',    category: '調味料', aliases: ['さとう', 'sugar', 'グラニュー糖'] },
  { name: 'オリーブオイル（大さじ1）',  calories: 111, protein: 0.0,  carbs: 0.0,  fat: 12.3, portion: '12g',   category: '調味料', aliases: ['オリーブ油', 'olive oil', 'エキストラバージン'] },
  { name: '漬物（小鉢）',              calories: 22,  protein: 1.0,  carbs: 4.5,  fat: 0.1,  portion: '50g',   category: '調味料', aliases: ['つけもの', 'pickle', 'お漬物', 'たくあん'] },
  { name: 'ふりかけ（1食分）',          calories: 20,  protein: 1.0,  carbs: 3.5,  fat: 0.3,  portion: '5g',    category: '調味料', aliases: ['ふりかけ', 'rice topping'] },
  { name: 'のり佃煮（大さじ1）',        calories: 30,  protein: 1.5,  carbs: 5.5,  fat: 0.3,  portion: '20g',   category: '調味料', aliases: ['佃煮', 'のりのつくだに', 'seaweed paste'] },
  { name: 'ポン酢（大さじ1）',          calories: 10,  protein: 0.5,  carbs: 2.0,  fat: 0.0,  portion: '18g',   category: '調味料', aliases: ['ポン酢しょうゆ', 'ponzu'] },

  // ===== 和食・定番おかず =====
  { name: 'ぶり大根（1人前）',          calories: 240, protein: 20.0, carbs: 14.0, fat: 9.5,  portion: '200g',  category: '主菜', aliases: ['ぶり', 'ブリ大根', '煮魚', '照り煮'] },
  { name: '豚の生姜焼き（1人前）',      calories: 310, protein: 22.0, carbs: 8.0,  fat: 20.0, portion: '150g',  category: '主菜', aliases: ['しょうが焼き', '生姜焼き', 'ginger pork'] },
  { name: '鶏の照り焼き（1枚）',        calories: 290, protein: 26.0, carbs: 8.5,  fat: 15.0, portion: '150g',  category: '主菜', aliases: ['てりやきチキン', 'teriyaki chicken', '照り焼き'] },
  { name: '鶏のから揚げ甘酢（3個）',    calories: 300, protein: 20.0, carbs: 15.0, fat: 16.0, portion: '150g',  category: '主菜', aliases: ['甘酢唐揚げ', '南蛮', 'チキン南蛮'] },
  { name: 'チキン南蛮（1人前）',        calories: 420, protein: 30.0, carbs: 28.0, fat: 20.0, portion: '200g',  category: '主菜', aliases: ['チキンなんばん', 'chicken nanban', '南蛮漬け'] },
  { name: '肉野菜炒め（1人前）',        calories: 250, protein: 18.0, carbs: 10.0, fat: 15.0, portion: '200g',  category: '主菜', aliases: ['肉炒め', '野菜炒め肉', '豚肉炒め'] },
  { name: 'ポークジンジャー（1人前）',  calories: 305, protein: 22.0, carbs: 7.5,  fat: 20.0, portion: '150g',  category: '主菜', aliases: ['生姜焼き豚', 'pork ginger'] },
  { name: 'さつまいもの天ぷら（2切れ）', calories: 160, protein: 1.5, carbs: 26.0, fat: 6.0,  portion: '100g',  category: '主菜', aliases: ['いもてん', 'さつまいも天ぷら', 'sweet potato tempura'] },
  { name: '野菜の天ぷら（1人前）',      calories: 200, protein: 3.0,  carbs: 24.0, fat: 10.0, portion: '130g',  category: '主菜', aliases: ['てんぷら', 'tempura', '野菜天'] },
  { name: 'カキフライ（3個）',          calories: 215, protein: 9.0,  carbs: 18.0, fat: 12.5, portion: '130g',  category: '主菜', aliases: ['牡蠣フライ', 'oyster fry', 'かきフライ'] },
  { name: 'ひれかつ（1枚）',            calories: 320, protein: 24.0, carbs: 18.0, fat: 16.5, portion: '150g',  category: '主菜', aliases: ['ヒレカツ', 'fillet cutlet', 'ヒレ肉カツ'] },
  { name: '牛すき煮（1人前）',          calories: 350, protein: 20.0, carbs: 22.0, fat: 18.0, portion: '220g',  category: '主菜', aliases: ['すき煮', 'すきやき風', '牛煮'] },
  { name: '豆腐ハンバーグ（1個）',      calories: 200, protein: 14.0, carbs: 14.0, fat: 10.0, portion: '150g',  category: '主菜', aliases: ['とうふハンバーグ', 'tofu hamburger'] },
  { name: '棒棒鶏（1人前）',            calories: 180, protein: 18.0, carbs: 6.0,  fat: 9.0,  portion: '150g',  category: '主菜', aliases: ['バンバンジー', '棒々鶏', 'banbanjii'] },
  { name: '豚キムチ炒め（1人前）',      calories: 280, protein: 18.0, carbs: 8.0,  fat: 18.0, portion: '180g',  category: '主菜', aliases: ['キムチ炒め', 'pork kimchi', 'キムチ豚'] },
  { name: '親子煮（1人前）',            calories: 180, protein: 18.0, carbs: 8.0,  fat: 9.0,  portion: '180g',  category: '主菜', aliases: ['とり煮', '鶏とたまごの煮物'] },

  // ===== 麺・その他主食 =====
  { name: 'つけ麺（1杯）',              calories: 510, protein: 22.0, carbs: 74.0, fat: 13.0, portion: '500g',  category: '主食', aliases: ['つけめん', 'tsukemen', 'つけそば'] },
  { name: '塩ラーメン（1杯）',          calories: 430, protein: 16.0, carbs: 62.0, fat: 12.0, portion: '480g',  category: '主食', aliases: ['しおらーめん', 'salt ramen'] },
  { name: '味噌ラーメン（1杯）',        calories: 500, protein: 18.0, carbs: 70.0, fat: 16.0, portion: '500g',  category: '主食', aliases: ['みそらーめん', 'miso ramen'] },
  { name: 'パスタ（ミートソース）',     calories: 620, protein: 24.0, carbs: 82.0, fat: 22.0, portion: '380g',  category: '主食', aliases: ['ミートソーススパゲッティ', 'bolognese pasta'] },
  { name: 'パスタ（カルボナーラ）',     calories: 700, protein: 22.0, carbs: 72.0, fat: 35.0, portion: '350g',  category: '主食', aliases: ['カルボナーラ', 'carbonara pasta'] },
  { name: 'パスタ（ナポリタン）',       calories: 500, protein: 14.0, carbs: 78.0, fat: 14.0, portion: '350g',  category: '主食', aliases: ['ナポリタン', 'neapolitan pasta'] },
  { name: 'ビビンバ（1皿）',            calories: 520, protein: 18.0, carbs: 78.0, fat: 14.0, portion: '350g',  category: '主食', aliases: ['bibimbap', 'ビビンパ', '韓国丼'] },
  { name: 'パエリア（1人前）',          calories: 500, protein: 22.0, carbs: 72.0, fat: 13.0, portion: '300g',  category: '主食', aliases: ['paella', 'パエリャ'] },

  // ===== 洋食 =====
  { name: 'ハンバーガー（1個）',        calories: 380, protein: 18.0, carbs: 38.0, fat: 18.0, portion: '200g',  category: '洋食', aliases: ['バーガー', 'burger', 'hamburger'] },
  { name: 'ホットドッグ（1本）',        calories: 280, protein: 10.0, carbs: 32.0, fat: 13.0, portion: '130g',  category: '洋食', aliases: ['ホットドック', 'hot dog'] },
  { name: 'サンドイッチ（1個）',        calories: 280, protein: 12.0, carbs: 33.0, fat: 11.0, portion: '150g',  category: '洋食', aliases: ['サンド', 'sandwich', 'たまごサンド'] },
  { name: 'BLTサンドイッチ（1個）',    calories: 350, protein: 14.0, carbs: 34.0, fat: 18.0, portion: '160g',  category: '洋食', aliases: ['BLT', 'ベーコンサンド'] },
  { name: 'ピカタ（1人前）',            calories: 250, protein: 22.0, carbs: 6.0,  fat: 14.5, portion: '150g',  category: '洋食', aliases: ['チキンピカタ', 'picata'] },
  { name: 'ラザニア（1人前）',          calories: 420, protein: 18.0, carbs: 42.0, fat: 18.0, portion: '250g',  category: '洋食', aliases: ['lasagna', 'ラザニヤ'] },
  { name: 'コロッケ（クリーム）（1個）', calories: 235, protein: 5.0, carbs: 22.0, fat: 14.0, portion: '80g',   category: '洋食', aliases: ['クリームコロッケ', 'cream croquette'] },
  { name: 'ロースト（1人前）',          calories: 300, protein: 28.0, carbs: 2.0,  fat: 19.0, portion: '150g',  category: '洋食', aliases: ['ローストチキン', 'roast chicken', 'ロースト鶏'] },
  { name: 'スパイシーチキン（1個）',    calories: 340, protein: 24.0, carbs: 18.0, fat: 19.0, portion: '160g',  category: '洋食', aliases: ['フライドチキン', 'fried chicken', 'スパチキ'] },

  // ===== 海藻・その他副菜 =====
  { name: 'わかめ（1人前）',            calories: 12,  protein: 1.8,  carbs: 1.5,  fat: 0.2,  portion: '30g',   category: '副菜', aliases: ['ワカメ', '若布', 'wakame', 'わかめ酢'] },
  { name: 'のり（1枚）',                calories: 17,  protein: 3.5,  carbs: 1.5,  fat: 0.2,  portion: '3g',    category: '副菜', aliases: ['海苔', 'nori', '焼きのり', 'seaweed'] },
  { name: 'もずく酢（1人前）',          calories: 20,  protein: 0.5,  carbs: 4.5,  fat: 0.1,  portion: '100g',  category: '副菜', aliases: ['もずく', 'mozuku', '海藻'] },
  { name: 'ところてん（1人前）',        calories: 2,   protein: 0.1,  carbs: 0.3,  fat: 0.0,  portion: '100g',  category: '副菜', aliases: ['心太', 'tokoroten', '寒天'] },
  { name: 'きのこソテー（1人前）',      calories: 55,  protein: 3.0,  carbs: 5.0,  fat: 3.0,  portion: '100g',  category: '副菜', aliases: ['マッシュルームソテー', 'mushroom saute'] },
  { name: 'ほうれん草炒め（1人前）',    calories: 50,  protein: 2.5,  carbs: 3.5,  fat: 2.5,  portion: '100g',  category: '副菜', aliases: ['ほうれん草バター炒め', 'spinach saute'] },
  { name: 'ブロッコリーサラダ（1人前）', calories: 65,  protein: 4.5,  carbs: 5.5,  fat: 3.0,  portion: '120g', category: '副菜', aliases: ['ブロッコリ和え', 'broccoli salad'] },
  { name: 'コールスロー（1人前）',      calories: 80,  protein: 1.5,  carbs: 10.0, fat: 4.0,  portion: '100g',  category: '副菜', aliases: ['coleslaw', 'キャベツサラダ'] },
  { name: '大豆の煮物（1人前）',        calories: 120, protein: 8.0,  carbs: 12.0, fat: 4.5,  portion: '80g',   category: '副菜', aliases: ['煮豆', 'にまめ', '黒豆'] },
  { name: 'こんにゃく（1人前）',        calories: 11,  protein: 0.1,  carbs: 2.6,  fat: 0.1,  portion: '80g',   category: '副菜', aliases: ['コンニャク', '蒟蒻', 'konjac', 'しらたき'] },
  { name: 'おでん（1人前）',            calories: 130, protein: 8.0,  carbs: 14.0, fat: 4.5,  portion: '200g',  category: '副菜', aliases: ['oden', 'おでん盛り合わせ'] },

  // ===== 中華・アジア料理 =====
  { name: '中華スープ（1杯）',          calories: 35,  protein: 2.5,  carbs: 4.0,  fat: 1.0,  portion: '200ml', category: '汁物', aliases: ['中華たまごスープ', 'egg drop soup', 'ワカメスープ'] },
  { name: 'チャーシュー（2枚）',        calories: 145, protein: 11.0, carbs: 4.5,  fat: 9.0,  portion: '60g',   category: '主菜', aliases: ['叉焼', 'chashu', 'やきぶた', '焼き豚'] },
  { name: '焼売（4個）',                calories: 220, protein: 12.0, carbs: 20.0, fat: 10.0, portion: '120g',  category: '主菜', aliases: ['シューマイ', 'shumai', 'シュウマイ'] },
  { name: 'エビチリ（1人前）',          calories: 200, protein: 16.0, carbs: 12.0, fat: 10.0, portion: '180g',  category: '主菜', aliases: ['えびちり', 'chili shrimp', 'エビのチリソース'] },
  { name: 'バンバンジーサラダ（1人前）', calories: 180, protein: 16.0, carbs: 6.0, fat: 10.0, portion: '150g',  category: '主菜', aliases: ['棒棒鶏サラダ', 'bang bang chicken'] },
  { name: 'ビーフン（1人前）',          calories: 340, protein: 10.0, carbs: 58.0, fat: 7.0,  portion: '250g',  category: '主食', aliases: ['米麺', 'rice noodle', 'フォー'] },
  { name: 'フォー（1杯）',              calories: 380, protein: 18.0, carbs: 58.0, fat: 7.0,  portion: '400g',  category: '主食', aliases: ['ベトナム麺', 'pho', 'フォー'] },
  { name: 'トムヤムクン（1杯）',        calories: 80,  protein: 6.0,  carbs: 4.5,  fat: 4.0,  portion: '250ml', category: '汁物', aliases: ['tom yum', 'タイスープ', 'トムヤム'] },
  { name: 'パッタイ（1人前）',          calories: 500, protein: 16.0, carbs: 70.0, fat: 16.0, portion: '300g',  category: '主食', aliases: ['pad thai', 'タイ炒め麺'] },

  // ===== ベビー・幼児向け =====
  { name: 'バナナ粥（1食）',            calories: 150, protein: 2.5,  carbs: 34.0, fat: 0.5,  portion: '200g',  category: '主食', aliases: ['バナナかゆ', '離乳食粥', '赤ちゃん粥'] },
  { name: 'うどん（やわらかめ）',       calories: 200, protein: 5.5,  carbs: 42.0, fat: 0.7,  portion: '180g',  category: '主食', aliases: ['やわらかうどん', '幼児うどん', 'ふやけうどん'] },
  { name: 'パン粥（1食）',              calories: 120, protein: 3.5,  carbs: 22.0, fat: 2.5,  portion: '150g',  category: '主食', aliases: ['パンがゆ', 'bread porridge', '離乳食パン'] },
  { name: '蒸しほうれん草（1人前）',    calories: 20,  protein: 2.2,  carbs: 3.1,  fat: 0.4,  portion: '80g',   category: '副菜', aliases: ['蒸し野菜', 'steam spinach'] },
  { name: 'かぼちゃペースト（1食）',    calories: 55,  protein: 1.0,  carbs: 14.0, fat: 0.2,  portion: '80g',   category: '副菜', aliases: ['かぼちゃ裏ごし', 'pumpkin puree'] },

  // ===== 軽食・その他 =====
  { name: 'おにぎり（鮭）（1個）',      calories: 190, protein: 6.0,  carbs: 38.0, fat: 1.5,  portion: '110g',  category: '主食', aliases: ['鮭おにぎり', 'salmon onigiri'] },
  { name: 'おにぎり（梅）（1個）',      calories: 172, protein: 2.8,  carbs: 38.0, fat: 0.3,  portion: '100g',  category: '主食', aliases: ['梅おにぎり', 'ume onigiri'] },
  { name: 'おにぎり（ツナマヨ）（1個）', calories: 220, protein: 6.0, carbs: 38.0, fat: 5.5,  portion: '115g',  category: '主食', aliases: ['ツナマヨおにぎり', 'tuna mayo onigiri'] },
  { name: 'ミックスサンドイッチ（1パック）', calories: 460, protein: 18.0, carbs: 58.0, fat: 17.0, portion: '240g', category: '主食', aliases: ['サンドイッチセット', '盛り合わせサンド'] },
  { name: 'シュウマイ弁当（1個）',      calories: 650, protein: 25.0, carbs: 88.0, fat: 20.0, portion: '400g',  category: '主食', aliases: ['弁当', 'お弁当', 'lunchbox'] },
  { name: 'フライドポテト（1人前）',    calories: 300, protein: 4.0,  carbs: 40.0, fat: 14.0, portion: '130g',  category: 'おやつ', aliases: ['french fries', 'ポテトフライ', 'ポテト'] },
  { name: 'チキンナゲット（5個）',      calories: 230, protein: 14.0, carbs: 14.0, fat: 13.0, portion: '110g',  category: 'おやつ', aliases: ['ナゲット', 'nugget', 'chicken nugget'] },
  { name: 'ピザポテト（1袋）',          calories: 340, protein: 4.0,  carbs: 35.0, fat: 21.0, portion: '60g',   category: 'おやつ', aliases: ['ピザ味スナック', 'pizza chips'] },
  { name: '甘栗（1袋）',               calories: 170, protein: 3.0,  carbs: 40.0, fat: 0.5,  portion: '60g',   category: 'おやつ', aliases: ['むき甘栗', 'chestnut', '栗'] },
  { name: '干し芋（1枚）',              calories: 140, protein: 1.5,  carbs: 35.0, fat: 0.2,  portion: '50g',   category: 'おやつ', aliases: ['ほしいも', 'dried sweet potato'] },
  { name: 'シュークリーム（1個）',      calories: 195, protein: 4.5,  carbs: 20.0, fat: 11.0, portion: '80g',   category: 'おやつ', aliases: ['シュークリーム', 'eclair', 'cream puff'] },
  { name: 'マドレーヌ（1個）',          calories: 165, protein: 2.5,  carbs: 20.0, fat: 8.5,  portion: '50g',   category: 'おやつ', aliases: ['madeleine', 'バターケーキ'] },
  { name: 'スコーン（1個）',            calories: 220, protein: 4.5,  carbs: 30.0, fat: 10.0, portion: '70g',   category: 'おやつ', aliases: ['scone', 'クリームスコーン'] },
  { name: '卵かけごはん（1杯）',        calories: 328, protein: 10.0, carbs: 55.9, fat: 5.6,  portion: '210g',  category: '主食', aliases: ['TKG', 'たまごかけごはん', 'egg on rice'] },
  { name: 'のり巻き（1本）',            calories: 200, protein: 5.0,  carbs: 42.0, fat: 1.0,  portion: '130g',  category: '主食', aliases: ['太巻き', '細巻き', 'nori maki', 'のり巻き寿司'] },
  { name: '稲荷寿司（2個）',            calories: 185, protein: 4.5,  carbs: 37.0, fat: 3.0,  portion: '110g',  category: '主食', aliases: ['いなりずし', 'inari sushi', 'お稲荷さん'] },
  { name: '赤飯（1人前）',              calories: 270, protein: 5.5,  carbs: 58.0, fat: 0.8,  portion: '150g',  category: '主食', aliases: ['おこわ', '赤御飯', 'red rice', 'おはぎ'] },
  { name: 'タコス（2個）',              calories: 340, protein: 16.0, carbs: 36.0, fat: 14.0, portion: '160g',  category: '主食', aliases: ['tacos', 'メキシカン', 'ブリトー'] },
]

// ---- 主要食品のビタミン・ミネラルデータ（日本食品標準成分表2020年版ベース） ----
// キー = FOOD_DB の name と一致させること
const FOOD_MICRO_DATA: Record<string, Partial<Food>> = {
  'ごはん（茶碗1杯）':     { vitamin_b1: 0.03, vitamin_b2: 0.02, niacin: 0.6,  folate: 12,   phosphorus: 51,  potassium: 44,  magnesium: 11,  iron: 0.2,  zinc: 0.9 },
  '玄米ごはん（茶碗1杯）': { vitamin_b1: 0.16, vitamin_b2: 0.02, niacin: 3.0,  folate: 18,   phosphorus: 200, potassium: 95,  magnesium: 74,  iron: 0.6,  zinc: 1.2, manganese: 2.1 },
  '食パン（1枚）':         { vitamin_b1: 0.07, vitamin_b2: 0.04, niacin: 1.1,  folate: 17,   calcium: 17, phosphorus: 68, potassium: 60,  sodium: 264, magnesium: 14, iron: 0.4, zinc: 0.5 },
  '卵（1個・生）':          { vitamin_a: 90, vitamin_d: 1.1, vitamin_e: 0.6, vitamin_k: 12, vitamin_b1: 0.04, vitamin_b2: 0.22, vitamin_b6: 0.05, vitamin_b12: 0.9, folate: 24, biotin: 15, calcium: 23, phosphorus: 99, potassium: 65, magnesium: 5, iron: 0.9, zinc: 0.8 },
  '目玉焼き（1個）':        { vitamin_a: 90, vitamin_d: 1.0, vitamin_e: 1.0, vitamin_b2: 0.22, vitamin_b12: 0.8, calcium: 23, phosphorus: 99, iron: 0.9, zinc: 0.8 },
  '卵焼き（1人前）':        { vitamin_a: 140, vitamin_b2: 0.30, vitamin_b12: 1.2, calcium: 35, phosphorus: 150, iron: 1.4, zinc: 1.2 },
  'ゆで卵（1個）':          { vitamin_a: 90, vitamin_d: 1.1, vitamin_e: 0.6, vitamin_b2: 0.22, vitamin_b12: 0.9, calcium: 23, phosphorus: 99, iron: 0.9, zinc: 0.8 },
  '牛乳（1杯）':            { vitamin_a: 38, vitamin_d: 0.3, vitamin_b2: 0.30, vitamin_b12: 0.6, calcium: 220, phosphorus: 186, potassium: 300, magnesium: 20, iodine: 30, selenium: 4 },
  'ヨーグルト（1個）':      { vitamin_b2: 0.14, vitamin_b12: 0.4, calcium: 120, phosphorus: 90, potassium: 170, magnesium: 12, iodine: 20 },
  'チーズ（スライス1枚）':  { vitamin_a: 12, vitamin_d: 0.1, vitamin_b2: 0.06, vitamin_b12: 0.4, calcium: 126, phosphorus: 94, sodium: 200, zinc: 0.6 },
  'ほうれん草（1束）':      { vitamin_a: 350, vitamin_k: 270, vitamin_c: 35, vitamin_b1: 0.11, vitamin_b2: 0.20, folate: 210, calcium: 49, potassium: 690, magnesium: 69, iron: 2.0, zinc: 0.7, manganese: 0.8 },
  'ほうれん草のお浸し（1人前）': { vitamin_a: 350, vitamin_k: 270, vitamin_c: 20, folate: 170, calcium: 49, potassium: 690, iron: 2.0 },
  'ブロッコリー（1/2房）':  { vitamin_c: 120, vitamin_k: 150, vitamin_a: 12, folate: 120, calcium: 38, potassium: 360, iron: 1.0, zinc: 0.5, selenium: 2 },
  'にんじん（中1本）':      { vitamin_a: 720, vitamin_k: 23, vitamin_c: 6, vitamin_b6: 0.12, folate: 21, calcium: 28, potassium: 300, magnesium: 10, iron: 0.2 },
  'じゃがいも（中1個）':    { vitamin_c: 28, vitamin_b1: 0.09, vitamin_b6: 0.19, folate: 20, potassium: 420, calcium: 3, iron: 0.4 },
  'さつまいも（中1/2本）':  { vitamin_c: 29, vitamin_e: 1.5, vitamin_b6: 0.25, folate: 49, calcium: 36, potassium: 480, iron: 0.6 },
  '鮭の塩焼き（1切れ）':    { vitamin_d: 23.2, vitamin_e: 1.9, vitamin_b1: 0.18, vitamin_b2: 0.16, vitamin_b12: 3.6, niacin: 10.4, calcium: 11, phosphorus: 223, potassium: 312, magnesium: 27, iron: 0.4, zinc: 0.5, selenium: 24 },
  'サーモン刺身（5切れ）':  { vitamin_d: 11.0, vitamin_e: 2.5, vitamin_b12: 3.1, niacin: 7.3, calcium: 7, phosphorus: 186, potassium: 264, selenium: 17 },
  'まぐろ刺身（5切れ）':    { vitamin_d: 4.0, vitamin_b6: 0.64, vitamin_b12: 4.0, niacin: 14.2, phosphorus: 270, potassium: 380, selenium: 27 },
  '鶏むね肉（100g）':       { vitamin_b6: 0.64, vitamin_b12: 0.2, niacin: 11.6, phosphorus: 210, potassium: 340, magnesium: 30, iron: 0.4, zinc: 0.8, selenium: 27 },
  '鶏もも肉（100g）':       { vitamin_b6: 0.29, vitamin_b12: 0.2, niacin: 5.5, calcium: 6, phosphorus: 160, potassium: 260, iron: 0.7, zinc: 1.6 },
  '豆腐（半丁）':           { vitamin_e: 0.3, vitamin_b1: 0.12, folate: 18, calcium: 120, phosphorus: 126, potassium: 201, magnesium: 48, iron: 0.8, zinc: 0.8 },
  '納豆（1パック）':        { vitamin_k: 300, vitamin_e: 1.6, vitamin_b1: 0.04, vitamin_b2: 0.14, folate: 54, biotin: 7, calcium: 45, phosphorus: 95, potassium: 330, magnesium: 50, iron: 1.7, zinc: 1.0, manganese: 0.5 },
  'バナナ（1本）':           { vitamin_b6: 0.34, vitamin_c: 16, folate: 26, potassium: 360, magnesium: 32, iron: 0.3, manganese: 0.3 },
  'りんご（1/2個）':         { vitamin_c: 6, potassium: 120, iron: 0.1 },
  'みかん（1個）':           { vitamin_c: 32, folate: 22, potassium: 130, calcium: 17 },
  'いちご（1パック）':       { vitamin_c: 84, folate: 90, potassium: 260, calcium: 23, iron: 0.6 },
  '枝豆（50g）':             { vitamin_b1: 0.15, vitamin_b2: 0.07, vitamin_c: 15, folate: 160, calcium: 65, potassium: 260, magnesium: 32, iron: 1.5, zinc: 0.7 },
  '豆乳（1杯）':             { vitamin_b1: 0.12, vitamin_b2: 0.04, vitamin_e: 1.2, folate: 30, calcium: 30, potassium: 390, magnesium: 48, iron: 1.6, zinc: 0.6 },
}

// マイクロ栄養素データをFOOD_DBに反映（対象食品のみ）
for (const food of FOOD_DB) {
  const micro = FOOD_MICRO_DATA[food.name]
  if (micro) Object.assign(food, micro)
}

const MEAL_TYPES = [
  { key: 'breakfast', label: '朝食',   icon: '🌅' },
  { key: 'lunch',     label: '昼食',   icon: '☀️' },
  { key: 'dinner',    label: '夕食',   icon: '🌙' },
  { key: 'snack',     label: 'おやつ', icon: '🍪' },
] as const

type MealTypeKey = typeof MEAL_TYPES[number]['key']
type TabKey = 'search' | 'manual' | 'ai'

const UNITS = ['g', 'ml', '個', '杯', '枚', '本', '切れ', '袋', '缶', 'パック'] as const
type Unit = typeof UNITS[number]

type MicroNutrients = {
  vitamin_a?: number; vitamin_d?: number; vitamin_e?: number; vitamin_k?: number;
  vitamin_b1?: number; vitamin_b2?: number; vitamin_b6?: number; vitamin_b12?: number;
  vitamin_c?: number; niacin?: number; pantothenic_acid?: number; folate?: number; biotin?: number;
  calcium?: number; phosphorus?: number; potassium?: number; sulfur?: number; chlorine?: number;
  sodium?: number; magnesium?: number; iron?: number; zinc?: number; copper?: number;
  manganese?: number; iodine?: number; selenium?: number; molybdenum?: number; chromium?: number;
  cobalt?: number;
}

type NutrientForm = {
  foodName: string
  calories: string
  protein: string
  carbs: string
  fat: string
  micro?: MicroNutrients
}

function pickMicro(src: { [k: string]: unknown }): MicroNutrients {
  const keys: (keyof MicroNutrients)[] = [
    'vitamin_a','vitamin_d','vitamin_e','vitamin_k','vitamin_b1','vitamin_b2','vitamin_b6','vitamin_b12','vitamin_c',
    'niacin','pantothenic_acid','folate','biotin',
    'calcium','phosphorus','potassium','sulfur','chlorine','sodium','magnesium','iron','zinc','copper',
    'manganese','iodine','selenium','molybdenum','chromium','cobalt',
  ]
  const out: MicroNutrients = {}
  for (const k of keys) {
    const v = src[k]
    if (v != null) (out as Record<string, number>)[k] = Number(v)
  }
  return out
}

// portion文字列（"150g", "200ml" 等）と量・単位からスケールを計算して栄養素を返す
function calcNutrients(food: Food, qty: number, unit: Unit) {
  const m = food.portion.match(/^(\d+(?:\.\d+)?)(g|ml)/)
  let scale: number
  if (m && (unit === 'g' || unit === 'ml')) {
    scale = qty / parseFloat(m[1])
  } else {
    scale = qty
  }
  const r  = (v: number, d = 1) => Math.round(v * scale * 10 ** d) / 10 ** d
  const rn = (v: number | undefined) => v != null ? r(v, 2) : undefined
  return {
    calories: r(food.calories, 0),
    protein:  r(food.protein),
    carbs:    r(food.carbs),
    fat:      r(food.fat),
    // vitamins
    vitamin_a:        rn(food.vitamin_a),
    vitamin_d:        rn(food.vitamin_d),
    vitamin_e:        rn(food.vitamin_e),
    vitamin_k:        rn(food.vitamin_k),
    vitamin_b1:       rn(food.vitamin_b1),
    vitamin_b2:       rn(food.vitamin_b2),
    vitamin_b6:       rn(food.vitamin_b6),
    vitamin_b12:      rn(food.vitamin_b12),
    vitamin_c:        rn(food.vitamin_c),
    niacin:           rn(food.niacin),
    pantothenic_acid: rn(food.pantothenic_acid),
    folate:           rn(food.folate),
    biotin:           rn(food.biotin),
    // minerals
    calcium:    rn(food.calcium),
    phosphorus: rn(food.phosphorus),
    potassium:  rn(food.potassium),
    sulfur:     rn(food.sulfur),
    chlorine:   rn(food.chlorine),
    sodium:     rn(food.sodium),
    magnesium:  rn(food.magnesium),
    iron:       rn(food.iron),
    zinc:       rn(food.zinc),
    copper:     rn(food.copper),
    manganese:  rn(food.manganese),
    iodine:     rn(food.iodine),
    selenium:   rn(food.selenium),
    molybdenum: rn(food.molybdenum),
    chromium:   rn(food.chromium),
    cobalt:     rn(food.cobalt),
  }
}

// ---- 検索タブ ----
function SearchTab({
  onSelect,
  onAiResult,
}: {
  onSelect: (f: NutrientForm) => void
  onAiResult: (f: NutrientForm) => void
}) {
  const [query, setQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const results = query.trim().length >= 1
    ? FOOD_DB.filter(f => matchesQuery(f, query))
    : FOOD_DB.slice(0, 20)

  const noResults = query.trim().length >= 1 && results.length === 0

  const handleAiSearch = async () => {
    if (!query.trim() || aiLoading) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/food-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      const r = data.result
      // 手入力タブのフォームに渡して確認・編集できるようにする
      onAiResult({
        foodName: r.foodName ?? query.trim(),
        calories: r.calories != null ? String(r.calories) : '',
        protein:  r.protein  != null ? String(r.protein)  : '',
        carbs:    r.carbs    != null ? String(r.carbs)    : '',
        fat:      r.fat      != null ? String(r.fat)      : '',
      })
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="食品名を入力（例: ごはん、卵）"
          value={query}
          onChange={e => { setQuery(e.target.value); setAiError('') }}
          className="w-full pl-9 pr-9 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setAiError('') }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">{query ? `「${query}」 ${results.length}件` : '人気の食品'}</p>
      <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
        {noResults ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-gray-500">見つかりませんでした</p>
            <button
              type="button"
              onClick={handleAiSearch}
              disabled={aiLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-900/30 disabled:opacity-60 active:scale-95 transition-all"
            >
              {aiLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />AIで調べています...</>
                : <><Sparkles className="w-4 h-4" />✨ AIで栄養素を調べる</>
              }
            </button>
            {aiError && (
              <p className="text-xs text-red-400 text-center">{aiError}</p>
            )}
            <p className="text-xs text-gray-600 text-center">※ AIによる推定値です。手入力タブで確認できます</p>
          </div>
        ) : results.map((food, i) => (
          <button
            type="button"
            key={i}
            onClick={() => onSelect({
              foodName: food.name,
              calories: String(food.calories),
              protein:  String(food.protein),
              carbs:    String(food.carbs),
              fat:      String(food.fat),
              micro:    pickMicro(food as unknown as Record<string, unknown>),
            })}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-800 border border-gray-700 hover:border-orange-500 active:scale-[0.98] transition-all text-left"
          >
            <div>
              <p className="text-sm font-medium text-white">{food.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{food.portion} · {food.category}</p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-bold text-orange-400">{food.calories}kcal</p>
              <p className="text-xs text-gray-500">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- 手入力タブ ----
function ManualTab({
  items,
  onAddItem,
  onRemoveItem,
  defaultValues,
}: {
  items: NutrientForm[]
  onAddItem: (f: NutrientForm) => void
  onRemoveItem: (index: number) => void
  defaultValues?: NutrientForm
}) {
  const [foodQuery, setFoodQuery] = useState(defaultValues?.foodName ?? '')
  const [matchedFood, setMatchedFood] = useState<Food | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<Unit>('個')
  // manualMode: true のとき栄養素を手入力
  const [manualMode, setManualMode] = useState(!!defaultValues)
  const [manualNutrients, setManualNutrients] = useState({
    calories: defaultValues?.calories ?? '',
    protein:  defaultValues?.protein ?? '',
    carbs:    defaultValues?.carbs ?? '',
    fat:      defaultValues?.fat ?? '',
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) ||
        inputRef.current?.contains(e.target as Node)
      ) return
      setShowDropdown(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const dbResults = useMemo(
    () => foodQuery.trim().length >= 1
      ? FOOD_DB.filter(f => matchesQuery(f, foodQuery)).slice(0, 7)
      : [],
    [foodQuery],
  )

  // 自動計算値
  const calculated = useMemo(() => {
    if (!matchedFood || manualMode) return null
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return null
    return calcNutrients(matchedFood, qty, unit)
  }, [matchedFood, quantity, unit, manualMode])

  // DB から食品を選択
  const handleSelectFood = useCallback((food: Food) => {
    const baseName = food.name.split('（')[0].trim()
    setFoodQuery(baseName)
    setMatchedFood(food)
    setShowDropdown(false)
    setManualMode(false)
    // portion からデフォルトの量・単位を設定
    const m = food.portion.match(/^(\d+(?:\.\d+)?)(g|ml)$/)
    if (m) {
      setQuantity(m[1])
      setUnit(m[2] as Unit)
    } else {
      setQuantity('1')
      setUnit('個')
    }
  }, [])

  // 食材をリストに追加してフォームをリセット
  const handleAdd = () => {
    if (!foodQuery.trim()) return
    const qty = parseFloat(quantity)
    const label = qty > 0 ? `${foodQuery.trim()}（${quantity}${unit}）` : foodQuery.trim()
    const nutri = calculated
      ? { calories: String(calculated.calories), protein: String(calculated.protein), carbs: String(calculated.carbs), fat: String(calculated.fat) }
      : manualNutrients
    const micro = calculated ? pickMicro(calculated as unknown as Record<string, unknown>) : undefined

    onAddItem({ foodName: label, ...nutri, micro })

    setFoodQuery('')
    setMatchedFood(null)
    setQuantity('1')
    setUnit('個')
    setManualMode(false)
    setManualNutrients({ calories: '', protein: '', carbs: '', fat: '' })
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const noDbMatch = foodQuery.trim().length > 0 && !matchedFood && dbResults.length === 0
  const showManualFields = manualMode || noDbMatch

  return (
    <div className="flex flex-col gap-4">
      {/* 追加済み食材リスト */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-gray-400">追加済み（{items.length}品目）</p>
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.foodName}</p>
                <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                  {item.calories && <span>🔥{item.calories}kcal</span>}
                  {item.protein  && <span>P{item.protein}g</span>}
                  {item.carbs    && <span>C{item.carbs}g</span>}
                  {item.fat      && <span>F{item.fat}g</span>}
                </div>
              </div>
              <button type="button" onClick={() => onRemoveItem(i)}
                className="w-7 h-7 ml-2 shrink-0 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ① 食品名入力 + インラインドロップダウン */}
      <div className="relative">
        <label className="text-xs font-medium text-gray-400 mb-1.5 block">食品名 *</label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="例: ごはん、鶏むね肉、牛乳"
            value={foodQuery}
            onChange={e => {
              setFoodQuery(e.target.value)
              setMatchedFood(null)
              setManualMode(false)
              setShowDropdown(true)
            }}
            onFocus={() => { if (foodQuery.trim()) setShowDropdown(true) }}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {foodQuery && (
            <button type="button"
              onClick={() => { setFoodQuery(''); setMatchedFood(null); setShowDropdown(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* ドロップダウン */}
        {showDropdown && dbResults.length > 0 && (
          <div ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-20 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {dbResults.map((food, i) => (
              <button
                type="button"
                key={i}
                onMouseDown={() => handleSelectFood(food)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 border-b border-gray-700/50 last:border-0 text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{food.name.split('（')[0]}</p>
                  <p className="text-xs text-gray-400">{food.portion} · {food.category}</p>
                </div>
                <p className="text-sm font-bold text-orange-400 shrink-0 ml-3">{food.calories}kcal</p>
              </button>
            ))}
          </div>
        )}

        {/* DB未一致メッセージ */}
        {noDbMatch && (
          <p className="text-xs text-gray-500 mt-1.5">
            DBに見つかりません。栄養素を手動で入力してください。
          </p>
        )}
      </div>

      {/* ② 量・単位（DB一致時のみ） */}
      {matchedFood && (
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1.5 block">量</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="flex-1 border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as Unit)}
              className="border border-gray-700 bg-gray-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ③ 自動計算結果 */}
      {calculated && !manualMode && (
        <div className="bg-gray-800 border border-orange-500/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-orange-400">✨ 自動計算</p>
            <button
              type="button"
              onClick={() => {
                setManualMode(true)
                setManualNutrients({
                  calories: String(calculated.calories),
                  protein:  String(calculated.protein),
                  carbs:    String(calculated.carbs),
                  fat:      String(calculated.fat),
                })
              }}
              className="text-xs text-gray-500 underline"
            >
              手動で編集
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'kcal', value: calculated.calories, color: 'text-white' },
              { label: 'P(g)',  value: calculated.protein,  color: 'text-blue-300' },
              { label: 'C(g)',  value: calculated.carbs,    color: 'text-yellow-300' },
              { label: 'F(g)',  value: calculated.fat,      color: 'text-red-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-700/60 rounded-lg py-2.5">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ④ 手動入力フィールド（DB未一致 or 手動モード） */}
      {showManualFields && (
        <div className="flex flex-col gap-3">
          {manualMode && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-400">栄養素を入力（任意）</p>
              <button type="button" onClick={() => setManualMode(false)}
                className="text-xs text-gray-500 underline">
                自動計算に戻す
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'calories' as const, label: 'カロリー (kcal)', placeholder: '例: 300', step: '1' },
              { key: 'protein'  as const, label: 'たんぱく質 (g)',   placeholder: '例: 20',  step: '0.1' },
              { key: 'carbs'    as const, label: '炭水化物 (g)',     placeholder: '例: 40',  step: '0.1' },
              { key: 'fat'      as const, label: '脂質 (g)',         placeholder: '例: 10',  step: '0.1' },
            ].map(({ key, label, placeholder, step }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">{label}</label>
                <input
                  type="number"
                  placeholder={placeholder}
                  step={step}
                  value={manualNutrients[key]}
                  onChange={e => setManualNutrients(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* + 食材を追加ボタン */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!foodQuery.trim()}
        className="w-full py-3 border-2 border-dashed border-orange-500/50 rounded-xl text-orange-400 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30 active:scale-[0.98] transition-all hover:border-orange-500 hover:bg-orange-500/5"
      >
        <Plus className="w-4 h-4" />
        食材を追加
      </button>
    </div>
  )
}

// ---- AI 認識タブ ----
function AiTab({ onResult }: { onResult: (f: NutrientForm) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recognized, setRecognized] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError(''); setRecognized(false)
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setBase64(dataUrl.split(',')[1])
      setMediaType(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRecognize = async () => {
    if (!base64) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/ai-food-recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      const r = data.result
      if (!r?.foodName) throw new Error('食品を認識できませんでした')
      onResult({
        foodName: r.foodName,
        calories: r.calories != null ? String(r.calories) : '',
        protein:  r.protein  != null ? String(r.protein)  : '',
        carbs:    r.carbs    != null ? String(r.carbs)    : '',
        fat:      r.fat      != null ? String(r.fat)      : '',
      })
      setRecognized(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors overflow-hidden"
      >
        {preview
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
          : <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload className="w-8 h-8" />
              <p className="text-sm">タップして写真を選択</p>
              <p className="text-xs text-gray-600">JPEG / PNG / WebP</p>
            </div>
        }
        <input ref={inputRef} type="file" accept="image/*" capture="environment"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          className="hidden" />
      </div>

      {preview && !recognized && (
        <button type="button" onClick={handleRecognize} disabled={loading}
          className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />認識中...</>
            : <><Camera className="w-4 h-4" />AIで食品を認識</>}
        </button>
      )}

      {recognized && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-xl px-4 py-3">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">認識完了！「手入力」タブで確認・修正できます</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">{error}</p>
      )}

      <p className="text-xs text-gray-600 text-center">※ AI認識はClaudeが行います。栄養値は目安です</p>
    </div>
  )
}

// ---- メインページ ----
function MealNewInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMeal = (searchParams.get('meal') ?? 'breakfast') as MealTypeKey

  const [children, setChildren] = useState<{ id: string; name: string; avatar: string }[]>([])
  const [selectedChildIndex, setSelectedChildIndex] = useState(0)
  const [mealType, setMealType] = useState<MealTypeKey>(initialMeal)
  const [activeTab, setActiveTab] = useState<TabKey>('search')
  const [items, setItems] = useState<NutrientForm[]>([])
  const [aiResult, setAiResult] = useState<NutrientForm | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [recordedAt, setRecordedAt] = useState(() => {
    const d = searchParams.get('date')
    if (d) return d
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  useEffect(() => {
    fetch('/api/children').then(r => r.json()).then(d => setChildren(d.children ?? [])).catch(console.error)
  }, [])

  const addItem = useCallback((f: NutrientForm) => setItems(prev => [...prev, f]), [])
  const removeItem = useCallback((i: number) => setItems(prev => prev.filter((_, idx) => idx !== i)), [])

  // 検索タブ: 選択 → items に追加して手入力タブへ
  const handleSearchSelect = (f: NutrientForm) => {
    addItem(f)
    setActiveTab('manual')
  }

  // AIタブ: 結果をセットして手入力タブへ
  const handleAiResult = (f: NutrientForm) => {
    setAiResult(f)
    setActiveTab('manual')
  }

  const canSave = items.length > 0

  const handleSave = async () => {
    if (!canSave || children.length === 0) return
    setSaving(true); setSaveError('')
    const child = children[selectedChildIndex]
    try {
      const results = await Promise.all(
        items.map(item =>
          fetch('/api/meal-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              childId:    child.id,
              mealType,
              foodName:   item.foodName,
              calories:   item.calories || null,
              protein:    item.protein  || null,
              carbs:      item.carbs    || null,
              fat:        item.fat      || null,
              recordedAt: `${recordedAt}T12:00:00.000Z`,
              ...(item.micro ?? {}),
            }),
          })
        )
      )
      const failed = results.find(r => !r.ok)
      if (failed) throw new Error('保存に失敗しました')
      router.push('/home')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const TABS: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'search', label: '検索',   Icon: Search },
    { key: 'manual', label: '手入力', Icon: PenLine },
    { key: 'ai',     label: 'AI認識', Icon: Camera },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 pt-12 pb-3 flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-base font-bold">食事を記録</h1>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-semibold bg-orange-500 text-white px-2.5 py-1 rounded-full">
            {items.length}品目
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 pb-36">
        {/* 子供選択 */}
        {children.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">記録する子供</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {children.map((c, i) => (
                <button type="button" key={c.id} onClick={() => setSelectedChildIndex(i)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                    selectedChildIndex === i
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-800 text-gray-300 border-gray-700'
                  }`}>
                  <span>{c.avatar}</span>{c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 食事の種類 */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">食事の種類</p>
          <div className="grid grid-cols-4 gap-2">
            {MEAL_TYPES.map(m => (
              <button type="button" key={m.key} onClick={() => setMealType(m.key)}
                className={`py-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs font-semibold border transition-all ${
                  mealType === m.key
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日付 */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-2">日付</p>
          <input type="date" value={recordedAt} onChange={e => setRecordedAt(e.target.value)}
            className="w-full border border-gray-700 bg-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* タブ切り替え */}
        <div>
          <div className="flex bg-gray-800 rounded-xl p-1 mb-4">
            {TABS.map(({ key, label, Icon }) => (
              <button type="button" key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === key ? 'bg-orange-500 text-white shadow' : 'text-gray-400'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'search' && <SearchTab onSelect={handleSearchSelect} onAiResult={handleAiResult} />}
          {activeTab === 'manual' && (
            <ManualTab
              key={aiResult ? JSON.stringify(aiResult) : 'manual'}
              items={items}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              defaultValues={aiResult}
            />
          )}
          {activeTab === 'ai' && <AiTab onResult={handleAiResult} />}
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-8 pt-3 bg-gray-900 border-t border-gray-800">
        {saveError && <p className="text-xs text-red-400 text-center mb-2">{saveError}</p>}
        {!canSave && (
          <p className="text-xs text-gray-600 text-center mb-2">
            「食材を追加」ボタンで食材を追加してから記録してください
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving || children.length === 0}
          className="w-full py-4 bg-orange-500 rounded-2xl shadow-lg shadow-orange-900/40 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="text-white font-bold text-base">
            {saving ? '保存中...' : items.length > 1 ? `記録する（${items.length}品目）` : '記録する'}
          </span>
          {saving && <Loader2 className="w-5 h-5 text-white animate-spin" />}
        </button>
      </div>
    </div>
  )
}

export default function MealNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <MealNewInner />
    </Suspense>
  )
}
