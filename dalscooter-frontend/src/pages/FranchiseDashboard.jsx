"use client"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { apiService } from "../services/apiService"
import Navbar from "../components/NavBar"
import AddAvailabilityModal from '../components/AddAvailabilityModal';

import { Plus, Edit3, Trash2, Search, MapPin, DollarSign, Battery, Zap, Eye, RefreshCw } from "lucide-react"

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


  const [bikeForm, setBikeForm] = useState({
    type: "eBike",
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

  const loadBikes = async (type = "") => {
    setLoading(true)
    setError("")
    try {
      const filters = type ? { type } : {}
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
        features: getFeaturesByType(bikeForm.type),
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
        features: getFeaturesByType(bikeForm.type),
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
      type: bike.type,
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
      type: "eBike",
      access_code: "",
      hourly_rate: "",
      features: {},
      discount_code: "",
      location: "",
    })
    setEditingBike(null)
  }

  const getFeaturesByType = (type) => {
    const commonFeatures = {
      height_adjustment: bikeForm.features.height_adjustment || false,
      gps_enabled: bikeForm.features.gps_enabled || false,
    }

    switch (type) {
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

  const handleFilterChange = (type) => {
    setFilterType(type)
    loadBikes(type)
  }

  const generateAccessCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setBikeForm((prev) => ({ ...prev, access_code: `DAL${randomCode}` }))
  }

  const filteredBikes = bikes.filter(
    (bike) =>
      bike.access_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bike.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTypeIcon = (type) => {
    switch (type) {
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
        return "bg-green-100 text-green-800 border-green-200"
      case "booked":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "maintenance":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Franchise Dashboard</h1>
                <p className="text-gray-600">Manage your fleet of bikes, scooters, and segways</p>
              </div>
              <button
                onClick={() => loadBikes(filterType)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bikes</p>
                  <p className="text-2xl font-bold text-gray-900">{bikes.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bikes.filter((b) => b.status === "available").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Battery className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Use</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bikes.filter((b) => b.status === "booked").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleFilterChange("")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === ""
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({bikes.length})
                </button>
                <button
                  onClick={() => handleFilterChange("eBike")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "eBike"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🚴 eBikes ({bikes.filter((b) => b.type === "eBike").length})
                </button>
                <button
                  onClick={() => handleFilterChange("Gyroscooter")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "Gyroscooter"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🛴 Gyroscooters ({bikes.filter((b) => b.type === "Gyroscooter").length})
                </button>
                <button
                  onClick={() => handleFilterChange("Segway")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === "Segway"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🛴 Segways ({bikes.filter((b) => b.type === "Segway").length})
                </button>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bikes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(true)
                    resetForm()
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Bike
                </button>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{editingBike ? "Edit Bike" : "Add New Bike"}</h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={editingBike ? handleUpdateBike : handleAddBike} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bike Type</label>
                    <select
                      value={bikeForm.type}
                      onChange={(e) => setBikeForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="eBike">🚴 eBike</option>
                      <option value="Gyroscooter">🛴 Gyroscooter</option>
                      <option value="Segway">🛴 Segway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bikeForm.access_code}
                        onChange={(e) => setBikeForm((prev) => ({ ...prev, access_code: e.target.value }))}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="DAL123ABC"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateAccessCode}
                        className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bikeForm.hourly_rate}
                      onChange={(e) => setBikeForm((prev) => ({ ...prev, hourly_rate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="15.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={bikeForm.location}
                        onChange={(e) => setBikeForm((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Halifax Downtown"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code</label>
                    <input
                      type="text"
                      value={bikeForm.discount_code}
                      onChange={(e) => setBikeForm((prev) => ({ ...prev, discount_code: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="SUMMER20"
                    />
                  </div>
                </div>

                {/* Features Section */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Features & Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Common Features */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-700">Common Features</h5>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={bikeForm.features.height_adjustment || false}
                          onChange={(e) =>
                            setBikeForm((prev) => ({
                              ...prev,
                              features: { ...prev.features, height_adjustment: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Height Adjustment</span>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={bikeForm.features.gps_enabled || false}
                          onChange={(e) =>
                            setBikeForm((prev) => ({
                              ...prev,
                              features: { ...prev.features, gps_enabled: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">GPS Enabled</span>
                      </label>
                    </div>

                    {/* Type-specific Features */}
                    {bikeForm.type === "eBike" && (
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">eBike Features</h5>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Battery Life</label>
                          <input
                            type="text"
                            value={bikeForm.features.battery_life || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, battery_life: e.target.value },
                              }))
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="50km"
                          />
                        </div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.phone_holder || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, phone_holder: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Phone Holder</span>
                        </label>
                      </div>
                    )}

                    {bikeForm.type === "Gyroscooter" && (
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">Gyroscooter Features</h5>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Speed</label>
                          <input
                            type="text"
                            value={bikeForm.features.max_speed || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, max_speed: e.target.value },
                              }))
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="25km/h"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weight Limit</label>
                          <input
                            type="text"
                            value={bikeForm.features.weight_limit || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, weight_limit: e.target.value },
                              }))
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="120kg"
                          />
                        </div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.led_lights || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, led_lights: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">LED Lights</span>
                        </label>
                      </div>
                    )}

                    {bikeForm.type === "Segway" && (
                      <div className="space-y-4">
                        <h5 className="font-medium text-gray-700">Segway Features</h5>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.self_balancing || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, self_balancing: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Self Balancing</span>
                        </label>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Range</label>
                          <input
                            type="text"
                            value={bikeForm.features.max_range || ""}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, max_range: e.target.value },
                              }))
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="38km"
                          />
                        </div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={bikeForm.features.app_control || false}
                            onChange={(e) =>
                              setBikeForm((prev) => ({
                                ...prev,
                                features: { ...prev.features, app_control: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">App Control</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bikes Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {filterType ? `${filterType}s` : "All Bikes"}
                <span className="text-gray-500 font-normal ml-2">({filteredBikes.length})</span>
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading bikes...</p>
              </div>
            ) : filteredBikes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🚲</div>
                <p className="text-gray-500 text-lg mb-2">No bikes found</p>
                <p className="text-gray-400">
                  {searchTerm ? "Try adjusting your search terms" : "Add your first bike to get started!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredBikes.map((bike) => (
                  <div
                    key={bike.bike_id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(bike.type)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{bike.type}</h4>
                          <p className="text-sm text-gray-500">{bike.access_code}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bike.status)}`}
                      >
                        {bike.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {bike.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />${bike.hourly_rate}/hour
                      </div>
                      {bike.discount_code && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🎫 {bike.discount_code}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(bike.features || {}).map(([key, value]) => {
                          if (typeof value === "boolean" && value) {
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {key.replace(/_/g, " ")}
                              </span>
                            )
                          } else if (typeof value === "string" && value) {
                            return (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {key.replace(/_/g, " ")}: {value}
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(bike)}
                        className="flex items-center gap-1 flex-1 justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBike(bike.bike_id)}
                        disabled={loading}
                        className="flex items-center gap-1 flex-1 justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button onClick={() => {
                          setLatestScooterId(bike.bike_id);
                          setShowAvailabilityModal(true);
                        }} className="flex items-center gap-1 flex-1 justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                        <Plus className="w-4 h-4" />
                          Add Availability
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
          }}  />
      )}
    </>
  )}

export default FranchiseDashboard
