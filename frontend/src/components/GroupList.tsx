import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
// import { useAuth } from "../contexts/AuthContext";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";

function GroupList() {
  const { getAllGroupContacts, allContacts = [], setSelectedUser, isUsersLoading } = useChatStore();
  // const { user = [] } = useAuth();

  useEffect(() => {
    getAllGroupContacts();
  }, [getAllGroupContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (allContacts.length === 0) return <NoChatsFound message="No groups found" />;

  return (
    <>
      {allContacts.map((contact) => (
        <div
          key={contact.id || contact._id} // safeguard for _id or id
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors flex items-center gap-4 p-3 "
          onClick={() => setSelectedUser(contact)}
        >
          <div className="items-center gap-3">
            {/* <div className={`avatar ${onlineUsers.includes(contact.id || contact._id) ? "online" : "offline"}`}> */}
              <div className="size-14 rounded-full overflow-hidden">
                <img
                  src={contact.group_profile_pic || "/avatar.png"} 
                  alt={contact.group_name || contact.fullName || "Group"}
                />
              </div>
            </div>
            <div className="flex flex-col justify-center truncate">
              <h4 className="text-gray-900 font-semibold truncate">
                {contact.group_name || "Unnamed Group"}
              </h4>
              <span className="text-gray-500 text-sm">
                Total members: {contact.total_members ?? 0}
              </span>
            </div>
            
          </div>
        // </div>
      ))}
    </>
  );
}

export default GroupList;
