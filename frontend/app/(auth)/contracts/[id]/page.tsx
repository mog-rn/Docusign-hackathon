"use client";

import React, { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ContractSection = {
  id: number;
  title: string;
  content: string;
};

type Contract = {
  id: string;
  title: string;
  clientName: string;
  isPublic: boolean;
  sections: ContractSection[];
};

export default function ContractBuilderPage() {
  const [contract, setContract] = useState<Contract | null>(null);
  const params = { id: "1" };

  useEffect(() => {
    // Simulate fetching contract data
    const fetchContract = async () => {
      const fetchedContract = {
        id: params.id,
        title: "Sample Contract",
        clientName: "John Doe",
        isPublic: false,
        sections: [
          { id: 1, title: "1. Introduction", content: "This section covers the introduction of the contract..." },
          { id: 2, title: "2. Scope of Work", content: "This section outlines the scope of work..." },
        ],
      };
      setContract(fetchedContract);
    };

    fetchContract();
  }, [params.id]);

  if (!contract) {
    return <div>Loading...</div>;
  }

  const handleSectionChange = (sectionId: number, field: string, value: string) => {
    const updatedSections = contract.sections.map((section) =>
      section.id === sectionId ? { ...section, [field]: value } : section
    );
    setContract({ ...contract, sections: updatedSections });
  };

  const addSection = () => {
    const newSection = {
      id: contract.sections.length + 1,
      title: `Section ${contract.sections.length + 1}`,
      content: "",
    };
    setContract({ ...contract, sections: [...contract.sections, newSection] });
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contracts">Contracts</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Contract Builder</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex justify-between items-center my-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{contract.title || "Contract Builder"}</h1>
          <p className="text-gray-600">Manage contract details for {contract.clientName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-800">Public</span>
            <Switch
              checked={contract.isPublic}
              onCheckedChange={(checked) => setContract({ ...contract, isPublic: checked })}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Preview</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Preview Contract</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">{contract.title}</h2>
                <p className="text-sm text-gray-600">Client: {contract.clientName}</p>
                <p className="text-sm text-gray-600">Public: {contract.isPublic ? "Yes" : "No"}</p>
                <div className="border-t border-gray-200 pt-4">
                  {contract.sections.map((section) => (
                    <div key={section.id} className="mb-4">
                      <h3 className="text-md font-medium text-gray-800">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6">
        <aside className="col-span-1 bg-white p-4 rounded-lg shadow">
          <Button className="w-full mb-4">New Contract</Button>
          <ul className="space-y-2">
            {contract.sections.map((section) => (
              <li key={section.id} className="text-sm text-gray-700">
                {section.title}
              </li>
            ))}
          </ul>
        </aside>

        <main className="col-span-3 bg-white p-6 rounded-lg shadow">
          {contract.sections.map((section) => (
            <div key={section.id} className="mb-8 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Input
                  value={section.title}
                  className="w-3/4"
                  onChange={(e) => handleSectionChange(section.id, "title", e.target.value)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon">⋮</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        const duplicatedSection = { ...section, id: contract.sections.length + 1 };
                        setContract({
                          ...contract,
                          sections: [...contract.sections, duplicatedSection],
                        });
                      }}
                    >
                      Duplicate Section
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const updatedSections = contract.sections.filter((s) => s.id !== section.id);
                        setContract({ ...contract, sections: updatedSections });
                      }}
                    >
                      Delete Section
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                value={section.content}
                rows={6}
                placeholder="Enter section content here..."
                onChange={(e) => handleSectionChange(section.id, "content", e.target.value)}
              />
            </div>
          ))}
          <Button variant="outline" onClick={addSection}>
            Add Section
          </Button>
        </main>
      </div>
    </div>
  );
}