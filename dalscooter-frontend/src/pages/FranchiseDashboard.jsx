"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiService } from "../services/apiService"
import Navbar from "../components/NavBar"
import AddAvailabilityModal from '../components/AddAvailabilityModal';
import ViewAvailabilityModal from '../components/ViewAvailabilityModal';
import { Plus, Edit3, Trash2, Search, MapPin, DollarSign, Battery, Zap, Eye, RefreshCw, Calendar } from "lucide-react"
import '../styles/FranchiseDashboard.css';

function FranchiseDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBike, setEditingBike] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [filterType, setFilterType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [latestScooterId, setLatestScooterId] = useState('');
  const [showViewAvailabilityModal, setShowViewAvailabilityModal] = useState(false)
  const [selectedBikeId, setSelectedBikeId] = useState('')

  const [bikeForm, setBikeForm] = useState({
    bike_type: "eBike",
    access_code: "",
    hourly_rate: "",
    features: {},
    discount_code: "",
    location: "",
  })

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }
    loadBikes()
  }, [user, navigate])

  const loadBikes = async (bikeType = "") => {
    setLoading(true)
    setError("")
    try {
      const filters = bikeType ? { bike_type: bikeType } : {}
      const data = await apiService.getBikes(filters)
      console.log("Fetched bikes from API:", data);
      setBikes(data.bikes || [])
    } catch (err) {
      setError("Error loading bikes: " + err.message)
    }
    setLoading(false)
  }

  const handleAddBike = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const bikeData = {
        ...bikeForm,
        hourly_rate: Number.parseFloat(bikeForm.hourly_rate),
        features: getFeaturesByType(bikeForm.bike_type),
      }

      await apiService.createBike(bikeData)
      
      setSuccess("Bike created successfully!")
      setShowAddForm(false)
      resetForm()
      loadBikes(filterType)
    } catch (err) {
      setError("Error creating bike: " + err.message)
    }
    setLoading(false)
  }

  const handleUpdateBike = async (e) => {
    e.preventDefault()
    if (!editingBike) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const updateData = {
        ...bikeForm,
        hourly_rate: Number.parseFloat(bikeForm.hourly_rate),
        features: getFeaturesByType(bikeForm.bike_type),
      }

      await apiService.updateBike(editingBike.bike_id, updateData)
      setSuccess("Bike updated successfully!")
      setEditingBike(null)
      resetForm()
      loadBikes(filterType)
    } catch (err) {
      setError("Error updating bike: " + err.message)
    }
    setLoading(false)
  }

  const handleDeleteBike = async (bikeId) => {
    if (!window.confirm("Are you sure you want to delete this bike?")) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await apiService.deleteBike(bikeId)
      setSuccess("Bike deleted successfully!")
      loadBikes(filterType)
    } catch (err) {
      setError("Error deleting bike: " + err.message)
    }
    setLoading(false)
  }

  const startEditing = (bike) => {
    setEditingBike(bike)
    setBikeForm({
      bike_type: bike.bike_type,
      access_code: bike.access_code,
      hourly_rate: bike.hourly_rate.toString(),
      features: bike.features || {},
      discount_code: bike.discount_code || "",
      location: bike.location || "",
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setBikeForm({
      bike_type: "eBike",
      access_code: "",
      hourly_rate: "",
      features: {},
      discount_code: "",
      location: "",
    })
    setEditingBike(null)
  }

  const getFeaturesByType = (bikeType) => {
    const commonFeatures = {
      height_adjustment: bikeForm.features.height_adjustment || false,
      gps_enabled: bikeForm.features.gps_enabled || false,
    }

    switch (bikeType) {
      case "eBike":
        return {
          ...commonFeatures,
          battery_life: bikeForm.features.battery_life || "",
          phone_holder: bikeForm.features.phone_holder || false,
        }
      case "Gyroscooter":
        return {
          ...commonFeatures,
          max_speed: bikeForm.features.max_speed || "",
          weight_limit: bikeForm.features.weight_limit || "",
          led_lights: bikeForm.features.led_lights || false,
        }
      case "Segway":
        return {
          ...commonFeatures,
          self_balancing: bikeForm.features.self_balancing || false,
          max_range: bikeForm.features.max_range || "",
          app_control: bikeForm.features.app_control || false,
        }
      default:
        return commonFeatures
    }
  }

  const handleFilterChange = (bikeType) => {
    setFilterType(bikeType)
    loadBikes(bikeType)
  }

  const generateAccessCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setBikeForm((prev) => ({ ...prev, access_code: `DAL${randomCode}` }))
  }

  const filteredBikes = bikes.filter(
    (bike) =>
      bike.access_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.bike_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTypeIcon = (bikeType) => {
    switch (bikeType) {
      case "eBike":
        return "🚴"
      case "Gyroscooter":
        return "🛴"
      case "Segway":
        return "🛴"
      default:
        return "🚲"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bike-card-status available"
      case "booked":
        return "bike-card-status booked"
      case "maintenance":
        return "bike-card-status maintenance"
      default:
        return "bike-card-status"
    }
  }

  return (
    <>
      <Navbar />
      <div className="franchise-container">
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="header-title">Franchise Dashboard</h1>
                <p className="header-subtitle">Manage your fleet of bikes, scooters, and segways</p>
              </div>
              <button
                onClick={() => loadBikes(filterType)}
                className="refresh-button"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert-error">
              <div className="flex">
                <div className="ml-3">
                  <p className="alert-error-text">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="alert-success">
              <div className="flex">
                <div className="ml-3">
                  <p className="alert-success-text">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stats-card">
              <div className="flex items-center">
                <div className="stats-icon blue">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="stats-content">
                  <p className="stats-label">Total Bikes</p>
                  <p className="stats-value">{bikes.length}</p>
                </div>
              </div>
            </div>

            <div className="stats-card">
              <div className="flex items-center">
                <div className="stats-icon green">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="stats-content">
                  <p className="stats-label">Available</p>
                  <p className="stats-value">
                    {bikes.filter((b) => b.status === "available").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="stats-card">
              <div className="flex items-center">
                <div className="stats-icon yellow">
                  <Battery className="w-6 h-6" />
                </div>
                <div className="stats-content">
                  <p className="stats-label">In Use</p>
                  <p className="stats-value">
                    {bikes.filter((b) => b.status === "booked").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="stats-card">
              <div className="flex items-center">
                <div className="stats-icon red">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="stats-content">
                  <p className="stats-label">Avg. Rate</p>
                  <p className="stats-value">
                    $
                    {bikes.length > 0
                      ? (bikes.reduce((sum, b) => sum + b.hourly_rate, 0) / bikes.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="controls">
            <div className="controls-inner">
              <div className="filter-group">
                <button
                  onClick={() => handleFilterChange("")}
                  className={`filter-button ${filterType === "" ? "active" : "inactive"}`}
                >
                  All ({bikes.length})
                </button>
                <button
                  onClick={() => handleFilterChange("eBike")}
                  className={`filter-button ${filterType === "eBike" ? "active" : "inactive"}`}
                >
                  🚴 eBikes ({bikes.filter((b) => b.bike_type === "eBike").length})
                </button>
                <button
                  onClick={() => handleFilterChange("Gyroscooter")}
                  className={`filter-button ${filterType === "Gyroscooter" ? "active" : "inactive"}`}
                >
                  🛴 Gyroscooters ({bikes.filter((b) => b.bike_type === "Gyroscooter").length})
                </button>
                <button
                  onClick={() => handleFilterChange("Segway")}
                  className={`filter-button ${filterType === "Segway" ? "active" : "inactive"}`}
                >
                  🛴 Segways ({bikes.filter((b) => b.bike_type === "Segway").length})
                </button>
              </div>

              <div className="search-group">
                <div className="search-container">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search bikes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(true)
                    resetForm()
                  }}
                  className="add-button"
                >
                  <Plus className="w-4 h-4" />
                  Add Bike
                </button>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="form-container">
              <div className="form-header">
                <h3 className="form-title">{editingBike ? "Edit Bike" : "Add New Bike"}</h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="form-close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={editingBike ? handleUpdateBike : handleAddBike} className="form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Bike Type</label>
                    <select
                      value={bikeForm.bike_type}
                      onChange={(e) => setBikeForm((prev) => ({ ...prev, bike_type: e.target.value }))}
                      className="form-select"
                      required
                    >
                      <option value="eBike">🚴 eBike</option>
                      <option value="Gyroscooter">🛴 Gyroscooter</option>
                      <option value="Segway">🛴 Segway</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Access Code</label>
                    <div className="form-access-code">
                      <input
                        type="text"
                        value={bikeForm.access_code}
                        onChange={(e) => setBikeForm((prev) => ({ ...prev, access_code: e.target.value }))}
                        className="form-input"
                        placeholder="DAL123ABC"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateAccessCode}
                        className="form-generate-button"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hourly Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bikeForm.hourly_rate}
                      onChange={(e) => setBikeForm((prev) => ({ ...prev, hourly_rate: e.target.value }))}
                      className="form-input"
                      placeholder="15.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <div className="form-location-container">
                      <MapPin className="form-location-icon" />
                      <input
                        type="text"
                        value={bikeForm.location}
                        onChange={(e) => setBikeForm((prev) => ({ ...prev, location: e.target.value }))}
                        className="form-input form-location-input"
                        placeholder="Halifax Downtown"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Discount Code</label>
                    <input
                      type="text"
                      value={bikeForm.discount_code}
                      onChange={(e) => setBikeForm((prev) => ({ ...prev, discount_code: e.target.value }))}
                      className="form-input"
                      placeholder="SUMMER20"
                    />
                  </div>
                </div>

                {/* Features Section */}
                <div className="form-features-section">
                  <h4 className="form-features-title">Features & Specifications</h4>
                  <div className="form-features-grid">
                    {/* Common Features */}
                    <div className="form-features-group">
                      <h5 className="form-features-subtitle">Common Features</h5>
                      <label className="form-checkbox">
                        <input
                          type="checkbox"
                          checked={bikeForm.features.height_adjustment || false}
                          onChange={(e) =>
                            setBikeForm((prev) => ({
                              ...prev,
                              features: { ...prev.features, height_adjustment: e.target.checked },
                            }))
                          }
                        />
                        <span>Height Adjustment</span>
                      </label>
                      <label className="form-checkbox">
                        <input
                          type="checkbox"
                          checked={bikeForm.features.gps_enabled || false}
                          onChange={(e) =>
                            setBikeForm((prev) => ({
                              ...prev,
                              features: { ...prev.features, gps_enabled: e.target.checked },
                            }))
                          }
                        />
                        <span>GPS Enabled</span>
                      </label>
                    </div>

                    {/* Type-specific Features */}
                    {bikeForm.bike_type === "eBike" && (
                      <div className="form-features-group">
                        <h5 className="form-features-subtitle">eBike Features</h5>
                        <div>
                          <label className="form-label">Battery Life</label>
                          <input
                            type="text"
                            value={bikeForm.features.battery_life || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, battery_life: e.target.value },
                              }))
                            }
                            className="form-input"
                            placeholder="50km"
                          />
                        </div>
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.phone_holder || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, phone_holder: e.target.checked },
                              }))
                            }
                          />
                          <span>Phone Holder</span>
                        </label>
                      </div>
                    )}

                    {bikeForm.bike_type === "Gyroscooter" && (
                      <div className="form-features-group">
                        <h5 className="form-features-subtitle">Gyroscooter Features</h5>
                        <div>
                          <label className="form-label">Max Speed</label>
                          <input
                            type="text"
                            value={bikeForm.features.max_speed || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, max_speed: e.target.value },
                              }))
                            }
                            className="form-input"
                            placeholder="25km/h"
                          />
                        </div>
                        <div>
                          <label className="form-label">Weight Limit</label>
                          <input
                            type="text"
                            value={bikeForm.features.weight_limit || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, weight_limit: e.target.value },
                              }))
                            }
                            className="form-input"
                            placeholder="120kg"
                          />
                        </div>
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.led_lights || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, led_lights: e.target.checked },
                              }))
                            }
                          />
                          <span>LED Lights</span>
                        </label>
                      </div>
                    )}

                    {bikeForm.bike_type === "Segway" && (
                      <div className="form-features-group">
                        <h5 className="form-features-subtitle">Segway Features</h5>
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.self_balancing || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, self_balancing: e.target.checked },
                              }))
                            }
                          />
                          <span>Self Balancing</span>
                        </label>
                        <div>
                          <label className="form-label">Max Range</label>
                          <input
                            type="text"
                            value={bikeForm.features.max_range || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, max_range: e.target.value },
                              }))
                            }
                            className="form-input"
                            placeholder="38km"
                          />
                        </div>
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.app_control || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, app_control: e.target.checked },
                              }))
                            }
                          />
                          <span>App Control</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-buttons">
                  <button
                    type="submit"
                    disabled={loading}
                    className="form-submit-button"
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      <>{editingBike ? "Update Bike" : "Add Bike"}</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}
                    className="form-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bikes Grid */}
          <div className="bikes-grid-container">
            <div className="bikes-grid-header">
              <h3 className="bikes-grid-title">
                {filterType ? `${filterType}s` : "All Bikes"}
                <span className="bikes-grid-count">({filteredBikes.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading bikes...</p>
              </div>
            ) : filteredBikes.length === 0 ? (
              <div className="empty-container">
                <div className="empty-icon">🚲</div>
                <p className="empty-text">No bikes found</p>
                <p className="empty-subtext">
                  {searchTerm ? "Try adjusting your search terms" : "Add your first bike to get started!"}
                </p>
              </div>
            ) : (
              <div className="bikes-grid">
                {filteredBikes.map((bike) => (
                  <div
                    key={bike.bike_id}
                    className="bike-card"
                  >
                    <div className="bike-card-header">
                      <div className="flex items-center gap-3">
                        <span className="bike-card-icon">{getTypeIcon(bike.bike_type)}</span>
                        <div>
                          <h4 className="bike-card-title">{bike.bike_type}</h4>
                          <p className="bike-card-code">{bike.access_code}</p>
                        </div>
                      </div>
                      <span className={getStatusColor(bike.status)}>
                        {bike.status}
                      </span>
                    </div>

                    <div className="bike-card-details">
                      <div className="bike-card-detail">
                        <MapPin className="w-4 h-4" />
                        {bike.location}
                      </div>
                      <div className="bike-card-detail">
                        <DollarSign className="w-4 h-4" />${bike.hourly_rate}/hour
                      </div>
                      {bike.discount_code && (
                        <div className="bike-card-discount">
                          🎫 {bike.discount_code}
                        </div>
                      )}
                    </div>

                    <div className="bike-card-features">
                      {Object.entries(bike.features || {}).map(([key, value]) => {
                        if (typeof value === "boolean" && value) {
                          return (
                            <span
                              key={key}
                              className="bike-card-feature boolean"
                            >
                              {key.replace(/_/g, " ")}
                            </span>
                          )
                        } else if (typeof value === "string" && value) {
                          return (
                            <span
                              key={key}
                              className="bike-card-feature string"
                            >
                              {key.replace(/_/g, " ")}: {value}
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <div className="bike-card-actions">
                      <button
                        onClick={() => startEditing(bike)}
                        className="bike-card-button edit"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBike(bike.bike_id)}
                        disabled={loading}
                        className="bike-card-button delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setLatestScooterId(bike.bike_id);
                          setShowAvailabilityModal(true);
                        }}
                        className="bike-card-button add-availability"
                      >
                        <Plus className="w-4 h-4" />
                        Add Availability
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBikeId(bike.bike_id);
                          setShowViewAvailabilityModal(true);
                        }}
                        className="bike-card-button view-slots"
                      >
                        <Calendar className="w-4 h-4" />
                        View Slots
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {showAvailabilityModal && (
        <AddAvailabilityModal
          bikeId={latestScooterId}
          onClose={() => setShowAvailabilityModal(false)}
          onSuccess={() => {
            setShowAvailabilityModal(false);
            loadBikes(filterType);
          }}
        />
      )}
      {showViewAvailabilityModal && (
        <ViewAvailabilityModal
          bikeId={selectedBikeId}
          onClose={() => setShowViewAvailabilityModal(false)}
        />
      )}
    </>
  )
}

export default FranchiseDashboard