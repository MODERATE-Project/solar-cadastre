from django.db import models

# Create your models here.
class Profile(models.Model):
    profile = models.CharField(max_length = 20)
    min_value = models.IntegerField()
    max_value = models.IntegerField()

    def __str__(self):
        return self.profile