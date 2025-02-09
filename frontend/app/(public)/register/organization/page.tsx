'use client';

import { CreateOrganizationForm } from "@/components/forms/CreateOrganizationForm";
import { useRouter } from "next/navigation";

export default function OrganizationPage() {
  const router = useRouter();

  const handleNextStep = () => {
    router.push("/register/profile");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full gap-[56px]">
      <h1 className="text-2xl font-semibold text-gray-800">
        Setup your organization
      </h1>
      <CreateOrganizationForm onNext={handleNextStep} />
    </div>
  );
}