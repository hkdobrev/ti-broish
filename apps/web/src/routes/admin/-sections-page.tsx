import { useEffect, useState } from 'react'
import { PageIntro } from '../../components/SiteChrome'
import { adminRoster } from '../../signup/admin'
import { adminPublish } from '../../signup/admin-assign-actions'
import { adminNotifyAssignment, adminPublishOne } from '../../signup/assignment-notify'
import type { AssignWarning } from '../../signup/admin-assign'
import type { RosterFields } from '../../signup/admin-csv'
import { TakenSectionsPanel } from './-taken-sections-panel'
import { SectionPersonRow } from './-section-person-row'
const views = [
  ['unassigned', 'Без секция'],
  ['draft', 'Чернова'],
  ['assigned', 'Публикувани'],
  ['abroad', 'Чужбина'],
] as const
const ghost = 'flex min-h-11 items-center justify-center rounded-[20px] border border-[#ddd] bg-white px-4 text-sm font-bold'
const button = 'brand-button'
type Suggestion = { id: string; place: string; score: number; reason: string }
export function SectionsPage() {
  const [view, setView] = useState<(typeof views)[number][0] | 'mir'>('unassigned')
  const [mir, setMir] = useState('')
  const [people, setPeople] = useState<RosterFields[]>([])
  const [taken, setTaken] = useState<Array<{ section_code: string; mir_code: string; place: string; organisation: string }>>([])
  const [message, setMessage] = useState('')
  const [armed, setArmed] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canPublish, setCanPublish] = useState(false)
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [rowWarnings, setRowWarnings] = useState<Record<string, AssignWarning[]>>({})
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({})
  const [suggestBusy, setSuggestBusy] = useState<string | null>(null)
  function load(nextView = view, nextMir = mir) {
    setArmed(false)
    void adminRoster({ data: { view: nextView, mir: nextMir } }).then((result) => {
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      setPeople(result.people)
      setTaken(result.taken)
      setCanEdit(result.permissions.edit)
      setCanPublish(result.permissions.publish)
      setDraftValues(Object.fromEntries(result.people.map((person) => [person.id, person.draftSection])))
    })
  }
  useEffect(() => {
    load()
  }, [])
  return (
    <div className="grid gap-6">
      <PageIntro title="Секции" lede="Черновата се вижда само тук. Масовото публикуване я показва в профила без имейл и пропуска заета, дублирана или чужда секция. За едноизвестяване ползвай „Публикувай и извести“ на реда." />
      <div className="flex flex-wrap gap-2">
        {views.map(([id, label]) => (
          <button key={id} type="button" className={view === id ? 'min-h-10 rounded-full bg-[#333] px-3 text-sm font-bold text-white' : ghost} onClick={() => { setView(id); load(id, mir) }}>
            {label}
          </button>
        ))}
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setView('mir'); load('mir', mir) }}>
        <label className="grid gap-1 text-sm font-semibold">
          МИР
          <input className="min-h-11 w-24 rounded-xl border border-[#ddd] bg-white px-3" inputMode="numeric" value={mir} onChange={(event) => setMir(event.target.value)} />
        </label>
        <button className={ghost} type="submit">Покажи МИР</button>
      </form>
      {canPublish ? (
        <button
          type="button"
          className={armed ? button : ghost}
          onClick={() => {
            if (!armed) {
              setArmed(true)
              return
            }
            void adminPublish({ data: { view, mir } }).then((result) => {
              setArmed(false)
              if (!result.ok) setMessage(result.message)
              else {
                const skipped = result.blocked?.length ?? 0
                setMessage(
                  skipped > 0
                    ? `Публикувани са ${result.published} чернови. Пропуснати заради заетост/дубликат/МИР: ${skipped}.`
                    : `Публикувани са ${result.published} чернови.`,
                )
                if (result.blocked?.length) {
                  setRowWarnings((current) => {
                    const next = { ...current }
                    for (const item of result.blocked) {
                      const person = people.find((row) => row.email === item.email)
                      if (person) next[person.id] = [{ code: 'taken', level: 'block', message: item.warning }]
                    }
                    return next
                  })
                }
                load()
              }
            })
          }}
        >
          {armed ? 'Да, покажи ги в профилите (без имейл)' : 'Публикувай черновите в този изглед (без имейл)'}
        </button>
      ) : null}
      {message ? <p>{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd] text-[#666]">
              <th className="py-2 pr-3 font-bold">Човек</th>
              <th className="py-2 pr-3 font-bold">Чернова</th>
              <th className="py-2 font-bold">Публикувана</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <SectionPersonRow
                key={person.id}
                person={person}
                canEdit={canEdit}
                draftValues={draftValues}
                setDraftValues={setDraftValues}
                warnings={rowWarnings[person.id] ?? []}
                setRowWarnings={setRowWarnings}
                tips={suggestions[person.id] ?? []}
                setSuggestions={setSuggestions}
                suggestBusy={suggestBusy}
                setSuggestBusy={setSuggestBusy}
                setMessage={setMessage}
                load={() => load()}
                canPublish={canPublish}
                publishOne={(id) => adminPublishOne({ data: { id } })}
                notifyAgain={(id) => adminNotifyAssignment({ data: { id } })}
              />
            ))}
          </tbody>
        </table>
      </div>
      <TakenSectionsPanel canEdit={canEdit} taken={taken} setMessage={setMessage} load={() => load()} />
    </div>
  )
}
