import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { getUsers } from '../api/user.api'
import { getFriendsList, sendFriendRequest } from '../api/friend.api'
import Avatar from './Avatar'

const RightPanel = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [sentIds, setSentIds] = useState([])

  const currentUserId = user?._id || user?.id

  const { data: allUsersData } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => getUsers({ limit: 20 }),
    enabled: !!user,
  })

  const { data: friends = [] } = useQuery({
    queryKey: ['friendsList'],
    queryFn: getFriendsList,
    enabled: !!user,
  })

  const sendRequestMutation = useMutation({
    mutationFn: (id) => sendFriendRequest(id),
    onSuccess: (_, id) => {
      toast.success('Friend request sent!')
      setSentIds((prev) => [...prev, id])
      queryClient.invalidateQueries({ queryKey: ['friendRequestsCount'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not send request.')
    },
  })

  const friendIds = new Set(friends.map((f) => f._id || f.id))

  const suggestions = (allUsersData?.users || [])
    .filter((u) => {
      const uid = u._id || u.id
      return uid !== currentUserId && !friendIds.has(uid) && !sentIds.includes(uid)
    })
    .slice(0, 5)

  if (!user) return null

  const profileUrl = `/user/${currentUserId}`

  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-[81px] h-fit flex flex-col gap-5 pt-2">

      {/* Logged-in User Summary */}
      <div className="flex items-center gap-3">
        <Link to={profileUrl}>
          <Avatar
            src={user.photo || user.profilePicture}
            firstName={user.firstName}
            lastName={user.lastName}
            size="md"
            className="ring-2 ring-border"
          />
        </Link>
        <div className="flex flex-col min-w-0">
          <Link
            to={profileUrl}
            className="text-sm font-bold text-primary hover:underline truncate"
          >
            {user.firstName} {user.lastName}
          </Link>
          <span className="text-xs text-secondary truncate">
            {user.bio || user.email}
          </span>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wide">
              Suggested for you
            </span>
            <Link
              to="/people"
              className="text-xs font-bold text-primary hover:text-secondary transition-colors"
            >
              See all
            </Link>
          </div>

          <div className="flex flex-col gap-3.5">
            {suggestions.map((person) => {
              const personId = person._id || person.id
              const isSent = sentIds.includes(personId)

              return (
                <div key={personId} className="flex items-center gap-3">
                  <Link to={`/user/${personId}`} className="flex-shrink-0">
                    <Avatar
                      src={person.profilePhoto?.url || person.photo}
                      firstName={person.firstName}
                      lastName={person.lastName}
                      size="sm"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/user/${personId}`}
                      className="text-xs font-bold text-primary hover:underline truncate block"
                    >
                      {person.firstName} {person.lastName}
                    </Link>
                    <span className="text-[11px] text-secondary truncate block">
                      {person.bio
                        ? person.bio.slice(0, 28) + (person.bio.length > 28 ? '…' : '')
                        : 'Suggested for you'}
                    </span>
                  </div>

                  <button
                    onClick={() => !isSent && sendRequestMutation.mutate(personId)}
                    disabled={isSent || sendRequestMutation.isPending}
                    className={`flex-shrink-0 text-xs font-bold transition-colors cursor-pointer
                      ${isSent
                        ? 'text-success cursor-default flex items-center gap-1'
                        : 'text-accent hover:text-accent/70'
                      }`}
                  >
                    {isSent ? (
                      <>
                        <UserCheck size={13} />
                        <span>Sent</span>
                      </>
                    ) : (
                      'Follow'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </aside>
  )
}

export default RightPanel
