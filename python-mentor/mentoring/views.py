from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import Member, Mentorship, Message, Goal, Meeting, Feedback
from .forms import MemberForm, ProfileForm, RequestForm, MessageForm, GoalForm, MeetingForm, MeetingUpdateForm, FeedbackForm


def mine(user):
    return Mentorship.objects.filter(Q(mentor=user) | Q(mentee=user)).select_related('mentor', 'mentee')


def home(request):
    return render(request, 'home.html')


def register(request):
    form = MemberForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        login(request, form.save())
        return redirect('dashboard')
    return render(request, 'form.html', {'title': 'Create an account', 'form': form})


@login_required
def dashboard(request):
    relationships = mine(request.user)
    return render(request, 'dashboard.html', {'relationships': relationships, 'sessions': Meeting.objects.filter(mentorship__in=relationships, status='scheduled', scheduled_at__gte=timezone.now())[:5]})


@login_required
def members(request):
    form = MemberForm(request.POST or None)
    if request.method == 'POST':
        if request.user.role != 'mentor':
            return HttpResponseForbidden('Only mentors can add members.')
        if form.is_valid():
            form.save()
            messages.success(request, 'Member added. Share their credentials securely.')
            return redirect('members')
    return render(request, 'members.html', {'members': Member.objects.order_by('name'), 'form': form})


@login_required
def profile(request):
    form = ProfileForm(request.POST or None, instance=request.user)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Profile saved.')
        return redirect('profile')
    return render(request, 'form.html', {'title': 'Your profile', 'form': form})


@login_required
def mentors(request):
    people = Member.objects.filter(role='mentor').exclude(pk=request.user.pk)
    query = request.GET.get('q', '').strip()
    if query:
        people = people.filter(Q(name__icontains=query) | Q(skills__icontains=query) | Q(headline__icontains=query))
    return render(request, 'mentors.html', {'mentors': people, 'query': query})


@login_required
def mentor_detail(request, pk):
    mentor = get_object_or_404(Member, pk=pk, role='mentor')
    form = RequestForm(request.POST or None)
    if request.method == 'POST':
        if request.user.role != 'mentee' or mentor == request.user:
            return HttpResponseForbidden('Only mentees can request a mentor.')
        if form.is_valid():
            try:
                with transaction.atomic():
                    relationship = form.save(commit=False)
                    relationship.mentor = mentor
                    relationship.mentee = request.user
                    relationship.save()
                return redirect('requests')
            except IntegrityError:
                form.add_error(None, 'You already have an open request or active mentorship with this mentor.')
    return render(request, 'mentor.html', {'mentor': mentor, 'form': form})


@login_required
def requests(request):
    return render(request, 'requests.html', {'relationships': mine(request.user).filter(status='pending')})


@login_required
@require_POST
def respond(request, pk):
    relationship = get_object_or_404(mine(request.user), pk=pk, status='pending')
    decision = request.POST.get('decision')
    if relationship.mentor_id == request.user.pk and decision in ['accept', 'decline']:
        Mentorship.objects.filter(pk=pk, status='pending').update(status='active' if decision == 'accept' else 'declined')
    elif relationship.mentee_id == request.user.pk and decision == 'withdraw':
        relationship.delete()
    else:
        return HttpResponseForbidden('Invalid request action.')
    return redirect('requests')


@login_required
def relationships(request):
    return render(request, 'relationships.html', {'relationships': mine(request.user).filter(status__in=['active', 'completed']), 'title': 'Mentorships'})


@login_required
def chat(request):
    return render(request, 'relationships.html', {'relationships': mine(request.user).filter(status__in=['active', 'completed']), 'title': 'Chat'})


@login_required
def schedule(request):
    sessions = Meeting.objects.filter(mentorship__in=mine(request.user)).select_related('mentorship__mentor', 'mentorship__mentee')
    return render(request, 'schedule.html', {'sessions': sessions, 'relationships': mine(request.user).filter(status='active')})


@login_required
def workspace(request, pk):
    relationship = get_object_or_404(mine(request.user), pk=pk, status__in=['active', 'completed'])
    forms = {'message': MessageForm(), 'goal': GoalForm(), 'meeting': MeetingForm(), 'feedback': FeedbackForm()}
    if request.method == 'POST':
        action = request.POST.get('action')
        if relationship.status != 'active' and action != 'feedback':
            return HttpResponseForbidden('This mentorship is read-only.')
        if action == 'complete':
            relationship.status = 'completed'
            relationship.save(update_fields=['status'])
        elif action == 'goal_status':
            goal = get_object_or_404(Goal, pk=request.POST.get('item_id'), mentorship=relationship)
            status = request.POST.get('status')
            if status not in dict(Goal._meta.get_field('status').choices):
                return HttpResponseForbidden('Invalid status.')
            goal.status = status
            goal.save(update_fields=['status'])
        elif action == 'delete_goal':
            get_object_or_404(Goal, pk=request.POST.get('item_id'), mentorship=relationship).delete()
        elif action == 'meeting_update':
            meeting = get_object_or_404(Meeting, pk=request.POST.get('item_id'), mentorship=relationship)
            form = MeetingUpdateForm(request.POST, instance=meeting)
            if not form.is_valid():
                messages.error(request, 'Invalid session update.')
            else:
                form.save()
        elif action in forms:
            cls = type(forms[action])
            kwargs = {}
            if action == 'feedback':
                kwargs['instance'] = Feedback.objects.filter(mentorship=relationship, author=request.user).first()
            form = cls(request.POST, **kwargs)
            forms[action] = form
            if form.is_valid():
                item = form.save(commit=False)
                item.mentorship = relationship
                if action == 'message':
                    item.sender = request.user
                if action == 'feedback':
                    item.author = request.user
                item.save()
            else:
                return render(request, 'workspace.html', {'relationship': relationship, 'forms': forms})
        else:
            return HttpResponseForbidden('Unknown action.')
        return redirect('workspace', pk=pk)
    return render(request, 'workspace.html', {'relationship': relationship, 'forms': forms})
