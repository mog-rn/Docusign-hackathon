'use client'

import { LoginForm } from "@/components/forms/LoginForm"


export default function LoginPage() {
  return (
    <div className="">
      {/* Form header */}
      <h1 className="text-2xl font-semibold text-gray-800">
        Login to your account
      </h1>
      <LoginForm />
    </div>
  )
}