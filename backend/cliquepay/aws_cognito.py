import boto3
import jwt 
import hmac
import hashlib
import base64
from botocore.exceptions import ClientError
from django.conf import settings
from .db_service import *

class CognitoService:
    def __init__(self):
        self.client = boto3.client(
            'cognito-idp',
            region_name=settings.COGNITO_AWS_REGION
        )
        self.client_id = settings.COGNITO_APP_CLIENT_ID
        self.client_secret = settings.COGNITO_APP_CLIENT_SECRET
        print(settings.COGNITO_AWS_REGION)
    def get_secret_hash(self, username):
        message = username + self.client_id
        dig = hmac.new(
            str(self.client_secret).encode('utf-8'),
            msg=str(message).encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()

    def register_user(self, username, fullname, password, email, phone_number=None):
        try:
            username_check = self.check_username_exists(username)
            if username_check['exists']:
                return username_check
                
            user_attributes = [
                {
                    'Name': 'email',
                    'Value': email
                }
            ]

            if phone_number:
                user_attributes.append({
                    'Name': 'phone_number',
                    'Value': phone_number
                })

            params = {
                'ClientId': self.client_id,
                'Username': username,
                'Password': password,
                'UserAttributes': user_attributes
            }

            if self.client_secret:
                params['SecretHash'] = self.get_secret_hash(username)

            response = self.client.sign_up(**params)
            
            # After successful Cognito registration, create database record
            db_service = DatabaseService()
            db_result = db_service.create_user(
                cognito_id=response['UserSub'],
                name=username,
                full_name=fullname,  
                email=email,
                phone_number=phone_number 
            )
            
            if db_result['status'] != 'SUCCESS':
                # Delete Cognito user if database operation fails
                delete_result = self.delete_cognito_user(username)
                return {
                    'status': 'ERROR',
                    'message': 'Operation cancelled due to a server error. Please try again.',
                    'details': f"Database error: {db_result['message']}"
                }

            return {
                'status': 'SUCCESS',
                'user_sub': response['UserSub'],
                'message': 'User registration successful',
                'user_data': db_result.get('user_data', {})  # Return user data from DB
            }

        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def delete_cognito_user(self, username):
        """
        Deletes a user from Cognito in case of database operation failure
        
        Args:
            username (str): Username of the user to delete
            
        Returns:
            dict: Status of the deletion operation
        """
        try:
            self.client.admin_delete_user(
                UserPoolId=settings.COGNITO_USER_POOL_ID,
                Username=username
            )
            return {
                'status': 'SUCCESS',
                'message': 'User deleted successfully'
            }
        except self.client.exceptions.UserNotFoundException:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }
            
    def deactivate_user_account(self, access_token):
        """
        Deactivate or delete a user account using their access token
        
        Args:
            access_token (str): The user's access token
            
        Returns:
            dict: Status of the deactivation operation
        """
        try:
            # First identify the user from the access token
            user_info = self.check_user_auth(access_token)
            
            if user_info['status'] != 'SUCCESS':
                return user_info
                
            # Delete the user from Cognito
            result = self.client.admin_delete_user(
                UserPoolId=settings.COGNITO_USER_POOL_ID,
                Username=user_info['username']
            )
            
            return {
                'status': 'SUCCESS',
                'message': 'User account deactivated successfully',
                'user_sub': user_info.get('user_sub')
            }
            
        except self.client.exceptions.UserNotFoundException:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def confirm_sign_up(self, username, confirmation_code):
        try:
            params = {
                'ClientId': self.client_id,
                'Username': username,
                'ConfirmationCode': confirmation_code
            }

            if hasattr(settings, 'COGNITO_APP_CLIENT_SECRET'):
                params['SecretHash'] = self.get_secret_hash(username)

            self.client.confirm_sign_up(**params)
            
            return {
                'status': 'SUCCESS',
                'message': 'Email verification successful'
            }

        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def resend_code(self, username):
        try:
            params = {
                'ClientId': self.client_id,
                'Username': username
            }

            if hasattr(settings, 'COGNITO_APP_CLIENT_SECRET'):
                params['SecretHash'] = self.get_secret_hash(username)

            self.client.resend_confirmation_code(**params)
            
            return {
                'status': 'SUCCESS',
                'message': 'successfully resent code'
            }

        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def check_username_exists(self, username):
        try:
            params = {
                'UserPoolId': settings.COGNITO_USER_POOL_ID,
                'Filter': f'username = "{username}"',
            }
            
            response = self.client.list_users(**params)
            
            # If any users are found with this username
            if response.get('Users', []):
                return {
                    'status': 'ERROR',
                    'exists': True,
                    'message': 'Username already exists'
                }
            
            return {
                'status': 'SUCCESS',
                'exists': False,
                'message': 'Username is available'
            }

        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }
    def login_user(self, username, password):
        try:
            params = {
                'USERNAME': username,
                'PASSWORD': password,
            }
            
            if self.client_secret:
                params['SECRET_HASH'] = self.get_secret_hash(username)

            response = self.client.initiate_auth(
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters=params,
                ClientId=self.client_id
            )
            return{
                'status': 'SUCCESS',
                'message': 'Login successful',
                'access_token': response['AuthenticationResult']['AccessToken'],
                'refresh_token': response['AuthenticationResult']['RefreshToken'],
                'id_token': response['AuthenticationResult']['IdToken']
            }
        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def renew_tokens(self, refresh_token, id_token):
        """
        Renew access and ID tokens using refresh token and id token for username extraction.
        
        Args:
            refresh_token (str): The refresh token (opaque, not a JWT).
            id_token (str): The id token containing user claims (including username).
            
        Returns:
            dict: Response with new tokens or error message.
        """
        try:
            # Extract username from the id_token instead of refresh token.
            decoded = jwt.decode(id_token, options={"verify_signature": False})
            username = decoded.get("cognito:username") or decoded.get("username")
            if not username:
                return {
                    "status": "ERROR",
                    "message": "Could not extract username from id token"
                }
            
            params = {
                'ClientId': self.client_id,
                'AuthFlow': 'REFRESH_TOKEN_AUTH',
                'AuthParameters': {
                    'REFRESH_TOKEN': refresh_token,
                    'USERNAME': username
                }
            }
            
            if self.client_secret:
                params['AuthParameters']['SECRET_HASH'] = self.get_secret_hash(username)
            
            response = self.client.initiate_auth(**params)
            
            if 'AuthenticationResult' in response:
                return {
                    'status': 'SUCCESS',
                    'message': 'Tokens renewed successfully',
                    'access_token': response['AuthenticationResult'].get('AccessToken'),
                    'id_token': response['AuthenticationResult'].get('IdToken'),
                    'expires_in': response['AuthenticationResult'].get('ExpiresIn', 3600)
                }
            
            return {
                'status': 'ERROR',
                'message': 'Failed to renew tokens'
            }
        except self.client.exceptions.NotAuthorizedException:
            return {
                'status': 'ERROR',
                'message': 'Refresh token has expired or is invalid'
            }
        except jwt.InvalidTokenError:
            return {
                'status': 'ERROR',
                'message': 'Invalid token format'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }

    def logout_user(self, accessToken):
        '''
        Logs out the user from the app
        '''
        try:
            response = self.client.global_sign_out(
                AccessToken=accessToken
            )
            return {
                'status': 'SUCCESS',
                'message': 'Logout successful'
            }
        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def initiate_password_reset(self, email):
        """
        Initiates the FORGOT password process for a user
        
        Args:
            email (str): The email address of the user
            
        Returns:
            dict: Status of the password reset initiation
        """
        try:
            # First find the user by email attribute
            params = {
                'UserPoolId': settings.COGNITO_USER_POOL_ID,
                'Filter': f'email = "{email}"',
            }
            
            response = self.client.list_users(**params)
            
            if not response.get('Users', []):
                return {
                    'status': 'ERROR',
                    'message': 'No user found with this email'
                }
            
            # Get the username from the first (and should be only) user
            username = response['Users'][0]['Username']

            # Now initiate forgot password with the username
            forgot_params = {
                'ClientId': self.client_id,
                'Username': username
            }

            if self.client_secret:
                forgot_params['SecretHash'] = self.get_secret_hash(username)

            self.client.forgot_password(**forgot_params)
            
            return {
                'status': 'SUCCESS',
                'message': 'Password reset code sent to your email'
            }

        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

    def confirm_password_reset(self, email, confirmation_code, new_password):
        """
        Confirms password reset with the code and new password using email
        
        Args:
            email (str): The email address of the user
            confirmation_code (str): The code sent to user's email
            new_password (str): The new password to set
            
        Returns:
            dict: Status of the password reset confirmation
        """
        try:
            # First find the user by email attribute
            params = {
                'UserPoolId': settings.COGNITO_USER_POOL_ID,
                'Filter': f'email = "{email}"',
            }
            
            response = self.client.list_users(**params)
            
            if not response.get('Users', []):
                return {
                    'status': 'ERROR',
                    'message': 'No user found with this email'
                }
            
            # Get the username from the first user
            username = response['Users'][0]['Username']
            print(username)
            confirm_params = {
                'ClientId': self.client_id,
                'Username': username,
                'ConfirmationCode': confirmation_code,
                'Password': new_password
            }

            if self.client_secret:
                confirm_params['SecretHash'] = self.get_secret_hash(username)

            self.client.confirm_forgot_password(**confirm_params)
            
            return {
                'status': 'SUCCESS',
                'message': 'Password has been reset successfully'
            }

        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }
    
    def get_user_id(self, id_token):
        """
        Extract the user sub (unique identifier) from the ID token
        
        Args:
            id_token (str): The ID token from authentication
            
        Returns:
            dict: User sub or error message
        """
        try:
            # Decode the ID token without verification
            decoded_token = jwt.decode(id_token, options={"verify_signature": False})
            
            # Extract the sub claim
            user_sub = decoded_token.get('sub')
            
            if not user_sub:
                return {
                    'status': 'ERROR',
                    'message': 'Could not extract user sub from ID token'
                }
            
            return {
                'status': 'SUCCESS',
                'user_sub': user_sub,
                'username': decoded_token.get('cognito:username'),
                'email': decoded_token.get('email')
            }

        except jwt.InvalidTokenError:
            return {
                'status': 'ERROR',
                'message': 'Invalid token format'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'message': str(e)
            }
    def check_user_auth(self, access_token):
        """
        Verify if the access token is valid and get user information
        
        Args:
            access_token (str): The access token from the client
            
        Returns:
            dict: User information or error message
        """
        try:
            # Get user information using the access token
            response = self.client.get_user(
                AccessToken=access_token
            )
            
            # Extract user sub (unique identifier)
            user_sub = None
            for attr in response['UserAttributes']:
                if attr['Name'] == 'sub':
                    user_sub = attr['Value']
                    break
            
            if not user_sub:
                return {
                    'status': 'ERROR',
                    'message': 'Could not extract user sub from response'
                }
            
            return {
                'status': 'SUCCESS',
                'user_sub': user_sub,
                'username': response['Username'],
                'is_confirmed': True  # If we get here, user is confirmed
            }
            
        except self.client.exceptions.NotAuthorizedException:
            return {
                'status': 'ERROR',
                'message': 'Invalid or expired access token'
            }
        except self.client.exceptions.UserNotFoundException:
            return {
                'status': 'ERROR',
                'message': 'User not found'
            }
        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }
    
    def change_password(self, old_password, new_password, access_token):
        """
        Change the password IF AND ONLY IF user remembers
        the current password and provides a valid accessToken.

        Args:
            access_token (str): The access token from the client
            old_password(str): The user's previous password
            new_password(str): Required
        
        Returns:
            dict: The response from the server to the change password request.
        """

        try:
            response = self.client.change_password(
                PreviousPassword=old_password,
                ProposedPassword=new_password,
                AccessToken=access_token
            )
            
            return {
                'status': 'SUCCESS',
                'message': 'Password changed successfully'
            }

        except self.client.exceptions.NotAuthorizedException:
            return {
                'status': 'ERROR',
                'message': 'Invalid access token or incorrect previous password'
            }
        except self.client.exceptions.LimitExceededException:
            return {
                'status': 'ERROR',
                'message': 'Attempt limit exceeded, please try after some time'
            }
        except ClientError as e:
            return {
                'status': 'ERROR',
                'error_code': e.response['Error']['Code'],
                'message': e.response['Error']['Message']
            }

