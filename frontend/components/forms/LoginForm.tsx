"use client";

import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { getOrganizationFromEmail, OrganizationDomain } from "@/utils/organization";
import { debounce } from "@/utils/debouce";

const formSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .refine((email) => email.endsWith("@company.com") || email.endsWith("@business.org"), {
      message: "Email must be a work email (e.g., ending with @company.com or @business.org)",
    }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
});

export function LoginForm() {
    const [loginMessage, setLoginMessage] = useState("");
    const [organization, setOrganization] = useState<OrganizationDomain | null>(null);
    const [emailError, setEmailError] = useState("");
    const [emailValid, setEmailValid] = useState(false);
  
    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });
  
    const validateEmailDomain = async (email: string) => {
        const parts = email.split("@");
        if (parts.length < 2 || !parts[1].trim()) {
          // If there is no domain part after '@', do not send the request
          setEmailError("Please enter a valid email address with a domain.");
          setEmailValid(false); 
          setOrganization(null); 
          return;
        }
      
        const domain = parts[1].toLowerCase(); 
      
        try {
          const org = await getOrganizationFromEmail(email);
          if (org) {
            setOrganization(org);
            setEmailValid(true); 
            setEmailError(""); 
          } else {
            setOrganization(null);
            setEmailValid(false); 
            setEmailError(`No organization found for domain: ${domain}`);
          }
        } catch (error) {
          console.error("Error checking organization domain:", error);
          setEmailError("Error validating email domain. Please try again.");
          setEmailValid(false); 
        }
      }; 
  
    
    const handleEmailChange = debounce((email: string) => {
      validateEmailDomain(email);
    }, 500); 
  
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
      if (!organization) {
        setEmailError("Please use a valid email with a recognized organization domain.");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:8000/api/auth/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
  
        if (response.ok) {
          const result = await response.json();
          setLoginMessage("Login successful!");
          console.log("Login Result:", result);
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
                      handleEmailChange(e.target.value); // Debounced validation
                    }}
                    className={`border ${
                      emailValid ? "border-green-500" : fieldState.error ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </FormControl>
                {fieldState.error && (
                  <p className="text-red-500 text-sm">{fieldState.error.message}</p>
                )}
                {emailError && (
                  <p className="text-red-500 text-sm">{emailError}</p>
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