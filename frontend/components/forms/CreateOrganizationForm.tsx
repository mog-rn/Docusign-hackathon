'use client';

import { BASE_URL } from "@/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Organization name must be at least 2 characters",
    }),
});

type CreateOrganizationFormProps = {
    onNext: () => void;
};

export function CreateOrganizationForm({ onNext }: CreateOrganizationFormProps) {
    const [message, setMessage] = useState("");

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            const response = await fetch(`${BASE_URL}/organizations/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${document.cookie
                        .split("; ")
                        .find((row) => row.startsWith("authToken="))
                        ?.split("=")[1]}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const createdOrganization = await response.json();

                // Retrieve existing organizations from localStorage
                const existingOrganizations = JSON.parse(
                    localStorage.getItem("organizations") || "[]"
                );

                // Add the new organization to the array
                const updatedOrganizations = [
                    ...existingOrganizations,
                    createdOrganization,
                ];

                // Save the updated array to localStorage
                localStorage.setItem(
                    "organizations",
                    JSON.stringify(updatedOrganizations)
                );

                setMessage("Organization created successfully!");
                onNext(); // Proceed to the next step
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || "Organization creation failed");
            }
        } catch (error) {
            console.error("Error creating organization:", error);
            setMessage(
                "An error occurred while creating the organization. Please try again."
            );
        }
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-96">
                {/* Organization Name Field */}
                <FormItem>
                    <FormLabel htmlFor="name">Organization Name</FormLabel>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <Input id="name" {...field} placeholder="Enter your organization's name" />
                        )}
                    />
                    {form.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.name.message}
                        </p>
                    )}
                </FormItem>

                {/* Submit Button */}
                <Button type="submit" className="mt-4">
                    Create Organization
                </Button>

                {/* Message */}
                {message && (
                    <div
                        className={`mt-4 p-2 text-center ${
                            message.includes("successfully") ? "text-green-500" : "text-red-500"
                        }`}
                    >
                        {message}
                    </div>
                )}
            </form>
        </FormProvider>
    );
}