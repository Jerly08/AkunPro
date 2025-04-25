import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-dark">Akun</span>
        <span className="text-primary">pro</span>
      </span>
    </Link>
  );
} 