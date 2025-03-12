import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(searchTerm)}&include_over_18=1`);
      const data = await response.json();
      
      if (data && data.data && data.data.children) {
        setSearchResults(data.data.children.map(item => item.data));
      } else {
        setError('No results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching subreddits:', error);
      setError('Error searching subreddits. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Search Subreddits</h1>
        
        <form onSubmit={handleSearchSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter subreddit name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
            />
            <button 
              type="submit" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((subreddit) => (
            <Link 
              to={`/r/${subreddit.display_name}`} 
              key={subreddit.id}
              className="block bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-1">r/{subreddit.display_name}</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {subreddit.subscribers?.toLocaleString() || 0} subscribers
                </p>
                <p className="text-sm line-clamp-3">
                  {subreddit.public_description || 'No description available'}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {searchResults.length === 0 && !isLoading && !error && searchTerm && (
          <p className="text-center text-muted-foreground">No results found. Try a different search term.</p>
        )}
      </div>
    </div>
  );
}

export default Search;
