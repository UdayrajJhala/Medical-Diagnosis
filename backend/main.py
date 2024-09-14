from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai
from io import BytesIO
import os
import csv
import logging

# Load environment variables from the .env file
load_dotenv()

# Configure the API key from the .env file
genai.configure(api_key=os.getenv("API_KEY"))

app = Flask(__name__)

# Enable CORS for the React app
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Function to extract medical diagnosis and store it in a CSV file
@app.route('/extract_diagnosis', methods=['POST'])
def extract_medical_diagnosis():
    try:
        if 'images' not in request.files:
            logging.error("No images uploaded")
            return jsonify({"error": "No images uploaded"}), 400

        images = request.files.getlist('images')

        # Prepare to write multiple diagnoses to a CSV file
        csv_filename = "diagnosis_output.csv"
        with open(csv_filename, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["file_name", "provisional_diagnosis"])  # Header

            # Iterate through the uploaded images
            for image_file in images:
                image = Image.open(BytesIO(image_file.read()))

                # Define the prompt for diagnosis extraction
                prompt = ["Extract the diagnosis from this medical report image and also correct grammatical spelling or semantic errors. Give only the diagnosis in your response in one line without punctuation:", image]

                # Initialize the Gemini 1.5 Flash model
                model = genai.GenerativeModel("gemini-1.5-flash")

                # Send the request with text and image input
                response = model.generate_content(prompt)
                diagnosis = response.text.strip()

                # Write the diagnosis to the CSV file
                writer.writerow([image_file.filename, diagnosis])

        # Return the CSV file as a response for download
        return send_file(csv_filename, mimetype='text/csv', as_attachment=True)

    except Exception as e:
        logging.error("Error occurred:", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
