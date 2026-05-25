import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Edit2, Trash2, UserPlus, UserCheck, UserMinus, Users, X, AlertCircle, Mail, Phone, Calendar, BookOpen, Lock, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import AnimatedPostList from '../components/AnimatedPostList'
import SkeletonLoader from '../components/SkeletonLoader'
import Button from '../components/Button'
import Input from '../components/Input'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { getUserById, updateUser, uploadProfilePhoto, deleteUser } from '../api/user.api'
import { getUserPosts } from '../api/post.api'
import { getFriendRequests, getFriendsList, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, unfriend } from '../api/friend.api'
import formatDate from '../utils/formatDate'
 
// Renders the User Profile Detail page displaying user biography, contacts, posts feed, friends list, and profile editing options
export const UserDetail = () => {
  const { id: profileId } = useParams()
  const { user: currentUser, logout, updateProfile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
 
  const isOwnProfile = currentUser?._id === profileId || currentUser?.id === profileId

  // Tab state
  const [activeTab, setActiveTab] = useState('posts')

  // Edit details modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    bio: '',
  })
  const [editErrors, setEditErrors] = useState({})

  // Reusable custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    isDestructive: false,
  })

  // Session-persisted outgoing request tracker
  const [sentRequests, setSentRequests] = useState(() => {
    return JSON.parse(localStorage.getItem('sent_friend_requests') || '[]')
  })

  // Fetch profile user details
  const { data: profileResponse, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', profileId],
    queryFn: () => getUserById(profileId),
  })
  const profileUser = profileResponse?.user

  // Fetch profile user's posts
  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery({
    queryKey: ['userPosts', profileId],
    queryFn: () => getUserPosts(profileId),
  })

  // Fetch profile user's friends list
  const { data: profileFriends = [], isLoading: isFriendsLoading } = useQuery({
    queryKey: ['friendsList', profileId],
    queryFn: () => getFriendsList(profileId),
    enabled: !!profileId,
  })

  // Fetch logged in user's friends list (needed to compute friendship state with this profile)
  const { data: loggedInFriends = [] } = useQuery({
    queryKey: ['friendsList', currentUser?._id || currentUser?.id],
    queryFn: () => getFriendsList(currentUser?._id || currentUser?.id),
    enabled: !isOwnProfile && !!currentUser,
  })

  // Fetch logged in user's pending incoming requests
  const { data: loggedInRequests = [] } = useQuery({
    queryKey: ['friendRequestsList'],
    queryFn: getFriendRequests,
    enabled: !isOwnProfile && !!currentUser,
  })

  // Synchronize edit form when profileUser changes
  useEffect(() => {
    if (profileUser) {
      setEditForm({
        firstName: profileUser.firstName || '',
        lastName: profileUser.lastName || '',
        mobile: profileUser.mobile || '',
        bio: profileUser.bio || '',
      })
    }
  }, [profileUser])

  // Determine friendship status: 'friends' | 'incoming_request' | 'outgoing_request' | 'none'
  // Helper to determine friendship relationship state between logged-in user and profile user
  const getFriendshipState = () => {
    if (isOwnProfile) return 'self'
    
    // Check if friends
    const isFriend = loggedInFriends.some((friend) => friend._id === profileId)
    if (isFriend) return 'friends'

    // Check if incoming request exists
    const incomingReq = loggedInRequests.find((req) => req.sender?._id === profileId)
    if (incomingReq) return 'incoming_request'

    // Check if we sent an outgoing request (either verified by session or locally stored)
    const isSent = sentRequests.includes(profileId)
    if (isSent) return 'outgoing_request'

    return 'none'
  }

  const friendshipState = getFriendshipState()


  // Mutations
  // Send Friend Request Mutation
  const sendRequestMutation = useMutation({
    mutationFn: () => sendFriendRequest(profileId),
    onSuccess: () => {
      toast.success('Friend request sent!')
      const updated = [...sentRequests, profileId]
      setSentRequests(updated)
      localStorage.setItem('sent_friend_requests', JSON.stringify(updated))
      queryClient.invalidateQueries({ queryKey: ['friendRequestsCount'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send friend request.')
    },
  })

  // Accept Request Mutation
  const acceptRequestMutation = useMutation({
    mutationFn: (reqId) => acceptFriendRequest(reqId),
    onSuccess: () => {
      toast.success('Friend request accepted!')
      queryClient.invalidateQueries({ queryKey: ['friendRequestsCount'] })
      queryClient.invalidateQueries({ queryKey: ['friendRequestsList'] })
      queryClient.invalidateQueries({ queryKey: ['friendsList'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to accept request.')
    },
  })

  // Reject Request Mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (reqId) => rejectFriendRequest(reqId),
    onSuccess: () => {
      toast.info('Friend request declined.')
      queryClient.invalidateQueries({ queryKey: ['friendRequestsCount'] })
      queryClient.invalidateQueries({ queryKey: ['friendRequestsList'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to decline request.')
    },
  })

  // Unfriend Mutation
  const unfriendMutation = useMutation({
    mutationFn: () => unfriend(profileId),
    onSuccess: () => {
      toast.info('Unfriended successfully.')
      queryClient.invalidateQueries({ queryKey: ['friendsList'] })
      // Clear local sent requests just in case
      const updated = sentRequests.filter(id => id !== profileId)
      setSentRequests(updated)
      localStorage.setItem('sent_friend_requests', JSON.stringify(updated))
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to unfriend.')
    },
  })

  // Upload Profile Photo Mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: (formData) => uploadProfilePhoto(formData),
    onSuccess: (data) => {
      toast.success('Profile image updated successfully!')
      // Update global context user state
      const updated = {
        ...currentUser,
        photo: data.profilePhoto.url,
        profilePhoto: data.profilePhoto,
      }
      updateProfile(updated)
      
      // Invalidate queries to refresh view
      queryClient.invalidateQueries({ queryKey: ['userProfile', profileId] })
      queryClient.invalidateQueries({ queryKey: ['timelinePosts'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload photo.')
    },
  })

  // Handle Photo Select
  // Triggers click event on the hidden profile photo file input element
  const handlePhotoClick = () => {
    if (isOwnProfile && !uploadPhotoMutation.isPending) {
      fileInputRef.current?.click()
    }
  }

  // Handles profile picture file selection and initiates file upload mutation
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB.')
      return
    }

    const formData = new FormData()
    formData.append('photo', file)
    uploadPhotoMutation.mutate(formData)
  }

  // Edit details profile submission
  const editProfileMutation = useMutation({
    mutationFn: (data) => updateUser(profileId, data),
    onSuccess: (data) => {
      toast.success('Profile updated successfully!')
      updateProfile(data.user)
      setIsEditModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['userProfile', profileId] })
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
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

  // Validates and submits updated profile form details
  const handleEditSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!editForm.firstName.trim()) errors.firstName = 'First name is required'
    if (!editForm.lastName.trim()) errors.lastName = 'Last name is required'
    if (editForm.mobile && editForm.mobile.length < 10) errors.mobile = 'Mobile must be at least 10 digits'
    if (editForm.bio && editForm.bio.length > 300) errors.bio = 'Bio cannot exceed 300 characters'

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    editProfileMutation.mutate(editForm)
  }

  // Delete Profile Mutation
  const deleteProfileMutation = useMutation({
    mutationFn: () => deleteUser(profileId),
    onSuccess: () => {
      toast.success('Your profile was deleted successfully. Logging you out...')
      logout()
      navigate('/login')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete profile.')
    },
  })

  // Opens confirmation modal to delete the user profile permanently
  const handleDeleteProfile = () => {
    const confirmMsg = 'WARNING: Are you sure you want to permanently delete your profile? This will delete all your posts, friends list connections, comments, and likes. This action cannot be undone!'
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Profile',
      message: confirmMsg,
      confirmText: 'Delete Profile',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        deleteProfileMutation.mutate()
        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
      },
    })
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-base transition-colors duration-300">
        <Navbar />
        <div className="flex pl-0 md:pl-[72px]">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex-1 max-w-[1000px] mx-auto px-4 py-8 flex justify-center items-start">
            <div className="flex-1 max-w-[612px] bg-card border border-border rounded-[16px] p-6 shadow-sm">
              <SkeletonLoader type="post" count={2} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (profileError || !profileUser) {
    return (
      <div className="min-h-screen bg-base transition-colors duration-300">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-card border border-border p-8 rounded-[16px] shadow-lg">
            <h2 className="text-xl font-bold text-danger">User Not Found</h2>
            <p className="text-secondary text-sm mt-2">The user profile you are trying to view does not exist or was deleted.</p>
            <Link to="/">
              <Button variant="primary" size="sm" className="mt-6 rounded-full px-5">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const profileName = `${profileUser.firstName} ${profileUser.lastName}`
  const incomingRequestObj = loggedInRequests.find((req) => req.sender?._id === profileId)

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <Navbar />

      <div className="flex pl-0 md:pl-[72px]">
        {/* Left column sidebar (hidden on mobile) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Profile Details Area */}
        <main className="flex-1 max-w-[1000px] mx-auto px-4 py-6 flex justify-center items-start">
          <div className="flex-1 max-w-[612px] flex flex-col gap-6">
          
          {/* Card containing Cover, Avatar, and Main actions */}
          <div className="bg-card border border-border rounded-[16px] overflow-hidden shadow-sm transition-colors duration-300">
            {/* 1. Cover Photo Banner */}
            <div className="h-[160px] bg-gradient-to-r from-accent via-indigo-500 to-purple-600 relative overflow-hidden">
              {/* Sleek dynamic circle waves in cover */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
              <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-xl" />
            </div>

            {/* 2. Avatar & Meta Container */}
            <div className="px-6 pb-6 relative flex flex-col items-center sm:items-start">
              
              {/* Avatar position (offset into cover) */}
              <div className="absolute -top-[48px] left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0">
                <div 
                  onClick={handlePhotoClick}
                  className={`relative rounded-full border-4 border-card shadow-md group ${
                    isOwnProfile ? 'cursor-pointer hover:opacity-90' : ''
                  }`}
                >
                  <Avatar
                    src={profileUser.profilePhoto || profileUser.photo}
                    firstName={profileUser.firstName}
                    lastName={profileUser.lastName}
                    size="xl"
                  />
                  {/* Camera overlay on own profile */}
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </div>
                  )}
                </div>
                {/* Invisible input file for upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Action buttons (right-aligned on sm screens, below on mobile) */}
              <div className="w-full flex justify-center sm:justify-end gap-2 pt-16 sm:pt-4">
                {friendshipState === 'self' && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="rounded-full shadow-sm flex items-center gap-1.5 font-semibold"
                    >
                      <Edit2 size={13} />
                      <span>Edit Profile</span>
                    </Button>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      onClick={handleDeleteProfile}
                      isLoading={deleteProfileMutation.isPending}
                      className="rounded-full shadow-sm flex items-center gap-1.5 font-semibold text-danger border-danger hover:bg-danger/5"
                    >
                      <Trash2 size={13} />
                      <span>Delete Profile</span>
                    </Button>
                  </div>
                )}

                {friendshipState === 'friends' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Unfriend Connection',
                        message: `Are you sure you want to unfriend ${profileName}?`,
                        confirmText: 'Unfriend',
                        cancelText: 'Cancel',
                        isDestructive: true,
                        onConfirm: () => {
                          unfriendMutation.mutate()
                          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                        },
                      })
                    }}
                    isLoading={unfriendMutation.isPending}
                    className="rounded-full border-danger/20 text-danger hover:bg-danger/10 flex items-center gap-1.5"
                  >
                    <UserMinus size={14} />
                    <span>Unfriend</span>
                  </Button>
                )}

                {friendshipState === 'incoming_request' && incomingRequestObj && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => acceptRequestMutation.mutate(incomingRequestObj._id)}
                      isLoading={acceptRequestMutation.isPending}
                      className="rounded-full flex items-center gap-1.5"
                    >
                      <UserCheck size={14} />
                      <span>Accept</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => rejectRequestMutation.mutate(incomingRequestObj._id)}
                      isLoading={rejectRequestMutation.isPending}
                      className="rounded-full text-secondary hover:bg-base"
                    >
                      <span>Decline</span>
                    </Button>
                  </div>
                )}

                {friendshipState === 'outgoing_request' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    className="rounded-full bg-base/50 text-secondary border-border/80 flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <UserCheck size={14} />
                    <span>Request Sent</span>
                  </Button>
                )}

                {friendshipState === 'none' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => sendRequestMutation.mutate()}
                    isLoading={sendRequestMutation.isPending}
                    className="rounded-full flex items-center gap-1.5 shadow-md shadow-accent/15"
                  >
                    <UserPlus size={14} />
                    <span>Add Friend</span>
                  </Button>
                )}
              </div>

              {/* User Identity Details */}
              <div className="w-full text-center sm:text-left mt-4">
                <h2 className="text-xl font-extrabold text-primary flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <span>{profileName}</span>
                  {isOwnProfile && (
                    <span className="text-[10px] font-bold text-accent bg-accent-light self-center px-2 py-0.5 rounded-full uppercase tracking-wider">
                      My Profile
                    </span>
                  )}
                  {friendshipState === 'friends' && (
                    <span className="text-[10px] font-bold text-success bg-success/10 self-center px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Friends
                    </span>
                  )}
                </h2>
                
                <p className="text-xs text-secondary mt-2 max-w-lg leading-relaxed">
                  {profileUser.bio || (isOwnProfile ? "You haven't written a biography yet. Edit your profile to tell others about yourself!" : "No bio details shared yet.")}
                </p>

                {/* Grid details (Contact details) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-border/50 text-xs text-secondary">
                  {isOwnProfile && (
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      <Mail size={14} className="text-muted" />
                      <span>{profileUser.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                    <Phone size={14} className="text-muted" />
                    <span>{profileUser.mobile || 'No phone added'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start col-span-1 sm:col-span-2">
                    <Calendar size={14} className="text-muted" />
                    <span>Joined on {formatDate(profileUser.createdAt)}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border/80 bg-card rounded-[14px] overflow-hidden border transition-colors duration-300">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'posts'
                  ? 'border-accent text-accent bg-base/5'
                  : 'border-transparent text-secondary hover:text-primary hover:bg-base/5'
              }`}
            >
              <BookOpen size={14} />
              <span>Posts</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'posts' ? 'bg-accent/15 text-accent' : 'bg-input text-secondary'
              }`}>
                {userPosts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'friends'
                  ? 'border-accent text-accent bg-base/5'
                  : 'border-transparent text-secondary hover:text-primary hover:bg-base/5'
              }`}
            >
              <Users size={14} />
              <span>Friends</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'friends' ? 'bg-accent/15 text-accent' : 'bg-input text-secondary'
              }`}>
                {profileFriends.length}
              </span>
            </button>
          </div>

          {/* Conditional Content Section */}
          {activeTab === 'posts' ? (
            <div className="flex flex-col gap-4">
              {isPostsLoading ? (
                <div className="space-y-4">
                  <SkeletonLoader type="post" count={2} />
                </div>
              ) : userPosts.length === 0 ? (
                <div className="bg-card border border-border p-12 rounded-[16px] text-center shadow-sm flex flex-col items-center gap-3 transition-colors duration-300">
                  <div className="w-10 h-10 bg-input rounded-full flex items-center justify-center text-muted">
                    <ImageIcon size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-primary">No Posts Published</h4>
                  <p className="text-xs text-secondary max-w-[240px] leading-relaxed">
                    {isOwnProfile 
                      ? "You haven't written any updates yet. Share your thoughts on the timeline!" 
                      : `${profileUser.firstName} has not published any posts yet.`
                    }
                  </p>
                </div>
              ) : (
                <AnimatedPostList posts={userPosts} showDeleteOption={isOwnProfile} />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {isFriendsLoading ? (
                <div className="space-y-4">
                  <SkeletonLoader type="post" count={1} />
                </div>
              ) : profileFriends.length === 0 ? (
                <div className="bg-card border border-border p-12 rounded-[16px] text-center shadow-sm flex flex-col items-center gap-3 transition-colors duration-300">
                  <div className="w-10 h-10 bg-input rounded-full flex items-center justify-center text-muted">
                    <UserMinus size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-primary">No Friends Yet</h4>
                  <p className="text-xs text-secondary max-w-[240px] leading-relaxed">
                    {isOwnProfile 
                      ? "You haven't added any friends yet. Explore the directory to find friends!" 
                      : `${profileUser.firstName} doesn't have any friends listed yet.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profileFriends.map((friend) => {
                    const friendName = `${friend.firstName} ${friend.lastName}`
                    return (
                      <Link 
                        key={friend._id} 
                        to={`/user/${friend._id}`}
                        className="flex items-center gap-3 p-3 bg-card border border-border/60 hover:border-accent/40 rounded-[14px] shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5"
                      >
                        <Avatar
                          src={friend.profilePhoto || friend.photo}
                          firstName={friend.firstName}
                          lastName={friend.lastName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-primary truncate group-hover:text-accent transition-colors">
                            {friendName}
                          </h4>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>

      {/* Edit Profile Modal Dialog (for own profile details) */}
      {isOwnProfile && isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-base/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-[420px] rounded-[16px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="h-[55px] px-6 border-b border-border flex items-center justify-between">
              <span className="font-bold text-primary text-sm">Edit Profile Information</span>
              <button
                onClick={() => setIsEditModalOpen(false)}
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
                  id="edit-profile-firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  error={editErrors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  id="edit-profile-lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  error={editErrors.lastName}
                  required
                />
              </div>

              <Input
                label="Mobile Number"
                id="edit-profile-mobile"
                value={editForm.mobile}
                onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                error={editErrors.mobile}
                placeholder="e.g. 9876543210"
              />

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-profile-bio" className="text-xs font-bold text-secondary">
                  Short Biography
                </label>
                <textarea
                  id="edit-profile-bio"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Introduce yourself to friends..."
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
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editProfileMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={editProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Reusable Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        isDestructive={confirmModal.isDestructive}
        isLoading={deleteProfileMutation.isPending || unfriendMutation.isPending}
      />
    </div>
  )
}

export default UserDetail
