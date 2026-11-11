from datetime import timedelta
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from .models import Member, Mentorship, Message, Goal, Meeting, Feedback


class MentoringTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.mentor = Member.objects.create_user(username='mentor@example.com', email='mentor@example.com', password='Uncommon-pass-734!', name='Mentor', role='mentor')
        cls.mentee = Member.objects.create_user(username='mentee@example.com', email='mentee@example.com', password='Uncommon-pass-734!', name='Mentee', role='mentee')
        cls.outsider = Member.objects.create_user(username='other@example.com', email='other@example.com', password='Uncommon-pass-734!', name='Other', role='mentee')
        cls.relationship = Mentorship.objects.create(mentor=cls.mentor, mentee=cls.mentee, status='active', introduction='Hello')

    def test_public_and_login_required_pages(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        for route in ['dashboard', 'members', 'profile', 'mentors', 'requests', 'relationships', 'chat', 'schedule']:
            self.assertEqual(self.client.get(reverse(route)).status_code, 302)
        self.client.force_login(self.mentee)
        for route in ['dashboard', 'members', 'profile', 'mentors', 'requests', 'relationships', 'chat', 'schedule']:
            self.assertEqual(self.client.get(reverse(route)).status_code, 200)
        self.assertEqual(self.client.get(reverse('workspace', args=[self.relationship.pk])).status_code, 200)

    def test_registration_and_case_insensitive_email_login(self):
        response = self.client.post('/register/', {'name': 'New member', 'email': 'NEW@example.com', 'role': 'mentee', 'password1': 'Uncommon-pass-734!', 'password2': 'Uncommon-pass-734!'})
        self.assertRedirects(response, '/dashboard/')
        member = Member.objects.get(email='new@example.com')
        self.assertTrue(member.check_password('Uncommon-pass-734!'))
        self.client.logout()
        self.assertRedirects(self.client.post('/login/', {'username': 'NEW@example.com', 'password': 'Uncommon-pass-734!'}), '/dashboard/')

    def test_member_creation_permissions(self):
        data = {'name': 'Added', 'email': 'added@example.com', 'role': 'mentor', 'password1': 'Uncommon-pass-734!', 'password2': 'Uncommon-pass-734!'}
        self.client.force_login(self.mentee)
        self.assertEqual(self.client.post('/members/', data).status_code, 403)
        self.client.force_login(self.mentor)
        self.assertRedirects(self.client.post('/members/', data), '/members/')
        self.assertTrue(Member.objects.filter(email='added@example.com').exists())
        response = self.client.post('/members/', data)
        self.assertContains(response, 'already exists')

    def test_request_accept_and_duplicate_guard(self):
        self.client.force_login(self.outsider)
        url = reverse('mentor', args=[self.mentor.pk])
        self.assertRedirects(self.client.post(url, {'introduction': 'Please mentor me', 'goals': 'Learn Python'}), '/requests/')
        self.assertContains(self.client.post(url, {'introduction': 'Again'}), 'already have an open')
        relationship = Mentorship.objects.get(mentee=self.outsider)
        self.assertEqual(self.client.post(reverse('respond', args=[relationship.pk]), {'decision': 'accept'}).status_code, 403)
        self.client.force_login(self.mentor)
        self.assertEqual(self.client.get(reverse('respond', args=[relationship.pk])).status_code, 405)
        self.client.post(reverse('respond', args=[relationship.pk]), {'decision': 'accept'})
        relationship.refresh_from_db()
        self.assertEqual(relationship.status, 'active')

    def test_private_workspace_and_csrf(self):
        self.client.force_login(self.outsider)
        url = reverse('workspace', args=[self.relationship.pk])
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.post(url, {'action': 'message', 'body': 'Intrusion'}).status_code, 404)
        secure_client = Client(enforce_csrf_checks=True)
        secure_client.force_login(self.mentee)
        self.assertEqual(secure_client.post(url, {'action': 'message', 'body': 'No token'}).status_code, 403)

    def test_workspace_features_and_completion(self):
        self.client.force_login(self.mentee)
        url = reverse('workspace', args=[self.relationship.pk])
        self.client.post(url, {'action': 'message', 'body': '<script>hello</script>'})
        self.assertEqual(Message.objects.count(), 1)
        self.assertContains(self.client.get(url), '&lt;script&gt;hello&lt;/script&gt;')
        self.client.post(url, {'action': 'goal', 'title': 'Learn Django'})
        goal = Goal.objects.get()
        self.client.post(url, {'action': 'goal_status', 'item_id': goal.pk, 'status': 'done'})
        goal.refresh_from_db()
        self.assertEqual(goal.status, 'done')
        self.client.post(url, {'action': 'meeting', 'title': 'Review', 'scheduled_at': (timezone.now() + timedelta(days=2)).strftime('%Y-%m-%dT%H:%M'), 'duration_min': 30, 'meeting_link': 'https://example.com/meeting'})
        meeting = Meeting.objects.get()
        self.assertContains(self.client.get('/schedule/'), 'Review')
        self.client.post(url, {'action': 'meeting_update', 'item_id': meeting.pk, 'status': 'completed', 'notes': 'Good progress'})
        meeting.refresh_from_db()
        self.assertEqual(meeting.notes, 'Good progress')
        self.client.post(url, {'action': 'feedback', 'rating': 5, 'comment': 'Helpful'})
        self.client.post(url, {'action': 'feedback', 'rating': 4, 'comment': 'Updated'})
        self.assertEqual(Feedback.objects.count(), 1)
        self.client.post(url, {'action': 'complete'})
        self.assertEqual(self.client.post(url, {'action': 'message', 'body': 'After completion'}).status_code, 403)
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_invalid_meetings_and_ratings(self):
        self.client.force_login(self.mentee)
        url = reverse('workspace', args=[self.relationship.pk])
        self.client.post(url, {'action': 'meeting', 'title': 'Past', 'scheduled_at': '2020-01-01T10:00', 'duration_min': 2, 'meeting_link': 'javascript:alert(1)'})
        self.assertEqual(Meeting.objects.count(), 0)
        self.client.post(url, {'action': 'feedback', 'rating': 9})
        self.assertEqual(Feedback.objects.count(), 0)

    def test_cannot_update_another_relationships_goal(self):
        other = Mentorship.objects.create(mentor=self.mentor, mentee=self.outsider, status='active', introduction='Hi')
        goal = Goal.objects.create(mentorship=other, title='Private goal')
        self.client.force_login(self.mentee)
        self.assertEqual(self.client.post(reverse('workspace', args=[self.relationship.pk]), {'action': 'delete_goal', 'item_id': goal.pk}).status_code, 404)
        self.assertTrue(Goal.objects.filter(pk=goal.pk).exists())
