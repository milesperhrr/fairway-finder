let userLat = null;
let userLon = null;

// Example courses
const courses = [
  { name: "Sunset Hills", rating: 4.7, lat: 37.7749, lon: -122.4194 },
  { name: "Green Valley", rating: 4.2, lat: 37.8044, lon: -122.2712 },
  { name: "Eagle Ridge", rating: 4.9, lat: 37.6879, lon: -122.4702 }
];

// Favorites
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

// ============================
// Set location from city/address
// ============================
async function setLocation() {
  const location = document.getElementById("locationInput").value;
  if (!location) {
    alert("Please enter a city or address.");
    return;
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      alert("Location not found. Try a different city or address.");
      return;
    }

    userLat = parseFloat(data[0].lat);
    userLon = parseFloat(data[0].lon);

    fetchCourses();
  } catch (err) {
    console.error("Geocoding error:", err);
    alert("Error fetching location. Try again later.");
  }
}

// ============================
// Distance calculation
// ============================
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos((lat1 * Math.PI)/180) *
    Math.cos((lat2 * Math.PI)/180) *
    Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============================
// Render courses
// ============================
function fetchCourses() {
  const container = document.getElementById("courses");
  container.innerHTML = "";

  if (!userLat || !userLon) {
    container.innerHTML = "<p>Enter a city or address to see nearby courses.</p>";
    return;
  }

  const maxDistance = parseFloat(document.getElementById("distanceSlider").value);

  let filtered = courses
    .map(c => ({ ...c, distance: distance(userLat, userLon, c.lat, c.lon) }))
    .filter(c => c.distance <= maxDistance);

  const sortBy = document.getElementById("sortSelect").value;
  if (sortBy === "distance") filtered.sort((a,b) => a.distance - b.distance);
  if (sortBy === "rating") filtered.sort((a,b) => b.rating - a.rating);

  filtered.forEach(c => {
    const div = document.createElement("div");
    div.className = "course";
    div.innerHTML = `
      <h3>${c.name}</h3>
      <p>Rating: ${c.rating} ⭐</p>
      <p>Distance: ${c.distance.toFixed(2)} km</p>
      <button onclick="viewTeeTimes('${c.name}')">View Tee Times</button>
      <button onclick="toggleFavorite('${c.name}')">
        ${favorites.includes(c.name) ? "❤️" : "🤍"} Favorite
      </button>
    `;
    container.appendChild(div);
  });
}

// ============================
// Open Tee Times in new tab
// ============================
function viewTeeTimes(name) {
  const url = `https://www.golfnow.com/tee-times/search?q=${encodeURIComponent(name)}`;
  window.open(url, "_blank");
}

// ============================
// Toggle favorites
// ============================
function toggleFavorite(name) {
  if (favorites.includes(name)) {
    favorites = favorites.filter(f => f !== name);
  } else {
    favorites.push(name);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  fetchCourses();
}

// ============================
// Event listeners
// ============================
document.getElementById("distanceSlider").addEventListener("input", fetchCourses);
document.getElementById("sortSelect").addEventListener("change", fetchCourses);