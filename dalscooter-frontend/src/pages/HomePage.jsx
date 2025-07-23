import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    loadPublicBikes();
  }, [filterType]);

  const loadPublicBikes = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        status: 'available', // Only show available bikes
        ...(filterType && { type: filterType })
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

  const handleBookNow = (bike) => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { 
          message: 'Please login to book a bike',
          returnUrl: '/',
          bikeId: bike.bike_id 
        }
      });
    } else {
      // Navigate to booking page or show booking modal
      navigate('/book-bike', { state: { bike } });
    }
  };

  const filteredBikes = bikes.filter(bike => 
    !searchLocation || 
    bike.location.toLowerCase().includes(searchLocation.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
          <div className="container max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to <span style={{ color: '#32746D' }}>DALScooter</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Book and ride eco-friendly scooters across campus using secure authentication
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                  >
                    Login
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/customer-home')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Available Bikes Section */}
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Bikes & Scooters</h2>
            <p className="text-gray-600 text-lg">Choose from our eco-friendly fleet</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilterType('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === ''
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Types ({bikes.length})
                </button>
                <button
                  onClick={() => setFilterType('eBike')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'eBike'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🚴 eBikes ({bikes.filter(b => b.type === 'eBike').length})
                </button>
                <button
                  onClick={() => setFilterType('Gyroscooter')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'Gyroscooter'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🛴 Gyroscooters ({bikes.filter(b => b.type === 'Gyroscooter').length})
                </button>
                <button
                  onClick={() => setFilterType('Segway')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === 'Segway'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🛴 Segways ({bikes.filter(b => b.type === 'Segway').length})
                </button>
              </div>

              <div className="relative w-full lg:w-64">
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading available bikes...</p>
            </div>
          ) : filteredBikes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚲</div>
              <p className="text-gray-500 text-lg mb-2">No bikes available</p>
              <p className="text-gray-400">
                {searchLocation ? 'Try searching in a different location' : 'Check back later for new availability'}
              </p>
            </div>
          ) : (
            /* Bikes Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBikes.map((bike) => (
                <div
                  key={bike.bike_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getTypeIcon(bike.type)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{bike.type}</h3>
                          <p className="text-sm text-gray-500">{bike.access_code}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Available
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📍</span>
                        {bike.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>💰</span>
                        ${bike.hourly_rate}/hour
                      </div>
                      {bike.discount_code && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          🎫 {bike.discount_code}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {bike.features && Object.keys(bike.features).length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(bike.features).map(([key, value]) => {
                            if (typeof value === 'boolean' && value) {
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {key.replace(/_/g, ' ')}
                                </span>
                              );
                            } else if (typeof value === 'string' && value) {
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
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
                      onClick={() => handleBookNow(bike)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
        <div className="bg-white py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DALScooter?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Secure Authentication</h3>
                <p className="text-gray-600">Multi-factor authentication ensures your account is always protected</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-xl font-semibold mb-2">Eco-Friendly</h3>
                <p className="text-gray-600">Electric bikes and scooters for sustainable campus transportation</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
                <p className="text-gray-600">Simple online booking with instant access codes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;