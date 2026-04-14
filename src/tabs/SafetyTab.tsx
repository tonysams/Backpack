import { useState } from 'react'
import { Plus, Phone, Trash2, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import Modal from '../components/Modal'

const SAFETY_TIPS = [
  'Always tell someone your exact route and expected return time',
  'Carry a physical map and compass as backup navigation',
  'Know the signs of hypothermia and heat exhaustion',
  'Turn back if conditions deteriorate unexpectedly',
  'Carry a personal locator beacon (PLB) in remote areas',
  'Check trail conditions and weather forecast before departure',
  'Bring extra food and water for at least one extra day',
]

const RELATIONSHIPS = ['Spouse / Partner', 'Parent', 'Sibling', 'Friend', 'Coworker', 'Emergency Services', 'Other']

export default function SafetyTab() {
  const trips = useStore(s => s.trips)
  const emergencyContacts = useStore(s => s.emergencyContacts)
  const activeTripId = useStore(s => s.activeTripId)
  const deleteEmergencyContact = useStore(s => s.deleteEmergencyContact)
  const updateItineraryEmail = useStore(s => s.updateItineraryEmail)

  const [showAdd, setShowAdd] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)

  const activeTrip = trips.find(t => t.id === activeTripId)
  const contacts = emergencyContacts
    .filter(c => c.tripId === activeTripId)
    .sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime())

  const saveEmail = () => {
    if (!activeTripId) return
    updateItineraryEmail(activeTripId, emailDraft.trim())
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2000)
  }

  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-8 text-gray-400">
        <ShieldCheck size={52} className="mb-4 opacity-20" />
        <p className="font-semibold text-gray-500 text-lg">No active trip</p>
        <p className="text-sm mt-1">Select a trip from the Overview tab to manage safety contacts.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Safety & Contacts</h1>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">{activeTrip.name}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
        >
          <Plus size={15} /> Add Contact
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Emergency contacts */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Emergency Contacts</h2>

          {contacts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-6 text-center text-gray-400">
              <Phone size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-gray-500">No contacts added yet</p>
              <p className="text-xs mt-1">Add people who should be notified in an emergency</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map(contact => (
                <div key={contact.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{contact.name}</p>
                    <p className="text-xs text-gray-400">{contact.relationship} · {contact.phone}</p>
                  </div>
                  <a
                    href={`tel:${contact.phone.replace(/\D/g, '')}`}
                    className="p-2 rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-colors shrink-0"
                  >
                    <Phone size={16} />
                  </a>
                  <button
                    onClick={() => deleteEmergencyContact(contact.id)}
                    className="p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Itinerary sharing */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Itinerary Sharing</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
            <p className="text-sm text-gray-600">Who has a copy of your itinerary?</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-green-400 focus-within:border-green-400">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <input
                  type="email"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  placeholder="someone@email.com"
                  defaultValue={activeTrip.itineraryEmail ?? ''}
                  onChange={e => setEmailDraft(e.target.value)}
                  onFocus={e => setEmailDraft(e.target.value)}
                />
              </div>
              <button
                onClick={saveEmail}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
              >
                {emailSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            {activeTrip.itineraryEmail && !emailSaved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> Saved: {activeTrip.itineraryEmail}
              </p>
            )}
          </div>
        </section>

        {/* Safety tips */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Safety Guidelines</h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 shadow-sm overflow-hidden">
            {SAFETY_TIPS.map(tip => (
              <div key={tip} className="flex items-start gap-3 px-4 py-3">
                <ShieldCheck size={14} className="text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showAdd && activeTripId && (
        <AddContactModal tripId={activeTripId} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}

// ---- Add Contact Modal ----

function AddContactModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const addEmergencyContact = useStore(s => s.addEmergencyContact)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('')

  const valid = name.trim() && phone.trim()

  const submit = () => {
    if (!valid) return
    addEmergencyContact(tripId, {
      name: name.trim(),
      phone: phone.trim(),
      relationship,
    })
    onClose()
  }

  return (
    <Modal
      title="Add Emergency Contact"
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={!valid}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Add Contact
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Full Name *">
          <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
        </Field>
        <Field label="Phone Number *">
          <input type="tel" className={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
        </Field>
        <Field label="Relationship">
          <select className={inp} value={relationship} onChange={e => setRelationship(e.target.value)}>
            <option value="">Select...</option>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
