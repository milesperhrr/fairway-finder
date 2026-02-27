let userLat, userLon;
let courses = [];

function updateDistanceLabel(val) {
  document.getElementById("distanceLabel").innerText = val;
  applyFilters();
}

function getLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
      fetchCourses();
    },
    err => {
      console.error("Geolocation error:", err);
      alert("Unable to retrieve your location. Make sure location services are enabled.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

async function fetchCourses() {
  const radiusMeters = document.getElementById("distanceRange").value * 1609;
  const query = `
  [out:json];
  (
    node["leisure"="golf_course"](around:${radiusMeters},${userLat},${userLon});
    way["leisure"="golf_course"](around:${radiusMeters},${userLat},${userLon});
  );
  out center;
  `;
  const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
  const data = await response.json();
  courses = data.elements.map(el => {
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    return { name: el.tags.name || "Golf Course", lat, lon, rating: Math.random()*2+3, distance: calculateDistance(userLat,userLon,lat,lon) };
  });
  applyFilters();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * (2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function applyFilters() {
  let sorted = [...courses];
  const sortBy = document.getElementById("sortSelect").value;
  if (sortBy==="distance") sorted.sort((a,b)=>a.distance-b.distance);
  else sorted.sort((a,b)=>b.rating-a.rating);
  displayCourses(sorted);
}

function displayCourses(list) {
  const container = document.getElementById("results");
  container.innerHTML = "";
  list.forEach(course=>{
    const div = document.createElement("div");
    div.className="card";
    div.innerHTML=`
      <strong>${course.name}</strong><br>
      📍 ${course.distance.toFixed(1)} miles<br>
      ⭐ ${course.rating.toFixed(1)}<br>
      <button onclick="toggleFavorite('${course.name}')">❤️ Favorite</button>
      <button onclick="viewTeeTimes('${course.name}')">View Tee Times</button>
      <div id="frame-${course.name.replace(/\s/g,'')}"></div>
    `;
    container.appendChild(div);
  });
  loadFavorites();
}

function viewTeeTimes(name){
  if(confirm("Open tee times in a new tab?")){
    const url = `https://www.golfnow.com/tee-times/search?q=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  }
}

function toggleFavorite(name){
  let favs=JSON.parse(localStorage.getItem("favorites"))||[];
  if(favs.includes(name)) favs=favs.filter(f=>f!==name);
  else favs.push(name);
  localStorage.setItem("favorites",JSON.stringify(favs));
  loadFavorites();
}

function loadFavorites(){
  const favs=JSON.parse(localStorage.getItem("favorites"))||[];
  const container=document.getElementById("favorites");
  container.innerHTML=favs.map(f=>`<div class="card">${f}</div>`).join("");

}


