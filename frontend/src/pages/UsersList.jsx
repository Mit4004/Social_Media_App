import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, Edit2, Search, ArrowUpDown, ChevronLeft, ChevronRight, X, UserMinus, Users, AlertCircle, Phone } from 'lucide-react'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import SkeletonLoader from '../components/SkeletonLoader'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/AuthContext'
import { getUsers, updateUser } from '../api/user.api'
import { getFriendsList } from '../api/friend.api'
import formatDate from '../utils/formatDate'

// Renders the People Directory page listing all registered users and connections with sorting, searching, and pagination
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
  
  // View mode state ('all' | 'friends')
  const [viewMode, setViewMode] = useState('all')

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
    enabled: viewMode === 'all',
  })

  const users = usersData?.users || []
  const pagination = usersData?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Query friends list
  const { data: myFriendsList = [], isLoading: isFriendsLoading } = useQuery({
    queryKey: ['friendsList', currentUser?._id || currentUser?.id],
    queryFn: () => getFriendsList(currentUser?._id || currentUser?.id),
    enabled: !!currentUser,
  })

  // Filter friends list locally by search term
  const filteredFriends = myFriendsList.filter((friend) => {
    const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase()
    const term = debouncedSearch.toLowerCase()
    return fullName.includes(term)
  })

  // Sort friends list locally
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    let valA = a[sortBy] || ''
    let valB = b[sortBy] || ''

    if (sortBy === 'firstName') {
      valA = `${a.firstName} ${a.lastName}`.toLowerCase()
      valB = `${b.firstName} ${b.lastName}`.toLowerCase()
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }

    if (typeof valA === 'string') {
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
    } else {
      return order === 'asc' ? valA - valB : valB - valA
    }
  })

  // Paginate friends list locally
  const limit = 8
  const startIndex = (page - 1) * limit
  const paginatedFriends = sortedFriends.slice(startIndex, startIndex + limit)

  const friendsPagination = {
    page,
    totalPages: Math.ceil(sortedFriends.length / limit) || 1,
    total: sortedFriends.length,
  }

  // Active state selectors based on viewMode
  const activeUsers = viewMode === 'all' ? users : paginatedFriends
  const activePagination = viewMode === 'all' ? pagination : friendsPagination
  const activeIsLoading = viewMode === 'all' ? isLoading : isFriendsLoading
  const activeError = viewMode === 'all' ? error : null

  // Toggle sort field/direction
  // Sorts the users list by field name toggling ascending/descending order
  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setOrder('asc')
    }
  }
  // Edit profile actions
  // Opens the edit details modal and initializes fields with target user data
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

  // Validates edit details form and triggers profile update mutation
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

      <div className="flex pl-0 md:pl-[72px]">
        {/* Sidebar Nav */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Users List Container */}
        <main className="flex-1 max-w-[1000px] mx-auto px-4 py-8 flex justify-center items-start">
          <div className="flex-1 bg-card border border-border rounded-[16px] p-6 shadow-sm overflow-hidden transition-colors duration-300">
          
          <div className="flex flex-col gap-4">
            
            {/* Header Title */}
            <div>
              <h1 className="text-xl font-bold text-primary">People Directory</h1>
              <p className="text-xs text-secondary mt-1">
                Explore connected members, manage profiles, and search connections.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-border/80 mt-2 bg-card transition-colors duration-300">
              <button
                onClick={() => {
                  setViewMode('all')
                  setPage(1)
                  setSelectedIds([])
                }}
                className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  viewMode === 'all'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                Explore Directory
              </button>
              <button
                onClick={() => {
                  setViewMode('friends')
                  setPage(1)
                  setSelectedIds([])
                }}
                className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  viewMode === 'friends'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                <Users size={14} />
                <span>My Friends</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  viewMode === 'friends' ? 'bg-accent/15 text-accent' : 'bg-input text-secondary'
                }`}>
                  {myFriendsList.length}
                </span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-2">
              <div className="relative w-full sm:max-w-[280px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border text-xs rounded-full focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 text-primary transition-colors"
                />
              </div>
            </div>

            {/* Content Display */}
            {activeIsLoading ? (
              <div className="mt-4">
                <SkeletonLoader type="list" count={4} />
              </div>
            ) : activeError ? (
              <div className="p-8 text-center border border-border rounded-[12px] mt-4">
                <p className="text-danger font-medium text-sm">Failed to retrieve users directory.</p>
              </div>
            ) : activeUsers.length === 0 ? (
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
                      <th 
                        className="py-3 px-4 cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => handleSort('firstName')}
                      >
                        <div className="flex items-center gap-1.5">
                          Name <ArrowUpDown size={12} />
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
                    {activeUsers.map((u) => {
                      const isSelf = u._id === currentUser?._id
                      const isFriend = myFriendsList.some((f) => f._id === u._id)
                      
                      return (
                        <tr 
                          key={u._id} 
                          className="hover:bg-base/30 transition-colors duration-150"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={u.photo || u.profilePicture || u.profilePhoto?.url}
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
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-secondary">
                            {u.mobile ? (
                              <div className="flex items-center gap-1.5">
                                <Phone size={12} className="text-secondary/60" />
                                <span>{u.mobile}</span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
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
            {!activeIsLoading && !activeError && activeUsers.length > 0 && (
              <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-2">
                <span className="text-[11px] font-medium text-secondary">
                  Showing Page <b className="text-primary">{activePagination.page}</b> of{' '}
                  <b className="text-primary">{activePagination.totalPages}</b> (Total:{' '}
                  {activePagination.total})
                </span>
                
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={activePagination.page === 1}
                    className="px-2 py-1 rounded-[10px]"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(activePagination.totalPages, p + 1))}
                    disabled={activePagination.page === activePagination.totalPages}
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
    </div>

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
