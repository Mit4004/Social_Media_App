import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, X, UserMinus, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import SkeletonLoader from '../components/SkeletonLoader'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'
import { getUsers, deleteUser, updateUser } from '../api/user.api'
import formatDate from '../utils/formatDate'

export const UsersList = () => {
  const { user: currentUser, logout, updateProfile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // State parameters for users listing query
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  
  // Selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState([])

  // Modal edit states
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    bio: '',
  })
  const [editErrors, setEditErrors] = useState({})

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // reset to first page on search
    }, 400)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Query users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['usersList', debouncedSearch, page, sortBy, order],
    queryFn: () => getUsers({ search: debouncedSearch, page, limit: 8, sortBy, order }),
    placeholderData: (previousData) => previousData,
  })

  const users = usersData?.users || []
  const pagination = usersData?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Toggle sort field/direction
  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setOrder('asc')
    }
  }

  // Row selection handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map((u) => u._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (e, userId) => {
    if (e.target.checked) {
      setSelectedIds((prev) => [...prev, userId])
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  // Delete User Mutation (for deleting logged-in user, triggers logout)
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: (_, id) => {
      if (id === currentUser?._id) {
        toast.info('Your profile was deleted successfully. Logging you out...')
        logout()
        navigate('/login')
      } else {
        toast.success('User deleted successfully.')
        queryClient.invalidateQueries({ queryKey: ['usersList'] })
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete user profile.')
    },
  })

  const handleDelete = (userId) => {
    const isSelf = userId === currentUser?._id
    const confirmMsg = isSelf 
      ? 'WARNING: Deleting your profile will permanently remove your account and all posts. Are you sure you want to proceed?'
      : 'Are you sure you want to delete this user profile?'

    if (window.confirm(confirmMsg)) {
      deleteMutation.mutate(userId)
    }
  }

  // Multi-delete (bulk action) execution
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected profiles?`)) return

    const toastId = toast.loading('Executing bulk delete...')
    let successCount = 0
    let failureCount = 0

    // Execute requests in parallel
    await Promise.all(
      selectedIds.map(async (id) => {
        try {
          await deleteUser(id)
          successCount++
          if (id === currentUser?._id) {
            // If self is deleted, we'll log out at the end
            setTimeout(() => {
              logout()
              navigate('/login')
            }, 1500)
          }
        } catch (err) {
          failureCount++
        }
      })
    )

    toast.update(toastId, {
      render: `Bulk delete complete. Successes: ${successCount}, Failures: ${failureCount} ${
        failureCount > 0 ? '(Backend rule: You can only delete your own profile!)' : ''
      }`,
      type: failureCount > 0 ? 'warning' : 'success',
      isLoading: false,
      autoClose: 5000,
    })

    setSelectedIds([])
    queryClient.invalidateQueries({ queryKey: ['usersList'] })
  }

  // Edit profile actions
  const openEditModal = (user) => {
    setEditingUser(user)
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobile: user.mobile || '',
      bio: user.bio || '',
    })
    setEditErrors({})
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (data) => {
      toast.success('Profile updated successfully!')
      // Update global context
      updateProfile(data.user)
      setEditingUser(null)
      queryClient.invalidateQueries({ queryKey: ['usersList'] })
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        // Map zod array errors
        const errs = {}
        err.response.data.errors.forEach((e) => {
          errs[e.path[0]] = e.message
        })
        setEditErrors(errs)
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile.')
      }
    },
  })

  const handleEditSubmit = (e) => {
    e.preventDefault()
    // Simple frontend validations
    const errors = {}
    if (!editForm.firstName.trim()) errors.firstName = 'First name is required'
    if (!editForm.lastName.trim()) errors.lastName = 'Last name is required'
    if (editForm.mobile && editForm.mobile.length < 10) errors.mobile = 'Mobile must be at least 10 digits'
    if (editForm.bio && editForm.bio.length > 300) errors.bio = 'Bio cannot exceed 300 characters'

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    updateMutation.mutate({
      id: editingUser._id,
      data: editForm,
    })
  }

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-4 py-8 flex gap-8 justify-center items-start">
        {/* Sidebar Nav */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Users List Container */}
        <div className="flex-1 bg-card border border-border rounded-[16px] p-6 shadow-sm overflow-hidden transition-colors duration-300">
          
          <div className="flex flex-col gap-4">
            
            {/* Header Title */}
            <div>
              <h1 className="text-xl font-bold text-primary">People Directory</h1>
              <p className="text-xs text-secondary mt-1">
                Explore connected members, manage profiles, and search connections.
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
              <div className="relative w-full sm:max-w-[280px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border text-xs rounded-full focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-primary transition-colors"
                />
              </div>

              {/* Bulk Actions Menu */}
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/25 text-danger font-semibold rounded-[12px] text-xs transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>

            {/* Content Display */}
            {isLoading ? (
              <div className="mt-4">
                <SkeletonLoader type="list" count={4} />
              </div>
            ) : error ? (
              <div className="p-8 text-center border border-border rounded-[12px] mt-4">
                <p className="text-danger font-medium text-sm">Failed to retrieve users directory.</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center border border-border rounded-[12px] mt-4 flex flex-col items-center gap-2">
                <div className="text-3xl">🔍</div>
                <h4 className="font-bold text-sm text-primary">No results found</h4>
                <p className="text-xs text-secondary">Try adjusting your search filters or terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-2 rounded-[12px] border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-input text-secondary border-b border-border text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-[48px]">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedIds.length === users.length && users.length > 0}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                      </th>
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => handleSort('firstName')}
                      >
                        <div className="flex items-center gap-1.5">
                          Name <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none hidden sm:table-cell"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-1.5">
                          Email <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th className="py-3 px-4 hidden md:table-cell">Mobile</th>
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none hidden lg:table-cell"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1.5">
                          Joined <ArrowUpDown size={12} />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs text-primary">
                    {users.map((u) => {
                      const isSelf = u._id === currentUser?._id
                      const isSelected = selectedIds.includes(u._id)
                      
                      return (
                        <tr 
                          key={u._id} 
                          className={`hover:bg-base/30 transition-colors duration-150 ${
                            isSelected ? 'bg-accent/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(e, u._id)}
                              className="rounded border-border text-accent focus:ring-accent"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={u.photo || u.profilePicture}
                                firstName={u.firstName}
                                lastName={u.lastName}
                                size="sm"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold flex items-center gap-1.5">
                                  <Link to={`/user/${u._id}`} className="hover:text-accent hover:underline">
                                    {u.firstName} {u.lastName}
                                  </Link>
                                  {isSelf && (
                                    <span className="text-[9px] font-bold text-accent bg-accent-light px-1.5 py-0.5 rounded-full uppercase">
                                      You
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-secondary sm:hidden block mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell text-secondary">{u.email}</td>
                          <td className="py-3 px-4 hidden md:table-cell text-secondary">{u.mobile || '—'}</td>
                          <td className="py-3 px-4 hidden lg:table-cell text-secondary">{formatDate(u.createdAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/user/${u._id}`}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-accent hover:bg-base transition-colors"
                                title="View Profile"
                              >
                                <Eye size={14} />
                              </Link>
                              
                              {/* Edit triggers inline modal for self */}
                              {isSelf ? (
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-accent hover:bg-base transition-colors cursor-pointer"
                                  title="Edit Profile"
                                >
                                  <Edit2 size={14} />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted opacity-25 cursor-not-allowed"
                                  title="Edit Profile (Only own accounts)"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}

                              {/* Delete button: Self triggers delete, others disabled (or fail at backend level) */}
                              {isSelf ? (
                                <button
                                  onClick={() => handleDelete(u._id)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                                  title="Delete Account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    toast.error('Permission denied: You can only delete your own profile.')
                                  }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                                  title="Delete Profile (Own account only)"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !error && users.length > 0 && (
              <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
                <span className="text-[11px] font-medium text-secondary">
                  Showing Page <b className="text-primary">{pagination.page}</b> of{' '}
                  <b className="text-primary">{pagination.totalPages}</b> (Total:{' '}
                  {pagination.total})
                </span>
                
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-2 py-1 rounded-[10px]"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-2 py-1 rounded-[10px]"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Inline Modal Edit Profile (for own profile) */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-[420px] rounded-[16px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="h-[55px] px-6 border-b border-border flex items-center justify-between">
              <span className="font-bold text-primary text-sm">Edit Profile Details</span>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-base transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  error={editErrors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  error={editErrors.lastName}
                  required
                />
              </div>

              <Input
                label="Mobile Number"
                id="edit-mobile"
                value={editForm.mobile}
                onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                error={editErrors.mobile}
                placeholder="e.g. 9876543210"
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-bio" className="text-xs font-bold text-secondary">
                  Short Biography
                </label>
                <textarea
                  id="edit-bio"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  maxLength={300}
                  className="w-full px-4 py-2.5 bg-input border border-border text-xs rounded-[12px] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-primary resize-none placeholder:text-muted/60"
                />
                {editErrors.bio && (
                  <span className="text-[10px] text-danger font-semibold flex items-center gap-1">
                    <AlertCircle size={10} /> {editErrors.bio}
                  </span>
                )}
              </div>

              {/* Modal Actions */}
              <div className="border-t border-border pt-4 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingUser(null)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}

export default UsersList
