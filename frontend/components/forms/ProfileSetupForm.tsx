'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { BASE_URL } from "@/constants";

// Validation schema
const formSchema = z.object({
    username: z.string().min(3, {
        message: "Username must be at least 3 characters",
    }),
    bio: z.string().optional(),
    profilePicture: z
        .string()
        .url({ message: "Must be a valid URL" })
        .optional(),
});

export function ProfileSetupForm() {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const isRefreshingToken = useRef(false); // Track if a refresh request is in progress

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            bio: "",
            profilePicture: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            console.log("Profile submitted:", data);
            setMessage("Profile setup successful!");

            // Navigate to the dashboard
            const organizationId = await extractOrganizationId();
            if (organizationId) {
                router.push(`/dashboard/${organizationId}`);
            }
        } catch (error) {
            console.error("Error setting up profile:", error);
            setMessage("An error occurred. Please try again.");
        }
    };

    const handleSkip = async () => {
        try {
            const organizationId = await extractOrganizationId();
            if (organizationId) {
                router.push(`/dashboard/${organizationId}`);
            }
        } catch (error) {
            setMessage("Failed to skip. Please try again.");
            console.error("Error skipping profile setup:", error);
        }
    };

    const extractOrganizationId = async () => {
        const refreshToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("refreshToken="))
            ?.split("=")[1];

        if (!refreshToken) {
            console.error("Refresh token not found");
            handleLogout();
            return null;
        }

        try {
            if (isRefreshingToken.current) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return extractOrganizationId(); // Retry after delay
            }

            isRefreshingToken.current = true;

            const response = await fetch(`${BASE_URL}/auth/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            isRefreshingToken.current = false;

            if (!response.ok) {
                throw new Error("Failed to refresh token");
            }

            const { access } = await response.json();

            document.cookie = `authToken=${access}; path=/;`;

            const payload = JSON.parse(atob(access.split(".")[1]));
            return payload.organizationId;
        } catch (error) {
            isRefreshingToken.current = false;
            console.error("Error fetching new access token:", error);
            handleLogout();
            return null;
        }
    };

    const handleLogout = () => {
        // Clear all cookies
        document.cookie.split(";").forEach((cookie) => {
            document.cookie = `${cookie.split("=")[0].trim()}=;expires=${new Date(
                0
            ).toUTCString()};path=/`;
        });

        // Redirect to login page
        router.push("/login");
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 w-96"
            >
                <FormItem>
                    <FormLabel htmlFor="username">Username</FormLabel>
                    <Controller
                        name="username"
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                id="username"
                                placeholder="Enter your username"
                                {...field}
                            />
                        )}
                    />
                    {form.formState.errors.username && (
                        <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.username.message}
                        </p>
                    )}
                </FormItem>

                <FormItem>
                    <FormLabel htmlFor="bio">Bio</FormLabel>
                    <Controller
                        name="bio"
                        control={form.control}
                        render={({ field }) => (
                            <Textarea
                                id="bio"
                                placeholder="Write a short bio"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem>
                    <FormLabel htmlFor="profilePicture">Profile Picture URL</FormLabel>
                    <Controller
                        name="profilePicture"
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                id="profilePicture"
                                placeholder="Enter a URL for your profile picture"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <div className="flex gap-4">
                    <Button type="submit" className="mt-4">
                        Save Profile
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="mt-4"
                        onClick={handleSkip}
                    >
                        Skip
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        className="mt-4"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>

                {message && (
                    <div
                        className={`mt-4 p-2 text-center ${
                            message.includes("successful")
                                ? "text-green-500"
                                : "text-red-500"
                        }`}
                    >
                        {message}
                    </div>
                )}
            </form>
        </FormProvider>
    );
}