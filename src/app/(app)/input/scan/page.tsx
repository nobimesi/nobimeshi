'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Camera, Upload, ArrowLeft, Loader2,
  SwitchCamera, X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RecognizedFood {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
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
      // エラー時はオーバーレイを閉じる（呼び出し元でフォールバック）
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
      {/* シャッターフラッシュ */}
      {flash && <div className="absolute inset-0 bg-white z-10 pointer-events-none opacity-80" />}

      {/* 上部：閉じる・タイトル・カメラ切替 */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-14 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm font-semibold">食事を撮影</span>
        <button
          onClick={toggleFacing}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
        >
          <SwitchCamera className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* カメラ映像 */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={() => setReady(true)}
          className={`w-full h-full object-cover ${facingMode === 'user' ? '[transform:scaleX(-1)]' : ''}`}
        />

        {/* ガイド枠 */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              {/* 四隅のマーカー */}
              {[
                'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
                'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
                'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
              ))}
              {/* 半透明オーバーレイ（外側を暗くする） */}
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

      {/* 下部：シャッター・ライブラリ */}
      <div className="relative z-20 flex items-center justify-center gap-14 px-8 py-8">
        {/* 空白（左バランス用） */}
        <div className="w-14 h-14" />

        {/* シャッター */}
        <button
          onClick={capture}
          disabled={!ready}
          className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <div className="w-[62px] h-[62px] rounded-full border-[3px] border-gray-300" />
        </button>

        {/* カメラ切替（右） */}
        <button
          onClick={toggleFacing}
          className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex flex-col items-center justify-center gap-1"
        >
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
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecognizedFood[] | null>(null)
  const [cameraError, setCameraError] = useState('')

  // ライブカメラ起動
  const handleOpenCamera = async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('このブラウザはカメラに対応していません。ライブラリから画像を選択してください。')
      return
    }
    try {
      // 権限チェック（実際のストリームはCameraOverlay内で取得）
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

  // カメラキャプチャ完了
  const handleCapture = (dataUrl: string) => {
    setShowCamera(false)
    setPreview(dataUrl)
    setResult(null)
  }

  // ファイル選択（ライブラリ or ネイティブカメラ）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setResult(null)
    e.target.value = ''
  }

  // リセット
  const reset = () => {
    setPreview(null)
    setResult(null)
    setCameraError('')
  }

  // AI解析（ダミー）
  const handleAnalyze = async () => {
    if (!preview) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1800))
    setResult([
      { name: 'ごはん（茶碗1杯）', amount: '150g', calories: 252, protein: 3.8, carbs: 55.7, fat: 0.5 },
      { name: '味噌汁（わかめ）',  amount: '1杯',  calories: 35,  protein: 2.4, carbs: 2.8,  fat: 0.9 },
      { name: '焼き鮭',           amount: '80g',  calories: 115, protein: 17.8, carbs: 0.1,  fat: 4.8 },
    ])
    setLoading(false)
  }

  return (
    <>
      {/* カメラオーバーレイ（fullscreen portal的に配置） */}
      {showCamera && (
        <CameraOverlay
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="flex flex-col min-h-screen">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4">
          <Link href="/home" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">食べ物をスキャン</h1>
        </div>

        <div className="px-4 flex flex-col gap-4">

          {/* ── 画像未選択：初期状態 ── */}
          {!preview && (
            <>
              {/* カメラエラー */}
              {cameraError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-xs text-yellow-700">
                  {cameraError}
                </div>
              )}

              {/* メインエリア：ライブカメラ起動 */}
              <button
                onClick={handleOpenCamera}
                className="w-full h-52 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-orange-50 active:bg-orange-100 transition-colors"
              >
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">カメラで撮影</p>
                  <p className="text-xs text-gray-400 mt-1">ライブカメラを起動して食事を撮影</p>
                </div>
              </button>

              {/* ライブラリから選択 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <Upload className="w-4 h-4" />
                ライブラリから選択
              </button>
            </>
          )}

          {/* ── 画像選択済み：プレビュー ── */}
          {preview && (
            <>
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={preview}
                  alt="食事の写真"
                  className="w-full h-56 object-cover"
                />
                {!loading && !result && (
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* 解析ボタン */}
              {!result && (
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI解析中...
                    </>
                  ) : (
                    'AIで解析する'
                  )}
                </button>
              )}

              {/* 解析結果 */}
              {result && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">認識された食べ物</span>
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">AI解析完了</span>
                  </div>

                  {result.map((food, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-400">{food.amount}</p>
                        </div>
                        <span className="text-sm font-bold text-orange-500">{food.calories}kcal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
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

                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
                    ※ AI解析の結果は目安です。実際の栄養素は食材・調理法により異なります。
                  </div>

                  <div className="flex gap-3 pb-4">
                    <button
                      onClick={reset}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
                    >
                      撮り直す
                    </button>
                    <button
                      onClick={() => router.push('/home')}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-medium shadow-sm shadow-orange-200 active:scale-95 transition-transform"
                    >
                      記録する
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 隠しinput（ライブラリ選択） */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </>
  )
}
