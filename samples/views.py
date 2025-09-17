from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from common.db_utils import session_scope
from common.api_utils import (
    SQLAlchemyJWTAuthentication,
    validate_request,
)
import common.db_operations as db
from datetime import datetime, timedelta
import dashboard.display_manager as display

# Create your views here.

# GET /dashboard/sample
class SampleProtectedEndpointView(APIView):
    authentication_classes = [SQLAlchemyJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with session_scope() as session:
            user = request.user
            # print("[BACKEND] This is the Dashboard Views")
            return Response({"message": "This is a protected endpoint.", "user_id": user.id}, status=status.HTTP_200_OK)

# GET /dashboard/kpi/
class KPIView(APIView):
    authentication_classes = [SQLAlchemyJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with session_scope() as session:
            user = request.user

            conversation_threads = db.get_student_conversations(session, user_id=user.id)
            unique_topics = db.get_unqiue_topics(session, user_id=user.id)
            total_time_spent = db.get_total_time_spent(session, user_id=user.id)

            return Response({
                "conversation_threads": conversation_threads,
                "unique_topics": unique_topics,
                "total_time_spent": total_time_spent
            }, status=status.HTTP_200_OK)

#GET /dashboard/content-topic-type/
class AnalyticsContentTopicTypeView(APIView):
    authentication_classes = [SQLAlchemyJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, date_range):
        with session_scope() as session:
            user = request.user

            today = datetime.now().date()
            if date_range == "all":
                week_ago = None
            else:
                week_ago = today - timedelta(days=int(date_range))
            content_topics_types = display.to_stacked_bar_chart(db.get_student_content_topics_types(session, user_id=user.id, start_date=week_ago, end_date=today))
            return Response({
                "content_topics_types": content_topics_types
            }, status=status.HTTP_200_OK)

# GET /dashboard/topic/
class AnalyticsTopicView(APIView):
    authentication_classes = [SQLAlchemyJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, date_range):
        with session_scope() as session:
            user = request.user

            today = datetime.now().date()
            if date_range == "all":
                week_ago = None
            else:
                week_ago = today - timedelta(days=int(date_range))
            topics = display.to_dict(db.get_student_topics(session, user_id=user.id, start_date=week_ago, end_date=today))
            return Response({
                "topics": topics
            }, status=status.HTTP_200_OK)

# GET /dashboard/topic-trend/
class AnalyticsTopicTrendView(APIView):
    authentication_classes = [SQLAlchemyJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with session_scope() as session:
            user = request.user

            today = datetime.now().date()
            week_ago = today - timedelta(days=1000)
            topics_trend = db.get_student_topics_trend(session, user_id=user.id, start_date=week_ago, end_date=today)
            return Response({
                "topics_trend": topics_trend
            }, status=status.HTTP_200_OK)

# GET /dashboard/conversation-trend/
class AnalyticsConversationView(APIView):
    authentication_classes = [SQLAlchemyJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, date_range):
        with session_scope() as session:
            user = request.user

            today = datetime.now().date()
            if date_range == "all":
                week_ago = None
            else:
                week_ago = today - timedelta(days=int(date_range))
            conversations = display.to_dict(db.get_student_conversations_trend(session, user_id=user.id, start_date=week_ago, end_date=today))
            return Response({
                "data_result": conversations
            }, status=status.HTTP_200_OK)