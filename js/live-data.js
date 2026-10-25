window.AapdaLiveData = (function() {
  // Cache results to avoid hammering APIs
  const cache = {};
  const CACHE_TTL = 60000; // 1 minute

  // USGS Earthquake API - real global earthquakes, filter for South Asia
  async function fetchEarthquakes() {
    // Returns real earthquakes from India region (lat 8-37, lng 68-97)
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';
    const res = await fetch(url);
    const data = await res.json();
    // Filter for India/South Asia region
    return data.features.filter(f => {
      const [lng, lat] = f.geometry.coordinates;
      return lat >= 8 && lat <= 37 && lng >= 68 && lng <= 97;
    }).map(f => ({
      id: f.id,
      magnitude: f.properties.mag,
      place: f.properties.place,
      time: new Date(f.properties.time).toLocaleString('en-IN'),
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
      type: 'earthquake',
      severity: f.properties.mag >= 5 ? 'critical' : f.properties.mag >= 4 ? 'high' : 'moderate'
    }));
  }

  // Open-Meteo API - real weather for Indian disaster zones
  async function fetchWeather(lat, lng) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,windspeed_10m,weathercode&timezone=Asia/Kolkata`;
    const res = await fetch(url);
    return await res.json();
  }

  // ReliefWeb API - real India disaster news
  async function fetchDisasterReports() {
    const url = 'https://api.reliefweb.int/v1/reports?appname=aapdasetu&filter[operator]=AND&filter[conditions][0][field]=country.iso3&filter[conditions][0][value]=IND&filter[conditions][1][field]=theme.name&filter[conditions][1][value]=Disaster%20Management&limit=5&fields[include][]=title&fields[include][]=date&fields[include][]=url&fields[include][]=body-html&sort[]=date:desc';
    const res = await fetch(url);
    const data = await res.json();
    return (data.data || []).map(r => ({
      id: r.id,
      title: r.fields.title,
      date: r.fields.date?.created ? new Date(r.fields.date.created).toLocaleDateString('en-IN') : 'Recent',
      url: r.fields.url,
      source: 'ReliefWeb / UN OCHA'
    }));
  }

  // Weather code to human description
  function weatherCodeToText(code) {
    const codes = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Slight showers', 81: 'Moderate showers', 82: 'Heavy showers',
      85: 'Slight snow shower', 86: 'Heavy snow shower',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
    };
    return codes[code] || 'Unknown';
  }

  // Fetch weather for 5 key Indian disaster zones
  async function fetchAllZoneWeather() {
    const zones = [
      { name: 'Assam (Guwahati)', lat: 26.14, lng: 91.74 },
      { name: 'Kerala (Wayanad)', lat: 11.60, lng: 76.08 },
      { name: 'Odisha (Bhubaneswar)', lat: 20.30, lng: 85.82 },
      { name: 'Himachal (Manali)', lat: 32.24, lng: 77.19 },
      { name: 'Delhi NCR', lat: 28.61, lng: 77.23 }
    ];
    const results = await Promise.allSettled(zones.map(z => fetchWeather(z.lat, z.lng)));
    return zones.map((z, i) => {
      if (results[i].status === 'fulfilled') {
        const w = results[i].value.current;
        return {
          name: z.name, lat: z.lat, lng: z.lng,
          temp: w.temperature_2m, precipitation: w.precipitation,
          windspeed: w.windspeed_10m, weatherCode: w.weathercode,
          description: weatherCodeToText(w.weathercode),
          isAlertWorthy: w.precipitation > 10 || w.windspeed_10m > 50 || w.weathercode >= 80
        };
      }
      return { name: z.name, lat: z.lat, lng: z.lng, error: true };
    });
  }

  return { fetchEarthquakes, fetchWeather, fetchAllZoneWeather, fetchDisasterReports, weatherCodeToText };
})();
