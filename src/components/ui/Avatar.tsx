type Props = { src?: string | null; name?: string | null; email?: string | null; size?: 'small' | 'medium' | 'large' };

const initials = (name: string, email: string) => (name || email).split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();

export function Avatar({ src, name = '', email = '', size = 'medium' }: Props) {
  return <span className={`avatar avatar-${size}`} style={src ? { backgroundImage: `url(${JSON.stringify(src)})` } : undefined} aria-label={name || email || undefined}>{!src && initials(name || '', email || '?')}</span>;
}
