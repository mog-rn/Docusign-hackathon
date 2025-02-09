"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { HiOutlineArrowsExpand } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/constants";
import { CreateContractForm } from "@/components/forms/CreateContractForm";
import { Contract } from "@/types/contracts";

export default function ContractsDashboard() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createFormOpen, setCreateFormOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<"pdf" | "image" | "docx" | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("authToken="))
          ?.split("=")[1];

        const response = await fetch(`${BASE_URL}/contracts/`, {
          headers: {
            Authorization: `Bearer ${token}`,
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

  const handleContractCreated = (contract: Contract) => {
    setCreateFormOpen(false);
    setContracts((prev) => [...prev, contract]);
    router.push(`/contracts/${contract.id}`);
  };

  const handleContractCreateCancel = () => {
    setCreateFormOpen(false);
  };

  const handleUploadToS3 = async (blob: Blob, contractId: string) => {
    try {
      const fileType = blob.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "docx" : "pdf";
      const fileName = fileType === "docx" ? "contract.docx" : "contract.pdf";
      const file = new File([blob], fileName, { type: blob.type });

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      const presignedRes = await fetch(
        `${BASE_URL}/contracts/upload-url?contract_id=${contractId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filename: file.name, filetype: file.type }),
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
      formData.append("file", file);

      const uploadRes = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("S3 upload failed");
      }

      console.log("Upload successful");
    } catch (error) {
      console.error("Error uploading file to S3:", error);
    }
  };

  const handlePreviewClick = async (contract: Contract) => {
    if (!contract.file_path) {
      setError("No file to preview.");
      return;
    }

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      const res = await fetch(
        `${BASE_URL}/contracts/presigned-download-url/?file_path=${encodeURIComponent(
          contract.file_path
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch presigned download URL");
      }

      const data = await res.json();
      const fileResponse = await fetch(data.url);
      const blob = await fileResponse.blob();

      console.log("Fetched file blob:", blob);

      const extension = blob.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "docx" : "pdf";
      setPreviewFileType(extension);

      await handleUploadToS3(blob, contract.id);

      setPreviewUrl(data.url);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Preview error:", error);
      setError("Failed to load file preview.");
    }
  }; 

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading contracts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="h-screen overflow-y-auto px-6 py-4 bg-gray-50">
        {/* HEADER */}
        <header className="mb-6 flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">My Contracts</h1>
            <p className="text-gray-600">{contracts.length} contracts</p>
          </div>

          <div>
            <Button onClick={() => setCreateFormOpen(true)}>
              Create New Contract
            </Button>
          </div>
        </header>

        {/* CONTRACTS LIST */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contracts</h2>
          <div className="grid grid-flow-col auto-cols-[200px] gap-4 overflow-x-auto">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition h-[200px] w-[200px] flex flex-col justify-between"
              >
                <div className="relative mb-2 flex-grow">
                  {contract.file_path.endsWith(".jpg") ||
                  contract.file_path.endsWith(".png") ? (
                    <Image
                      src={contract.file_path}
                      alt={contract.title}
                      width={180}
                      height={100}
                      className="rounded-md object-cover w-full h-[100px] cursor-pointer"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    />
                  ) : contract.file_path.endsWith(".pdf") || contract.file_path.endsWith(".docx") ? (
                    <div
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                      className="w-full h-[100px] bg-gray-200 flex items-center justify-center rounded-md cursor-pointer"
                    >
                      <p className="text-sm text-gray-600">
                        {contract.file_path.endsWith(".pdf") ? "PDF Document" : "DOCX Document"}
                      </p>
                    </div>
                  ) : (
                    <div
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                      className="w-full h-[100px] bg-gray-200 flex items-center justify-center rounded-md cursor-pointer"
                    >
                      <p className="text-sm text-gray-600">
                        {contract.file_path ? "Unsupported file" : "No file"}
                      </p>
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 bg-white text-gray-800 hover:bg-gray-100 p-1 rounded-full shadow"
                    onClick={() => handlePreviewClick(contract)}
                  >
                    <HiOutlineArrowsExpand />
                  </Button>
                </div>
                <div>
                  <h3
                    className="text-sm font-medium text-gray-800 truncate cursor-pointer"
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                  >
                    {contract.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Last updated: {" "}
                    {new Date(contract.last_modified_at).toLocaleDateString()}
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
      </div>

      <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Contract</DialogTitle>
          </DialogHeader>

          <CreateContractForm
            onSuccess={handleContractCreated}
            onCancel={handleContractCreateCancel}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewUrl && previewFileType === "pdf" ? (
              <iframe
                src={previewUrl}
                className="w-full h-[600px]"
                title="PDF Preview"
              />
            ) : previewUrl && previewFileType === "image" ? (
              <Image
                src={previewUrl}
                alt="Image preview"
                className="max-w-full max-h-[600px] object-contain"
              />
            ) : previewUrl && previewFileType === "docx" ? (
              <p className="text-gray-600">DOCX file preview is not supported. Download to view.</p>
            ) : (
              <p>No preview available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
