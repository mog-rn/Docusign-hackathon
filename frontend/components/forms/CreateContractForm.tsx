"use client";

import { BASE_URL } from "@/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

import { Button } from "../ui/button";
import { FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Contract } from "@/types/contracts";

const baseSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  contract_type: z.string().min(2, "Contract Type must be at least 2 characters"),
  stage: z.string().default("draft"),
  fileOption: z.enum(["upload", "template"]).default("upload"),
  file: z.any().optional(),
});

const formSchema = baseSchema.refine(
  (data) => {
    if (data.fileOption === "upload") {
      return data.file && data.file.length > 0;
    }
    return true;
  },
  {
    message: "You must upload a file if you select 'Upload my own file'.",
    path: ["file"],
  }
);

type ContractFormData = z.infer<typeof formSchema>;

type CreateContractFormProps = {
  onSuccess: (contract: Contract) => void;
  onCancel: () => void;
};

export function CreateContractForm({ onSuccess, onCancel }: CreateContractFormProps) {
  const [message, setMessage] = useState("");

  const form = useForm<ContractFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      contract_type: "",
      stage: "draft",
      fileOption: "upload",
    },
  });

  /**
   * The main submit function:
   * 1) Decide if we need to upload a file or generate a template.
   * 2) Upload file if needed -> get filePath.
   * 3) POST the new contract with or without file_path.
   */
  const onSubmit = async (data: ContractFormData) => {
    try {
      setMessage("");

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      let filePath = "";

      if (data.fileOption === "template") {
        const templatePdf = await fetchTemplateFromBackend();
        const presignedData = await getPresignedUrl(token);
        filePath = await uploadFileToS3(presignedData.url, presignedData.fields, templatePdf);

      } else if (data.fileOption === "upload" && data.file?.[0]) {
        const userFile = data.file[0];
        const presignedData = await getPresignedUrl(token);
        filePath = await uploadFileToS3(presignedData.url, presignedData.fields, userFile);
      }
      const createResponse = await fetch(`${BASE_URL}/contracts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: data.title,
          contract_type: data.contract_type,
          stage: data.stage || "draft",
          file_path: filePath,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create contract");
      }

      const newContract = await createResponse.json();
      setMessage("Contract created successfully!");
      onSuccess(newContract);
    } catch (error) {
      console.error("Error creating contract:", error);
      setMessage("An error occurred. Please try again.");
    }
  };

  // Helper: get presigned URL
  const getPresignedUrl = async (token?: string) => {
    const res = await fetch(`${BASE_URL}/contracts/presigned-post-url/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch pre-signed URL");
    }
    return res.json(); // { url, fields }
  };

  // Helper: upload file or blob to S3
  const uploadFileToS3 = async (
    s3Url: string,
    s3Fields: Record<string, string>,
    fileOrBlob: File | Blob
  ) => {
    const formData = new FormData();
    Object.entries(s3Fields).forEach(([k, v]) => {
      formData.append(k, v);
    });
    formData.append("file", fileOrBlob);

    const uploadRes = await fetch(s3Url, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload file to S3");
    }
    return s3Fields.key;
  };

  // Helper: fetch a template PDF from your backend
  const fetchTemplateFromBackend = async (): Promise<Blob> => {
    const response = await fetch("/api/generate-template", { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to fetch template");
    }
    const data = await response.json();
    // data.template might be base64 or raw PDF content
    const pdfBlob = new Blob([data.template], { type: "application/pdf" });
    return pdfBlob;
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        {/* Contract Title */}
        <FormItem>
          <FormLabel htmlFor="title">Contract Title</FormLabel>
          <Controller
            name="title"
            control={form.control}
            render={({ field }) => (
              <Input id="title" {...field} placeholder="e.g. My NDA" />
            )}
          />
          {form.formState.errors.title && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </FormItem>

        {/* Contract Type */}
        <FormItem>
          <FormLabel htmlFor="contract_type">Contract Type</FormLabel>
          <Controller
            name="contract_type"
            control={form.control}
            render={({ field }) => (
              <Input
                id="contract_type"
                {...field}
                placeholder="e.g. vendor agreement"
              />
            )}
          />
          {form.formState.errors.contract_type && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.contract_type.message}
            </p>
          )}
        </FormItem>

        {/* Stage (optional, default to 'draft') */}
        <FormItem>
          <FormLabel htmlFor="stage">Stage</FormLabel>
          <Controller
            name="stage"
            control={form.control}
            render={({ field }) => <Input id="stage" {...field} placeholder="draft" />}
          />
        </FormItem>

        {/* Radio group for file option */}
        <FormItem>
          <FormLabel>File Option</FormLabel>
          <Controller
            name="fileOption"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="upload" />
                  <label htmlFor="upload" className="cursor-pointer">
                    Upload my own file
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="template" id="template" />
                  <label htmlFor="template" className="cursor-pointer">
                    Generate from template
                  </label>
                </div>
              </RadioGroup>
            )}
          />
        </FormItem>

        {/* If user chooses "upload", show a file input */}
        {form.watch("fileOption") === "upload" && (
          <FormItem>
            <FormLabel htmlFor="file">Choose PDF or doc</FormLabel>
            <Controller
              name="file"
              control={form.control}
              render={({ field }) => (
                <>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      field.onChange(e.target.files);
                    }}
                  />
                  {/* Show error if user selected 'upload' but didn't provide a file */}
                  {form.formState.errors.file && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.file.message as string}
                    </p>
                  )}
                </>
              )}
            />
          </FormItem>
        )}

        {/* Buttons */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Contract</Button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-2 text-center ${
              message.includes("success") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </FormProvider>
  );
}