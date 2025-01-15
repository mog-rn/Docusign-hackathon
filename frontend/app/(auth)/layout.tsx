'use client';
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { CiSearch } from "react-icons/ci";
import { FiCommand } from "react-icons/fi";
import { MdSpaceDashboard } from "react-icons/md";
import { HiMiniEllipsisHorizontal } from "react-icons/hi2";
import { IoIosSettings } from "react-icons/io";
import { IoMdAnalytics } from "react-icons/io";
import { BASE_URL } from "@/constants";

const links = [
  { id: 1, name: "Dashboard", icon: MdSpaceDashboard, href: "/dashboard" },
  { id: 2, name: "Analytics", icon: IoMdAnalytics, href: "/analytics" },
  { id: 3, name: "Settings", icon: IoIosSettings, href: "/settings" },
];

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [selectedLink, setSelectedLink] = useState<number | null>(1);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);


  const handleLinkClick = (id: number) => {
    setSelectedLink(id);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("authToken="))
          ?.split("=")[1];

        if (!token) {
          console.error("No auth token found");
          return;
        }

        const response = await fetch(`${BASE_URL}/auth/profile/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserName(`${data.first_name} ${data.last_name}`);
          setUserEmail(data.email);
        } else {
          console.error("Failed to fetch user profile:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);


  return (
    <main className="bg-[#121212] h-screen overflow-hidden w-screen flex flex-col md:flex-row p-[12px]">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex bg-[#121212] flex-col justify-between h-full w-[288px] pr-[20px] pt-[20px]`}
      >
        <div className="flex flex-col gap-[16px]">
          {/* Org Details */}
          <div className="bg-[#ffffff]/10 p-[12px] rounded-[1rem] max-w-[248px] h-[62px]">
            <div className="flex gap-[12px] items-center">
              <div className="bg-red-500 relative w-[36px] h-[36px] rounded-[10px] p-[6px]">
                <Image src="/vercel.svg" width={24} height={24} alt="logo" />
              </div>

              <div className="flex-1 flex items-center justify-between">
                <div className="text-white">
                  <h3 className="text-[14px] font-[600] p-0 m-0">Robin Store</h3>
                  <p className="text-[12px] text-white/80">Free plan</p>
                </div>

                <button className="w-[20px] h-[20px] flex items-center justify-center">
                  <Image src="/org-switcher.svg" width={6.25} height={11.25} alt="logo" />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-[#ffffff]/10 rounded-[10px] max-w-[248px] h-[40px] flex items-center gap-[12px] p-[8px]">
            <CiSearch color="white" size={20} />
            <div className="flex flex-1 items-center justify-center">
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent flex-1 w-full h-full text-white/80 outline-none text-[14px]"
              />
              <div className="bg-[#ffffff]/10 w-[44px] px-[8px] h-[24px] rounded-[8px] flex items-center justify-center gap-[4px]">
                <FiCommand color="white" size={24} className="opacity-80" />
                <span className="text-white/80 text-[14px]">K</span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex flex-col gap-[4px]">
            {links.map((link) => (
              <div
                key={link.id}
                className={
                  selectedLink === link.id
                    ? "bg-[#ffffff]/10 rounded-[8px]"
                    : "flex flex-col rounded-[8px]"
                }
              >
                <button
                  className={`w-[248px] rounded-[8px] h-[44px] flex items-center gap-[12px] p-[12px] ${
                    selectedLink === link.id ? "" : "opacity-80"
                  }`}
                  onClick={() => handleLinkClick(link.id)}
                >
                  <link.icon
                    color="white"
                    size={24}
                    className={selectedLink === link.id ? "" : "opacity-80"}
                  />
                  <span
                    className={`text-[14px] ${
                      selectedLink === link.id
                        ? "text-white font-semibold"
                        : "text-white/80"
                    }`}
                  >
                    {link.name}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account details */}
        <div className="flex items-center gap-[12px] pb-[20px]">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex items-center flex-1 justify-between">
            <div>
              <h3 className="text-white text-[14px] font-[600]">{userName}</h3>
              <p className="text-white/80 text-[12px]">{userEmail}</p>
            </div>

            {/* ellipsis icon */}
            <button className="w-[24px] h-[24px] flex items-center justify-center">
              <HiMiniEllipsisHorizontal color="white" size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navbar */}
      <div className="bg-[#121212] md:hidden flex justify-around items-center py-2 fixed bottom-0 left-0 w-full">
        {links.map((link) => (
          <button key={link.id} onClick={() => handleLinkClick(link.id)}>
            <link.icon
              color={selectedLink === link.id ? "white" : "gray"}
              size={24}
            />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white w-full h-full rounded-[24px] p-[32px]">
        {children}
      </div>
    </main>
  );
}