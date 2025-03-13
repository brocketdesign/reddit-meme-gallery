import React, { useState, useEffect, useRef, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Search from './components/Search';
import Navigation from './components/Navigation';
import MemePage from './components/MemePage';
import MemeGallery from './components/MemeGallery';

// Create a reusable LazyVideo component for all video types
const LazyVideo = React.memo(({ videoUrl, thumbnailUrl, videoType = "video/mp4" }) => {
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Add cleanup function to free resources when component unmounts or video scrolls far away
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If video is far out of view and playing, pause it to save resources
        if (!entries[0].isIntersecting && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const handleVideoError = () => {
    setError("Failed to load video");
  };

  return (
    <div className="video-container" ref={containerRef}>
      <video 
        ref={videoRef}
        controls 
        preload="metadata"
        loop 
        muted 
        className="media-content"
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        poster={thumbnailUrl}
      >
        <source src={videoUrl} type={videoType} />
        Your browser does not support video playback.
      </video>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => {
            setError(null);
            if (videoRef.current) {
              videoRef.current.load();
            }
          }} className="retry-button">
            Retry
          </button>
        </div>
      )}
    </div>
  );
});

// Create a new component for lazy-loaded RedGifs
const LazyRedGif = React.memo(({ gifId, thumbnailUrl, memeId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Set up intersection observer to detect when element is visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !videoUrl && !error) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 } // Trigger when at least 10% of the element is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isLoading, videoUrl, error]);

  // Load the video when it becomes visible
  useEffect(() => {
    if (isVisible && !isLoading && !videoUrl && !error) {
      setIsLoading(true);
      const serverUrl = 'http://localhost:3001';
      const url = `${serverUrl}/api/redgifs/${gifId}`;

      // Check if the endpoint is available
      fetch(`${url}`, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
          setVideoUrl(url);
        })
        .catch(err => {
          console.error('Error fetching RedGifs:', err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isVisible, isLoading, videoUrl, error, gifId]);

  return (
    <div className="video-container" ref={containerRef}>
      {videoUrl ? (
        <video 
          ref={videoRef}
          controls 
          preload="metadata"
          loop 
          muted 
          className="media-content"
          poster={thumbnailUrl}
          onError={() => setError("Failed to load video")}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      ) : error ? (
        <div className="error-message">
          Failed to load RedGifs content: {error}
          <button onClick={() => {
            setError(null);
            setIsVisible(true);
          }} className="retry-button">
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <circle cx="16" cy="16" r="14" fill="none" strokeWidth="4" stroke="#fff" strokeDasharray="87.96459430051421 87.96459430051421" transform="rotate(120 16 16)">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="0.75s" from="0 16 16" to="360 16 16" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <span>Loading RedGifs content...</span>
        </div>
      ) : (
        <div className="loading-container" onClick={() => setIsVisible(true)}>
          {thumbnailUrl && <img src={thumbnailUrl} alt="RedGifs thumbnail" className="poster-image" />}
          <div className="loading-message">Click to load content</div>
        </div>
      )}
    </div>
  );
});

function App() {
  // Retrieve visitedSubreddits from local storage
  const visitedSubreddits = JSON.parse(localStorage.getItem('visitedSubreddits')) || [];
  const navigate = useNavigate();
  const location = window.location;

  useEffect(() => {
    // Only perform redirection if currently at the root path
    if (location.pathname === "/") {
      if (visitedSubreddits.length > 0) {
        // Redirect to the last visited subreddit
        const lastVisitedSubreddit = visitedSubreddits[0].display_name;
        navigate(`/r/${lastVisitedSubreddit}`);
      } else {
        // Redirect to search page when no visited subreddits are available
        navigate('/search');
      }
    }
  }, [visitedSubreddits, navigate, location.pathname]);

  return (
    <div className="App">
      <Navigation />
      
      <main className="px-3 py-6">
        <Routes>
          <Route path="/search" element={<Search />} />
          <Route path="/r/:subreddit" element={<SubredditRoute />} />
          <Route path="/r/:subreddit/:memeId" element={<MemePage />} />
        </Routes>
      </main>
    </div>
  );
}

function SubredditRoute() {
  const { subreddit } = useParams();
  return <MemeGallery subreddit={subreddit} />;
}

export default App;
