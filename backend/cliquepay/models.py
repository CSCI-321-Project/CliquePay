from django.db import models
from django.core.validators import RegexValidator
import uuid 
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
import asyncio
from .message_broker import broker

class User(models.Model):
    id = models.CharField(max_length=128, primary_key=True, unique=True)
    cognito_id = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(
        max_length=150, 
        help_text="User's full name (required)",
        default="Unnamed User"
    )
    name = models.CharField(max_length=100)  # username
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=16, 
        blank=True, 
        null=True,
        help_text="Optional phone number in international format"
    )
    avatar_url = models.URLField(
        default='https://storage.cloud.google.com/cliquepay_profile_photo_bucket/Default_pfp.jpg',
        blank=True
    )
    currency = models.CharField(max_length=10, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['name'], name='username_idx'),
            models.Index(fields=['full_name'], name='full_name_idx'),
            models.Index(fields=['email'], name='email_idx'),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    ]
    
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4, unique=True)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user1_friendships')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user2_friendships')
    status = models.CharField(max_length=8, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    action_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendship_actions')

    class Meta:
        db_table = 'friendships'
        constraints = [
            models.UniqueConstraint(
                fields=['user1', 'user2'],
                name='unique_friendship'
            ),
            models.CheckConstraint(
                check=models.Q(user1__lt=models.F('user2')),
                name='force_user_order'
            )
        ]

class Group(models.Model):
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4, unique=True)
    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    photo_url = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    class Meta:
        db_table = 'groups'

    def __str__(self):
        creator = self.created_by.full_name if self.created_by else "Deleted User"
        return f"{self.name} (Created by: {creator})"

class GroupMember(models.Model):
    id = models.AutoField(primary_key=True)
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('member', 'Member')
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    class Meta:
        db_table = 'group_members'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'group'],
                name='unique_group_membership'
            )        ]

    def __str__(self):
        return f"{self.user.full_name} in {self.group.name}"

class GroupInvitation(models.Model):
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4, unique=True)
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    invited_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_invitations'
    )
    invited_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_group_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'group_invitations'

class ChatMessage(models.Model):
    MESSAGE_TYPES = [
        ('TEXT', 'Text'),
        ('FILE', 'File'),
        ('IMAGE', 'Image'),
    ]
    
    id = models.CharField(max_length=128, primary_key=True, default=uuid.uuid4, unique=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    message_type = models.CharField(max_length=5, choices=MESSAGE_TYPES, default='TEXT')
    file_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        abstract = True

class DirectMessage(ChatMessage):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_direct_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'direct_messages'
        ordering = ['created_at']

@receiver(post_save, sender=DirectMessage)
def notify_message_created(sender, instance, created, **kwargs):
    """Trigger SSE event when a new message is created"""
    if created:  # Only for newly created messages
        # Prepare the message data
        message_data = {
            "event": "message",
            "data": {
                "type": "direct_message",
                "message": {
                    "message_id": str(instance.id),
                    "content": instance.content,
                    "message_type": instance.message_type,
                    "file_url": instance.file_url,
                    "timestamp": instance.created_at.isoformat(),
                    "is_read": instance.is_read
                },
                "sender": instance.sender.name,
                "sender_id": str(instance.sender.id)
            }
        }
        
        # Send to recipient's channel
        recipient_channel = f"user-{instance.recipient.id}"
        
        # Use async_to_sync since we're in a sync context
        async_to_sync(broker.publish)(recipient_channel, message_data)
        
        # Also send to sender's channel to update sent messages
        sender_channel = f"user-{instance.sender.id}"
        message_data["data"]["is_sent_by_me"] = True
        async_to_sync(broker.publish)(sender_channel, message_data)

class GroupMessage(ChatMessage):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_group_messages')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    # read_by = models.ManyToManyField(User, related_name='read_group_messages', blank=True)
    
    class Meta:
        db_table = 'group_messages'
        ordering = ['created_at']

@receiver(post_save, sender=GroupMessage)
def notify_group_message_created(sender, instance, created, **kwargs):
    """Trigger SSE events when a new group message is created"""
    if created:
        # Get all members of the group
        members = GroupMember.objects.filter(group=instance.group).select_related('user')
        
        # Prepare the message data
        message_data = {
            "event": "message",
            "data": {
                "type": "group_message",
                "message": {
                    "message_id": str(instance.id),
                    "content": instance.content,
                    "message_type": instance.message_type,
                    "file_url": instance.file_url,
                    "timestamp": instance.created_at.isoformat()
                },
                "sender": instance.sender.name,
                "sender_id": str(instance.sender.id),
                "group_id": str(instance.group.id),
                "group_name": instance.group.name
            }
        }
        
        # Send to each member's channel
        for member in members:
            user_channel = f"user-{member.user.id}"
            
            # Set if sent by current user
            message_data["data"]["is_sent_by_me"] = (member.user.id == instance.sender.id)
            
            async_to_sync(broker.publish)(user_channel, message_data)

class GroupReadReceipt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_receipts')
    last_read_message = models.ForeignKey(GroupMessage, on_delete=models.CASCADE, related_name='read_receipts')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='read_receipts')

    class Meta:
        db_table = 'group_read_receipts'
        unique_together = ('user', 'group')
        ordering = ['-last_read_message__created_at']

class Expense(models.Model):
    """
    Represents an expense paid by a user
    """
    id = models.CharField(max_length=128, primary_key=True, unique=True)
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True
    )

    friend = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True
    )   

    paid_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses_paid'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateTimeField(blank=True, null=True)
    receipt_url = models.URLField(blank=True, null=True)

    class Meta:
        db_table = 'expenses'

    def __str__(self):
        return f"{self.paid_by.full_name} paid ${self.amount} for {self.group.name}"
    

class ExpenseSplit(models.Model):
    """
    Represents a split of an expense between two users
    """

    id = models.CharField(max_length=128, primary_key=True, unique=True)
    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name='splits'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expense_splits'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expense_splits'
        unique_together = ['expense', 'user']

    def __str__(self):
        return f"{self.user.full_name} owes ${self.remaining_amount} for {self.expense.description}"