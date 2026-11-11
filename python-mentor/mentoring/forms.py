from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.utils import timezone
from .models import Member, Mentorship, Message, Goal, Meeting, Feedback


class MemberForm(UserCreationForm):
    class Meta:
        model = Member
        fields = ['name', 'email', 'role', 'headline', 'availability']

    def clean_email(self):
        email = self.cleaned_data['email'].lower()
        if Member.objects.filter(username=email).exists() or Member.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email

    def save(self, commit=True):
        member = super().save(commit=False)
        member.username = member.email.lower()
        if commit:
            member.save()
        return member


class EmailLoginForm(AuthenticationForm):
    username = forms.EmailField(label='Email')

    def clean_username(self):
        return self.cleaned_data['username'].lower()


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Member
        fields = ['name', 'headline', 'bio', 'skills', 'years_experience', 'location', 'availability']


class RequestForm(forms.ModelForm):
    class Meta:
        model = Mentorship
        fields = ['introduction', 'goals']


class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['body']
        widgets = {'body': forms.Textarea(attrs={'rows': 3})}


class GoalForm(forms.ModelForm):
    class Meta:
        model = Goal
        fields = ['title', 'description', 'due_date']
        widgets = {'due_date': forms.DateInput(attrs={'type': 'date'})}


class MeetingForm(forms.ModelForm):
    class Meta:
        model = Meeting
        fields = ['title', 'scheduled_at', 'duration_min', 'meeting_link']
        widgets = {'scheduled_at': forms.DateTimeInput(attrs={'type': 'datetime-local'})}

    def clean_scheduled_at(self):
        value = self.cleaned_data['scheduled_at']
        if value <= timezone.now():
            raise forms.ValidationError('Choose a future date and time.')
        return value

    def clean_duration_min(self):
        value = self.cleaned_data['duration_min']
        if not 15 <= value <= 240:
            raise forms.ValidationError('Choose between 15 and 240 minutes.')
        return value

    def clean_meeting_link(self):
        value = self.cleaned_data['meeting_link']
        if value and not value.startswith(('https://', 'http://')):
            raise forms.ValidationError('Use an HTTP or HTTPS link.')
        return value


class MeetingUpdateForm(forms.ModelForm):
    class Meta:
        model = Meeting
        fields = ['status', 'notes']


class FeedbackForm(forms.ModelForm):
    rating = forms.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Feedback
        fields = ['rating', 'comment']
