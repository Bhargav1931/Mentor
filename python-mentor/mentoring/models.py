from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
from django.db.models import Q, F


class Member(AbstractUser):
    # Email is also the login username; Django owns password hashing and sessions.
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=10, choices=[('mentor', 'Mentor'), ('mentee', 'Mentee')])
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    skills = models.CharField(max_length=500, blank=True)
    years_experience = models.PositiveSmallIntegerField(default=0)
    location = models.CharField(max_length=120, blank=True)
    availability = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name or self.email


class Mentorship(models.Model):
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='as_mentor')
    mentee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='as_mentee')
    status = models.CharField(max_length=12, choices=[(s, s.title()) for s in ['pending', 'active', 'declined', 'completed']], default='pending')
    introduction = models.TextField()
    goals = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=~Q(mentor=F('mentee')), name='different_participants'), models.UniqueConstraint(fields=['mentor', 'mentee'], condition=Q(status__in=['pending', 'active']), name='one_open_mentorship')]


class Message(models.Model):
    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField(max_length=5000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']


class Goal(models.Model):
    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name='goal_items')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=[('todo', 'To do'), ('in_progress', 'In progress'), ('done', 'Done')], default='todo')


class Meeting(models.Model):
    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name='meetings')
    title = models.CharField(max_length=200)
    scheduled_at = models.DateTimeField()
    duration_min = models.PositiveSmallIntegerField(default=30)
    meeting_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=[(s, s.title()) for s in ['scheduled', 'completed', 'cancelled']], default='scheduled')

    class Meta:
        ordering = ['scheduled_at']


class Feedback(models.Model):
    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name='feedback')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, max_length=2000)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['mentorship', 'author'], name='one_feedback_per_author'), models.CheckConstraint(condition=Q(rating__gte=1, rating__lte=5), name='valid_rating')]
