import React, { ReactNode } from 'react'

export default function AuthLayout({
    children
}: {
    children: ReactNode
}) {
  return (
    <div className='min-h-screen bg-gray-100'>
        <nav className="bg-white shadow-sm">
        {/* Add authenticated navigation here */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Nav content */}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
