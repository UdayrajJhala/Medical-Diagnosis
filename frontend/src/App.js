import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Papa from "papaparse";
import "./App.css";

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [csvUrl, setCsvUrl] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please upload at least one image file.");
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
      setCsvUrl(url);

      // Parse CSV data and set state
      Papa.parse(response.data, {
        complete: (result) => {
          setCsvData(result.data);
        },
        header: true,
      });

      setLoading(false);
      setProgress(0);
      toast.success("Diagnosis extraction completed successfully!");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(
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
        {csvData.length > 0 && (
          <div className="csv-table-container">
            <table className="csv-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Provisional Diagnosis</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.file_name}</td>
                    <td>{row.provisional_diagnosis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {csvUrl && (
          <div className="csv-container">
            <a
              href={csvUrl}
              download="diagnosis_output.csv"
              className="download-button"
            >
              Download Output
            </a>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
