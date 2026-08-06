// app/[slug]/access_controls/components/RoleUsers.tsx
export default function RoleUsers({ roleId }: { roleId: string }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Assigned Users</h3>
      <p className="text-gray-500">Users list coming soon...</p>
    </div>
  );
}