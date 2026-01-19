import requests
import os
import json
import time 
from dotenv import load_dotenv
from sqlalchemy import select 

# --- UPDATED IMPORTS ---
from .initialize_database import get_engine
from .averageCalculation import individual_statistics, group_statistics
from .grading_calculation import point_to_grade
from .redis_client import get_redis_client

# Load environment variables
load_dotenv()
red_client =   get_redis_client()
def generate_summary_data(user_id):
    """
    Generate rule-based Markdown summary for frontend dashboard.
    Returns a DICTIONARY {'summary': 'markdown string'} to match frontend expectations.
    """
    CACHE_KEY = f"dashboard:summary_data:{user_id}"
    
    # 1. Check Cache
    try:
        cached_summary = red_client.get(CACHE_KEY)
        if cached_summary:
            print("=== Using Cached Summary Data ===")
            return {"summary": cached_summary} 
    except Exception as e:
        print(f"[WARN] Redis read failed: {e}")

    print("=== No Cache Found. Generating Summary Data ===")
    
    # Get all statistics
    individual_stats = individual_statistics(user_id)
    group_stats = group_statistics()
    
    # === FILTER OUT N/A TOPICS ===
    raw_topics = individual_stats.get('grades_by_topic', [])
    

    valid_topics = [
        t for t in raw_topics 
        if t.get('avg_grade_points') is not None 
        and t.get('avg_grade_letter') != 'N/A'
    ]
    # Sort valid topics by grade descending (Highest to Lowest)
    valid_topics.sort(key=lambda x: x['avg_grade_points'], reverse=True)

    print(f"[DEBUG] Valid topics for user {user_id}: {[t['topic_name'] for t in valid_topics]}")

    # Extract top 3 and bottom 3 from the VALID list
    top_3_topics = valid_topics[:3]
    print(f"[DEBUG] Top 3 topics: {[t['topic_name'] for t in top_3_topics]}")

    # Create group average lookup
    group_avg_by_topic = {
        t['topic_name']: t['avg_grade_points'] 
        for t in group_stats.get('grades_by_topic', [])
    }
    print(f"[DEBUG] Group average by topic: {group_avg_by_topic}")

    # Calculate topic differences only for VALID topics
    topic_differences = []
    for topic in valid_topics:
        t_name = topic['topic_name']
        ind_g = topic['avg_grade_points']
        grp_g = group_avg_by_topic.get(t_name)
        
        if grp_g is not None:
            topic_differences.append({
                'topic_name': t_name,
                'individual_grade': ind_g,
                'individual_letter': topic['avg_grade_letter'],
                'difference': ind_g - grp_g
            })
    # Sort by difference
    topic_differences.sort(key=lambda x: x['difference'], reverse=True)
    topics_above_average = [t for t in topic_differences if t['difference'] > 0]
    topics_below_average = [t for t in topic_differences if t['difference'] < 0]
    print(f"[DEBUG] Topic differences: {topic_differences}")
    print(f"[DEBUG] Topics above average: {[t['topic_name'] for t in topics_above_average]}")
    print(f"[DEBUG] Topics below average: {[t['topic_name'] for t in topics_below_average]}")
    # Overall Averages
    ind_grade_raw = individual_stats.get('average_question_grade')
    
    # Safety check for empty data
    if ind_grade_raw is None:
        default_string = """
## Strong Areas
Once data is available, this section will highlight the strong areas that you're doing well in your learning.

## Areas for Improvement
Once data is available, this section will identify areas where you can focus your efforts on, to strengthen your weaknesses.

## Peer Comparison
Once data is available, this section will compare you against your peers to highlight how you're doing overall.
""" 
        return {"summary": default_string.strip()}

    individual_overall_grade = float(ind_grade_raw)
    grp_grade_raw = group_stats.get('overall_average_grade')
    group_overall_grade = float(grp_grade_raw) if grp_grade_raw is not None else 0.0
    
    individual_overall_letter = point_to_grade(individual_overall_grade)
    group_overall_letter = group_stats.get('overall_average_grade_letter', 'N/A')
    
    if group_overall_grade > 0:
        performance_diff = ((individual_overall_grade - group_overall_grade) / group_overall_grade) * 100
    else:
        performance_diff = 0    
    # breakpoint()
    # Build Markdown summary
    summary = []
    #breakpoint()
    # === STRONG AREAS SECTION ===
    summary.append("## Strong Areas\n")
    
    if topics_above_average:
        summary.append(f"Great work! You're excelling in **{len(topics_above_average)} topics** where you're performing above the class average:\n")
        for topic in topics_above_average[:3]:
            summary.append(f"- **{topic['topic_name']}**: You scored **{topic['individual_letter']}** ({topic['individual_grade']:.2f}), which is **{topic['difference']:.2f} points** above the class average\n")
        summary.append("\nKeep up the excellent work in these areas! Your performance here is noteworthy.\n")
    else:
        if top_3_topics:
            summary.append(f"Your **top performing topics** are:\n")
            for topic in top_3_topics:
                summary.append(f"- **{topic['topic_name']}** ({topic['avg_grade_letter']}, {topic['avg_grade_points']:.2f})\n")
            summary.append("\nWhile these are your strongest areas, there's room for improvement across the board. Consider focusing your study efforts on building a stronger foundation in all topics.\n")
        else:
             summary.append("Keep practicing to establish your strong areas!\n")

    # === AREAS FOR IMPROVEMENT SECTION ===
    summary.append("\n## Areas for Improvement\n")
    
    if topics_below_average:
        summary.append(f"You have **{len(topics_below_average)} topics** where you're currently below the class average. Below are {len(topics_below_average) if len(topics_below_average)<=3 else 3} topics you can start to work on. Engage more with NALA-Assess to strengthen your learning!\n")
        for topic in topics_below_average[-3:]: 
            gap = abs(topic['difference'])
            summary.append(f"- **{topic['topic_name']}**: Currently at **{topic['individual_letter']}** ({topic['individual_grade']:.2f}), **{gap:.2f} points** below class average\n")
    else:
        if valid_topics:
            summary.append("You're meeting or exceeding class average in all topics - excellent work! Continue maintaining this level of performance.\n")
        else:
            summary.append("Start interacting with questions to identify areas for improvement.\n")
    
    # === PEER COMPARISON SECTION ===
    summary.append("\n## Peer Comparison\n")
    # UPDATED: Removed "GPA" text, kept only the number
    summary.append(f"**Your overall grade:** {individual_overall_letter} ({individual_overall_grade:.2f})  \n")
    summary.append(f"**Class average:** {group_overall_letter} ({group_overall_grade:.2f})  \n")
    
    if performance_diff > 0:
        summary.append(f"\nYou're performing **{performance_diff:.1f}% above** the class average - keep up the excellent work! ")
        summary.append(f"Your engagement and dedication are reflected in your results.\n")
    elif performance_diff < 0:
        summary.append(f"\nYou're currently **{abs(performance_diff):.1f}% below** the class average. ")
        summary.append(f"Don't be discouraged - this is an opportunity to identify areas for growth and take targeted action to improve.\n")
    else:
        summary.append(f"\nYou're performing **at the class average**. With focused effort, you can push yourself above average!\n")
    
    # === NEXT STEPS SECTION ===
    summary.append("\n## Next Steps\n")
    summary.append("Based on your performance data, here are specific recommendations:\n\n")
    
    if topics_below_average:
        summary.append(f"- Focus on {', '.join([t['topic_name'] for t in topics_below_average[-2:]])} - these need immediate attention\n")
        summary.append(f"- Reach out to instructors or tutors now\n")
    else:
        summary.append(f"- Keep your study habits consistent across all topics\n")
        summary.append(f"- Look for advanced problems to deepen understanding\n")
    
    if topics_above_average:
        summary.append(f"- Use your understanding of {topics_above_average[0]['topic_name']} to help peers - teaching reinforces learning\n")
    
    summary.append(f"- Your conversation participation is {'high (well done!)' if individual_stats.get('conversation_count', 0) > group_stats.get('average_conversations_per_user', 0) else 'average'} - keep asking questions!\n")
    summary.append(f"- Review your performance regularly and adjust study strategies as needed\n")
    
    output = ''.join(summary)
    
    try:
        red_client.setex(CACHE_KEY, 600, output)
    except Exception as ex:
        print(f"[WARN] Failed to cache summary data: {ex}")
        
    return {"summary": output}
def generate_LLM_summary_2(user_id):
    # Get all statistics in one call (efficient - data already sorted)
    individual_stats = individual_statistics(user_id)
    group_stats = group_statistics()
    
    # Extract top 3 and bottom 3 topics (O(1) - already sorted by avg_grade_points DESC)
    top_3_topics = individual_stats['grades_by_topic'][:3]
    bottom_3_topics = individual_stats['grades_by_topic'][-3:]
    
    # Create fast lookup dictionary for group averages (O(n))
    group_avg_by_topic = {
        topic['topic_name']: topic['avg_grade_points'] 
        for topic in group_stats['grades_by_topic']
    }
    
    # Calculate topic differences (O(n))
    topic_differences = []
    for topic in individual_stats['grades_by_topic']:
        topic_name = topic['topic_name']
        individual_grade = topic['avg_grade_points']
        group_avg = group_avg_by_topic.get(topic_name)
        
        if individual_grade is not None and group_avg is not None:
            difference = individual_grade - group_avg  # Positive = above average
            topic_differences.append({
                'topic_name': topic_name,
                'individual_grade': individual_grade,
                'individual_letter': topic['avg_grade_letter'],
                'group_avg': group_avg,
                'difference': difference,
                'abs_difference': abs(difference)
            })
    
    # Sort by difference and get top 3 above/below average
    topic_differences.sort(key=lambda x: x['difference'], reverse=True)
    top_3_above_average = topic_differences[:3]   # Most above class average
    top_3_below_average = topic_differences[-3:]  # Most below class average
    
    # Get overall averages
    ind_grade_raw = individual_stats.get('average_question_grade')
    print(f"Individual overall grade raw: {ind_grade_raw}" if ind_grade_raw is not None else "No individual overall grade")
    individual_overall_grade = ind_grade_raw if ind_grade_raw is not None else 0.0
    
    grp_grade_raw = group_stats.get('overall_average_grade')
    group_overall_grade = grp_grade_raw if grp_grade_raw is not None else 0.0
    
    individual_overall_letter = point_to_grade(individual_overall_grade) if ind_grade_raw is not None else 'N/A'
    group_overall_letter = group_stats.get('overall_average_grade_letter', 'N/A')
    # Format data for LLM prompt
    
    # Top performing topics
    top_topics_text = ", ".join([
        f"{topic['topic_name']} ({topic.get('avg_grade_letter', 'N/A')}, {topic.get('avg_grade_points', 0.0):.2f})" 
        for topic in top_3_topics if topic.get('avg_grade_points') is not None
    ])
    
    # Bottom performing topics
    bottom_topics_text = ", ".join([
        f"{topic['topic_name']} ({topic.get('avg_grade_letter', 'N/A')}, {topic.get('avg_grade_points', 0.0):.2f})"  
        for topic in bottom_3_topics if topic['avg_grade_points'] is not None
    ])
    
    # Biggest gaps vs class average
    above_avg_text = ", ".join([
        f"{topic['topic_name']} (+{topic['difference']:.2f} above class avg)" 
        for topic in top_3_above_average
    ])
    
    below_avg_text = ", ".join([
        f"{topic['topic_name']} ({topic['difference']:.2f} below class avg)" 
        for topic in top_3_below_average
    ])
    
    # LLM API setup
    api_key = os.getenv("NALA_API_KEY")
    base_url = os.getenv("NALA_BASE_URL")
    
    if not api_key or not base_url:
        print("[ERROR] Missing NALA_API_KEY or BASE_URL in environment")
        return None
    
    url = f"{base_url}/api/llm"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    try:
        parameters = f"""
            <llm_request>
            <model>gpt-5</model>
            <system_prompt>You are an encouraging and supportive learning assistant focused on helping students understand their academic performance and guiding them toward improvement. **Format all responses in well-structured Markdown** with proper headings (##, ###), bullet points, and emphasis (bold/italic). Your tone should be warm, motivating, and actionable. Always emphasize the importance of seeking support, tutoring, or additional study sessions when improvement is needed. Focus on concrete next steps and growth opportunities.</system_prompt>

            <hyperparameters>
            <reasoning_effort>low</reasoning_effort>
            <verbosity>low</verbosity>
            <max_output_tokens>200</max_output_tokens>
            </hyperparameters>

            <user_prompt>Generate a personalized academic performance summary for the student using the following actual performance data. **Format your response in Markdown with clear sections:**

            ## Strong Areas
            The student's **top performing topics** (their personal best) are: {top_topics_text}

            Topics where they're **actually above class average**: {above_avg_text if above_avg_text else "None yet - all topics are below class average"}

            **IMPORTANT:** If the student's top topics are still below class average, acknowledge their relative strengths BUT also gently emphasize that there's room for improvement across the board. If they ARE above average in their top topics, celebrate genuinely. Tailor your tone based on the actual performance data.

            ## Areas for Improvement
            The student's **lowest performing topics** are: {bottom_topics_text}

            Topics where you're **below class average**: {below_avg_text}

            For each topic, provide actionable recommendations:
            - Schedule additional study sessions
            - Seek tutoring or academic support from instructors
            - Form study groups with peers
            - Dedicate more focused time to understanding these concepts
            - **Emphasize that seeking support is a sign of strength and commitment to learning**

            ## Peer Comparison
            - **Your overall grade:** {individual_overall_letter} ({individual_overall_grade:.2f} GPA)
            - **Class average:** {group_overall_letter} ({group_overall_grade:.2f} GPA)

            **Topics where you excel compared to peers:**
            {above_avg_text if above_avg_text else "None identified yet - keep working!"}

            **Topics where you can catch up to peers:**
            {below_avg_text if below_avg_text else "You're meeting or exceeding class average in all topics!"}

            Provide encouraging context about their standing, engagement level, and specific guidance on leveraging strengths and addressing gaps relative to classmates.

            ## Next Steps
            Provide 3-5 specific, actionable recommendations for continued growth and improvement.

            **Use Markdown formatting with proper headings (##, ###), bullet points (-), and emphasis (**bold**, *italic*). Make the summary warm, encouraging, actionable, and focused on growth.**</user_prompt>
            </llm_request>
            """
        health_url = f"{base_url}/api/health"
        health_response = requests.get(health_url, headers=headers, timeout=10)
        if health_response.status_code != 200:
            print(f"[ERROR] LLM API health check failed with status code: {health_response.status_code}")
        else:
            print("[DEBUG] LLM API health check successful.")
            
        retry_strategy = requests.adapters.Retry(
            total=3,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = requests.adapters.HTTPAdapter(max_retries=retry_strategy)
        session = requests.Session()
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        response = session.post(url, headers=headers, data=parameters, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[ERROR] Request failed with status code: {response.status_code}")
            return None
            
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse JSON response: {e}")
        return None
    except Exception as e:
        print(f"[ERROR] An error occurred while generating summary: {e}")
        return None

BASE_URL = os.getenv("NALA_BASE_URL")
NALA_API_KEY = os.getenv("NALA_API_KEY")
headers = {
    "Authorization": f"Bearer {NALA_API_KEY}"
}

# Test the generate_summary function
if __name__ == "__main__":
    try:
        # NOTE: Ensure this user_id exists in your NEW database
        test_user_id = 1
        result = generate_summary_data(test_user_id)
        print("\n[DEBUG] === Rule-Based Summary Generation Successful ===")
        print(result)
        # result = generate_LLM_summary_2(test_user_id)
        # if result:
        #     print("\n[DEBUG] === LLM Summary Generation Successful ===")
        #     print(json.dumps(result, indent=4))
        # else:
        #     print("\n[DEBUG] === LLM Summary Generation Failed ===")
        #     # try rule-based alternative as fallback
        #     fallback_summary = generate_summary_data(test_user_id)
        #     print("\n[DEBUG] === Rule-Based Summary Fallback ===")
        #     print(fallback_summary)

    except Exception as e:
        print(f"[ERROR] Exception during testing: {e}")

    # DEBUG: Testing with DB connection (Updated for new schema)
    # print("\n[DEBUG] === Testing DB Connection ===")
    # engine = get_engine()
    # with engine.connect() as conn:
    #     # Use User.id (BigInteger) instead of User.user_id
    #     stmt = select(User.id).order_by(User.id)
    #     result = conn.execute(stmt)
    #     users = result.fetchall()
    #     print(f"[DEBUG] Sample users in database: {[row[0] for row in users]}")