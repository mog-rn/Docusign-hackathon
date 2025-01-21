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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Contract, Counterparty } from "@/types/contracts";
import { BASE_URL } from "@/constants";

export default function ContractBuilderPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params.id;
  const [contract, setContract] = useState<Contract | null>(null);
  const [newCounterparty, setNewCounterparty] = useState<Counterparty>({
    party_name: "",
    party_type: "",
    email: "",
    isPrimary: false,
    contract: id || "",
  });
  const [caretPosition, setCaretPosition] = useState<number | null>(null);

  const fetchContract = useCallback(async () => {
    if (!id) {
      console.error("No contract ID provided");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/contracts/${id}/`, {
        headers: {
          Authorization: `Bearer ${document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1]}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch contract details");
      }

      const data = await response.json();

      // Fetch presigned download URL for the S3 file
      const downloadResponse = await fetch(
        `${BASE_URL}/contracts/presigned-download-url/?file_path=${data.file_path}`,
        {
          headers: {
            Authorization: `Bearer ${document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]}`,
          },
        }
      );

      if (!downloadResponse.ok) {
        throw new Error("Failed to fetch presigned download URL");
      }

      const downloadData = await downloadResponse.json();

      // Fetch the actual content from S3
      const s3Response = await fetch(downloadData.url);
      if (!s3Response.ok) {
        throw new Error("Failed to download file content");
      }

      const content = await s3Response.text();

      setContract({
        ...data,
        content: content || "No content available",
      });
    } catch (error) {
      console.error("Error fetching contract:", error);
    }
  }, [id]);

  const updateContract = async () => {
    if (!contract) return;

    try {
      // Upload the updated file content to S3
      const presignedResponse = await fetch(
        `${BASE_URL}/contracts/presigned-post-url/?file_path=${contract.file_path}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${document.cookie
              .split("; ")
              .find((row) => row.startsWith("authToken="))
              ?.split("=")[1]}`,
          },
        }
      );

      if (!presignedResponse.ok) {
        throw new Error("Failed to fetch presigned URL");
      }

      const { url, fields } = await presignedResponse.json();

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", new Blob([contract.content], { type: "text/plain" }));

      const s3Response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!s3Response.ok) {
        throw new Error("Failed to upload updated file to S3");
      }

      // Update the contract metadata
      const response = await fetch(`${BASE_URL}/contracts/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1]}`,
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

  const handleTextareaClick = (event: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = event.target as HTMLTextAreaElement;
    setCaretPosition(target.selectionStart);
  };

  const handleInsertCounterparty = (cp: Counterparty) => {
    if (!contract || caretPosition === null) return;

    const before = contract.content.slice(0, caretPosition);
    const after = contract.content.slice(caretPosition);
    const insertion = `**Counterparty Name:** ${cp.party_name}\n`;

    setContract({
      ...contract,
      content: before + insertion + after,
    });

    setCaretPosition(caretPosition + insertion.length); // Update caret position
  };

  const handleAddCounterparty = async () => {
    try {
      const response = await fetch(`${BASE_URL}/counterparties/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${document.cookie
            .split("; ")
            .find((row) => row.startsWith("authToken="))
            ?.split("=")[1]}`,
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

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

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
            setContract((prev) => (prev ? { ...prev, title: e.target.value } : prev))
          }
          placeholder="Contract Title"
          className="text-2xl font-semibold w-full"
        />
        <p className="text-gray-600">Edit the contract title and details</p>
      </div>
      <div className="flex gap-4">
        <Button onClick={updateContract}>Save Contract</Button>
      </div>
    </header>
  
    <div className="mb-4">
      <h2 className="text-lg font-medium">Counterparties</h2>
      <div className="flex flex-wrap gap-2">
        {contract.counterparties.map((cp, index) => (
          <Button
            key={index}
            className="bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm hover:bg-gray-300"
            onClick={() => handleInsertCounterparty(cp)}
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
              onChange={(e) => setNewCounterparty({ ...newCounterparty, party_name: e.target.value })}
            />
            <Input
              placeholder="Party Type"
              value={newCounterparty.party_type}
              onChange={(e) => setNewCounterparty({ ...newCounterparty, party_type: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={newCounterparty.email}
              onChange={(e) => setNewCounterparty({ ...newCounterparty, email: e.target.value })}
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
  
    <div className="flex-1 mb-5">
      <textarea
        value={contract.content}
        onClick={handleTextareaClick}
        onChange={(e) =>
          setContract((prev) => (prev ? { ...prev, content: e.target.value } : prev))
        }
        className="w-full h-full p-4 border rounded-md"
        placeholder="Edit contract content..."
      />
    </div>
  </div> 
  );
}