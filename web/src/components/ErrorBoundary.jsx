import { Component } from 'react'

// Last line of defense: if any page throws during render (e.g. an
// unexpected shape in the workbook data we didn't anticipate), show a
// recoverable error screen instead of a blank white/black page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('IOCF dashboard render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading-state" style={{ minHeight: '100vh' }}>
          <div className="error-banner" style={{ maxWidth: 520 }}>
            <strong>Something went wrong rendering this page.</strong>
            <p style={{ marginTop: 6 }} className="text-dim">
              {this.state.error.message || String(this.state.error)}
            </p>
            <button className="btn btn-outline-gold" style={{ marginTop: 14 }} onClick={() => this.setState({ error: null })}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
