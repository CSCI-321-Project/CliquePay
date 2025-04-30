"""
ASGI config for backend project.
"""

import os
import django
import json
import asyncio
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.asgi import get_asgi_application
from django.urls import path, re_path, include
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from cliquepay.middleware import TokenAuthMiddleware
from cliquepay.message_broker import broker

# Import Django's ASGI application
django_asgi_app = get_asgi_application()

# Improved SSE Consumer that uses message broker instead of polling
class SSEConsumer:
    def __init__(self, scope, receive, send):
        self.scope = scope
        self.receive = receive
        self.send = send
        self.active = True
        
    async def __call__(self):
        # Send SSE headers
        await self.send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [
                (b'cache-control', b'no-cache'),
                (b'content-type', b'text/event-stream'),
                (b'connection', b'keep-alive'),
                (b'Access-Control-Allow-Origin', b'http://localhost:5173'),
                (b'Access-Control-Allow-Credentials', b'true'),
                (b'Access-Control-Allow-Headers', b'authorization,content-type'),
                (b'Access-Control-Allow-Methods', b'GET,POST,PUT,DELETE,OPTIONS'),
            ],
        })
        
        # Get channel from URL and user from middleware
        channel = self.scope['url_route']['kwargs']['channel']
        user = self.scope['user']
        
        print(f"SSE connection established for channel: {channel}")
        queue = None
        
        try:
            # Initial send of connection established
            await self.send_event(
                event="connection_established",
                data={"status": "connected", "channel": channel}
            )
            
            # Get a queue for this user's channel and SUBSCRIBE IT
            queue = broker.get_queue(channel)
            print(f"Subscribed queue to channel: {channel}")
            
            # Listen for messages from the broker
            while self.active:
                try:
                    # Wait for a message with timeout
                    message = await asyncio.wait_for(queue.get(), timeout=30)
                    print(f"Received message in channel {channel}: {message}")
                    
                    # Send the message to the client
                    await self.send_event(
                        event=message.get("event", "message"),
                        data=message.get("data", {})
                    )
                    
                except asyncio.TimeoutError:
                    # Send a heartbeat to keep connection alive
                    await self.send_event(
                        event="heartbeat",
                        data={"timestamp": datetime.now().isoformat()}
                    )
                
        except Exception as e:
            print(f"SSE connection error: {e}")
            await self.send_event(
                event="error",
                data={"message": "Connection error occurred"}
            )
        finally:
            # Clean up subscription when done
            self.active = False
            if queue:
                try:
                    if hasattr(broker, 'unsubscribe'):
                        await broker.unsubscribe(channel, queue)
                    print(f"Unsubscribed from channel: {channel}")
                except Exception as cleanup_error:
                    print(f"Error while unsubscribing: {cleanup_error}")
    
    async def send_event(self, event, data):
        """Helper to send an SSE event"""
        event_data = {
            "id": datetime.now().isoformat(),
            "event": event,
            "data": data
        }
        
        event_text = f"id: {event_data['id']}\nevent: {event_data['event']}\ndata: {json.dumps(event_data['data'])}\n\n"
        
        await self.send({
            'type': 'http.response.body',
            'body': event_text.encode('utf-8'),
            'more_body': True,
        })
    
    async def send_error(self, message):
        """Send error message and close connection"""
        await self.send_event("error", {"message": message})

# Create a factory function for our consumer
def sse_consumer(scope, receive, send):
    return SSEConsumer(scope, receive, send)()

# Define the SSE URL pattern
sse_patterns = [
    re_path(r'^events/(?P<channel>[\w-]+)/$', TokenAuthMiddleware(AuthMiddlewareStack(sse_consumer))),
]

# Create ASGI application with HTTP handler
application = ProtocolTypeRouter({
    "http": URLRouter(sse_patterns + [
        # For all other paths, use Django's ASGI application
        re_path(r"", django_asgi_app),
    ]),
})
