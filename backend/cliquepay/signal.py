from django.db.models.signals import post_save
from django.dispatch import receiver
from django_eventstream import send_event
from .models import DirectMessage

@receiver(post_save, sender=DirectMessage)
def message_post_save(sender, instance, created, **kwargs):
    """Send SSE event when a new message is created"""
    if created:
        # Format the message data
        message_data = {
            'id': str(instance.id),
            'content': instance.content,
            'sender_id': instance.sender.id,
            'sender_name': instance.sender.full_name,
            'sender_avatar': instance.sender.avatar_url,
            'recipient_id': instance.recipient.id,
            'created_at': instance.created_at.isoformat(),
            'is_read': instance.is_read,
            'message_type': instance.message_type
        }
        
        # Send to sender's channel
        send_event(f'user-{instance.sender.id}', 'message', message_data)
        
        # Send to recipient's channel
        send_event(f'user-{instance.recipient.id}', 'message', message_data)