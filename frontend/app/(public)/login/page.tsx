'use client'

import { useState } from 'react'
import { getOrganizationFromEmail, OrganizationDomain } from '@/utils/organization'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organization, setOrganization] = useState<OrganizationDomain | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    
    if (newEmail.includes('@')) {
      const org = await getOrganizationFromEmail(newEmail)
      setOrganization(org)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!organization) {
      setError('Invalid organization')
      return
    }

    try {
      // Your login logic here using email, password, and organization.organizationId
    } catch (error) {
      setError('Login failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex h-full flex-col items-center justify-center">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      {organization && (
        <div className="text-sm text-gray-600">
          Signing in to: {organization.name}
        </div>
      )}
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        className="w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Sign in
      </button>
    </form>
  )
}