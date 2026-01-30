import os
import pickle
from dotenv import load_dotenv
from unstructured.partition.pdf import partition_pdf
from unstructured.documents.elements import Image, Text, Table
from unstructured.cleaners.core import clean, replace_unicode_quotes
from google import genai
from google.genai import types
from natsort import natsorted
import pytesseract
from tenacity import retry, wait_random_exponential, stop_after_attempt

# ---------- CONFIGURATION ----------
load_dotenv()
pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")
POPPLER_PATH = os.getenv("POPPLER_PATH")

OPTIMIZED_PROMPT = """
Analyze this lecture note image.

1. Mark the image bad and DO NOT SUMMARIZE it if the image is any of the following:
- a zoomed-in crop or partial section of a larger table/figure/formula
- missing context (cut off on any edge)
- illegible, blurry, low-resolution
- decorative (logos, page numbers, headers, footers)
- a blank page

2. Otherwise, if the image is good, produce a technically concise and accurate clear-text summary to describe the key concepts or formulae in the image.

**Final Output Format:**
- Output ONLY the summary text if good
- Output ONLY "SKIP" if bad
"""

# ---------- HELPER FUNCTIONS ----------
def initialize_client():
    """Initialize and return the Google GenAI client."""
    return genai.Client()

def partition_document(file_path, images_dir, poppler_path):
    """Partition a PDF document into elements."""
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

# Add a retry decorator for the generate_content call
@retry(wait=wait_random_exponential(multiplier=1, max=60), stop=stop_after_attempt(5))
def generate_content_with_retry(client, model, prompt, part):
    """Generate content with retry logic."""
    response = client.models.generate_content(
        model=model,
        contents=[prompt, part],
    )
    return response

def process_images(elements, images_dir, client):
    """Process images in the document and generate summaries."""
    # Group images by page and figure identifiers
    image_files = natsorted([
        f for f in os.listdir(images_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ])

    # Group images by page (e.g., "figure-18") and keep only the first image in each group
    grouped_images = {}
    for image_file in image_files:
        # Extract the page identifier (e.g., "figure-18") from the filename
        page_identifier = "-".join(image_file.split("-")[:2])
        if page_identifier not in grouped_images:
            grouped_images[page_identifier] = image_file  # Keep only the first image for each page

    filtered_image_files = list(grouped_images.values())
    print(f"Filtered images: {filtered_image_files}")

    img_i = 0
    new_elements = []

    for el in elements:
        if isinstance(el, Image):
            if img_i >= len(filtered_image_files):
                print("No more images to process.")
                break

            image_path = os.path.join(images_dir, filtered_image_files[img_i])
            print(f"Processing image: {image_path}")
            img_i += 1

            with open(image_path, "rb") as f:
                img_bytes = f.read()

            part = types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")

            try:
                response = generate_content_with_retry(
                    client=client,
                    model="gemini-2.5-flash",
                    prompt=OPTIMIZED_PROMPT,
                    part=part
                )
                output = response.text.strip() if response.text else "SKIP"
            except Exception as e:
                print(f"Error processing image {image_path}: {e}")
                output = "SKIP"

            if output == "SKIP":
                print("Image marked as SKIP")
                new_elements.append(Text(""))  # keep alignment
            else:
                print(f"Summary: {output}")
                new_elements.append(Text(output))

            print("==============================")
        else:
            new_elements.append(el)

    return new_elements

def reconstruct_clean_text(elements):
    """Reconstruct and clean text from document elements."""
    full_text = "\n\n".join(el.text for el in elements if hasattr(el, "text"))
    full_text_cleaned = replace_unicode_quotes(full_text.strip())
    return clean(full_text_cleaned, extra_whitespace=True, dashes=True, trailing_punctuation=True)

def save_to_file(directory, file_name, data, mode="wb", encoding=None):
    """Save data to a file."""
    with open(directory, mode, encoding=encoding) as f:
        if mode == "wb":
            pickle.dump(data, f)
        else:
            f.write(data)
    print(f"✅ File saved: {file_name}")

# ---------- MAIN ----------
if __name__ == "__main__":
    # ---------- CONFIG ----------
    DOCS_DIRECTORY = "../../data/processed_lectures/lecture1_intro_to_process_control"
    file_name = "4_Blending System Illustration"
    IMAGES_DIR = os.path.join(DOCS_DIRECTORY, "images", file_name)
    PDF_PATH = os.path.join(DOCS_DIRECTORY, f"{file_name}.pdf")

    os.makedirs(IMAGES_DIR, exist_ok=True)
    print(f"Images will be saved to: {IMAGES_DIR}")

    client = initialize_client()

    # ---------- PROCESSING ----------
    elements = partition_document(PDF_PATH, IMAGES_DIR, POPPLER_PATH)
    new_elements = process_images(elements, IMAGES_DIR, client)
    new_elements_cleaned = [el for el in new_elements if not isinstance(el, Table)]
    print(f"✅ Number of elements after removing tables: {len(new_elements_cleaned)}")

    cleaned_text = reconstruct_clean_text(new_elements_cleaned)

    # ---------- SAVE FILES ----------
    file_name_lower = file_name.lower()
    save_to_file(
        os.path.join(DOCS_DIRECTORY, f"new_elements_cleaned_{file_name_lower}.pkl"),
        f"new_elements_cleaned_{file_name_lower}.pkl",
        new_elements_cleaned
    )
    save_to_file(
        os.path.join(DOCS_DIRECTORY, f"cleaned_text_{file_name_lower}.txt"),
        f"cleaned_text_{file_name_lower}.txt",
        cleaned_text,
        mode="w",
        encoding="utf-8"
    )