import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import BookSlotModal from '../components/BookSlotModal';
import ViewBookingsModal from '../components/ViewBookingsModal';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedBikeId, setSelectedBikeId] = useState('');

  useEffect(() => {
    loadPublicBikes();
  }, [filterType]);

  const loadPublicBikes = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        status: 'available',
        ...(filterType && { type: filterType }),
      };
      const data = await apiService.getPublicBikes(filters);
      setBikes(data.bikes || []);
    } catch (err) {
      console.error('Error loading bikes:', err);
      setError('Failed to load available bikes');
    }
    setLoading(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'eBike':
        return '🚴';
      case 'Gyroscooter':
        return '🛴';
      case 'Segway':
        return '🛴';
      default:
        return '🚲';
    }
  };

  const handleBookNow = (bikeId) => {
    if (!user) {
      navigate('/login', {
        state: {
          message: 'Please login to book a bike',
          returnUrl: '/',
          bikeId,
        },
      });
    } else {
      setSelectedBikeId(bikeId);
      setShowBookModal(true);
    }
  };

  const filteredBikes = bikes.filter((bike) =>
    !searchLocation || bike.location.toLowerCase().includes(searchLocation.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="container">
            <h1 className="hero-title">
              Welcome to <span>DALScooter</span>
            </h1>
            <p className="hero-subtitle">
              Book and ride eco-friendly scooters across campus with secure authentication
            </p>
            <div className="hero-buttons">
              {!user ? (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="glass-button border"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="glass-button border"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/feedback')}
                    className="glass-button"
                  >
                    Go to Issues Page
                  </button>
                  <button
                    onClick={() => setShowBookingsModal(true)}
                    className="glass-button"
                  >
                    View My Bookings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Available Bikes Section */}
        <div className="bikes-section">
          <div className="section-title">Available Bikes & Scooters</div>
          <div className="section-subtitle">Choose from our eco-friendly fleet</div>

          {/* Filters */}
          <div className="filter-container">
            <div className="filter-buttons">
              <button
                onClick={() => setFilterType('')}
                className={`filter-button ${filterType === '' ? 'active' : ''}`}
              >
                All Types ({bikes.length})
              </button>
              <button
                onClick={() => setFilterType('eBike')}
                className={`filter-button ${filterType === 'eBike' ? 'active' : ''}`}
              >
                🚴 eBikes ({bikes.filter((b) => b.type === 'eBike').length})
              </button>
              <button
                onClick={() => setFilterType('Gyroscooter')}
                className={`filter-button ${filterType === 'Gyroscooter' ? 'active' : ''}`}
              >
                🛴 Gyroscooters ({bikes.filter((b) => b.type === 'Gyroscooter').length})
              </button>
              <button
                onClick={() => setFilterType('Segway')}
                className={`filter-button ${filterType === 'Segway' ? 'active' : ''}`}
              >
                🛴 Segways ({bikes.filter((b) => b.type === 'Segway').length})
              </button>
            </div>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="error-card">
              <p className="error-text">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading available bikes...</p>
            </div>
          ) : filteredBikes.length === 0 ? (
            <div className="no-bikes-container">
              <div className="no-bikes-icon">🚲</div>
              <p className="no-bikes-text">No bikes available</p>
              <p className="no-bikes-subtext">
                {searchLocation ? 'Try searching in a different location' : 'Check back later for new availability'}
              </p>
            </div>
          ) : (
            /* Bikes Grid */
            <div className="bikes-grid">
              {filteredBikes.map((bike) => (
                <div key={bike.bike_id} className="bike-card">
                  <div className="bike-card-content">
                    <div className="bike-header">
                      <div className="bike-info">
                        <span className="bike-icon">{getTypeIcon(bike.type)}</span>
                        <div>
                          <h3 className="bike-title">{bike.type}</h3>
                          <p className="bike-code">{bike.access_code}</p>
                        </div>
                      </div>
                      <span className="status-badge">Available</span>
                    </div>

                    <div className="bike-details">
                      <div className="detail-item">
                        <span>📍</span>
                        {bike.location}
                      </div>
                      <div className="detail-item">
                        <span>💰</span>
                        ${bike.hourly_rate}/hour
                      </div>
                      {bike.discount_code && (
                        <div className="discount-badge">🎫 {bike.discount_code}</div>
                      )}
                    </div>

                    {/* Features */}
                    {bike.features && Object.keys(bike.features).length > 0 && (
                      <div className="features-container">
                        <div className="features-list">
                          {Object.entries(bike.features).map(([key, value]) => {
                            if (typeof value === 'boolean' && value) {
                              return (
                                <span key={key} className="feature-badge">
                                  {key.replace(/_/g, ' ')}
                                </span>
                              );
                            } else if (typeof value === 'string' && value) {
                              return (
                                <span key={key} className="feature-badge gray">
                                  {key.replace(/_/g, ' ')}: {value}
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleBookNow(bike.bike_id)}
                      className="book-button"
                    >
                      {user ? 'Book Now' : 'Login to Book'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="container">
            <div className="section-title">Why Choose DALScooter?</div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">Secure Authentication</h3>
                <p className="feature-text">
                  Multi-factor authentication ensures your account is always protected
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🌱</div>
                <h3 className="feature-title">Eco-Friendly</h3>
                <p className="feature-text">
                  Electric bikes and scooters for sustainable campus transportation
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3 className="feature-title">Easy Booking</h3>
                <p className="feature-text">
                  Simple online booking with instant access codes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showBookModal && (
          <BookSlotModal bikeId={selectedBikeId} onClose={() => setShowBookModal(false)} />
        )}
        {showBookingsModal && (
          <ViewBookingsModal onClose={() => setShowBookingsModal(false)} />
        )}
      </div>
    </>
  );
}

export default HomePage;