import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Check, X, Inbox, UserPlus } from 'lucide-react'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Avatar from '../components/Avatar'
import SkeletonLoader from '../components/SkeletonLoader'
import Button from '../components/Button'
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../api/friend.api'

export const FriendRequests = () => {
  const queryClient = useQueryClient()

  // Fetch pending friend requests
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['friendRequestsList'],
    queryFn: getFriendRequests,
  })

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: (requestId) => acceptFriendRequest(requestId),
    onSuccess: () => {
      toast.success('Friend request accepted!')
      // Invalidate count in Navbar & request list query
      queryClient.invalidateQueries({ queryKey: ['friendRequestsCount'] })
      queryClient.invalidateQueries({ queryKey: ['friendRequestsList'] })
      queryClient.invalidateQueries({ queryKey: ['friendsList'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to accept friend request.')
    },
  })

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (requestId) => rejectFriendRequest(requestId),
    onSuccess: () => {
      toast.info('Friend request declined.')
      // Invalidate count in Navbar & request list query
      queryClient.invalidateQueries({ queryKey: ['friendRequestsCount'] })
      queryClient.invalidateQueries({ queryKey: ['friendRequestsList'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to decline friend request.')
    },
  })

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-4 py-8 flex gap-8 justify-center items-start">
        {/* Left Sidebar Menu */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Request Feed Container */}
        <div className="flex-1 max-w-[612px] bg-card border border-border rounded-[16px] p-6 shadow-sm transition-colors duration-300">
          
          <div className="flex flex-col gap-4">
            
            {/* Header Title */}
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <UserPlus size={20} className="text-accent" />
              <h1 className="text-xl font-bold text-primary">Friend Requests</h1>
            </div>

            {/* Content Display */}
            {isLoading ? (
              <div className="space-y-4 mt-2">
                <SkeletonLoader type="list" count={3} />
              </div>
            ) : error ? (
              <div className="p-8 text-center border border-border rounded-[12px] mt-2">
                <p className="text-danger font-medium text-sm">Failed to retrieve friend requests.</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center border border-border rounded-[12px] mt-2 flex flex-col items-center gap-3 transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-input flex items-center justify-center text-secondary shadow-sm">
                  <Inbox size={22} />
                </div>
                <h3 className="font-bold text-base text-primary">All Caught Up!</h3>
                <p className="text-xs text-secondary max-w-[280px] leading-relaxed">
                  You don't have any pending friend requests right now. Explore people to send invitations!
                </p>
                <Link to="/people">
                  <Button variant="primary" size="sm" className="mt-2 rounded-full px-5 py-2">
                    Find Friends
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 mt-2">
                {requests.map((request) => {
                  const sender = request.sender
                  if (!sender) return null

                  const senderName = `${sender.firstName} ${sender.lastName}`
                  const profileUrl = `/user/${sender._id}`

                  return (
                    <div 
                      key={request._id}
                      className="flex items-center justify-between p-4 bg-input border border-border rounded-[16px] hover:border-accent/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <Link to={profileUrl} className="hover:scale-102 transition-transform">
                          <Avatar
                            src={sender.profilePhoto || sender.photo}
                            firstName={sender.firstName}
                            lastName={sender.lastName}
                            size="md"
                          />
                        </Link>
                        <div className="flex flex-col">
                          <Link 
                            to={profileUrl} 
                            className="font-bold text-sm text-primary hover:text-accent hover:underline transition-colors"
                          >
                            {senderName}
                          </Link>
                          <span className="text-[10px] text-secondary mt-0.5 max-w-[150px] sm:max-w-xs truncate">
                            {sender.email}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => acceptMutation.mutate(request._id)}
                          isLoading={acceptMutation.isPending && acceptMutation.variables === request._id}
                          disabled={rejectMutation.isPending}
                          className="rounded-full !py-2 !px-3.5 shadow-sm shadow-accent/10 flex items-center gap-1.5 text-[11px]"
                        >
                          <Check size={14} />
                          <span>Accept</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => rejectMutation.mutate(request._id)}
                          isLoading={rejectMutation.isPending && rejectMutation.variables === request._id}
                          disabled={acceptMutation.isPending}
                          className="rounded-full !py-2 !px-3.5 border-border/80 hover:bg-base text-secondary flex items-center gap-1.5 text-[11px]"
                        >
                          <X size={14} />
                          <span>Decline</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  )
}

export default FriendRequests
