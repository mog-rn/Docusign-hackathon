export default function PublicLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <main className=" h-screen overflow-hidden w-screen flex items-center justify-center">
          {children}
        </main>
    )
  }