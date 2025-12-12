## NALA ORIGINAL CODE ##
import os
import json
import base64
from docx import Document
from docx.oxml.ns import qn
from pdf2docx import Converter   

BLIP = "{http://schemas.openxmlformats.org/drawingml/2006/main}blip"


"""
Convert a PDF document into a Microsoft Word ``.docx`` file.

This function is a thin wrapper around :class:`pdf2docx.Converter` and provides
a simple and reusable way to transform PDF files before feeding them into
the DOCX text+image extraction pipeline. The function opens the PDF,
performs a page-by-page conversion, writes the resulting Word document to
``docx_path``, and ensures the underlying converter is properly closed even
if an exception occurs.

Parameters
----------
pdf_path : str
    Absolute or relative path to the source PDF file.
    The file must be accessible and readable. All pages from the PDF
    will be converted unless an error occurs.

docx_path : str
    Output path where the generated Word file will be saved.
    If the directory does not exist, ``pdf2docx`` will raise an error.
    Existing files at this path will be overwritten.

Returns
-------
None
    This function does not return a value.  
    The generated ``.docx`` file is written directly to ``docx_path``.

Raises
------
FileNotFoundError
    If ``pdf_path`` does not exist or cannot be opened.

pdf2docx.exceptions.PDF2DocxError
    If the PDF is corrupt, encrypted, or cannot be converted.

OSError
    If the output path is invalid or unwritable.

Notes
-----
* ``start=0`` and ``end=None`` ensure that **all pages** of the PDF are converted.
* Conversion performance depends on PDF complexity (vector graphics,
    scanned images, tables, etc.).
* This function does **not** perform OCR. Scanned PDFs without embedded
    text will be converted into non-editable images within the DOCX.

Examples
--------
Convert a PDF file into Word format::

    pdf_to_docx("input.pdf", "output.docx")

This function is typically used before calling
:func:`extract_docx_with_embedded_images`::

    pdf_to_docx("report.pdf", "report.docx")
    blocks = extract_docx_with_embedded_images("report.docx")

"""

# ---------- PDF → DOCX helper ----------
def pdf_to_docx(pdf_path: str, docx_path: str) -> None:
    """
    Convert a PDF file to a Word (.docx) document.

    Parameters
    ----------
    pdf_path : str
        Path to the input PDF file.
    docx_path : str
        Path where the output Word file should be saved.
    """
    os.makedirs(os.path.dirname(docx_path), exist_ok=True)
    converter = Converter(pdf_path)
    try:
        converter.convert(docx_path, start=0, end=None)
        print(f"[INFO] PDF converted to DOCX: {docx_path}")
    except Exception as e:
        print(f"[ERROR] PDF conversion failed: {e}")
    finally:
        converter.close()

# ---------- PDF → DOCX → blocks pipeline ----------
def extract_docx_with_embedded_images(docx_path):
    """
    Read a .docx file, extract text and images in document order, and link
    each image to its preceding and following text blocks.

    Images are stored as base64 strings (not saved to disk).

    Returns: list of document blocks, e.g.
        [
          {"id": 0, "type": "text", "text": "..."},
          {"id": 1, "type": "image", "data": "<base64>", "ext": "png",
           "preceding_text_id": 0, "following_text_id": 2},
          ...
        ]
    """

    doc = Document(docx_path)
    blocks = []

    def add_text_block(text):
        text = text.strip()
        if not text:
            return None
        block_id = len(blocks)
        blocks.append({
            "id": block_id,
            "type": "text",
            "text": text,
        })
        return block_id

    def encode_image_part(image_part):
        """Return base64 encoded image + extension."""
        ext = (image_part.filename or ".png").split(".")[-1].lower()
        b64 = base64.b64encode(image_part.blob).decode("utf-8")
        return b64, ext

    # Walk through document paragraphs in order
    for para in doc.paragraphs:
        running_text = ""

        for run in para.runs:
            # Find embedded images (blips)
            # blips = run._element.xpath(".//a:blip", nsmap)
            blips = run._element.findall(".//" + BLIP)

            if not blips:
                running_text += run.text
                continue

            # First flush text that appears BEFORE the image
            preceding_id = add_text_block(running_text)
            running_text = ""

            # Process each embedded image
            for blip in blips:
                rId = blip.get(qn("r:embed"))
                image_part = doc.part.related_parts[rId]

                b64, ext = encode_image_part(image_part)

                img_block_id = len(blocks)
                blocks.append({
                    "id": img_block_id,
                    "type": "image",
                    "data": b64,
                    "ext": ext,
                    "preceding_text_id": preceding_id,
                    "following_text_id": None,  # fill later
                })

        # After finishing the paragraph, flush trailing text
        if running_text.strip():
            add_text_block(running_text)

    # Second pass: fill in following_text_id for images
    for i, block in enumerate(blocks):
        if block["type"] != "image":
            continue

        # Find next text block
        following = None
        for j in range(i + 1, len(blocks)):
            if blocks[j]["type"] == "text":
                following = blocks[j]["id"]
                break

        block["following_text_id"] = following

    return blocks

def extract_pdf_with_embedded_images(pdf_path: str, docx_path: str | None = None):
    """
    High-level helper:
    1. Convert PDF → DOCX
    2. Run extract_docx_with_embedded_images on the DOCX
    3. Return extracted blocks

    Parameters
    ----------
    pdf_path : str
        Path to the input PDF file.
    docx_path : str | None
        Optional path for the intermediate DOCX.
        If None, uses pdf_path with `.docx` extension.

    Returns
    -------
    list
        List of document blocks (same format as extract_docx_with_embedded_images).
    """
    if docx_path is None:
        if "." in pdf_path:
            docx_path = pdf_path.rsplit(".", 1)[0] + ".docx"
        else:
            docx_path = pdf_path + ".docx"

    # 1) Convert PDF → DOCX
    pdf_to_docx(pdf_path, docx_path)

    # 2) Extract text + images from the DOCX
    blocks = extract_docx_with_embedded_images(docx_path)
    return blocks

# ---------------------------------------------------------
# Batch process subtopic files
# ---------------------------------------------------------

def process_subtopic_pdf(topic_pdf_path: str, output_dir: str):
    """
    For each topic folder under processed_lectures:
      For each PDF subtopic:
        Convert → DOCX
        Extract → JSON blocks
    """
    for topic_name in os.listdir(topic_pdf_path):
        topic_dir = os.path.join(topic_pdf_path, topic_name)
        if not os.path.isdir(topic_dir):
            continue
        print(f"\n=== Processing Topic: {topic_name} ===")

        # output folder: processed_docs/topic_name/
        topic_out_dir = os.path.join(output_dir, topic_name)
        os.makedirs(topic_out_dir, exist_ok=True)

        for filename in os.listdir(topic_dir):
            if not filename.lower().endswith(".pdf"):
                continue

            subtopic_name = filename[:-4]  # remove .pdf

            pdf_file_path = os.path.join(topic_dir, filename)  
            docx_path = os.path.join(topic_out_dir, f"{subtopic_name}.docx")
            json_path = os.path.join(topic_out_dir, f"{subtopic_name}.json")

            # Step 1: PDF → DOCX
            pdf_to_docx(pdf_file_path, docx_path)

            # Step 2: DOCX → blocks
            blocks = extract_docx_with_embedded_images(docx_path)

            # Step 3: Save blocks to JSON
            json.dump(blocks, open(json_path, "w"), indent=2)
            print(f"[OK] Saved {json_path}")

if __name__ == "__main__":
    input_pdf_dir = "../../data/ch3111_materials/processed_lectures"
    output_data_dir = "../../data/ch3111_materials/processed_docs"
    process_subtopic_pdf(input_pdf_dir, output_data_dir)
