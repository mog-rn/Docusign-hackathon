"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ContractBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const [contract, setContract] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // State to control dialog visibility
  const [contractId, setContractId] = useState<string | null>(null); // Store the unwrapped contract ID
  const router = useRouter();

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setContractId(resolvedParams.id);
    };

    unwrapParams();
  }, [params]);

  // Dummy data to simulate contract data
  useEffect(() => {
    if (contractId) {
      setContract({
        id: contractId,
        title: "Sample Contract",
        clientName: "John Doe",
        isPublic: false,
        sections: [
          {
            id: 1,
            title: "1. Introduction",
            content: "This section covers the introduction of the contract...",
          },
          {
            id: 2,
            title: "2. Scope of Work",
            content: "This section outlines the scope of work...",
          },
        ],
      });
    }
  }, [contractId]);

  if (!contract) {
    return <div>Loading...</div>;
  }

  const handleSectionChange = (sectionId: number, field: string, value: string) => {
    const updatedSections = contract.sections.map((section: any) =>
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

          {/* Preview Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsPreviewOpen(true)}>Preview</Button>
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
                  {contract.sections.map((section: any) => (
                    <div key={section.id} className="mb-4">
                      <h3 className="text-md font-medium text-gray-800">{section.title}</h3>
                      <p className="text-sm text-gray-600">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
            </DialogContent>
          </Dialog>

          <Button variant="outline">Request Changes</Button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="col-span-1 bg-white p-4 rounded-lg shadow">
          <Button className="w-full mb-4">New Contract</Button>
          <ul className="space-y-2">
            {contract.sections.map((section: any) => (
              <li key={section.id} className="text-sm text-gray-700">
                {section.title}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="col-span-3 bg-white p-6 rounded-lg shadow">
          {contract.sections.map((section: any) => (
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
                        const updatedSections = contract.sections.filter((s: any) => s.id !== section.id);
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