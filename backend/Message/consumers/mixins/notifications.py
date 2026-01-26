class NotificationMixin:
    async def send_notification(self, user_id, payload):
        await self.channel_layer.group_send(
            f"notifications_{user_id}",
            {"type": "notify", "payload": payload},
        )

    async def notify(self, event):
        await self.send_json({
            "type": "notification",
            "data": event["payload"]
        })
