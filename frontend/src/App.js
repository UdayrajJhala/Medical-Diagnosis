import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      alert("Please upload at least one image file.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("images", selectedFiles[i]);
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/extract_diagnosis",
        formData,
        {
          responseType: "blob",
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "diagnosis_output.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setLoading(false);
      setProgress(0);
      alert("Diagnosis extraction completed successfully!");
    } catch (error) {
      console.error("Error uploading images:", error);
      alert(
        "Error extracting diagnosis. Please try again with fewer files or contact support."
      );
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">Medical Diagnosis Extractor</h1>
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
