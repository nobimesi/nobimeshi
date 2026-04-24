-- meal_records にビタミン13種・ミネラル16種のカラムを追加
-- vitamin_c / calcium / iron は既存カラムのため IF NOT EXISTS で安全に追加

ALTER TABLE meal_records
  -- ビタミン (単位: μg または mg、カラムコメント参照)
  ADD COLUMN IF NOT EXISTS vitamin_a        NUMERIC,   -- μg RAE
  ADD COLUMN IF NOT EXISTS vitamin_d        NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS vitamin_e        NUMERIC,   -- mg α-TE
  ADD COLUMN IF NOT EXISTS vitamin_k        NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS vitamin_b1       NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS vitamin_b2       NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS vitamin_b6       NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS vitamin_b12      NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS vitamin_c        NUMERIC,   -- mg (既存の場合スキップ)
  ADD COLUMN IF NOT EXISTS niacin           NUMERIC,   -- mg NE
  ADD COLUMN IF NOT EXISTS pantothenic_acid NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS folate           NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS biotin           NUMERIC;   -- μg

ALTER TABLE meal_records
  -- ミネラル (単位: μg または mg)
  ADD COLUMN IF NOT EXISTS calcium          NUMERIC,   -- mg (既存の場合スキップ)
  ADD COLUMN IF NOT EXISTS phosphorus       NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS potassium        NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS sulfur           NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS chlorine         NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS sodium           NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS magnesium        NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS iron             NUMERIC,   -- mg (既存の場合スキップ)
  ADD COLUMN IF NOT EXISTS zinc             NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS copper           NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS manganese        NUMERIC,   -- mg
  ADD COLUMN IF NOT EXISTS iodine           NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS selenium         NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS molybdenum       NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS chromium         NUMERIC,   -- μg
  ADD COLUMN IF NOT EXISTS cobalt           NUMERIC;   -- μg
