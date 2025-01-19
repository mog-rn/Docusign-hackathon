'use client';
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define the steps with their associated route paths
  const steps = [
    { id: 1, label: "Sign up your account", route: "/register" },
    { id: 2, label: "Setup your organization", route: "/register/organization" },
    { id: 3, label: "Set up your profile", route: "/register/profile" },
  ];

  // Define page-specific messages
  const pageMessages = {
    "/register": {
      title: "Get started with us.",
      description: "Complete these easy steps to create your account.",
    },
    "/login": {
      title: "Welcome back!",
      description: "Log in to continue to your dashboard.",
    },
  };

  // Safely access pageMessages
  const { title, description } =
    pageMessages[pathname as keyof typeof pageMessages] || pageMessages["/register"];

  return (
    <main className="h-screen overflow-hidden w-screen flex">
      {/* Left Section */}
      <div className="w-[50%] h-full p-[12px] text-white">
        <div className="relative w-full h-full flex flex-col gap-[40px] justify-end p-[56px] rounded-[2rem] bg-gradient-to-br from-[#10412F] to-black ">
          {/* Background Image */}
          <div className="absolute top-0 left-0 w-full h-full z-0 rounded-[2rem]">
            <Image
              src="/auth-back.svg"
              fill
              alt="Auth background"
              className="rounded-[2rem]"
            />
          </div>

          {/* Header */}
          <div className="z-10">
            <h1 className="text-2xl font-semibold text-white z-10">
              {title}
            </h1>
            <p className="text-white z-10">{description}</p>
          </div>

          {/* Steps Section */}
          {pathname !== "/login" && ( // Hide steps on login page
            <div className="h-[144px] z-10 flex items-center gap-[8px]">
              {steps.map((step) => {
                const isActive = pathname === step.route; // Check if the step is active
                return (
                  <div
                    key={step.id}
                    className={`w-[164px] h-full p-[24px] rounded-[1rem] flex flex-col justify-between ${
                      isActive ? "bg-white" : "bg-white/10"
                    }`}
                  >
                    <p
                      className={`flex items-center h-[24px] w-[24px] text-[14px] rounded-full justify-center ${
                        isActive ? "bg-black text-white" : "bg-white/10 text-white"
                      }`}
                    >
                      {step.id}
                    </p>
                    <p className={`${isActive ? "text-black" : "text-white"}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="px-[96px] py-[140px] w-[50%] h-full bg-white">
        {children}
      </div>
    </main>
  );
}