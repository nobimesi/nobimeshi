'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Camera, Upload, ArrowLeft, Loader2,
  SwitchCamera, X, Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RecognizedFood {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
  vitamin_c?: number
  calcium?: number
  iron?: number
  vitamin_d?: number
}

interface Child {
  id: string
  name: string
  avatar: string
}

const MEAL_TYPES = [
  { key: 'breakfast' as const, label: '朝食', icon: '🌅' },
  { key: 'lunch'     as const, label: '昼食', icon: '☀️' },
  { key: 'dinner'    as const, label: '夕食', icon: '🌙' },
  { key: 'snack'     as const, label: 'おやつ', icon: '🍪' },
]

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// カメラオーバーレイ（fullscreen）
function CameraOverlay({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [flash, setFlash] = useState(false)
  const [ready, setReady] = useState(false)

  const startStream = useCallback(async (facing: 'environment' | 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    startStream(facingMode)
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startStream(next)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    setFlash(true)
    setTimeout(() => setFlash(false), 150)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture(dataUrl)
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {flash && <div className="absolute inset-0 bg-white z-10 pointer-events-none opacity-80" />}
      <div className="relative z-20 flex items-center justify-between px-4 pt-14 pb-3">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm font-semibold">食事を撮影</span>
        <button onClick={toggleFacing} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
          <SwitchCamera className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef} autoPlay playsInline muted
          onCanPlay={() => setReady(true)}
          className={`w-full h-full object-cover ${facingMode === 'user' ? '[transform:scaleX(-1)]' : ''}`}
        />
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
                'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
                'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
              ].map((cls, i) => <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />)}
            </div>
          </div>
        )}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        {ready && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-xs">
            食事全体が枠に収まるように撮影してください
          </p>
        )}
      </div>
      <div className="relative z-20 flex items-center justify-center gap-14 px-8 py-8">
        <div className="w-14 h-14" />
        <button onClick={capture} disabled={!ready}
          className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50">
          <div className="w-[62px] h-[62px] rounded-full border-[3px] border-gray-300" />
        </button>
        <button onClick={toggleFacing}
          className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex flex-col items-center justify-center gap-1">
          <SwitchCamera className="w-5 h-5 text-white" />
          <span className="text-white/70 text-[10px]">切替</span>
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// ===================== メインページ =====================
export default function ScanPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showCamera, setShowCamera] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecognizedFood[] | null>(null)
  const [analyzeError, setAnalyzeError] = useState('')
  const [cameraError, setCameraError] = useState('')

  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildIndex, setSelectedChildIndex] = useState(0)
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetch('/api/children')
      .then(r => r.json())
      .then(d => setChildren(d.children ?? []))
      .catch(console.error)

    // 時刻に応じてデフォルト食事タイプを設定
    const h = new Date().getHours()
    if (h < 10) setMealType('breakfast')
    else if (h < 14) setMealType('lunch')
    else if (h < 17) setMealType('snack')
    else setMealType('dinner')
  }, [])

  const handleOpenCamera = async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('このブラウザはカメラに対応していません。ライブラリから画像を選択してください。')
      return
    }
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => s.getTracks().forEach(t => t.stop()))
      setShowCamera(true)
    } catch (err: unknown) {
      const error = err as Error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('カメラの使用が許可されていません。ブラウザのアドレスバー横のカメラアイコンから許可してください。')
      } else {
        setCameraError('カメラを起動できませんでした。ライブラリから画像を選択してください。')
      }
    }
  }

  const handleCapture = (dataUrl: string) => {
    setShowCamera(false)
    setPreview(dataUrl)
    setImageBase64(dataUrl.split(',')[1])
    setMediaType('image/jpeg')
    setResult(null)
    setAnalyzeError('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ── MIME タイプを同期的に確定（Anthropic API サポート形式に正規化）──
    // Safari では onload 内で file.type を参照すると input がクリア済みで
    // 空文字になる場合があるため、ここで先にキャプチャする。
    // HEIC / HEIF（iPhone 撮影）など非サポート形式は image/jpeg として送信。
    const SUPPORTED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
    type SupportedMime = typeof SUPPORTED_MIME[number]
    const rawType = file.type.toLowerCase()
    const resolvedMime: SupportedMime = (SUPPORTED_MIME as readonly string[]).includes(rawType)
      ? (rawType as SupportedMime)
      : 'image/jpeg'

    // input 参照も同期的にキャプチャ
    const inputEl = e.target

    const reader = new FileReader()

    reader.onload = (ev) => {
      const result = ev.target?.result
      // readAsDataURL は必ず string を返すが型安全のためガード
      if (typeof result !== 'string' || !result) {
        setAnalyzeError('画像データの読み込みに失敗しました。')
        return
      }

      // "data:[type];base64,<data>" の <data> 部分のみ取り出す
      // indexOf で最初の "," を探す（URL に複数カンマがある場合も安全）
      const commaIdx = result.indexOf(',')
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result

      setPreview(result)
      setImageBase64(base64)
      setMediaType(resolvedMime)

      // ── input クリアは onload 完了後に実行 ──
      // 同期クリアすると Safari で File オブジェクトが無効化され
      // "The string did not match the expected pattern." が発生する。
      inputEl.value = ''
    }

    reader.onerror = () => {
      setAnalyzeError('画像の読み込みに失敗しました。別の画像を試してください。')
    }

    setResult(null)
    setAnalyzeError('')
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setPreview(null)
    setImageBase64(null)
    setResult(null)
    setCameraError('')
    setAnalyzeError('')
    setSaveError('')
  }

  const handleAnalyze = async () => {
    if (!imageBase64) return
    setLoading(true)
    setAnalyzeError('')
    try {
      const res = await fetch('/api/ai-food-recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      const foods: Array<{
        foodName: string; calories: number; protein: number; carbs: number; fat: number
        portion: string; vitamin_c?: number; calcium?: number; iron?: number; vitamin_d?: number
      }> = data.foods ?? []
      if (foods.length === 0) throw new Error('食品を認識できませんでした。別の角度で撮影してみてください。')
      setResult(foods.map(f => ({
        name: f.foodName,
        amount: f.portion ?? '',
        calories: f.calories ?? 0,
        protein: f.protein ?? 0,
        carbs: f.carbs ?? 0,
        fat: f.fat ?? 0,
        vitamin_c: f.vitamin_c,
        calcium: f.calcium,
        iron: f.iron,
        vitamin_d: f.vitamin_d,
      })))
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result || children.length === 0) return
    setSaving(true)
    setSaveError('')
    const child = children[selectedChildIndex]
    const today = toLocalDateStr(new Date())
    try {
      // ローカル正午をUTCに変換（UTCハードコードではなくローカル日時で記録）
      const recordedAt = new Date(`${today}T12:00:00`).toISOString()
      const responses = await Promise.all(
        result.map(food =>
          fetch('/api/meal-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              childId: child.id,
              mealType,
              foodName: food.name,
              calories: food.calories || null,
              protein: food.protein || null,
              carbs: food.carbs || null,
              fat: food.fat || null,
              recordedAt,
              vitamin_c: food.vitamin_c ?? null,
              calcium: food.calcium ?? null,
              iron: food.iron ?? null,
              vitamin_d: food.vitamin_d ?? null,
            }),
          })
        )
      )
      const failed = responses.find(r => !r.ok)
      if (failed) throw new Error('保存に失敗しました')
      router.push('/home')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const totalCalories = result?.reduce((s, f) => s + (f.calories ?? 0), 0) ?? 0

  return (
    <>
      {showCamera && (
        <CameraOverlay onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}

      <div className="flex flex-col min-h-screen">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">食べ物をスキャン</h1>
        </div>

        <div className="px-4 flex flex-col gap-4 pb-8">

          {/* 画像未選択：初期状態 */}
          {!preview && (
            <>
              {cameraError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-xs text-yellow-700">
                  {cameraError}
                </div>
              )}
              <button onClick={handleOpenCamera}
                className="w-full h-52 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-orange-50 active:bg-orange-100 transition-colors">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">カメラで撮影</p>
                  <p className="text-xs text-gray-400 mt-1">ライブカメラを起動して食事を撮影</p>
                </div>
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <Upload className="w-4 h-4" />
                ライブラリから選択
              </button>
            </>
          )}

          {/* 画像選択済み */}
          {preview && (
            <>
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="食事の写真" className="w-full h-56 object-cover" />
                {!loading && !result && (
                  <button onClick={reset}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* 解析ボタン */}
              {!result && (
                <>
                  <button onClick={handleAnalyze} disabled={loading}
                    className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />AI解析中（少々お待ちください）...</>
                    ) : (
                      'AIで解析する'
                    )}
                  </button>
                  {analyzeError && (
                    <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{analyzeError}</p>
                  )}
                </>
              )}

              {/* 解析結果 */}
              {result && (
                <div className="flex flex-col gap-3">
                  {/* 認識結果サマリーカード */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-white" />
                      <div>
                        <p className="text-white font-bold text-base">{result.length}品目を認識</p>
                        <p className="text-green-100 text-xs">AI解析完了</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-2xl">{Math.round(totalCalories)}</p>
                      <p className="text-green-100 text-xs">合計 kcal</p>
                    </div>
                  </div>

                  {result.map((food, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-400">{food.amount}</p>
                        </div>
                        <span className="text-sm font-bold text-orange-500 shrink-0 ml-2">{food.calories}kcal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-gray-400">P</p>
                          <p className="text-xs font-medium text-gray-700">{food.protein}g</p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-gray-400">C</p>
                          <p className="text-xs font-medium text-gray-700">{food.carbs}g</p>
                        </div>
                        <div className="bg-red-50 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-gray-400">F</p>
                          <p className="text-xs font-medium text-gray-700">{food.fat}g</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400">
                    ※ AI解析の結果は目安です。実際の栄養素は食材・調理法により異なります。
                  </div>

                  {/* 子供選択 */}
                  {children.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">記録する子供</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {children.map((c, i) => (
                          <button key={c.id} onClick={() => setSelectedChildIndex(i)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              selectedChildIndex === i
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                            <span>{c.avatar}</span>{c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 食事タイプ選択 */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">食事の種類</p>
                    <div className="grid grid-cols-4 gap-2">
                      {MEAL_TYPES.map(m => (
                        <button key={m.key} onClick={() => setMealType(m.key)}
                          className={`py-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs font-semibold border transition-all ${
                            mealType === m.key
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-white border-gray-200 text-gray-500'
                          }`}>
                          <span className="text-base">{m.icon}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl px-4 py-3">{saveError}</p>
                  )}

                  <div className="flex gap-3">
                    <button onClick={reset}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium active:scale-95 transition-transform">
                      撮り直す
                    </button>
                    <button onClick={handleSave} disabled={saving || children.length === 0}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm shadow-orange-200 active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" />保存中...</> : '記録する'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </>
  )
}
