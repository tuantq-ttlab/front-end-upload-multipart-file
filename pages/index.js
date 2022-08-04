import React, { Component } from "react";
import axios from "axios";
import sortBy from "lodash/sortBy";

export default class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileSelected: null,
      uploadId: "",
      uploadUrls: [],
      totalParts: 1,
      fileName: "",
      backendUrl: "https://shz-dev.tokyotechlab.com/api/shz",
    };
  }

  async fileHandler(event) {
    try {
      let fileSelected = event.target.files[0];
      let fileName = fileSelected.name;
      this.setState({ fileSelected });
      this.setState({ fileName });
    } catch (err) {
      console.error(err, err.message);
    }
  }

  async startUpload(event) {
    try {
      event.preventDefault();
      const CHUNK_SIZE = 1024 * 1000 * 200; // 200MB
      const fileSize = this.state.fileSelected.size;
      const CHUNKS_COUNT = Math.floor(fileSize / CHUNK_SIZE) + 1;

      const params = {
        videoName: this.state.fileName,
        scheduleId: 3506,
        deviceId: 75,
        logFile: "logFile.log",
        totalParts: CHUNKS_COUNT,
      };

      let resp = await axios.post(
        `${this.state.backendUrl}/video`,
        {},
        {
          data: { ...params },
          headers:{
            Authorization :"le2yqnuADp9e3k60cYxkHNW5VhRLLXNGevGR0anVP0xNlMvxeMtqgZ5UKBD7J9D9O6tEWIOqXTuSSyuP1JY6QxevH1PdTljqOBEaJu9G7G3MxAqCULK792XhcT3r1YsAov3WsquY3v7w6YSGg2V5Bk392yjDJ0Q3EMxKIqf2kb43Drq0hRlFI7Zg5ry1FIVkZeSW9cmaR8MUEsFnGMKr6tNYw6Hp2GRYq1mUdbdP6uKI1TUP87vxfV7dhKEzTst"
          }
        }
      );
      console.log(resp?.data)
      const { uploadMultipartVideoUrls } = resp?.data?.data?.presignedLink;
      this.setState({
        ...this.state,
        uploadUrls: uploadMultipartVideoUrls.uploadUrls,
        uploadId: uploadMultipartVideoUrls.uploadId,
        totalParts: CHUNKS_COUNT,
      });
      // this.uploadMultipartFile();
    } catch (err) {
      console.log(err);
    }
  }

  async uploadMultipartFile() {
    try {
      const eTags = [];
      let start, end, blob;
      const { totalParts } = this.state;

      if (this.state.uploadUrls?.length) {
        for (let index = 0; index < this.state.uploadUrls?.length; index++) {
          const part = this.state.uploadUrls[index].part
          const url = this.state.uploadUrls[index].url

          start = (part - 1) * 1024 * 1000 * 200;
          end = part * 1024 * 1000 * 200;
          blob =
            part < totalParts
              ? this.state.fileSelected.slice(start, end)
              : this.state.fileSelected.slice(start);
          const result = await axios.put(url, blob, {
            headers: {
              "Content-Type": this.state.fileSelected.type,
            },
          });
          const { headers } = result;
          eTags.push({
            ETag: headers.etag,
            PartNumber: part,
          });
        }
      }

      let completeUploadResp = await axios.post(
        `${this.state.backendUrl}/complete-upload`,
        {},
        {
          data: {
            videoName: this.state.fileName,
            parts: sortBy(eTags, ["PartNumber"]),
            uploadId: this.state.uploadId,
          },
        }
      );

      console.log(completeUploadResp.data, "complete upload response");
    } catch (err) {
      console.log(err);
    }
  }

  async getData() {
    const resp = await axios.get(
      `${this.state.backendUrl}/api/v1/file/62c3b627d34caccddce9dbad`
    );
    console.log(resp);
  }

  componentDidMount() {
    // this.getData();
  }
  render() {
    return (
      <div style={{ backgroundColor: "grey", height: 1500 }}>
        <form onSubmit={this.startUpload.bind(this)}>
          <div>
            <p>Upload Dataset:</p>
            <input
              type="file"
              id="file"
              onChange={this.fileHandler.bind(this)}
            />
            <button type="submit">Upload</button>
          </div>
        </form>
      </div>
    );
  }
}
