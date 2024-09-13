import React, { useState } from "react";
import axios from "axios";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please upload an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

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
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error extracting diagnosis.");
    }
  };

  return (
    <div className="App">
      <h1>Medical Report Diagnosis</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload and Get Diagnosis</button>
      </form>
    </div>
  );
}

export default App;
