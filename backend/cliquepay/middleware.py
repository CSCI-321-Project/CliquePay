from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from cliquepay.models import User
from cliquepay.aws_cognito import CognitoService

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get raw headers as list of tuples
        raw_headers = scope.get('headers', [])
        
        # Check for preflight request
        is_preflight = False
        method = None
        
        for key, value in raw_headers:
            if key == b'access-control-request-method':
                is_preflight = True
                break
                
        if is_preflight:
            return await self.cors_preflight_response(send)
            
        # Check for regular OPTIONS request
        for key, value in raw_headers:
            if key == b':method' or key == b'method':
                method = value.decode('utf-8')
                break
                
        if method == 'OPTIONS':
            return await self.cors_preflight_response(send)
            
        # Process token for non-preflight requests
        token = None
        
        # Check Authorization header
        for key, value in raw_headers:
            if key == b'authorization':
                auth_header = value.decode('utf-8')
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:]
                    break
        
        # If no token in header, check query params
        if not token:
            query_string = scope['query_string'].decode()
            query_params = {}
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    query_params[key] = value
                    
            token = query_params.get('token')
            
        if not token:
            return await self.unauthorized_response(send)
        
        # Validate token
        user = await self.get_user_from_token(token)
        if not user:
            return await self.unauthorized_response(send)
        
        # Extract channel from path
        channel = scope['url_route']['kwargs']['channel']
        user_channel = f'user-{user.id}'
        
        # Only allow access to user's own channel
        if channel != user_channel:
            return await self.unauthorized_response(send)
        
        # Add user to scope
        scope['user'] = user
        return await super().__call__(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            cognito = CognitoService()
            result = cognito.get_user_id(token)
            
            if result['status'] == 'SUCCESS':
                return User.objects.get(cognito_id=result['user_sub'])
        except Exception as e:
            print(f"Error authenticating: {e}")
            return None
    
    async def unauthorized_response(self, send):
        await send({
            'type': 'http.response.start',
            'status': 403,
            'headers': [
                (b'content-type', b'text/plain'),
                # Add CORS headers even for error responses
                (b'Access-Control-Allow-Origin', b'http://localhost:5173'),
                (b'Access-Control-Allow-Credentials', b'true'),
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': b'Forbidden',
        })
        
    async def cors_preflight_response(self, send):
        """Handle CORS preflight requests by returning proper headers."""
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [
                (b'Access-Control-Allow-Origin', b'http://localhost:5173'),
                (b'Access-Control-Allow-Headers', b'authorization, content-type'),
                (b'Access-Control-Allow-Methods', b'GET, OPTIONS'),
                (b'Access-Control-Allow-Credentials', b'true'),
                (b'Access-Control-Max-Age', b'86400'),  # Cache preflight for 24 hours
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': b'',
        })