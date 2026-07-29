export function UserAvatar({ name, size = 'medium' }: { name: string; size?: 'small' | 'medium' | 'large' }) {
  const initials = name.split(/\s|\+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`avatar avatar-${size}`} title={name} aria-label={name}>{initials}</span>
}
