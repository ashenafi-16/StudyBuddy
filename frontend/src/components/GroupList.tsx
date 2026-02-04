import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function GroupList() {
  const { getAllGroupContacts, allContacts = [], setSelectedUser, isUsersLoading } = useChatStore();

  useEffect(() => {
    getAllGroupContacts();
  }, [getAllGroupContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!allContacts || allContacts.length === 0) return <NoChatsFound message="No groups found" />;

  return (
    <div className="space-y-2">
      {allContacts.map((contact) => {
        const isActive = useChatStore.getState().selectedUser?.id === (contact.id || contact._id);

        return (
          <button
            key={contact.id || contact._id}
            className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${isActive
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-transparent text-slate-400 hover:bg-white/5"
              }`}
            onClick={() => setSelectedUser(contact)}
          >
            {/* Avatar (Soft) */}
            <div className="relative flex-shrink-0">
              <div className={`size-12 rounded-2xl overflow-hidden ring-1 ${isActive ? 'ring-white/20' : 'ring-white/5'}`}>
                <img
                  src={contact.group_profile_pic || "/avatar.png"}
                  alt={contact.group_name || "Group"}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`}
                />
              </div>
            </div>

            <div className="flex-1 text-left min-w-0">
              <h4 className="text-[14px] font-bold tracking-tight truncate group-hover:text-white transition-colors">
                {contact.group_name || "Untitled Group"}
              </h4>
              <p className={`text-[12px] font-medium truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-500 group-hover:text-slate-400'}`}>
                {contact.total_members ?? 0} Members
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default GroupList;