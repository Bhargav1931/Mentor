from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Member, Mentorship, Message, Goal, Meeting, Feedback

@admin.register(Member)
class MemberAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Mentoring profile', {'fields': ('name', 'role', 'headline', 'bio', 'skills', 'years_experience', 'location', 'availability')}),)

admin.site.register([Mentorship, Message, Goal, Meeting, Feedback])
