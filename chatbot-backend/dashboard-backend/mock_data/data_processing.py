import json
import os

# Load subtopic summaries from a folder of JSON files
def load_subtopic_summaries(folder_path):
    summaries = {}
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            filepath = os.path.join(folder_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                
    return data

def load_topic_summaries(folder_path):
    summaries = {}
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            filepath = os.path.join(folder_path, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                
    return data

if __name__ == "__main__":
    subtopic_folder_path = './subtopic summary'
    summaries = load_subtopic_summaries(subtopic_folder_path)
    for subtopic, summary in summaries.items():
        print(f"Subtopic: {subtopic}\nSummary: {summary}\n")

    topic_folder_path = './topic_summary'
    topic_summaries = load_topic_summaries(topic_folder_path)
    for topic, summary in topic_summaries.items():
        print(f"Topic: {topic}\nSummary: {summary}\n")
    
    # stor it both in a text file
    with open('mock_data/all_summaries.txt', 'w') as f:
        f.write("Subtopic Summaries:\n")
        for subtopic, summary in summaries.items():
            f.write(f"Subtopic: {subtopic}\nSummary: {summary}\n\n")
        
        f.write("\nTopic Summaries:\n")
        for topic, summary in topic_summaries.items():
            f.write(f"Topic: {topic}\nSummary: {summary}\n\n")