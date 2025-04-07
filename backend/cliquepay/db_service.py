import uuid
from .models import *
from django.db.models import Exists, OuterRef, Subquery, Count, F 


class DatabaseService:
    @staticmethod
    def create_user(cognito_id, name, email, full_name, phone_number=None):
        """
        Create a new user record in the database
        
        Args:
            cognito_id (str): Cognito user ID
            name (str): Username
            email (str): User's email address
            full_name (str): User's full name
            phone_number (str, optional): User's phone number in international format
            
        Returns:
            dict: Status of the creation operation
        """
        try:
            user = User.objects.create(
                id=str(uuid.uuid4()),
                cognito_id=cognito_id,
                name=name,
                full_name=full_name,
                email=email,
                phone_number=phone_number
            )
            return {
                'status': 'SUCCESS',
                'message': 'User created successfully',
                'user_id': user.id,
                'user_data': {
                    'name': user.name,
                    'full_name': user.full_name,
                    'email': user.email,
                    'phone_number': user.phone_number
                }
            }
        except Exception as e:
            print(e)
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def get_user_by_cognito_id(cognito_id):
        """
        Retrieve user info by Cognito ID
        
        Args:
            cognito_id (str): Cognito user ID
            
        Returns:
            dict: User data or error message
        """
        try:
            user = User.objects.get(cognito_id=cognito_id)
            return {
                'status': 'SUCCESS',
                'user_data': {
                    'id': user.id,
                    'username': user.name,
                    'full_name': user.full_name,
                    'email': user.email,
                    'phone_number': user.phone_number,
                    'created_at': user.created_at,
                    'updated_at': user.updated_at,
                    'currency' : user.currency,
                    'profile_photo' : user.avatar_url,
                }
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        
    @staticmethod
    def get_user_friends(user_id):
        """
        Get all friends efficiently using a single query
        """
        try:
            user = User.objects.get(cognito_id=user_id)
            friendships = Friendship.objects.filter(
                models.Q(user1=user) | models.Q(user2=user)
            ).select_related('user1', 'user2', 'action_user')

            friends_list = []
            for friendship in friendships:
                friend = friendship.user2 if friendship.user1.id == user.id else friendship.user1
                if(friendship.status == 'BLOCKED' or friendship.status == 'blocked'):
                    friends_list.append({
                        'friend_id': "null",
                        'friend_name': friend.full_name,
                        'email': "null",
                        'profile_photo': friend.avatar_url,
                        'status': friendship.status,
                        'initiator': friendship.action_user.id == user_id,
                        'created_at': friendship.created_at
                    })
                else:
                    friends_list.append({   
                        'friend_id': friend.id,
                        'friend_name': friend.full_name,
                        'email': friend.email,
                        'profile_photo': friend.avatar_url,
                        'status': friendship.status,
                        'initiator': friendship.action_user.id,
                        'created_at': friendship.created_at,
                        'friendship_id': friendship.id
                    })

            return {
                'status': 'SUCCESS',
                'friends': friends_list
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }

    @staticmethod
    def update_user_details(cognito_id, full_name=None, phone_number=None, avatar_url=None, currency=None):
        """
        Update user fields (full_name, phone_number, avatar_url, currency, etc.)
        based on kwargs only if they exist.
        """
        try:
            user = User.objects.get(cognito_id=cognito_id)

            # Update only the fields provided:
            if full_name:
                user.full_name = full_name
            if phone_number:
                user.phone_number = phone_number
            if avatar_url:
                user.avatar_url = avatar_url
            if currency:
                user.currency = currency

            user.save()
            return {
                'status': 'SUCCESS',
                'message': 'User updated successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def send_friend_request(user_id, **kwargs):
        """
        Send friend request on behalf of the user_id provided.
        
        Args:
            user_id (str): ID of the user sending the request
            kwargs: Either recieve_username or recieve_useremail to identify recipient
            
        Returns:
            dict: Status of the friend request operation
        """
        try:
            user = User.objects.get(id=user_id)
            # Add at the start of the function
            if ('recieve_username' in kwargs and kwargs['recieve_username'] == user.name) or \
               ('recieve_useremail' in kwargs and kwargs['recieve_useremail'] == user.email):
                return {
                    'status': 'ERROR',
                    'message': 'Cannot send friend request to yourself'
                }

            if 'recieve_username' in kwargs:
                user2 = User.objects.get(name=kwargs['recieve_username'])
            elif 'recieve_useremail' in kwargs:
                user2 = User.objects.get(email=kwargs['recieve_useremail'])
            else:
                return {
                    'status': 'ERROR',
                    'message': 'Invalid request: must provide username or email'
                }

            # Check if friendship already exists
            existing_friendship = Friendship.objects.filter(
                (models.Q(user1=user) & models.Q(user2=user2)) |
                (models.Q(user1=user2) & models.Q(user2=user))
            ).first()

            if existing_friendship:
                if existing_friendship.status == 'ACCEPTED':
                    return {
                        'status': 'ERROR',
                        'message': 'Friendship already exists'
                    }
                else:
                    return {
                        'status': 'PENDING',
                        'message': 'Friend request is pending'
                    }
            sender = user  # Original user sending request
            recipient = user2  # Original user receiving request

            # Create ordered user variables for DB constraint
            if sender.id < recipient.id:
                user1, user2 = sender, recipient
            else:
                user1, user2 = recipient, sender

            # Create new friendship request
            friendship = Friendship.objects.create(
                user1=user1,
                user2=user2,
                action_user=sender,
                status='PENDING'
            )

            friend = recipient

            return {
                'status': 'SUCCESS',
                'message': 'Friend request sent successfully',
                    'friendship': {
                        'id': friendship.id,
                        'friend_name': friend.full_name,
                        'username': friend.name,
                        'profile_photo': friend.avatar_url,
                        'status': friendship.status,
                        'created_at': friendship.created_at
                    }

            }

        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def get_user_id_by_cognito_id(cognito_id):
        """
        Get user ID from Cognito ID
        
        Args:
            cognito_id (str): Cognito user ID
            
        Returns:
            dict: User ID or error message
        """
        try:
            user = User.objects.get(cognito_id=cognito_id)
            return {
                'status': 'SUCCESS',
                'user_id': user.id
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }

    @staticmethod
    def accept_friend_request(cognito_id, request_id):
        """
        Accept friend request from the cognito account
        provided in args.

        Args:
            cognito_id (str) : Cognito user ID
            request_id (str) : Friendship model ID
        Returns: 
            dict: Status of friend request acceptance 
        """

        try:
            user = User.objects.get(cognito_id=cognito_id)
            friendship = Friendship.objects.get(id=request_id)

            # Verify the user is the recipient of the friend request
            if friendship.action_user.id == user.id:
                return {
                    'status': 'ERROR',
                    'message': 'User not authorized to accept this friend request'
                }

            # Verify the request is pending
            if friendship.status != 'PENDING':
                return {
                    'status': 'ERROR',
                    'message': f'Friend request is not pending, current status: {friendship.status}'
                }

            # Accept the friend request
            friendship.status = 'ACCEPTED'
            friendship.save()

            return {
                'status': 'SUCCESS',
                'message': 'Friend request accepted successfully'
            }

        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Friendship.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Friend request not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def get_username_by_email(email):
        """
        Get username from email address
        
        Args:
            email (str): User's email address
            
        Returns:
            dict: Username or error message
        """
        try:
            user = User.objects.get(email=email)
            return {
                'status': 'SUCCESS',
                'username': user.name
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }

    @staticmethod
    def block_user(cognito_id, blocked_id):
        """
        Block another user from the provided account

        Args:
            cognito_id (str): Cognito id of user who wants to block another user.
            blocked_id (str): id of the user being blocked.
            
        Returns:
            dict: Status of the friend block operation
        """
        try:
            # Get both users
            user = User.objects.get(cognito_id=cognito_id)
            blocked_user = User.objects.get(id=blocked_id)

            if(user.id == blocked_user.id):
                return {
                    'status': 'ERROR',
                    'message': 'Cannot block yourself'
                }

            # Check if a friendship record already exists (either pending, accepted, or previously blocked)
            friendship = Friendship.objects.filter(
                (models.Q(user1=user) & models.Q(user2=blocked_user)) |
                (models.Q(user1=blocked_user) & models.Q(user2=user))
            ).first()

            if friendship:
                if friendship.status == 'BLOCKED':
                    return {
                        'status': 'ERROR',
                        'message': 'User is already blocked'
                    }
                else:
                    # Update existing relationship status to BLOCKED
                    friendship.status = 'BLOCKED'
                    friendship.action_user = user
                    friendship.save()
                    return {
                        'status': 'SUCCESS',
                        'message': 'User blocked successfully'
                    }
            else:
                # No friendship record exists, so create a new one with BLOCKED status
                friendship = Friendship.objects.create(
                    user1=user,
                    user2=blocked_user,
                    action_user=user,
                    status='BLOCKED'
                )
                return {
                    'status': 'SUCCESS',
                    'message': 'User blocked successfully',
                    'friendship_id': friendship.id
                }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def update_profile_photo(cognito_id, photo_url):
        """
        Update user's profile photo URL
        
        Args:
            cognito_id (str): Cognito user ID
            photo_url (str): URL of the uploaded profile photo
            
        Returns:
            dict: Status of the update operation
        """
        try:
            user = User.objects.get(cognito_id=cognito_id)
            user.avatar_url = photo_url
            user.save()
            
            return {
                'status': 'SUCCESS',
                'message': 'Profile photo updated successfully',
                'user_data': {
                    'profile_photo': user.avatar_url
                }
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def get_direct_messages(cognito_id, page=1, page_size=50):
        '''
        Get user DMs, new and old, with pagination.
        
        Args:
            cognito_id (str): Cognito user ID
            page (int): Page number for pagination (default 1)
            page_size (int): Number of messages per page (default 50)
        Returns:
            dict: Status of the get operation with paginated messages
        '''
        try:
            user = User.objects.get(cognito_id=cognito_id)
            
            # Get total messages for pagination
            total_messages = DirectMessage.objects.filter(
                models.Q(sender=user) | models.Q(recipient=user)
            ).count()
            
            total_pages = (total_messages + page_size - 1) // page_size
            
            # Apply proper pagination with ordering
            start_idx = (page - 1) * page_size
            
            # Order messages by newest first (most chat interfaces show newest messages first)
            messages = DirectMessage.objects.filter(
                models.Q(sender=user) | models.Q(recipient=user)
            ).select_related('sender', 'recipient').order_by('-created_at')[start_idx:start_idx+page_size]

            messages_list = []

            for message in messages:
                messages_list.append({
                    'message_id': message.id,
                    'sender_id': message.sender.id,
                    'sender_name': message.sender.full_name,
                    'recipient_id': message.recipient.id,
                    'recipient_name': message.recipient.full_name,
                    'content': message.content,
                    'message_type': message.message_type,
                    'file_url': message.file_url,
                    'created_at': message.created_at,
                    'is_read': message.is_read,
                    'read_at': message.read_at
                })
                
            pagination = {
                'current_page': page,
                'total_pages': total_pages,
                'page_size': page_size,
                'total_messages': total_messages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            }

            return {
                'status': 'SUCCESS',
                'messages': messages_list,
                'pagination': pagination
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def get_group_messages(cognito_id, group_id, page=1, page_size=50):
        '''
        Get group messages with pagination

        Args:
            cognito_id (str): Cognito user ID
            group_id(str): Group Id
            page (int): Page number for pagination
            page_size (int): Number of messages per page
        '''
        try:
            user = User.objects.get(cognito_id=cognito_id)
            group = Group.objects.get(id=group_id)
            
            # Check if user is a member
            is_member = GroupMember.objects.filter(user=user, group=group).exists()
            if not is_member:
                return {
                    'status': 'ERROR',
                    'message': 'User is not a member of the group'
                }
                
            # Get total messages for pagination
            total_messages = GroupMessage.objects.filter(group=group).count()
            total_pages = (total_messages + page_size - 1) // page_size
            
            # Apply proper pagination with ordering
            start_idx = (page - 1) * page_size
            
            # Order messages by newest first (more typical for chat interfaces)
            messages = GroupMessage.objects.filter(group=group) \
                .select_related('sender', 'group') \
                .order_by('-created_at')[start_idx:start_idx+page_size]
            
            # Get read receipt for efficient status checking
            try:
                read_receipt = GroupReadReceipt.objects.get(user=user, group=group)
                last_read_time = read_receipt.last_read_message.created_at
            except GroupReadReceipt.DoesNotExist:
                last_read_time = None
            
            message_list = []
            unread_count = 0
            
            for message in messages:
                # A message is read if it's older than the last read message or user is sender
                is_read = False  # Default to unread
                if last_read_time and message.created_at <= last_read_time:
                    is_read = True  # Message is read if it's older than the last read message
                elif message.sender.id == user.id:
                    is_read = True  # Messages sent by the user are always considered read
                        
                if not is_read and message.sender.id != user.id:
                    unread_count += 1
                    
                message_list.append({
                    'message_id': message.id,
                    'sender_id': message.sender.id,
                    'sender_name': message.sender.full_name,
                    'group_id': message.group.id,
                    'group_name': message.group.name,
                    'content': message.content,
                    'message_type': message.message_type,
                    'file_url': message.file_url,
                    'created_at': message.created_at,
                    'is_deleted': message.is_deleted,
                    'is_read': is_read
                })
                
            pagination = {
                'current_page': page,
                'total_pages': total_pages,
                'page_size': page_size,
                'total_messages': total_messages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            }
                
            return {
                'status': 'SUCCESS',
                'messages': message_list,
                'pagination': pagination,
                'unread': unread_count
            }
                
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def send_direct_message(sender_id, recipient_id, content, message_type, file_url=None):
        '''
        Send a direct message to another user.
        Args:
            sender_id (str): ID of the sender
            recipient_id (str): ID of the recipient
            content (str): Message content
            message_type (str): Type of message (text, image, )
            file_url (str, optional): URL of the file being sent
        Returns:
            dict: Status of the send operation
        '''
        try:
                sender = User.objects.get(cognito_id=sender_id)
                recipient = User.objects.get(id=recipient_id)
                if(sender.id == recipient.id):
                    return {
                        'status': 'ERROR',
                        'message': 'Cannot send message to yourself'
                    }
                relation = Friendship.objects.filter(   
                    ((models.Q(user1=sender) & models.Q(user2=recipient)) or
                    (models.Q(user1=recipient) & models.Q(user2=sender))) and
                    models.Q(status='Accepted' or 'accepted')
                )

                if(relation):
                    message = DirectMessage.objects.create(
                        sender=sender,
                        recipient=recipient,
                        content=content,
                        message_type=message_type,
                        file_url=file_url
                    )
                    return {
                        'status': 'SUCCESS',
                        'message': 'Direct message sent successfully',
                        'message_id': message.id
                    }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def search_users(cognito_id, search_term, limit=15):
        '''
        Search for users by username, email or full name.
        Args:
            cognito_id (str): Cognito user ID
            search_term (str): Search term
            limit (int, optional): Maximum number of results to return
        Returns:
            dict: Status of the search operation
        '''
        try:
            user = User.objects.get(cognito_id=cognito_id)

            # Find users matching search criteria
            users = User.objects.filter(
                models.Q(name__icontains=search_term) |
                models.Q(email__icontains=search_term) |
                models.Q(full_name__icontains=search_term)
            ).exclude(id=user.id)[:limit]

            # Annotate each user with friendship status
            users = users.annotate(
                is_friend=Exists(
                    Friendship.objects.filter(
                        # The outerRef here refrences the user in the main query
                        (models.Q(user1=OuterRef('pk')) & models.Q(user2=user)) |
                        (models.Q(user1=user) & models.Q(user2=OuterRef('pk')))
                    )
                )
            )[:limit]

            # Then map results to dictionaries
            users_list = [{
                'user_id': u.id,
                'username': u.name,
                'full_name': u.full_name,               
                'profile_photo': u.avatar_url,
                'is_friend': u.is_friend
            } for u in users]
            return {
                'status': 'SUCCESS',
                'users': users_list
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
        
    @staticmethod
    def reject_friend_request(cognito_id, request_id):
        """
        Reject friend request from the cognito account
        provided in args.

        Args:
            cognito_id (str) : Cognito user ID
            request_id (str) : Friendship model ID
        Returns: 
            dict: Status of friend request rejection 
        """

        try:
            user = User.objects.get(cognito_id=cognito_id)
            friendship = Friendship.objects.select_related('user1', 'user2').get(id= request_id)

            if friendship.user1 != user and friendship.user2 != user:
                return {
                    'status': 'ERROR',
                    'message': 'User not authorized to reject this friend request'
                }

            if friendship.status != 'PENDING':
                return {
                    'status': 'ERROR',
                    'message': f'Friend request is not pending, current status: {friendship.status}'
                }

            friendship.delete()

            return {
                'status': 'SUCCESS',
                'message': 'Friend request rejected successfully'
            }

        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Friendship.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Friend request not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod
    def remove_friend(cognito_id, friendship_id, block):
        """
        Remove a friend connection between two users.
        and block them if block is True
        Args:
            cognito_id (str): Cognito ID of the user initiating the removal
            friendship_id (str): Friendship model ID
            block (bool): Block the user after removal
        Returns:
            dict: Status of the friend removal operation
        """
        try:
            user = User.objects.get(cognito_id=cognito_id)
            friendship = Friendship.objects.filter(id=friendship_id).select_related('user1', 'user2').first()
            if friendship:
                if friendship.user1 == user or friendship.user2 == user:
                    if block:
                        friendship.status = 'BLOCKED'
                        friendship.save()
                    else:
                        friendship.delete()
                    return {
                        'status': 'SUCCESS',
                        'message': 'Friend removed successfully'
                    }
                else:
                    return {
                        'status': 'ERROR',
                        'message': 'User not authorized to remove this friend'
                    }
            else:
                return {
                    'status': 'ERROR',
                    'message': 'Friendship not found'
                }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
        
    @staticmethod
    def get_group_info(user_sub, group_id):
        """
        Get the group info along with members and pending invites.
        requires user passed in to be a member of the group.
        Args:
            user_sub(str): Cognito ID of the user requesting info.
            group_id(str): ID of requested group.
        Returns: 
            dict: operation status and info if successful. 
        """
        try:
            # First, get the user
            user = User.objects.get(cognito_id=user_sub)
            # Check if the user has access to group
            if not GroupMember.objects.filter(user=user, group_id=group_id).exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not a member of this group'
                }

            group = Group.objects.get(id=group_id)
            members = group.members.all().select_related('user')
            group_members = []
            
            for member in members:
                data_payload = {
                    'user_id' : member.user.id,
                    'username': member.user.name,
                    'full_name': member.user.full_name,
                    'profile_photo': member.user.avatar_url,
                    'phone_number': member.user.phone_number,
                    'role' : member.role,
                    'joined_at': member.joined_at,
                    'status': 'member'
                }
                group_members.append(data_payload)
            
            # Get pending invitations for this group
            invitations = GroupInvitation.objects.filter(group=group).select_related('invited_user')
            invited_users = []
            
            for invite in invitations:
                invited_users.append({
                    'user_id': invite.invited_user.id,
                    'username': invite.invited_user.name,
                    'full_name': invite.invited_user.full_name,
                    'profile_photo': invite.invited_user.avatar_url,
                    'invited_at': invite.created_at,
                    'invited_by': invite.invited_by.id,
                    'invite_id': invite.id,
                    'status': 'invited'
                })
            
            group_data = {
                'group_name' : group.name,
                'group_id': group.id,
                'description': group.description,
                'created_at': group.created_at,
                'photo_url': group.photo_url,
                'group_size': len(members),
                'created_by': group.created_by.id
            }

            return {
                'status' : 'SUCCESS',
                'group_info': group_data,
                'group_members' : group_members,
                'invited_users': invited_users
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def create_group(user_sub, group_name, group_description=None):
        """
        Create a new group and add the user who created it as an adnub.
        Args:
            user_sub (str): Cognito ID of the user creating the group
            group_name (str): Name of the new group
        Returns:
            dict: Status of the group creation operation
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            group = Group.objects.create(
                name=group_name,
                created_by=user,
                description = group_description
            )
            GroupMember.objects.create(
                user=user,
                group=group,
                role='admin'
            )
            return {
                'status': 'SUCCESS',
                'message': 'Group created successfully',
                'group_id': group.id
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    # REMINDER: COMPLETE BELOW COMMENTED METHOD AFTER GROUP_EXPENSES ARE DONE.
    # @staticmethod
    # def delete_group(user_sub, group_id):

    @staticmethod
    def invite_to_group(user_sub, invited_id, group_id):
        """
        (Only admins can invite)
        Invite a user to your group using their id.
        Args:
            user_sub (str): Cognito ID of the user inviting
            invited_id (str): ID of the user being invited
            group_id (str): ID of the group
        Returns:
            dict: status of invite operation.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            invited_user = User.objects.get(id=invited_id)
            group = Group.objects.get(id=group_id)

            # Check if the user is an admin of the group
            if not GroupMember.objects.filter(user=user, group=group, role='admin').exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not an admin of this group'
                }

            # Check if the invited user is already a member of the group
            if GroupMember.objects.filter(user=invited_user, group=group).exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is already a member of this group'
                }

            # Create a new invitation
            invitation = GroupInvitation.objects.create(
                group=group,
                invited_user=invited_user,
                invited_by=user
            )

            return {
                'status': 'SUCCESS',
                'message': 'User invited to the group successfully',
                'invitation_id': invitation.id
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    @staticmethod    
    def leave_group(user_sub, group_id):
        """
        Leave a group using the group ID.
        Args:
            user_sub (str): Cognito ID of the user leaving the group
            group_id (str): ID of the group
        Returns:
            dict: status of leave operation.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            group = Group.objects.get(id=group_id)

            # Check if the user is a member of the group
            if not GroupMember.objects.filter(user=user, group=group).exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not a member of this group'
                }

            # Remove the user from the group
            GroupMember.objects.filter(user=user, group=group).delete()

            return {
                'status': 'SUCCESS',
                'message': 'User left the group successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return{
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status' : 'ERROR',
                'message' : str(e)
            }
        
    @staticmethod
    def get_user_groups(user_sub):
        """
        Returns the groups in which the user is a member in.
        Args:
            user_sub (str): Cognito ID of the user.
        Returns:
            dict: dict of grps.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            
            # Get the user's groups and prefetch member counts in one query
            user_groups = Group.objects.filter(members__user=user).annotate(
                members_count=Count('members', distinct=True),
                user_role=F('members__role')  # Get the user's role in each group
            ).distinct()
            
            # Get groups with latest message info
            group_ids = list(user_groups.values_list('id', flat=True))
            
            # Get latest message for each group in a single query
            latest_messages = {}
            if group_ids:
                messages_query = GroupMessage.objects.filter(group_id__in=group_ids)
                
                # Find the most recent message for each group
                for group_id in group_ids:
                    group_messages = messages_query.filter(group_id=group_id).order_by('-created_at')[:1]
                    if group_messages:
                        latest_messages[group_id] = {
                            'content': group_messages[0].content,
                            'created_at': group_messages[0].created_at
                        }
            
            # Get unread counts in bulk
            unread_counts = {}
            if group_ids:
                # Optional: Get read receipts in bulk
                read_receipts = {
                    receipt.group_id: receipt.last_read_message.created_at
                    for receipt in GroupReadReceipt.objects.filter(
                        user=user, group_id__in=group_ids
                    ).select_related('last_read_message')
                }
                
                # Calculate unread counts per group
                for group_id in group_ids:
                    read_time = read_receipts.get(group_id)
                    query = GroupMessage.objects.filter(group_id=group_id).exclude(sender=user)
                    if read_time:
                        query = query.filter(created_at__gt=read_time)
                    unread_counts[group_id] = query.count()
            
            # Build the result list
            groups_list = []
            for group in user_groups:
                group_id = group.id
                groups_list.append({
                    'group_id': group_id,
                    'group_name': group.name,
                    'created_at': group.created_at,
                    'photo_url': group.photo_url,
                    'description': group.description,
                    'role': group.user_role,
                    'last_message': latest_messages.get(group_id, {}).get('content'),
                    'last_message_time': latest_messages.get(group_id, {}).get('created_at'),
                    'unread_count': unread_counts.get(group_id, 0),
                    'members_count': group.members_count
                })
            
            return {
                'status': 'SUCCESS',
                'groups': groups_list
            }
        except User.DoesNotExist:
            return {'status': 'ERROR', 'message': 'User not found'}
        except Exception as e:
            return {'status': 'ERROR', 'message': str(e)}

    @staticmethod
    def accept_group_invite(user_sub, invite_id):
        """
        Accept a group invite using the invite ID.
        Args:
            user_sub (str): Cognito ID of the user accepting the invite
            invite_id (str): ID of the group invitation
        Returns:
            dict: status of accept operation.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            invitation = GroupInvitation.objects.get(id=invite_id)

            # Check if the invited user is the one accepting the invite
            if invitation.invited_user != user:
                return {
                    'status': 'ERROR',
                    'message': 'User not authorized to accept this invitation'
                }

            # Check if the group already has the user as a member
            if GroupMember.objects.filter(user=user, group=invitation.group).exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is already a member of this group'
                }

            # Add the user to the group
            GroupMember.objects.create(
                user=user,
                group=invitation.group,
                role='member'
            )

            # Delete the invitation after acceptance
            invitation.delete()

            return {
                'status': 'SUCCESS',
                'message': 'Group invitation accepted successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except GroupInvitation.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group invitation not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def reject_group_invite(user_sub, invite_id):
        """
        Reject group invite by group ID.

        Args:
            user_sub (str): Cognito ID of the user rejecting the invite
            invite_id (str): ID of the invitation
        Returns:
            dict: status of reject operation.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            invitation = GroupInvitation.objects.get(id=invite_id)

            # Check if the invited user is the one rejecting the invite
            if invitation.invited_user != user:
                return {
                    'status': 'ERROR',
                    'message': 'User not authorized to reject this invitation'
                }

            # Delete the invitation
            invitation.delete()

            return{
                'status': 'SUCCESS',
                'message': 'Group invitation rejected successfully'
            }
        except GroupInvitation.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group invitation not found'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
        
    @staticmethod
    def get_user_invites(user_sub):
        """
        Get the group invites for a user using the cognito ID.

        Args:
            user_sub(str): cognito ID of the user.
        Returns:
            dict: invites dict and status of the operation.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            invitations = GroupInvitation.objects.filter(invited_user=user).select_related('group')
            invites_list = []

            for invite in invitations:
                invites_list.append({
                    'invite_id': invite.id,
                    'group_id': invite.group.id,
                    'group_name': invite.group.name,
                    'created_at': invite.created_at,
                    'photo_url': invite.group.photo_url,
                    'description': invite.group.description
                })
            
            return{
                'status':'SUCCESS',
                'invites': invites_list
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def cancel_group_invite(user_sub, invite_id):
        """
        Cancel invite before the invitee takes any aciton.

        Args:
            user_sub(str): cognito id of the user who sent the invite.
            invite_id(str): invititation id.
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            invitation = GroupInvitation.objects.get(id=invite_id)
            # Check if the user is the one who sent the invitation
            if invitation.invited_by != user:
                return {
                    'status': 'ERROR',
                    'message': 'User not authorized to cancel this invitation'
                }
            
            # Delete the invitation
            invitation.delete()
            return{
                'status' : 'SUCCESS',
                'message' : 'Group invitation cancelled successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except GroupInvitation.DoesNotExist:
            return{
                'status': 'ERROR',
                'message': 'Group invitation not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def send_group_message(sender_id, group_id, content, message_type, file_url=None):
        """
        Send a message to a group.
        
        Args:
            sender_id (str): ID of the sender
            group_id (str): ID of the group
            content (str): Message content
            message_type (str): Type of message (text, image, etc.)
            file_url (str, optional): URL of the file being sent
        
        Returns:
            dict: Status of the send operation
        """
        try:
            sender = User.objects.get(cognito_id=sender_id)
            group = Group.objects.get(id=group_id)

            # Check if the user is a member of the group
            if not GroupMember.objects.filter(user=sender, group=group).exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not a member of this group'
                }

            message = GroupMessage.objects.create(
                sender=sender,
                group=group,
                content=content,
                message_type=message_type,
                file_url=file_url
            )
            # Update last message of the user
            try:
                read_receipt, created = GroupReadReceipt.objects.get_or_create(
                    user=sender,
                    group=group,
                    defaults={'last_read_message': message}
                )
                if not created:
                    read_receipt.last_read_message = message
                    read_receipt.save()
                    
            except Exception as e:
                # Just log the error but don't fail the message sending
                print(f"Error updating read receipt: {str(e)}")

            return {
                'status': 'SUCCESS',
                'message': 'Group message sent successfully',
                'message_id': message.id
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
        
    @staticmethod
    def search_invite(user_sub, group_id, search_term):
        """
        Search for users to invite to a group.
        
        Args:
            user_sub (str): Cognito ID of the user searching
            group_id (str): ID of the group
            search_term (str): Search term for username or email
        
        Returns:
            dict: Status of the search operation and list of users found
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            group = Group.objects.get(id=group_id)

            # Check if the user is an admin of the group
            if not GroupMember.objects.filter(user=user, group=group, role='admin').exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not an admin of this group'
                }

            # Find users matching search criteria
            users = User.objects.filter(
                models.Q(name__icontains=search_term) |
                models.Q(email__icontains=search_term) |
                models.Q(full_name__icontains=search_term)
            ).exclude(
                models.Q(id=user.id) | 
                models.Q(id__in=Subquery(
                    GroupMember.objects.filter(group_id=group_id).values('user__id')
                ))
            )[:15]

            # Map results to dictionaries
            users_list = [{
                'user_id': u.id,
                'username': u.name,
                'full_name': u.full_name,
                'profile_photo': u.avatar_url
            } for u in users]

            return {
                'status': 'SUCCESS',
                'users': users_list
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def delete_group(user_sub, group_id):
        '''
        Verifies if the user is an admin and deletes the group.

        Args:
            user_sub(str): cognito id of the user,
            group_id(str): id of the group to be deleted
        Returns:
            dict: dict with status of the delete operation.
        '''
        try:
            user = User.objects.get(cognito_id=user_sub)
            group = Group.objects.get(id=group_id)
    
            if not GroupMember.objects.filter(user=user, group=group, role='admin').exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not an admin of this group'
                }
            
            # Delete all group members and messages
            GroupMember.objects.filter(group=group).delete()
            GroupMessage.objects.filter(group=group).delete()

            GroupInvitation.objects.filter(group=group).delete()
            # Delete the group itself
            group.delete()

            return {
                'status' : 'SUCCESS',
                'message' : 'Group deleted successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return{
                'status': 'ERROR',
                'message': 'Group not found'
            }
    
    @staticmethod
    def edit_group(user_sub, group_id, group_name=None, group_description=None):
        """
        Edit the group details.

        Args:
            user_sub (str): Cognito ID of the user editing the group
            group_id (str): ID of the group
            group_name (str, optional): New name for the group
            group_description (str, optional): New description for the group
        
        Returns:
            dict: Status of the edit operation
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            group = Group.objects.get(id=group_id)

            # Check if the user is an admin of the group
            if not GroupMember.objects.filter(user=user, group=group, role='admin').exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not an admin of this group'
                }

            # Update group details
            if group_name:
                group.name = group_name
            if group_description:
                group.description = group_description
            group.save()

            return {
                'status': 'SUCCESS',
                'message': 'Group details updated successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    
    @staticmethod
    def remove_from_group(user_sub, group_id, user_id):
        """
        Remove a user from a group only if the method id called by group admin.

        Args:
            user_sub (str): Cognito ID of the user performing the action
            group_id (str): ID of the group
            user_id (str): ID of the user to be removed
        
        Returns:
            dict: Status of the removal operation
        """
        try:
            user = User.objects.get(cognito_id=user_sub)
            group = Group.objects.get(id=group_id)
            member_to_remove = User.objects.get(id=user_id)

            # Check if the user is an admin of the group
            if not GroupMember.objects.filter(user=user, group=group, role='admin').exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not an admin of this group'
                }

            # Check if the member to remove is part of the group
            if not GroupMember.objects.filter(user=member_to_remove, group=group).exists():
                return {
                    'status': 'ERROR',
                    'message': 'User is not a member of this group'
                }

            # Remove the member from the group
            GroupMember.objects.filter(user=member_to_remove, group=group).delete()

            return {
                'status': 'SUCCESS',
                'message': 'User removed from the group successfully'
            }
        except User.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except Group.DoesNotExist:
            return {
                'status': 'ERROR',
                'message': 'Group not found'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }