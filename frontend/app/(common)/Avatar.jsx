import Image from 'next/image';

export default function Avatar({ src, alt = 'Ảnh đại diện', size = 48, fallback, className = '' }) {
  const avatarSize = Number.isFinite(size) && size > 0 ? size : 48;
  const style = { '--avatar-size': `${avatarSize}px` };
  const classes = `avatar${className ? ` ${className}` : ''}`;

  if (!src && fallback) {
    return <span className={`${classes} avatar-fallback`} style={style} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>{fallback}</span>;
  }

  return (
    <Image
      className={classes}
      src={src || '/default-avatar.svg'}
      alt={alt}
      width={avatarSize}
      height={avatarSize}
      style={style}
      unoptimized
    />
  );
}
