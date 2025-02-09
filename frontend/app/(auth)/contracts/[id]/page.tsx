"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Contract, Counterparty } from "@/types/contracts";
import { BASE_URL } from "@/constants";

export default function ContractBuilderPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params.id;

  const [contract, setContract] = useState<Contract | null>(null);

  // We’ll call it pdfBlobUrl for consistency, but we’re treating *all* files as PDFs
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  // Store the raw blob in case you want to log it or do something else with it.
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);

  const [newCounterparty, setNewCounterparty] = useState<Counterparty>({
    party_name: "",
    party_type: "",
    email: "",
    isPrimary: false,
    contract: id || "",
  });

  // ---------------------------------------------
  // Fetch contract details (and file) from the API
  // ---------------------------------------------
  const fetchContract = useCallback(async () => {
    if (!id) {
      console.error("No contract ID provided");
      return;
    }

    try {
      // 1) Fetch contract metadata
      const response = await fetch(`${BASE_URL}/contracts/${id}/`, {
        headers: {
          Authorization: `Bearer ${
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]
          }`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch contract details");
      }

      const data = await response.json();

      // 2) Get the presigned download URL
      const downloadResponse = await fetch(
        `${BASE_URL}/contracts/presigned-download-url/?file_path=${data.file_path}`,
        {
          headers: {
            Authorization: `Bearer ${
              document.cookie
                .split("; ")
                .find((row) => row.startsWith("authToken="))
                ?.split("=")[1]
            }`,
          },
        }
      );

      if (!downloadResponse.ok) {
        throw new Error("Failed to fetch presigned download URL");
      }

      const downloadData = await downloadResponse.json();

      // 3) Fetch the file as a Blob (treat all as PDF)
      const s3Response = await fetch(downloadData.url);
      if (!s3Response.ok) {
        throw new Error("Failed to download file content");
      }

      const blob = await s3Response.blob();
      // Log the blob so you see what file was fetched
      console.log("Fetched file blob (treating as PDF):", blob);

      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
      setFileBlob(blob);

      // Store the rest of the contract info
      setContract({
        ...data,
        content: "",
      });
    } catch (error) {
      console.error("Error fetching contract:", error);
    }
  }, [id]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Initial load
  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  // ------------------------------
  // Update contract metadata only
  // ------------------------------
  const updateContract = async () => {
    if (!contract) return;

    try {
      // We’re not re-uploading file contents here since everything is treated as a PDF
      // If you need to re-upload the PDF, you’d do that with a presigned POST (similar to your old code).

      // Just update contract metadata (title, etc.)
      const response = await fetch(`${BASE_URL}/contracts/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]
          }`,
        },
        body: JSON.stringify(contract),
      });

      if (!response.ok) {
        throw new Error("Failed to update contract metadata");
      }

      const updatedContract = await response.json();
      console.log("Contract updated:", updatedContract);
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  // ------------------------------
  // Counterparty management
  // ------------------------------
  const handleAddCounterparty = async () => {
    try {
      const response = await fetch(`${BASE_URL}/counterparties/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]
          }`,
        },
        body: JSON.stringify(newCounterparty),
      });

      if (!response.ok) {
        throw new Error("Failed to add counterparty");
      }

      const newCp = await response.json();

      setContract((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counterparties: [...prev.counterparties, newCp],
        };
      });

      setNewCounterparty({
        party_name: "",
        party_type: "",
        email: "",
        isPrimary: false,
        contract: id || "",
      });

      console.log("Counterparty added:", newCp);
    } catch (error) {
      console.error("Error adding counterparty:", error);
    }
  };

  // Example of a button to log the blob if you want
  const handleLogCurrentFile = () => {
    if (fileBlob) {
      console.log("Currently loaded file (treated as PDF) blob:", fileBlob);
    } else {
      console.log("No file blob currently loaded.");
    }
  };

  if (!contract) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen bg-gray-50 p-6 flex flex-col">
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
            <BreadcrumbPage>Edit Contract</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="my-6 flex justify-between items-center">
        <div className="w-96">
          <Input
            value={contract.title}
            onChange={(e) =>
              setContract((prev) =>
                prev ? { ...prev, title: e.target.value } : prev
              )
            }
            placeholder="Contract Title"
            className="text-2xl font-semibold w-full"
          />
          <p className="text-gray-600">Edit the contract title and details</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleLogCurrentFile}>
            Log Current File
          </Button>
          <Button onClick={updateContract}>Save Contract</Button>
        </div>
      </header>

      <div className="mb-4">
        <h2 className="text-lg font-medium">Counterparties</h2>
        <div className="flex flex-wrap gap-2">
          {/* If you still want to do something with counterparties,
              you can place your logic here. */}
          {contract.counterparties.map((cp, index) => (
            <Button
              key={index}
              className="bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm hover:bg-gray-300"
              // No insertion logic needed now, because we're not editing text
              onClick={() => console.log("Clicked a counterparty:", cp)}
            >
              {cp.party_name}
            </Button>
          ))}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">Add Counterparty</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Counterparty</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Party Name"
                value={newCounterparty.party_name}
                onChange={(e) =>
                  setNewCounterparty({
                    ...newCounterparty,
                    party_name: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Party Type"
                value={newCounterparty.party_type}
                onChange={(e) =>
                  setNewCounterparty({
                    ...newCounterparty,
                    party_type: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Email"
                value={newCounterparty.email}
                onChange={(e) =>
                  setNewCounterparty({
                    ...newCounterparty,
                    email: e.target.value,
                  })
                }
              />
              <Switch
                checked={newCounterparty.isPrimary}
                onCheckedChange={(checked) =>
                  setNewCounterparty({ ...newCounterparty, isPrimary: checked })
                }
              />
              <Button onClick={handleAddCounterparty}>Save Counterparty</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Always display the file in an iframe (treating it as PDF). */}
      <div className="flex-1 mb-5">
        {pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "600px" }}
          />
        ) : (
          <div>No file loaded yet.</div>
        )}
      </div>
    </div>
  );
}