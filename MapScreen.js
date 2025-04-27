import React from 'react';
import { StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native'; // Updated import
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service'; // Ensure correct import

// Request location permissions for Android
async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location for map features.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }
}

const MapScreen = () => {
  React.useEffect(() => {
    requestLocationPermission(); // Request location permission on component mount
  }, []);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        #map {  
          height: 100%;
          width: 100%;
        }
        /* Style for the search and location bar */
        #controlsContainer {
          position: absolute;
          top: 10px;
          left: 50px;
          z-index: 1000;
          background: white;
          padding: 5px;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          gap: 5px;
          width:84%;
        }
        #locationInput {
          border: 1px solid #ccc;
          padding: 5px;
          font-size: 14px;
          width: 150px;
        }
        #searchButton, #searchMarkerButton, #liveLocationButton {
          padding: 5px 10px;
          font-size: 14px;
          cursor: pointer;
        }
        /* Modal styles */
        #modalOverlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        #modal {
          background: white;
          padding: 20px;
          border-radius: 5px;
          width: 80%;
          max-width: 300px;
        }
        #modal input {
          width: 100%;
          padding: 5px;
          margin-bottom: 10px;
          font-size: 14px;
        }
        #modal button {
          padding: 5px 10px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div id="controlsContainer">
        <div style="display: flex; gap: 5px;">
          <input type="text" id="locationInput" placeholder="Enter location or marker name" />
          <button id="searchButton">Search Location</button>
          <!-- NEW CODE: Button to search marker by name -->
          <button id="searchMarkerButton">Search Marker</button>
        </div>
        <!-- NEW CODE: Button for live location tracking -->
        <!-- <button id="liveLocationButton">Live Location</button> -->
      </div>
      <div id="map"></div>

      <!-- Modal for adding marker with name -->
      <div id="modalOverlay">
        <div id="modal">
          <h3>Add Marker</h3>
          <label>Latitude:</label>
          <input type="text" id="modalLat" readonly />
          <label>Longitude:</label>
          <input type="text" id="modalLon" readonly />
          <label>Name:</label>
          <input type="text" id="markerName" placeholder="Enter name" />
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancelButton">Cancel</button>
            <button id="saveButton">Save</button>
          </div>
        </div>
      </div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        // Initialize the map centered on Paris by default
        var map = L.map('map').setView([28.36131, 75.59212], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        }).addTo(map);

        var marker; // For search and locate features
        var liveLocationMarker; // NEW CODE: Marker for live location

        // EXTRA CODE: Function to load all markers from your backend API
        function loadMarkers() {
          fetch('http://192.168.183.172:3000/api/markers')  // Adjust URL based on your environment
            .then(response => response.json())
            .then(data => {
              data.forEach(function(item) {
                L.marker([item.lat, item.lon])
                  .addTo(map)
                  .bindPopup('<b>' + item.name + '</b><br/>Was here at - <small>' + item.createdAt + '</small>');
              });
            })
            .catch(error => {
              console.error('Error loading markers:', error);
            });
        }

        // Call loadMarkers on initialization
        loadMarkers();

        // Search location function (geocoding via Nominatim)
        function searchLocation() {
          var query = document.getElementById('locationInput').value;
          if (!query) return;
          fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query))
            .then(response => response.json())
            .then(data => {
              if (data && data.length > 0) {
                var result = data[0];
                var lat = parseFloat(result.lat);
                var lon = parseFloat(result.lon);
                map.setView([lat, lon], 13);
                if (marker) {
                  marker.setLatLng([lat, lon]);
                } else {
                  marker = L.marker([lat, lon]).addTo(map);
                }
              } else {
                alert('Location not found');
              }
            })
            .catch(err => {
              console.error(err);
              alert('Error fetching location data');
            });
        }

        // NEW CODE: Function to search markers by name from the backend
        function searchMarkerByName() {
          var query = document.getElementById('locationInput').value.trim().toLowerCase();
          if (!query) {
            alert('Please enter a marker name to search for');
            return;
          }
          // Fetch all markers and filter by name
          fetch('http://192.168.183.172:3000/api/markers')
            .then(response => response.json())
            .then(data => {
              var matchingMarkers = data.filter(function(item) {
                return item.name.toLowerCase().includes(query);
              });
              if (matchingMarkers.length === 0) {
                alert('No markers found with that name');
              } else {
                var first = matchingMarkers[0];
                map.setView([first.lat, first.lon], 13);
                matchingMarkers.forEach(function(item) {
                  L.marker([item.lat, item.lon]).addTo(map)
                    .bindPopup('<b>' + item.name + '</b>').openPopup();
                });
              }
            })
            .catch(error => {
              console.error('Error searching markers:', error);
            });
        }

        // Updated liveLocation function using react-native-geolocation-service
        function liveLocation() {
          if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
          }
          navigator.geolocation.watchPosition(
            function (position) {
              var lat = position.coords.latitude;
              var lon = position.coords.longitude;
              // Update or create the live location marker
              if (liveLocationMarker) {
                liveLocationMarker.setLatLng([lat, lon]);
              } else {
                liveLocationMarker = L.marker([lat, lon])
                  .addTo(map)
                  .bindPopup("You are here")
                  .openPopup();
              }
              // Center the map on the current position
              map.setView([lat, lon], 13);
            },
            function (error) {
              alert("Error obtaining live location: " + error.message);
            },
            {
              enableHighAccuracy: true, // Use GPS for better accuracy
              timeout: 10000, // Timeout after 10 seconds
              maximumAge: 0, // Do not use cached location
            }
          );
        }

        // Updated locateMe function using react-native-geolocation-service
        function locateMe() {
          if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            function (position) {
              var lat = position.coords.latitude;
              var lon = position.coords.longitude;
              map.setView([lat, lon], 13);
              if (marker) {
                marker.setLatLng([lat, lon]);
              } else {
                marker = L.marker([lat, lon]).addTo(map);
              }
            },
            function (error) {
              alert('Error obtaining location: ' + error.message);
            },
            {
              enableHighAccuracy: true, // Use GPS for better accuracy
              timeout: 10000, // Timeout after 10 seconds
              maximumAge: 0, // Do not use cached location
            }
          );
        }

        // Modal elements
        var modalOverlay = document.getElementById('modalOverlay');
        var modalLat = document.getElementById('modalLat');
        var modalLon = document.getElementById('modalLon');
        var markerNameInput = document.getElementById('markerName');

        // Function to show the modal with latitude and longitude
        function showModal(lat, lon) {
          modalLat.value = lat.toFixed(5);
          modalLon.value = lon.toFixed(5);
          markerNameInput.value = '';
          modalOverlay.style.display = 'flex';
        }

        // Function to hide the modal
        function hideModal() {
          modalOverlay.style.display = 'none';
        }

        // Handle saving the marker from the modal form
        document.getElementById('saveButton').addEventListener('click', function() {
          var name = markerNameInput.value.trim();
          if (!name) {
            alert('Please enter a name for the marker');
            return;
          }
          var lat = parseFloat(modalLat.value);
          var lon = parseFloat(modalLon.value);
          L.marker([lat, lon]).addTo(map)
            .bindPopup('<b>' + name + '</b>').openPopup();

          fetch('http://192.168.183.172:3000/api/markers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, lat: lat, lon: lon })
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => {
            alert('Marker saved.');
          })
          .catch(error => {
            alert('Error saving marker:', error);
          });
          hideModal();
        });

        document.getElementById('cancelButton').addEventListener('click', hideModal);

        // Event listeners for buttons
        document.getElementById('searchButton').addEventListener('click', searchLocation);
        document.getElementById('searchMarkerButton').addEventListener('click', searchMarkerByName);
        // NEW CODE: Event listener for live location tracking button
        //document.getElementById('liveLocationButton').addEventListener('click', liveLocation);
        document.getElementById('locationInput').addEventListener('keyup', function(e) {
          if (e.key === 'Enter') {
            searchLocation();
          }
        });

        // Long press event using "contextmenu" event as a proxy for long press
        map.on('contextmenu', function(e) {
          showModal(e.latlng.lat, e.latlng.lng);
        });
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={styles.map}
      geolocationEnabled={true} // Enable geolocation
      mixedContentMode="always" // Allow mixed content (HTTP and HTTPS)
      allowFileAccess={true} // Allow file access for local resources
    />
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapScreen;