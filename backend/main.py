from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai
from io import BytesIO
import os
import csv
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import tenacity
import random

load_dotenv()
genai.configure(api_key=os.getenv("API_KEY"))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
logging.basicConfig(level=logging.DEBUG)

@tenacity.retry(
    stop=tenacity.stop_after_attempt(5),
    wait=tenacity.wait_exponential(multiplier=2, min=4, max=60),  # Increased wait time
    retry=tenacity.retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: logging.info(f"Retrying {retry_state.attempt_number} for {retry_state.args[0]}...")
)
def process_image_with_retry(image_file):
    try:
        image = Image.open(BytesIO(image_file.read()))
        prompt = ["Extract the diagnosis from this medical report image and also correct grammatical spelling or semantic errors. Give only the diagnosis in your response in one line without punctuation:", image]
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        # Clean the response (strip newlines, commas, and other problematic characters)
        diagnosis = response.text.strip().replace("\n", " ").replace(",", " ")
        return image_file.filename, diagnosis
    except Exception as e:
        logging.error(f"Error processing {image_file.filename}: {str(e)}")
        return image_file.filename, "Error: Failed to extract diagnosis"

def process_image(image_file):
    try:
        return process_image_with_retry(image_file)
    except Exception as e:
        logging.error(f"Error processing {image_file.filename} after retries: {str(e)}")
        return image_file.filename, f"Error: Unable to process image after multiple attempts"

def save_partial_results(results, csv_filename):
    with open(csv_filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["file_name", "provisional_diagnosis"])
        for filename, diagnosis in results:
            writer.writerow([filename, diagnosis])

@app.route('/extract_diagnosis', methods=['POST'])
def extract_medical_diagnosis():
    if 'images' not in request.files:
        logging.error("No images uploaded")
        return jsonify({"error": "No images uploaded"}), 400

    images = request.files.getlist('images')
    csv_filename = "diagnosis_output.csv"
    
    results = []
    with ThreadPoolExecutor(max_workers=2) as executor:  # Reduced number of workers
        futures = [executor.submit(process_image, image_file) for image_file in images]

        for future in as_completed(futures):
            filename, diagnosis = future.result()
            results.append((filename, diagnosis))
            save_partial_results(results, csv_filename)
            time.sleep(random.uniform(2.0, 4.0))  # Increased delay between requests

    return send_file(csv_filename, mimetype='text/csv', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
