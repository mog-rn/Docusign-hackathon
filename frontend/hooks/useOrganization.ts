import { useEffect, useState } from "react";

import { Organization } from "@/types/organization";

export const useOrganizations = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        const storedOrgs = JSON.parse(localStorage.getItem("organizations") || "[]");
        setOrganizations(storedOrgs);
    },[]);

    return organizations;
}