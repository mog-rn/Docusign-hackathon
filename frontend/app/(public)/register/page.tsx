'use client'

import { RegisterForm } from "@/components/forms/RegisterForm"
import Link from "next/link"
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const handleNext = () => {
    router.push("/register/organization");
  }

  return (
    <div className="flex flex-col items-center justify-center w-full gap-[56px]">
      {/* Form header */}
      <h1 className="text-2xl font-semibold text-gray-800">
        Register for an account
      </h1>
      <RegisterForm onNext={handleNext} />
      <div>
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-1 font-bold">
          Login
        </Link> 
      </div>
    </div>
  )
}