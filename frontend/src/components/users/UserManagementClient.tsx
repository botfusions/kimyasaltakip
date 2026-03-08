"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import UserModal from "./UserModal";
import { toggleUserStatus } from "../../app/actions/users";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  phone: string | null;
  signature_id: string | null;
  created_at: string;
  last_login_at: string | null;
}

interface Props {
  initialUsers: User[];
}

export default function UserManagementClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (userId: string) => {
    const result = await toggleUserStatus(userId);

    if (result.success) {
      // Refresh the user list
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, is_active: !u.is_active } : u,
        ),
      );
    }
  };

  const handleModalClose = (updatedUser?: User) => {
    setIsModalOpen(false);
    setSelectedUser(null);

    if (updatedUser) {
      // Update or add the user in the list
      setUsers((prevUsers) => {
        const index = prevUsers.findIndex((u) => u.id === updatedUser.id);
        if (index >= 0) {
          // Update existing user
          const newUsers = [...prevUsers];
          newUsers[index] = updatedUser;
          return newUsers;
        } else {
          // Add new user
          return [updatedUser, ...prevUsers];
        }
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      lab: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      production:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      warehouse:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Yönetici",
      lab: "Laboratuvar",
      production: "Üretim",
      warehouse: "Depo",
    };
    return labels[role] || role;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="İsim veya email ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="admin">Yönetici</option>
            <option value="lab">Laboratuvar</option>
            <option value="production">Üretim</option>
            <option value="warehouse">Depo</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>

          {/* Create Button */}
          <Button onClick={handleCreateUser}>➕ Yeni Kullanıcı</Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Toplam: {users.length}</span>
          <span>•</span>
          <span>Aktif: {users.filter((u) => u.is_active).length}</span>
          <span>•</span>
          <span>Pasif: {users.filter((u) => !u.is_active).length}</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kayıt Tarihi</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    {searchQuery ||
                    roleFilter !== "all" ||
                    statusFilter !== "all"
                      ? "Filtrelerinize uygun kullanıcı bulunamadı"
                      : "Henüz kullanıcı yok"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-gray-300">
                      {user.phone || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                        user.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {user.is_active ? "✓ Aktif" : "○ Pasif"}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(user.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      ✏️ Düzenle
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <UserModal user={selectedUser} onClose={handleModalClose} />
      )}
    </>
  );
}
