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
import { Document, Packer, Paragraph } from "docx";
import mammoth from "mammoth";

export default function ContractBuilderPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params.id;

  const [contract, setContract] = useState<Contract | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);

  const [newCounterparty, setNewCounterparty] = useState<Counterparty>({
    party_name: "",
    party_type: "",
    email: "",
    isPrimary: false,
    contract: id || "",
  });

  // New state to allow entering recipient emails (comma-separated)
  const [recipientEmails, setRecipientEmails] = useState("");

  // ---------------------------------------------
  // Fetch contract details (and file) from the API
  // ---------------------------------------------
  const fetchContract = useCallback(async () => {
    if (!id) {
      console.error("No contract ID provided");
      return;
    }
  
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
  
      const response = await fetch(`${BASE_URL}/contracts/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch contract details");
      }
  
      const data = await response.json();
  
      // Fetch the presigned download URL
      const downloadResponse = await fetch(
        `${BASE_URL}/contracts/presigned-download-url/?file_path=${data.file_path}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!downloadResponse.ok) {
        throw new Error("Failed to fetch presigned download URL");
      }
  
      const downloadData = await downloadResponse.json();
  
      // Fetch the file as a Blob
      const s3Response = await fetch(downloadData.url);
      if (!s3Response.ok) {
        throw new Error("Failed to download file content");
      }
  
      const blob = await s3Response.blob();
      console.log("Fetched file blob:", blob);
  
      setFileBlob(blob);
      setContract({ ...data, content: "" });
  
      // 🔹 Fix MIME Type Detection
      let fileType = blob.type;
      if (!fileType || fileType === "docx") {
        console.warn("Invalid or missing MIME type, defaulting to DOCX.");
        fileType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
  
      if (fileType === "application/pdf") {
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        renderDocx(blob);
      } else {
        console.warn("Unsupported file type:", fileType);
      }
    } catch (error) {
      console.error("Error fetching contract:", error);
    }
  }, [id]); 

  // Inserts a signature placeholder into the DOCX text area
  const insertPlaceholder = () => {
    const textarea = document.getElementById("editable-docx") as HTMLTextAreaElement;
    if (!textarea) {
      console.error("Editable DOCX container not found");
      return;
    }
    const placeholderText = "[[sign_here_0]]";
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + placeholderText + text.substring(end);
    textarea.value = newText;
  };

  const renderDocx = async (docxBlob: Blob) => {
    try {
      const arrayBuffer = await docxBlob.arrayBuffer();
      const container = document.getElementById("docx-container");
  
      if (!container) {
        console.error("DOCX container not found");
        return;
      }
  
      container.innerHTML = ""; // Clear previous content
  
      // 🔹 Convert DOCX to plain text to preserve structure
      const result = await mammoth.extractRawText({ arrayBuffer });
  
      // Render the editor in a container with a maximum height of 100vh,
      // and align buttons at the top.
      container.innerHTML = `
        <div class="flex items-center justify-start gap-2 mb-2">
          <button id="insert-placeholder-btn" class="bg-green-500 text-white py-2 px-4 rounded">
            Insert Signature Placeholder
          </button>
          <button id="save-docx-btn" class="bg-blue-500 text-white py-2 px-4 rounded">
            Save Edited DOCX
          </button>
        </div>
        <textarea id="editable-docx" class="border p-4 rounded bg-white w-full h-full max-h-[calc(100vh-80px)] overflow-auto">
${result.value}</textarea>
      `;
  
      // Wait for DOM update, then attach event listeners
      setTimeout(() => {
        const saveButton = document.getElementById("save-docx-btn");
        if (saveButton) {
          saveButton.addEventListener("click", saveEditedDocx);
        }
        const placeholderBtn = document.getElementById("insert-placeholder-btn");
        if (placeholderBtn) {
          placeholderBtn.addEventListener("click", insertPlaceholder);
        }
      }, 100);
  
    } catch (error) {
      console.error("Error rendering DOCX:", error);
    }
  };

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
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
  
      const response = await fetch(`${BASE_URL}/contracts/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
  
      const response = await fetch(`${BASE_URL}/counterparties/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

  // ------------------------------
  // E-Signature: Create Sender (runs once)
  // ------------------------------
  const handleCreateSender = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
  
      const response = await fetch("http://localhost:8000/api/esignature/create-sender/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contract_id: id,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to create e-signature sender");
      }
  
      const data = await response.json();
      console.log("E-signature sender created:", data);
    } catch (error) {
      console.error("Error creating e-signature sender:", error);
    }
  };

  // ------------------------------
  // E-Signature: Send Contract for Signing
  // ------------------------------
  const handleSendContract = async () => {
    if (!contract) {
      console.error("No contract available");
      return;
    }
    
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];
  
    if (!token) {
      console.error("No bearer token found");
      return;
    }
  
    // Determine document format based on file MIME type
    const documentFormat =
      fileBlob && fileBlob.type === "application/pdf" ? "pdf" : "docx";
  
    // Build recipients from input if provided; otherwise fallback to counterparties
    const inputEmails = recipientEmails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email);
  
    const recipients =
      inputEmails.length > 0
        ? inputEmails.map((email, idx) => ({
            recipient_type: "signer",
            key: `recipient_${idx}`,
            name: email,
            email: email,
            ceremony_creation: "automatic",
            delivery_type: "email",
          }))
        : contract.counterparties.map((cp, idx) => ({
            recipient_type: "signer",
            key: `recipient_${idx}`,
            name: cp.party_name,
            email: cp.email,
            ceremony_creation: "automatic",
            delivery_type: "email",
          }));
  
    const places = recipients.map((recipient, idx) => {
      if (documentFormat === "pdf") {
        return {
          place_type: "signature",
          key: `sign_here_${idx}`,
          recipient_key: recipient.key,
          height: 60,
          fixed_position: { page: 1, x: 100, y: 200 }, // adjust coordinates as needed
        };
      } else {
        return {
          place_type: "signature",
          key: `sign_here_${idx}`,
          recipient_key: recipient.key,
          height: 60,
        };
      }
    });
  
    // Build the complete envelope payload
    const envelopePayload = {
      contract_id: id,
      document_format: documentFormat,
      routing: "sequential",
      recipients: recipients,
      places: places,
    };
  
    try {
      const response = await fetch("http://localhost:8000/api/esignature/send-contract/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(envelopePayload),
      });
  
      if (!response.ok) {
        throw new Error("Failed to send contract for electronic signing");
      }
  
      const data = await response.json();
      console.log("Contract sent for electronic signing:", data);
      // Optionally, display a success message to the user here
    } catch (error) {
      console.error("Error sending contract for electronic signing:", error);
    }
  };
  
  // Example button to log the file blob
  const handleLogCurrentFile = () => {
    if (fileBlob) {
      console.log("Currently loaded file (treated as PDF) blob:", fileBlob);
    } else {
      console.log("No file blob currently loaded.");
    }
  };
  
  const saveEditedDocx = async () => {
    const textarea = document.getElementById("editable-docx") as HTMLTextAreaElement;
    if (!textarea) {
      console.error("Editable DOCX container not found");
      return;
    }
  
    const editedText = textarea.value;
  
    // Convert back to structured DOCX format
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: editedText.split("\n").map((line) => new Paragraph(line)),
        },
      ],
    });
  
    const docxBlob = await Packer.toBlob(doc);
  
    try {
      if (!contract?.file_path) {
        throw new Error("No existing file path found for this contract.");
      }
  
      await uploadEditedDocxToS3(docxBlob, contract.file_path);
      console.log("Edited DOCX file successfully uploaded and replaced!");
    } catch (error) {
      console.error("Error uploading edited DOCX:", error);
    }
  };
  
  const uploadEditedDocxToS3 = async (fileBlob: Blob, existingFilePath: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
  
      if (!token) {
        throw new Error("User authentication token missing");
      }
  
      const presignedRes = await fetch(
        `${BASE_URL}/contracts/presigned-post-url/?file_type=docx&file_path=${encodeURIComponent(existingFilePath)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!presignedRes.ok) {
        throw new Error("Failed to get S3 upload URL");
      }
  
      const { url, fields } = await presignedRes.json();
  
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", fileBlob);
  
      const uploadRes = await fetch(url, {
        method: "POST",
        body: formData,
      });
  
      if (!uploadRes.ok) {
        throw new Error("S3 upload failed");
      }
  
      console.log("Edited DOCX file uploaded successfully!");
  
    } catch (error) {
      console.error("Error uploading edited DOCX to S3:", error);
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
          {contract.counterparties.map((cp, index) => (
            <Button
              key={index}
              className="bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm hover:bg-gray-300"
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
  
      {/* E-Signature Sender Dialog (runs once) */}
      <div className="mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">Register for E-Signature</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register for E-Signature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Click the button below to register as the sender for e-signature.
              </p>
              <Button onClick={handleCreateSender}>Send Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  
      {/* E-Signature: Send Contract for Signing */}
      <div className="mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4">Send Contract for E-Signature</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Contract for Electronic Signing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Enter recipient email(s) (comma separated) if not using counterparty emails:
              </p>
              <Input
                placeholder="e.g., alice@example.com, bob@example.com"
                value={recipientEmails}
                onChange={(e) => setRecipientEmails(e.target.value)}
              />
              <p>
                Click below to prepare and send your contract for electronic signing.
              </p>
              <Button onClick={handleSendContract}>Send Contract</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  
      {/* Document view */}
      <div className="flex-1 mb-5 overflow-auto" style={{ maxHeight: "100vh" }}>
        {pdfBlobUrl ? (
          <iframe
            src={pdfBlobUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "600px" }}
          />
        ) : (
          <div id="docx-container" className="p-4 bg-white shadow-md rounded-lg h-full">
            <p>Loading DOCX content...</p>
          </div>
        )}
      </div>
    </div>
  );
}