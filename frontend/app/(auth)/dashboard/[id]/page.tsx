"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BASE_URL } from "@/constants";

interface Organization {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    domains: string[];
}

export default function OrgDashboardPage() {
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { id } = params;

    if (!id) return;

    const fetchOrganizationDetails = async () => {
      try {
        setLoading(true);
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("authToken="))
          ?.split("=")[1];

        if (!token) {
          console.error("No auth token found");
          return;
        }

        const response = await fetch(`${BASE_URL}/organizations/${id}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch organization details");
        }
      } catch (err) {
        console.error("Error fetching organization details:", err);
        setError("An error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationDetails();
  }, [params]);

  if (loading) {
    return <div>Loading organization details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">
        Organization Dashboard
      </h1>

      {organization && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">{organization.name}</h2>
          <p className="text-gray-600">
            Created At: {new Date(organization.created_at).toLocaleDateString()}
          </p>
          <p className="text-gray-600">
            Updated At: {new Date(organization.updated_at).toLocaleDateString()}
          </p>
          <div className="mt-2">
            <h3 className="text-lg font-medium">Domains:</h3>
            <ul className="list-disc list-inside">
              {organization.domains.map((domain: string) => (
                <li key={domain} className="text-gray-700">
                  {domain}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}