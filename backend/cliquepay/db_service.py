import uuid
from .models import *

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
            user = User.objects.get(id=user_id)
            friendships = Friendship.objects.filter(
                models.Q(user1=user) | models.Q(user2=user)
            ).select_related('user1', 'user2', 'action_user')

            friends_list = []
            for friendship in friendships:
                friend = friendship.user2 if friendship.user1_id == user_id else friendship.user1
                friends_list.append({
                    'friend_id': friend.id,
                    'friend_name': friend.full_name,
                    'status': friendship.status,
                    'initiator': friendship.action_user.id == user_id,
                    'created_at': friendship.created_at
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
    def update_user_details(cognito_id, **kwargs):
        """
        Update user fields (full_name, phone_number, avatar_url, currency, etc.)
        based on kwargs only if they exist.
        """
        try:
            user = User.objects.get(cognito_id=cognito_id)

            # Update only the fields provided:
            if 'full_name' in kwargs:
                user.full_name = kwargs['full_name']
            if 'phone_number' in kwargs:
                user.phone_number = kwargs['phone_number']
            if 'currency' in kwargs:
                user.currency = kwargs['currency']

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

            # Create new friendship request
            friendship = Friendship.objects.create(
                user1=user,
                user2=user2,
                action_user=user,
                status='PENDING'
            )

            return {
                'status': 'SUCCESS',
                'message': 'Friend request sent successfully',
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
    def accept_friend_request(cognito_id, reqeust_id):
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
            friendship = Friendship.objects.get(id=reqeust_id)

            # Verify the user is the recipient of the friend request
            if friendship.user2 != user:
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
            friendship.action_user = user
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
    def remove_friend(cognito_id, friend_id):
        """
        Remove a friend connection between two users.
        
        Args:
            cognito_id (str): Cognito ID of the user initiating the removal
            friend_id (str): Database ID of the friend to remove
            
        Returns:
            dict: Status of the friend removal operation
        """
        try:
            # Get the user initiating the removal
            user = User.objects.get(cognito_id=cognito_id)
            
            # Get the friend to remove
            friend = User.objects.get(id=friend_id)
            
            # Find and delete the friendship
            friendship = Friendship.objects.filter(
                (models.Q(user1=user) & models.Q(user2=friend)) |
                (models.Q(user1=friend) & models.Q(user2=user))
            ).first()
            
            if not friendship:
                return {
                    'status': 'ERROR',
                    'message': 'Friendship not found'
                }
                
            if friendship.status != 'ACCEPTED':
                return {
                    'status': 'ERROR',
                    'message': f'Cannot remove friend - current status is {friendship.status}'
                }
            
            # Delete the friendship
            friendship.delete()
            
            return {
                'status': 'SUCCESS',
                'message': 'Friend removed successfully'
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