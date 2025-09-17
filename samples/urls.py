from django.urls import path
from dashboard.views import (
    SampleProtectedEndpointView,
    KPIView,
    AnalyticsContentTopicTypeView,
    AnalyticsTopicView,
    AnalyticsConversationView
)

urlpatterns = [
    path("sample/", SampleProtectedEndpointView.as_view(), name="sample"),
    path("kpi/", KPIView.as_view(), name="kpi"),
    path("content-topic-type/<str:date_range>/", AnalyticsContentTopicTypeView.as_view(), name="content-topic-type"),
    path("topic/<str:date_range>/", AnalyticsTopicView.as_view(), name="topic"),
    path("conversation-trend/<str:date_range>/", AnalyticsConversationView.as_view(), name="conversations"),
]
