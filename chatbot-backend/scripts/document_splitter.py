import os
import pickle
from dotenv import load_dotenv
from unstructured.partition.pdf import partition_pdf
from unstructured.documents.elements import Image, Text, Table
from unstructured.cleaners.core import clean, replace_unicode_quotes
from google import genai
from google.genai import types
from natsort import natsorted # to sort filenames naturally instead of lexicographically
import pytesseract

# Load environment variables
load_dotenv()
pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")
POPPLER_PATH = os.getenv("POPPLER_PATH")

def partition_document(file_path, images_dir, poppler_path):
    elements = partition_pdf(
        filename=file_path,
        languages=['eng'],
        infer_table_structure=True,
        strategy='hi_res',
        extract_image_block_types=["Image", "Table"],
        extract_image_block_to_payload=False,
        extract_image_block_output_dir=images_dir,
        poppler_path=poppler_path
    )

    print(f"✅ Number of elements extracted: {len(elements)}")
    return elements

OPTIMIZED_PROMPT = """
Analyze this lecture note image.

1. Mark the image as bad if it is any of the following:
- a zoomed-in crop or partial section of a larger table/figure/formula
- missing context (cut off on any edge)
- illegible, blurry, low-resolution, or faint
- decorative (logos, page numbers, headers, footers)

2. Otherwise, if the image is good, produce a technically concise and accurate clear-text summary to describe the key facts or formulas presented in the image. 

**Final Output Format:**
- Output ONLY the summary text if good
- Output ONLY "SKIP" if bad
"""

def process_images(elements, images_dir):
    # Ensure correct natural ordering (figure-1-2, figure-1-10, etc.)
    image_files = natsorted([
        f for f in os.listdir(images_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ])

    img_i = 0
    new_elements = []

    for el in elements:
        if isinstance(el, Image):
            image_path = os.path.join(images_dir, image_files[img_i])
            print(f"Processing image: {image_path}")
            img_i += 1

            # Load image bytes
            with open(image_path, "rb") as f:
                img_bytes = f.read()

            part = types.Part.from_bytes(
                data=img_bytes,
                mime_type="image/jpeg"
            )

            # ONE Gemini call → QC + summary
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[OPTIMIZED_PROMPT, part],
            )

            if response.text is not None:
                output = response.text.strip()

                if output == "SKIP":
                    print("Image marked as SKIP")
                    new_elements.append(Text(""))  # keep alignment
                else:
                    print(f"Summary: {output}")
                    new_elements.append(Text(output))
            else:
                new_elements.append(Text(""))  # Handle None response gracefully

            print("==============================")
        
        else:
            new_elements.append(el)

    return new_elements

def reconstruct_clean_text(elements):
    full_text = ""
    for el in elements:
        if hasattr(el, "text"):
            full_text += el.text + "\n\n"
    full_text_cleaned = full_text.strip()
    full_text_cleaned = replace_unicode_quotes(full_text_cleaned)
    full_text_cleaned = clean(full_text_cleaned, extra_whitespace=True, dashes=True, trailing_punctuation=True)
    return full_text_cleaned

# -------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    # ---------- CONFIG ----------
    DOCS_DIRECTORY = "../../data/processed_lectures/lecture11_process_controller"  # change this directory
    os.makedirs(DOCS_DIRECTORY, exist_ok=True)
    file_name = "11_PID Controller Design and Tuning_General_Controller_Design_Methods"  # change this file name
    IMAGES_DIR = os.path.join(DOCS_DIRECTORY, "images", file_name)
    print(f"Images will be saved to: {IMAGES_DIR}")
    os.makedirs(IMAGES_DIR, exist_ok=True)
    PDF_PATH = os.path.join(DOCS_DIRECTORY, f"{file_name}.pdf")
    # Initialize Google GenAI client
    client = genai.Client()

    # ---------- PROCESSING ----------
    elements = partition_document(PDF_PATH, IMAGES_DIR, POPPLER_PATH)
    new_elements = process_images(elements, IMAGES_DIR)
    new_elements_cleaned = [el for el in new_elements if not isinstance(el, Table)] # remove tables (most likely images)
    print(f"✅ Number of elements after removing tables: {len(new_elements_cleaned)}")
    print(set([str(type(el)) for el in new_elements_cleaned]))

    cleaned_text = reconstruct_clean_text(new_elements_cleaned)

    # ---------- SAVE FILES ----------
    # Convert file_name to lowercase before saving
    file_name_lower = file_name.lower()

    # save new_elements_cleaned to a pickle file for later use
    with open(os.path.join(DOCS_DIRECTORY, f"new_elements_cleaned_{file_name_lower}.pkl"), "wb") as f:
        pickle.dump(new_elements_cleaned, f)
        print(f"✅ Pickle file saved: new_elements_cleaned_{file_name_lower}.pkl")
    
    with open(os.path.join(DOCS_DIRECTORY, f"cleaned_text_{file_name_lower}.txt"), "w", encoding="utf-8") as f:
        f.write(cleaned_text)
        print(f"✅ Text file saved: cleaned_text_{file_name_lower}.txt")