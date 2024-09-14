import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // You can add this if moving styles to an external CSS file

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      alert("Please upload at least one image file.");
      return;
    }

    setLoading(true); // Start loading

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("images", selectedFiles[i]);
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/extract_diagnosis",
        formData,
        {
          responseType: "blob", // Set responseType to 'blob' for downloading files
        }
      );

      // Create a link element to download the CSV file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "diagnosis_output.csv"); // Set the file name
      document.body.appendChild(link);
      link.click();
      link.remove();

      setLoading(false); // Stop loading after download
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error extracting diagnosis.");
      setLoading(false); // Stop loading in case of error
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">Medical Diagnosis Extractor</h1>

        {/* Show loading spinner if the app is in loading state */}
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Processing, please wait...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="upload-form">
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              className="file-input"
            />
            <button type="submit" className="upload-button">
              Get Diagnosis
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
