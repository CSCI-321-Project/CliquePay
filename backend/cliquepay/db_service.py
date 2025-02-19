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
            if 'avatar_url' in kwargs:
                user.avatar_url = kwargs['avatar_url']
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
