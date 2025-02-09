'use client';
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { BASE_URL } from "@/constants";

const formSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string(),
    firstName: z.string().min(2, {
      message: "First name must be at least 2 characters",
    }),
    lastName: z.string().min(2, {
      message: "Last name must be at least 2 characters",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Specify the field to show the error
  });

export function RegisterForm({onNext}: {onNext: () => void}) {
  const [registerMessage, setRegisterMessage] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        document.cookie = `authToken=${result.access}; path=/;`;
        document.cookie = `refreshToken=${result.refresh}; path=/;`;

        setRegisterMessage("Registration successful!");

        onNext();
      } else {
        const errorData = await response.json();
        setRegisterMessage(errorData.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setRegisterMessage("An error occurred. Please try again.");
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 w-96"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName">First Name</label>
          <input
            {...form.register("firstName")}
            placeholder="John"
            className="border w-full p-2"
          />
          {form.formState.errors.firstName && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName">Last Name</label>
          <input
            {...form.register("lastName")}
            placeholder="Doe"
            className="border w-full p-2"
          />
          {form.formState.errors.lastName && (
            <p className="text-red-500 text-sm">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email">Email</label>
        <input
          {...form.register("email")}
          placeholder="john@example.com"
          className="border w-full p-2"
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          {...form.register("password")}
          placeholder="********"
          className="border w-full p-2"
        />
        {form.formState.errors.password && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          {...form.register("confirmPassword")}
          placeholder="********"
          className="border w-full p-2"
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
      >
        Register
      </Button>

      {registerMessage && (
        <p
          className={`text-sm mt-2 ${
            registerMessage.includes("successful") ? "text-green-500" : "text-red-500"
          }`}
        >
          {registerMessage}
        </p>
      )}
    </form>
  );
}