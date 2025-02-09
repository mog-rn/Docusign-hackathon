'use client';

import { ProfileSetupForm } from "@/components/forms/ProfileSetupForm";

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-[56px]">
      <h1 className="text-2xl font-semibold text-gray-800">
        Set up your profile
      </h1>
      <ProfileSetupForm />
    </div>
  );
}