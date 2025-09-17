"""
File: db_operations.py
Description: Encapsulates all database operations using the new DBUtil with session management.
All DB operations are performed using a session provided by the API request (one session per request).
"""

from argon2 import PasswordHasher
from common.db_utils import DBUtil
from common.db_local_models import (
    Conversation,
    Conversation_Labeling,
)

from sqlalchemy import func
from datetime import datetime
import pandas as pd

# Initialize PasswordHasher and DBUtil
ph = PasswordHasher()
db_util = DBUtil()


### STUDENT DASHBOARD - START ###

def get_student_conversations(session, user_id: int):
    """
        This function extracts the number of conversation threads by user id.

        :param user_id: The user id of the student.
        :type user_id: int

        :return: It returns the number of conversation threads.
        :rtype: int
    """
    # print("Running get_student_conversations(user_id={})".format(user_id))
    try:
        conversation_threads = session.query(Conversation.id).filter(Conversation.created_by_id == user_id).count()
    except Exception as e:
        print(f"Error fetching conversation threads for user {user_id}: {e}")
        conversation_threads = 0
    return conversation_threads

def get_unqiue_topics(session, user_id: int):
    """
        This function extracts the number of unique topics by user id.

        :param user_id: The user id of the student.
        :type user_id: int

        :return: It returns the number of unique topics.
        :rtype: int
    """
    # print("Running get_unqiue_topics(user_id={})".format(user_id))
    try:
        unique_topics = session.query(Conversation_Labeling.topic).filter(Conversation_Labeling.user_id == user_id).distinct().count()
    except Exception as e:
        print(f"Error fetching unique topics for user {user_id}: {e}")
        unique_topics = 0
    return unique_topics

def get_total_time_spent(session, user_id: int):
    """
        This function extracts the total time spent by user id.

        :param user_id: The user id of the student.
        :type user_id: int

        :return: It returns the total time spent.
        :rtype: int
    """
    # print("Running get_total_time_spent(user_id={})".format(user_id))
    try:
        total_time_spent = session.query(func.round(func.sum(Conversation_Labeling.duration))).filter(Conversation_Labeling.user_id == user_id).first()
        if total_time_spent[0] is None:
            return 0
        return total_time_spent[0]/60
    except Exception as e:
        print(f"Error fetching total time spent for user {user_id}: {e}")
        return 0

def get_student_content_topics_types(session, user_id: int, start_date: datetime, end_date: datetime):
    """
        This function extracts the topics and question types by user id.

        :param chatbot_id: The id of the user
        :type chatbot_id: int
        :param start_date: The start date of the conversation
        :type start_date: datetime
        :param end_date: The end date of the conversation
        :type end_date: datetime

        :return: It returns a pandas dataframe of the topics and question types.
        :rtype: pandas.DataFrame
    """
    # print("Running get_student_content_topics_types(user_id={}, start_date={}, end_date={})".format(user_id, start_date, end_date))
    query_statement = session.query(Conversation_Labeling.topic, Conversation_Labeling.type, func.count(Conversation_Labeling.message_id).label('count_messages'), func.sum(Conversation_Labeling.duration).label('sum_duration')).filter(Conversation_Labeling.user_id == user_id).group_by(Conversation_Labeling.topic, Conversation_Labeling.type).statement
    if start_date is not None:
        query_statement = session.query(Conversation_Labeling.topic, Conversation_Labeling.type, func.count(Conversation_Labeling.message_id).label('count_messages'), func.sum(Conversation_Labeling.duration).label('sum_duration')).filter(Conversation_Labeling.user_id == user_id, Conversation_Labeling.created_date.between(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).group_by(Conversation_Labeling.topic, Conversation_Labeling.type).statement
    df_content_topics_types = pd.read_sql_query(sql=query_statement, con=session.get_bind())
    df_content_topics_types["type"] = df_content_topics_types["type"].str.strip()
    df_content_topics_types = df_content_topics_types.dropna()
    return df_content_topics_types

def get_student_topics(session, user_id: int, start_date: datetime, end_date: datetime):
    """
        This function extracts the topics asked by user id.

        :param user_id: The id of the user
        :type user_id: int
        :param start_date: The start date of the conversation
        :type start_date: datetime
        :param end_date: The end date of the conversation
        :type end_date: datetime

        :return: It returns a pandas dataframe of the topics.
        :rtype: pandas.DataFrame
    """
    # print("Running get_student_topics(user_id={}, start_date={}, end_date={})".format(user_id, start_date, end_date))
    query_statement = session.query(Conversation_Labeling.topic, func.count(Conversation_Labeling.message_id).label('count_messages')).filter(Conversation_Labeling.user_id == user_id).order_by(func.count(Conversation_Labeling.message_id).desc()).group_by(Conversation_Labeling.topic).statement
    if start_date is not None:
        query_statement = session.query(Conversation_Labeling.topic, func.count(Conversation_Labeling.message_id).label('count_messages')).filter(Conversation_Labeling.user_id == user_id, Conversation_Labeling.created_date.between(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))).order_by(func.count(Conversation_Labeling.message_id).desc()).group_by(Conversation_Labeling.topic).statement
    df_topics = pd.read_sql_query(sql=query_statement, con=session.get_bind())
    df_topics = df_topics.dropna()
    df_topics.insert(0, 'id', range(1, len(df_topics) + 1))
    return df_topics

def get_student_topics_trend(session, user_id: int):
    """
        This function extracts the topics asked by user id.

        :param user_id: The id of the user
        :type user_id: int

        :return: It returns a pandas dataframe of the topics.
        :rtype: pandas.DataFrame
    """
    # print("Running get_student_topics_trend(user_id={})".format(user_id))
    query_statement = session.query(Conversation_Labeling.topic, Conversation_Labeling.created_date, func.count(Conversation_Labeling.message_id).label('count_messages')).filter(Conversation_Labeling.user_id == user_id).group_by(Conversation_Labeling.topic, Conversation_Labeling.created_date).statement
    df_topics_trend = pd.read_sql_query(sql=query_statement, con=session.get_bind())
    df_topics_trend = df_topics_trend.dropna()
    return df_topics_trend

def get_student_conversations_trend(session, user_id: int, start_date: datetime, end_date: datetime):
    """
        This function extracts the number of conversation threads by user id over time.
        :param user_id: The user id of the student.
        :type user_id: int
        :param start_date: The start date of the conversation
        :type start_date: datetime
        :param end_date: The end date of the conversation
        :type end_date: datetime
        :return: It returns a pandas dataframe of the number of conversation threads over time.
        :rtype: pandas.DataFrame
    """
    # print("Running get_student_conversations(user_id={}, start_date={}, end_date={})".format(user_id, start_date, end_date))
    query_statement = session.query(func.date(Conversation.created_date).label('x'), func.count(Conversation.id).label('y')).filter(Conversation.created_by_id == user_id)\
        .group_by(func.date(Conversation.created_date)).order_by(func.date(Conversation.created_date)).statement
    if start_date is not None:
        query_statement = session.query(func.date(Conversation.created_date).label('x'), func.count(Conversation.id).label('y')).filter(Conversation.created_by_id == user_id, Conversation.created_date.between(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))\
            .group_by(func.date(Conversation.created_date)).order_by(func.date(Conversation.created_date)).statement
    df_conversations = pd.read_sql_query(sql=query_statement, con=session.get_bind())
    df_conversations = df_conversations.dropna()
    return df_conversations


### STUDENT DASHBOARD - END ###