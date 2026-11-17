// Import React
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { useState, useEffect } from 'react';
// Import React FilePond
import { FilePond, registerPlugin } from 'react-filepond';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// Import the Image EXIF Orientation and Image Preview plugins
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
// Note: These need to be installed separately
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { toast } from 'sonner';
// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview,FilePondPluginFileValidateType);

// Our app
export default function Avatar({ avatar }) {
  // constructor(props) {
  //     super(props);
  const [file, setFile] = useState([]);
  useEffect(() => {
    if (avatar) {
      setFile([
        {
          // Set initial files, type 'local' means this is a file
          // that has already been uploaded to the server (see docs)
          source: avatar,
        }
      ]);
    }

  }, [avatar])

  const updateAvatar = () => {
    const formData = new FormData();
    formData.append("avatar", file?.[0])
    fetch(`${process.env.NEXT_PUBLIC_URL}/update/avatar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.code && data.code == "success") {
          toast.success(data.message);
        }
      })
  }

  const handleInit = () => {
    // console.log('FilePond instance has initialised', this.pond);
  }

  return (
    <>
      <div className="avatar">
        {/* Pass FilePond properties as attributes */}
        <FilePond
          // ref={(ref) => (this.pond = ref)}
          files={file}
          allowMultiple={false}
          maxFiles={1}
          acceptedFileTypes={['image/*']}
          // server="/api"
          oninit={() => handleInit()}
          onupdatefiles={(fileItems) => {
            setFile(fileItems.map((fileItem) => fileItem.file));
          }}
          labelIdle="Kéo thả ảnh đại diện vào đây"
        ></FilePond>
      </div>
      <div
        className="update-avatar-button"
        style={{
          marginTop: "20px",
          display: "block",
          width: "fit-content",
          marginLeft: "auto",
          padding: "8px 20px",
          background: "#8FE3A9",
          color: "#000000",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "700",
          fontSize: "13px"
        }}
        onClick={() => updateAvatar()}
      >
        Cập nhật
      </div>
    </>
  );
}
