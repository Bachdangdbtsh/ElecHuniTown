import Image from 'next/image';
import styles from './BrandLogo.module.css';

export default function BrandLogo({ variant = 'mark', className = '', alt = 'ElecHuniTown' }) {
  const classes = [styles.logo, styles[variant], className].filter(Boolean).join(' ');

  return (
    <span className={classes} role="img" aria-label={alt}>
      <Image src="/inventory/brand-logo.png" alt="" width={500} height={499} unoptimized />
    </span>
  );
}
