from rest_framework.reverse import reverse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.http import JsonResponse
from cliquepay.aws_cognito import CognitoService
from cliquepay.db_service import DatabaseService
from .serializers import *
from cliquepay.storage_service import CloudStorageService
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
            'friendlist': {
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
            'remove-friend': {
                'url': reverse('remove_friend', request=request, format=format),
                'method': 'POST',
                'description': 'remove friend.'
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
                return Response({
                    'status': 'success',
                    'message': result['message'],
                    'access_token': result['access_token'],
                    'refresh_token': result['refresh_token'],
                    'id_token': result['id_token']
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
def remove_friend(request):
    """
    Remove a friend connection between two users.
    
    Request Body Example:
    {
        "id_token": "user-id-token",
        "friend_id": "friend-database-id"
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
                friend_id=serializer.validated_data['friend_id']
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
def block_user(request):
    """
    Block a user from the given idToken account

    Request Body Example:
    {
        "idToken": "user-ID-TOKEN",
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
