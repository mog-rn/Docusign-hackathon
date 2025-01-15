"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import React, { useState } from "react";
import { HiOutlineArrowsExpand } from "react-icons/hi";

interface Contract {
  title: string;
  updated: string;
  status: string;
  type: "image" | "pdf";
  src: string;
}

const contractsData = [
  {
    category: "Employee Contracts",
    icon: "👔", // Replace with an appropriate employee icon if needed
    contracts: [
      {
        title: "John Doe Employment Contract",
        updated: "5 days ago",
        status: "Active",
        type: "pdf",
        src: "/example.pdf",
      },
      {
        title: "Jane Smith NDA",
        updated: "6 days ago",
        status: "Active",
        type: "image",
        src: "/contract-doc.jpg",
      },
      {
        title: "Robert Brown Termination Letter",
        updated: "2 weeks ago",
        status: "Completed",
        type: "pdf",
        src: "/example.pdf",
      },
    ],
  },
  {
    category: "Healthcare",
    icon: "💊", // Replace with an appropriate healthcare icon if needed
    contracts: [
      {
        title: "Prohaska, O'Conner and Hills",
        updated: "3 days ago",
        status: "Pending",
        type: "image",
        src: "/contract-doc.jpg",
      },
      {
        title: "Langworth - Ward",
        updated: "3 days ago",
        status: "Pending",
        type: "pdf",
        src: "/example.pdf",
      },
    ],
  },
  {
    category: "Banking",
    icon: "🏦", // Replace with an appropriate banking icon if needed
    contracts: [
      {
        title: "Prohaska, O'Conner and Hills",
        updated: "3 days ago",
        status: "Pending",
        type: "image",
        src: "/contract-doc.jpg",
      },
      {
        title: "Langworth - Ward",
        updated: "3 days ago",
        status: "Pending",
        type: "pdf",
        src: "/example.pdf",
      },
    ],
  },
];

export default function ContractsDashboard() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  return (
    <div className="h-screen overflow-y-auto px-6 py-4 bg-gray-50">
      <header className="mb-6 flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">My Contracts</h1>
          <p className="text-gray-600">23 contracts</p>
        </div>

        <div>
          <Button>Create New Contract</Button>
        </div>
      </header>

      {contractsData.map((category) => (
        <section key={category.category} className="mb-8">
          <h2 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <span className="mr-2">{category.icon}</span>
            {category.category} ({category.contracts.length})
          </h2>
          <div className="grid grid-flow-col auto-cols-[200px] gap-4 overflow-x-auto">
            {category.contracts.map((contract, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition h-[200px] w-[200px] flex flex-col justify-between"
              >
                <div className="relative mb-2 flex-grow">
                  {contract.type === "image" ? (
                    <Image
                      src={contract.src}
                      alt={contract.title}
                      width={180}
                      height={100}
                      className="rounded-md object-cover w-full h-[100px]"
                    />
                  ) : (
                    <div className="w-full h-[100px] bg-gray-200 flex items-center justify-center rounded-md">
                      <p className="text-sm text-gray-600">PDF Preview</p>
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 bg-white text-gray-800 hover:bg-gray-100 p-1 rounded-full shadow"
                        onClick={() => setSelectedContract(contract)}
                      >
                        <HiOutlineArrowsExpand />
                      </Button>
                    </DialogTrigger>
                    {selectedContract === contract && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{contract.title}</DialogTitle>
                        </DialogHeader>
                        {contract.type === "image" ? (
                          <Image
                            src={contract.src}
                            alt={contract.title}
                            width={600}
                            height={400}
                            className="rounded-md object-contain"
                          />
                        ) : (
                          <iframe
                            src={contract.src}
                            title={contract.title}
                            className="w-full h-96 rounded-md"
                          />
                        )}
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-800 truncate">{contract.title}</h3>
                  <p className="text-xs text-gray-500">Last update: {contract.updated}</p>
                  <span
                    className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded ${
                      contract.status === "Pending"
                        ? "bg-purple-100 text-purple-600"
                        : contract.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}