// Renders a board's real flag SVG (statically copied from the flag-icons
// library into public/flags/ — only the 13 codes IOCF boards actually use,
// see boardIdentity.js's comment for why we don't just `import
// 'flag-icons/css/flag-icons.min.css'`: that pulls in every country's flag,
// ~250 of them, and bloated the build by 400+ KB for 13 flags we need).
// Falls back to an emoji flag for boards without an ISO country code
// (West Indies) or an unrecognized name.
export default function FlagIcon({ identity, className = '', alt = 'flag' }) {
  if (!identity) return null
  if (identity.flagCode) {
    return (
      <img
        src={`/flags/${identity.flagCode}.svg`}
        alt={alt}
        className={`board-flag-icon ${className}`.trim()}
        loading="lazy"
      />
    )
  }
  return (
    <span
      className={className}
      role="img"
      aria-label={alt}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', lineHeight: 1 }}
    >
      {identity.flagEmoji}
    </span>
  )
}
