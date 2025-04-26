from google.cloud import storage
from django.conf import settings
import uuid

class CloudStorageService:
    def __init__(self):
        self.client = storage.Client(credentials=settings.GS_CREDENTIALS,
                                   project=settings.GS_PROJECT_ID)
        self.bucket = self.client.bucket(settings.GS_BUCKET_NAME)

    def upload_profile_picture(self, file, old_url=None):
        """
        Upload a profile picture and return its public URL.
        If old_url exists and is not default, delete it first.
        """
        try:
            # Check if old picture exists and is not default
            if old_url and 'Default_pfp.jpg' not in old_url:
                self.delete_profile_picture(old_url)

            # Create unique filename
            extension = file.name.split('.')[-1]
            filename = f"profile_pictures/{str(uuid.uuid4())}.{extension}"
            
            # Upload file
            blob = self.bucket.blob(filename)
            blob.upload_from_file(file, content_type=file.content_type)
            
            # Make public and return URL
            blob.make_public()
            return blob.public_url
            
        except Exception as e:
            print(f"Error uploading file: {str(e)}")
            return None

    def delete_profile_picture(self, url):
        """Delete a profile picture by its URL"""
        try:
            if not url:
                print("DEBUG: No URL provided")
                return False

            # Extract blob name from URL
            blob_name = url.replace('https://storage.googleapis.com/cliquepay_profile_photo_bucket/', '')
            if not blob_name:
                print("DEBUG: Could not extract blob name from URL")
                return False

            blob = self.bucket.blob(blob_name)
            
            # Fetch blob metadata
            blob.reload()
            generation_match_precondition = blob.generation

            # Delete with generation match precondition
            blob.delete(if_generation_match=generation_match_precondition)
            
            print(f"DEBUG: Successfully deleted blob: {blob_name}")
            return True

        except Exception as e:
            print(f"DEBUG: Error deleting file: {type(e).__name__}")
            print(f"DEBUG: Error details: {str(e)}")
            return False
        
    def delete_user_profile_picture(self, user_id):
        """
        Delete a user's profile picture by user ID
        Returns True if picture was deleted or if user had default picture
        """
        try:
            # Check if this user has a custom profile picture in the database
            from cliquepay.models import User
            user = User.objects.get(cognito_id=user_id)
            
            # If the user has a custom profile picture (not the default)
            if user.avatar_url and 'Default_pfp.jpg' not in user.avatar_url:
                # Delete the picture from cloud storage
                return self.delete_profile_picture(user.avatar_url)
            
            # User has default picture, nothing to delete
            return True
            
        except Exception as e:
            print(f"Error deleting user profile picture: {str(e)}")
            return False
        
    def reset_profile_picture(self, current_url):
        """
        Delete current profile picture and return default picture URL.
        Returns default URL even if deletion fails.
        """
        if current_url and 'Default_pfp.jpg' not in current_url:
            self.delete_profile_picture(current_url)
        return 'https://storage.cloud.google.com/cliquepay_profile_photo_bucket/Default_pfp.jpg'