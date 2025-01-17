'use client'

import { LoginForm } from "@/components/forms/LoginForm"
import Link from "next/link"


export default function LoginPage() {
  return (
    <div className="">
      {/* Form header */}
      <h1 className="text-2xl font-semibold text-gray-800">
        Login to your account
      </h1>
      <LoginForm />
      <div>
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline underline-offset-1">
          Register
        </Link> 
      </div>
    </div>
  )
}