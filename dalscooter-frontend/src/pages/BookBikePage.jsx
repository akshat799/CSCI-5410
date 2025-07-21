import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

function BookBikePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const bike = location.state?.bike;

  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    duration: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!bike) {
      navigate('/');
      return;
    }

    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    setBookingForm(prev => ({
      ...prev,
      startDate: today,
      endDate: today
    }));
  }, [user, bike, navigate]);

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

  const calculateTotal = () => {
    const hours = bookingForm.duration;
    const rate = bike?.hourly_rate || 0;
    const subtotal = hours * rate;
    const discount = bike?.discount_code ? subtotal * 0.1 : 0; // 10% discount if code exists
    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: (subtotal - discount).toFixed(2),
      hours
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Here you would normally call your booking API
      // For now, we'll simulate a successful booking
      
      // Generate a booking reference code
      const bookingRef = `DAL${Date.now().toString().slice(-6)}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(`Booking confirmed! Your booking reference is: ${bookingRef}`);
      
      // You could also update the bike status to 'booked' here
      // await apiService.updateBike(bike.bike_id, { status: 'booked' });
      
    } catch (err) {
      setError('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pricing = calculateTotal();

  if (!bike) {
    return (
      <>
        <Navbar />
        <div className="container max-w-2xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">No Bike Selected</h2>
          <p className="mb-4">Please select a bike from the home page to book.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Bikes
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Bikes
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Book Your Ride</h1>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-green-700">{success}</p>
              <button
                onClick={() => navigate('/customer-home')}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bike Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Selected Bike</h2>
              
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{getTypeIcon(bike.type)}</span>
                <div>
                  <h3 className="font-semibold text-lg">{bike.type}</h3>
                  <p className="text-gray-500">{bike.access_code}</p>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <span>📍</span>
                    {bike.location}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Hourly Rate:</span>
                  <span className="font-medium">${bike.hourly_rate}/hour</span>
                </div>
                {bike.discount_code && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Discount Code:</span>
                    <span className="font-medium text-green-600">{bike.discount_code} (10% off)</span>
                  </div>
                )}
              </div>

              {/* Features */}
              {bike.features && Object.keys(bike.features).length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2">Features:</h4>
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
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.startDate}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      startDate: e.target.value,
                      endDate: e.target.value // Auto-set end date to same day
                    }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={bookingForm.startTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (hours)
                    </label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(hour => (
                        <option key={hour} value={hour}>
                          {hour} hour{hour > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="font-medium mb-3">Pricing Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{pricing.hours} hour{pricing.hours > 1 ? 's' : ''} × ${bike.hourly_rate}</span>
                      <span>${pricing.subtotal}</span>
                    </div>
                    {bike.discount_code && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({bike.discount_code})</span>
                        <span>-${pricing.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>${pricing.total}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Payment will be collected in-person after your ride
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookBikePage;