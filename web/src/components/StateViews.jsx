export function LoadingState({ label = 'Loading IOCF data…' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p className="text-dim">{label}</p>
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div className="error-banner">
      <strong>Couldn't load the IOCF workbook.</strong>
      <p style={{ marginTop: 6 }}>{message}</p>
      <p style={{ marginTop: 6 }} className="text-dim">
        Make sure the local data server is running: <code>cd server && python3 server.py</code>
      </p>
    </div>
  )
}
