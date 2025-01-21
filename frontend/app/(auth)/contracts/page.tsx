"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { HiOutlineArrowsExpand } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { Contract } from "@/types/contracts";
import { BASE_URL } from "@/constants";

export default function ContractsDashboard() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/contracts/`, {
          headers: {
            Authorization: `Bearer ${document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contracts");
        }

        const data: Contract[] = await response.json();
        setContracts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch contracts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const handleCreateContract = async (useTemplate: boolean) => {
    setDialogOpen(false);

    try {
      let filePath = "";

      if (useTemplate) {
        // Fetch the cached template from the backend
        const templateContent = await fetchTemplateFromBackend();

        // Fetch pre-signed URL for S3 upload
        const presignedResponse = await fetch(`${BASE_URL}/contracts/presigned-post-url/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]}`,
          },
        });

        if (!presignedResponse.ok) {
          throw new Error("Failed to fetch pre-signed URL");
        }

        const presignedData = await presignedResponse.json();
        const { url, fields } = presignedData;

        // Upload the template to S3
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append("file", new Blob([templateContent], { type: "application/pdf" }));

        const s3Response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!s3Response.ok) {
          throw new Error("Failed to upload template to S3");
        }

        filePath = fields.key; // File path is the `key` from pre-signed URL
      }

      // Create the contract with the file path
      const response = await fetch(`${BASE_URL}/contracts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1]}`,
        },
        body: JSON.stringify({
          title: useTemplate ? "Vendor Agreement between A and B" : "New Contract",
          contract_type: "vendor agreement",
          stage: "draft",
          file_path: filePath,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create contract");
      }

      const newContract: Contract = await response.json();
      router.push(`/contracts/${newContract.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create contract. Please try again later.");
    }
  };

  const fetchTemplateFromBackend = async (): Promise<string> => {
    try {
      const response = await fetch("/api/generate-template", { method: "POST" });
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      return data.template || "Default Template Content";
    } catch (error) {
      console.error("Error fetching template:", error);
      return "Default Template Content";
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading contracts...</div>;
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto px-6 py-4 bg-gray-50">
      <header className="mb-6 flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">My Contracts</h1>
          <p className="text-gray-600">{contracts.length} contracts</p>
        </div>

        <div>
          <Button onClick={() => setDialogOpen(true)}>Create New Contract</Button>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Contracts</h2>
        <div className="grid grid-flow-col auto-cols-[200px] gap-4 overflow-x-auto">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition h-[200px] w-[200px] flex flex-col justify-between cursor-pointer"
              onClick={() => router.push(`/contracts/${contract.id}`)}
            >
              <div className="relative mb-2 flex-grow">
                {contract.file_path.endsWith(".jpg") || contract.file_path.endsWith(".png") ? (
                  <Image
                    src={contract.file_path}
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 bg-white text-gray-800 hover:bg-gray-100 p-1 rounded-full shadow"
                >
                  <HiOutlineArrowsExpand />
                </Button>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800 truncate">{contract.title}</h3>
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(contract.last_modified_at).toLocaleDateString()}
                </p>
                <span
                  className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded ${
                    contract.stage === "draft"
                      ? "bg-yellow-100 text-yellow-600"
                      : contract.stage === "active"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {contract.stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Contract Type</DialogTitle>
          </DialogHeader>
          <p>Do you want to start from scratch or use a template?</p>
          <DialogFooter>
            <Button onClick={() => handleCreateContract(false)}>Start from Scratch</Button>
            <Button onClick={() => handleCreateContract(true)} variant="outline">
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}