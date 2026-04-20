'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2, Eye, EyeOff, ArrowLeft, Check, AlertTriangle, ExternalLink } from 'lucide-react'

type Mode = 'login' | 'signup' | 'reset'

function detectWebView(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  // Android WebView
  if (/Android/.test(ua) && /wv\)/.test(ua)) return true
  // iOS WebView（SafariなしのAppleWebKit）
  if (/iPhone|iPad|iPod/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) return true
  // 主要アプリ内ブラウザ（LINE, Facebook, Instagram, Twitter/X など）
  if (/FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|TikTok|MicroMessenger/.test(ua)) return true
  return false
}

function getOpenUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

function WebViewWarning() {
  const url = getOpenUrl()
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const [copied, setCopied] = useState(false)

  const handleOpenButton = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* アイコン */}
        <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg shadow-orange-200">
          <img src="/icon.png" alt="のびメシ" className="w-full h-full object-cover" />
        </div>

        {/* 警告アイコン */}
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-gray-800">ブラウザで開いてください</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            アプリ内ブラウザからのGoogleログインはセキュリティ上の理由で利用できません。
            {isIOS ? 'Safari' : 'Chrome'}などの外部ブラウザで開いてからログインしてください。
          </p>
        </div>

        {/* iOS向け手順 */}
        {isIOS ? (
          <div className="w-full bg-orange-50 rounded-2xl p-4 text-left flex flex-col gap-2">
            <p className="text-xs font-semibold text-orange-700">Safariで開く手順</p>
            <ol className="text-xs text-gray-600 flex flex-col gap-1.5 list-decimal pl-4">
              <li>画面下部または右上の <span className="font-medium">「…」「︙」「共有」</span> ボタンをタップ</li>
              <li><span className="font-medium">「Safariで開く」</span> または <span className="font-medium">「ブラウザで開く」</span> を選択</li>
              <li>Safariでログインする</li>
            </ol>
          </div>
        ) : (
          <div className="w-full bg-orange-50 rounded-2xl p-4 text-left flex flex-col gap-2">
            <p className="text-xs font-semibold text-orange-700">Chromeで開く手順</p>
            <ol className="text-xs text-gray-600 flex flex-col gap-1.5 list-decimal pl-4">
              <li>画面右上の <span className="font-medium">「︙」</span> メニューをタップ</li>
              <li><span className="font-medium">「Chromeで開く」</span> または <span className="font-medium">「ブラウザで開く」</span> を選択</li>
              <li>Chromeでログインする</li>
            </ol>
          </div>
        )}

        {/* URLコピーボタン */}
        <button
          onClick={handleOpenButton}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition-colors ${
            copied
              ? 'bg-green-50 border border-green-200 text-green-600'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {copied ? (
            <><Check className="w-4 h-4" />コピーしました！ブラウザに貼り付けて開いてください</>
          ) : (
            <><ExternalLink className="w-4 h-4" />URLをコピーしてブラウザで開く</>
          )}
        </button>

        <p className="text-xs text-gray-400">
          メールアドレスとパスワードでのログインはこのままご利用いただけます
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [isWebView, setIsWebView] = useState(false)

  useEffect(() => {
    setIsWebView(detectWebView())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    // TODO: パスワードリセットメール送信API呼び出し
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setResetSent(true)
  }

  const handleGoogle = () => {
    signIn('google', { callbackUrl: '/home' })
  }

  const Logo = () => (
    <div className="flex flex-col items-center mb-10">
      <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 shadow-lg shadow-orange-200">
        <img src="/icon.png" alt="のびメシ" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">のびメシ</h1>
      <p className="text-sm text-gray-400 mt-1">子供の成長を食事からサポート</p>
    </div>
  )

  // WebView検出時は警告画面を表示
  if (isWebView) {
    return <WebViewWarning />
  }

  // パスワードリセット画面
  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-full max-w-sm">
          <button
            onClick={() => { setMode('login'); setResetSent(false); setError('') }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            ログインに戻る
          </button>

          {resetSent ? (
            <div className="flex flex-col items-center gap-4 text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-2">メールを送信しました</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  <span className="font-medium text-gray-700">{email}</span> にパスワードリセット用のリンクを送信しました。
                  メールをご確認ください。
                </p>
              </div>
              <p className="text-xs text-gray-400">メールが届かない場合は迷惑メールフォルダをご確認ください</p>
              <button
                onClick={() => { setMode('login'); setResetSent(false) }}
                className="mt-2 px-8 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold"
              >
                ログイン画面へ
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">パスワードをリセット</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
              </p>

              <form onSubmit={handleReset} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-orange-200 disabled:opacity-60 mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  リセットメールを送信
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  // ログイン・新規登録画面
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <Logo />

      <div className="w-full max-w-sm">
        {/* Googleログイン */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Googleでログイン
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">または</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* メール・パスワード */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === 'login' && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => { setMode('reset'); setError('') }}
                className="text-xs text-orange-500 hover:text-orange-600"
              >
                パスワードをお忘れの方はこちら
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm shadow-orange-200 disabled:opacity-60 mt-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === 'signup' ? '新規登録' : 'ログイン'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
          className="w-full text-center text-sm text-gray-400 mt-4 hover:text-gray-600"
        >
          {mode === 'signup' ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
        </button>
      </div>
    </div>
  )
}
