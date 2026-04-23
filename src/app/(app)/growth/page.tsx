'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Plus, TrendingUp, TrendingDown, X } from 'lucide-react'

type MetricType = 'height' | 'weight'

type Child = {
  id: string
  name: string
  avatar: string
  birth_date: string
  gender: string | null
}

type GrowthRecord = {
  id: string
  recorded_at: string
  height: number | null
  weight: number | null
}

type ChartPoint = { label: string; value: number }

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function toChartLabel(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月`
}

// 厚労省基準値（参考値・6歳男子）
const HEIGHT_REF = { avg: 116.5, p3: 108.5, p10: 111.2, p90: 121.8, p97: 124.2 }
const WEIGHT_REF = { avg: 20.9, p3: 16.2, p10: 17.5, p90: 24.8, p97: 27.1 }

function GrowthChart({ type, data }: { type: MetricType; data: ChartPoint[] }) {
  const ref = type === 'height' ? HEIGHT_REF : WEIGHT_REF
  const unit = type === 'height' ? 'cm' : 'kg'
  const color = type === 'height' ? '#FF6B35' : '#4CAF82'

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center gap-2">
        <span className="text-3xl">{type === 'height' ? '📏' : '⚖️'}</span>
        <p className="text-sm text-gray-400">まだ記録がありません</p>
        <p className="text-xs text-gray-300">「記録追加」から入力してください</p>
      </div>
    )
  }

  const latest = data[0].value
  const prev = data.length > 1 ? data[1].value : null
  const diff = prev !== null ? (latest - prev).toFixed(1) : null
  const isUp = prev !== null ? latest >= prev : true

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">現在の{type === 'height' ? '身長' : '体重'}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">{latest}</span>
            <span className="text-sm text-gray-400">{unit}</span>
            {diff !== null && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-400'}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Number(diff) >= 0 ? '+' : ''}{diff}{unit}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">厚労省平均（参考）</p>
          <p className="text-base font-semibold text-gray-500">{ref.avg}{unit}</p>
          <p className="text-xs text-gray-300">平均より {(latest - ref.avg).toFixed(1)}{unit}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={[...data].reverse()} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            domain={[(dataMin: number) => Math.floor(dataMin - 2), (dataMax: number) => Math.ceil(dataMax + 2)]}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}${unit}`, type === 'height' ? '身長' : '体重']}
            labelStyle={{ color: '#374151', fontSize: 12, fontWeight: 600 }}
            contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <ReferenceLine y={ref.avg} stroke="#94a3b8" strokeDasharray="5 3" strokeWidth={1.5} />
          <ReferenceLine y={ref.p10} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={ref.p90} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={1} />
          <Line
            type="monotone" dataKey="value" stroke={color} strokeWidth={3}
            dot={{ fill: color, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px" style={{ borderTop: '2px dashed #94a3b8' }} />
          <span className="text-xs text-gray-400">平均</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-slate-200" />
          <span className="text-xs text-gray-400">10〜90パーセンタイル</span>
        </div>
      </div>
    </div>
  )
}

function PercentileBar({ value, refData }: { value: number; refData: typeof HEIGHT_REF }) {
  const range = refData.p97 - refData.p3
  const pos = Math.max(0, Math.min(100, ((value - refData.p3) / range) * 100))
  let pLabel = ''
  if (value < refData.p3) pLabel = '3未満'
  else if (value < refData.p10) pLabel = '3〜10'
  else if (value < refData.avg) pLabel = '10〜50'
  else if (value < refData.p90) pLabel = '50〜90'
  else if (value < refData.p97) pLabel = '90〜97'
  else pLabel = '97超'

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-300 mb-1">
        <span>3</span><span>10</span><span>25</span><span>50</span><span>75</span><span>90</span><span>97</span>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-blue-100 via-green-100 to-blue-100 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-md transition-all duration-500"
          style={{ left: `calc(${pos}% - 8px)` }}
        />
      </div>
      <p className="text-xs text-center text-gray-500 mt-1.5">
        パーセンタイル: <span className="font-semibold text-orange-500">{pLabel}</span>
      </p>
    </div>
  )
}

export default function GrowthPage() {
  const [activeMetric, setActiveMetric] = useState<MetricType>('height')
  const [selectedChild, setSelectedChild] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)

  // 記録追加フォーム
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addHeight, setAddHeight] = useState('')
  const [addWeight, setAddWeight] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const child = children[selectedChild]
    if (!child) return
    setLoadingRecords(true)
    fetch(`/api/growth-records?childId=${child.id}`)
      .then(r => r.json())
      .then(d => setRecords(d.records ?? []))
      .catch(console.error)
      .finally(() => setLoadingRecords(false))
  }, [children, selectedChild])

  const heightData: ChartPoint[] = records
    .filter(r => r.height !== null)
    .map(r => ({ label: toChartLabel(r.recorded_at), value: r.height! }))

  const weightData: ChartPoint[] = records
    .filter(r => r.weight !== null)
    .map(r => ({ label: toChartLabel(r.recorded_at), value: r.weight! }))

  const chartData = activeMetric === 'height' ? heightData : weightData
  const latestHeight = heightData[0]?.value ?? null
  const latestWeight = weightData[0]?.value ?? null
  const bmi = latestHeight && latestWeight
    ? (latestWeight / ((latestHeight / 100) ** 2)).toFixed(1)
    : null

  const handleAddRecord = async () => {
    const child = children[selectedChild]
    if (!child || (!addHeight && !addWeight)) return
    setSaving(true)
    const res = await fetch('/api/growth-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: child.id, recordedAt: addDate, height: addHeight || null, weight: addWeight || null }),
    })
    const data = await res.json()
    if (data.record) {
      setRecords(p => [data.record, ...p])
    }
    setAddHeight('')
    setAddWeight('')
    setShowAddModal(false)
    setSaving(false)
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">成長記録</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-medium px-3.5 py-2 rounded-full shadow-sm shadow-orange-200 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            記録追加
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {children.length === 0 ? (
            <div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
          ) : (
            children.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(i)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedChild === i
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                <span>{c.avatar}</span>
                {c.name}
                <span className={`text-xs ${selectedChild === i ? 'text-orange-200' : 'text-gray-400'}`}>{calcAge(c.birth_date)}歳</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 身長/体重トグル */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
          <button
            onClick={() => setActiveMetric('height')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeMetric === 'height' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400'}`}
          >
            📏 身長
          </button>
          <button
            onClick={() => setActiveMetric('weight')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeMetric === 'weight' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400'}`}
          >
            ⚖️ 体重
          </button>
        </div>
      </div>

      {loadingRecords ? (
        <div className="px-4 pb-3 flex flex-col gap-3">
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* グラフ */}
          <div className="px-4 pb-3">
            <GrowthChart type={activeMetric} data={chartData} />
          </div>

          {/* パーセンタイル */}
          {chartData.length > 0 && (
            <div className="px-4 pb-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-3">成長曲線上の位置（参考）</p>
                <PercentileBar
                  value={chartData[0].value}
                  refData={activeMetric === 'height' ? HEIGHT_REF : WEIGHT_REF}
                />
              </div>
            </div>
          )}

          {/* 現在の数値カード */}
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">身長</p>
                {latestHeight !== null
                  ? <><p className="text-xl font-bold text-orange-500">{latestHeight}</p><p className="text-xs text-gray-300">cm</p></>
                  : <p className="text-xs text-gray-300 mt-2">--</p>
                }
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">体重</p>
                {latestWeight !== null
                  ? <><p className="text-xl font-bold text-green-500">{latestWeight}</p><p className="text-xs text-gray-300">kg</p></>
                  : <p className="text-xs text-gray-300 mt-2">--</p>
                }
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm text-center">
                <p className="text-xs text-gray-400 mb-1">BMI</p>
                {bmi !== null
                  ? <><p className="text-xl font-bold text-blue-500">{bmi}</p><p className="text-xs text-gray-300">計算値</p></>
                  : <p className="text-xs text-gray-300 mt-2">--</p>
                }
              </div>
            </div>
          </div>

          {/* 記録履歴 */}
          <div className="px-4 pb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700">記録履歴</p>
              </div>
              {records.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">まだ記録がありません</p>
                </div>
              ) : (
                records.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{formatDate(rec.recorded_at)}</span>
                    <div className="flex gap-6">
                      {rec.height !== null && <span className="text-sm font-medium text-orange-500">{rec.height} cm</span>}
                      {rec.weight !== null && <span className="text-sm font-medium text-green-500">{rec.weight} kg</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* 記録追加モーダル */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-w-lg mx-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">成長記録を追加</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">日付</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={e => setAddDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">身長 (cm)</label>
                  <input
                    type="number" placeholder="例: 110.5" step="0.1"
                    value={addHeight} onChange={e => setAddHeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">体重 (kg)</label>
                  <input
                    type="number" placeholder="例: 18.0" step="0.1"
                    value={addWeight} onChange={e => setAddWeight(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
              <button
                onClick={handleAddRecord}
                disabled={saving || (!addHeight && !addWeight)}
                className="w-full bg-orange-500 text-white font-semibold py-3.5 rounded-xl active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-40"
              >
                {saving ? '保存中...' : '記録する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
