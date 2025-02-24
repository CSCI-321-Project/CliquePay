from rest_framework import serializers

class UserRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255, required=True)
    fullname = serializers.CharField(max_length=255, required=True)
    password = serializers.CharField(
        max_length=128, 
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=20, required=False)


class VerifySignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255, required=True)
    confirmation_code = serializers.CharField(max_length=6, required=True)

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        max_length=128, 
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

class TokenRenewSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=True)
    id_token = serializers.CharField(required=True)

class LogoutUserSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)

class InitiateResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class ConfirmResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    confirmation_code = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(
        max_length=128, 
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
class GetUserFriendsSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)

class GetResentVerificationCodeSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255, required=True)

class VerifyUserAccessSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)

class GetUserProfileSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        max_length=128, 
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        max_length=128, 
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    access_token = serializers.CharField(required=True)

class UpdateUserProfileSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    full_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    currency = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    avatar_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        # Only include fields that have values
        return {k: v for k, v in data.items() if v is not None and v != ''}

class FriendRequestSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    recieve_username = serializers.CharField(max_length=255, required=False)
    recieve_useremail = serializers.EmailField(required=False)

    def validate(self, data):
        if not ('recieve_username' in data or 'recieve_useremail' in data):
            raise serializers.ValidationError("Either username or email must be provided")
        return data

class AcceptFriendRequestSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    request_id = serializers.CharField(max_length=255, required=True)

class RemoveFriendSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    friend_id = serializers.CharField(required=True)

class BlockUserSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    blocked_id = serializers.CharField(required=True)

class UploadProfilePictureSerializer(serializers.Serializer):
    id_token = serializers.CharField(
        required=True,
        error_messages={
            'required': 'ID token is required',
            'blank': 'ID token cannot be blank'
        }
    )
    profile_picture = serializers.ImageField(
        required=True,
        allow_empty_file=False,
        use_url=True,
        error_messages={
            'required': 'Profile picture is required',
            'invalid': 'Invalid image format',
            'empty': 'Empty file submitted',
            'invalid_image': 'Upload a valid image. The file you uploaded was either not an image or a corrupted image.'
        }
    )

    def validate_profile_picture(self, value):
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError('File size must be less than 5MB')
        return value

    def validate_id_token(self, value):
        if not value or not isinstance(value, str):
            raise serializers.ValidationError('Invalid ID token format')
        return value

class ResetProfilePictureSerializer(serializers.Serializer):
    id_token = serializers.CharField(
        required=True,
        error_messages={
            'required': 'ID token is required',
            'blank': 'ID token cannot be blank'
        }
    )