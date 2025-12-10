import pandas as pd
import numpy

grade_array = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]
maximum_point = 100
grade_point_array = [4.3, 4.0, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.7, 0.0]

def grade_to_point(grade):
    if grade in grade_array:
        index = grade_array.index(grade)
        return grade_point_array[index]
    else:
        print("Grade not found in grade array")
        return None 
    
def point_to_grade(point):
    if point < 0 or point > maximum_point:
        return None
    interval = maximum_point / len(grade_array)
    index = int((maximum_point - point) // interval)
    if index >= len(grade_array):
        index = len(grade_array) - 1
    return grade_array[index]

