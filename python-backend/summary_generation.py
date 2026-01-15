import requests
import os
import json
import time 
from dotenv import load_dotenv
from initialize_database import get_engine
from averageCalculation import individual_statistics, group_statistics
from grading_calculation import point_to_grade
from sqlalchemy import select # Not being used in an insecure context, only for debugging 
from models_simple import User, Question, Answer

# Load environment variables
load_dotenv()
def generate_LLM_summary_1(user_id):
    # Step 1: Generate the prompt string according to stats 
    # 1. Gather the same data used in the original functio
    individual_stats = individual_statistics(user_id)
    group_stats = group_statistics()


    # Prepare key data points for the LLM
    # Assumptions: individual_stats and group_stats have the necessary fields and are sorted
    top_3 = individual_stats['grades_by_topic'][:3]
    bottom_3 = individual_stats['grades_by_topic'][-3:]
    
    ind_overall_grade = individual_stats.get('average_question_grade', 0)
    grp_overall_grade = group_stats.get('overall_average_grade', 0)
    
    # 2. Construct the Prompt String
    prompt = f"""
    ### ROLE
    You are NALA-Assess, an empathetic and encouraging academic coach. Your goal is to provide a student with a personalized performance summary based on their data.

    ### DATA CONTEXT
    - **Student Performance:** Overall GPA {ind_overall_grade:.2f} ({point_to_grade(ind_overall_grade)})
    - **Class Performance:** Average GPA {grp_overall_grade:.2f} ({group_stats.get('overall_average_grade_letter')})
    - **Top Topics:** {', '.join([f"{t['topic_name']} ({t['avg_grade_letter']})" for t in top_3])}
    - **Areas for Growth:** {', '.join([f"{t['topic_name']} ({t['avg_grade_letter']})" for t in bottom_3])}
    - **Engagement:** The student has {individual_stats.get('conversation_count', 0)} conversations (Class Average: {group_stats.get('average_conversations_per_user', 0)})

    ### OUTPUT REQUIREMENTS
    1. **Length:** Roughly 250-350 words.
    2. **Format:** Use Markdown with these headers: ## Strong Areas, ## Areas for Improvement, and ## Peer Comparison. 
    3. **Tone:** Be encouraging, professional, and data-driven. 
    4. **Logic to follow:**
        - GPA is for calculation only, do not mention GPA as a term.
        - If the student is above the class average, celebrate their dedication.
        - If below, offer constructive encouragement without being discouraging.
        - Mention specific topics from the data provided.
        - If engagement (conversations) is low, suggest chatting more with NALA.
        - Add more next steps in the Peer Comparison section.

    ### TASK
    Write the summary now. Address the student directly as "you".
    """

    # Step 2: Formulate the request payload
    
    
    return prompt
def generate_summary_data(user_id, individual_stats, group_stats):
    """
    Generate rule-based Markdown summary for frontend dashboard.
    Returns Markdown string without LLM - uses conditional logic to build narrative.
    """
    # print(f"\n[DEBUG] === generate_summary_data() called for user_id={user_id} ===")
    
    # Get all statistics
    individual_stats = individual_statistics(user_id)
    group_stats = group_statistics()
    
    # Extract top 3 and bottom 3 topics
    top_3_topics = individual_stats['grades_by_topic'][:3]
    bottom_3_topics = individual_stats['grades_by_topic'][-3:]
    
    # Create group average lookup
    group_avg_by_topic = {
        topic['topic_name']: topic['avg_grade_points'] 
        for topic in group_stats['grades_by_topic']
    }
    
    # Calculate topic differences
    topic_differences = []
    for topic in individual_stats['grades_by_topic']:
        topic_name = topic['topic_name']
        individual_grade = topic['avg_grade_points']
        group_avg = group_avg_by_topic.get(topic_name)
        
        if individual_grade is not None and group_avg is not None:
            difference = individual_grade - group_avg
            topic_differences.append({
                'topic_name': topic_name,
                'individual_grade': individual_grade,
                'individual_letter': topic['avg_grade_letter'],
                'group_avg': group_avg,
                'difference': difference
            })
    
    # Sort by difference
    topic_differences.sort(key=lambda x: x['difference'], reverse=True)
    topics_above_average = [t for t in topic_differences if t['difference'] > 0]
    topics_below_average = [t for t in topic_differences if t['difference'] < 0]
    
    # Get overall averages
    individual_overall_grade = individual_stats.get('average_question_grade', 0)
    group_overall_grade = group_stats.get('overall_average_grade', 0)
    individual_overall_letter = point_to_grade(individual_overall_grade) if individual_overall_grade else 'N/A'
    group_overall_letter = group_stats.get('overall_average_grade_letter', 'N/A')
    
    # Calculate performance difference percentage
    if group_overall_grade and group_overall_grade > 0:
        performance_diff = ((individual_overall_grade - group_overall_grade) / group_overall_grade) * 100
    else:
        performance_diff = 0
    
    # Build Markdown summary with rule-based logic
    summary = []
    
    # === STRONG AREAS SECTION ===
    summary.append("## Strong Areas\n")
    
    if topics_above_average:
        # Student has topics above average - celebrate genuinely
        summary.append(f"Great work! You're excelling in **{len(topics_above_average)} topics** where you're performing above the class average:\n")
        for topic in topics_above_average[:3]:
            summary.append(f"- **{topic['topic_name']}**: You scored **{topic['individual_letter']}** ({topic['individual_grade']:.2f}), which is **{topic['difference']:.2f} points** above the class average\n")
        summary.append("\nKeep up the excellent work in these areas! Your performance here is noteworthy.\n")
    else:
        # No topics above average - be encouraging but honest
        summary.append(f"Your **top performing topics** are:\n")
        for topic in top_3_topics:
            summary.append(f"- **{topic['topic_name']}** ({topic['avg_grade_letter']}, {topic['avg_grade_points']:.2f})\n")
        summary.append("\nWhile these are your strongest areas, there's room for improvement across the board. Consider focusing your study efforts on building a stronger foundation in all topics.\n")
    
    # === AREAS FOR IMPROVEMENT SECTION ===
    summary.append("\n## Areas for Improvement\n")
    
    if topics_below_average:
        summary.append(f"You have **{len(topics_below_average)} topics** where you're currently below the class average. Seek support from your tutor, and chat more with NALA-Assess to strengthen your learning regarding the following:\n")
        for topic in topics_below_average[-3:]:  # Bottom 3
            gap = abs(topic['difference'])
            summary.append(f"- **{topic['topic_name']}**: Currently at **{topic['individual_letter']}** ({topic['individual_grade']:.2f}), **{gap:.2f} points** below class average\n")
    else:
        summary.append("You're meeting or exceeding class average in all topics - excellent work! Continue maintaining this level of performance.\n")
    
    # === PEER COMPARISON SECTION ===
    summary.append("\n## Peer Comparison\n")
    summary.append(f"**Your overall grade:** {individual_overall_letter} ({individual_overall_grade:.2f} GPA)  \n")
    summary.append(f"**Class average:** {group_overall_letter} ({group_overall_grade:.2f} GPA)  \n")
    
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
    
    return ''.join(summary)

def generate_LLM_summary_2(user_id):
    # print(f"\n[DEBUG] === generate_summary() called for user_id={user_id} ===")
    
    # Get all statistics in one call (efficient - data already sorted)
    # print("[DEBUG] Fetching individual statistics...")
    individual_stats = individual_statistics(user_id)
    
    # print("[DEBUG] Fetching group statistics...")
    group_stats = group_statistics()
    
    # Extract top 3 and bottom 3 topics (O(1) - already sorted by avg_grade_points DESC)
    # print("[DEBUG] Extracting top and bottom topics...")
    top_3_topics = individual_stats['grades_by_topic'][:3]
    bottom_3_topics = individual_stats['grades_by_topic'][-3:]
    
    # Create fast lookup dictionary for group averages (O(n))
    # print("[DEBUG] Creating group average lookup...")
    group_avg_by_topic = {
        topic['topic_name']: topic['avg_grade_points'] 
        for topic in group_stats['grades_by_topic']
    }
    
    # Calculate topic differences (O(n))
    # print("[DEBUG] Calculating topic differences vs class average...")
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
    individual_overall_grade = individual_stats.get('average_question_grade', 0)
    group_overall_grade = group_stats.get('overall_average_grade', 0)
    individual_overall_letter = point_to_grade(individual_overall_grade) if individual_overall_grade else 'N/A'
    group_overall_letter = group_stats.get('overall_average_grade_letter', 'N/A')
    
    # Calculate performance difference percentage
    if group_overall_grade and group_overall_grade > 0:
        performance_diff = ((individual_overall_grade - group_overall_grade) / group_overall_grade) * 100
    else:
        performance_diff = 0
    
    # print(f"[DEBUG] Individual overall: {individual_overall_grade:.2f} ({individual_overall_letter})")
    # print(f"[DEBUG] Group overall: {group_overall_grade:.2f} ({group_overall_letter})")
    # print(f"[DEBUG] Performance diff: {performance_diff:+.1f}%") 
    
    # Format data for LLM prompt
    # print("[DEBUG] Formatting topics for LLM prompt...")
    
    # Top performing topics
    top_topics_text = ", ".join([
        f"{topic['topic_name']} ({topic['avg_grade_letter']}, {topic['avg_grade_points']:.2f})" 
        for topic in top_3_topics if topic['avg_grade_points'] is not None
    ])
    
    # Bottom performing topics
    bottom_topics_text = ", ".join([
        f"{topic['topic_name']} ({topic['avg_grade_letter']}, {topic['avg_grade_points']:.2f})" 
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
    
    # print(f"[DEBUG] Top topics: {top_topics_text}")
    # print(f"[DEBUG] Bottom topics: {bottom_topics_text}")
    # print(f"[DEBUG] Above average: {above_avg_text}")
    # print(f"[DEBUG] Below average: {below_avg_text}")
    
    # LLM API setup
    api_key = os.getenv("NALA_API_KEY")
    base_url = os.getenv("BASE_URL")
    # print(f"[DEBUG] API Key loaded: {'Yes' if api_key else 'No'}")
    # print(f"[DEBUG] Base URL: {base_url}")
    
    if not api_key or not base_url:
        print("[ERROR] Missing NALA_API_KEY or BASE_URL in environment")
        return None
    
    url = f"{base_url}/api/llm"
    print(url)
    headers = {"Authorization": f"Bearer {api_key}"}
    print(headers)
    
    # Build the dynamic prompt with actual data
    # print("[DEBUG] Building LLM prompt with actual data...")
    
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
        print("[DEBUG] LLM request parameters constructed.")
        # Send the post request 
        # print("[DEBUG] Sending POST request...")
        retry_strategy = requests.adapters.Retry(
            total=3,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter =   requests.adapters.HTTPAdapter(max_retries=retry_strategy)
            # trying to handle 502
        session = requests.Session()
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        response = session.post(url, headers=headers, data=parameters, timeout=30)
        # print(f"[DEBUG] Response status code: {response.status_code}")
        
        # Check if the response status code is 200
        if response.status_code == 200:
            # print("[DEBUG] Request successful (200 OK)")
            # Parse the JSON response
            # print("[DEBUG] Parsing JSON response...")
            response_json = response.json()
            # print("[DEBUG] JSON successfully parsed")
            # print(f"[DEBUG] Response keys: {response_json.keys() if isinstance(response_json, dict) else 'Not a dict'}")
            return response_json
        else:
            print(f"[ERROR] Request failed with status code: {response.status_code}")
            # print(f"[DEBUG] Response text: {response.text}")
            # Need to install a fallback method now, like something below
            # generate_summary_data(user_id, individual_stats, group_stats)
            return None
            
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse JSON response: {e}")
        # print(f"[DEBUG] Raw response text: {response.text}")
        return None
    except Exception as e:
        print(f"[ERROR] An error occurred while generating summary: {e}")
        import traceback
        # print(f"[DEBUG] Traceback: {traceback.format_exc()}")
        return None



BASE_URL = os.getenv("BASE_URL")
NALA_API_KEY = os.getenv("NALA_API_KEY")
headers = {
    "Authorization": f"Bearer {NALA_API_KEY}"
}


# Test the generate_summary function
if __name__ == "__main__":
    try:
        test_user_id = 113  # Change this to a valid user ID for testing
        result = generate_LLM_summary_2(test_user_id)
        if result:
            print("\n[DEBUG] === LLM Summary Generation Successful ===")
            print(json.dumps(result, indent=4))
        else:
            print("\n[DEBUG] === LLM Summary Generation Failed ===")
    except Exception as e:
        print(f"[ERROR] Exception during testing: {e}")
    # testing summary generation with llm

    # # print("\n[DEBUG] === Testing different function - generate_summary doesn't seem to be working ===")
    # start_time = time.time()
    
    # # Query a full list of users for debugging
    # engine = get_engine()
    # with engine.connect() as conn:
    #     # Build the query object
    #     stmt = select(User.user_id).order_by(User.user_id)
        
    #     # Execute the statement directly
    #     result = conn.execute(stmt)
    #     users = result.fetchall()
        
    #     print(f"[DEBUG] Sample users in database: {[row[0] for row in users]}")
    
    # # Test with user ID 103 (from mock data)
    # test_user_id = 113
    
    # # Test Markdown summary generation (no LLM)
    # print("\n[DEBUG] === Testing Markdown Summary Generation ===")
    # markdown_summary = generate_summary_data(test_user_id)

    # # print("\n[DEBUG] === Markdown Summary Generated ===")
    # print(markdown_summary)
    
    # # Uncomment to test LLM summary generation
    # # result = generate_summary(test_user_id)
    # # if result:
    # #     print("\n[DEBUG] === LLM Summary Generation Successful ===")
    # #     print(json.dumps(result, indent=4))
    # # else:
    # #     print("\n[DEBUG] === LLM Summary Generation Failed ===")
    
    # end_time = time.time()
    # print(f"\n[DEBUG] Total execution time: {end_time - start_time:.2f} seconds")
    # # ... okay, this will have to do 