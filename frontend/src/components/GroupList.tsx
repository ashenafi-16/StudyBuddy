import { useEffect, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

interface GroupListProps {
  searchQuery?: string;
}

function GroupList({ searchQuery = "" }: GroupListProps) {
  const { getAllGroupContacts, allContacts = [], setSelectedUser, selectedUser, isUsersLoading, onlineUsers } = useChatStore();

  useEffect(() => {
    getAllGroupContacts();
  }, [getAllGroupContacts]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allContacts;
    const q = searchQuery.toLowerCase();
    return allContacts.filter((c) =>
      c.group_name?.toLowerCase().includes(q)
    );
  }, [allContacts, searchQuery]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!allContacts || allContacts.length === 0) return <NoChatsFound message="No groups found" />;

  return (
    <div className="space-y-0.5">
      {filteredGroups.map((contact) => {
        const isActive = selectedUser?.id === contact.id;
        const onlineMemberCount = contact.members?.filter(
          (m: any) => onlineUsers instanceof Set && onlineUsers.has(m.id)
        ).length || 0;

        return (
          <button
            key={contact.id}
            className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive
                ? "bg-indigo-600/15 border border-indigo-500/20"
                : "bg-transparent hover:bg-white/[0.03] border border-transparent"
              }`}
            onClick={() => setSelectedUser(contact)}
          >
            {/* Group Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-11 h-11 rounded-full overflow-hidden ring-2 transition-all duration-300 ${isActive ? 'ring-indigo-500/30' : 'ring-white/[0.06] group-hover:ring-white/10'
                }`}>
                {contact.group_profile_pic ? (
                  <img
                    src={contact.group_profile_pic}
                    alt={contact.group_name || "Group"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {(contact.group_name || 'G').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-[13.5px] font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                  {contact.group_name || "Untitled Group"}
                </h4>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className={`text-[12px] ${isActive ? 'text-indigo-300/70' : 'text-slate-500'}`}>
                  {contact.total_members ?? 0} members
                </p>
                {onlineMemberCount > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <p className="text-[12px] text-emerald-400/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {onlineMemberCount} online
                    </p>
                  </>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default GroupList;