export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero bg-fixed">
      <div className="min-h-screen bg-black/30">
        {children}
      </div>
    </div>
  );
}