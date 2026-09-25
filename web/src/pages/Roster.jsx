import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import Badge from '../components/Badge'
import { boardCode } from '../lib/badges'
import './Roster.css'

export default function Roster() {
  const { data, loading, error } = useDashboard()
  const [expandedBoards, setExpandedBoards] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  const boards = (data.boards || []).sort((a, b) => a.name.localeCompare(b.name))

  const toggleBoard = (boardName) => {
    const newSet = new Set(expandedBoards)
    if (newSet.has(boardName)) {
      newSet.delete(boardName)
    } else {
      newSet.add(boardName)
    }
    setExpandedBoards(newSet)
  }

  const filterPeople = (people, query) => {
    if (!query.trim()) return people
    const q = query.toLowerCase()
    return people.filter(p => p.toLowerCase().includes(q))
  }

  const getTotalPeople = (board) => {
    let count = 0
    if (board.chairman) count++
    if (board.ceo) count++
    count += (board.players || []).length
    return count
  }

  const getBoardPeople = (board) => {
    const people = []
    if (board.chairman) people.push({ name: board.chairman, role: 'Chairman' })
    if (board.ceo) people.push({ name: board.ceo, role: 'CEO' })
    ;(board.players || []).forEach(p => people.push({ name: p, role: 'Player' }))
    return people
  }

  const totalPeople = boards.reduce((sum, b) => sum + getTotalPeople(b), 0)

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <Link to="/" className="roster-back">
            ← Back
          </Link>
          <div className="section-header">
            <div>
              <h2>Complete IOCF Roster</h2>
              <p className="section-header__eyebrow">{totalPeople} people across {boards.length} boards</p>
            </div>
          </div>

          <div className="roster-search">
            <input
              type="text"
              placeholder="Search by name, board..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="roster-search__input"
            />
          </div>

          <div className="roster-boards">
            {boards.map((board) => {
              const people = getBoardPeople(board)
              const filtered = filterPeople(people.map(p => p.name), searchTerm)
              const isExpanded = expandedBoards.has(board.name)

              // Skip if search doesn't match this board
              if (searchTerm.trim() && filtered.length === 0 && !board.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return null
              }

              return (
                <div key={board.name} className="roster-board">
                  <button
                    className="roster-board__header"
                    onClick={() => toggleBoard(board.name)}
                  >
                    <div className="roster-board__header-left">
                      <Badge name={board.name} size={32} />
                      <div>
                        <p className="roster-board__name">{board.name}</p>
                        <p className="roster-board__count">{getTotalPeople(board)} people</p>
                      </div>
                    </div>
                    <span className={`roster-board__toggle ${isExpanded ? 'expanded' : ''}`}>▼</span>
                  </button>

                  {isExpanded && (
                    <div className="roster-board__people">
                      {people.map((person, idx) => {
                        if (searchTerm.trim() && !person.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                          return null
                        }
                        return (
                          <div key={`${person.name}-${person.role}`} className="roster-person">
                            <span className="roster-person__number">{idx + 1}.</span>
                            <span className="roster-person__name">{person.name}</span>
                            <span className={`roster-person__role roster-person__role--${person.role.toLowerCase()}`}>
                              {person.role}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {searchTerm.trim() && boards.filter(b => filterPeople(getBoardPeople(b).map(p => p.name), searchTerm).length > 0 || b.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="empty-state">No matches found for "{searchTerm}"</div>
          )}
        </section>
      </div>
    </div>
  )
}
