const TIME_ZONE = 'America/Sao_Paulo'
const EVENT_DATE = '2026-10-11'

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date)
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function getOperationalDate(date = new Date()) {
  const parts = localParts(date)
  const isoDate = `${parts.year}-${parts.month}-${parts.day}`
  const todayUtc = Date.parse(`${isoDate}T12:00:00Z`)
  const eventUtc = Date.parse(`${EVENT_DATE}T12:00:00Z`)
  const nextSeven = new Date(todayUtc + 7 * 86_400_000).toISOString().slice(0, 10)
  return {
    timezone: TIME_ZONE,
    iso_date: isoDate,
    date_label: new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, dateStyle: 'full' }).format(date),
    weekday: new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, weekday: 'long' }).format(date),
    time: `${parts.hour}:${parts.minute}`,
    days_until_event: Math.ceil((eventUtc - todayUtc) / 86_400_000),
    event_date: EVENT_DATE,
    start_of_day: `${isoDate}T00:00:00-03:00`,
    end_of_day: `${isoDate}T23:59:59-03:00`,
    next_seven_days_end: nextSeven,
  }
}
