from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path
from mentoring import views
from mentoring.forms import EmailLoginForm

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='form.html', authentication_form=EmailLoginForm, extra_context={'title': 'Log in'}), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('members/', views.members, name='members'),
    path('profile/', views.profile, name='profile'),
    path('mentors/', views.mentors, name='mentors'),
    path('mentors/<int:pk>/', views.mentor_detail, name='mentor'),
    path('requests/', views.requests, name='requests'),
    path('requests/<int:pk>/respond/', views.respond, name='respond'),
    path('mentorships/', views.relationships, name='relationships'),
    path('mentorships/<int:pk>/', views.workspace, name='workspace'),
    path('chat/', views.chat, name='chat'),
    path('schedule/', views.schedule, name='schedule'),
]
