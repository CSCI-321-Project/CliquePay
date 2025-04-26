from django.apps import AppConfig

class CliquepayConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cliquepay'
    
    def ready(self):
        import cliquepay.signal