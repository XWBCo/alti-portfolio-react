export default function Header({ title }: { title?: string | React.ReactNode }) {
  return (
    <header className="sticky top-0 bg-white z-50 shadow-md" style={{ borderBottom: '3px solid #34E5B8' }}>
      <div className="max-w-container mx-auto px-12 py-8 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <a
            href="/home"
            className="text-4xl font-light leading-none transition-colors"
            style={{ color: '#34E5B8' }}
            title="Back to Home"
          >
            ←
          </a>
          <img src="/alti.PNG" alt="AlTi Global" className="h-14" />
        </div>

        {typeof title === 'string' ? (
          <h1 className="font-serif text-3xl" style={{ color: '#010203' }}>{title}</h1>
        ) : (
          title
        )}

        <div className="flex items-center gap-10">
          <a
            href="/"
            className="text-lg font-medium transition-colors hover:opacity-70"
            style={{ color: '#757575' }}
          >
            Home
          </a>
          <a
            href="/data"
            className="text-lg font-medium transition-colors hover:opacity-70"
            style={{ color: '#757575' }}
          >
            Data
          </a>
        </div>
      </div>
    </header>
  );
}
