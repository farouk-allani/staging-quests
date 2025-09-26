'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Star,
  Zap,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { createApiClientWithToken } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface User {
  id?: string;
  name?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  email_verified: boolean;
  total_points: number;
  role?: 'user' | 'moderator' | 'admin';
  avatar?: string;
  level?: number;
  streak?: number;
  created_at?: string;
}

interface ApiResponse {
  succes: boolean;
  users: User[];
  numberOfPages?: number;
  page?: number;
  limit?: number;
}

interface UserManagementProps {
  className?: string;
}

// Helper function to transform API user data
const transformUser = (apiUser: User): User & { id: string; name: string; points: number } => ({
  ...apiUser,
  id: apiUser.username,
  name: `${apiUser.firstName} ${apiUser.lastName}`,
  points: apiUser.total_points,
  role: apiUser.role || 'user',
  level: apiUser.level || 1,
  streak: apiUser.streak || 0,
  created_at: apiUser.created_at?.toString().split('T')[0] || new Date().toISOString().split('T')[0]
});

export function UserManagement({ className }: UserManagementProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<'total_points' | 'created_at'>('total_points');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  // Removed pageInput in favor of leaderboard-style pagination

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.user?.token;
      const apiClient = token ? createApiClientWithToken(token) : require('@/lib/api/client').api;
      const response = await apiClient.get('/user/admin/all', { 
        params: { 
          page, 
          limit,
          sorted: sortField,
          sort_type: sortOrder
        } 
      });

      const data: ApiResponse = response.data;

      if (data.succes) {
        const transformedUsers = data.users.map(transformUser);
        setUsers(transformedUsers);
        if (typeof data.numberOfPages === 'number') setTotalPages(data.numberOfPages);
        if (typeof data.page === 'number' && data.page !== page) setPage(data.page);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [page, limit, sortField, sortOrder, session?.user?.token]);

  // Removed pageInput sync effect (not needed with numbered pagination)

  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
               user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               user.username.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Status filter based on email verification
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.email_verified;
        if (statusFilter === 'pending') return !user.email_verified;
        return true;
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Pagination helpers (match leaderboard UX)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const renderPaginationItems = () => {
    const items: JSX.Element[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // First page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={page === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Left ellipsis
      if (page > 4) {
        items.push(
          <PaginationItem key="ellipsis-left">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Right ellipsis
      if (page < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis-right">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={page === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  // Handle sorting
  const handleSort = (field: 'total_points' | 'created_at') => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new field with default DESC order
      setSortField(field);
      setSortOrder('DESC');
    }
    // Reset to first page when sorting changes
    setPage(1);
  };

  // Auto-trigger fetch when sort parameters change
  useEffect(() => {
    setPage(1);
  }, [sortField, sortOrder]);

  const getSortIcon = (field: 'total_points' | 'created_at') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'ASC' ? 
      <ArrowUp className="w-4 h-4 text-purple-600" /> : 
      <ArrowDown className="w-4 h-4 text-purple-600" />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-mono"><CheckCircle className="w-3 h-3 mr-1" />ACTIVE</Badge>;
  //     case 'suspended':
  //       return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-mono"><Ban className="w-3 h-3 mr-1" />SUSPENDED</Badge>;
  //     case 'pending':
  //       return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-mono"><Clock className="w-3 h-3 mr-1" />PENDING</Badge>;
  //     default:
  //       return <Badge variant="outline" className="font-mono">{status.toUpperCase()}</Badge>;
  //   }
  // };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-mono"><ShieldCheck className="w-3 h-3 mr-1" />ADMIN</Badge>;
      case 'moderator':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-mono"><Shield className="w-3 h-3 mr-1" />MOD</Badge>;
      default:
        return <Badge variant="outline" className="font-mono">USER</Badge>;
    }
  };

  // const handleUserAction = async (userId: string | number, action: string) => {
  //   try {
  //     // Optimistically update UI
  //     setUsers(prev => prev.map(user => {
  //       if (String(user.id) === String(userId)) {
  //         switch (action) {
  //           case 'suspend':
  //             return user; // Status not supported in User interface
  //           case 'activate':
  //             return user; // Status not supported in User interface
  //           case 'promote':
  //             return { ...user, role: user.role === 'user' ? 'moderator' : 'admin' };
  //           case 'demote':
  //             return { ...user, role: user.role === 'admin' ? 'moderator' : 'user' };
  //           default:
  //             return user;
  //         }
  //       }
  //       return user;
  //     }));

  //     // TODO: Make API call to update user on server
  //     // const response = await fetch(`/api/admin/users/${userId}`, {
  //     //   method: 'PATCH',
  //     //   headers: { 'Content-Type': 'application/json' },
  //     //   body: JSON.stringify({ action })
  //     // });
  //     // 
  //     // if (!response.ok) {
  //     //   throw new Error('Failed to update user');
  //     // }
  //   } catch (err) {
  //     console.error('Error updating user:', err);
  //     // Revert optimistic update on error
  //     fetchUsers();
  //   }
  // };

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-cyan-500/5">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
          <CardTitle className="flex items-center gap-2 font-mono">
            <div className="p-1 bg-purple-500/20 rounded border border-dashed border-purple-500/40">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            USER_MANAGEMENT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mt-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="[SEARCH_USERS]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-mono border-dashed border-purple-500/30 focus:border-solid"
              />
            </div>
            
            {/* Sort Controls  */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground font-mono">[SORT]</span>
                <Select value={sortField} onValueChange={(value: 'total_points' | 'created_at') => setSortField(value as 'total_points' | 'created_at')}>
                  <SelectTrigger className="w-36 font-mono border-dashed border-purple-500/30 focus:border-solid">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="font-mono">
                    <SelectItem value="total_points">Points</SelectItem>
                    <SelectItem value="created_at">Join Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                  className="px-3 font-mono border-dashed border-purple-500/30 hover:border-solid"
                  title={`Sort ${sortOrder === 'ASC' ? 'Descending' : 'Ascending'}`}
                >
                  {getSortIcon(sortField)}
                </Button>
              </div>
            </div>
            {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 font-mono border-dashed border-purple-500/30">
                <SelectValue placeholder="[STATUS]" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">[ALL_STATUS]</SelectItem>
                <SelectItem value="active">[ACTIVE]</SelectItem>
                <SelectItem value="suspended">[SUSPENDED]</SelectItem>
                <SelectItem value="pending">[PENDING]</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 font-mono border-dashed border-purple-500/30">
                <SelectValue placeholder="[ROLE]" />
              </SelectTrigger>
              <SelectContent className="font-mono">
                <SelectItem value="all">[ALL_ROLES]</SelectItem>
                <SelectItem value="user">[USER]</SelectItem>
                <SelectItem value="moderator">[MODERATOR]</SelectItem>
                <SelectItem value="admin">[ADMIN]</SelectItem>
              </SelectContent>
            </Select> */}

          </div>

          {/* Users Table */}
          <div className="border-2 border-dashed border-purple-500/20 rounded-lg overflow-hidden bg-gradient-to-br from-white/50 to-purple-50/30 dark:from-gray-900/50 dark:to-purple-900/10">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-3 font-mono text-purple-500">LOADING_USERS...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-500">
                <AlertCircle className="w-8 h-8" />
                <span className="ml-2 font-mono">ERROR: {error}</span>
                <Button 
                  onClick={fetchUsers} 
                  className="ml-4 font-mono bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
                  size="sm"
                >
                  RETRY
                </Button>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-b-2 border-dashed border-purple-500/30">
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[USER]</TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[ROLE]</TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[STATUS]</TableHead>
                  <TableHead 
                    className={cn(
                      "font-mono font-semibold py-4 cursor-pointer hover:bg-purple-500/8 transition-colors select-none",
                      sortField === 'total_points' 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-purple-700 dark:text-purple-300"
                    )}
                    onClick={() => handleSort('total_points')}
                    title="Click to sort by points"
                  >
                    <div className="flex items-center gap-2">
                      [STATS]
                      {sortField === 'total_points' && getSortIcon('total_points')}
                    </div>
                  </TableHead>
                  <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4">[USD_VALUE]</TableHead>
                  <TableHead 
                    className={cn(
                      "font-mono font-semibold py-4 cursor-pointer hover:bg-purple-500/8 transition-colors select-none",
                      sortField === 'created_at' 
                        ? "text-purple-600 dark:text-purple-400" 
                        : "text-purple-700 dark:text-purple-300"
                    )}
                    onClick={() => handleSort('created_at')}
                    title="Click to sort by join date"
                  >
                    <div className="flex items-center gap-2">
                      [JOINED]
                      {sortField === 'created_at' && getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  {/* <TableHead className="font-mono font-semibold text-purple-700 dark:text-purple-300 py-4 text-center">[ACTIONS]</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-dashed border-purple-500/10 hover:bg-gradient-to-r hover:from-purple-500/8 hover:to-cyan-500/8 transition-all duration-200 group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-dashed border-purple-500/30 group-hover:border-solid transition-all duration-200">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-mono text-sm font-semibold">
                            {getInitials(`${user.firstName} ${user.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold font-mono text-gray-900 dark:text-gray-100 truncate">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-muted-foreground font-mono truncate">@{user.username}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">{getRoleBadge(user.role || 'user')}</TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {user.email_verified ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 font-mono text-xs">
                            VERIFIED
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-mono text-xs">
                            UNVERIFIED
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3 text-sm font-mono">
                        <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded border border-dashed border-purple-300/50">
                          <Star className="w-3.5 h-3.5 text-purple-600" />
                          <span className="font-semibold">{user.total_points?.toLocaleString()}</span>
                        </div>
                        {/* <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded border border-dashed border-orange-300/50">
                          <Zap className="w-3.5 h-3.5 text-orange-600" />
                          <span className="font-semibold">{user.streak}d</span>
                        </div> */}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-dashed border-green-300/50 w-fit">
                        <span className="font-mono text-sm font-semibold text-green-700 dark:text-green-300">
                          ${(user.total_points * 0.01).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm py-4 text-muted-foreground">{user.created_at}</TableCell>
                    {/* <TableCell className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          

                          className="h-8 px-3 border border-dashed border-blue-500/30 hover:border-solid hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 transition-all duration-200"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 border border-dashed border-purple-500/30 hover:border-solid hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="font-mono border-2 border-dashed border-purple-500/30">
                          <DropdownMenuLabel>[ACTIONS]</DropdownMenuLabel>
                          <DropdownMenuSeparator className="border-dashed border-purple-500/20" />
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            [EDIT]
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'suspend')} className="text-red-600">
                            <Ban className="mr-2 h-4 w-4" />
                            [SUSPEND]
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'activate')} className="text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            [ACTIVATE]
                          </DropdownMenuItem>
                          {user.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'promote')} className="text-blue-600">
                              <Shield className="mr-2 h-4 w-4" />
                              [PROMOTE]
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'user' && (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id || user.username, 'demote')} className="text-orange-600">
                              <Shield className="mr-2 h-4 w-4" />
                              [DEMOTE]
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="border-dashed border-purple-500/20" />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            [DELETE]
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>

          {/* Pagination Controls (Leaderboard-style) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-mono">[ROWS_PER_PAGE]</span>
              <Select value={String(limit)} onValueChange={(val) => { setLimit(Number(val)); setPage(1); }}>
                <SelectTrigger className="w-24 font-mono border-dashed border-purple-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-mono">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={cn(
                        'cursor-pointer',
                        (loading || page <= 1) && 'pointer-events-none opacity-50'
                      )}
                    />
                  </PaginationItem>

                  {renderPaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={cn(
                        'cursor-pointer',
                        (loading || page >= totalPages) && 'pointer-events-none opacity-50'
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>

          {/* Stats Summary */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> */}
            {/* <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-dashed border-blue-500/20">
              <div className="text-2xl font-bold font-mono text-blue-500">{users.length}</div>
              <div className="text-sm text-muted-foreground font-mono">TOTAL_USERS</div>
            </div> */}
            {/* <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-dashed border-green-500/20">
              <div className="text-2xl font-bold font-mono text-green-500">{users.filter(u => u.email_verified).length}</div>
              <div className="text-sm text-muted-foreground font-mono">VERIFIED_USERS</div>
            </div> */}
            {/* <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-lg border border-dashed border-purple-500/20">
              <div className="text-2xl font-bold font-mono text-purple-500">{users.filter(u => u.role === 'admin' || u.role === 'moderator').length}</div>
              <div className="text-sm text-muted-foreground font-mono">STAFF_MEMBERS</div>
            </div> */}
            {/* <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-dashed border-yellow-500/20">
              <div className="text-2xl font-bold font-mono text-yellow-500">{users.filter(u => !u.email_verified).length}</div>
              <div className="text-sm text-muted-foreground font-mono">UNVERIFIED</div>
            </div> */}
          {/* </div> */}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="font-mono border-2 border-dashed border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
              [EDIT_USER]
            </DialogTitle>
            <DialogDescription>
              Modify user details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium font-mono">[FIRST_NAME]</label>
                  <Input defaultValue={selectedUser.firstName} className="font-mono border-dashed" />
                </div>
                <div>
                  <label className="text-sm font-medium font-mono">[LAST_NAME]</label>
                  <Input defaultValue={selectedUser.lastName} className="font-mono border-dashed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium font-mono">[USERNAME]</label>
                  <Input defaultValue={selectedUser.username} className="font-mono border-dashed" />
                </div>
                <div>
                  <label className="text-sm font-medium font-mono">[EMAIL]</label>
                  <Input defaultValue={selectedUser.email} className="font-mono border-dashed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium font-mono">[ROLE]</label>
                  <Select defaultValue={selectedUser.role}>
                    <SelectTrigger className="font-mono border-dashed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-mono">
                      <SelectItem value="user">[USER]</SelectItem>
                      <SelectItem value="moderator">[MODERATOR]</SelectItem>
                      <SelectItem value="admin">[ADMIN]</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium font-mono">[STATUS]</label>
                  <Select defaultValue="active">
                    <SelectTrigger className="font-mono border-dashed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-mono">
                      <SelectItem value="active">[ACTIVE]</SelectItem>
                      <SelectItem value="suspended">[SUSPENDED]</SelectItem>
                      <SelectItem value="pending">[PENDING]</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="font-mono border-dashed">
              [CANCEL]
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)} className="font-mono bg-gradient-to-r from-purple-500 to-cyan-500">
              [SAVE_CHANGES]
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;