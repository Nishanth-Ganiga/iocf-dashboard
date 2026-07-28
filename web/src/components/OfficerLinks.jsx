import { Link } from 'react-router-dom'
import { splitOfficeHolders } from '../lib/playerProfile'

// Renders a board's Chairman/CEO field as one link per person — some
// boards credit more than one person with the same office in a single
// cell (e.g. "Srinidhi & Donald Baghwar"), so a single Link with the raw
// string as both href and label would 404 on click. Splits and renders
// each name as its own link, joined visually by " & ".
export default function OfficerLinks({ value, className, onClick }) {
  const names = splitOfficeHolders(value)
  if (names.length === 0) return '—'
  return names.map((n, i) => (
    <span key={n}>
      {i > 0 && ' & '}
      <Link to={`/players/${encodeURIComponent(n)}`} className={className} onClick={onClick}>
        {n}
      </Link>
    </span>
  ))
}
