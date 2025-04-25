from rest_framework.reverse import reverse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.http import JsonResponse
from cliquepay.aws_cognito import CognitoService
from cliquepay.db_service import DatabaseService
from .serializers import *
from cliquepay.storage_service import CloudStorageService
from api.serializers import SearchUserSerializer, GetDirectMessagesBetweenUsersSerializer, GetDirectMessagesSerializer, GetGroupMessagesSerializer, InviteSearchListSerializer
import logging
from django.db import models
from datetime import datetime

logger = logging.getLogger(__name__)

@api_view(['GET'])
def api_root(request, format=None):
    """
    API root endpoint that provides links to all available endpoints
    """
    return Response({
        'endpoints': {
            'signup': {
                'url': reverse('register_user', request=request, format=format),
                'method': 'POST',
                'description': 'Register new user'
            },
            'verify': {
                'url': reverse('verify_signup', request=request, format=format),
                'method': 'POST',
                'description': 'Verify user email'
            },
            'resend-code': {
                'url': reverse('resend_code', request=request, format=format),
                'method': 'POST',
                'description': 'resend email verification code'
            },
            'login': {
                'url': reverse('user_login', request=request, format=format),
                'method': 'POST',
                'description': 'Log in user and get tokens',
                'tokens_provided': 'Refresh, Id, Access Tokens'
            },
            'refresh': {
                'url': reverse('renew_tokens', request=request, format=format),
                'method': 'POST',
                'description': 'Renew access and ID tokens using refresh token'
            },
            'logout': {
                'url': reverse('logout_user', request=request, format=format),
                'method': 'POST',
                'description': 'Logout the user by rendering the access and refresh tokens invalid'
            },
            'initiate-reset-password': {
                'url': reverse('initiate_reset_password', request=request, format=format),
                'method': 'POST',
                'description': 'Initiate password reset process if the user FORGOT password'
            },
            'confirm-reset-password': {
                'url': reverse('confirm_reset_password', request=request, format=format),
                'method': 'POST',
                'description': 'Confirm forgot-password reset with verification code'
            },
            'change-password': {
                'url': reverse('change_password', request=request, format=format),
                'method': 'POST',
                'description': 'Change the user password if they provide the old one.'
            },
            'get-user-friends': {
                'url': reverse('get_user_friends', request=request, format=format),
                'method': 'POST',
                'description': 'Extracts the user_sub from ID token,gets the user_id from database using user_sub and then makes a db query to get user friends using the user_id.'
            },
            'user-access': {
                'url': reverse('verify_user_access', request=request, format=format),
                'method': 'POST',
                'description': 'Posts the access token to aws and verfies if the user is registered.'
            },
            'user-profile': {
                'url': reverse('get_user_profile', request=request, format=format),
                'method': 'POST',
                'description': 'Gets the user details from the database.'
            },
            'update-user-profile': {
                'url': reverse('update_user_profile', request=request, format=format),
                'method': 'PATCH',
                'description': 'updates the user-details into the database.'
            },
            'send-friend-request': {
                'url': reverse('send_friend_request', request=request, format=format),
                'method': 'POST',
                'description': 'send friend request to mentioned user.'
            },
            'accept-friend-request': {
                'url': reverse('accept_friend_request', request=request, format=format),
                'method': 'POST',
                'description': 'accept friend request.'
            },
            'block-user': {
                'url': reverse('block_user', request=request, format=format),
                'method': 'POST',
                'description': 'blocks another user.'
            },
            'update-profile-photo': {
                'url': reverse('update_profile_photo', request=request, format=format),
                'method': 'POST',
                'description': 'updates profile photo in the cloud.'
            },
            'reset-profile-photo': {
                'url': reverse('reset_profile_photo', request=request, format=format),
                'method': 'POST',
                'description': 'resets profile photo to default one.'
            },
            'get-direct-messages': {
                'url': reverse('get_direct_messages', request=request, format=format),
                'method': 'POST',
                'description': 'get direct messages.'
            },
            'get-group-messages': {
                'url': reverse('get_group_messages', request=request, format=format),
                'method': 'POST',
                'description': 'get group messages.'
            },
            'send-direct-message': {
                'url': reverse('send_direct_message', request=request, format=format),
                'method': 'POST',
                'description': 'send direct message.'
            },
            'search-user': {
                'url': reverse('search_user', request=request, format=format),
                'method': 'POST',
                'description': 'search user by username or email.'
            },
            'reject-friend-request': {
                'url': reverse('reject_friend_request', request=request, format=format),
                'method': 'POST',
                'description': 'reject friend request.'
            },
            'delete-expense': {
                'url': reverse('delete_expense', request=request, format=format),
                'method': 'DELETE',
                'description': 'deletes an existing expense record from the database.'
            },
            'create-expense': {
                'url': reverse('create_expense', request=request, format=format),
                'method': 'POST',
                'description': 'create expense.'
            },
            'transactions': {
                'url': reverse('transactions', request=request, format=format),
                'method': 'POST',
                'description': 'get expense.'
            },

            'remove-friend' : {
                'url': reverse('remove_friend', request=request, format=format),
                'method': 'POST',
                'description': 'remove friend.'
            },
            'get-group-info':{
                'url':reverse('get_group_info', request=request, format=format),
                'method':'POST',
                'description':'get group information.'
            },
            'create-group':{
                'url':reverse('create_group', request=request, format=format),
                'method':'POST',
                'description':'create group.'
            },
            'group-invite':{
                'url':reverse('group_invite', request=request, format=format),
                'method':'POST',
                'description':'invite user to group.'
            },
            'leave-group':{
                'url':reverse('leave_group', request=request, format=format),
                'method':'POST',
                'description':'leave group.'
            },
            'get-user-groups':{
                'url':reverse('get_user_groups', request=request, format=format),
                'method':'POST',
                'description':'get user groups.'
            },
            'accept-group-invite':{
                'url':reverse('accept_group_invite', request=request, format=format),
                'method':'POST',
                'description':'accept group invite.'
            },
            'reject-group-invite':{
                'url':reverse('reject_group_invite', request=request, format=format),
                'method':'POST',
                'description':'reject group invite.'
            },
            'get-user-invites':{
                'url':reverse('get_user_invites', request=request, format=format),
                'method':'POST',
                'description':'get user invites.'
            },
            'cancel-group-invite':{
                'url':reverse('cancel_group_invite', request=request, format=format),
                'method':'POST',
                'description':'cancel group invite.'
            },
            'get-direct-messages-between-users':{
                'url':reverse('get_direct_messages_between_users', request=request, format=format),
                'method':'POST',
                'description':'Get direct messages between the authenticated user and a specific user.'
            },
            'get-financial-summary':{
                'url':reverse('get_financial_summary', request=request, format=format),
                'method':'POST',
                'description':'get financial summary.'
            },
            'get-settlement-data':{
                'url':reverse('get_settlement_data', request=request, format=format),
                'method':'POST',
                'description':'get settlement summary.'
            },
            'send-group-message':{
                'url':reverse('send_group_message', request=request, format=format),
                'method':'POST',
                'description':'send group message.'
            },
            'search-invite':{
                'url':reverse('invite_search', request=request, format=format),
                'method':'POST',
                'description': 'search api for inviting new users to a group.'
            },
            'delete-group':{
                'url':reverse('delete_group', request=request, format=format),
                'method':'POST',
                'description':'delete group.'
            },
            'edit-group':{
                'url':reverse('edit_group', request=request, format=format),
                'method':'POST',
                'description':'edit group.'
            },
            'remove-from-group':{
                'url':reverse('remove_from_group', request=request, format=format),
                'method':'POST',
                'description':'remove user from group.'
            }
        },
        'version': 'development',
        'status': 'online',
        'documentation': 'API documentation will be available soon ~yp'
    })

@api_view(['POST'])
def register_user(request):
    """
    Register a new user with AWS Cognito
    and store the user in database.
    
    Request body:
    {
        "username": "example_user",
        "fullname": "Jhon Doe",
        "password": "Example123!",
        "email": "user@example.com",
        "phone_number": "+1234567890" (optional)
    }
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.register_user(**serializer.validated_data)
        
        if result['status'] == 'SUCCESS':
            return Response({
                'status': 'success',
                'message': result['message'],
                'user_sub': result.get('user_sub'),
                'next_step': 'Check your email for verification code'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'message': result['message'],
            'error_code': result.get('error_code'),
            'details': 'Registration failed'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_signup(request):
    """
    Verify user email with confirmation code
    
    Request body:
    {
        "username": "example_user",
        "confirmation_code": "123456"
    }
    """
    serializer = VerifySignupSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.confirm_sign_up(**serializer.validated_data)
        
        if result['status'] == 'SUCCESS':
            return Response({
                'status': 'success',
                'message': result['message'],
                'next_step': 'You can now login with your credentials'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'message': result['message'],
            'error_code': result.get('error_code'),
            'details': 'Verification failed'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def user_login(request):
    """
    Login user with email and password
    
    Request body:
    {
        "email": "example@example.com",
        "password": "Example123!"
    }
    """
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        db = DatabaseService()
        req = db.get_username_by_email(serializer.validated_data['email'])
        if req['status'] == 'SUCCESS':
            cognito = CognitoService()
            result = cognito.login_user(username=req['username'],
            password= serializer.validated_data['password'])
            if result['status'] == 'SUCCESS':
                print(req)
                return Response({
                    'status': 'success',
                    'message': result['message'],
                    'access_token': result['access_token'],
                    'refresh_token': result['refresh_token'],
                    'id_token': result['id_token'],
                    'username': req['username'],
                }, status=status.HTTP_200_OK)
            
            return Response({
                'status': 'error',
                'message': result['message'],
                'error_code': result.get('error_code'),
                'details': 'Login failed'
            }, status=status.HTTP_400_BAD_REQUEST) 
        return Response(req,status=status.HTTP_400_BAD_REQUEST)       
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def renew_tokens(request):
    """
    Renew access and ID tokens using refresh token and id token
    
    Request body:
    {
        "refresh_token": "your-refresh-token",
        "id_token": "your-id-token"
    }
    """
    serializer = TokenRenewSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.renew_tokens(
            refresh_token=serializer.validated_data['refresh_token'],
            id_token=serializer.validated_data['id_token']
        )
        
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)
        
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
        
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_user(request):
    """
    Pass the access token and make all the session tokens 
    including refresh token invalid, hence 'Logging Out' the user.
    
    Request body:
    {
        "access_token": "QwErTYuioP"
    }
    """
    serializer = LogoutUserSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.logout_user(serializer.validated_data['access_token'])
        
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)
        
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
        
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def initiate_reset_password(request):
    """
    Initiate password reset process
    
    Request body:
    {
        "email": "abc@examplemail.com"
    }
    """
    serializer = InitiateResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.initiate_password_reset(serializer.validated_data['email'])
        
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)
        
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def confirm_reset_password(request):
    """
    Confirm password reset with code
    
    Request body:
    {
        "email": "abc@example.com",
        "confirmation_code": "123456",
        "new_password": "NewPassword123!"
    }
    """
    serializer = ConfirmResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.confirm_password_reset(
            email=serializer.validated_data['email'],
            confirmation_code=serializer.validated_data['confirmation_code'],
            new_password=serializer.validated_data['new_password']
        )
        
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)
        
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_user_friends(request):
    """
    Confirm password reset with code
    
    Request body:
    {
        "id_token": "QwErTYuioP",
    }
    """
    serializer = GetUserFriendsSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        firstResult = cognito.get_user_id(serializer.validated_data['id_token'])
        if firstResult['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_user_friends(firstResult.get('user_sub'))
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'message': 'Could not verify user identity',
            'details': firstResult.get('message')
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_resend_code(request):
    """
    get the resent verification code through email.
    
    Request body:
    {
        "username": "example_user"
    }
    """
    serializer = GetResentVerificationCodeSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.resend_code(serializer.validated_data['username'])
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)

        return Response(result, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def verify_user_access(request):
    """
    confirm if the user is allowed to access certain or all pages.
    
    Request body:
    {
        "access_token" : "QwerTy"
    }
    """
    serializer = VerifyUserAccessSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.check_user_auth(serializer.validated_data['access_token'])
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_user_profile(request):
    """
    Get the user profile from database by just providing the idToken.
    Returns user profile details.

    Request body:
    {
        "id_token" : "QwerTy"
    } 
    """
    serializer = GetUserProfileSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        getId = cognito.get_user_id(serializer.validated_data['id_token'])
        if getId['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_user_by_cognito_id(getId['user_sub'])
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(getId, status=status.HTTP_401_UNAUTHORIZED)


    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def change_password(request):
    """
    Change the password IF AND ONLY IF user remembers
    the current password and provides a valid accessToken.

    Request body:
    {
        "old_password" : "Example123!",
        "new_password" : "Example123!",
        "access_token" : "QwerTy"
    } 
    """
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        result = cognito.change_password(serializer.validated_data['old_password'],
                                         serializer.validated_data['new_password'],
                                         serializer.validated_data['access_token'])
        if result['status'] == 'SUCCESS':
            return Response(result, status=status.HTTP_200_OK)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
def update_user_profile(request):
    """
    Updates the user's profile fields using an id_token
    and optional fields like full_name, phone_number, avatar_url, currency, etc.

    Request Body:
    {
        "id_token": "your-id-token",
        "full_name": "New Name",  # optional
        "phone_number": "+1234567890",  # optional
        "avatar_url": "https://example.com/avatar.jpg",  # optional
        "currency": "USD"  # optional
    }
    """
    serializer = UpdateUserProfileSerializer(data=request.data, partial=True)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            update_result = db.update_user_details(decoded['user_sub'],
                full_name=serializer.validated_data.get('full_name'),
                phone_number=serializer.validated_data.get('phone_number'),
                avatar_url=serializer.validated_data.get('avatar_url'),
                currency=serializer.validated_data.get('currency')
            )
            if update_result['status'] == 'SUCCESS':
                return Response(update_result, status=status.HTTP_200_OK)
            else:
                return Response(update_result, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'status': 'ERROR',
                'message': 'Could not decode user',
                'details': decoded.get('message')
            }, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def send_friend_request(request):
    """
    Send a friend request on behalf of the authenticated user.
    
    Request Body Example:
    {
        "id_token": "user-id-token",
        "recieve_username": "friend_username" 
        // OR "recieve_useremail": "friend@example.com"
    }
    """
    serializer = FriendRequestSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        id_result = cognito.get_user_id(serializer.validated_data['id_token'])
        if id_result['status'] == 'SUCCESS':
            user_sub = id_result['user_sub']
            db = DatabaseService()
            result = db.get_user_id_by_cognito_id(user_sub)
            if result['status'] == 'SUCCESS':
                user_id = result['user_id']
                expected_keys = ['recieve_username', 'recieve_useremail']
                filtered_data = {key: value for key, value in serializer.validated_data.items() if key in expected_keys}
                result1 = db.send_friend_request(user_id, **filtered_data)
                if result1['status'] == 'SUCCESS':
                    return Response(result1, status=status.HTTP_200_OK)
                else:
                    return Response(result1, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'status': 'error',
                'message': 'User verification failed',
                'details': id_result.get('message', 'Invalid id_token')
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)    

@api_view(['POST'])
def accept_friend_request(request):
    """
    Accept a friend request on behalf of the authenticated user.
    
    Request Body Example:
    {
        "id_token": "user-id-token",
        "request_id": "FriEndReqUestId" 
    }
    """
    serializer = AcceptFriendRequestSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        id_req = cognito.get_user_id(id_token=serializer.validated_data['id_token'])
        if id_req['status'] == 'SUCCESS':
            cognito_id = id_req['user_sub']
            db = DatabaseService()
            result = db.accept_friend_request(cognito_id=cognito_id, request_id=serializer.validated_data['request_id'])
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_202_ACCEPTED)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(id_req, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def block_user(request):
    """
    Block a user from the given idToken account

    Request Body Example:
    {
        "id_token": "user-ID-TOKEN",
        "blocked_id": "blocker-user-id"
    }
    """
    serializer = BlockUserSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        reqId = cognito.get_user_id(id_token=serializer.validated_data['id_token'])
        if reqId['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.block_user(cognito_id=reqId['user_sub'], blocked_id=serializer.validated_data['blocked_id'])
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(reqId, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
    'status': 'error',
    'message': 'Invalid input',
    'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def upload_profile_picture(request):
    """
    Upload a profile picture for the user.
    
    Request Body:
    {
        "id_token": "your-id-token", 
        "profile_picture": file
    }
    """
    serializer = UploadProfilePictureSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        getId = cognito.get_user_id(serializer.validated_data['id_token'])
        if getId['status'] == 'SUCCESS':
            db = DatabaseService()
            user = db.get_user_by_cognito_id(getId['user_sub'])
            
            if user['status'] == 'SUCCESS':
                storage = CloudStorageService()
                try:
                    # Upload the new profile picture
                    new_url = storage.upload_profile_picture(
                        serializer.validated_data['profile_picture'],
                        user['user_data'].get('avatar_url')
                    )
                    
                    if new_url:
                        # Update the profile photo URL in the database
                        update_result = db.update_profile_photo(
                            cognito_id=getId['user_sub'],
                            photo_url=new_url
                        )
                        
                        if update_result['status'] == 'SUCCESS':
                            return Response({
                                'status': 'success',
                                'message': 'Profile picture updated successfully',
                                'avatar_url': new_url,
                                'user_data': update_result.get('user_data')
                            }, status=status.HTTP_200_OK)
                        
                        # Return the original error response for debugging
                        return Response(update_result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    # Return storage service error
                    return Response({
                        'status': 'error',
                        'message': 'Failed to get URL from storage service',
                        'debug_info': {
                            'new_url': new_url,
                            'file_name': serializer.validated_data['profile_picture'].name,
                            'file_size': serializer.validated_data['profile_picture'].size,
                            'content_type': serializer.validated_data['profile_picture'].content_type
                        }
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                except Exception as e:
                    # Return detailed exception info for debugging
                    return Response({
                        'status': 'error',
                        'message': 'Error processing profile picture',
                        'error_type': type(e).__name__,
                        'error_details': str(e),
                        'debug_info': {
                            'file_info': {
                                'name': serializer.validated_data['profile_picture'].name,
                                'size': serializer.validated_data['profile_picture'].size,
                                'content_type': serializer.validated_data['profile_picture'].content_type
                            },
                            'user_info': {
                                'cognito_id': getId['user_sub'],
                                'current_avatar': user['user_data'].get('avatar_url')
                            }
                        }
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Return the original user fetch error
            return Response(user, status=status.HTTP_404_NOT_FOUND)
        
        # Return the original Cognito error
        return Response(getId, status=status.HTTP_401_UNAUTHORIZED)

    # Return serializer validation errors
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors,
        'received_data': {
            'files': request.FILES.keys(),
            'data': request.data
        }
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def reset_profile_picture(request):
    """
    Reset user's profile picture to default.
    
    Request Body:
    {
        "id_token": "your-id-token"
    }
    """
    serializer = ResetProfilePictureSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        getId = cognito.get_user_id(serializer.validated_data['id_token'])
        if getId['status'] == 'SUCCESS':
            db = DatabaseService()
            user = db.get_user_by_cognito_id(getId['user_sub'])
            
            if user['status'] == 'SUCCESS':
                storage = CloudStorageService()
                try:
                    # Reset the profile picture and get default URL
                    default_url = storage.reset_profile_picture(
                        user['user_data'].get('avatar_url')
                    )
                    
                    if default_url:
                        # Update the profile photo URL in the database
                        update_result = db.update_profile_photo(
                            cognito_id=getId['user_sub'],
                            photo_url=default_url
                        )
                        
                        if update_result['status'] == 'SUCCESS':
                            return Response({
                                'status': 'success',
                                'message': 'Profile picture reset successfully',
                                'avatar_url': default_url,
                                'user_data': update_result.get('user_data')
                            }, status=status.HTTP_200_OK)
                        
                        return Response({
                            'status': 'error',
                            'message': 'Failed to update profile picture in database',
                            'details': update_result.get('message')
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                    return Response({
                        'status': 'error',
                        'message': 'Failed to reset profile picture'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                except Exception as e:
                    return Response({
                        'status': 'error',
                        'message': 'Error resetting profile picture',
                        'details': str(e)
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response(user, status=status.HTTP_404_NOT_FOUND)
        return Response(getId, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_direct_messages(request):
    """
    Get direct messages belonging to a user.

    Request Body:
    {
        id_token: "your-id-token",
    }
    """
    serializer = GetDirectMessagesSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            print(f"Decoded token: {decoded}")
            print(f"user_sub: {decoded['user_sub']}")
            result = db.get_direct_messages(decoded['user_sub'], serializer.validated_data.get('page'), serializer.validated_data.get('page_size')) 
            if result['status'] == 'SUCCESS':
                return JsonResponse(result, status=status.HTTP_200_OK)
            return JsonResponse(result, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(decoded, status=status.HTTP_401_UNAUTHORIZED)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_group_messages(request):
    """
    Get group messages belonging to a user.
    
    Request Body:

    {
        "id_token": "your-id-token",
        "group_id": "your-group-id",
        "page"(optional): "default-1",
        "page_size "(optional): "default-50" 
    }
    """
    serializer = GetGroupMessagesSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_group_messages(decoded['user_sub'], serializer.validated_data['group_id'], serializer.validated_data.get('page'), serializer.validated_data.get('page_size'))
            if result['status'] == 'SUCCESS':
                return JsonResponse(result, status=status.HTTP_200_OK)
            return JsonResponse(result, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def send_direct_message(request):
    """
    Send a direct message to another user.
    
    Request Body:
    {
        "id_token": "your-id-token",
        "recipient_id": "recipient-user-id"
        "content": "Hello there!",
        "message_type": "TEXT",
        "file_url" (optional): "https://example.com/file.jpg"
    }

    NOTE: message_type can only be one of:
        - TEXT  or Text
        - FILE  or File
        - IMAGE or Image
    """
    serializer = SendDirectMessageSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.send_direct_message(
                sender_id=decoded['user_sub'],
                recipient_id=serializer.validated_data['recipient_id'],
                content=serializer.validated_data['content'],
                message_type=serializer.validated_data['message_type'],
                file_url=serializer.validated_data.get('file_url')
            )
            if result['status'] == 'SUCCESS':
                return JsonResponse(result, status=status.HTTP_200_OK)
            return JsonResponse(result, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def search_user(request):
    """
    Search for a user by full name, username or email .
    
    Request Body:
    {
        id_token: "your-id-token",
        query: "abcd",
        limit (optional) : "400",
    }
    """
    serializer = SearchUserSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.search_users(decoded['user_sub'], serializer.validated_data['query'], serializer.validated_data.get('limit'))
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return JsonResponse(result, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def create_expense(request):
    """
    Create a new expense record in the database.
    
    Request Body:
    {
        "group_id": "group-id" OR "friend_id": "friend-id",
        "total_amount": 100.00,
        "description": "Expense description",
        "paid_by": "user-id",
        "deadline": "2021-12-31",
        "receipt_url": "https://example.com/receipt.jpg"  # Optional
    }
    
    Returns:
    - 201: Successfully created expense with expense details
    - 400: Validation error with detailed error messages
    - 403: Permission denied if user doesn't have access to the group
    """

    request_data = request.data.copy()

    try:
        cognito = CognitoService()
        firstResult = cognito.get_user_id(id_token=request_data['paid_by'])
        
        db = DatabaseService()
        user_id = db.get_user_id_by_cognito_id(firstResult['user_sub'])['user_id']
        request_data['paid_by'] = user_id
        
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return Response({
            "status": "error",
            "message": "Invalid token"
        }, status=status.HTTP_401_UNAUTHORIZED)

    serializer = ExpenseCreateSerializer(data=request_data)
    is_valid = serializer.is_valid()
    if not is_valid:
        return Response({
            "status": "ERROR",
            "errors": serializer.errors if not is_valid else None
        })
    
    serializer.save()
    
    return Response(
        {
            "status": "SUCCESS",
            "message": "Expense created successfully",
            "expense": serializer.data
        },
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
def transactions(request):
    """
    Get all transactions for the authenticated user, including:
    - Expenses they paid for
    - Expenses they owe money for
    - Expenses they're involved with in any way
    
    Query Parameters:
    {
        "idToken": "your-id-token",
        "filter": "all|paid|owed"  # Optional, defaults to "all"
    }
    """
    try:
        id_token = request.query_params.get('idToken')
        filter_type = request.query_params.get('filter', 'all')
        
        if not id_token:
            return Response({
                "status": "error",
                "message": "idToken is required as a query parameter"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            cognito = CognitoService()
            firstResult = cognito.get_user_id(id_token=id_token)
            
            db = DatabaseService()
            user_id = db.get_user_id_by_cognito_id(firstResult['user_sub'])['user_id']
            
        except Exception as e:
            print(f"Token verification error: {str(e)}")
            return Response({
                "status": "error",
                "message": "Invalid token"
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Query expenses based on filter
        if filter_type == 'paid':
            # Expenses the user paid for
            expenses = Expense.objects.filter(paid_by=user_id)
        elif filter_type == 'owed':
            # Expenses where the user owes money
            expenses = Expense.objects.filter(
                splits__user=user_id,
                splits__is_paid=False
            ).exclude(paid_by=user_id)
        else:
            # All expenses the user is involved with (default)
            expenses = Expense.objects.filter(
                models.Q(paid_by=user_id) | 
                models.Q(splits__user=user_id)
            ).distinct()

        serializer = ExpenseGetSerializer(expenses, many=True)
        
        return Response({
            "status": "Returned",
            "message": "Expenses fetched successfully",
            "expenses": serializer.data,
        })
        
    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
def update_expense(request):
    """
    Update an existing expense record in the database.
    
    Request Body:
    {
        "expense_id": "expense-id",
        "user_id": "user-id",
        "total_amount": 100.00,       # Optional
        "description": "Updated description",  # Optional
        "deadline": "2021-12-31",     # Optional
        "receipt_url": "https://example.com/receipt.jpg",  # Optional
        "remaining_amount": 50.00     # Optional
    }
    """
    try:
        expense_id = request.data.get('expense_id')
        user_id = request.data.get('user_id')
        if not expense_id:
            return Response({
                "status": "error",
                "message": "expense_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the expense object
        try:
            expense = Expense.objects.get(id=expense_id)
        except Expense.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Expense not found"
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check if user has permission to update
        if user_id != expense.paid_by_id:
            return Response({
                "status": "error",
                "user_id": user_id,
                "message": "You don't have permission to update this expense"
            }, status=status.HTTP_403_FORBIDDEN)
            

        serializer = ExpenseUpdateSerializer(
            instance=expense,
            data=request.data,
            partial=True 
        )
        
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        
        # If total_amount changed, update the splits proportionally
        if 'total_amount' in request.data and request.data['total_amount'] != expense.total_amount:
            old_amount = float(expense.total_amount)
            new_amount = float(request.data['total_amount'])
            ratio = new_amount / old_amount
            
            # Update each split amount
            splits = ExpenseSplit.objects.filter(expense_id=expense_id)
            for split in splits:
                split.total_amount = split.total_amount * ratio
                split.remaining_amount = split.remaining_amount * ratio
                split.save()
        serializer.save()
    
        return Response({
            "status": "success",
            "message": "Expense updated successfully",
            "expense": serializer.data
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Error updating expense: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_expense_detail(request):
    """
    Get detailed information about a specific expense
    
    Request Body:
    {
        "expense_id": "expense-id"
    }

    """
    try:
        expense_id = request.data.get('expense_id')
        expense = Expense.objects.get(id=expense_id)
        serializer = ExpenseGetSerializer(expense)
        return Response({
            "status": "Returned",
            "message": "Expense fetched successfully",
            "expense": serializer.data
        })

    except Exception as e:
        return Response({
            "status": "Returned",
            "message": "Error fetching expense",
            "error": str(e)
        })


@api_view(['POST'])
def record_payment(request):
    """
    Record a payment for settling up with a friend
    
    Request Body:
    {
        "id_token": "your-id-token",
        "user_id": "user-id-to-pay",
        "amount": 50.00,
        "description": "Payment settlement"
    }
    """
    try:
        serializer = SettlementPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Invalid input",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the authenticated user
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] != 'SUCCESS':
            return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
        
        db_user = User.objects.get(cognito_id=decoded['user_sub'])
        print(f"Authenticated user: {db_user.name}")   

        is_group_settlement = 'group_id' in serializer.validated_data
        amount_to_settle = float(serializer.validated_data['amount'])
        
        if is_group_settlement:
            # Group settlement logic
            group_id = serializer.validated_data['group_id']
            print(f"Processing group settlement for group {group_id}")

            # Get all splits where current user owes money to other users in the group
            splits_to_settle = ExpenseSplit.objects.filter(
                user_id=db_user.id,
                expense__group_id=group_id,
                is_paid=False
            )

        else:
            recipient_id = serializer.validated_data['user_id']
            # Find all unsettled splits between these users
            # Get all splits where current user owes money to the recipient
            splits_to_settle = ExpenseSplit.objects.filter(
                user_id=db_user.id,
                expense__paid_by_id=recipient_id,
                is_paid=False
            ).order_by('created_at')
        
        if not splits_to_settle.exists():
            return Response({
                "status": "error",
                "message": "No splits found to settle"
            }, status=status.HTTP_404_NOT_FOUND)

        # Record payments for each split until the amount is fully paid
        remaining_to_pay = amount_to_settle
        settled_splits = []
        for split in splits_to_settle:
            if remaining_to_pay <= 0:
                break
            split_amount = min(float(split.remaining_amount), remaining_to_pay)
            
            # Update the split
            split.remaining_amount = float(split.remaining_amount) - split_amount
            if split.remaining_amount <= 0:
                split.is_paid = True
            split.save()
            
            # Update the expense's remaining amount
            expense = split.expense
            expense.remaining_amount = float(expense.remaining_amount) - split_amount
            expense.save()
            
            remaining_to_pay -= split_amount
            settled_splits.append({
                'id': split.id,
                'expense_id': split.expense_id,
                'amount_paid': split_amount,
                'is_fully_paid': split.is_paid
            })
        
        return Response({
            "status": "success",
            "message": "Payment recorded successfully",
            "data": {
                "amount_settled": amount_to_settle - remaining_to_pay,
                "remaining_amount": remaining_to_pay if remaining_to_pay > 0 else 0,
                "settled_splits": settled_splits
            }
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': 'Error recording payment',
            'error': str(e),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_expense(request):
    """
    Delete an expense and its related splits
    
    Request Body:
    {
        "expense_id": "expense-id"
    }
    """

    expense_id = request.data.get('expense_id')
    if not expense_id:
        return Response({
            "status": "error",
            "message": "expense_id is required"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        expense = Expense.objects.get(id=expense_id)
        splits = ExpenseSplit.objects.filter(expense_id=expense_id)
        splits.delete()
        expense.delete()
        
        return Response({
            "status": "success",
            "message": "Expense deleted successfully"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "status": "error",
            "message": f"Error deleting expense: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_financial_summary(request):
    """
    Get financial summary for dashboard.
    
    """
    id_token = request.query_params.get('idToken')
    if not id_token:
        return Response({
            'status': 'ERROR',
            'message': 'ID token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    cognito = CognitoService()
    decoded = cognito.get_user_id(id_token)
    
    if decoded['status'] != 'SUCCESS':
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    
    user_id = decoded['user_sub']
    
    try:
        # Find the database user by their Cognito ID
        db_user = User.objects.get(cognito_id=user_id)
        
        # Now use the database primary key for queries
        you_owe_splits = ExpenseSplit.objects.filter(
            user_id=db_user.id,  # Use DB primary key
            is_paid=False
        ).exclude(expense__paid_by_id=db_user.id)
        
        they_owe_splits = ExpenseSplit.objects.filter(
            expense__paid_by_id=db_user.id,  # Use DB primary key
            is_paid=False
        ).exclude(user_id=db_user.id)
        
        total_you_owe = sum(float(split.remaining_amount) for split in you_owe_splits)
        total_they_owe = sum(float(split.remaining_amount) for split in they_owe_splits)
        total_bill = total_they_owe - total_you_owe

        
        return Response({
            'status': 'SUCCESS',
            'message': 'Financial summary fetched successfully',
            'summary': {
                'youOwe': total_you_owe,
                'theyOwe': total_they_owe,
                'totalBill': total_bill,
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'status': 'ERROR',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def get_settlement_data(request):
    """
    Get data about money the user owes to others.
    
    Request Body:
    {
        "id_token": "your-id-token",
    }
    """
    serializer = GetSettlementDataSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        
        if decoded['status'] != 'SUCCESS':
            return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            # Find the database user by their Cognito ID
            db_user = User.objects.get(cognito_id=decoded['user_sub'])
            
            # Initialize response data
            response_data = {
                'settlements': [],
                'total_to_pay': 0,
            }
            
            # Get unsettled expense splits
            splits_query = ExpenseSplit.objects.filter(is_paid=False)
            
            # THIS IS THE KEY CHANGE: Get splits where USER OWES OTHERS
            # (user is in the split but NOT the payer)
            you_owe_splits = splits_query.filter(
                user_id=db_user.id  # User is part of the split
            ).exclude(expense__paid_by_id=db_user.id)  # But user is not the payer
            

            
            # Filter by group if specified
            # if group_id:
            #     you_owe_splits = you_owe_splits.filter(expense__group_id=group_id)
            
            # Process the splits where user owes others
            user_owes = {}
            for split in you_owe_splits:
                paid_by_id = split.expense.paid_by_id
                if paid_by_id not in user_owes:
                    try:
                        paid_by_user = User.objects.get(id=paid_by_id)
                        user_owes[paid_by_id] = {
                            'id': paid_by_id,
                            'name': paid_by_user.full_name,
                            'avatar_url': paid_by_user.avatar_url,
                            'amount': 0,
                            'expenses': []
                        }
                    except User.DoesNotExist:
                        continue
                group = None
                if split.expense.group_id:
                    group = Group.objects.get(id=split.expense.group_id)

                user_owes[paid_by_id]['amount'] += float(split.remaining_amount)
                user_owes[paid_by_id]['expenses'].append({
                    'id': split.expense.id,
                    'description': split.expense.description,
                    'amount': float(split.remaining_amount),
                    'created_at': split.expense.created_at.isoformat(),
                    'deadline': split.expense.deadline.isoformat() if split.expense.deadline else None,
                    'group_id': split.expense.group_id,
                    'group_name': group.name if split.expense.group_id else None,
                })
                
            # Combine data and calculate totals
            all_settlements = []
            total_to_pay = 0
            for user_id, data in user_owes.items():
                total_to_pay += data['amount']
                data['type'] = 'to_pay'  # Explicitly mark as "to pay"
                all_settlements.append(data)

            print(all_settlements)
            
            response_data = {
                'status': 'SUCCESS',
                'message': 'Settlement data fetched successfully',
                'settlements': all_settlements,
                'total_to_pay': total_to_pay
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'status': 'ERROR',
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                'status': 'ERROR',
                'message': f'Failed to fetch settlement data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def reject_friend_request(request):
    """
    Reject a friend request on behalf of the authenticated user.
    
    Request Body Example:
    {
        "id_token": "user-id-token",
        "request_id": "FriEndReqUestId" 
    }
    """
    serializer = AcceptFriendRequestSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        id_req = cognito.get_user_id(id_token=serializer.validated_data['id_token'])
        if id_req['status'] == 'SUCCESS':
            cognito_id = id_req['user_sub']
            db = DatabaseService()
            result = db.reject_friend_request(cognito_id=cognito_id, request_id=serializer.validated_data['request_id'])
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_202_ACCEPTED)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(id_req, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def remove_friend(request):
    """
    Remove a friend connection between two users.
    Also provide the option to block them.
    
    Request Body Example:
    {
        "id_token": "user-id-token",
        "friendship_id": "friendship-id",
        "block": false
    }
    """
    serializer = RemoveFriendSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        id_result = cognito.get_user_id(serializer.validated_data['id_token'])
        
        if id_result['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.remove_friend(
                cognito_id=id_result['user_sub'],
                friendship_id=serializer.validated_data['friendship_id'],
                block=serializer.validated_data.get('block')
            )
            
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(id_result, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_group_info(request):
    """
    Get the group information along with members.
    requires user passed int to be a member of the group.

    Request Body:
    {
        "id_token" : "user-id-token",
        "group_id" : "group-id",
    }
    """
    serializer = GetGroupInfoSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_group_info(decoded['user_sub'], serializer.validated_data['group_id'])
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_group(request):
    """
    Creates a group and assigns the user admin role.

    Request Body:
    {
        "id_token": "your-id-token",
        "group_name": "desired-name",
        "group_description" (optional): "maxlength-2000 chars"
    }
    """
    serializer = CreateGroupSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.create_group(
                user_sub=decoded['user_sub'],
                group_name=serializer.validated_data['group_name'],
                group_description=serializer.validated_data.get('group_description')
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def invite_to_group(request):
    """
    Invite a user to group.

    Request Body:
    {
        "id_token": "your-id-token",
        "invited_id": "id-of-invited-person",
        "group_id": "group-id"
    }
    """
    serializer = InvitePersonSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.invite_to_group(
                user_sub=decoded['user_sub'],
                invited_id=serializer.validated_data['invited_id'],
                group_id=serializer.validated_data['group_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def leave_group(request):
    """
    Leave a group.
    
    Request Body:
    {
        "id_token": "your-id-token",
        "group_id": "group-id"
    }
    """
    serializer = LeaveGroupSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.leave_group(
                user_sub=decoded['user_sub'],
                group_id=serializer.validated_data['group_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_user_groups(request):
    """
    Get all the groups belonging to the user.

    Request Body:
    {
        "id_token": "your-id-token"
    }
    """
    serializer = GetUserGroupsSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_user_groups(decoded['user_sub'])
            print(result)
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def accept_group_invite(request):
    """
    Accept an invitation to join a group.

    Request Body:
    {
        "id_token": "your-id-token",
        "invite_id": "group-id"
    }
    """
    serializer = AcceptGroupInviteSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.accept_group_invite(
                user_sub=decoded['user_sub'],
                invite_id=serializer.validated_data['invite_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def reject_group_invite(request):
    """
    reject a group invitation.

    Request Body:
    {
        "id_token": "your-id-token",
        "invite_id": "group-id"
    }
    """
    serializer = AcceptGroupInviteSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.reject_group_invite(
                user_sub=decoded['user_sub'],
                invite_id=serializer.validated_data['invite_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_user_invites(request):
    """
    Get all the group invitations for a user.

    Request Body:
    {
        "id_token": "your-id-token"
    }
    """
    serializer = GetUserInvitesSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_user_invites(decoded['user_sub'])
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def cancel_group_invite(request):
    """
    Take back the invite sent to a user.

    Request Body:
    {
        "id_token": "your-id-token",
        "invite_id": "group-id"
    }
    """
    serializer = AcceptGroupInviteSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.cancel_group_invite(
                user_sub=decoded['user_sub'],
                invite_id=serializer.validated_data['invite_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def send_group_message(request):
    """
    Send a message to a group.

    Request Body:
    {
        "id_token": "your-id-token",
        "group_id": "group-id",
        "content": "Hello everyone!",
        "message_type": "TEXT",
        "file_url" (optional): "https://example.com/file.jpg"
    }
    """
    serializer = SendGroupMessageSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.send_group_message(
                sender_id=decoded['user_sub'],
                group_id=serializer.validated_data['group_id'],
                content=serializer.validated_data['content'],
                message_type=serializer.validated_data['message_type'],
                file_url=serializer.validated_data.get('file_url')
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def invite_search(request):
    """
    Search users to invite to the group.

    Request Body:
    {
        "id_token" : "",
        "group_id" : "",
        "search_term" : ""
    }
    """
    serializer = InviteSearchListSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.search_invite(
                user_sub=decoded['user_sub'],
                group_id=serializer.validated_data['group_id'],
                search_term=serializer.validated_data['search_term']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def delete_group(request):
    """
    Delete a group.

    Request Body:
    {
        "id_token": "your-id-token",
        "group_id": "group-id"
    }
    """
    serializer = DeleteGroupSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.delete_group(
                user_sub=decoded['user_sub'],
                group_id=serializer.validated_data['group_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def edit_group(request):
    """
    Edit a group.

    Request Body:
    {
        "id_token": "your-id-token",
        "group_id": "group-id",
        "group_name": "new-group-name",
        "group_description" (optional): "maxlength-2000 chars"
    }
    """
    serializer = EditGroupSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.edit_group(
                user_sub=decoded['user_sub'],
                group_id=serializer.validated_data['group_id'],
                group_name=serializer.validated_data.get('group_name'),
                group_description=serializer.validated_data.get('group_description')
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def remove_from_group(request):
    """
    Remove a user from a group.

    Request Body:
    {
        "id_token": "your-id-token",
        "group_id": "group-id",
        "user_id": "user-id"
    }
    """
    serializer = RemoveFromGroupSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.remove_from_group(
                user_sub=decoded['user_sub'],
                group_id=serializer.validated_data['group_id'],
                user_id=serializer.validated_data['user_id']
            )
            if result['status'] == 'SUCCESS':
                return Response(result, status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(decoded, status=status.HTTP_401_UNAUTHORIZED)
    return Response({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def get_direct_messages_between_users(request):
    """
    Get direct messages between the authenticated user and a specific user.
    
    Request Body:
    {
        "id_token": "your-id-token",
        "recipient_id": "other-user-id",
        "page" (optional): 1,
        "page_size" (optional): 20
    }
    """
    serializer = GetDirectMessagesBetweenUsersSerializer(data=request.data)
    if serializer.is_valid():
        cognito = CognitoService()
        decoded = cognito.get_user_id(serializer.validated_data['id_token'])
        if decoded['status'] == 'SUCCESS':
            db = DatabaseService()
            result = db.get_direct_messages_between_users(
                cognito_id=decoded['user_sub'],
                recipient_id=serializer.validated_data['recipient_id'],
                page=serializer.validated_data.get('page', 1),
                page_size=serializer.validated_data.get('page_size', 20)
            )
            if result['status'] == 'SUCCESS':
                return JsonResponse(result, status=status.HTTP_200_OK)
            return JsonResponse(result, status=status.HTTP_400_BAD_REQUEST)
        return JsonResponse(decoded, status=status.HTTP_401_UNAUTHORIZED)
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid input',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)