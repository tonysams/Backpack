import { useEffect, useRef, useState } from 'react'
import { Home, CheckSquare, Map, ShieldCheck, Backpack, LogOut, LogIn } from 'lucide-react'
import { useStore } from './store/useStore'
import { useAuth } from './hooks/useAuth'
import OverviewTab from './tabs/OverviewTab'
import PackingTab from './tabs/PackingTab'
import TripsTab from './tabs/TripsTab'
import SafetyTab from './tabs/SafetyTab'
import GearTab from './tabs/GearTab'
import SharedTripView from './components/SharedTripView'
import AuthGate from './components/AuthGate'
import { getShareParam } from './utils/share'

export type Tab = 'overview' | 'packing' | 'trips' | 'safety' | 'gear'

const NAV = [
  { id: 'overview' as Tab, label: 'Overview', Icon: Home },
  { id: 'packing' as Tab, label: 'Packing', Icon: CheckSquare },
  { id: 'trips' as Tab, label: 'Trips', Icon: Map },
  { id: 'safety' as Tab, label: 'Safety', Icon: ShieldCheck },
  { id: 'gear' as Tab, label: 'Gear', Icon: Backpack },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const seedDefaultGear = useStore(s => s.seedDefaultGear)
  const syncFromSupabase = useStore(s => s.syncFromSupabase)
  const clearUserData = useStore(s => s.clearUserData)
  const skippedAuth = useStore(s => s.skippedAuth)
  const setSkippedAuth = useStore(s => s.setSkippedAuth)
  const shareParam = getShareParam()

  const { user, loading, signOut } = useAuth()
  const prevUserId = useRef<string | null>(null)

  // Sync from Supabase on login, then seed defaults if still empty
  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      prevUserId.current = user.id
      syncFromSupabase().then(() => seedDefaultGear())
    }
    if (!user) {
      prevUserId.current = null
    }
  }, [user, syncFromSupabase, seedDefaultGear])

  // Seed default gear for guest users
  useEffect(() => {
    if (!user) seedDefaultGear()
  }, [user, seedDefaultGear])

  const handleSignOut = async () => {
    await signOut()
    clearUserData()
    seedDefaultGear()
  }

  // Show shared trip view when a ?share= param is present
  if (shareParam) {
    return (
      <SharedTripView
        encoded={shareParam}
        onImported={() => {
          window.history.replaceState({}, '', window.location.pathname)
          setTab('trips')
        }}
      />
    )
  }

  // Show auth gate if not signed in and hasn't chosen to skip
  if (!loading && !user && !skippedAuth) {
    return <AuthGate onSkip={() => setSkippedAuth(true)} />
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Account banner — shown when using guest mode */}
          {!user && skippedAuth && (
            <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-100">
              <p className="text-xs text-amber-700">Guest mode — data saved locally only</p>
              <button
                onClick={() => setSkippedAuth(false)}
                className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900"
              >
                <LogIn size={12} /> Sign in
              </button>
            </div>
          )}

          {/* Account banner — shown when signed in */}
          {user && (
            <div className="flex items-center justify-between px-4 py-2 bg-green-50 border-b border-green-100">
              <p className="text-xs text-green-700 truncate">{user.email}</p>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 shrink-0 ml-2"
              >
                <LogOut size={12} /> Sign out
              </button>
            </div>
          )}

          {tab === 'overview' && <OverviewTab onNavigate={setTab} />}
          {tab === 'packing'  && <PackingTab />}
          {tab === 'trips'    && <TripsTab />}
          {tab === 'safety'   && <SafetyTab />}
          {tab === 'gear'     && <GearTab />}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20 pb-safe">
        <div className="max-w-2xl mx-auto flex">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                tab === id ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={tab === id ? 2.5 : 1.8} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
