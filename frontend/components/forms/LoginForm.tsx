"use client";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { BASE_URL } from "@/constants";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/hooks/useOrganization";

const formSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
});

export function LoginForm() {
    const [loginMessage, setLoginMessage] = useState("");
    const organizations = useOrganizations();

    const router = useRouter();
  
    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });
  
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
      try {
        const response = await fetch(`${BASE_URL}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
  
        if (response.ok) {
            const result = await response.json();
            setLoginMessage("Login successful!");

            document.cookie = `authToken=${result.access}; path=/;`;
            document.cookie = `refreshToken=${result.refresh}; path=/;`;
            
            router.push(`/dashboard/${organizations[0].id}`); 
        } else {
          const errorData = await response.json();
          setLoginMessage(errorData.message || "Login failed");
        }
      } catch (error) {
        console.error("Error logging in:", error);
        setLoginMessage("An error occurred during login. Please try again.");
      }
    };
  
    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-96">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john@company.com"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e); // Update form state
                    }}
                  />
                </FormControl>
                {fieldState.error && (
                  <p className="text-red-500 text-sm">{fieldState.error.message}</p>
                )}
              </FormItem>
            )}
          />
  
          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    className="border border-gray-300"
                  />
                </FormControl>
                {fieldState.error && (
                  <p className="text-red-500 text-sm">{fieldState.error.message}</p>
                )}
              </FormItem>
            )}
          />
  
          {/* Submit */}
          <Button type="submit" className="w-full">
            Submit
          </Button>
  
          {loginMessage && <p className="text-green-500 text-sm">{loginMessage}</p>}
        </form>
      </FormProvider>
    );
  }