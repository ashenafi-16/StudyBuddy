class TypingMixin:
    async def handle_typing(self, conversation_id, user):
        print("⌨️ user typing:", user.id)

        await self.channel_layer.group_send(
            f"chat_{conversation_id}",
            {
                "type": "typing.event",
                "user_id": user.id,
                "username": user.full_name,
                "is_typing": True,
            },
        )

    async def typing_event(self, event):
        await self.send_json({
            "type": "typing",
            "user_id": event["user_id"],
            "username": event["username"],
            "is_typing": event["is_typing"],
        })




# class TypingMixin:
#     async def handle_typing(self, conversation_id, user):
#         await self.channel_layer.group_send(
#             f"chat_{conversation_id}",
#             {
#                 "type": "typing.event",
#                 "user_id": user.id,
#                 "username": user.full_name,
#             },
#         print("user typing-------------------------")
#         )

#     async def typing_event(self, event):
#         await self.send_json({
#             "type": "typing",
#             "user_id": event["user_id"],
#             "username": event["username"],
#         })
