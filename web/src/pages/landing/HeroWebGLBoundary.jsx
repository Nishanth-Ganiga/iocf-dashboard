import { Component } from 'react'

// Narrow error boundary just for the WebGL hero: if the R3F scene throws
// during render (WebGL context creation failure, driver quirk, etc.),
// fall back to the CSS hero instead of taking down the whole Landing page
// with the generic app-wide ErrorBoundary's "Try again" screen - a failed
// 3D scene should be invisible to the visitor, not an error state.
export default class HeroWebGLBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('IOCF hero WebGL scene failed, falling back to CSS hero:', error, info)
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
