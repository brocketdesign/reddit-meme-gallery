import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MemeGallery from './MemeGallery';
import { Helmet } from 'react-helmet-async';

// Import components used by MemePage
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

  // Added cleanup effect to pause video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
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
        autoPlay // Add autoPlay attribute
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
          autoPlay // Add autoPlay attribute
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

function MemePage() {
  const { subreddit, memeId } = useParams();
  const navigate = useNavigate();
  const [meme, setMeme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renderedMedia, setRenderedMedia] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [similarSubreddits, setSimilarSubreddits] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Fetch the specific post data from Reddit API
    fetch(`https://www.reddit.com/r/${subreddit}/comments/${memeId}.json`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Reddit API responded with status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0 && data[0].data.children.length > 0) {
          setMeme(data[0].data.children[0]);
        } else {
          throw new Error('Post not found');
        }
      })
      .catch(err => {
        console.error('Error fetching meme:', err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [subreddit, memeId]);

  // Process media and extract thumbnail
  useEffect(() => {
    if (!meme) return;
    
    // Clear previously rendered media before processing new meme
    setRenderedMedia(null);
    
    const { url, media, post_hint, secure_media, thumbnail, preview } = meme.data;
    
    // Extract thumbnail
    let thumbnailUrl = null;
    if (preview && preview.images && preview.images.length > 0) {
      const image = preview.images[0];
      const resolutions = [...image.resolutions].sort((a, b) => b.width - a.width);
      const bestResolution = resolutions.find(r => r.width <= 640) || resolutions[resolutions.length - 1];
      
      if (bestResolution) {
        thumbnailUrl = bestResolution.url.replace(/&amp;/g, '&');
      } else if (image.source) {
        thumbnailUrl = image.source.url.replace(/&amp;/g, '&');
      }
    }
    
    if (!thumbnailUrl && thumbnail && thumbnail !== 'self' && thumbnail !== 'default') {
      thumbnailUrl = thumbnail;
    }
    
    if (thumbnailUrl) {
      setThumbnail(thumbnailUrl);
    }

    // Render appropriate media component
    if (media && media.reddit_video) {
      setRenderedMedia(
        <LazyVideo 
          key={`${meme.data.id}-redditvideo`}
          videoUrl={media.reddit_video.fallback_url} 
          thumbnailUrl={thumbnailUrl}
          videoType="video/mp4"
        />
      );
    } else if ((url && url.includes('redgifs')) || 
        (secure_media && secure_media.oembed && 
         secure_media.oembed.html && 
         secure_media.oembed.html.includes('redgifs'))) {
      
      if (preview && preview.reddit_video_preview && preview.reddit_video_preview.fallback_url) {
        setRenderedMedia(
          <LazyVideo 
            key={`${meme.data.id}-preview`}
            videoUrl={preview.reddit_video_preview.fallback_url} 
            thumbnailUrl={thumbnailUrl}
            videoType="video/mp4"
          />
        );
      } else {
        // Extract RedGifs ID
        let redgifsId = null;
        
        if (url && url.includes('redgifs')) {
          const urlParts = url.split('/');
          redgifsId = urlParts[urlParts.length - 1].split('?')[0];
        } else if (secure_media && secure_media.oembed && secure_media.oembed.html) {
          const html = secure_media.oembed.html;
          const match = html.match(/redgifs\.com\/(?:watch|ifr)\/([^"&?/]+)/);
          if (match && match[1]) {
            redgifsId = match[1];
          }
        }
        
        if (redgifsId) {
          setRenderedMedia(
            <LazyRedGif 
              key={`${meme.data.id}-redgifs`}
              gifId={redgifsId} 
              thumbnailUrl={thumbnailUrl}
              memeId={meme.data.id}
            />
          );
        } else {
          setRenderedMedia(<p key={`${meme.data.id}-error`}>Unable to load RedGifs content</p>);
        }
      }
    } else if (url && url.includes('.gifv')) {
      const mp4Url = url.replace('.gifv', '.mp4');
      setRenderedMedia(
        <LazyVideo 
          key={`${meme.data.id}-gifv`}
          videoUrl={mp4Url} 
          thumbnailUrl={thumbnailUrl}
          videoType="video/mp4"
        />
      );
    } else if (url && (url.endsWith('.mp4') || url.endsWith('.webm'))) {
      const videoType = url.endsWith('.mp4') ? 'video/mp4' : 'video/webm';
      setRenderedMedia(
        <LazyVideo 
          key={`${meme.data.id}-video`}
          videoUrl={url} 
          thumbnailUrl={thumbnailUrl}
          videoType={videoType}
        />
      );
    } else if (url) {
      // For images
      setRenderedMedia(
        <img 
          key={`${meme.data.id}-img`}
          src={url} 
          alt={meme.data.title} 
          className="media-content" 
        />
      );
    } else {
      setRenderedMedia(<p key={`${meme.data.id}-none`}>Media not available</p>);
    }
  }, [meme, memeId]);

  // Fetch similar subreddits
  useEffect(() => {
    const fetchSimilarSubreddits = async () => {
      try {
        const response = await fetch(`https://www.reddit.com/search.json?q=${subreddit}&type=sr&limit=10&include_over_18=1`);
        if (!response.ok) {
          throw new Error(`Reddit API responded with status ${response.status}`);
        }
        const data = await response.json();
        if (data && data.data && data.data.children) {
          setSimilarSubreddits(data.data.children);
        } else {
          setSimilarSubreddits([]);
        }
      } catch (error) {
        console.error('Error fetching similar subreddits:', error);
        setSimilarSubreddits([]);
      }
    };

    fetchSimilarSubreddits();
  }, [subreddit]);

  if (isLoading) {
    return <div className="loading-container flex justify-center items-center p-10">
      <div className="loading-spinner">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <circle cx="16" cy="16" r="14" fill="none" strokeWidth="4" stroke="#fff" strokeDasharray="87.96459430051421 87.96459430051421" transform="rotate(120 16 16)">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="0.75s" from="0 16 16" to="360 16 16" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>
      <span className="ml-3">Loading meme...</span>
    </div>;
  }

  if (error) {
    return (
      <div className="error-container p-5 text-center">
        <h2 className="text-xl font-bold mb-4">Error loading meme</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => navigate(`/r/${subreddit}`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to r/{subreddit}
        </button>
      </div>
    );
  }

  if (!meme) {
    return (
      <div className="not-found p-5 text-center">
        <h2 className="text-xl font-bold mb-4">Meme not found</h2>
        <button 
          onClick={() => navigate(`/r/${subreddit}`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to r/{subreddit}
        </button>
      </div>
    );
  }

  return (
    <div className="meme-page">
      <Helmet>
        <title>r/{subreddit} - {meme ? meme.data.title : 'Meme Gallery'}</title>
      </Helmet>
      {/* Centered content container */}
      <div className="max-w-4xl mx-auto">
        <div className="navigation-header mb-4">
          <button 
            onClick={() => navigate(`/r/${subreddit}`)}
            className="flex items-center text-blue-500 hover:text-blue-700"
          >
            <span className="mr-2">←</span> Back to r/{subreddit}
          </button>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">{meme.data.title}</h1>
        
        <div className="meme-content mb-6 flex justify-center">
          {renderedMedia || <div className="loading">Loading media...</div>}
        </div>
        
        <div className="meme-details bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700 mb-2">
            <span role="img" aria-label="user" className="mr-1">👤</span> Posted by <span className="font-semibold">u/{meme.data.author}</span>
          </p>
          <p className="text-gray-700 mb-2">
            <span role="img" aria-label="date" className="mr-1">📅</span> {new Date(meme.data.created_utc * 1000).toLocaleString()}
          </p>
          {meme.data.score !== undefined && (
            <p className="text-gray-700 mb-2">
              <span role="img" aria-label="upvotes" className="mr-1">⬆️</span> <span className="font-semibold">{meme.data.score}</span> upvotes
            </p>
          )}
          <a
            href={`https://reddit.com${meme.data.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            <span role="img" aria-label="reddit" className="mr-2">🔗</span> View on Reddit
          </a>
        </div>
  
        {similarSubreddits.length > 0 && (
          <div className="similar-subreddits bg-white shadow-md rounded-lg p-6 mt-4">
            <h2 className="text-xl font-bold mb-4">Similar Subreddits</h2>
            <ul>
              {similarSubreddits.map((sub, index) => (
                <li key={index} className="mb-2">
                  <a
                    href={`/r/${sub.data.display_name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/r/${sub.data.display_name}`);
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    r/{sub.data.display_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
  
      {/* Full-width MemeGallery section */}
      <div className="w-full mt-8 bg-gray-100 py-6 rounded-lg">
        <div className="mx-auto px-4">
          <h2 className="text-xl font-bold mb-4">More from r/{subreddit}</h2>
          <MemeGallery subreddit={subreddit} />
        </div>
      </div>
    </div>
  );
  
}

export default MemePage;
