import { useState } from 'react'
import { Backpack, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props {
  onSkip: () => void
}

type Mode = 'signin' | 'signup' | 'reset'

export default function AuthGate({ onSkip }: Props) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // onAuthStateChange in useAuth will pick up the new session
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setResetSent(true)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-800 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="text-white text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
          <Backpack size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">Backpacking Buddy</h1>
        <p className="text-green-200 text-sm mt-1">Save your trips across devices</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        {mode === 'reset' ? (
          resetSent ? (
            <div className="text-center py-4">
              <p className="font-semibold text-gray-800 mb-1">Check your email</p>
              <p className="text-sm text-gray-500">We sent a password reset link to {email}</p>
              <button className="mt-4 text-sm text-green-600 font-medium" onClick={() => { setMode('signin'); setResetSent(false) }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900">Reset password</h2>
              <EmailField value={email} onChange={setEmail} />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <SubmitButton loading={loading} onClick={submit} label="Send reset link" />
              <button className="w-full text-sm text-gray-400 hover:text-gray-600" onClick={() => setMode('signin')}>
                Back to sign in
              </button>
            </>
          )
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>

            {/* Google */}
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <EmailField value={email} onChange={setEmail} />

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock size={14} className="text-gray-400" />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <SubmitButton
              loading={loading}
              onClick={submit}
              label={mode === 'signin' ? 'Sign in' : 'Create account'}
            />

            <div className="flex items-center justify-between text-xs text-gray-400">
              <button className="hover:text-gray-600" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Create account' : 'Sign in instead'}
              </button>
              {mode === 'signin' && (
                <button className="hover:text-gray-600" onClick={() => setMode('reset')}>Forgot password?</button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Guest option */}
      <button
        onClick={onSkip}
        className="mt-6 flex items-center gap-1.5 text-green-200 hover:text-white text-sm transition-colors"
      >
        Continue without an account <ArrowRight size={14} />
      </button>
      <p className="text-green-300 text-xs mt-1.5 text-center max-w-xs">
        Your data stays on this device. You can sign in later to sync across devices.
      </p>
    </div>
  )
}

function EmailField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Mail size={14} className="text-gray-400" />
      </div>
      <input
        type="email"
        placeholder="Email"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
      />
    </div>
  )
}

function SubmitButton({ loading, onClick, label }: { loading: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
