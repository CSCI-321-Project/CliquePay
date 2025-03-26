from rest_framework import serializers
import uuid
from cliquepay.models import Expense, Group, User, GroupMember, ExpenseSplit
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
    full_name = serializers.CharField(required=False, max_length=150)
    phone_number = serializers.CharField(required=False, max_length=16)
    avatar_url = serializers.URLField(required=False)
    currency = serializers.CharField(required=False, max_length=10)

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

class GetDirectMessagesSerializer(serializers.Serializer):
    id_token = serializers.CharField(
        required=True,
        error_messages={
            'required': 'ID token is required',
            'blank': 'ID token cannot be blank'
        }
    )

class GetGroupMessagesSerializer(serializers.Serializer):
    id_token = serializers.CharField(
        required=True,
        error_messages={
            'required': 'ID token is required',
            'blank': 'ID token cannot be blank'
        }
    )
    group_id = serializers.CharField(required=True)

class SearchUserSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    query = serializers.CharField( required=True)
    limit = serializers.IntegerField(required=False, default=10, min_value=1, max_value=100)

class SendDirectMessageSerializer(serializers.Serializer):
    id_token = serializers.CharField(
        required=True,
        error_messages={
            'required': 'ID token is required',
            'blank': 'ID token cannot be blank'
        }
    )
    recipient_id = serializers.CharField(required=True)
    content = serializers.CharField(required=True)
    MESSAGE_TYPES = [
        ('TEXT', 'Text'),
        ('FILE', 'File'),
        ('IMAGE', 'Image'),
    ]
    message_type = serializers.ChoiceField(
        choices=MESSAGE_TYPES,
        required=True
    )
    file_url = serializers.URLField(required=False)



class GroupCreateSerializer(serializers.ModelSerializer):
    members = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Group
        fields = ['name', 'created_by', 'members', 'created_at']
        read_only_fields = ['created_at']

    def create(self, validated_data):
        # Get and remove members
        members_id = validated_data.pop('members', [])
        created_by = validated_data.get('created_by')

        # Generate ID if needed
        if 'id' not in validated_data:
            validated_data['id'] = str(uuid.uuid4())
        
        # Create the group
        group = Group.objects.create(**validated_data)
        if created_by and created_by.id not in members_id:
            members_id.append(created_by.id)
        # Add members
        for member_id in members_id:
            try:
                user = User.objects.get(id=member_id)
                GroupMember.objects.create(
                    group=group,
                    user=user
                )
                print(f"Added member {user.full_name} to group {group.name}")
            except User.DoesNotExist:
                print(f"User with ID {member_id} not found, skipping")
            except Exception as e:
                print(f"Error adding member {member_id}: {str(e)}")
        
        return group

class ExpenseCreateSerializer(serializers.ModelSerializer):

    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False)
    friend_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False)
    
    class Meta:
        model = Expense
        fields = ['group_id', 'friend_id', 'paid_by', 'total_amount', 
                 'description', 'deadline', 'receipt_url']
    
    def validate(self, data):
        """
            Check that exactly one of group_id or friend_id is provided.
        """

        if 'group_id' in data and 'friend_id' in data:
            raise serializers.ValidationError('Only one of group_id or friend_id is required')
        if 'group_id' not in data and 'friend_id' not in data:
            raise serializers.ValidationError('One of group_id or friend_id is required')
        
        return data

    def create(self, validated_data):
        expense_id = str(uuid.uuid4())


        group_id = validated_data.pop('group_id', None).id if 'group_id' in validated_data else None
        friend_id = validated_data.pop('friend_id', None).id if 'friend_id' in validated_data else None
        paid_by_id = validated_data.pop('paid_by').id if 'paid_by' in validated_data else None

        
        expense = Expense.objects.create(
            id=expense_id,
            friend_id=friend_id,
            group_id=group_id,
            paid_by_id=paid_by_id,
            remaining_amount=validated_data['total_amount'],
            **validated_data
        )

        # Splitting the expense amount among group members or a friend
        if group_id:
            group_members = GroupMember.objects.filter(group_id=group_id)
            member_count = group_members.count()

            if member_count > 0:
                split_amount = validated_data['total_amount'] / member_count
                
                for member in group_members:
                    if member.user_id != paid_by_id:
                        ExpenseSplit.objects.create(
                            id=str(uuid.uuid4()),
                            expense_id=expense_id,
                            user_id=member.user_id,
                            total_amount=split_amount ,
                            remaining_amount=split_amount
                        )
                    else: 
                        ExpenseSplit.objects.create(
                            id=str(uuid.uuid4()),
                            expense_id=expense_id,
                            user_id=member.user_id,
                            total_amount=split_amount,
                            remaining_amount=split_amount,
                            is_paid=True
                        )
        
        if friend_id:
            if friend_id != paid_by_id:
                ExpenseSplit.objects.create(
                    id=str(uuid.uuid4()),
                    expense_id=expense_id,
                    user_id=friend_id,
                    total_amount=validated_data['total_amount'] / 2,
                    remaining_amount=validated_data['total_amount'] / 2
                )
            else:
                ExpenseSplit.objects.create(
                    id=str(uuid.uuid4()),
                    expense_id=expense_id,
                    user_id=member.user_id,
                    total_amount=split_amount,
                    remaining_amount=split_amount,
                    is_paid=True
                )

        
        expense.save()

        return expense
    
class ExpenseUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['description', 'total_amount', 'deadline', 'receipt_url', 'remaining_amount', 'total_amount']
    
class ExpenseGetSerializer(serializers.ModelSerializer):
    paid_by = serializers.CharField(source='paid_by.full_name', read_only=True)
    friend_name = serializers.CharField(source='friend_id.full_name', read_only=True)
    group_name = serializers.CharField(source='group_id.name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'paid_by', 'friend_name', 'group_name', 
                 'total_amount', 'remaining_amount', 'description', 
                 'created_at', 'deadline']

class ExpensePaymentSerializer(serializers.Serializer):
    expense_id = serializers.CharField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    id_token = serializers.CharField(required=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero')
        return value