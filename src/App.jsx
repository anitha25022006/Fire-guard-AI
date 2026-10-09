import { useState } from "react";
import "./App.css";

function App() {
  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleVideoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    setVideo(file);
    setVideoUrl(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const analyzeVideo = async () => {
    if (!video) {
      setError("Please upload a video first.");
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", video);

      const response = await fetch(
        "http://127.0.0.1:8000/detect-video",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Backend error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Video analysis failed."
        );
      }

      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not connect to the AI backend."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const fireDetected = result?.fire_detected === true;
  const smokeDetected = result?.smoke_detected === true;

  return (
    <div className="app">

      <header className="topbar">

        <div className="brand">

          <div className="logo">
            🔥
          </div>

          <div>
            <h1>FIREGUARD AI</h1>

            <span>
              Fire, Smoke & Person Detection Command Center
            </span>
          </div>

        </div>

        <div
          className={`status ${
            fireDetected ? "emergency" : ""
          }`}
        >
          <span className="statusDot"></span>

          {fireDetected
            ? "FIRE DETECTED"
            : "SYSTEM READY"}
        </div>

      </header>

      <main className="content">

        <section className="hero">

          <div>

            <h2>
              Video Emergency Analysis
            </h2>

            <p>
              Upload CCTV footage for AI-powered fire,
              smoke and person detection
            </p>

          </div>

          <div className="liveText">
            ● VIDEO ANALYSIS MODE
          </div>

        </section>

        <section className="stats">

          <div className="card">

            <div className="statTitle">
              Fire Status
            </div>

            <div
              className={`statValue ${
                fireDetected ? "danger" : "safe"
              }`}
            >
              {result
                ? fireDetected
                  ? "DETECTED"
                  : "SAFE"
                : "WAITING"}
            </div>

          </div>

          <div className="card">

            <div className="statTitle">
              Smoke Status
            </div>

            <div
              className={`statValue ${
                smokeDetected ? "danger" : "safe"
              }`}
            >
              {result
                ? smokeDetected
                  ? "DETECTED"
                  : "CLEAR"
                : "WAITING"}
            </div>

          </div>

          <div className="card">

            <div className="statTitle">
              Maximum People
            </div>

            <div className="statValue blue">
              {result
                ? result.max_person_count
                : "--"}
            </div>

          </div>

          <div className="card">

            <div className="statTitle">
              AI Engine
            </div>

            <div className="statValue safe">
              READY
            </div>

          </div>

        </section>

        <section className="mainGrid">

          <div className="card">

            <div className="sectionTitle">

              <h3>
                CCTV VIDEO
              </h3>

              <span className="live">
                {video
                  ? "● LOADED"
                  : "STANDBY"}
              </span>

            </div>

            <div className="camera">

              {videoUrl ? (

                <video
                  src={videoUrl}
                  controls
                  className="videoPlayer"
                />

              ) : (

                <div className="cameraCenter">

                  <div className="cameraIcon">
                    📹
                  </div>

                  <div>
                    No video selected
                  </div>

                  <small>
                    Upload CCTV footage to begin analysis
                  </small>

                </div>

              )}

              {video && (
                <div className="cameraBadge">
                  CCTV • AI ANALYSIS
                </div>
              )}

            </div>

            <div className="controls">

              <label className="btn btnPrimary uploadButton">

                📹 SELECT VIDEO

                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  hidden
                />

              </label>

              <button
                className="btn btnPrimary"
                onClick={analyzeVideo}
                disabled={!video || analyzing}
              >
                {analyzing
                  ? "🔄 ANALYZING..."
                  : "🔍 ANALYZE VIDEO"}
              </button>

            </div>

            {video && (
              <div className="fileInfo">
                <strong>Selected:</strong>{" "}
                {video.name}
              </div>
            )}

            {error && (
              <div className="error">
                ⚠️ {error}
              </div>
            )}

          </div>

          <div>

            <div
              className={`card alert ${
                fireDetected
                  ? "fireAlert"
                  : ""
              }`}
            >

              <div className="alertIcon">
                {fireDetected
                  ? "🚨"
                  : "🛡️"}
              </div>

              <h3>

                {fireDetected
                  ? "FIRE EMERGENCY DETECTED"
                  : "SYSTEM MONITORING"}

              </h3>

              <p>

                {fireDetected
                  ? "AI detected fire in the uploaded video."
                  : "Upload and analyze CCTV footage to detect fire, smoke and people."}

              </p>

              {fireDetected && (
                <div className="alertBox">
                  🚨 FIRE ALERT ACTIVE
                </div>
              )}

            </div>

            <div className="card buildingCard">

              <div className="sectionTitle">

                <h3>
                  ANALYSIS DETAILS
                </h3>

              </div>

              <div className="details">

                <div className="detail">

                  <small>
                    VIDEO
                  </small>

                  <strong>
                    {result
                      ? result.video_name
                      : "Not analyzed"}
                  </strong>

                </div>

                <div className="detail">

                  <small>
                    FRAMES ANALYZED
                  </small>

                  <strong>
                    {result
                      ? result.analyzed_frames
                      : "--"}
                  </strong>

                </div>

                <div className="detail">

                  <small>
                    FIRE FRAMES
                  </small>

                  <strong>
                    {result
                      ? result.fire_frames
                      : "--"}
                  </strong>

                </div>

                <div className="detail">

                  <small>
                    SMOKE FRAMES
                  </small>

                  <strong>
                    {result
                      ? result.smoke_frames
                      : "--"}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;