import pandas as pd
import numpy
from bisect import bisect_right

grade_array = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]
maximum_point = 100
grade_point_array = [4.3, 4.0, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.7, 0.0]

# Pre-calculated thresholds for GPA scale (descending order, reversed for bisect)
# Midpoints between grade points for accurate conversion
GPA_THRESHOLDS = [0.0, 0.35, 0.85, 1.15, 1.5, 1.85, 2.15, 2.5, 2.85, 3.15, 3.5, 3.85, 4.15]
# Reversed grade array for bisect lookup
GRADES_REVERSED = ["F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]

def grade_to_point(grade):
    if grade in grade_array:
        index = grade_array.index(grade)
        return grade_point_array[index]
    else:
        print("Grade not found in grade array")
        return None 
    
def point_to_grade(point):
    """
    OPTIMIZED: Convert grade point (0.0-4.3 scale) back to letter grade.
    Uses binary search for O(log n) complexity vs O(n) for if-elif chains.
    Handles both 0-100 scale and 0-4.3 GPA scale.
    """
    if point is None:
        return None
    
    # Handle GPA scale (0.0-4.3) - OPTIMIZED with binary search
    if point <= 4.3:
        # Clamp to valid range
        point = max(0.0, min(4.3, point))
        # Binary search: O(log n) instead of O(n)
        idx = bisect_right(GPA_THRESHOLDS, point) - 1
        return GRADES_REVERSED[idx]
    
    # Handle 0-100 percentage scale (less common path)
    elif point <= 100:
        # Direct calculation: O(1)
        if point >= 95: return "A+"
        elif point >= 90: return "A"
        elif point >= 85: return "A-"
        elif point >= 80: return "B+"
        elif point >= 75: return "B"
        elif point >= 70: return "B-"
        elif point >= 65: return "C+"
        elif point >= 60: return "C"
        elif point >= 55: return "C-"
        elif point >= 50: return "D+"
        elif point >= 45: return "D"
        elif point >= 40: return "D-"
        else: return "F"
    
    return None

