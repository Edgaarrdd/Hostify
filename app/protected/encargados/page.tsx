import { getUsers } from "@/lib/actions/users";
import { EncargadosClient } from "./client";

// Force dynamic rendering since we're fetching user data
export const dynamic = 'force-dynamic';

export default async function EncargadosPage() {
    const { data: users, success } = await getUsers();

    return <EncargadosClient users={users || []} success={success} />;
}
